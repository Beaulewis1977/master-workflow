use std::env;

use anyhow::Result;
use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts},
    http::{request::Parts, StatusCode},
    RequestPartsExt,
};
use axum_extra::{
    headers::{authorization::Bearer, Authorization},
    TypedHeader,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{error::AppError, services::Services};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: Uuid,       // Subject (user ID)
    pub email: String,   // User email
    pub exp: i64,        // Expiration time
    pub iat: i64,        // Issued at
    pub iss: String,     // Issuer
}

impl Claims {
    pub fn new(user_id: Uuid, email: String) -> Self {
        let now = Utc::now();
        let exp = now + Duration::hours(24); // 24 hour expiration

        Self {
            sub: user_id,
            email,
            exp: exp.timestamp(),
            iat: now.timestamp(),
            iss: "{{projectName}}-backend".to_string(),
        }
    }
}

// JWT token management
pub fn create_token(claims: &Claims) -> Result<String> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let encoding_key = EncodingKey::from_secret(secret.as_ref());
    
    encode(&Header::default(), claims, &encoding_key)
        .map_err(|e| anyhow::anyhow!("Failed to create token: {}", e))
}

pub fn verify_token(token: &str) -> Result<Claims> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "your-secret-key".to_string());
    let decoding_key = DecodingKey::from_secret(secret.as_ref());
    
    decode::<Claims>(token, &decoding_key, &Validation::default())
        .map(|data| data.claims)
        .map_err(|e| anyhow::anyhow!("Failed to verify token: {}", e))
}

// Supabase integration
pub struct SupabaseUser {
    pub id: Uuid,
    pub email: String,
    pub email_verified: bool,
    pub user_metadata: serde_json::Value,
    pub app_metadata: serde_json::Value,
}

pub async fn verify_supabase_token(token: &str) -> Result<SupabaseUser> {
    let supabase_url = env::var("SUPABASE_URL")?;
    let supabase_service_key = env::var("SUPABASE_SERVICE_ROLE_KEY")?;
    
    let client = reqwest::Client::new();
    let response = client
        .get(&format!("{}/auth/v1/user", supabase_url))
        .header("Authorization", format!("Bearer {}", token))
        .header("apikey", &supabase_service_key)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(anyhow::anyhow!("Invalid Supabase token"));
    }

    #[derive(Deserialize)]
    struct SupabaseResponse {
        id: String,
        email: String,
        email_confirmed_at: Option<String>,
        user_metadata: serde_json::Value,
        app_metadata: serde_json::Value,
    }

    let supabase_resp: SupabaseResponse = response.json().await?;
    let user_id = Uuid::parse_str(&supabase_resp.id)?;

    Ok(SupabaseUser {
        id: user_id,
        email: supabase_resp.email,
        email_verified: supabase_resp.email_confirmed_at.is_some(),
        user_metadata: supabase_resp.user_metadata,
        app_metadata: supabase_resp.app_metadata,
    })
}

// Auth extractor for protected routes
pub struct AuthUser {
    pub user_id: Uuid,
    pub email: String,
    pub claims: Claims,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    Services: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let services = Services::from_ref(state);
        
        // Extract authorization header
        let TypedHeader(Authorization(bearer)) = parts
            .extract::<TypedHeader<Authorization<Bearer>>>()
            .await
            .map_err(|_| AppError::Unauthorized("Missing authorization header".to_string()))?;

        let token = bearer.token();

        // First try to verify as our JWT token
        if let Ok(claims) = verify_token(token) {
            // Verify user still exists in our database
            let user = services
                .database
                .get_user_by_id(&claims.sub)
                .await
                .map_err(|_| AppError::InternalServer("Database error".to_string()))?
                .ok_or_else(|| AppError::Unauthorized("User not found".to_string()))?;

            return Ok(AuthUser {
                user_id: claims.sub,
                email: claims.email.clone(),
                claims,
            });
        }

        // If JWT verification fails, try Supabase token
        match verify_supabase_token(token).await {
            Ok(supabase_user) => {
                // Check if user exists in our database, create if not
                let user = match services.database.get_user_by_id(&supabase_user.id).await {
                    Ok(Some(user)) => user,
                    Ok(None) => {
                        // Create user from Supabase data
                        let create_user = crate::models::CreateUser {
                            id: supabase_user.id,
                            email: supabase_user.email.clone(),
                            username: supabase_user.user_metadata
                                .get("username")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string()),
                            full_name: supabase_user.user_metadata
                                .get("full_name")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string()),
                            avatar_url: supabase_user.user_metadata
                                .get("avatar_url")
                                .and_then(|v| v.as_str())
                                .map(|s| s.to_string()),
                            bio: None,
                        };

                        services
                            .database
                            .create_user(&create_user)
                            .await
                            .map_err(|_| AppError::InternalServer("Failed to create user".to_string()))?
                    }
                    Err(_) => {
                        return Err(AppError::InternalServer("Database error".to_string()));
                    }
                };

                let claims = Claims::new(user.id, user.email.clone());

                Ok(AuthUser {
                    user_id: user.id,
                    email: user.email,
                    claims,
                })
            }
            Err(_) => Err(AppError::Unauthorized("Invalid token".to_string())),
        }
    }
}

// Optional auth extractor for routes that work with or without auth
pub struct OptionalAuthUser(pub Option<AuthUser>);

#[async_trait]
impl<S> FromRequestParts<S> for OptionalAuthUser
where
    Services: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        match AuthUser::from_request_parts(parts, state).await {
            Ok(auth_user) => Ok(OptionalAuthUser(Some(auth_user))),
            Err(_) => Ok(OptionalAuthUser(None)),
        }
    }
}

// Role-based access control (if needed)
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Role {
    User,
    Admin,
    Moderator,
}

impl Role {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "user" => Some(Role::User),
            "admin" => Some(Role::Admin),
            "moderator" => Some(Role::Moderator),
            _ => None,
        }
    }
}

pub struct AuthUserWithRole {
    pub user: AuthUser,
    pub role: Role,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUserWithRole
where
    Services: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let auth_user = AuthUser::from_request_parts(parts, state).await?;
        
        // Get user role from database or JWT claims
        // For now, default to User role
        let role = Role::User;

        Ok(AuthUserWithRole {
            user: auth_user,
            role,
        })
    }
}

// Helper function to require specific role
pub fn require_role(required_role: Role) -> impl Fn(AuthUserWithRole) -> Result<AuthUserWithRole, AppError> {
    move |auth_user_with_role: AuthUserWithRole| {
        if auth_user_with_role.role == required_role || auth_user_with_role.role == Role::Admin {
            Ok(auth_user_with_role)
        } else {
            Err(AppError::Forbidden("Insufficient permissions".to_string()))
        }
    }
}
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

use crate::models::ErrorResponse;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: {0}")]
    Forbidden(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Unprocessable entity: {0}")]
    UnprocessableEntity(String),

    #[error("Too many requests: {0}")]
    TooManyRequests(String),

    #[error("Internal server error: {0}")]
    InternalServer(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),

    #[error("Validation error: {0}")]
    Validation(#[from] validator::ValidationErrors),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jsonwebtoken::errors::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Parse error: {0}")]
    Parse(#[from] uuid::Error),

    #[error("Generic error: {0}")]
    Generic(#[from] anyhow::Error),
}

impl AppError {
    fn status_code(&self) -> StatusCode {
        match self {
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            AppError::Forbidden(_) => StatusCode::FORBIDDEN,
            AppError::NotFound(_) => StatusCode::NOT_FOUND,
            AppError::Conflict(_) => StatusCode::CONFLICT,
            AppError::UnprocessableEntity(_) | AppError::Validation(_) => {
                StatusCode::UNPROCESSABLE_ENTITY
            }
            AppError::TooManyRequests(_) => StatusCode::TOO_MANY_REQUESTS,
            AppError::InternalServer(_)
            | AppError::Database(_)
            | AppError::Redis(_)
            | AppError::Json(_)
            | AppError::Io(_)
            | AppError::Jwt(_)
            | AppError::Http(_)
            | AppError::Parse(_)
            | AppError::Generic(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_code(&self) -> &'static str {
        match self {
            AppError::BadRequest(_) => "BAD_REQUEST",
            AppError::Unauthorized(_) => "UNAUTHORIZED",
            AppError::Forbidden(_) => "FORBIDDEN",
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::Conflict(_) => "CONFLICT",
            AppError::UnprocessableEntity(_) => "UNPROCESSABLE_ENTITY",
            AppError::Validation(_) => "VALIDATION_ERROR",
            AppError::TooManyRequests(_) => "TOO_MANY_REQUESTS",
            AppError::InternalServer(_) => "INTERNAL_SERVER_ERROR",
            AppError::Database(_) => "DATABASE_ERROR",
            AppError::Redis(_) => "REDIS_ERROR",
            AppError::Json(_) => "JSON_ERROR",
            AppError::Io(_) => "IO_ERROR",
            AppError::Jwt(_) => "JWT_ERROR",
            AppError::Http(_) => "HTTP_ERROR",
            AppError::Parse(_) => "PARSE_ERROR",
            AppError::Generic(_) => "GENERIC_ERROR",
        }
    }

    fn user_message(&self) -> String {
        match self {
            AppError::BadRequest(msg) => msg.clone(),
            AppError::Unauthorized(_) => "Authentication required".to_string(),
            AppError::Forbidden(_) => "Access denied".to_string(),
            AppError::NotFound(msg) => msg.clone(),
            AppError::Conflict(msg) => msg.clone(),
            AppError::UnprocessableEntity(msg) => msg.clone(),
            AppError::TooManyRequests(_) => "Too many requests. Please try again later".to_string(),
            AppError::Validation(_) => "Validation failed".to_string(),
            _ => "An internal error occurred".to_string(),
        }
    }

    fn details(&self) -> Option<serde_json::Value> {
        match self {
            AppError::Validation(errors) => {
                let mut error_map = std::collections::HashMap::new();
                
                for (field, field_errors) in errors.field_errors() {
                    let messages: Vec<String> = field_errors
                        .iter()
                        .filter_map(|e| e.message.as_ref().map(|m| m.to_string()))
                        .collect();
                    error_map.insert(field.to_string(), messages);
                }
                
                Some(json!(error_map))
            }
            _ => None,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status_code = self.status_code();
        
        // Log internal errors
        if status_code.is_server_error() {
            tracing::error!("Internal error: {:?}", self);
        } else {
            tracing::warn!("Client error: {:?}", self);
        }

        let error_response = ErrorResponse {
            message: self.user_message(),
            code: Some(self.error_code().to_string()),
            details: self.details(),
            success: false,
        };

        (status_code, Json(error_response)).into_response()
    }
}

// Helper type for results
pub type AppResult<T> = Result<T, AppError>;

// Helper functions for common errors
impl AppError {
    pub fn bad_request<T: ToString>(msg: T) -> Self {
        Self::BadRequest(msg.to_string())
    }

    pub fn unauthorized<T: ToString>(msg: T) -> Self {
        Self::Unauthorized(msg.to_string())
    }

    pub fn forbidden<T: ToString>(msg: T) -> Self {
        Self::Forbidden(msg.to_string())
    }

    pub fn not_found<T: ToString>(msg: T) -> Self {
        Self::NotFound(msg.to_string())
    }

    pub fn conflict<T: ToString>(msg: T) -> Self {
        Self::Conflict(msg.to_string())
    }

    pub fn unprocessable<T: ToString>(msg: T) -> Self {
        Self::UnprocessableEntity(msg.to_string())
    }

    pub fn internal<T: ToString>(msg: T) -> Self {
        Self::InternalServer(msg.to_string())
    }

    pub fn too_many_requests<T: ToString>(msg: T) -> Self {
        Self::TooManyRequests(msg.to_string())
    }
}

// Convert validation errors to our error type
impl From<validator::ValidationErrors> for AppError {
    fn from(errors: validator::ValidationErrors) -> Self {
        AppError::Validation(errors)
    }
}
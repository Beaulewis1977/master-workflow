use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

// User models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: Option<String>,
    pub full_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUser {
    pub id: Uuid,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    #[validate(length(max = 100))]
    pub full_name: Option<String>,
    #[validate(url)]
    pub avatar_url: Option<String>,
    #[validate(length(max = 500))]
    pub bio: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUser {
    #[validate(length(min = 3, max = 50))]
    pub username: Option<String>,
    #[validate(length(max = 100))]
    pub full_name: Option<String>,
    #[validate(url)]
    pub avatar_url: Option<String>,
    #[validate(length(max = 500))]
    pub bio: Option<String>,
}

// Post models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Post {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub author_id: Uuid,
    pub author: User,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub likes_count: i64,
    pub comments_count: i64,
    pub is_liked: bool,
}

// Internal struct for database queries
#[derive(Debug)]
pub struct PostWithAuthor {
    pub id: Uuid,
    pub title: String,
    pub content: String,
    pub author_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub author_id: Uuid,
    pub author_email: String,
    pub author_username: Option<String>,
    pub author_full_name: Option<String>,
    pub author_avatar_url: Option<String>,
    pub author_bio: Option<String>,
    pub author_created_at: DateTime<Utc>,
    pub author_updated_at: DateTime<Utc>,
    pub likes_count: i64,
    pub comments_count: i64,
    pub is_liked: bool,
}

impl From<PostWithAuthor> for Post {
    fn from(post_with_author: PostWithAuthor) -> Self {
        Self {
            id: post_with_author.id,
            title: post_with_author.title,
            content: post_with_author.content,
            author_id: post_with_author.author_id,
            author: User {
                id: post_with_author.author_id,
                email: post_with_author.author_email,
                username: post_with_author.author_username,
                full_name: post_with_author.author_full_name,
                avatar_url: post_with_author.author_avatar_url,
                bio: post_with_author.author_bio,
                created_at: post_with_author.author_created_at,
                updated_at: post_with_author.author_updated_at,
            },
            created_at: post_with_author.created_at,
            updated_at: post_with_author.updated_at,
            likes_count: post_with_author.likes_count,
            comments_count: post_with_author.comments_count,
            is_liked: post_with_author.is_liked,
        }
    }
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreatePost {
    pub id: Uuid,
    #[validate(length(min = 1, max = 200))]
    pub title: String,
    #[validate(length(min = 1, max = 10000))]
    pub content: String,
    pub author_id: Uuid,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdatePost {
    #[validate(length(min = 1, max = 200))]
    pub title: Option<String>,
    #[validate(length(min = 1, max = 10000))]
    pub content: Option<String>,
}

// Chat models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chat {
    pub id: Uuid,
    pub name: Option<String>,
    pub chat_type: ChatType,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "chat_type", rename_all = "lowercase")]
pub enum ChatType {
    Direct,
    Group,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub chat_id: Uuid,
    pub sender_id: Uuid,
    pub sender: User,
    pub content: String,
    pub message_type: MessageType,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "message_type", rename_all = "lowercase")]
pub enum MessageType {
    Text,
    Image,
    File,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateMessage {
    pub id: Uuid,
    pub chat_id: Uuid,
    pub sender_id: Uuid,
    #[validate(length(min = 1, max = 5000))]
    pub content: String,
    pub message_type: MessageType,
    pub metadata: Option<serde_json::Value>,
}

// Notification models
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub notification_type: String,
    pub title: String,
    pub message: String,
    pub read: bool,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateNotification {
    pub id: Uuid,
    pub user_id: Uuid,
    #[validate(length(min = 1, max = 50))]
    pub notification_type: String,
    #[validate(length(min = 1, max = 100))]
    pub title: String,
    #[validate(length(min = 1, max = 500))]
    pub message: String,
    pub metadata: Option<serde_json::Value>,
}

// API Response models
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub data: T,
    pub message: Option<String>,
    pub success: bool,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            data,
            message: None,
            success: true,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            data,
            message: Some(message),
            success: true,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub message: String,
    pub code: Option<String>,
    pub details: Option<serde_json::Value>,
    pub success: bool,
}

impl ErrorResponse {
    pub fn new(message: String) -> Self {
        Self {
            message,
            code: None,
            details: None,
            success: false,
        }
    }

    pub fn with_code(message: String, code: String) -> Self {
        Self {
            message,
            code: Some(code),
            details: None,
            success: false,
        }
    }

    pub fn with_details(message: String, details: serde_json::Value) -> Self {
        Self {
            message,
            code: None,
            details: Some(details),
            success: false,
        }
    }
}

// Pagination
#[derive(Debug, Serialize)]
pub struct PaginatedResponse<T> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub page: i64,
    pub limit: i64,
    pub total: i64,
    pub total_pages: i64,
    pub has_next: bool,
    pub has_prev: bool,
}

impl PaginationMeta {
    pub fn new(page: i64, limit: i64, total: i64) -> Self {
        let total_pages = (total + limit - 1) / limit;
        Self {
            page,
            limit,
            total,
            total_pages,
            has_next: page < total_pages,
            has_prev: page > 1,
        }
    }
}
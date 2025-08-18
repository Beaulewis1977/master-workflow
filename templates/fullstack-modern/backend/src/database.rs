use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct Database {
    pool: PgPool,
}

impl Database {
    pub async fn new(database_url: &str) -> anyhow::Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(10)
            .connect(database_url)
            .await?;

        Ok(Self { pool })
    }

    pub async fn migrate(&self) -> anyhow::Result<()> {
        sqlx::migrate!("./migrations").run(&self.pool).await?;
        Ok(())
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    // Health check
    pub async fn health_check(&self) -> anyhow::Result<()> {
        let row = sqlx::query("SELECT 1 as health")
            .fetch_one(&self.pool)
            .await?;
        
        let health: i32 = row.get("health");
        if health == 1 {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Database health check failed"))
        }
    }

    // User operations
    pub async fn get_user_by_id(&self, user_id: &Uuid) -> anyhow::Result<Option<crate::models::User>> {
        let user = sqlx::query_as!(
            crate::models::User,
            r#"
            SELECT id, email, username, full_name, avatar_url, bio, created_at, updated_at
            FROM users 
            WHERE id = $1
            "#,
            user_id
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn get_user_by_email(&self, email: &str) -> anyhow::Result<Option<crate::models::User>> {
        let user = sqlx::query_as!(
            crate::models::User,
            r#"
            SELECT id, email, username, full_name, avatar_url, bio, created_at, updated_at
            FROM users 
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn create_user(&self, user: &crate::models::CreateUser) -> anyhow::Result<crate::models::User> {
        let user = sqlx::query_as!(
            crate::models::User,
            r#"
            INSERT INTO users (id, email, username, full_name, avatar_url, bio)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, email, username, full_name, avatar_url, bio, created_at, updated_at
            "#,
            user.id,
            user.email,
            user.username,
            user.full_name,
            user.avatar_url,
            user.bio
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    pub async fn update_user(&self, user_id: &Uuid, updates: &crate::models::UpdateUser) -> anyhow::Result<crate::models::User> {
        let user = sqlx::query_as!(
            crate::models::User,
            r#"
            UPDATE users 
            SET 
                username = COALESCE($2, username),
                full_name = COALESCE($3, full_name),
                avatar_url = COALESCE($4, avatar_url),
                bio = COALESCE($5, bio),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, email, username, full_name, avatar_url, bio, created_at, updated_at
            "#,
            user_id,
            updates.username,
            updates.full_name,
            updates.avatar_url,
            updates.bio
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(user)
    }

    // Post operations
    pub async fn get_posts(&self, limit: i64, offset: i64, user_id: Option<&Uuid>) -> anyhow::Result<Vec<crate::models::Post>> {
        let posts = if let Some(user_id) = user_id {
            sqlx::query_as!(
                crate::models::PostWithAuthor,
                r#"
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at,
                    u.id as "author_id!", u.email as "author_email!", u.username as "author_username!", 
                    u.full_name as "author_full_name!", u.avatar_url as "author_avatar_url",
                    u.bio as "author_bio", u.created_at as "author_created_at!", u.updated_at as "author_updated_at!",
                    COALESCE(l.likes_count, 0) as "likes_count!",
                    COALESCE(c.comments_count, 0) as "comments_count!",
                    CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as "is_liked!"
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as likes_count 
                    FROM post_likes 
                    GROUP BY post_id
                ) l ON p.id = l.post_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as comments_count 
                    FROM post_comments 
                    GROUP BY post_id
                ) c ON p.id = c.post_id
                LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $3
                ORDER BY p.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
                limit,
                offset,
                user_id
            )
            .fetch_all(&self.pool)
            .await?
        } else {
            sqlx::query_as!(
                crate::models::PostWithAuthor,
                r#"
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at,
                    u.id as "author_id!", u.email as "author_email!", u.username as "author_username!", 
                    u.full_name as "author_full_name!", u.avatar_url as "author_avatar_url",
                    u.bio as "author_bio", u.created_at as "author_created_at!", u.updated_at as "author_updated_at!",
                    COALESCE(l.likes_count, 0) as "likes_count!",
                    COALESCE(c.comments_count, 0) as "comments_count!",
                    false as "is_liked!"
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as likes_count 
                    FROM post_likes 
                    GROUP BY post_id
                ) l ON p.id = l.post_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as comments_count 
                    FROM post_comments 
                    GROUP BY post_id
                ) c ON p.id = c.post_id
                ORDER BY p.created_at DESC
                LIMIT $1 OFFSET $2
                "#,
                limit,
                offset
            )
            .fetch_all(&self.pool)
            .await?
        };

        Ok(posts.into_iter().map(Into::into).collect())
    }

    pub async fn get_post_by_id(&self, post_id: &Uuid, user_id: Option<&Uuid>) -> anyhow::Result<Option<crate::models::Post>> {
        let post = if let Some(user_id) = user_id {
            sqlx::query_as!(
                crate::models::PostWithAuthor,
                r#"
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at,
                    u.id as "author_id!", u.email as "author_email!", u.username as "author_username!", 
                    u.full_name as "author_full_name!", u.avatar_url as "author_avatar_url",
                    u.bio as "author_bio", u.created_at as "author_created_at!", u.updated_at as "author_updated_at!",
                    COALESCE(l.likes_count, 0) as "likes_count!",
                    COALESCE(c.comments_count, 0) as "comments_count!",
                    CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as "is_liked!"
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as likes_count 
                    FROM post_likes 
                    GROUP BY post_id
                ) l ON p.id = l.post_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as comments_count 
                    FROM post_comments 
                    GROUP BY post_id
                ) c ON p.id = c.post_id
                LEFT JOIN post_likes ul ON p.id = ul.post_id AND ul.user_id = $2
                WHERE p.id = $1
                "#,
                post_id,
                user_id
            )
            .fetch_optional(&self.pool)
            .await?
        } else {
            sqlx::query_as!(
                crate::models::PostWithAuthor,
                r#"
                SELECT 
                    p.id, p.title, p.content, p.author_id, p.created_at, p.updated_at,
                    u.id as "author_id!", u.email as "author_email!", u.username as "author_username!", 
                    u.full_name as "author_full_name!", u.avatar_url as "author_avatar_url",
                    u.bio as "author_bio", u.created_at as "author_created_at!", u.updated_at as "author_updated_at!",
                    COALESCE(l.likes_count, 0) as "likes_count!",
                    COALESCE(c.comments_count, 0) as "comments_count!",
                    false as "is_liked!"
                FROM posts p
                JOIN users u ON p.author_id = u.id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as likes_count 
                    FROM post_likes 
                    GROUP BY post_id
                ) l ON p.id = l.post_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*) as comments_count 
                    FROM post_comments 
                    GROUP BY post_id
                ) c ON p.id = c.post_id
                WHERE p.id = $1
                "#,
                post_id
            )
            .fetch_optional(&self.pool)
            .await?
        };

        Ok(post.map(Into::into))
    }

    pub async fn create_post(&self, post: &crate::models::CreatePost) -> anyhow::Result<Uuid> {
        let row = sqlx::query!(
            r#"
            INSERT INTO posts (id, title, content, author_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            "#,
            post.id,
            post.title,
            post.content,
            post.author_id
        )
        .fetch_one(&self.pool)
        .await?;

        Ok(row.id)
    }
}
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    pub supabase_url: String,
    pub supabase_anon_key: String,
    pub supabase_service_role_key: String,
    pub port: u16,
    pub sentry_dsn: Option<String>,
    pub upload_dir: String,
    pub max_file_size: usize,
    pub frontend_url: String,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenv::dotenv().ok();

        Ok(Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/{{projectName}}_dev".to_string()),
            
            redis_url: env::var("REDIS_URL")
                .unwrap_or_else(|_| "redis://localhost:6379".to_string()),
            
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string()),
            
            supabase_url: env::var("SUPABASE_URL")
                .expect("SUPABASE_URL must be set"),
            
            supabase_anon_key: env::var("SUPABASE_ANON_KEY")
                .expect("SUPABASE_ANON_KEY must be set"),
            
            supabase_service_role_key: env::var("SUPABASE_SERVICE_ROLE_KEY")
                .expect("SUPABASE_SERVICE_ROLE_KEY must be set"),
            
            port: env::var("PORT")
                .unwrap_or_else(|_| "8000".to_string())
                .parse()
                .expect("PORT must be a valid number"),
            
            sentry_dsn: env::var("SENTRY_DSN").ok(),
            
            upload_dir: env::var("UPLOAD_DIR")
                .unwrap_or_else(|| "./uploads".to_string()),
            
            max_file_size: env::var("MAX_FILE_SIZE")
                .unwrap_or_else(|| "10485760".to_string()) // 10MB default
                .parse()
                .expect("MAX_FILE_SIZE must be a valid number"),
            
            frontend_url: env::var("FRONTEND_URL")
                .unwrap_or_else(|| "http://localhost:3000".to_string()),
        })
    }
}
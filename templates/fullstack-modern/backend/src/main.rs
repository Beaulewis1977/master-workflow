mod api;
mod auth;
mod config;
mod database;
mod error;
mod middleware;
mod models;
mod services;
mod websocket;

use std::net::SocketAddr;

use axum::{
    routing::{get, post},
    Router,
};
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::{
    api::{auth as auth_routes, chat, posts, profile, upload, users},
    config::Config,
    database::Database,
    middleware::{auth::AuthLayer, rate_limit::RateLimitLayer},
    services::Services,
    websocket::websocket_handler,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    // Initialize Sentry (optional)
    let _guard = if let Some(dsn) = &config.sentry_dsn {
        Some(sentry::init((
            dsn.as_str(),
            sentry::ClientOptions {
                release: sentry::release_name!(),
                ..Default::default()
            },
        )))
    } else {
        None
    };

    // Initialize database
    let database = Database::new(&config.database_url).await?;
    database.migrate().await?;

    // Initialize services
    let services = Services::new(config.clone(), database).await?;

    // Build our application with routes
    let app = Router::new()
        // Health check
        .route("/health", get(health_check))
        
        // WebSocket endpoint
        .route("/ws", get(websocket_handler))
        
        // API routes
        .nest("/api", api_routes(services.clone()))
        
        // Middleware
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(
                    CorsLayer::new()
                        .allow_origin(Any)
                        .allow_methods(Any)
                        .allow_headers(Any),
                )
                .layer(RateLimitLayer::new())
                .layer(AuthLayer::new(services.clone())),
        )
        .with_state(services);

    // Create server address
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on {}", addr);

    // Start server
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

fn api_routes(services: Services) -> Router<Services> {
    Router::new()
        // Authentication routes (public)
        .nest("/auth", auth_routes::routes())
        
        // Protected routes
        .nest("/profile", profile::routes())
        .nest("/users", users::routes())
        .nest("/posts", posts::routes())
        .nest("/chat", chat::routes())
        .nest("/upload", upload::routes())
        
        .with_state(services)
}

async fn health_check() -> &'static str {
    "OK"
}
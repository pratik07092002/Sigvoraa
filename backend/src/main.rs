mod api;
mod indexer;
mod rules;
mod ai;
mod registry;
mod db;

use axum::{routing::get, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub struct AppState {
    pub db: Option<sqlx::PgPool>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let db_pool = match std::env::var("DATABASE_URL") {
        Ok(url) => match db::pool::connect(&url).await {
            Ok(pool) => Some(pool),
            Err(err) => {
                tracing::warn!("failed to connect to database: {err}");
                None
            }
        },
        Err(_) => {
            tracing::warn!("DATABASE_URL not set, starting without a database connection");
            None
        }
    };

    let state = Arc::new(AppState { db: db_pool });

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(api::health::health))
        .nest("/api", api::routes())
        .with_state(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    tracing::info!("SentinelMesh backend listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn root() -> &'static str {
    "SentinelMesh backend"
}

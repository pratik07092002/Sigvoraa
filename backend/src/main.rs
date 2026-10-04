mod api;
mod indexer;
mod rules;
mod ai;
mod registry;
mod db;
mod shield;

use axum::{routing::get, Router};
use solana_client::nonblocking::rpc_client::RpcClient;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

pub struct AppState {
    pub db: Option<sqlx::PgPool>,
    pub rpc: RpcClient,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let db_pool = match std::env::var("DATABASE_URL") {
        Ok(url) => match db::pool::connect(&url).await {
            Ok(pool) => {
                if let Err(err) = sqlx::migrate!("./migrations").run(&pool).await {
                    tracing::warn!("failed to run migrations: {err}");
                }
                Some(pool)
            }
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

    if let Some(pool) = &db_pool {
        tokio::spawn(indexer::run(pool.clone()));
    }

    let rpc_url = std::env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
    let state = Arc::new(AppState {
        db: db_pool,
        rpc: RpcClient::new(rpc_url),
    });

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

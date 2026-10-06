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
    pub registry: Option<registry::RegistryClient>,
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

    let registry = match registry::RegistryClient::from_env(rpc_url.clone()) {
        Ok(client) => {
            tracing::info!("registry reporter: {}", client.reporter_pubkey());
            Some(client)
        }
        Err(err) => {
            tracing::warn!("registry write flow disabled: {err}");
            None
        }
    };

    let state = Arc::new(AppState {
        db: db_pool,
        rpc: RpcClient::new(rpc_url),
        registry,
    });

    let cors = build_cors_layer();

    let app = Router::new()
        .route("/", get(root))
        .route("/health", get(api::health::health))
        .nest("/api", api::routes())
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let port: u16 = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8080);
    let addr = SocketAddr::from(([127, 0, 0, 1], port));
    tracing::info!("Sigvoraa backend listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app.into_make_service_with_connect_info::<SocketAddr>())
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    Ok(())
}

fn build_cors_layer() -> CorsLayer {
    match std::env::var("FRONTEND_ORIGIN") {
        Ok(origins) if !origins.trim().is_empty() => {
            let parsed: Vec<_> = origins
                .split(',')
                .filter_map(|o| o.trim().parse().ok())
                .collect();
            tracing::info!("CORS restricted to: {origins}");
            CorsLayer::new()
                .allow_origin(parsed)
                .allow_methods(tower_http::cors::Any)
                .allow_headers(tower_http::cors::Any)
        }
        _ => {
            tracing::warn!("FRONTEND_ORIGIN not set; allowing any origin (fine for local dev, not for production)");
            CorsLayer::permissive()
        }
    }
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c().await.ok();
    tracing::info!("shutdown signal received, draining in-flight requests");
}

async fn root() -> &'static str {
    "Sigvoraa backend"
}

use crate::AppState;
use axum::{extract::State, http::StatusCode, response::IntoResponse, Json};
use serde_json::json;
use std::sync::Arc;

pub async fn health(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let db_ok = match &state.db {
        Some(pool) => sqlx::query("SELECT 1").execute(pool).await.is_ok(),
        None => false,
    };
    let registry_ok = state.registry.is_some();

    let status = if db_ok { StatusCode::OK } else { StatusCode::SERVICE_UNAVAILABLE };
    (
        status,
        Json(json!({
            "status": if db_ok { "ok" } else { "degraded" },
            "database": db_ok,
            "registry_writer": registry_ok,
        })),
    )
}

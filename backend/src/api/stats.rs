use crate::AppState;
use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct Stats {
    pub total_alerts: i64,
    pub flagged_addresses: i64,
    pub transactions_indexed: i64,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/stats", get(stats))
}

async fn stats(State(_state): State<Arc<AppState>>) -> Json<Stats> {
    // TODO(Phase 3): aggregate counts from Postgres.
    Json(Stats {
        total_alerts: 0,
        flagged_addresses: 0,
        transactions_indexed: 0,
    })
}

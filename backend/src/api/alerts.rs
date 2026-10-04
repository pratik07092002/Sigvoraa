use crate::AppState;
use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct Alert {
    pub id: i64,
    pub signature: String,
    pub rule_id: String,
    pub severity: i16,
    pub target_address: Option<String>,
    pub explanation: Option<String>,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/alerts", get(list_alerts))
}

async fn list_alerts(State(_state): State<Arc<AppState>>) -> Json<Vec<Alert>> {
    // TODO(Phase 3): read from the `alerts` table, support pagination + severity filter.
    Json(vec![])
}

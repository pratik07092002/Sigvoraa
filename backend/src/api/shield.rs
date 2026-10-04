use crate::AppState;
use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct ShieldCheckRequest {
    /// Base64-encoded unsigned transaction.
    pub transaction: String,
}

#[derive(Serialize)]
pub struct ShieldCheckResponse {
    pub verdict: String,
    pub risk_score: u8,
    pub summary: String,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/shield/check", post(check))
}

async fn check(
    State(_state): State<Arc<AppState>>,
    Json(_req): Json<ShieldCheckRequest>,
) -> Json<ShieldCheckResponse> {
    // TODO(Phase 4): simulateTransaction + rules engine + AI explainer.
    Json(ShieldCheckResponse {
        verdict: "safe".to_string(),
        risk_score: 0,
        summary: "Wallet Shield is not wired up yet.".to_string(),
    })
}

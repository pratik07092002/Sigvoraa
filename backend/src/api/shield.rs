use crate::{shield, AppState};
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct ShieldCheckRequest {
    /// Base64-encoded unsigned transaction.
    pub transaction: String,
}

#[derive(Serialize)]
pub struct Finding {
    pub rule: &'static str,
    pub severity: u8,
    pub explanation: String,
}

#[derive(Serialize)]
pub struct ShieldCheckResponse {
    pub verdict: String,
    pub risk_score: u8,
    pub summary: String,
    pub would_fail: bool,
    pub findings: Vec<Finding>,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/shield/check", post(check))
}

async fn check(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ShieldCheckRequest>,
) -> Result<Json<ShieldCheckResponse>, (StatusCode, String)> {
    let result = shield::check(&req.transaction, &state.rpc, state.db.as_ref())
        .await
        .map_err(|err| (StatusCode::BAD_REQUEST, err.to_string()))?;

    Ok(Json(ShieldCheckResponse {
        verdict: result.verdict.to_string(),
        risk_score: result.risk_score,
        summary: result.summary,
        would_fail: result.would_fail,
        findings: result
            .findings
            .into_iter()
            .map(|f| Finding {
                rule: f.rule_id,
                severity: f.severity,
                explanation: f.explanation,
            })
            .collect(),
    }))
}

use crate::AppState;
use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Deserialize)]
pub struct ScanRequest {
    pub source_ref: String,
}

#[derive(Serialize)]
pub struct ScanReport {
    pub id: String,
    pub source_ref: String,
    pub summary: String,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .route("/scan", post(submit_scan))
        .route("/scan/:id", get(get_scan))
}

async fn submit_scan(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<ScanRequest>,
) -> Json<ScanReport> {
    // TODO(stretch): send Anchor source to the LLM with the Solana security checklist.
    Json(ScanReport {
        id: uuid::Uuid::new_v4().to_string(),
        source_ref: req.source_ref,
        summary: "Program Scanner is not implemented yet.".to_string(),
    })
}

async fn get_scan(State(_state): State<Arc<AppState>>, Path(id): Path<String>) -> Json<ScanReport> {
    Json(ScanReport {
        id,
        source_ref: String::new(),
        summary: "Program Scanner is not implemented yet.".to_string(),
    })
}

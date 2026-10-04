use crate::AppState;
use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct AddressProfile {
    pub address: String,
    pub risk_score: i16,
    pub flagged: bool,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/address/:pubkey", get(lookup))
}

async fn lookup(
    State(_state): State<Arc<AppState>>,
    Path(pubkey): Path<String>,
) -> Json<AddressProfile> {
    // TODO(Phase 3): look up `flagged_addresses` + on-chain registry status.
    Json(AddressProfile {
        address: pubkey,
        risk_score: 0,
        flagged: false,
    })
}

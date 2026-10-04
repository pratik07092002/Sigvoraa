use crate::{db::queries, AppState};
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
    pub category: Option<String>,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/address/:pubkey", get(lookup))
}

async fn lookup(State(state): State<Arc<AppState>>, Path(pubkey): Path<String>) -> Json<AddressProfile> {
    let Some(pool) = &state.db else {
        return Json(AddressProfile {
            address: pubkey,
            risk_score: 0,
            flagged: false,
            category: None,
        });
    };

    // On-chain registry status lookup lands when the registry client (Phase 6) exists.
    match queries::address_profile(pool, &pubkey).await {
        Ok(Some(entry)) => Json(AddressProfile {
            address: pubkey,
            risk_score: entry.risk_score,
            flagged: true,
            category: Some(entry.category),
        }),
        Ok(None) => Json(AddressProfile {
            address: pubkey,
            risk_score: 0,
            flagged: false,
            category: None,
        }),
        Err(err) => {
            tracing::warn!("address_profile query failed: {err}");
            Json(AddressProfile {
                address: pubkey,
                risk_score: 0,
                flagged: false,
                category: None,
            })
        }
    }
}

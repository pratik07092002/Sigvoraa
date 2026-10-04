use crate::{api::error::ApiError, db::queries, AppState};
use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use serde::Serialize;
use solana_sdk::pubkey::Pubkey;
use std::{str::FromStr, sync::Arc};

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

async fn lookup(
    State(state): State<Arc<AppState>>,
    Path(pubkey): Path<String>,
) -> Result<Json<AddressProfile>, ApiError> {
    if Pubkey::from_str(&pubkey).is_err() {
        return Err(ApiError::bad_request("not a valid Solana address"));
    }

    let Some(pool) = &state.db else {
        return Ok(Json(AddressProfile {
            address: pubkey,
            risk_score: 0,
            flagged: false,
            category: None,
        }));
    };

    match queries::address_profile(pool, &pubkey).await {
        Ok(Some(entry)) => Ok(Json(AddressProfile {
            address: pubkey,
            risk_score: entry.risk_score,
            flagged: true,
            category: Some(entry.category),
        })),
        Ok(None) => Ok(Json(AddressProfile {
            address: pubkey,
            risk_score: 0,
            flagged: false,
            category: None,
        })),
        Err(err) => Err(ApiError::internal(err.to_string())),
    }
}

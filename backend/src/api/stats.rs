use crate::{db::queries, AppState};
use axum::{extract::State, routing::get, Json, Router};
use serde::Serialize;
use std::sync::Arc;

#[derive(Serialize)]
pub struct Stats {
    pub total_alerts: i64,
    pub flagged_addresses: i64,
    pub transactions_indexed: i64,
    pub checks_performed: i64,
    pub checks_blocked: i64,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/stats", get(stats))
}

async fn stats(State(state): State<Arc<AppState>>) -> Json<Stats> {
    let Some(pool) = &state.db else {
        return Json(Stats {
            total_alerts: 0,
            flagged_addresses: 0,
            transactions_indexed: 0,
            checks_performed: 0,
            checks_blocked: 0,
        });
    };
    match queries::get_stats(pool).await {
        Ok(s) => Json(Stats {
            total_alerts: s.total_alerts,
            flagged_addresses: s.flagged_addresses,
            transactions_indexed: s.transactions_indexed,
            checks_performed: s.checks_performed,
            checks_blocked: s.checks_blocked,
        }),
        Err(err) => {
            tracing::warn!("get_stats query failed: {err}");
            Json(Stats {
                total_alerts: 0,
                flagged_addresses: 0,
                transactions_indexed: 0,
                checks_performed: 0,
                checks_blocked: 0,
            })
        }
    }
}

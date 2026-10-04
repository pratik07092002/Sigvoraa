use crate::{db::queries, AppState};
use axum::{
    extract::{Query, State},
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;

#[derive(Deserialize)]
pub struct AlertsQuery {
    limit: Option<i64>,
    min_severity: Option<i16>,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/alerts", get(list_alerts))
}

async fn list_alerts(
    State(state): State<Arc<AppState>>,
    Query(params): Query<AlertsQuery>,
) -> Json<Vec<queries::AlertRow>> {
    let Some(pool) = &state.db else {
        return Json(vec![]);
    };
    let limit = params.limit.unwrap_or(50).clamp(1, 500);
    match queries::list_alerts(pool, limit, params.min_severity).await {
        Ok(alerts) => Json(alerts),
        Err(err) => {
            tracing::warn!("list_alerts query failed: {err}");
            Json(vec![])
        }
    }
}

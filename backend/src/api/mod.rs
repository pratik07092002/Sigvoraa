pub mod health;
pub mod shield;
pub mod alerts;
pub mod address;
pub mod scan;
pub mod stats;

use crate::AppState;
use axum::Router;
use std::sync::Arc;

pub fn routes() -> Router<Arc<AppState>> {
    Router::new()
        .merge(shield::routes())
        .merge(alerts::routes())
        .merge(address::routes())
        .merge(scan::routes())
        .merge(stats::routes())
}

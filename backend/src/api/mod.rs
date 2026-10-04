pub mod address;
pub mod alerts;
pub mod error;
pub mod health;
pub mod rate_limit;
pub mod report;
pub mod scan;
pub mod shield;
pub mod stats;

use crate::AppState;
use axum::{middleware, Router};
use std::{sync::Arc, time::Duration};

pub fn routes() -> Router<Arc<AppState>> {
    // Expensive/writable endpoints (RPC calls, on-chain writes) get a tighter
    // per-IP limit than the rest of the read-only API.
    let write_limiter = rate_limit::RateLimiter::new(10, Duration::from_secs(60));
    let rate_limited = Router::new()
        .merge(shield::routes())
        .merge(report::routes())
        .layer(middleware::from_fn_with_state(write_limiter, rate_limit::middleware));

    Router::new()
        .merge(rate_limited)
        .merge(alerts::routes())
        .merge(address::routes())
        .merge(scan::routes())
        .merge(stats::routes())
}

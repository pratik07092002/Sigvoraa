use axum::{
    body::Body,
    extract::{ConnectInfo, State},
    http::{Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
};
use serde_json::json;
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

/// Fixed-window per-IP rate limiter. Good enough to stop casual abuse of the
/// endpoints that cost real money (RPC calls, on-chain writes) without
/// pulling in a dependency whose exact API this session can't verify.
#[derive(Clone)]
pub struct RateLimiter {
    hits: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
    max_requests: usize,
    window: Duration,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window: Duration) -> Self {
        Self { hits: Arc::new(Mutex::new(HashMap::new())), max_requests, window }
    }

    fn allow(&self, key: &str) -> bool {
        let now = Instant::now();
        let mut hits = self.hits.lock().unwrap_or_else(|e| e.into_inner());
        let entry = hits.entry(key.to_string()).or_default();
        entry.retain(|&t| now.duration_since(t) < self.window);
        if entry.len() >= self.max_requests {
            false
        } else {
            entry.push(now);
            true
        }
    }
}

pub async fn middleware(
    State(limiter): State<RateLimiter>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    request: Request<Body>,
    next: Next,
) -> Response {
    if limiter.allow(&addr.ip().to_string()) {
        next.run(request).await
    } else {
        (
            StatusCode::TOO_MANY_REQUESTS,
            axum::Json(json!({ "error": "rate limit exceeded, try again shortly" })),
        )
            .into_response()
    }
}

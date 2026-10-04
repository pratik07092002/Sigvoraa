use crate::{db::queries, registry::ThreatCategory, AppState};
use axum::{extract::State, http::StatusCode, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_sdk::pubkey::Pubkey;
use std::{str::FromStr, sync::Arc};

#[derive(Deserialize)]
pub struct ReportRequest {
    pub alert_id: i64,
}

#[derive(Serialize)]
pub struct ReportResponse {
    pub signature: String,
    pub threat_entry: String,
    pub explorer_url: String,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/report", post(report))
}

async fn report(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ReportRequest>,
) -> Result<Json<ReportResponse>, (StatusCode, String)> {
    let pool = state
        .db
        .as_ref()
        .ok_or((StatusCode::SERVICE_UNAVAILABLE, "database not configured".to_string()))?;
    let registry = state
        .registry
        .as_ref()
        .ok_or((StatusCode::SERVICE_UNAVAILABLE, "registry reporter not configured".to_string()))?;

    let alert = queries::get_alert(pool, req.alert_id)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "alert not found".to_string()))?;

    let target_address = alert
        .target_address
        .clone()
        .ok_or((StatusCode::BAD_REQUEST, "alert has no target address".to_string()))?;
    let target = Pubkey::from_str(&target_address).map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;

    let category = ThreatCategory::from_rule_id(&alert.rule_id);
    let severity = alert.severity.clamp(0, 100) as u8;

    let mut hasher = Sha256::new();
    hasher.update(alert.signature.as_bytes());
    hasher.update(alert.explanation.as_deref().unwrap_or("").as_bytes());
    let evidence_hash: [u8; 32] = hasher.finalize().into();

    let (signature, threat_entry) = registry
        .report_threat(target, category, severity, evidence_hash)
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, e.to_string()))?;

    let evidence = serde_json::json!({
        "alert_id": alert.id,
        "signature": alert.signature,
        "rule_id": alert.rule_id,
        "explanation": alert.explanation,
    });
    if let Err(err) =
        queries::upsert_flagged_address(pool, &target_address, category.as_str(), alert.severity, &signature, &evidence)
            .await
    {
        tracing::warn!("failed to upsert flagged_addresses after on-chain report: {err}");
    }
    if let Err(err) = queries::mark_alert_reported(pool, alert.id).await {
        tracing::warn!("failed to mark alert reported: {err}");
    }

    Ok(Json(ReportResponse {
        signature: signature.clone(),
        threat_entry: threat_entry.to_string(),
        explorer_url: format!("https://explorer.solana.com/tx/{signature}?cluster=devnet"),
    }))
}

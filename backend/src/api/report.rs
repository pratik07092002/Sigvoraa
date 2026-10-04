use crate::{
    api::error::ApiError,
    db::queries,
    registry::{ReportOutcome, ThreatCategory},
    AppState,
};
use axum::{extract::State, routing::post, Json, Router};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use solana_sdk::pubkey::Pubkey;
use std::{str::FromStr, sync::Arc};

/// Below this, a finding is noise, not worth a real on-chain write -- also
/// closes off a trivial way to spam-drain the reporter wallet.
const MIN_SEVERITY_TO_REPORT: i16 = 30;

#[derive(Deserialize)]
pub struct ReportRequest {
    pub alert_id: i64,
}

#[derive(Serialize)]
pub struct ReportResponse {
    pub signature: Option<String>,
    pub threat_entry: String,
    pub explorer_url: String,
    /// True when this target already had a registry entry (from any prior
    /// report) -- no new transaction was submitted, but the alert is still
    /// marked reported since the thing it asked for is already true.
    pub already_on_chain: bool,
}

pub fn routes() -> Router<Arc<AppState>> {
    Router::new().route("/report", post(report))
}

async fn report(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ReportRequest>,
) -> Result<Json<ReportResponse>, ApiError> {
    if req.alert_id <= 0 {
        return Err(ApiError::bad_request("alert_id must be positive"));
    }

    let pool = state
        .db
        .as_ref()
        .ok_or_else(|| ApiError::service_unavailable("database not configured"))?;
    let registry = state
        .registry
        .as_ref()
        .ok_or_else(|| ApiError::service_unavailable("registry reporter not configured"))?;

    let alert = queries::get_alert(pool, req.alert_id)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("alert not found"))?;

    if alert.status.as_deref() == Some("reported") {
        return Err(ApiError::conflict("alert has already been reported to the registry"));
    }
    if alert.severity < MIN_SEVERITY_TO_REPORT {
        return Err(ApiError::bad_request(format!(
            "severity {} is below the reporting threshold ({MIN_SEVERITY_TO_REPORT})",
            alert.severity
        )));
    }

    let target_address = alert
        .target_address
        .clone()
        .ok_or_else(|| ApiError::bad_request("alert has no target address"))?;
    let target = Pubkey::from_str(&target_address).map_err(|e| ApiError::bad_request(e.to_string()))?;

    let category = ThreatCategory::from_rule_id(&alert.rule_id);
    let severity = alert.severity.clamp(0, 100) as u8;

    let mut hasher = Sha256::new();
    hasher.update(alert.signature.as_bytes());
    hasher.update(alert.explanation.as_deref().unwrap_or("").as_bytes());
    let evidence_hash: [u8; 32] = hasher.finalize().into();

    let outcome = registry
        .report_threat(target, category, severity, evidence_hash)
        .await
        .map_err(|e| ApiError::bad_gateway(e.to_string()))?;

    let (signature, threat_entry, already_on_chain) = match outcome {
        ReportOutcome::Created { signature, threat_entry } => (Some(signature), threat_entry, false),
        ReportOutcome::AlreadyOnChain { threat_entry } => (None, threat_entry, true),
    };

    let evidence = serde_json::json!({
        "alert_id": alert.id,
        "signature": alert.signature,
        "rule_id": alert.rule_id,
        "explanation": alert.explanation,
    });
    if let Err(err) = queries::upsert_flagged_address(
        pool,
        &target_address,
        category.as_str(),
        alert.severity,
        signature.as_deref().unwrap_or("already-on-chain"),
        &evidence,
    )
    .await
    {
        tracing::warn!("failed to upsert flagged_addresses after on-chain report: {err}");
    }
    if let Err(err) = queries::mark_alert_reported(pool, alert.id).await {
        tracing::warn!("failed to mark alert reported: {err}");
    }

    let explorer_url = match &signature {
        Some(sig) => format!("https://explorer.solana.com/tx/{sig}?cluster=devnet"),
        None => format!("https://explorer.solana.com/address/{threat_entry}?cluster=devnet"),
    };

    Ok(Json(ReportResponse {
        signature,
        threat_entry: threat_entry.to_string(),
        explorer_url,
        already_on_chain,
    }))
}

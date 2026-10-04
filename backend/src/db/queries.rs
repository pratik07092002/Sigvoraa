use crate::rules::{Finding, TxContext};
use sqlx::PgPool;

pub async fn upsert_transaction(pool: &PgPool, ctx: &TxContext, raw: &serde_json::Value) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO transactions (signature, slot, block_time, fee_payer, success, raw)
        VALUES ($1, $2, to_timestamp($3), $4, $5, $6)
        ON CONFLICT (signature) DO NOTHING
        "#,
    )
    .bind(&ctx.signature)
    .bind(ctx.slot as i64)
    .bind(ctx.block_time.unwrap_or(0) as f64)
    .bind(&ctx.fee_payer)
    .bind(ctx.success)
    .bind(raw)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn insert_alert(pool: &PgPool, signature: &str, finding: &Finding) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO alerts (signature, rule_id, severity, target_address, explanation)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(signature)
    .bind(finding.rule_id)
    .bind(finding.severity as i16)
    .bind(&finding.target_address)
    .bind(&finding.explanation)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn flagged_accounts_among(pool: &PgPool, account_keys: &[String]) -> Result<Vec<String>, sqlx::Error> {
    if account_keys.is_empty() {
        return Ok(vec![]);
    }
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT address FROM flagged_addresses WHERE address = ANY($1)",
    )
    .bind(account_keys)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().map(|(a,)| a).collect())
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct AlertRow {
    pub id: i64,
    pub signature: String,
    pub rule_id: String,
    pub severity: i16,
    pub target_address: Option<String>,
    pub explanation: Option<String>,
    pub status: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub async fn list_alerts(pool: &PgPool, limit: i64, min_severity: Option<i16>) -> Result<Vec<AlertRow>, sqlx::Error> {
    sqlx::query_as::<_, AlertRow>(
        r#"
        SELECT id, signature, rule_id, severity, target_address, explanation, status, created_at
        FROM alerts
        WHERE $1::smallint IS NULL OR severity >= $1
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(min_severity)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub struct Stats {
    pub total_alerts: i64,
    pub flagged_addresses: i64,
    pub transactions_indexed: i64,
}

pub async fn get_stats(pool: &PgPool) -> Result<Stats, sqlx::Error> {
    let total_alerts: (i64,) = sqlx::query_as("SELECT count(*) FROM alerts")
        .fetch_one(pool)
        .await?;
    let flagged_addresses: (i64,) = sqlx::query_as("SELECT count(*) FROM flagged_addresses")
        .fetch_one(pool)
        .await?;
    let transactions_indexed: (i64,) = sqlx::query_as("SELECT count(*) FROM transactions")
        .fetch_one(pool)
        .await?;
    Ok(Stats {
        total_alerts: total_alerts.0,
        flagged_addresses: flagged_addresses.0,
        transactions_indexed: transactions_indexed.0,
    })
}

pub struct FlaggedAddress {
    pub category: String,
    pub risk_score: i16,
}

pub async fn address_profile(pool: &PgPool, address: &str) -> Result<Option<FlaggedAddress>, sqlx::Error> {
    let row: Option<(String, i16)> =
        sqlx::query_as("SELECT category, risk_score FROM flagged_addresses WHERE address = $1")
            .bind(address)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(category, risk_score)| FlaggedAddress { category, risk_score }))
}

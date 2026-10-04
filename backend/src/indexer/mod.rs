mod parser;

use crate::{db::queries, rules};
use futures_util::StreamExt;
use solana_client::{
    nonblocking::{pubsub_client::PubsubClient, rpc_client::RpcClient},
    rpc_config::{RpcTransactionConfig, RpcTransactionLogsConfig, RpcTransactionLogsFilter},
};
use solana_sdk::commitment_config::CommitmentConfig;
use solana_transaction_status::UiTransactionEncoding;
use sqlx::PgPool;
use std::time::Duration;

pub async fn run(pool: PgPool) {
    let watch = std::env::var("INDEXER_WATCH_ADDRESSES").unwrap_or_default();
    let addresses: Vec<String> = watch
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if addresses.is_empty() {
        tracing::warn!("INDEXER_WATCH_ADDRESSES not set; runtime monitor is idle");
        return;
    }

    let ws_url = std::env::var("SOLANA_WS_URL").unwrap_or_else(|_| "wss://api.devnet.solana.com".to_string());
    let rpc_url = std::env::var("SOLANA_RPC_URL").unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());

    for address in addresses {
        let pool = pool.clone();
        let ws_url = ws_url.clone();
        let rpc_url = rpc_url.clone();
        tokio::spawn(async move {
            watch_address(address, ws_url, rpc_url, pool).await;
        });
    }
}

async fn watch_address(address: String, ws_url: String, rpc_url: String, pool: PgPool) {
    loop {
        if let Err(err) = watch_address_once(&address, &ws_url, &rpc_url, &pool).await {
            tracing::warn!("indexer stream for {address} ended: {err}; reconnecting in 5s");
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

async fn watch_address_once(
    address: &str,
    ws_url: &str,
    rpc_url: &str,
    pool: &PgPool,
) -> anyhow::Result<()> {
    let pubsub = PubsubClient::new(ws_url).await?;
    let (mut stream, _unsubscribe) = pubsub
        .logs_subscribe(
            RpcTransactionLogsFilter::Mentions(vec![address.to_string()]),
            RpcTransactionLogsConfig {
                commitment: Some(CommitmentConfig::confirmed()),
            },
        )
        .await?;

    tracing::info!("watching {address} for transactions");
    let rpc = RpcClient::new(rpc_url.to_string());

    while let Some(log) = stream.next().await {
        if log.value.err.is_some() {
            continue;
        }
        let signature = log.value.signature;
        if let Err(err) = index_signature(&rpc, pool, &signature).await {
            tracing::warn!("failed to index {signature}: {err}");
        }
    }

    Ok(())
}

async fn index_signature(rpc: &RpcClient, pool: &PgPool, signature: &str) -> anyhow::Result<()> {
    let sig = signature.parse()?;
    let config = RpcTransactionConfig {
        encoding: Some(UiTransactionEncoding::JsonParsed),
        commitment: Some(CommitmentConfig::confirmed()),
        max_supported_transaction_version: Some(0),
    };
    let confirmed = rpc.get_transaction_with_config(&sig, config).await?;

    let Some(mut ctx) = parser::parse_transaction(signature, &confirmed) else {
        return Ok(());
    };

    ctx.flagged_accounts = queries::flagged_accounts_among(pool, &ctx.account_keys).await?;

    let raw = serde_json::to_value(&confirmed).unwrap_or(serde_json::Value::Null);
    queries::upsert_transaction(pool, &ctx, &raw).await?;

    for finding in rules::run_all(&ctx) {
        tracing::info!(
            "alert: {} ({}) on {signature}: {}",
            finding.rule_id,
            finding.severity,
            finding.explanation
        );
        queries::insert_alert(pool, signature, &finding).await?;
    }

    Ok(())
}

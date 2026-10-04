pub mod decode;

use crate::{ai, db::queries, rules};
use base64::{engine::general_purpose::STANDARD, Engine};
use solana_account_decoder::{UiAccountData, UiAccountEncoding};
use solana_client::{
    nonblocking::rpc_client::RpcClient,
    rpc_config::{RpcSimulateTransactionAccountsConfig, RpcSimulateTransactionConfig},
};
use solana_sdk::commitment_config::CommitmentConfig;
use solana_sdk::program_pack::Pack;
use solana_sdk::pubkey::Pubkey;
use sqlx::PgPool;

pub struct ShieldResult {
    pub verdict: &'static str,
    pub risk_score: u8,
    pub summary: String,
    pub findings: Vec<rules::Finding>,
    pub would_fail: bool,
}

pub async fn check(base64_tx: &str, rpc: &RpcClient, pool: Option<&PgPool>) -> anyhow::Result<ShieldResult> {
    let tx = decode::decode_transaction(base64_tx)?;
    let (mut ctx, watched) = decode::build_context(&tx)?;

    let mut unique: Vec<Pubkey> = watched.iter().map(|w| w.pubkey).collect();
    unique.sort();
    unique.dedup();

    ctx.pre_token_balances = fetch_balances(rpc, &unique, &watched).await;

    let sim_config = RpcSimulateTransactionConfig {
        sig_verify: false,
        replace_recent_blockhash: true,
        commitment: Some(CommitmentConfig::confirmed()),
        accounts: Some(RpcSimulateTransactionAccountsConfig {
            encoding: Some(UiAccountEncoding::Base64),
            addresses: unique.iter().map(|p| p.to_string()).collect(),
        }),
        ..Default::default()
    };

    let sim = rpc.simulate_transaction_with_config(&tx, sim_config).await?;
    let would_fail = sim.value.err.is_some();
    let logs = sim.value.logs.unwrap_or_default();

    if let Some(accounts) = sim.value.accounts {
        ctx.post_token_balances = watched
            .iter()
            .filter_map(|w| {
                let ui_account = accounts.get(unique.iter().position(|p| *p == w.pubkey)?)?.as_ref()?;
                let amount = decode_token_amount(&ui_account.data)?;
                Some(rules::TokenBalance {
                    account_index: w.account_index,
                    account: Some(w.pubkey.to_string()),
                    mint: String::new(),
                    owner: None,
                    amount,
                    decimals: 0,
                })
            })
            .collect();
    }

    if let Some(pool) = pool {
        ctx.flagged_accounts = queries::flagged_accounts_among(pool, &ctx.account_keys)
            .await
            .unwrap_or_default();
    }

    let findings = rules::run_all(&ctx);
    let (risk_score, verdict) = score(&findings, would_fail);
    let summary = ai::explain_risk(&findings, verdict, would_fail, &logs).await;

    if let Some(pool) = pool {
        let _ = queries::insert_shield_check(pool, &ctx.fee_payer, verdict, risk_score, &summary).await;
    }

    Ok(ShieldResult { verdict, risk_score, summary, findings, would_fail })
}

async fn fetch_balances(
    rpc: &RpcClient,
    unique: &[Pubkey],
    watched: &[decode::WatchedAccount],
) -> Vec<rules::TokenBalance> {
    let mut balances = Vec::new();
    for pubkey in unique {
        let Ok(resp) = rpc.get_token_account_balance(pubkey).await else {
            continue;
        };
        let Ok(amount) = resp.amount.parse::<u64>() else {
            continue;
        };
        if let Some(w) = watched.iter().find(|w| w.pubkey == *pubkey) {
            balances.push(rules::TokenBalance {
                account_index: w.account_index,
                account: Some(pubkey.to_string()),
                mint: String::new(),
                owner: None,
                amount,
                decimals: resp.decimals,
            });
        }
    }
    balances
}

fn decode_token_amount(data: &UiAccountData) -> Option<u64> {
    let bytes = match data {
        UiAccountData::Binary(encoded, UiAccountEncoding::Base64) => STANDARD.decode(encoded).ok()?,
        _ => return None,
    };
    let account = spl_token::state::Account::unpack(&bytes).ok()?;
    Some(account.amount)
}

fn score(findings: &[rules::Finding], would_fail: bool) -> (u8, &'static str) {
    let max_severity = findings.iter().map(|f| f.severity).max().unwrap_or(0);
    let risk_score = if would_fail { max_severity.max(20) } else { max_severity };
    let verdict = match risk_score {
        0..=29 => "safe",
        30..=69 => "caution",
        _ => "danger",
    };
    (risk_score, verdict)
}

use crate::rules::{ParsedInstruction, TxContext};
use anyhow::{anyhow, Context};
use base64::{engine::general_purpose::STANDARD, Engine};
use solana_sdk::{
    instruction::CompiledInstruction, message::VersionedMessage, pubkey::Pubkey,
    transaction::VersionedTransaction,
};
use spl_token::instruction::{AuthorityType, TokenInstruction};

const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SPL_TOKEN_2022_PROGRAM: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

pub fn decode_transaction(base64_tx: &str) -> anyhow::Result<VersionedTransaction> {
    let bytes = STANDARD
        .decode(base64_tx.trim())
        .context("transaction is not valid base64")?;
    let tx: VersionedTransaction = bincode::deserialize(&bytes).context("could not deserialize transaction")?;
    Ok(tx)
}

/// A token account we need pre/post balances for, resolved from instruction accounts.
#[derive(Debug, Clone)]
pub struct WatchedAccount {
    pub pubkey: Pubkey,
    pub account_index: u8,
}

/// Builds a TxContext from an unsigned transaction's own instructions (no chain
/// history available yet, so pre/post token balances are filled in separately).
/// Rejects v0 transactions that rely on address lookup tables, since resolving
/// those needs extra RPC round trips this MVP doesn't do yet.
pub fn build_context(tx: &VersionedTransaction) -> anyhow::Result<(TxContext, Vec<WatchedAccount>)> {
    let message = &tx.message;
    if let VersionedMessage::V0(m) = message {
        if !m.address_table_lookups.is_empty() {
            return Err(anyhow!(
                "transactions using address lookup tables aren't supported by Wallet Shield yet"
            ));
        }
    }

    let account_keys: Vec<Pubkey> = message.static_account_keys().to_vec();
    if account_keys.is_empty() {
        return Err(anyhow!("transaction has no accounts"));
    }
    let fee_payer = account_keys[0];

    let mut instructions = Vec::new();
    let mut watched = Vec::new();

    for ix in message.instructions() {
        let Some(program_id) = account_keys.get(ix.program_id_index as usize) else {
            continue;
        };
        let program_id_str = program_id.to_string();

        if program_id_str == SPL_TOKEN_PROGRAM || program_id_str == SPL_TOKEN_2022_PROGRAM {
            if let Some((parsed, refs)) = decode_token_instruction(ix, &account_keys) {
                for (pubkey, idx) in refs {
                    watched.push(WatchedAccount { pubkey, account_index: idx });
                }
                instructions.push(ParsedInstruction {
                    program: "spl-token".to_string(),
                    program_id: program_id_str,
                    parsed: Some(parsed),
                });
                continue;
            }
        }

        instructions.push(ParsedInstruction {
            program: "unknown".to_string(),
            program_id: program_id_str,
            parsed: None,
        });
    }

    let ctx = TxContext {
        signature: String::new(),
        slot: 0,
        block_time: None,
        fee_payer: fee_payer.to_string(),
        success: true,
        account_keys: account_keys.iter().map(|k| k.to_string()).collect(),
        instructions,
        pre_token_balances: vec![],
        post_token_balances: vec![],
        flagged_accounts: vec![],
    };

    Ok((ctx, watched))
}

/// Decodes a single SPL Token instruction into the same {"type", "info"} shape
/// the RPC's JsonParsed encoding uses, so the rules engine can treat simulated
/// and confirmed transactions identically. Returns accounts worth tracking
/// balances for, as (pubkey, account_index) pairs.
fn decode_token_instruction(
    ix: &CompiledInstruction,
    account_keys: &[Pubkey],
) -> Option<(serde_json::Value, Vec<(Pubkey, u8)>)> {
    let parsed = TokenInstruction::unpack(&ix.data).ok()?;
    let acc = |i: usize| -> Option<Pubkey> {
        ix.accounts.get(i).and_then(|&idx| account_keys.get(idx as usize)).copied()
    };
    let acc_idx = |i: usize| -> Option<u8> { ix.accounts.get(i).copied() };

    match parsed {
        TokenInstruction::Approve { amount } => {
            let source = acc(0)?;
            let delegate = acc(1)?;
            let owner = acc(2)?;
            let value = serde_json::json!({
                "type": "approve",
                "info": {
                    "source": source.to_string(),
                    "delegate": delegate.to_string(),
                    "owner": owner.to_string(),
                    "amount": amount.to_string(),
                }
            });
            Some((value, vec![(source, acc_idx(0)?)]))
        }
        TokenInstruction::ApproveChecked { amount, decimals } => {
            let source = acc(0)?;
            let delegate = acc(2)?;
            let owner = acc(3)?;
            let value = serde_json::json!({
                "type": "approveChecked",
                "info": {
                    "source": source.to_string(),
                    "delegate": delegate.to_string(),
                    "owner": owner.to_string(),
                    "tokenAmount": { "amount": amount.to_string(), "decimals": decimals },
                }
            });
            Some((value, vec![(source, acc_idx(0)?)]))
        }
        TokenInstruction::SetAuthority { authority_type, new_authority } => {
            let account = acc(0)?;
            let authority_type_str = match authority_type {
                AuthorityType::MintTokens => "MintTokens",
                AuthorityType::FreezeAccount => "FreezeAccount",
                AuthorityType::AccountOwner => "AccountOwner",
                AuthorityType::CloseAccount => "CloseAccount",
            };
            let value = serde_json::json!({
                "type": "setAuthority",
                "info": {
                    "account": account.to_string(),
                    "authorityType": authority_type_str,
                    "newAuthority": Into::<Option<Pubkey>>::into(new_authority).map(|p| p.to_string()),
                }
            });
            Some((value, vec![(account, acc_idx(0)?)]))
        }
        TokenInstruction::Transfer { amount } => {
            let source = acc(0)?;
            let destination = acc(1)?;
            let value = serde_json::json!({
                "type": "transfer",
                "info": {
                    "source": source.to_string(),
                    "destination": destination.to_string(),
                    "amount": amount.to_string(),
                }
            });
            Some((value, vec![(source, acc_idx(0)?), (destination, acc_idx(1)?)]))
        }
        TokenInstruction::TransferChecked { amount, decimals } => {
            let source = acc(0)?;
            let destination = acc(2)?;
            let value = serde_json::json!({
                "type": "transferChecked",
                "info": {
                    "source": source.to_string(),
                    "destination": destination.to_string(),
                    "tokenAmount": { "amount": amount.to_string(), "decimals": decimals },
                }
            });
            Some((value, vec![(source, acc_idx(0)?), (destination, acc_idx(2)?)]))
        }
        _ => None,
    }
}

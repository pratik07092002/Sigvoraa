use crate::rules::{ParsedInstruction, TokenBalance, TxContext};
use solana_transaction_status::{
    option_serializer::OptionSerializer, EncodedConfirmedTransactionWithStatusMeta,
    EncodedTransaction, UiInstruction, UiMessage, UiParsedInstruction, UiTransactionTokenBalance,
};

fn opt<T>(x: OptionSerializer<T>) -> Option<T> {
    match x {
        OptionSerializer::Some(v) => Some(v),
        OptionSerializer::None | OptionSerializer::Skip => None,
    }
}

fn token_balances(balances: Option<Vec<UiTransactionTokenBalance>>, account_keys: &[String]) -> Vec<TokenBalance> {
    balances
        .unwrap_or_default()
        .into_iter()
        .map(|b| TokenBalance {
            account_index: b.account_index,
            account: account_keys.get(b.account_index as usize).cloned(),
            mint: b.mint,
            owner: opt(b.owner),
            amount: b.ui_token_amount.amount.parse().unwrap_or(0),
            decimals: b.ui_token_amount.decimals,
        })
        .collect()
}

pub fn parse_transaction(
    signature: &str,
    confirmed: &EncodedConfirmedTransactionWithStatusMeta,
) -> Option<TxContext> {
    let EncodedTransaction::Json(ui_tx) = &confirmed.transaction.transaction else {
        return None;
    };
    let UiMessage::Parsed(message) = &ui_tx.message else {
        return None;
    };

    let account_keys: Vec<String> = message.account_keys.iter().map(|a| a.pubkey.clone()).collect();
    let fee_payer = account_keys.first().cloned().unwrap_or_default();

    let instructions = message
        .instructions
        .iter()
        .filter_map(|ix| match ix {
            UiInstruction::Parsed(UiParsedInstruction::Parsed(p)) => Some(ParsedInstruction {
                program: p.program.clone(),
                program_id: p.program_id.clone(),
                parsed: Some(p.parsed.clone()),
            }),
            UiInstruction::Parsed(UiParsedInstruction::PartiallyDecoded(p)) => Some(ParsedInstruction {
                program: "unknown".to_string(),
                program_id: p.program_id.clone(),
                parsed: None,
            }),
            UiInstruction::Compiled(_) => None,
        })
        .collect();

    let meta = confirmed.transaction.meta.as_ref();
    let success = meta.map(|m| m.err.is_none()).unwrap_or(false);
    let pre_token_balances = token_balances(meta.and_then(|m| opt(m.pre_token_balances.clone())), &account_keys);
    let post_token_balances = token_balances(meta.and_then(|m| opt(m.post_token_balances.clone())), &account_keys);

    Some(TxContext {
        signature: signature.to_string(),
        slot: confirmed.slot,
        block_time: confirmed.block_time,
        fee_payer,
        success,
        account_keys,
        instructions,
        pre_token_balances,
        post_token_balances,
        flagged_accounts: vec![],
    })
}

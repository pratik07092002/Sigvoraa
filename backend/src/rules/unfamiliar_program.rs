use super::{Finding, Rule, TxContext};
use std::collections::HashSet;

// Heuristic allowlist, not a program-age check (the spec's "fresh program
// deploy" signal would need a lookup of each ProgramData account's creation
// slot; this cheaper proxy flags any program we don't already recognize).
const KNOWN_PROGRAMS: &[&str] = &[
    "11111111111111111111111111111111", // System Program
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", // SPL Token
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", // SPL Token-2022
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", // Associated Token Account
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr", // Memo
    "ComputeBudget111111111111111111111111111111", // Compute Budget
    "Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU", // SentinelMesh Threat Registry
];

pub struct UnfamiliarProgramRule;

impl Rule for UnfamiliarProgramRule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding> {
        let known: HashSet<&str> = KNOWN_PROGRAMS.iter().copied().collect();
        let mut unfamiliar: Vec<&str> = ctx
            .instructions
            .iter()
            .map(|ix| ix.program_id.as_str())
            .filter(|id| !known.contains(id))
            .collect();
        unfamiliar.sort_unstable();
        unfamiliar.dedup();

        if unfamiliar.is_empty() {
            return None;
        }

        Some(Finding {
            rule_id: "unfamiliar_program_interaction",
            severity: 40,
            target_address: Some(ctx.fee_payer.clone()),
            explanation: format!(
                "Transaction calls program(s) not on our known-good list: {}",
                unfamiliar.join(", ")
            ),
        })
    }
}

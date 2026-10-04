use super::{Finding, Rule, TxContext};

pub struct KnownBadAddressRule;

impl Rule for KnownBadAddressRule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding> {
        if ctx.flagged_accounts.is_empty() {
            return None;
        }
        Some(Finding {
            rule_id: "known_bad_address_interaction",
            severity: 95,
            target_address: ctx.flagged_accounts.first().cloned(),
            explanation: format!(
                "Transaction involves already-flagged address(es): {}",
                ctx.flagged_accounts.join(", ")
            ),
        })
    }
}

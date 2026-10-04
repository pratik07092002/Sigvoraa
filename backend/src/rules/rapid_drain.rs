use super::{Finding, Rule, TxContext};

const MIN_DRAINED_ACCOUNTS: usize = 2;

pub struct RapidMultiTokenDrainRule;

impl Rule for RapidMultiTokenDrainRule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding> {
        let mut drained = Vec::new();
        for pre in &ctx.pre_token_balances {
            if pre.amount == 0 {
                continue;
            }
            let went_to_zero = ctx
                .post_token_balances
                .iter()
                .find(|post| post.account_index == pre.account_index)
                .map(|post| post.amount == 0)
                .unwrap_or(false);
            if went_to_zero {
                drained.push(pre.account.clone().unwrap_or_else(|| pre.mint.clone()));
            }
        }

        if drained.len() >= MIN_DRAINED_ACCOUNTS {
            let severity = (50 + drained.len() * 15).min(100) as u8;
            return Some(Finding {
                rule_id: "rapid_multi_token_drain",
                severity,
                target_address: Some(ctx.fee_payer.clone()),
                explanation: format!(
                    "{} token accounts were drained to zero in a single transaction: {}",
                    drained.len(),
                    drained.join(", ")
                ),
            });
        }
        None
    }
}

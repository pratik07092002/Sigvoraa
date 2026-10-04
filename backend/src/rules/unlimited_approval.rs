use super::{Finding, Rule, TxContext};

const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SPL_TOKEN_2022_PROGRAM: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const NEAR_MAX_U64: u64 = u64::MAX / 2;

pub struct UnlimitedDelegateApprovalRule;

impl Rule for UnlimitedDelegateApprovalRule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding> {
        for ix in &ctx.instructions {
            if ix.program_id != SPL_TOKEN_PROGRAM && ix.program_id != SPL_TOKEN_2022_PROGRAM {
                continue;
            }
            let Some(parsed) = &ix.parsed else { continue };
            let ty = parsed.get("type").and_then(|v| v.as_str()).unwrap_or("");
            if ty != "approve" && ty != "approveChecked" {
                continue;
            }
            let info = parsed.get("info")?;
            let source = info.get("source").and_then(|v| v.as_str())?;
            let delegate = info.get("delegate").and_then(|v| v.as_str()).unwrap_or("unknown");

            let amount: u64 = if ty == "approveChecked" {
                info.get("tokenAmount")
                    .and_then(|t| t.get("amount"))
                    .and_then(|v| v.as_str())
                    .and_then(|s| s.parse().ok())?
            } else {
                info.get("amount")
                    .and_then(|v| v.as_str())
                    .and_then(|s| s.parse().ok())?
            };

            if amount >= NEAR_MAX_U64 {
                return Some(Finding {
                    rule_id: "unlimited_delegate_approval",
                    severity: 85,
                    target_address: Some(source.to_string()),
                    explanation: format!(
                        "Token account {source} approved an unlimited-style amount ({amount}) to delegate {delegate}"
                    ),
                });
            }

            let full_balance = ctx
                .pre_token_balances
                .iter()
                .find(|b| b.account.as_deref() == Some(source))
                .map(|b| b.amount);
            if let Some(balance) = full_balance {
                if balance > 0 && amount == balance {
                    return Some(Finding {
                        rule_id: "unlimited_delegate_approval",
                        severity: 70,
                        target_address: Some(source.to_string()),
                        explanation: format!(
                            "Token account {source} approved its entire balance ({amount}) to delegate {delegate}"
                        ),
                    });
                }
            }
        }
        None
    }
}

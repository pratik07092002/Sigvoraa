use super::{Finding, Rule, TxContext};

const SPL_TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const SPL_TOKEN_2022_PROGRAM: &str = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

pub struct AuthorityChangeRule;

impl Rule for AuthorityChangeRule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding> {
        for ix in &ctx.instructions {
            if ix.program_id != SPL_TOKEN_PROGRAM && ix.program_id != SPL_TOKEN_2022_PROGRAM {
                continue;
            }
            let Some(parsed) = &ix.parsed else { continue };
            if parsed.get("type").and_then(|v| v.as_str()) != Some("setAuthority") {
                continue;
            }
            let info = parsed.get("info")?;
            let authority_type = info.get("authorityType").and_then(|v| v.as_str())?;
            if authority_type != "AccountOwner" {
                continue;
            }
            let account = info.get("account").and_then(|v| v.as_str())?;
            let new_authority = info.get("newAuthority").and_then(|v| v.as_str());

            if let Some(new_authority) = new_authority {
                return Some(Finding {
                    rule_id: "authority_change",
                    severity: 90,
                    target_address: Some(account.to_string()),
                    explanation: format!(
                        "Token account {account} had its owner authority transferred to {new_authority}"
                    ),
                });
            }
        }
        None
    }
}

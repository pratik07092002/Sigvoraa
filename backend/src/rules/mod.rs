mod authority_change;
mod known_bad_address;
mod rapid_drain;
mod unfamiliar_program;
mod unlimited_approval;

#[derive(Debug, Clone)]
pub struct ParsedInstruction {
    /// Kept for debugging/future rules even though no current rule reads it.
    #[allow(dead_code)]
    pub program: String,
    pub program_id: String,
    pub parsed: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct TokenBalance {
    pub account_index: u8,
    pub account: Option<String>,
    pub mint: String,
    /// Kept for debugging/future rules even though no current rule reads it.
    #[allow(dead_code)]
    pub owner: Option<String>,
    pub amount: u64,
    #[allow(dead_code)]
    pub decimals: u8,
}

#[derive(Debug, Clone, Default)]
pub struct TxContext {
    pub signature: String,
    pub slot: u64,
    pub block_time: Option<i64>,
    pub fee_payer: String,
    pub success: bool,
    pub account_keys: Vec<String>,
    pub instructions: Vec<ParsedInstruction>,
    pub pre_token_balances: Vec<TokenBalance>,
    pub post_token_balances: Vec<TokenBalance>,
    /// Account keys from this tx that already exist in `flagged_addresses`,
    /// looked up once by the indexer before rules run.
    pub flagged_accounts: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct Finding {
    pub rule_id: &'static str,
    pub severity: u8,
    pub target_address: Option<String>,
    pub explanation: String,
}

pub trait Rule: Send + Sync {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding>;
}

pub fn all_rules() -> Vec<Box<dyn Rule>> {
    vec![
        Box::new(unlimited_approval::UnlimitedDelegateApprovalRule),
        Box::new(authority_change::AuthorityChangeRule),
        Box::new(rapid_drain::RapidMultiTokenDrainRule),
        Box::new(unfamiliar_program::UnfamiliarProgramRule),
        Box::new(known_bad_address::KnownBadAddressRule),
    ]
}

pub fn run_all(ctx: &TxContext) -> Vec<Finding> {
    all_rules()
        .iter()
        .filter_map(|rule| rule.evaluate(ctx))
        .collect()
}

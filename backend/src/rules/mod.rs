pub struct TxContext {
    pub signature: String,
}

pub struct Finding {
    pub rule_id: String,
    pub severity: u8,
    pub explanation: String,
}

pub trait Rule {
    fn evaluate(&self, ctx: &TxContext) -> Option<Finding>;
}

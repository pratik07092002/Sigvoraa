use anchor_lang::prelude::*;

declare_id!("Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU");

// Phase 1 placeholder: accounts/instructions for the real Threat Registry
// (RegistryConfig, Reporter, ThreatEntry, report_threat, etc.) land in Phase 2.
#[program]
pub mod threat_registry {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("SentinelMesh Threat Registry: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

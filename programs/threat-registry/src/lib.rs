use anchor_lang::prelude::*;

declare_id!("Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU");

const CONFIG_SEED: &[u8] = b"config";
const REPORTER_SEED: &[u8] = b"reporter";
const THREAT_SEED: &[u8] = b"threat";

#[program]
pub mod threat_registry {
    use super::*;

    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.reporter_count = 0;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn add_reporter(ctx: Context<AddReporter>, new_reporter: Pubkey) -> Result<()> {
        let reporter_account = &mut ctx.accounts.reporter_account;
        reporter_account.reporter = new_reporter;
        reporter_account.reputation = 0;
        reporter_account.bump = ctx.bumps.reporter_account;

        let config = &mut ctx.accounts.config;
        config.reporter_count = config
            .reporter_count
            .checked_add(1)
            .ok_or(ThreatRegistryError::ReporterCountOverflow)?;
        Ok(())
    }

    pub fn remove_reporter(ctx: Context<RemoveReporter>, reporter: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.reporter_count = config
            .reporter_count
            .checked_sub(1)
            .ok_or(ThreatRegistryError::ReporterCountOverflow)?;
        let _ = reporter;
        Ok(())
    }

    pub fn report_threat(
        ctx: Context<ReportThreat>,
        target: Pubkey,
        category: ThreatCategory,
        severity: u8,
        evidence_hash: [u8; 32],
    ) -> Result<()> {
        require!(severity <= 100, ThreatRegistryError::InvalidSeverity);

        let threat_entry = &mut ctx.accounts.threat_entry;
        threat_entry.target = target;
        threat_entry.category = category;
        threat_entry.severity = severity;
        threat_entry.evidence_hash = evidence_hash;
        threat_entry.reporter = ctx.accounts.reporter.key();
        threat_entry.created_at = Clock::get()?.unix_timestamp;
        threat_entry.status = ThreatStatus::Active;
        threat_entry.bump = ctx.bumps.threat_entry;
        Ok(())
    }

    // No staking yet (spec lists this as an optional stretch goal) — anyone
    // can flag an active entry as disputed pending reporter/authority review.
    pub fn dispute_threat(ctx: Context<DisputeThreat>, target: Pubkey) -> Result<()> {
        let _ = target;
        let threat_entry = &mut ctx.accounts.threat_entry;
        require!(
            threat_entry.status == ThreatStatus::Active,
            ThreatRegistryError::InvalidStatus
        );
        threat_entry.status = ThreatStatus::Disputed;
        Ok(())
    }

    pub fn clear_threat(ctx: Context<ClearThreat>, target: Pubkey) -> Result<()> {
        let _ = target;
        let threat_entry = &mut ctx.accounts.threat_entry;
        let signer_key = ctx.accounts.signer.key();
        require!(
            signer_key == ctx.accounts.config.authority || signer_key == threat_entry.reporter,
            ThreatRegistryError::Unauthorized
        );
        threat_entry.status = ThreatStatus::Cleared;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct RegistryConfig {
    pub authority: Pubkey,
    pub reporter_count: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Reporter {
    pub reporter: Pubkey,
    pub reputation: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ThreatEntry {
    pub target: Pubkey,
    pub category: ThreatCategory,
    pub severity: u8,
    pub evidence_hash: [u8; 32],
    pub reporter: Pubkey,
    pub created_at: i64,
    pub status: ThreatStatus,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq)]
pub enum ThreatCategory {
    Drainer,
    RugPull,
    MaliciousProgram,
    Phishing,
    Other,
}

#[derive(AnchorSerialize, AnchorDeserialize, InitSpace, Clone, Copy, PartialEq, Eq)]
pub enum ThreatStatus {
    Active,
    Disputed,
    Cleared,
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + RegistryConfig::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(new_reporter: Pubkey)]
pub struct AddReporter<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ThreatRegistryError::Unauthorized
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        init,
        payer = authority,
        space = 8 + Reporter::INIT_SPACE,
        seeds = [REPORTER_SEED, new_reporter.as_ref()],
        bump
    )]
    pub reporter_account: Account<'info, Reporter>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(reporter: Pubkey)]
pub struct RemoveReporter<'info> {
    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ThreatRegistryError::Unauthorized
    )]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [REPORTER_SEED, reporter.as_ref()],
        bump = reporter_account.bump,
        close = authority
    )]
    pub reporter_account: Account<'info, Reporter>,

    #[account(mut)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct ReportThreat<'info> {
    #[account(
        init,
        payer = reporter,
        space = 8 + ThreatEntry::INIT_SPACE,
        seeds = [THREAT_SEED, target.as_ref()],
        bump
    )]
    pub threat_entry: Account<'info, ThreatEntry>,

    #[account(
        seeds = [REPORTER_SEED, reporter.key().as_ref()],
        bump = reporter_account.bump,
        constraint = reporter_account.reporter == reporter.key() @ ThreatRegistryError::Unauthorized
    )]
    pub reporter_account: Account<'info, Reporter>,

    #[account(mut)]
    pub reporter: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct DisputeThreat<'info> {
    #[account(
        mut,
        seeds = [THREAT_SEED, target.as_ref()],
        bump = threat_entry.bump
    )]
    pub threat_entry: Account<'info, ThreatEntry>,

    pub disputer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(target: Pubkey)]
pub struct ClearThreat<'info> {
    #[account(seeds = [CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, RegistryConfig>,

    #[account(
        mut,
        seeds = [THREAT_SEED, target.as_ref()],
        bump = threat_entry.bump
    )]
    pub threat_entry: Account<'info, ThreatEntry>,

    pub signer: Signer<'info>,
}

#[error_code]
pub enum ThreatRegistryError {
    #[msg("Only the registry authority can perform this action")]
    Unauthorized,
    #[msg("Reporter count overflow")]
    ReporterCountOverflow,
    #[msg("Severity must be between 0 and 100")]
    InvalidSeverity,
    #[msg("Threat entry is not in the expected status for this action")]
    InvalidStatus,
}

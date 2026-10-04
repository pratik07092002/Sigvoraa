use anyhow::{anyhow, Context};
use solana_client::nonblocking::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    instruction::{AccountMeta, Instruction},
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    signer::keypair::read_keypair_file,
    transaction::Transaction,
};
use std::str::FromStr;

const PROGRAM_ID: &str = "Cy4jqUsSnq2Z9rK2Lv7FtkkdziXN7ZBRNGKC5edkbnBU";
const SYSTEM_PROGRAM_ID: &str = "11111111111111111111111111111111";
const REPORT_THREAT_DISCRIMINATOR: [u8; 8] = [248, 73, 90, 46, 239, 83, 2, 61];

#[derive(Clone, Copy, Debug)]
pub enum ThreatCategory {
    Drainer,
    RugPull,
    MaliciousProgram,
    Phishing,
    Other,
}

impl ThreatCategory {
    fn discriminant(self) -> u8 {
        match self {
            ThreatCategory::Drainer => 0,
            ThreatCategory::RugPull => 1,
            ThreatCategory::MaliciousProgram => 2,
            ThreatCategory::Phishing => 3,
            ThreatCategory::Other => 4,
        }
    }

    pub fn as_str(self) -> &'static str {
        match self {
            ThreatCategory::Drainer => "drainer",
            ThreatCategory::RugPull => "rug_pull",
            ThreatCategory::MaliciousProgram => "malicious_program",
            ThreatCategory::Phishing => "phishing",
            ThreatCategory::Other => "other",
        }
    }

    /// Best-effort mapping from a rules-engine finding to an on-chain category.
    pub fn from_rule_id(rule_id: &str) -> Self {
        match rule_id {
            "unlimited_delegate_approval" | "authority_change" | "rapid_multi_token_drain" => ThreatCategory::Drainer,
            "unfamiliar_program_interaction" => ThreatCategory::MaliciousProgram,
            _ => ThreatCategory::Other,
        }
    }
}

pub struct RegistryClient {
    rpc: RpcClient,
    reporter: Keypair,
    program_id: Pubkey,
    system_program_id: Pubkey,
}

impl RegistryClient {
    pub fn from_env(rpc_url: String) -> anyhow::Result<Self> {
        let path = std::env::var("REPORTER_KEYPAIR_PATH").context("REPORTER_KEYPAIR_PATH not set")?;
        let reporter =
            read_keypair_file(&path).map_err(|err| anyhow!("failed to read reporter keypair at {path}: {err}"))?;
        Ok(Self {
            rpc: RpcClient::new(rpc_url),
            reporter,
            program_id: Pubkey::from_str(PROGRAM_ID)?,
            system_program_id: Pubkey::from_str(SYSTEM_PROGRAM_ID)?,
        })
    }

    pub fn reporter_pubkey(&self) -> Pubkey {
        self.reporter.pubkey()
    }

    /// Reports a target to the on-chain registry. The program's
    /// ThreatEntry PDA is `init`-only (one entry per target forever), so a
    /// target that's already been reported -- by any rule, any reporter --
    /// can't be `init`ed again. Rather than let that surface as a raw
    /// "account already in use" transaction failure, we check first and
    /// treat an existing entry as success: the thing the caller actually
    /// wants (this target being on the registry) is already true.
    pub async fn report_threat(
        &self,
        target: Pubkey,
        category: ThreatCategory,
        severity: u8,
        evidence_hash: [u8; 32],
    ) -> anyhow::Result<ReportOutcome> {
        let (threat_entry, _) = Pubkey::find_program_address(&[b"threat", target.as_ref()], &self.program_id);
        let (reporter_account, _) =
            Pubkey::find_program_address(&[b"reporter", self.reporter.pubkey().as_ref()], &self.program_id);

        let existing = self
            .rpc
            .get_account_with_commitment(&threat_entry, CommitmentConfig::confirmed())
            .await?;
        if existing.value.is_some() {
            return Ok(ReportOutcome::AlreadyOnChain { threat_entry });
        }

        let mut data = REPORT_THREAT_DISCRIMINATOR.to_vec();
        data.extend_from_slice(target.as_ref());
        data.push(category.discriminant());
        data.push(severity);
        data.extend_from_slice(&evidence_hash);

        let ix = Instruction {
            program_id: self.program_id,
            accounts: vec![
                AccountMeta::new(threat_entry, false),
                AccountMeta::new_readonly(reporter_account, false),
                AccountMeta::new(self.reporter.pubkey(), true),
                AccountMeta::new_readonly(self.system_program_id, false),
            ],
            data,
        };

        let blockhash = self.rpc.get_latest_blockhash().await?;
        let tx =
            Transaction::new_signed_with_payer(&[ix], Some(&self.reporter.pubkey()), &[&self.reporter], blockhash);
        let signature = self.rpc.send_and_confirm_transaction(&tx).await?;
        Ok(ReportOutcome::Created { signature: signature.to_string(), threat_entry })
    }
}

pub enum ReportOutcome {
    Created { signature: String, threat_entry: Pubkey },
    AlreadyOnChain { threat_entry: Pubkey },
}

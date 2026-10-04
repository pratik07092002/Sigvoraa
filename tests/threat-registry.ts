import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ThreatRegistry } from "../target/types/threat_registry";
import { assert } from "chai";

describe("threat-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ThreatRegistry as Program<ThreatRegistry>;
  const authority = provider.wallet as anchor.Wallet;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const reporterKeypair = Keypair.generate();
  const [reporterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("reporter"), reporterKeypair.publicKey.toBuffer()],
    program.programId
  );

  const target = Keypair.generate().publicKey;
  const [threatPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("threat"), target.toBuffer()],
    program.programId
  );

  const evidenceHash = new Array(32).fill(7);

  async function fund(to: PublicKey, lamports: number) {
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({ fromPubkey: authority.publicKey, toPubkey: to, lamports })
    );
    await provider.sendAndConfirm(tx);
  }

  before(async () => {
    await fund(reporterKeypair.publicKey, 0.5 * LAMPORTS_PER_SOL);
  });

  it("initializes the registry", async () => {
    await program.methods
      .initializeRegistry()
      .accounts({
        config: configPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const config = await program.account.registryConfig.fetch(configPda);
    assert.equal(config.authority.toBase58(), authority.publicKey.toBase58());
    assert.equal(config.reporterCount, 0);
  });

  it("adds a reporter", async () => {
    await program.methods
      .addReporter(reporterKeypair.publicKey)
      .accounts({
        config: configPda,
        reporterAccount: reporterPda,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const reporter = await program.account.reporter.fetch(reporterPda);
    assert.equal(reporter.reporter.toBase58(), reporterKeypair.publicKey.toBase58());

    const config = await program.account.registryConfig.fetch(configPda);
    assert.equal(config.reporterCount, 1);
  });

  it("reports a threat", async () => {
    await program.methods
      .reportThreat(target, { drainer: {} }, 90, evidenceHash)
      .accounts({
        threatEntry: threatPda,
        reporterAccount: reporterPda,
        reporter: reporterKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([reporterKeypair])
      .rpc();

    const entry = await program.account.threatEntry.fetch(threatPda);
    assert.equal(entry.target.toBase58(), target.toBase58());
    assert.equal(entry.severity, 90);
    assert.deepEqual(entry.status, { active: {} });
  });

  it("rejects an out-of-range severity", async () => {
    const otherTarget = Keypair.generate().publicKey;
    const [otherThreatPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("threat"), otherTarget.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .reportThreat(otherTarget, { phishing: {} }, 101, evidenceHash)
        .accounts({
          threatEntry: otherThreatPda,
          reporterAccount: reporterPda,
          reporter: reporterKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([reporterKeypair])
        .rpc();
      assert.fail("expected InvalidSeverity error");
    } catch (err) {
      assert.include(err.toString(), "InvalidSeverity");
    }
  });

  it("disputes the threat", async () => {
    const disputer = Keypair.generate();
    await fund(disputer.publicKey, 0.1 * LAMPORTS_PER_SOL);

    await program.methods
      .disputeThreat(target)
      .accounts({
        threatEntry: threatPda,
        disputer: disputer.publicKey,
      })
      .signers([disputer])
      .rpc();

    const entry = await program.account.threatEntry.fetch(threatPda);
    assert.deepEqual(entry.status, { disputed: {} });
  });

  it("clears the threat as authority", async () => {
    await program.methods
      .clearThreat(target)
      .accounts({
        config: configPda,
        threatEntry: threatPda,
        signer: authority.publicKey,
      })
      .rpc();

    const entry = await program.account.threatEntry.fetch(threatPda);
    assert.deepEqual(entry.status, { cleared: {} });
  });

  it("removes the reporter", async () => {
    await program.methods
      .removeReporter(reporterKeypair.publicKey)
      .accounts({
        config: configPda,
        reporterAccount: reporterPda,
        authority: authority.publicKey,
      })
      .rpc();

    const config = await program.account.registryConfig.fetch(configPda);
    assert.equal(config.reporterCount, 0);

    const closed = await provider.connection.getAccountInfo(reporterPda);
    assert.isNull(closed);
  });
});

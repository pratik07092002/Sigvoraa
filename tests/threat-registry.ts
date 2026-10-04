import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ThreatRegistry } from "../target/types/threat_registry";
import { assert } from "chai";

describe("threat-registry", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ThreatRegistry as Program<ThreatRegistry>;

  it("initializes", async () => {
    const tx = await program.methods.initialize().rpc();
    assert.isString(tx);
  });
});

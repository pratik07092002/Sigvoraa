import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../idl/threat_registry.json";
import type { ThreatRegistry } from "../idl/threat_registry";

const DEVNET_EXPLORER = (address: string) => `https://explorer.solana.com/address/${address}?cluster=devnet`;

// Reads only, so a provider with a dummy wallet is enough -- nothing here
// ever needs to sign.
function readOnlyProgram(connection: Connection) {
  const dummyWallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("read-only provider cannot sign");
    },
    signAllTransactions: async () => {
      throw new Error("read-only provider cannot sign");
    },
  };
  const provider = new AnchorProvider(connection, dummyWallet as never, {});
  return new Program<ThreatRegistry>(idl as ThreatRegistry, provider);
}

export interface ThreatEntryRow {
  pubkey: string;
  target: string;
  category: string;
  severity: number;
  reporter: string;
  createdAt: number;
  status: string;
  explorerUrl: string;
}

export async function fetchThreatEntries(connection: Connection): Promise<ThreatEntryRow[]> {
  const program = readOnlyProgram(connection);
  const entries = await program.account.threatEntry.all();
  return entries
    .map((e) => ({
      pubkey: e.publicKey.toBase58(),
      target: e.account.target.toBase58(),
      category: Object.keys(e.account.category)[0] ?? "unknown",
      severity: e.account.severity,
      reporter: e.account.reporter.toBase58(),
      createdAt: e.account.createdAt.toNumber(),
      status: Object.keys(e.account.status)[0] ?? "unknown",
      explorerUrl: DEVNET_EXPLORER(e.publicKey.toBase58()),
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

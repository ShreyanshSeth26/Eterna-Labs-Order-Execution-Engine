import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { env } from "../utils/env";
import { Quote } from "../services/router";
import { log } from "../utils/logger";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");
let memoized: Keypair | null = null;

function fromEnv(): Keypair | null {
  if (env.SOLANA_KEYPAIR_B58?.trim()) try { return Keypair.fromSecretKey(bs58.decode(env.SOLANA_KEYPAIR_B58.trim())); } catch {}
  if (env.SOLANA_KEYPAIR_JSON?.trim()) try { return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(env.SOLANA_KEYPAIR_JSON))); } catch {}
  return null;
}
function getKeypair(): Keypair {
  if (memoized) return memoized;
  memoized = fromEnv() ?? Keypair.generate();
  if (!fromEnv()) log.warn({ pubkey: memoized.publicKey.toBase58() }, "DEVNET_MODE: generated ephemeral keypair");
  return memoized;
}
async function ensureAirdrop(conn: Connection, pubkey: PublicKey) {
  const bal = await conn.getBalance(pubkey);
  if (bal >= 0.2*1e9) return;
  try { const sig = await conn.requestAirdrop(pubkey, 1e9); await conn.confirmTransaction(sig, "confirmed"); log.info({ pubkey: pubkey.toBase58(), sig }, "airdrop 1 SOL ok"); }
  catch (e) { log.warn({ err: String(e) }, "airdrop failed (maybe rate-limited)"); }
}
export async function executeSwapDevnet(orderId: string, quote: Quote): Promise<{ txHash: string; executedPrice: number }> {
  const conn = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const kp = getKeypair();
  await ensureAirdrop(conn, kp.publicKey);
  const memoIx = new TransactionInstruction({ keys: [], programId: MEMO_PROGRAM_ID, data: Buffer.from(`orderId=${orderId};dex=${quote.dex};ts=${Date.now()}`,"utf8") });
  const tx = new Transaction().add(memoIx); tx.feePayer = kp.publicKey;
  const sig = await sendAndConfirmTransaction(conn, tx, [kp], { commitment: "confirmed" });
  return { txHash: sig, executedPrice: quote.price };
}

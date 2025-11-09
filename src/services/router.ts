import { env } from "../utils/env";

export type Quote = { dex: "raydium" | "meteora"; price: number; fee: number };
export type Pick = { chosen: Quote; other: Quote; reason: string };

const BASE_PRICE = 100;

function jitter(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function getRaydiumQuote(_: string, __: string, ___: number): Promise<Quote> {
  await delay(200);
  const price = BASE_PRICE * (0.98 + Math.random() * 0.04);
  return { dex: "raydium", price, fee: 0.003 };
}

export async function getMeteoraQuote(_: string, __: string, ___: number): Promise<Quote> {
  await delay(200);
  const price = BASE_PRICE * (0.97 + Math.random() * 0.05);
  return { dex: "meteora", price, fee: 0.002 };
}

export function effective(price: number, fee: number) {
  return price * (1 + fee);
}

export async function pickBestVenue(
  baseMint: string,
  quoteMint: string,
  amountIn: number
): Promise<Pick> {
  const [r, m] = await Promise.all([
    getRaydiumQuote(baseMint, quoteMint, amountIn),
    getMeteoraQuote(baseMint, quoteMint, amountIn),
  ]);
  const er = effective(r.price, r.fee);
  const em = effective(m.price, m.fee);
  if (er < em) return { chosen: r, other: m, reason: `better net price ${er.toFixed(4)} < ${em.toFixed(4)}` };
  if (em < er) return { chosen: m, other: r, reason: `better net price ${em.toFixed(4)} < ${er.toFixed(4)}` };
  return { chosen: { ...m }, other: r, reason: "tie → prefer lower fee (meteora)" };
}

export async function executeSwapMock(_: Quote): Promise<{ txHash: string; executedPrice: number }> {
  const ms = jitter(env.SUBMIT_DELAY_MS_MIN, env.SUBMIT_DELAY_MS_MAX);
  await delay(ms);
  const executedPrice = BASE_PRICE * (0.99 + Math.random() * 0.02);
  const txHash = "mock-" + Math.random().toString(36).slice(2, 10);
  return { txHash, executedPrice };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

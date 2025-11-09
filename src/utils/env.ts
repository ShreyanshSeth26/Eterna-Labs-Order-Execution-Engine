import "dotenv/config";

function must(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env ${name}`);
  return v;
}
function num(name: string, fb: number) {
  const v = Number(process.env[name] ?? fb);
  if (Number.isNaN(v)) throw new Error(`Bad number for ${name}`);
  return v;
}

export const env = {
  PORT: num("PORT", 3000),
  DATABASE_URL: must("DATABASE_URL"),
  REDIS_URL: must("REDIS_URL"),
  WS_HEARTBEAT_MS: num("WS_HEARTBEAT_MS", 15000),
  QUEUE_CONCURRENCY: num("QUEUE_CONCURRENCY", 10),

  ROUTING_DELAY_MS_MIN: num("ROUTING_DELAY_MS_MIN", 150),
  ROUTING_DELAY_MS_MAX: num("ROUTING_DELAY_MS_MAX", 300),
  BUILD_DELAY_MS_MIN: num("BUILD_DELAY_MS_MIN", 200),
  BUILD_DELAY_MS_MAX: num("BUILD_DELAY_MS_MAX", 500),
  SUBMIT_DELAY_MS_MIN: num("SUBMIT_DELAY_MS_MIN", 2000),
  SUBMIT_DELAY_MS_MAX: num("SUBMIT_DELAY_MS_MAX", 3000),

  RATE_LIMIT_PER_MIN: num("RATE_LIMIT_PER_MIN", 100),
  IDEMPOTENCY_TTL_SEC: num("IDEMPOTENCY_TTL_SEC", 600),

  // --- devnet mode ---
  DEVNET_MODE: (process.env.DEVNET_MODE === "true"),
  SOLANA_RPC_URL: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
  SOLANA_KEYPAIR_B58: process.env.SOLANA_KEYPAIR_B58,
  SOLANA_KEYPAIR_JSON: process.env.SOLANA_KEYPAIR_JSON,
};

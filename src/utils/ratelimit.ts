import { redis } from "./redis";
import { env } from "./env";

export async function allowOrderNow(): Promise<boolean> {
  const key = "rl:orders:" + Math.floor(Date.now() / 60000);
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 61);
  return n <= env.RATE_LIMIT_PER_MIN;
}

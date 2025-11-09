import { FastifyInstance } from "fastify";
import { z } from "zod";
import { repo } from "../db/repo";
import { newId } from "../utils/ids";
import { orderQueue } from "../queue/queue";
import { allowOrderNow } from "../utils/ratelimit";
import { redis } from "../utils/redis";
import { log } from "../utils/logger";

export const OrderSchema = z.object({
  type: z.literal("market"),
  baseMint: z.string().min(1),
  quoteMint: z.string().min(1),
  side: z.enum(["buy", "sell"]),
  amountIn: z.union([z.string(), z.number()]),
});

export default async function routes(f: FastifyInstance) {
  f.post("/api/orders/execute", async (req, reply) => {
    const body = OrderSchema.parse(req.body);

    const idemKey =
      (req.headers["x-idempotency-key"] as string) ||
      (req.headers["idempotency-key"] as string);
    if (idemKey) {
      const existing = await redis.get("idem:" + idemKey);
      if (existing) {
        log.info({ idemKey, orderId: existing }, "idempotent-return");
        return reply.send({ orderId: existing });
      }
    }

    const allowed = await allowOrderNow();
    if (!allowed) {
      return reply.code(429).send({ error: "rate_limited", message: "Too many orders right now. Please retry shortly." });
    }

    const id = newId();
    await repo.insertOrder({
      id,
      type: body.type,
      base_mint: body.baseMint,
      quote_mint: body.quoteMint,
      side: body.side,
      amount_in: Number(body.amountIn),
    });

    await orderQueue.add(
      "execute",
      { orderId: id },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 1000,
      }
    );

    if (idemKey) {
      await redis.setex("idem:" + idemKey, Number(process.env.IDEMPOTENCY_TTL_SEC ?? 600), id);
    }

    return reply.send({ orderId: id });
  });
}

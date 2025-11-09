import { Queue, Worker, Job } from "bullmq";
import { env } from "../utils/env";
import { statusBus } from "../services/statusBus";
import { repo } from "../db/repo";
import { redis as connection } from "../utils/redis";
import { pickBestVenue, executeSwapMock } from "../services/router";
import { executeSwapDevnet } from "../services/devnet";

export const orderQueue = new Queue("orders", { connection });

export function startWorker() {
  const worker = new Worker("orders", async (job: Job) => {
    const { orderId } = job.data as { orderId: string };
    await repo.updateOrderStatus(orderId, "routing"); statusBus.emit(orderId, { status: "routing" });
    await sleep(rand(env.ROUTING_DELAY_MS_MIN, env.ROUTING_DELAY_MS_MAX));
    const pick = await pickBestVenue("base", "quote", 0);
    await repo.updateChosenDex(orderId, pick.chosen.dex);
    statusBus.emit(orderId, { status: "building", chosen_dex: pick.chosen.dex, reason: pick.reason });
    await sleep(rand(env.BUILD_DELAY_MS_MIN, env.BUILD_DELAY_MS_MAX));
    await repo.updateOrderStatus(orderId, "submitted"); statusBus.emit(orderId, { status: "submitted" });

    try {
      const res = env.DEVNET_MODE ? await executeSwapDevnet(orderId, pick.chosen) : await executeSwapMock(pick.chosen);
      await repo.updateOrderStatus(orderId, "confirmed", null, res.txHash);
      statusBus.emit(orderId, { status: "confirmed", txHash: res.txHash, executedPrice: res.executedPrice });
    } catch (e: any) {
      const msg = String(e?.message || e);
      await repo.updateOrderStatus(orderId, "failed", msg);
      statusBus.emit(orderId, { status: "failed", error: msg });
      throw e;
    }
  }, { connection, concurrency: env.QUEUE_CONCURRENCY });

  worker.on("failed", (job, err) => {
    const id = (job?.data as any)?.orderId;
    if (id) statusBus.emit(id, { status: "failed", error: String(err) });
  });
  return worker;
}
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
function rand(a: number, b: number) { return Math.floor(Math.random()*(b-a+1))+a; }

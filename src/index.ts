import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { env } from "./utils/env";
import routes from "./routes/orders";
import wsRoutes from "./routes/ws";
import { startWorker } from "./queue/queue";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(websocket);
  await app.register(routes);
  await app.register(wsRoutes);

  startWorker();

  app.get("/healthz", async () => ({ ok: true }));

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

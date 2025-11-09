import { FastifyInstance } from "fastify";
import { statusBus } from "../services/statusBus";

export default async function wsRoutes(f: FastifyInstance) {
  f.get("/api/orders/execute", { websocket: true }, (conn, req) => {
    const url = new URL(req.raw.url || "", `http://${req.headers.host}`);
    const orderId = url.searchParams.get("orderId");
    if (!orderId) {
      conn.socket.send(JSON.stringify({ error: "missing orderId" }));
      conn.socket.close();
      return;
    }
    const unsubscribe = statusBus.subscribe(orderId, (payload) => {
      conn.socket.send(JSON.stringify({ orderId, ...payload }));
    });
    conn.socket.on("close", () => unsubscribe());
  });
}

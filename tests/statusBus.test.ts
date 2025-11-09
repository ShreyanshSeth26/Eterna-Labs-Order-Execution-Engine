import { statusBus } from "../src/services/statusBus";

test("replays last status to new subscribers", (done) => {
  statusBus.emit("o1", { s: "confirmed" });
  const off = statusBus.subscribe("o1", (p) => {
    expect(p.s).toBe("confirmed");
    off(); done();
  });
});

test("unsubscribe stops further emissions", (done) => {
  let hits = 0;
  const off = statusBus.subscribe("o2", () => { hits++; });
  off();
  statusBus.emit("o2", { s: "x" });
  setTimeout(() => { expect(hits).toBe(0); done(); }, 50);
});

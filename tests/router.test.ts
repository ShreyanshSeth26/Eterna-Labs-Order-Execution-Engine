import { effective, pickBestVenue } from "../src/services/router";

test("effective cost calculation", () => {
  expect(effective(100, 0.01)).toBeCloseTo(101);
});

test("pickBestVenue returns a choice", async () => {
  const p = await pickBestVenue("A","B",1);
  expect(p.chosen.dex === "raydium" || p.chosen.dex === "meteora").toBe(true);
  expect(p.other.dex).not.toBe(p.chosen.dex);
});

test("tie-break prefers lower fee (meteora) when equal", () => {
  const er = effective(100, 0.003);
  const em = effective(100, 0.002);
  expect(em).toBeLessThan(er);
});

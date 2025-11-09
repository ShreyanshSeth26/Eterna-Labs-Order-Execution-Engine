import { getRaydiumQuote, getMeteoraQuote } from "../src/services/router";
test("quotes return within reasonable variance", async () => {
  const r = await getRaydiumQuote("a","b",1);
  const m = await getMeteoraQuote("a","b",1);
  expect(r.price).toBeGreaterThan(90);
  expect(m.price).toBeGreaterThan(90);
});

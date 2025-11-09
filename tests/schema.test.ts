import { OrderSchema } from "../src/routes/orders";

test("valid market order", () => {
  const v = OrderSchema.parse({ type:"market", baseMint:"A", quoteMint:"B", side:"buy", amountIn:1 });
  expect(v.type).toBe("market");
});

test("rejects bad side", () => {
  expect(() => OrderSchema.parse({ type:"market", baseMint:"A", quoteMint:"B", side:"xxx", amountIn:1 }))
    .toThrow();
});

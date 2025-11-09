import { env } from "../src/utils/env";
test("env has sane defaults", () => {
  expect(env.QUEUE_CONCURRENCY).toBeGreaterThan(0);
  expect(env.RATE_LIMIT_PER_MIN).toBeGreaterThan(0);
});

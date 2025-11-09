import { allowOrderNow } from "../src/utils/ratelimit";
test("allowOrderNow is a function", () => {
  expect(typeof allowOrderNow).toBe("function");
});

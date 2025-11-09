import { newId } from "../src/utils/ids";
test("newId returns v4-like uuid", () => {
  const id = newId();
  expect(id).toMatch(/[0-9a-f]{8}-/i);
});

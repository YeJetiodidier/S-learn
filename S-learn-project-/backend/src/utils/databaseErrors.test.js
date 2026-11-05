import test from "node:test";
import assert from "node:assert/strict";
import { isDatabaseUnavailable } from "./databaseErrors.js";

test("recognizes connection timeouts", () => {
  assert.equal(
    isDatabaseUnavailable(new Error("Connection terminated due to connection timeout")),
    true,
  );
});

test("recognizes nested network errors", () => {
  const error = new Error("Connection terminated unexpectedly", {
    cause: Object.assign(new Error("socket reset"), { code: "ECONNRESET" }),
  });
  assert.equal(isDatabaseUnavailable(error), true);
});

test("does not classify SQL errors as connectivity failures", () => {
  assert.equal(
    isDatabaseUnavailable(Object.assign(new Error("relation does not exist"), { code: "42P01" })),
    false,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { isRemoteBackendUsable } from "./backendConfig.js";

test("rejects dead Render hosts", () => {
  assert.equal(isRemoteBackendUsable("https://s-learn-project-1.onrender.com"), false);
});

test("allows local backend URLs", () => {
  assert.equal(isRemoteBackendUsable("http://localhost:5000"), true);
});

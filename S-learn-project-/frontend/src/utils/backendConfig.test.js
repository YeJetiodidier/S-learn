import test from "node:test";
import assert from "node:assert/strict";
import { isRemoteBackendUsable, resolveBackendUrl } from "./backendConfig.js";

test("rejects dead Render hosts", () => {
  assert.equal(isRemoteBackendUsable("https://s-learn-project-1.onrender.com"), false);
});

test("allows local backend URLs", () => {
  assert.equal(isRemoteBackendUsable("http://localhost:5000"), true);
});

test("uses localhost only for local development when the backend URL is unset", () => {
  assert.equal(resolveBackendUrl("", { production: false }), "http://localhost:5000");
  assert.equal(resolveBackendUrl("", { production: true }), null);
});

test("refuses to target a local backend from a production deployment", () => {
  assert.equal(
    resolveBackendUrl("http://localhost:5000", { production: true }),
    null,
  );
});

test("uses a configured remote backend in production", () => {
  assert.equal(
    resolveBackendUrl("https://api.example.com/", { production: true }),
    "https://api.example.com",
  );
});

test("does not fall back to localhost for a dead Render backend in production", () => {
  assert.equal(
    resolveBackendUrl("https://s-learn-project-1.onrender.com", { production: true }),
    null,
  );
});

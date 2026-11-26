import assert from "node:assert/strict";
import test from "node:test";
import { getFriendlyErrorMessage } from "./friendlyError.js";

test("maps network fetch failures to a friendly message", () => {
  assert.equal(
    getFriendlyErrorMessage(new TypeError("Failed to fetch")),
    "We couldn't connect to the server. Please check your internet connection and try again.",
  );
});

test("hides raw SQL and HTML errors behind the fallback message", () => {
  assert.equal(
    getFriendlyErrorMessage(
      new Error('relation "schedule_items" does not exist'),
      "Could not load your schedule.",
    ),
    "Could not load your schedule.",
  );
  assert.equal(
    getFriendlyErrorMessage(
      new Error("<!DOCTYPE html><html><body>502 Bad Gateway</body></html>"),
      "Could not complete your request.",
    ),
    "Could not complete your request.",
  );
});

test("maps technical upload and deployment errors cleanly", () => {
  assert.equal(
    getFriendlyErrorMessage(new Error("Vercel Blob: Failed to retrieve the client token")),
    "We couldn't upload that file. Please check the file format and size, then try again.",
  );
  assert.equal(
    getFriendlyErrorMessage(
      new Error("Set VITE_BACKEND_URL to your deployed backend URL in Vercel"),
    ),
    "The service is temporarily unavailable. Please try again in a moment.",
  );
});

test("preserves clean validation messages", () => {
  assert.equal(
    getFriendlyErrorMessage(new Error("Please enter both a title and a message for the update.")),
    "Please enter both a title and a message for the update.",
  );
});

test("maps Firebase auth errors cleanly", () => {
  assert.equal(
    getFriendlyErrorMessage({ code: "auth/wrong-password" }),
    "Invalid email or password.",
  );
});

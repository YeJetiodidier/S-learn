import assert from "node:assert/strict";
import test from "node:test";
import {
  detectInstallPlatform,
  isRunningStandalone,
  getManualInstallSteps,
} from "./installHelper.js";

test("detects iOS, Android, and desktop user agents", () => {
  assert.equal(
    detectInstallPlatform({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    }),
    "ios",
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      maxTouchPoints: 5,
    }),
    "ios",
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/125.0.0.0 Mobile",
    }),
    "android",
  );
  assert.equal(
    detectInstallPlatform({
      userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/125.0.0.0",
    }),
    "desktop",
  );
});

test("detects standalone PWA mode across iOS and standard browsers", () => {
  assert.equal(isRunningStandalone({ standalone: true, matchMedia: null }), true);
  assert.equal(
    isRunningStandalone({
      standalone: false,
      matchMedia: () => ({ matches: true }),
    }),
    true,
  );
  assert.equal(
    isRunningStandalone({
      standalone: false,
      matchMedia: () => ({ matches: false }),
    }),
    false,
  );
});

test("returns tailored manual install instructions per platform", () => {
  assert.match(getManualInstallSteps("ios").heading, /iPhone/i);
  assert.match(getManualInstallSteps("android").heading, /Android/i);
  assert.ok(getManualInstallSteps("desktop").steps.length >= 2);
});

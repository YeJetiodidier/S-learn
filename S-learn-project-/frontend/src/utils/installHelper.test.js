import assert from "node:assert/strict";
import test from "node:test";
import {
  detectInstallPlatform,
  isRunningStandalone,
  getManualInstallSteps,
  hasStoredUserInstall,
  setStoredUserInstall,
  detectInstalledRelatedApp,
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

test("tracks installed phone shortcut state per user uid", () => {
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };

  assert.equal(hasStoredUserInstall("user-1", mockStorage), false);
  assert.equal(hasStoredUserInstall("user-2", mockStorage), false);

  setStoredUserInstall("user-1", mockStorage);
  assert.equal(hasStoredUserInstall("user-1", mockStorage), true);
  assert.equal(hasStoredUserInstall("user-2", mockStorage), false);
});

test("detects installed related web apps safely", async () => {
  assert.equal(await detectInstalledRelatedApp({}), false);
  assert.equal(
    await detectInstalledRelatedApp({
      getInstalledRelatedApps: async () => [{ platform: "webapp" }],
    }),
    true,
  );
  assert.equal(
    await detectInstalledRelatedApp({
      getInstalledRelatedApps: async () => [],
    }),
    false,
  );
});

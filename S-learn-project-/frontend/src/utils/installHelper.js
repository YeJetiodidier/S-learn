export function detectInstallPlatform({
  userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
  maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0,
} = {}) {
  const ua = String(userAgent || "");
  const isIPhoneOrIPad =
    /iPad|iPhone|iPod/i.test(ua) ||
    (/Macintosh/i.test(ua) && Number(maxTouchPoints) > 1);
  if (isIPhoneOrIPad) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export function isRunningStandalone({
  matchMedia = typeof window !== "undefined" ? window.matchMedia?.bind(window) : null,
  standalone = typeof navigator !== "undefined" ? navigator.standalone : false,
} = {}) {
  if (standalone === true) return true;
  if (typeof matchMedia === "function") {
    return Boolean(matchMedia("(display-mode: standalone)")?.matches);
  }
  return false;
}

export function getManualInstallSteps(platform) {
  if (platform === "ios") {
    return {
      heading: "Add S-Learn to your iPhone / iPad Home Screen",
      steps: [
        "Open S-Learn in Safari on your phone.",
        "Tap the Share button (the square with an upward arrow) at the bottom of Safari.",
        "Scroll down and tap \"Add to Home Screen\".",
        "Tap \"Add\" in the top-right corner to create the S-Learn app icon.",
      ],
    };
  }

  if (platform === "android") {
    return {
      heading: "Add S-Learn to your Android Home Screen",
      steps: [
        "Tap the browser menu button (⋮) in the top-right corner of Chrome, Edge, or Firefox.",
        "Tap \"Install app\" or \"Add to Home screen\".",
        "Confirm by tapping \"Install\" or \"Add\" to place S-Learn on your home screen.",
      ],
    };
  }

  return {
    heading: "Install S-Learn Shortcut",
    steps: [
      "In Chrome or Edge, click the Install icon in the right side of the address bar (or open the browser menu ⋮).",
      "Choose \"Install S-Learn\" or \"Cast, save, and share → Install page as app\".",
      "On your phone, open S-Learn in Chrome (Android) or Safari (iPhone) and use \"Add to Home Screen\".",
    ],
  };
}

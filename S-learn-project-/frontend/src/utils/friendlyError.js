const TECHNICAL_LEAK_PATTERN =
  /<!doctype|<html|syntaxerror|typeerror|referenceerror|request failed\s*\(\d+\)|econn|eai_again|enotfound|etimedout|relation\s+"|column\s+"|pg-pool|postgres|neon\.tech|vercel|vite_backend_url|firebase|json\.parse|unexpected token|stack trace|cannot read propert|undefined is not/i;

const FIREBASE_ERROR_MAP = {
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/user-not-found": "Invalid email or password.",
  "auth/wrong-password": "Invalid email or password.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/account-exists-with-different-credential":
    "This email is already registered with another sign-in method. Please try signing in with that method.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/popup-blocked": "The sign-in window was blocked by your browser. Please allow popups and try again.",
  "auth/popup-closed-by-user": "The sign-in window was closed before completing sign-in. Please try again.",
  "auth/weak-password": "Please choose a stronger password with at least 6 characters.",
  "auth/requires-recent-login": "For your security, please sign out and sign in again before trying this action.",
  "auth/too-many-requests": "Too many attempts right now. Please wait a moment and try again.",
  "auth/network-request-failed": "We couldn't connect right now. Please check your internet connection and try again.",
  "auth/operation-not-allowed": "This sign-in method isn't available right now. Please use email and password instead.",
  "auth/unauthorized-domain": "Sign-in isn't available from this address right now. Please try again later.",
  "auth/expired-action-code": "This reset link has expired. Please request a new password reset email.",
  "auth/invalid-action-code": "This reset link is invalid or has already been used. Please request a new one.",
};

export function getFriendlyErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  if (!error) return fallback;

  const code = typeof error === "object" ? String(error.code || "") : "";
  if (code && Object.hasOwn(FIREBASE_ERROR_MAP, code)) {
    return FIREBASE_ERROR_MAP[code];
  }
  if (code.startsWith("auth/")) {
    return "We couldn't verify your account. Please try again.";
  }

  const status = typeof error === "object" ? Number(error.status) : NaN;
  const raw =
    typeof error === "string"
      ? error.trim()
      : typeof error?.message === "string"
        ? error.message.trim()
        : "";

  if (
    /failed to fetch|networkerror|load failed|network request failed|err_network|econnrefused|eai_again|enotfound|timed?\s*out/i.test(
      raw,
    )
  ) {
    return "We couldn't connect to the server. Please check your internet connection and try again.";
  }

  if (
    status === 401 ||
    /session is invalid|expired|authentication is required|no authenticated user|please sign in/i.test(
      raw,
    )
  ) {
    return "Your session has expired. Please sign in again to continue.";
  }

  if (
    status === 403 ||
    /administrator access is required|only access your own|origin is not allowed|permission denied|forbidden/i.test(
      raw,
    )
  ) {
    return "You don't have permission to perform this action.";
  }

  if (
    status === 413 ||
    /maximumsize|file.*too large|unsupported upload type|upload path or type|content.?type|vercel blob|client token/i.test(
      raw,
    )
  ) {
    return "We couldn't upload that file. Please check the file format and size, then try again.";
  }

  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    /temporarily unavailable|database is not configured|study content service is not configured|vite_backend_url/i.test(
      raw,
    )
  ) {
    return "The service is temporarily unavailable. Please try again in a moment.";
  }

  if (status >= 500) {
    return fallback;
  }

  if (!raw || raw.length > 180 || TECHNICAL_LEAK_PATTERN.test(raw)) {
    return fallback;
  }

  return raw;
}

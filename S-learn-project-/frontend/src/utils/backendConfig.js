const LOCAL_BACKEND_URL = "http://localhost:5000";

export const isRemoteBackendUsable = (value) => {
  if (!value || typeof value !== "string") return false;

  const url = value.trim();
  if (!url) return false;

  // Render-hosted backends are currently considered unavailable in this app until a
  // valid non-Render backend is explicitly configured.
  if (/onrender\.com|render\.com/i.test(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const isLocalBackendUrl = (value) => {
  try {
    const hostname = new URL(value).hostname.toLowerCase();
    return ["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch {
    return false;
  }
};

export const resolveBackendUrl = (value, { production = false } = {}) => {
  const configured = typeof value === "string" ? value.trim() : "";
  if (!configured) {
    return production ? null : LOCAL_BACKEND_URL;
  }

  if (
    isRemoteBackendUsable(configured) &&
    (!production || !isLocalBackendUrl(configured))
  ) {
    return configured.replace(/\/+$/, "");
  }

  return production ? null : LOCAL_BACKEND_URL;
};

export const getBackendUrl = () =>
  resolveBackendUrl(import.meta.env?.VITE_BACKEND_URL, {
    production: Boolean(import.meta.env?.PROD),
  });

export const requireBackendUrl = (url = getBackendUrl()) => {
  if (!url) {
    throw new Error(
      "The study content service is not configured for this deployment. Set VITE_BACKEND_URL to your deployed backend URL in Vercel, then redeploy the frontend.",
    );
  }
  return url;
};

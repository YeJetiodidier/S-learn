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

export const getBackendUrl = () => {
  const configured = (import.meta.env.VITE_BACKEND_URL || "").trim();

  if (!configured) {
    return "http://localhost:5000";
  }

  if (isRemoteBackendUsable(configured)) {
    return configured.replace(/\/+$/, "");
  }

  // Explicitly refuse to use known dead Render hosts. The app will continue with
  // local API/past-paper generation instead of making a broken request.
  if (/onrender\.com|render\.com/i.test(configured)) {
    return "http://localhost:5000";
  }

  return configured.replace(/\/+$/, "");
};

import { getBackendUrl } from "../utils/backendConfig";
import { auth } from "./config";

const BACKEND_URL = getBackendUrl();

const requestJson = async (url, { method = "GET", body } = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in to continue.");

  const idToken = await user.getIdToken();
  const retrySafeRequest = method.toUpperCase() === "GET";
  let response;
  for (let attempt = 0; ; attempt++) {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

    if (response.status !== 503 || !retrySafeRequest || attempt >= 1) break;
    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter, 5) * 1000
      : 1000;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (response.status === 204) return null;

  const responseText = await response.text();
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = { error: responseText };
    }
  }
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status}).`);
  }
  return payload;
};

export const apiRequest = (path, options) =>
  requestJson(`${BACKEND_URL}/api/data${path}`, options);

export const backendRequest = (path, options) =>
  requestJson(`${BACKEND_URL}${path}`, options);

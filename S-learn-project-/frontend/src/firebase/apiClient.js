import { getBackendUrl, requireBackendUrl } from "../utils/backendConfig";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import { auth } from "./config";

const BACKEND_URL = getBackendUrl();

const requestJson = async (url, { method = "GET", body } = {}) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in to continue.");

  const idToken = await user.getIdToken();
  const retrySafeRequest = method.toUpperCase() === "GET";
  let response;
  try {
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
  } catch (networkError) {
    const err = new Error(getFriendlyErrorMessage(networkError));
    err.cause = networkError;
    throw err;
  }

  if (response.status === 204) return null;

  const responseText = await response.text();
  let payload = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const err = new Error(
      getFriendlyErrorMessage(
        { status: response.status, message: payload.error || "" },
        "We couldn't complete that request. Please try again.",
      ),
    );
    err.status = response.status;
    throw err;
  }
  return payload;
};

export const apiRequest = (path, options) =>
  requestJson(`${requireBackendUrl(BACKEND_URL)}/api/data${path}`, options);

export const backendRequest = (path, options) =>
  requestJson(`${requireBackendUrl(BACKEND_URL)}${path}`, options);

export const backendFormRequest = async (path, formData) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in to continue.");
  const idToken = await user.getIdToken();
  let response;
  try {
    response = await fetch(`${requireBackendUrl(BACKEND_URL)}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });
  } catch (networkError) {
    const err = new Error(getFriendlyErrorMessage(networkError));
    err.cause = networkError;
    throw err;
  }
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = {};
    }
  }
  if (!response.ok) {
    const err = new Error(
      getFriendlyErrorMessage(
        { status: response.status, message: payload.error || "" },
        "We couldn't complete that request. Please try again.",
      ),
    );
    err.status = response.status;
    throw err;
  }
  return payload;
};

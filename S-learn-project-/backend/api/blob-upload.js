import { authorizeBlobUpload } from "../src/services/blobUpload.js";

const toNodeHandler = async (request, response) => {
  try {
    const body = request.body || {};
    const result = await authorizeBlobUpload({
      body,
      request,
    });

    response.json(result);
  } catch (error) {
    if (String(error?.code || "").startsWith("auth/")) {
      return response.status(401).json({ error: "Your session is invalid or expired." });
    }
    if (/Invalid upload request|not allowed/i.test(error?.message || "")) {
      return response.status(400).json({ error: error.message });
    }
    console.error("Blob upload authorization failed:", error);
    response.status(500).json({ error: "Could not authorize the upload." });
  }
};

export default toNodeHandler;

import { upload } from "@vercel/blob/client";
import { auth } from "./config";
import { getBackendUrl, requireBackendUrl } from "../utils/backendConfig";
import { getFriendlyErrorMessage } from "../utils/friendlyError";

const BACKEND_URL = getBackendUrl();

export const uploadFile = async (file, type, year = "", onUploadProgress) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in before uploading a file.");
  if (!["paper", "video", "avatar"].includes(type)) {
    throw new Error("Unsupported file type. Please choose a valid file.");
  }

  try {
    const idToken = await user.getIdToken();
    const backendUrl = requireBackendUrl(BACKEND_URL);
    const safeName = file.name.replace(/[\\/]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeYear = String(year).replace(/[^0-9]/g, "");
    const yearPath = type === "paper" && safeYear ? `${safeYear}/` : "";
    const pathname = `users/${user.uid}/${type}/${yearPath}${Date.now()}-${safeName}`;
    const blob = await upload(pathname, file, {
      access: "public",
      handleUploadUrl: `${backendUrl}/api/blob-upload`,
      clientPayload: JSON.stringify({ idToken, type }),
      multipart: type === "video",
      ...(typeof onUploadProgress === "function"
        ? { onUploadProgress: ({ percentage }) => onUploadProgress(percentage) }
        : {}),
    });
    return blob.url;
  } catch (error) {
    throw new Error(
      getFriendlyErrorMessage(
        error,
        "We couldn't upload your file right now. Please check the file and try again.",
      ),
    );
  }
};

// Convenience helper that builds a storage path for a paper PDF.
export const uploadPaperFile = (file, year, onUploadProgress) =>
  uploadFile(file, "paper", year, onUploadProgress);

// Convenience helper that builds a storage path for a video file.
export const uploadVideoFile = (file) =>
  uploadFile(file, "video");

import { upload } from "@vercel/blob/client";
import { auth } from "./config";
import { getBackendUrl } from "../utils/backendConfig";

const BACKEND_URL = getBackendUrl();

export const uploadFile = async (file, type, year = "", onUploadProgress) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Please sign in before uploading a file.");
  if (!["paper", "video", "avatar"].includes(type)) {
    throw new Error("Unsupported upload type.");
  }

  const idToken = await user.getIdToken();
  const safeName = file.name.replace(/[\\/]/g, "_").replace(/[^a-zA-Z0-9._-]/g, "_");
  const safeYear = String(year).replace(/[^0-9]/g, "");
  const yearPath = type === "paper" && safeYear ? `${safeYear}/` : "";
  const pathname = `users/${user.uid}/${type}/${yearPath}${Date.now()}-${safeName}`;
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: `${BACKEND_URL}/api/blob-upload`,
    clientPayload: JSON.stringify({ idToken, type }),
    multipart: type === "video",
    ...(typeof onUploadProgress === "function"
      ? { onUploadProgress: ({ percentage }) => onUploadProgress(percentage) }
      : {}),
  });
  return blob.url;
};

// Convenience helper that builds a storage path for a paper PDF.
export const uploadPaperFile = (file, year, onUploadProgress) =>
  uploadFile(file, "paper", year, onUploadProgress);

// Convenience helper that builds a storage path for a video file.
export const uploadVideoFile = (file) =>
  uploadFile(file, "video");

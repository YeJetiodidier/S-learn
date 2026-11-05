import { handleUpload } from "@vercel/blob/client";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

const publicTypes = {
  paper: ["application/pdf"],
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/ogg",
    "video/mpeg",
    "video/x-msvideo",
    "video/x-matroska",
  ],
  avatar: ["image/jpeg", "image/png", "image/webp"],
};

export const authorizeBlobUpload = ({ body, request }) =>
  handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      let payload;
      try {
        payload = JSON.parse(clientPayload || "{}");
      } catch {
        throw new Error("Invalid upload request.");
      }

      const decodedToken = await verifyFirebaseIdToken(payload.idToken || "");
      if (!Object.hasOwn(publicTypes, payload.type)) {
        throw new Error("Upload path or type is not allowed.");
      }
      const allowedContentTypes = publicTypes[payload.type];
      const prefix = `users/${decodedToken.uid}/${payload.type}/`;
      if (!pathname.startsWith(prefix)) {
        throw new Error("Upload path or type is not allowed.");
      }

      return {
        allowedContentTypes,
        maximumSizeInBytes: payload.type === "video" ? 2_000_000_000 : 100_000_000,
        tokenPayload: JSON.stringify({ uid: decodedToken.uid, type: payload.type }),
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      if (!blob?.url || !tokenPayload) {
        throw new Error("Upload completion was missing required metadata.");
      }
    },
  });

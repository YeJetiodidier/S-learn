import express from "express";
import { authorizeBlobUpload } from "../services/blobUpload.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const result = await authorizeBlobUpload({
      body: req.body || {},
      request: req,
    });
    res.json(result);
  } catch (error) {
    if (String(error?.code || "").startsWith("auth/")) {
      return res.status(401).json({ error: "Your session is invalid or expired." });
    }
    if (/Invalid upload request|not allowed/i.test(error?.message || "")) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

export default router;

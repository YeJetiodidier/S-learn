import express from "express";
import 'dotenv/config';
import cors from "cors";
import connectDB, { pool } from "./config/db.js";
import appDataRoutes from "./routes/appData.js";
import blobUploadRoutes from "./routes/blobUpload.js";
import examRoutes from "./routes/exam.js";
import { isDatabaseUnavailable } from "./utils/databaseErrors.js";

const PORT = process.env.PORT || 5000;
const app = express();
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      const error = new Error("Not allowed by CORS");
      error.status = 403;
      callback(error);
    }
  },
  credentials: true,
}));
app.use(express.json());

app.use("/api/data", appDataRoutes);
app.use("/api/blob-upload", blobUploadRoutes);
app.use("/api/exam", examRoutes);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/readyz", async (_req, res) => {
  if (!pool) {
    return res.status(503).json({ status: "not_ready", database: "not_configured" });
  }
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ready", database: "connected" });
  } catch (error) {
    console.error("Database readiness check failed:", error.message);
    res.status(503).json({ status: "not_ready", database: "unavailable" });
  }
});

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (isDatabaseUnavailable(error)) {
    console.error("Database request failed; returning service unavailable:", error.message);
    res.set("Retry-After", "3");
    return res.status(503).json({
      error: "The database is temporarily unavailable. Please retry shortly.",
    });
  }

  const status = error.status === 403 ? 403 : 500;
  if (status === 500) console.error("API request failed:", error);
  res.status(status).json({
    error: status === 403 ? "This origin is not allowed." : "The request could not be completed.",
  });
});

if (!process.env.VERCEL) {
  connectDB().catch((error) => {
    console.error("PostgreSQL connection failed after retries:", error.message);
  });
  app.listen(PORT, () => {
    console.log("Server is running on port ", PORT);
  });
}

export default app;

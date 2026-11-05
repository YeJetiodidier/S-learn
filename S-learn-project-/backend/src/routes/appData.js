import { randomUUID } from "crypto";
import express from "express";
import { pool } from "../config/db.js";
import { verifyFirebaseIdToken } from "../config/firebaseAdmin.js";

const router = express.Router();

const isAdminRole = (role) => ["admin", "teacher"].includes(String(role || "").toLowerCase());

export const requireDatabase = (_req, res, next) => {
  if (!pool) {
    return res.status(503).json({ error: "Database is not configured." });
  }
  next();
};

export const requireFirebaseUser = async (req, res, next) => {
  const authorization = req.get("authorization") || "";
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: "Authentication is required." });

  try {
    req.user = await verifyFirebaseIdToken(token);
    await pool.query(
      `INSERT INTO app_users (uid, email, username)
       VALUES ($1, $2, $3)
       ON CONFLICT (uid) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, app_users.email),
         username = CASE
           WHEN app_users.username = '' THEN COALESCE(NULLIF(EXCLUDED.username, ''), app_users.username)
           ELSE app_users.username
         END`,
      [
        req.user.uid,
        req.user.email || null,
        req.user.name || req.user.email?.split("@")[0] || "",
      ],
    );
    next();
  } catch (error) {
    if (error?.code?.startsWith("auth/")) {
      return res.status(401).json({ error: "Your session is invalid or expired." });
    }
    next(error);
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT role FROM app_users WHERE uid = $1",
      [req.user.uid],
    );
    if (!isAdminRole(result.rows[0]?.role)) {
      return res.status(403).json({ error: "Administrator access is required." });
    }
    next();
  } catch (error) {
    next(error);
  }
};

const requireOwnUid = (req, res, next) => {
  if (req.params.uid !== req.user.uid) {
    return res.status(403).json({ error: "You can only access your own account data." });
  }
  next();
};

const profileFields = [
  "username",
  "avatar_url",
  "bio",
  "level",
  "specialty",
  "lessons_completed",
  "topics_studied",
];

const settingFields = {
  theme: "theme",
  accent_color: "accent_color",
  accentColor: "accent_color",
  font_size: "font_size",
  fontSize: "font_size",
  compact_mode: "compact_mode",
  compactMode: "compact_mode",
  notif_schedule_reminders: "notif_schedule_reminders",
  scheduleReminders: "notif_schedule_reminders",
  notif_new_papers: "notif_new_papers",
  newPapers: "notif_new_papers",
  notif_video_uploads: "notif_video_uploads",
  videoUploads: "notif_video_uploads",
  notif_weekly_report: "notif_weekly_report",
  weeklyReport: "notif_weekly_report",
  notif_email_digest: "notif_email_digest",
  emailDigest: "notif_email_digest",
  privacy_profile_visible: "privacy_profile_visible",
  profileVisible: "privacy_profile_visible",
  privacy_activity_visible: "privacy_activity_visible",
  activityVisible: "privacy_activity_visible",
  privacy_share_stats: "privacy_share_stats",
  shareStats: "privacy_share_stats",
};

const profileProjection = `uid AS "uid", email, username, role, avatar_url, bio,
  level, specialty, lessons_completed, topics_studied,
  created_at AS "createdAt", updated_at AS "updatedAt"`;
const paperProjection = `id, level, specialty, subject, paper_name, year, link, status,
  submitted_by AS "submittedBy", approved_by AS "approvedBy",
  created_at AS "createdAt", approved_at AS "approvedAt"`;
const videoProjection = `id, title, subject, description, video_url, status,
  submitted_by AS "submittedBy", approved_by AS "approvedBy",
  created_at AS "createdAt", approved_at AS "approvedAt"`;

const saveSettings = async (uid, values) => {
  const updates = new Map();
  for (const [key, value] of Object.entries(values || {})) {
    const column = settingFields[key];
    if (column) updates.set(column, value);
  }

  const fields = [...updates.keys()];
  const updateClause = fields.length
    ? `, ${fields.map((field, index) => `${field} = $${index + 2}`).join(", ")}`
    : "";
  const result = await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()${updateClause}
     RETURNING *`,
    [uid, ...updates.values()],
  );
  return result.rows[0];
};

router.use(requireDatabase, requireFirebaseUser);

router.get("/profile/:uid", requireOwnUid, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${profileProjection} FROM app_users WHERE uid = $1`,
      [req.user.uid],
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    next(error);
  }
});

router.put("/profile/:uid", requireOwnUid, async (req, res, next) => {
  try {
    const values = profileFields.map((field) => req.body?.[field] ?? null);
    const assignments = profileFields
      .map((field, index) => `${field} = COALESCE($${index + 2}, ${field})`)
      .join(", ");
    const result = await pool.query(
      `UPDATE app_users SET ${assignments}, updated_at = NOW()
       WHERE uid = $1 RETURNING ${profileProjection}`,
      [req.user.uid, ...values],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/profile/:uid", requireOwnUid, async (req, res, next) => {
  try {
    await pool.query("DELETE FROM app_users WHERE uid = $1", [req.user.uid]);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/settings/:uid", requireOwnUid, async (req, res, next) => {
  try {
    const result = await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = user_settings.updated_at
       RETURNING *`,
      [req.user.uid],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/settings/:uid", requireOwnUid, async (req, res, next) => {
  try {
    res.json(await saveSettings(req.user.uid, req.body));
  } catch (error) {
    next(error);
  }
});

router.post("/progress/exam", async (req, res, next) => {
  const { subject, topic, score, total } = req.body || {};
  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedTopic = typeof topic === "string" ? topic.trim() : "";
  const scoreValue = Number(score);
  const totalValue = Number(total);
  if (
    !normalizedSubject ||
    !normalizedTopic ||
    !Number.isInteger(scoreValue) ||
    !Number.isInteger(totalValue) ||
    totalValue < 1 ||
    scoreValue < 0 ||
    scoreValue > totalValue
  ) {
    return res.status(400).json({
      error: "A subject, topic, and valid exam score are required.",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const activity = await client.query(
      `INSERT INTO study_activity
       (user_id, subject, topic, completed_count, best_score, best_score_total, last_completed_at)
       VALUES ($1, $2, $3, 1, $4, $5, NOW())
       ON CONFLICT (user_id, subject, topic) DO UPDATE SET
         completed_count = study_activity.completed_count + 1,
         best_score = CASE
           WHEN $4::numeric / $5 > study_activity.best_score::numeric / NULLIF(study_activity.best_score_total, 0)
             THEN $4 ELSE study_activity.best_score
         END,
         best_score_total = CASE
           WHEN study_activity.best_score_total = 0
             OR $4::numeric / $5 > study_activity.best_score::numeric / study_activity.best_score_total
             THEN $5 ELSE study_activity.best_score_total
         END,
         last_completed_at = NOW()
       RETURNING completed_count AS "completedCount",
         best_score AS "bestScore", best_score_total AS "bestScoreTotal"`,
      [req.user.uid, normalizedSubject, normalizedTopic, scoreValue, totalValue],
    );
    const profile = await client.query(
      `UPDATE app_users SET
         lessons_completed = lessons_completed + 1,
         topics_studied = (
           SELECT COUNT(*)::integer FROM study_activity WHERE user_id = $1
         ),
         updated_at = NOW()
       WHERE uid = $1
       RETURNING lessons_completed AS "lessonsCompleted",
         topics_studied AS "topicsStudied"`,
      [req.user.uid],
    );
    await client.query("COMMIT");
    res.status(201).json({
      ...activity.rows[0],
      ...profile.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.get("/progress/:uid", requireOwnUid, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT subject, topic, completed_count AS "completedCount",
         best_score AS "bestScore", best_score_total AS "bestScoreTotal",
         last_completed_at AS "lastCompletedAt"
       FROM study_activity WHERE user_id = $1
       ORDER BY last_completed_at DESC`,
      [req.user.uid],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/papers/pending", requireAdmin, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${paperProjection} FROM papers WHERE status = 'pending'
       ORDER BY year DESC, created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/papers", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${paperProjection} FROM papers WHERE status = 'approved'
       ORDER BY year DESC, created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/papers", async (req, res, next) => {
  try {
    const paper = req.body || {};
    const isAdmin = isAdminRole((await pool.query(
      "SELECT role FROM app_users WHERE uid = $1",
      [req.user.uid],
    )).rows[0]?.role);
    const result = await pool.query(
      `INSERT INTO papers
       (id, level, specialty, subject, paper_name, year, link, status, submitted_by, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $8 = 'approved' THEN NOW() END)
       RETURNING ${paperProjection}`,
      [
        randomUUID(),
        paper.level || "",
        paper.specialty || "",
        paper.subject || "",
        paper.paper_name || "",
        String(paper.year || ""),
        paper.link || "",
        isAdmin ? (paper.status === "pending" ? "pending" : "approved") : "pending",
        req.user.uid,
        isAdmin && paper.status !== "pending" ? req.user.uid : null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/papers/:id/approve", requireAdmin, async (req, res, next) => {
  try {
    const current = await pool.query("SELECT status FROM papers WHERE id = $1", [req.params.id]);
    if (!current.rowCount) return res.status(404).json({ error: "Paper not found." });
    if (current.rows[0].status === "approved") {
      return res.json({ id: req.params.id, status: "approved", alreadyApproved: true });
    }
    const result = await pool.query(
      `UPDATE papers SET status = 'approved', approved_by = $2, approved_at = NOW()
       WHERE id = $1 RETURNING ${paperProjection}`,
      [req.params.id, req.user.uid],
    );
    res.json({ ...result.rows[0], alreadyApproved: false });
  } catch (error) {
    next(error);
  }
});

router.delete("/papers/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM papers WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Paper not found." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/videos/pending", requireAdmin, async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${videoProjection} FROM videos WHERE status = 'pending'
       ORDER BY created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/videos", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${videoProjection} FROM videos WHERE status = 'approved'
       ORDER BY created_at DESC`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/videos", async (req, res, next) => {
  try {
    const video = req.body || {};
    const isAdmin = isAdminRole((await pool.query(
      "SELECT role FROM app_users WHERE uid = $1",
      [req.user.uid],
    )).rows[0]?.role);
    const status = isAdmin && video.status !== "pending" ? "approved" : "pending";
    const result = await pool.query(
      `INSERT INTO videos
       (id, title, subject, description, video_url, status, submitted_by, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CASE WHEN $6 = 'approved' THEN NOW() END)
       RETURNING ${videoProjection}`,
      [
        randomUUID(),
        video.title || "",
        video.subject || "",
        video.description || "",
        video.video_url || "",
        status,
        req.user.uid,
        status === "approved" ? req.user.uid : null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/videos/:id/approve", requireAdmin, async (req, res, next) => {
  try {
    const current = await pool.query("SELECT status FROM videos WHERE id = $1", [req.params.id]);
    if (!current.rowCount) return res.status(404).json({ error: "Video not found." });
    if (current.rows[0].status === "approved") {
      return res.json({ id: req.params.id, status: "approved", alreadyApproved: true });
    }
    const result = await pool.query(
      `UPDATE videos SET status = 'approved', approved_by = $2, approved_at = NOW()
       WHERE id = $1 RETURNING ${videoProjection}`,
      [req.params.id, req.user.uid],
    );
    res.json({ ...result.rows[0], alreadyApproved: false });
  } catch (error) {
    next(error);
  }
});

router.delete("/videos/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await pool.query("DELETE FROM videos WHERE id = $1", [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Video not found." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/questions/topics", async (req, res, next) => {
  const subject = String(req.query.subject || "");
  if (!subject) return res.status(400).json({ error: "subject is required." });
  try {
    const result = await pool.query(
      "SELECT DISTINCT topic FROM questions WHERE subject = $1 ORDER BY topic",
      [subject],
    );
    res.json(result.rows.map((row) => row.topic));
  } catch (error) {
    next(error);
  }
});

router.get("/questions", async (req, res, next) => {
  const { subject, topic } = req.query;
  if (!subject || !topic) {
    return res.status(400).json({ error: "subject and topic are required." });
  }
  const count = Math.min(100, Math.max(1, Number.parseInt(req.query.count, 10) || 10));
  try {
    const result = await pool.query(
      `SELECT id, subject, topic, question_text, options, answer,
        created_at AS "createdAt"
       FROM questions WHERE subject = $1 AND topic = $2
       ORDER BY random() LIMIT $3`,
      [subject, topic, count],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/questions", requireAdmin, async (req, res, next) => {
  const question = req.body || {};
  if (!question.subject || !question.topic || !question.question_text || !question.answer) {
    return res.status(400).json({ error: "subject, topic, question_text, and answer are required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO questions (id, subject, topic, question_text, options, answer)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, subject, topic, question_text, options, answer, created_at AS "createdAt"`,
      [
        randomUUID(),
        question.subject,
        question.topic,
        question.question_text,
        JSON.stringify(Array.isArray(question.options) ? question.options : []),
        question.answer,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;

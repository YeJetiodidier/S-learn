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
  notif_platform_updates: "notif_platform_updates",
  platformUpdates: "notif_platform_updates",
  privacy_profile_visible: "privacy_profile_visible",
  profileVisible: "privacy_profile_visible",
  privacy_activity_visible: "privacy_activity_visible",
  activityVisible: "privacy_activity_visible",
  privacy_share_stats: "privacy_share_stats",
  shareStats: "privacy_share_stats",
  favorite_cards: "favorite_cards",
  favoriteCards: "favorite_cards",
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
    if (!column) continue;
    if (column === "favorite_cards") {
      if (Array.isArray(value)) {
        updates.set(column, [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]);
      }
      continue;
    }
    updates.set(column, value);
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

const createNotification = async ({
  userId = null,
  category = "platform",
  title,
  message,
  link = "",
  createdBy = null,
}) => {
  try {
    await pool.query(
      `INSERT INTO notifications (id, user_id, category, title, message, link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [randomUUID(), userId, category, title, message, link, createdBy],
    );
  } catch (error) {
    console.error("Failed to create notification:", error.message);
  }
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
    const created = result.rows[0];
    if (created.status === "approved") {
      const details = [created.paper_name, created.level, created.year].filter(Boolean).join(" • ");
      await createNotification({
        category: "paper",
        title: `New paper added: ${created.subject || "Past Paper"}`,
        message: details
          ? `${details} is now available in Smart Subjects.`
          : "A new past paper is now available in Smart Subjects.",
        link: `/smartsubjects${created.subject ? `?subject=${encodeURIComponent(created.subject)}` : ""}`,
        createdBy: req.user.uid,
      });
    }
    res.status(201).json(created);
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
    const approved = result.rows[0];
    const details = [approved.paper_name, approved.level, approved.year].filter(Boolean).join(" • ");
    await createNotification({
      category: "paper",
      title: `New paper available: ${approved.subject || "Past Paper"}`,
      message: details
        ? `${details} was approved and added to Smart Subjects.`
        : "A newly approved past paper is now available in Smart Subjects.",
      link: `/smartsubjects${approved.subject ? `?subject=${encodeURIComponent(approved.subject)}` : ""}`,
      createdBy: req.user.uid,
    });
    if (approved.submittedBy && approved.submittedBy !== req.user.uid) {
      await createNotification({
        userId: approved.submittedBy,
        category: "paper",
        title: "Your paper submission was approved",
        message: `${approved.subject || "Your paper"}${approved.paper_name ? ` — ${approved.paper_name}` : ""} is now live in Smart Subjects.`,
        link: `/smartsubjects${approved.subject ? `?subject=${encodeURIComponent(approved.subject)}` : ""}`,
        createdBy: req.user.uid,
      });
    }
    res.json({ ...approved, alreadyApproved: false });
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
    const created = result.rows[0];
    if (created.status === "approved") {
      await createNotification({
        category: "video",
        title: `New lab video: ${created.title || "Practical Video"}`,
        message: created.subject
          ? `A new ${created.subject} video is now available in Science Lab.`
          : "A new practical demonstration video is now available in Science Lab.",
        link: `/sciencelab${created.subject ? `?subject=${encodeURIComponent(created.subject)}` : ""}`,
        createdBy: req.user.uid,
      });
    }
    res.status(201).json(created);
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
    const approved = result.rows[0];
    await createNotification({
      category: "video",
      title: `New lab video: ${approved.title || "Practical Video"}`,
      message: approved.subject
        ? `A new ${approved.subject} video is now available in Science Lab.`
        : "A new practical video is now available in Science Lab.",
      link: `/sciencelab${approved.subject ? `?subject=${encodeURIComponent(approved.subject)}` : ""}`,
      createdBy: req.user.uid,
    });
    if (approved.submittedBy && approved.submittedBy !== req.user.uid) {
      await createNotification({
        userId: approved.submittedBy,
        category: "video",
        title: "Your video submission was approved",
        message: `"${approved.title || "Your video"}" is now live in Science Lab.`,
        link: `/sciencelab${approved.subject ? `?subject=${encodeURIComponent(approved.subject)}` : ""}`,
        createdBy: req.user.uid,
      });
    }
    res.json({ ...approved, alreadyApproved: false });
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

router.get("/notifications", async (req, res, next) => {
  try {
    const settingsRes = await pool.query(
      `INSERT INTO user_settings (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = user_settings.updated_at
       RETURNING notif_schedule_reminders, notif_new_papers, notif_video_uploads, notif_platform_updates`,
      [req.user.uid],
    );
    const prefs = settingsRes.rows[0] || {};
    const enabledCategories = [];
    if (prefs.notif_new_papers !== false) enabledCategories.push("paper");
    if (prefs.notif_video_uploads === true) enabledCategories.push("video");
    if (prefs.notif_platform_updates !== false) enabledCategories.push("platform");
    if (prefs.notif_schedule_reminders !== false) enabledCategories.push("schedule");

    let items = [];
    if (enabledCategories.length > 0) {
      const notifRes = await pool.query(
        `SELECT n.id, n.category, n.title, n.message, n.link,
           n.created_at AS "createdAt",
           (r.notification_id IS NOT NULL) AS "isRead"
         FROM notifications n
         LEFT JOIN notification_reads r
           ON r.notification_id = n.id AND r.user_id = $1
         WHERE (n.user_id IS NULL OR n.user_id = $1)
           AND n.category = ANY($2::text[])
         ORDER BY n.created_at DESC
         LIMIT 40`,
        [req.user.uid, enabledCategories],
      );
      items = notifRes.rows;
    }

    // If no stored paper notifications exist yet and the user wants paper updates,
    // surface the latest approved papers so users immediately see recent paper updates.
    const hasPaperNotification = items.some((item) => item.category === "paper");
    if (!hasPaperNotification && prefs.notif_new_papers !== false) {
      const recentPapers = await pool.query(
        `SELECT id, subject, paper_name, level, year, COALESCE(approved_at, created_at) AS "createdAt"
         FROM papers WHERE status = 'approved'
         ORDER BY COALESCE(approved_at, created_at) DESC
         LIMIT 5`,
      );
      for (const paper of recentPapers.rows) {
        const details = [paper.paper_name, paper.level, paper.year].filter(Boolean).join(" • ");
        items.push({
          id: `paper-feed-${paper.id}`,
          category: "paper",
          title: `Paper available: ${paper.subject || "Past Paper"}`,
          message: details
            ? `${details} is ready to view or download.`
            : "Available now in Smart Subjects.",
          link: `/smartsubjects${paper.subject ? `?subject=${encodeURIComponent(paper.subject)}` : ""}`,
          createdAt: paper.createdAt,
          isRead: true,
          synthetic: true,
        });
      }
      items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const unreadCount = items.filter((item) => !item.isRead).length;
    res.json({ items, unreadCount });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/broadcast", requireAdmin, async (req, res, next) => {
  const { category = "platform", title, message, link = "" } = req.body || {};
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const allowedCategory = ["platform", "paper", "video"].includes(category) ? category : "platform";
  if (!normalizedTitle || !normalizedMessage) {
    return res.status(400).json({ error: "Please enter both a title and a message for the update." });
  }
  try {
    const id = randomUUID();
    const result = await pool.query(
      `INSERT INTO notifications (id, user_id, category, title, message, link, created_by)
       VALUES ($1, NULL, $2, $3, $4, $5, $6)
       RETURNING id, category, title, message, link, created_at AS "createdAt"`,
      [id, allowedCategory, normalizedTitle, normalizedMessage, String(link || "").trim(), req.user.uid],
    );
    res.status(201).json({ ...result.rows[0], isRead: false });
  } catch (error) {
    next(error);
  }
});

router.patch("/notifications/:id/read", async (req, res, next) => {
  const id = String(req.params.id || "");
  if (!id || id.startsWith("paper-feed-")) {
    return res.json({ id, isRead: true });
  }
  try {
    const existing = await pool.query(
      "SELECT id FROM notifications WHERE id = $1 AND (user_id IS NULL OR user_id = $2)",
      [id, req.user.uid],
    );
    if (!existing.rowCount) {
      return res.status(404).json({ error: "Notification not found." });
    }
    await pool.query(
      `INSERT INTO notification_reads (user_id, notification_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, notification_id) DO NOTHING`,
      [req.user.uid, id],
    );
    res.json({ id, isRead: true });
  } catch (error) {
    next(error);
  }
});

router.post("/notifications/read-all", async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO notification_reads (user_id, notification_id)
       SELECT $1, n.id
       FROM notifications n
       WHERE n.user_id IS NULL OR n.user_id = $1
       ON CONFLICT (user_id, notification_id) DO NOTHING`,
      [req.user.uid],
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get("/schedule/:uid", requireOwnUid, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, subject, day, time, done,
         created_at AS "createdAt", updated_at AS "updatedAt"
       FROM schedule_items WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.user.uid],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/schedule", async (req, res, next) => {
  const { subject, day, time, done } = req.body || {};
  const normalizedSubject = typeof subject === "string" ? subject.trim() : "";
  const normalizedDay = typeof day === "string" ? day.trim() : "";
  const normalizedTime = typeof time === "string" ? time.trim() : "";
  if (!normalizedSubject || !normalizedDay || !normalizedTime) {
    return res.status(400).json({ error: "subject, day, and time are required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO schedule_items (id, user_id, subject, day, time, done)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, subject, day, time, done,
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [randomUUID(), req.user.uid, normalizedSubject, normalizedDay, normalizedTime, Boolean(done)],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/schedule/:id", async (req, res, next) => {
  const { subject, day, time, done } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE schedule_items SET
         subject = COALESCE($3, subject),
         day = COALESCE($4, day),
         time = COALESCE($5, time),
         done = COALESCE($6, done),
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, subject, day, time, done,
         created_at AS "createdAt", updated_at AS "updatedAt"`,
      [
        req.params.id,
        req.user.uid,
        typeof subject === "string" ? subject.trim() : null,
        typeof day === "string" ? day.trim() : null,
        typeof time === "string" ? time.trim() : null,
        typeof done === "boolean" ? done : null,
      ],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Schedule item not found." });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/schedule/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM schedule_items WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.uid],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Schedule item not found." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

router.get("/questions/subjects", async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT TRIM(subject) AS subject FROM (
         SELECT subject FROM questions
         UNION
         SELECT subject FROM papers WHERE status = 'approved'
       ) combined
       WHERE TRIM(COALESCE(subject, '')) <> ''
       ORDER BY subject`,
    );
    res.json(result.rows.map((row) => row.subject));
  } catch (error) {
    next(error);
  }
});

router.get("/questions/topics", async (req, res, next) => {
  const subject = String(req.query.subject || "").trim();
  if (!subject) return res.status(400).json({ error: "subject is required." });
  try {
    const result = await pool.query(
      `SELECT DISTINCT TRIM(topic) AS topic FROM (
         SELECT topic FROM questions WHERE LOWER(subject) = LOWER($1)
         UNION
         SELECT paper_name AS topic FROM papers WHERE status = 'approved' AND LOWER(subject) = LOWER($1)
       ) combined
       WHERE TRIM(COALESCE(topic, '')) <> ''
       ORDER BY topic`,
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
       FROM questions WHERE LOWER(subject) = LOWER($1) AND LOWER(topic) = LOWER($2)
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

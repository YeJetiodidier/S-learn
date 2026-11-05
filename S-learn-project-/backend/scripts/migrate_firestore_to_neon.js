import "dotenv/config";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import pg from "pg";

const { Pool } = pg;
const collections = ["users", "settings", "papers", "videos", "questions"];

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL before migrating Firestore data.");
}
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("Set FIREBASE_PROJECT_ID to the source Firebase project.");
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const firestore = getFirestore();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 1,
});

const asDate = (value) => {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getRows = async (collectionName) => {
  const snapshot = await firestore.collection(collectionName).get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    data: document.data(),
  }));
};

const migrateUsers = async (rows) => {
  for (const { id, data } of rows) {
    await pool.query(
      `INSERT INTO app_users
       (uid, email, username, role, avatar_url, bio, level, specialty,
        lessons_completed, topics_studied, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, NOW()))
       ON CONFLICT (uid) DO UPDATE SET
         email = EXCLUDED.email, username = EXCLUDED.username, role = EXCLUDED.role,
         avatar_url = EXCLUDED.avatar_url, bio = EXCLUDED.bio, level = EXCLUDED.level,
         specialty = EXCLUDED.specialty,
         lessons_completed = EXCLUDED.lessons_completed,
         topics_studied = EXCLUDED.topics_studied, updated_at = NOW()`,
      [
        id,
        data.email || null,
        data.username || data.name || "",
        data.role || "Student",
        data.avatar_url || "",
        data.bio || "",
        data.level || "",
        data.specialty || "",
        Number(data.lessons_completed) || 0,
        Number(data.topics_studied) || 0,
        asDate(data.createdAt || data.created_at),
      ],
    );
  }
};

const migrateSettings = async (rows) => {
  const columns = [
    "theme", "accent_color", "font_size", "compact_mode",
    "notif_schedule_reminders", "notif_new_papers", "notif_video_uploads",
    "notif_weekly_report", "notif_email_digest", "privacy_profile_visible",
    "privacy_activity_visible", "privacy_share_stats",
  ];
  const aliases = {
    accent_color: "accentColor",
    font_size: "fontSize",
    compact_mode: "compactMode",
    notif_schedule_reminders: "scheduleReminders",
    notif_new_papers: "newPapers",
    notif_video_uploads: "videoUploads",
    notif_weekly_report: "weeklyReport",
    notif_email_digest: "emailDigest",
    privacy_profile_visible: "profileVisible",
    privacy_activity_visible: "activityVisible",
    privacy_share_stats: "shareStats",
  };
  const defaults = {
    theme: "light",
    accent_color: "#8b5cf6",
    font_size: "medium",
    compact_mode: false,
    notif_schedule_reminders: true,
    notif_new_papers: true,
    notif_video_uploads: false,
    notif_weekly_report: true,
    notif_email_digest: false,
    privacy_profile_visible: true,
    privacy_activity_visible: false,
    privacy_share_stats: true,
  };
  const values = columns.map((column, index) => `$${index + 2}`);
  for (const { id, data } of rows) {
    const user = await pool.query("SELECT 1 FROM app_users WHERE uid = $1", [id]);
    if (!user.rowCount) continue;
    await pool.query(
      `INSERT INTO user_settings (user_id, ${columns.join(", ")})
       VALUES ($1, ${values.join(", ")})
       ON CONFLICT (user_id) DO UPDATE SET
       ${columns.map((column) => `${column} = EXCLUDED.${column}`).join(", ")},
       updated_at = NOW()`,
      [id, ...columns.map((column) =>
        data[column] ?? data[aliases[column]] ?? defaults[column])],
    );
  }
};

const migratePapers = async (rows, knownUserUids) => {
  for (const { id, data } of rows) {
    if (data.status && !["pending", "approved"].includes(data.status)) continue;
    await pool.query(
      `INSERT INTO papers
       (id, level, specialty, subject, paper_name, year, link, status,
        submitted_by, approved_by, created_at, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, NOW()), $12)
       ON CONFLICT (id) DO UPDATE SET level = EXCLUDED.level,
         specialty = EXCLUDED.specialty, subject = EXCLUDED.subject,
         paper_name = EXCLUDED.paper_name, year = EXCLUDED.year,
         link = EXCLUDED.link, status = EXCLUDED.status,
         approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at`,
      [
        id,
        data.level || "",
        data.specialty || "",
        data.subject || "",
        data.paper_name || data.paperName || data.title || "",
        String(data.year || ""),
        data.link || "",
        data.status === "pending" ? "pending" : "approved",
        knownUserUids.has(data.submittedBy) ? data.submittedBy : null,
        knownUserUids.has(data.approvedBy) ? data.approvedBy : null,
        asDate(data.createdAt || data.created_at),
        asDate(data.approvedAt || data.approved_at),
      ],
    );
  }
};

const migrateVideos = async (rows, knownUserUids) => {
  for (const { id, data } of rows) {
    if (data.status && !["pending", "approved"].includes(data.status)) continue;
    await pool.query(
      `INSERT INTO videos
       (id, title, subject, description, video_url, status,
        submitted_by, approved_by, created_at, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, NOW()), $10)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title,
         subject = EXCLUDED.subject, description = EXCLUDED.description,
         video_url = EXCLUDED.video_url, status = EXCLUDED.status,
         approved_by = EXCLUDED.approved_by, approved_at = EXCLUDED.approved_at`,
      [
        id,
        data.title || "",
        data.subject || "",
        data.description || "",
        data.video_url || data.videoUrl || "",
        data.status === "pending" ? "pending" : "approved",
        knownUserUids.has(data.submittedBy) ? data.submittedBy : null,
        knownUserUids.has(data.approvedBy) ? data.approvedBy : null,
        asDate(data.createdAt || data.created_at),
        asDate(data.approvedAt || data.approved_at),
      ],
    );
  }
};

const migrateQuestions = async (rows) => {
  for (const { id, data } of rows) {
    if (!data.subject || !data.topic || !data.question_text || !data.answer) continue;
    await pool.query(
      `INSERT INTO questions (id, subject, topic, question_text, options, answer)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject,
         topic = EXCLUDED.topic, question_text = EXCLUDED.question_text,
         options = EXCLUDED.options, answer = EXCLUDED.answer`,
      [id, data.subject, data.topic, data.question_text, JSON.stringify(data.options || []), data.answer],
    );
  }
};

const migrations = {
  users: migrateUsers,
  settings: migrateSettings,
  papers: migratePapers,
  videos: migrateVideos,
  questions: migrateQuestions,
};

try {
  for (const collectionName of collections) {
    const rows = await getRows(collectionName);
    if (collectionName === "papers" || collectionName === "videos") {
      const users = await pool.query("SELECT uid FROM app_users");
      const knownUserUids = new Set(users.rows.map((row) => row.uid));
      await migrations[collectionName](rows, knownUserUids);
    } else {
      await migrations[collectionName](rows);
    }
    console.log(`Migrated ${rows.length} ${collectionName} records.`);
  }
} finally {
  await pool.end();
}

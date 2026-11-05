import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// Auto-create settings table
const ensureTable = async () => {
    if (!pool) return false;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            user_id INT DEFAULT 1,

            -- Appearance
            theme VARCHAR(20) DEFAULT 'light',
            accent_color VARCHAR(20) DEFAULT '#8b5cf6',
            font_size VARCHAR(20) DEFAULT 'medium',
            compact_mode BOOLEAN DEFAULT FALSE,

            -- Notifications
            notif_schedule_reminders BOOLEAN DEFAULT TRUE,
            notif_new_papers BOOLEAN DEFAULT TRUE,
            notif_video_uploads BOOLEAN DEFAULT FALSE,
            notif_weekly_report BOOLEAN DEFAULT TRUE,
            notif_email_digest BOOLEAN DEFAULT FALSE,

            -- Privacy
            privacy_profile_visible BOOLEAN DEFAULT TRUE,
            privacy_activity_visible BOOLEAN DEFAULT FALSE,
            privacy_share_stats BOOLEAN DEFAULT TRUE,

            UNIQUE(user_id)
        )
    `);

    // Insert default row if empty
    const count = await pool.query("SELECT COUNT(*) FROM settings");
    if (parseInt(count.rows[0].count) === 0) {
        await pool.query("INSERT INTO settings (user_id) VALUES (1)");
    }
    return true;
};

// GET all settings
router.get("/", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
        await ensureTable();
        const result = await pool.query("SELECT * FROM settings WHERE user_id = 1 LIMIT 1");
        res.json(result.rows[0] || {});
    } catch (err) {
        res.status(500).json({ error: "Failed to load settings", details: err.message });
    }
});

// PATCH appearance settings
router.patch("/appearance", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { theme, accent_color, font_size, compact_mode } = req.body;
    try {
        await ensureTable();
        const result = await pool.query(`
            UPDATE settings SET
                theme = COALESCE($1, theme),
                accent_color = COALESCE($2, accent_color),
                font_size = COALESCE($3, font_size),
                compact_mode = COALESCE($4, compact_mode)
            WHERE user_id = 1 RETURNING *
        `, [theme, accent_color, font_size, compact_mode]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to save appearance", details: err.message });
    }
});

// PATCH notification settings
router.patch("/notifications", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { scheduleReminders, newPapers, videoUploads, weeklyReport, emailDigest } = req.body;
    try {
        await ensureTable();
        const result = await pool.query(`
            UPDATE settings SET
                notif_schedule_reminders = COALESCE($1, notif_schedule_reminders),
                notif_new_papers         = COALESCE($2, notif_new_papers),
                notif_video_uploads      = COALESCE($3, notif_video_uploads),
                notif_weekly_report      = COALESCE($4, notif_weekly_report),
                notif_email_digest       = COALESCE($5, notif_email_digest)
            WHERE user_id = 1 RETURNING *
        `, [scheduleReminders, newPapers, videoUploads, weeklyReport, emailDigest]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to save notifications", details: err.message });
    }
});

// PATCH privacy settings
router.patch("/privacy", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { profileVisible, activityVisible, shareStats } = req.body;
    try {
        await ensureTable();
        const result = await pool.query(`
            UPDATE settings SET
                privacy_profile_visible  = COALESCE($1, privacy_profile_visible),
                privacy_activity_visible = COALESCE($2, privacy_activity_visible),
                privacy_share_stats      = COALESCE($3, privacy_share_stats)
            WHERE user_id = 1 RETURNING *
        `, [profileVisible, activityVisible, shareStats]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to save privacy", details: err.message });
    }
});

export default router;

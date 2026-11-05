import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// GET profile statistics and avatar
router.get("/", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100),
                role VARCHAR(100),
                avatar_url TEXT,
                bio TEXT,
                level VARCHAR(50),
                specialty VARCHAR(50),
                lessons_completed INT DEFAULT 0,
                topics_studied INT DEFAULT 0
            )
        `);

        // Ensure new columns exist even if the table was created earlier
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS level VARCHAR(50)");
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS specialty VARCHAR(50)");

        const countRes = await pool.query("SELECT COUNT(*) FROM users");
        if (parseInt(countRes.rows[0].count) === 0) {
            // Insert default matching the user's dashboard image
            await pool.query(`
                INSERT INTO users (username, role, avatar_url, lessons_completed, topics_studied)
                VALUES ($1, $2, $3, $4, $5)
            `, ["S-Learn", "Student", "", 24, 8]);
        }

        const userRes = await pool.query("SELECT * FROM users LIMIT 1");
        res.json(userRes.rows[0]);
    } catch (err) {
        if (err.code === '42P01') {
            return res.json({ username: "S-Learn", role: "Student", avatar_url: "", lessons_completed: 24, topics_studied: 8 });
        }
        res.status(500).json({ error: "Failed to fetch profile data", details: err.message });
    }
});

// Update profile
router.post("/update", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    const { username, role, avatar_url, bio, level, specialty, lessons_completed, topics_studied } = req.body;

    try {
        const updateQuery = `
            UPDATE users 
            SET username = COALESCE($1, username), 
                role = COALESCE($2, role), 
                avatar_url = COALESCE($3, avatar_url), 
                bio = COALESCE($4, bio), 
                level = COALESCE($5, level), 
                specialty = COALESCE($6, specialty), 
                lessons_completed = COALESCE($7, lessons_completed), 
                topics_studied = COALESCE($8, topics_studied)
            WHERE id = (SELECT id FROM users LIMIT 1)
            RETURNING *
        `;
        const result = await pool.query(updateQuery, [username, role, avatar_url, bio, level, specialty, lessons_completed, topics_studied]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to update profile", details: err.message });
    }
});

export default router;

import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// GET all videos
router.get("/", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });
    try {
        const result = await pool.query("SELECT * FROM videos ORDER BY id DESC");
        res.json(result.rows);
    } catch (err) {
        if (err.code === '42P01') return res.json([]);
        res.status(500).json({ error: "Failed to fetch videos", details: err.message });
    }
});

// POST a new video
router.post("/", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected" });

    const { title, subject, description, video_url } = req.body;

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS videos (
                id SERIAL PRIMARY KEY,
                title VARCHAR(200),
                subject VARCHAR(100),
                description TEXT,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        const result = await pool.query(
            `INSERT INTO videos (title, subject, description, video_url) VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, subject, description, video_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to upload video", details: err.message });
    }
});

export default router;

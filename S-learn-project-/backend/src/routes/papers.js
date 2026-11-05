import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// GET all papers
router.get("/", async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: "Database not connected. Please set DATABASE_URL." });
    }
    try {
        const result = await pool.query("SELECT * FROM papers ORDER BY year DESC");
        res.json(result.rows);
    } catch (err) {
        // If table doesn't exist yet, return empty
        if (err.code === '42P01') { 
            return res.json([]);
        }
        res.status(500).json({ error: "Failed to fetch papers", details: err.message });
    }
});

// POST a new paper
router.post("/", async (req, res) => {
    if (!pool) {
        return res.status(503).json({ error: "Database not connected. Please set DATABASE_URL." });
    }

    const { level, specialty, subject, paperName, year, link } = req.body;

    try {
        // Auto-create table if it doesn't exist
        await pool.query(`
            CREATE TABLE IF NOT EXISTS papers (
                id SERIAL PRIMARY KEY,
                level VARCHAR(100),
                specialty VARCHAR(100),
                subject VARCHAR(100),
                paper_name VARCHAR(100),
                year VARCHAR(10),
                link TEXT
            )
        `);

        const insertQuery = `
            INSERT INTO papers (level, specialty, subject, paper_name, year, link)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [level, specialty, subject, paperName, year, link]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to add paper", details: err.message });
    }
});

export default router;

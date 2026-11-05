import express from "express";
import { pool } from "../config/db.js";

const router = express.Router();

// Helper to seed sample questions if the table is empty
const seedQuestions = async () => {
    try {
        const countRes = await pool.query("SELECT COUNT(*) FROM questions");
        if (parseInt(countRes.rows[0].count, 10) === 0) {
            console.log("Seeding sample questions...");
            const sampleQuestions = [
                {
                    subject: "Mathematics",
                    topic: "Algebra",
                    question_text: "What is the value of x if 2x + 5 = 15?",
                    options: ["3", "5", "10", "15"],
                    answer: "5"
                },
                {
                    subject: "Mathematics",
                    topic: "Algebra",
                    question_text: "Find the roots of the quadratic equation x^2 - 5x + 6 = 0.",
                    options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"],
                    answer: "x = 2, 3"
                },
                {
                    subject: "Mathematics",
                    topic: "Calculus",
                    question_text: "What is the derivative of sin(x) with respect to x?",
                    options: ["cos(x)", "-cos(x)", "tan(x)", "-sin(x)"],
                    answer: "cos(x)"
                },
                {
                    subject: "Mathematics",
                    topic: "Calculus",
                    question_text: "Evaluate the integral of 2x dx from 0 to 3.",
                    options: ["3", "6", "9", "12"],
                    answer: "9"
                },
                {
                    subject: "Physics",
                    topic: "Mechanics",
                    question_text: "State Newton's Second Law of Motion.",
                    options: ["F = ma", "E = mc^2", "V = IR", "p = mv"],
                    answer: "F = ma"
                },
                {
                    subject: "Physics",
                    topic: "Mechanics",
                    question_text: "A car travels 100 meters in 5 seconds. What is its average speed?",
                    options: ["10 m/s", "20 m/s", "50 m/s", "100 m/s"],
                    answer: "20 m/s"
                },
                {
                    subject: "Physics",
                    topic: "Thermodynamics",
                    question_text: "What is the absolute zero temperature in Celsius?",
                    options: ["0 °C", "-100 °C", "-273.15 °C", "-459.67 °C"],
                    answer: "-273.15 °C"
                },
                {
                    subject: "Chemistry",
                    topic: "Organic Chemistry",
                    question_text: "What is the chemical formula of Benzene?",
                    options: ["C6H12", "C6H6", "CH4", "C2H5OH"],
                    answer: "C6H6"
                },
                {
                    subject: "Chemistry",
                    topic: "Organic Chemistry",
                    question_text: "Which functional group is characterized by the presence of a carbonyl group (C=O) bonded to two carbon atoms?",
                    options: ["Alcohol", "Ketone", "Aldehyde", "Carboxylic acid"],
                    answer: "Ketone"
                },
                {
                    subject: "Chemistry",
                    topic: "Periodic Table",
                    question_text: "What is the atomic number of Carbon?",
                    options: ["5", "6", "7", "8"],
                    answer: "6"
                },
                {
                    subject: "Chemistry",
                    topic: "Periodic Table",
                    question_text: "Which element is the most electronegative in the periodic table?",
                    options: ["Oxygen", "Fluorine", "Chlorine", "Helium"],
                    answer: "Fluorine"
                }
            ];

            for (const q of sampleQuestions) {
                await pool.query(
                    `INSERT INTO questions (subject, topic, question_text, options, answer) VALUES ($1, $2, $3, $4, $5)`,
                    [q.subject, q.topic, q.question_text, JSON.stringify(q.options), q.answer]
                );
            }
            console.log("Sample questions seeded successfully! ✅");
        }
    } catch (err) {
        console.error("Failed to seed sample questions:", err.message);
    }
};

// Helper to auto-create the users table
export const initDB = async () => {
    if (pool) {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                phone VARCHAR(20) UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'Student',
                reset_otp VARCHAR(6),
                reset_otp_exp TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE accounts ADD COLUMN IF NOT EXISTS phone VARCHAR(20) UNIQUE;
            ALTER TABLE accounts ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(6);
            ALTER TABLE accounts ADD COLUMN IF NOT EXISTS reset_otp_exp TIMESTAMP;

            CREATE TABLE IF NOT EXISTS questions (
                id SERIAL PRIMARY KEY,
                subject VARCHAR(100) NOT NULL,
                topic VARCHAR(100) NOT NULL,
                question_text TEXT NOT NULL,
                options JSONB,
                answer VARCHAR(100) NOT NULL
            );
        `);
        await seedQuestions();
    }
};

// POST /register
router.post("/register", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected." });

    const { name, email, password } = req.body;

    try {
        await initDB();

        // Basic check if user exists
        const userExists = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "Email already exists" });
        }

        // Insert new user
        // Note: In a production app, password should be hashed with bcrypt.
        const newUser = await pool.query(
            "INSERT INTO accounts (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role",
            [name, email, password]
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to register user", details: err.message });
    }
});

// POST /login
router.post("/login", async (req, res) => {
    if (!pool) return res.status(503).json({ error: "Database not connected." });

    const { email, password } = req.body;

    try {
        await initDB();

        // Check if user exists
        const userResult = await pool.query("SELECT * FROM accounts WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = userResult.rows[0];

        // Check password (plain text comparison for this basic setup)
        if (user.password !== password) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Return user info (excluding password)
        res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Failed to login", details: err.message });
        }
    });
    
    // POST /change-password - change password for the default user
    router.post("/change-password", async (req, res) => {
        if (!pool) return res.status(503).json({ error: "Database not connected" });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new password are required" });
        try {
            const userResult = await pool.query("SELECT * FROM accounts LIMIT 1");
            if (userResult.rows.length === 0) return res.status(404).json({ error: "No user found" });
            const user = userResult.rows[0];
            if (user.password !== currentPassword) return res.status(401).json({ error: "Current password is incorrect" });
            await pool.query("UPDATE accounts SET password = $1 WHERE id = $2", [newPassword, user.id]);
            res.json({ message: "Password changed successfully" });
        } catch (err) {
            res.status(500).json({ error: "Failed to change password", details: err.message });
        }
    });
    
    // GET /export - export user data as JSON
    router.get("/export", async (req, res) => {
        if (!pool) return res.status(503).json({ error: "Database not connected" });
        try {
            const accounts = await pool.query("SELECT id, name, email, role, created_at FROM accounts");
            const users = await pool.query("SELECT * FROM users");
            const settings = await pool.query("SELECT * FROM settings");
            res.json({
                accounts: accounts.rows,
                users: users.rows,
                settings: settings.rows,
                exportedAt: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({ error: "Failed to export data", details: err.message });
        }
    });
    
    // POST /signout - sign out (no real session, just return success)
    router.post("/signout", async (req, res) => {
        res.json({ message: "Signed out successfully" });
    });
    
    // POST /delete-account - delete the default user account
    router.post("/delete-account", async (req, res) => {
        if (!pool) return res.status(503).json({ error: "Database not connected" });
        const { password } = req.body;
        if (!password) return res.status(400).json({ error: "Password confirmation is required" });
        try {
            const userResult = await pool.query("SELECT * FROM accounts LIMIT 1");
            if (userResult.rows.length === 0) return res.status(404).json({ error: "No user found" });
            const user = userResult.rows[0];
            if (user.password !== password) return res.status(401).json({ error: "Password is incorrect" });
            await pool.query("DELETE FROM accounts WHERE id = $1", [user.id]);
            res.json({ message: "Account deleted successfully" });
        } catch (err) {
            res.status(500).json({ error: "Failed to delete account", details: err.message });
        }
    });
    
    export default router;

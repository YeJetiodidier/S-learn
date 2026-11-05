import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes("localhost") ? false : { rejectUnauthorized: true },
        max: process.env.VERCEL ? 1 : 10,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
    })
    : null;

pool?.on("error", (error) => {
    console.error("PostgreSQL idle connection error:", error.message);
});

const connectDB = async () => {
    if (!pool) {
        console.warn("DATABASE_URL is not set. Database-backed API routes will return 503.");
        return false;
    }

    const attempts = 4;
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            await pool.query("SELECT NOW()");
            console.log("PostgreSQL connected successfully.");
            return true;
        } catch (error) {
            lastError = error;
            if (attempt === attempts) break;

            const retryDelay = 1_000 * attempt;
            console.error(
                `PostgreSQL connection attempt ${attempt}/${attempts} failed (${error.code || error.message}); retrying in ${retryDelay / 1_000}s.`,
            );
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }

    throw lastError;
};

export { pool };
export default connectDB;
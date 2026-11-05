import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL to the destination Neon database.");
}
if (!process.env.LEGACY_DATABASE_URL) {
  throw new Error("Set LEGACY_DATABASE_URL to the existing PostgreSQL database.");
}

const poolOptions = (connectionString) => ({
  connectionString,
  ssl: { rejectUnauthorized: true },
  max: 1,
});
const source = new Pool(poolOptions(process.env.LEGACY_DATABASE_URL));
const target = new Pool(poolOptions(process.env.DATABASE_URL));

const sourceTables = async () => {
  const result = await source.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = current_schema()
       AND table_type = 'BASE TABLE'
       AND table_name = ANY($1::text[])`,
    [["papers", "videos", "questions"]],
  );
  return new Set(result.rows.map((row) => row.table_name));
};

const legacyId = (table, row) => `legacy-pg-${table}-${row.id}`;

const migratePapers = async (rows) => {
  for (const row of rows) {
    await target.query(
      `INSERT INTO papers
       (id, level, specialty, subject, paper_name, year, link, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
       ON CONFLICT (id) DO UPDATE SET level = EXCLUDED.level,
         specialty = EXCLUDED.specialty, subject = EXCLUDED.subject,
         paper_name = EXCLUDED.paper_name, year = EXCLUDED.year,
         link = EXCLUDED.link`,
      [
        legacyId("papers", row),
        row.level || "",
        row.specialty || "",
        row.subject || "",
        row.paper_name || row.paperName || row.title || "",
        String(row.year || ""),
        row.link || row.paper_url || "",
      ],
    );
  }
};

const migrateVideos = async (rows) => {
  for (const row of rows) {
    await target.query(
      `INSERT INTO videos (id, title, subject, description, video_url, status)
       VALUES ($1, $2, $3, $4, $5, 'approved')
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title,
         subject = EXCLUDED.subject, description = EXCLUDED.description,
         video_url = EXCLUDED.video_url`,
      [
        legacyId("videos", row),
        row.title || "",
        row.subject || "",
        row.description || "",
        row.video_url || row.videoUrl || "",
      ],
    );
  }
};

const migrateQuestions = async (rows) => {
  for (const row of rows) {
    if (!row.subject || !row.topic || !row.question_text || !row.answer) continue;
    await target.query(
      `INSERT INTO questions (id, subject, topic, question_text, options, answer)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       ON CONFLICT (id) DO UPDATE SET subject = EXCLUDED.subject,
         topic = EXCLUDED.topic, question_text = EXCLUDED.question_text,
         options = EXCLUDED.options, answer = EXCLUDED.answer`,
      [
        legacyId("questions", row),
        row.subject,
        row.topic,
        row.question_text,
        JSON.stringify(row.options || []),
        row.answer,
      ],
    );
  }
};

const importers = { papers: migratePapers, videos: migrateVideos, questions: migrateQuestions };

try {
  const tables = await sourceTables();
  for (const table of Object.keys(importers)) {
    if (!tables.has(table)) {
      console.log(`Skipped ${table}: table does not exist in the source database.`);
      continue;
    }
    const result = await source.query(`SELECT * FROM "${table}"`);
    await importers[table](result.rows);
    console.log(`Migrated ${result.rows.length} legacy PostgreSQL ${table} records.`);
  }
  console.log("Legacy accounts, profiles, and settings were not copied because they do not have Firebase UIDs.");
} finally {
  await Promise.all([source.end(), target.end()]);
}

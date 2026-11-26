import { createHash, randomUUID } from "crypto";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(backendDir, ".env") });
const documentsDir = path.resolve(
  process.env.DOCUMENTS_DIR || path.resolve(backendDir, "../../documents"),
);
const applyChanges = process.argv.includes("--apply");

const collectPdfs = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectPdfs(fullPath));
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".pdf") {
      files.push(fullPath);
    }
  }
  return files;
};

const getPdfHash = async (file) => {
  const handle = await fs.open(file, "r");
  try {
    const header = Buffer.alloc(5);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (bytesRead !== 5 || header.toString("ascii") !== "%PDF-") return null;
  } finally {
    await handle.close();
  }

  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
};

const describePaper = (file, documentsRoot) => {
  const filename = path.basename(file);
  const context = `${filename} ${path.relative(documentsRoot, file)}`.toLowerCase();
  const year = context.match(/(?:19|20)\d{2}/)?.[0] || "Unknown";
  const level = /\b(al|advanced)\b/.test(context)
    ? "Advanced Level"
    : /\b(ol|ordinary|o-level)\b/.test(context)
      ? "Ordinary Level"
      : "Other";
  const subject = /chemistry/.test(context)
    ? "Chemistry"
    : /p\s*maths|pure mathematics/.test(context)
      ? "Pure Mathematics"
      : "General";
  const paperName = /marking|mark scheme/.test(context)
    ? "Marking Guide"
    : /solutions?/.test(context)
      ? "Solutions"
      : /analysis/.test(context)
        ? "Analysis"
        : /(?:paper|p)\s*2|[-_]2(?:[-_.]|$)/.test(context)
          ? "Paper 2"
          : /(?:paper|p)\s*1|[-_]1(?:[-_.]|$)/.test(context)
            ? "Paper 1"
            : /mock/.test(context)
              ? "Mock Exam"
              : "Past Paper";

  return { filename, year, level, subject, paperName };
};

const toBlobFilename = (filename) =>
  filename.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "_");

const retryDatabaseQuery = async (operation, description) => {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      console.error(
        `Database ${description} attempt ${attempt}/4 failed (${error.code || "connection error"}); retrying in ${attempt}s.`,
      );
      await pool.end();
      pool = new PoolClass({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_URL.includes("localhost")
          ? false
          : { rejectUnauthorized: true },
        max: 1,
        connectionTimeoutMillis: 10_000,
      });
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
};

const retryBlobUpload = async (operation, filename) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
      console.error(
        `Upload ${filename} attempt ${attempt}/3 failed; retrying in ${attempt}s.`,
      );
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
};

let pool;
let PoolClass;
try {
  const allPdfs = await collectPdfs(documentsDir);
  if (!allPdfs.length) {
    throw new Error(`No PDF files were found in ${documentsDir}.`);
  }

  const uniquePapers = new Map();
  const invalidFiles = [];
  for (const file of allPdfs) {
    const hash = await getPdfHash(file);
    if (!hash) {
      invalidFiles.push(path.relative(documentsDir, file));
      continue;
    }
    if (!uniquePapers.has(hash)) {
      uniquePapers.set(hash, {
        hash,
        file,
        ...describePaper(file, documentsDir),
      });
    }
  }

  const papers = [...uniquePapers.values()];
  if (!papers.length) {
    throw new Error("No valid PDF files were found; no database changes were made.");
  }

  console.log(`Documents directory: ${documentsDir}`);
  console.log(`PDF files found: ${allPdfs.length}`);
  console.log(`Unique valid PDFs to import: ${papers.length}`);
  console.log(`Duplicate PDFs skipped: ${allPdfs.length - invalidFiles.length - papers.length}`);
  if (invalidFiles.length) {
    console.log(`Invalid PDF files skipped: ${invalidFiles.join(", ")}`);
  }
  for (const paper of papers) {
    console.log(`- ${paper.filename} | ${paper.subject} | ${paper.level} | ${paper.year} | ${paper.paperName}`);
  }

  if (!applyChanges) {
    console.log("Dry run only. Existing papers were not changed. Re-run with --apply to replace them.");
  } else {
    if (!process.env.DATABASE_URL) {
      throw new Error("Set DATABASE_URL before replacing database papers.");
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error("Set BLOB_READ_WRITE_TOKEN before uploading paper files.");
    }

    ({ Pool: PoolClass } = await import("pg"));
    const { put } = await import("@vercel/blob");
    let nextPaperIndex = 0;
    await Promise.all(
      Array.from({ length: Math.min(3, papers.length) }, async () => {
        while (nextPaperIndex < papers.length) {
          const index = nextPaperIndex++;
          const paper = papers[index];
          console.log(`Uploading paper ${index + 1}/${papers.length}: ${paper.filename}`);
          const blob = await retryBlobUpload(
            () => put(
              `s-learn/imported-papers/${paper.hash}-${toBlobFilename(paper.filename)}`,
              createReadStream(paper.file),
              {
                access: "public",
                addRandomSuffix: false,
                allowOverwrite: true,
              },
            ),
            paper.filename,
          );
          paper.link = blob.url;
        }
      }),
    );

    pool = new PoolClass({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost")
        ? false
        : { rejectUnauthorized: true },
      max: 1,
      connectionTimeoutMillis: 10_000,
    });
    const existing = await retryDatabaseQuery(
      () => pool.query("SELECT COUNT(*)::int AS count FROM papers"),
      "check",
    );
    console.log(`Existing paper rows to replace: ${existing.rows[0].count}`);
    await retryDatabaseQuery(() => pool.query("SELECT 1"), "reconnect");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM papers");
      for (const paper of papers) {
        await client.query(
          `INSERT INTO papers
           (id, level, specialty, subject, paper_name, year, link, status, approved_at)
           VALUES ($1, $2, '', $3, $4, $5, $6, 'approved', NOW())`,
          [
            randomUUID(),
            paper.level,
            paper.subject,
            paper.paperName,
            paper.year,
            paper.link,
          ],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    console.log(`Replaced all paper rows with ${papers.length} approved document records.`);
    console.log("Video rows and other database tables were not changed.");
  }
} finally {
  await pool?.end();
}

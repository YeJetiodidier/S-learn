import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs/promises";
import { createReadStream } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { list, put } from "@vercel/blob";
import pg from "pg";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const papersOnly = process.argv.includes("--papers-only");
const linkExistingOnly = process.argv.includes("--link-existing-only");
const documentsDir = path.resolve(
  process.env.DOCUMENTS_DIR || path.resolve(__dirname, "../../documents"),
);

if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL before migrating uploaded files.");
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  throw new Error("Set BLOB_READ_WRITE_TOKEN before migrating uploaded files.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true },
  max: 1,
  connectionTimeoutMillis: 10_000,
});

const collectFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }
  return files;
};

const normalizePath = (value) => value.replace(/\\/g, "/").replace(/^\/+/, "");

const getReferencePath = (value) => {
  try {
    const pathname = new URL(value, "http://localhost").pathname;
    const marker = "/documents/";
    const index = pathname.indexOf(marker);
    return index === -1 ? null : decodeURIComponent(pathname.slice(index + marker.length));
  } catch {
    return null;
  }
};

const normalizeFilename = (value) =>
  path.posix
    .basename(normalizePath(value))
    .replace(/^\d+-/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const hashFile = (file) =>
  new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });

const listExistingBlobs = async () => {
  const blobs = [];
  let cursor;
  do {
    const page = await list({
      prefix: "s-learn/",
      limit: 1000,
      ...(cursor ? { cursor } : {}),
    });
    blobs.push(...page.blobs);
    cursor = page.cursor;
  } while (cursor);
  return blobs;
};

try {
  await pool.query("SELECT 1");
  const allFiles = await collectFiles(documentsDir);
  const files = papersOnly
    ? allFiles.filter((file) => path.extname(file).toLowerCase() === ".pdf")
    : allFiles;
  if (files.length === 0) {
    throw new Error(
      papersOnly
        ? `No PDF papers were found in ${documentsDir}.`
        : `No files were found in ${documentsDir}.`,
    );
  }

  if (linkExistingOnly && !papersOnly) {
    throw new Error("--link-existing-only requires --papers-only.");
  }

  if (papersOnly) {
    const filesByName = new Map();
    for (const file of files) {
      const filename = normalizeFilename(path.basename(file));
      const matchingFiles = filesByName.get(filename) || [];
      matchingFiles.push(file);
      filesByName.set(filename, matchingFiles);
    }

    for (const [filename, matchingFiles] of filesByName) {
      if (matchingFiles.length < 2) continue;
      const hashes = await Promise.all(matchingFiles.map(hashFile));
      if (new Set(hashes).size > 1) {
        throw new Error(
          `Cannot safely match multiple different PDFs named ${filename}.`,
        );
      }
    }
  }

  const blobByPath = new Map();
  const existingBlobs = linkExistingOnly ? await listExistingBlobs() : [];
  for (const blob of existingBlobs) {
    const relativePath = normalizePath(blob.pathname).replace(/^s-learn\//, "");
    blobByPath.set(relativePath, blob);
  }

  for (const [index, file] of files.entries()) {
    const relativePath = normalizePath(path.relative(documentsDir, file));
    if (linkExistingOnly) {
      if (!blobByPath.has(relativePath)) {
        throw new Error(`Blob file not found for ${relativePath}; no database links were changed.`);
      }
      continue;
    }

    const blob = await put(`s-learn/${relativePath}`, createReadStream(file), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    blobByPath.set(relativePath, blob);
    console.log(`Uploaded ${index + 1}/${files.length}: ${relativePath}`);
  }

  if (papersOnly) {
    const blobByFilename = new Map();
    for (const [relativePath, blob] of blobByPath) {
      if (!relativePath.toLowerCase().endsWith(".pdf")) continue;
      const filename = normalizeFilename(relativePath);
      if (!blobByFilename.has(filename)) {
        blobByFilename.set(filename, blob);
      }
    }

    const papers = await pool.query("SELECT id, link FROM papers WHERE link <> ''");
    let updatedReferences = 0;
    await pool.query("BEGIN");
    try {
      for (const paper of papers.rows) {
        const referencePath = getReferencePath(paper.link);
        if (!referencePath) continue;
        const blob =
          blobByPath.get(normalizePath(referencePath)) ||
          blobByFilename.get(normalizeFilename(referencePath));
        if (!blob || paper.link === blob.url) continue;
        await pool.query("UPDATE papers SET link = $1 WHERE id = $2", [blob.url, paper.id]);
        updatedReferences++;
      }
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
    console.log(
      `${linkExistingOnly ? "Linked existing PDFs" : "Migrated PDFs"}: ${files.length} files, ${updatedReferences} paper references updated.`,
    );
  } else {
    const papers = await pool.query("SELECT id, link FROM papers WHERE link <> ''");
    const videos = await pool.query("SELECT id, video_url FROM videos WHERE video_url <> ''");
    for (const file of files) {
      const relativePath = normalizePath(path.relative(documentsDir, file));
      const blob = blobByPath.get(relativePath);
      for (const paper of papers.rows) {
        if (normalizePath(getReferencePath(paper.link) || "") === relativePath) {
          await pool.query("UPDATE papers SET link = $1 WHERE id = $2", [blob.url, paper.id]);
        }
      }
      for (const video of videos.rows) {
        if (normalizePath(getReferencePath(video.video_url) || "") === relativePath) {
          await pool.query("UPDATE videos SET video_url = $1 WHERE id = $2", [blob.url, video.id]);
        }
      }
    }
  }
} finally {
  await pool.end();
}

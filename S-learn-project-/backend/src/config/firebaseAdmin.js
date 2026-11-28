import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resolveCredentialFile = () => {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw) return null;
  if (fs.existsSync(raw)) return raw;

  // Handle Windows-style paths when running on Linux/macOS by checking the repo root.
  const baseName = path.basename(raw.replace(/\\/g, "/"));
  if (!baseName) return null;

  const candidates = [
    path.resolve(__dirname, "../../../../", baseName),
    path.resolve(__dirname, "../../../", baseName),
    path.resolve(__dirname, "../../", baseName),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const getFirebaseAdminApp = () => {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccount) {
    let credentials;
    try {
      credentials = JSON.parse(serviceAccount);
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain valid JSON.", {
        cause: error,
      });
    }

    return initializeApp({ credential: cert(credentials) });
  }

  const credentialFile = resolveCredentialFile();
  if (credentialFile) {
    const parsed = JSON.parse(fs.readFileSync(credentialFile, "utf8"));
    return initializeApp({ credential: cert(parsed) });
  }

  return initializeApp({ credential: applicationDefault() });
};

export const verifyFirebaseIdToken = async (idToken) =>
  getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);

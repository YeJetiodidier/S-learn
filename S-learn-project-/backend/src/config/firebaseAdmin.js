import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

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

  return initializeApp({ credential: applicationDefault() });
};

export const verifyFirebaseIdToken = async (idToken) =>
  getAuth(getFirebaseAdminApp()).verifyIdToken(idToken);

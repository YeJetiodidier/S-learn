// Firebase Authentication service layer.
// Replaces the old Express/PostgreSQL auth routes with Firebase Auth.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  verifyPasswordResetCode,
  confirmPasswordReset,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "./config";
import { apiRequest } from "./apiClient";

const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/cancelled-popup-request",
]);

const signInWithProvider = async (provider) => {
  try {
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  } catch (err) {
    if (!POPUP_FALLBACK_CODES.has(err?.code)) throw err;
    await signInWithRedirect(auth, provider);
    return null;
  }
};

// Firebase remains the identity provider; profile data is stored in Postgres.
export const registerUser = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const user = cred.user;
  await apiRequest(`/profile/${encodeURIComponent(user.uid)}`, {
    method: "PUT",
    body: { username: name },
  });
  return user;
};

export const loginUser = async (email, password) =>
  signInWithEmailAndPassword(auth, email.trim(), password);

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithProvider(provider);
};

export const loginWithFacebook = async () => {
  const provider = new FacebookAuthProvider();
  provider.setCustomParameters({ display: "popup" });
  return signInWithProvider(provider);
};

export const completeSocialRedirect = async () => {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
};

export const watchSocialRedirect = (onUser, onError) => {
  let cancelled = false;
  completeSocialRedirect()
    .then((user) => {
      if (!cancelled && user) onUser(user);
    })
    .catch((err) => {
      if (!cancelled) onError(err);
    });
  return () => {
    cancelled = true;
  };
};

export const logoutUser = () => signOut(auth);

const getResetRedirectUrl = () => {
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
  return `${origin}/reset-password`;
};

// Password reset via Firebase email link (replaces the old phone/OTP flow).
export const sendResetEmail = (email) =>
  sendPasswordResetEmail(auth, email, {
    url: getResetRedirectUrl(),
    handleCodeInApp: false,
  });

// Used by the ResetPassword page when the user lands with an oobCode in the URL.
export const confirmResetPassword = async (oobCode, newPassword) => {
  await verifyPasswordResetCode(auth, oobCode);
  return confirmPasswordReset(auth, oobCode, newPassword);
};

// Change password: requires re-authentication with the current password.
export const changePassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("No authenticated user");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

// Remove the app's account data before deleting the Firebase Auth identity.
export const deleteAccount = async (currentPassword = "") => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  if (currentPassword && user.email) {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  }
  await apiRequest(`/profile/${encodeURIComponent(user.uid)}`, { method: "DELETE" });
  await deleteUser(user);
};

// Export the current user's full data (profile, settings, study progress, schedule).
export const exportUserData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  const encodedUid = encodeURIComponent(user.uid);
  const [profile, settings, studyProgress, schedule] = await Promise.all([
    apiRequest(`/profile/${encodedUid}`),
    apiRequest(`/settings/${encodedUid}`),
    apiRequest(`/progress/${encodedUid}`).catch(() => []),
    apiRequest(`/schedule/${encodedUid}`).catch(() => []),
  ]);
  return {
    account: { uid: user.uid, email: user.email },
    user: profile,
    settings,
    studyProgress: Array.isArray(studyProgress) ? studyProgress : [],
    schedule: Array.isArray(schedule) ? schedule : [],
    exportedAt: new Date().toISOString(),
  };
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
export const getCurrentUser = () => auth.currentUser;

// Maps Firebase Auth error codes to friendly messages.
export const mapAuthError = (err) => {
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/account-exists-with-different-credential":
      return "This account is already linked to another sign-in method. Try Google or Facebook, or use email and password.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed before finishing. Please try again.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/requires-recent-login":
      return "Please log in again before performing this action.";
    case "auth/too-many-requests":
      return "Too many attempts right now. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "We couldn't connect right now. Please check your internet connection and try again.";
    case "auth/operation-not-allowed":
      return "This sign-in method isn't available right now. Please use email and password instead.";
    case "auth/unauthorized-domain":
      return "Sign-in isn't available from this address right now. Please try again later.";
    case "auth/expired-action-code":
      return "This reset link has expired. Please request a new password reset email.";
    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used. Please request a new one.";
    case "auth/configuration-not-found":
    case "auth/internal-error":
      return "We couldn't complete sign-in right now. Please try email and password or try again shortly.";
    default:
      return "Authentication failed. Please try again.";
  }
};

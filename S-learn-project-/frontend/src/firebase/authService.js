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
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "./config";
import { apiRequest } from "./apiClient";

// Firebase remains the identity provider; profile data is stored in Postgres.
export const registerUser = async (name, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  await apiRequest(`/profile/${encodeURIComponent(user.uid)}`, {
    method: "PUT",
    body: { username: name },
  });
  return user;
};

export const loginUser = async (email, password) => {
  const methods = await fetchSignInMethodsForEmail(auth, email);

  if (methods.length > 0 && !methods.includes("password")) {
    const providerName = methods[0] === "google.com"
      ? "Google"
      : methods[0] === "facebook.com"
        ? "Facebook"
        : methods[0];

    const err = new Error(
      `This account was created with ${providerName} sign-in. Please use the ${providerName} button to continue.`
    );
    err.code = "auth/account-uses-social-login";
    throw err;
  }

  return signInWithEmailAndPassword(auth, email, password);
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
};

export const loginWithFacebook = async () => {
  const provider = new FacebookAuthProvider();
  provider.setCustomParameters({ display: "popup" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
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
export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await apiRequest(`/profile/${encodeURIComponent(user.uid)}`, { method: "DELETE" });
  await deleteUser(user);
};

// Export the current user's data as a plain object (replaces /api/auth/export).
export const exportUserData = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  const [profile, settings] = await Promise.all([
    apiRequest(`/profile/${encodeURIComponent(user.uid)}`),
    apiRequest(`/settings/${encodeURIComponent(user.uid)}`),
  ]);
  return {
    account: { uid: user.uid, email: user.email },
    user: profile,
    settings,
    exportedAt: new Date().toISOString(),
  };
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
export const getCurrentUser = () => auth.currentUser;

// Maps Firebase Auth error codes to friendly messages.
export const mapAuthError = (err) => {
  // Debug: log the full error object to the console
  console.error("Firebase Auth Error Object:", err);
  const code = err?.code || "";
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/account-uses-social-login":
      return "This account was created with Google/Facebook sign-in. Please use the Google or Facebook button to continue.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/account-exists-with-different-credential":
      return "This account is already linked to another sign-in method.";
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked. Please allow popups and try again.";
    case "auth/popup-closed-by-user":
      return "The sign-in window was closed before finishing. Please try again.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/requires-recent-login":
      return "Please log in again before performing this action.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
    default:
      return err?.message || "Authentication failed. Please try again.";
  }
};

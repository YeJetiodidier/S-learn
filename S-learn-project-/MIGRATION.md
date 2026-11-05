# Neon and Vercel migration

## What this changes

- Firebase Authentication remains the identity provider.
- Neon Postgres stores profiles, settings, past-paper metadata, video metadata, and exam questions.
- Vercel Blob stores uploaded PDFs, videos, and avatars. The database stores their public URLs.
- Completed exams update per-user lesson counts and distinct studied subject/topic counts in Neon.
- The backend remains an Express app locally and is exposed as Vercel Functions when deployed.
- All data API requests require a Firebase ID token. Admin-only operations use the `app_users.role` value in Postgres.

## Configure local development

1. Copy `frontend/.env.example` to `frontend/.env.local` and fill in the Firebase web-app values from Firebase Project Settings.
2. Copy `backend/.env.example` to `backend/.env`. Set `DATABASE_URL` to the Neon pooled connection string, `FIREBASE_PROJECT_ID` to the source Firebase project ID, and `BLOB_READ_WRITE_TOKEN` to a development Blob token. Set `LEGACY_DATABASE_URL` only when importing the existing PostgreSQL database.
   The local frontend's `VITE_BACKEND_URL=http://localhost:5000` is only reachable on the development machine. Other devices need the deployed backend URL and a backend connected to the same Neon database.
   If PostgreSQL stops connecting, copy the current connection string from the correct Neon project's **Connect** dialog into the backend's active `.env` (and the deployed backend's environment variables). Do not use the example connection string or place database credentials in the frontend `.env`. Restart/redeploy the backend and verify `GET /readyz` returns `200` with `"database":"connected"`. Startup retries can recover transient failures, but they cannot correct a stale, deleted, or incorrect Neon endpoint.
3. Configure Firebase Admin credentials locally with Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS`. Do not commit credentials.
4. Install dependencies with `npm install --prefix frontend` and `npm install --prefix backend`.
5. Apply all numbered schema migrations with `npm run db:migrate --prefix backend`.
6. Start the app from the repository root with `npm run dev`.

## Configure Vercel

Deploy the backend and frontend as separate Vercel projects:

1. Create a backend project with Root Directory `backend`. Add `DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, the Vercel Blob `BLOB_READ_WRITE_TOKEN`, and comma-separated `FRONTEND_ORIGINS` as server-side environment variables for Preview and Production. Never prefix these with `VITE_`.
2. Connect a Blob store to the backend Vercel project and set the service account JSON only in Vercel's encrypted environment settings.
3. Create a frontend project with Root Directory `frontend`. Configure the Firebase `VITE_FIREBASE_*` values and set `VITE_BACKEND_URL` to the deployed backend origin. The included `frontend/vercel.json` routes React Router paths back to the app entry point.
4. In Firebase Authentication's authorized domains, add the production and preview frontend hostnames. Set `FRONTEND_ORIGINS` to the exact frontend origins (comma-separated); unlisted origins are rejected.
5. Run the schema migration against the production Neon database before routing production traffic to the new frontend.
6. Non-admin paper submissions remain pending and are hidden from the shared paper list until an admin approves them.

## Import existing data

Take and retain a Firebase export before importing. Run the importer using the source project's Firebase Admin credentials and the destination Neon `DATABASE_URL`:

```powershell
npm run db:import:firestore --prefix backend
```

The importer preserves Firestore document IDs and is safe to rerun for the same records. Check the printed collection counts against Firebase before cutover. It does not import Firebase Authentication users or passwords; those remain in Firebase Auth.

The importer reads Firestore only. If the older PostgreSQL tables (`accounts`, legacy `users`, or the old route-created tables) contain data that is not present in Firestore, export and reconcile those records separately before cutover.

The backend also includes an importer for legacy PostgreSQL `papers`, `videos`, and `questions` tables. Run it only if those source tables contain records not represented in Firestore:

```powershell
npm run db:import:legacy-postgres --prefix backend
```

Set `LEGACY_DATABASE_URL` to the old PostgreSQL source and `DATABASE_URL` to Neon. Legacy account/profile/settings rows are deliberately not imported because their numeric IDs cannot be safely matched to Firebase Authentication UIDs; do not migrate legacy passwords into Firebase or Postgres.

After connecting Vercel Blob and migrating data, copy existing files from `documents` (or set `DOCUMENTS_DIR` to a directory exported from the old API host):

```powershell
npm run db:import:files --prefix backend
```

This uploads files found in the repository's `documents` directory and updates matching paper/video URLs in Neon. Keep the original files and database export until the migration is verified.

## Cutover checklist

1. Apply all migrations in `backend/migrations` through the migration command.
2. Import Firestore collections and local `documents` files.
3. Check row counts, media URLs, and that at least one existing admin still has `role = 'Admin'` (case-insensitive) in `app_users`.
4. Test signup/login, profile/settings edits, paper and video uploads, approval/deletion, and question retrieval on a Vercel Preview deployment.
5. During the final cutover, pause writes to the old app, rerun both import commands, validate data, and then direct users to the new frontend.
6. Keep the old Firestore data and original uploads unchanged until production verification and rollback are no longer needed.

The Blob migration script currently expects references in Neon to use URLs whose path contains `/documents/<relative-path>`. Files with no matching database record are still uploaded; unrelated external video URLs are left unchanged. If old uploads live only on a deployed host, export them first and point `DOCUMENTS_DIR` at that export.

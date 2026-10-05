# TrackPlus

## Isolated demo

The demo provides one-click access to every seeded role, supports real project
approval and user-invitation workflows, and lists newly invited users on the
login page. Demo data is reset after each 24-hour window on the first API
request after the window expires.

Use a dedicated PostgreSQL database for the demo. Never enable demo mode on a
production database.

PostgreSQL database contents are not uploaded with this source code. The
repository includes the Prisma schema and migrations only. Create your own
database and point `DATABASE_URL` at it.

1. Copy `Backend/.env.example` to `Backend/.env` and set `DATABASE_URL` and
   `JWT_SECRET`. Copy `frontend/.env.example` to `frontend/.env` if you need a
   local API URL (`VITE_API_URL`).
2. Set `DEMO_MODE=true` only for the isolated demo database.
3. Install dependencies with `npm install` at the project root and inside
   `frontend`.
4. Apply schema changes with `npm run db:migrate`, then load the demo baseline
   once with `npm run demo:reset`.
5. Start the backend and frontend with `npm run dev`. The API-only process is
   `npm start`.

For an exact wall-clock reset, schedule `npm run demo:reset` every 24 hours in
the hosting platform. The built-in request-time reset remains a fallback.

Demo features (quick login, resets) are active only when `DEMO_MODE=true` and
the database is named `trackplus_demo`.

## Production build

`npm run build --prefix frontend` builds the web app into `frontend/dist`.
When that folder exists, `npm start` serves the app and the API from the same
port, with the API under `/api` and a health check at `/healthz`.

## Google Cloud deployment

The `Dockerfile` builds a single image for Cloud Run. See
[deploy/gcp/README.md](deploy/gcp/README.md) for the Cloud Run, Cloud SQL,
Secret Manager and Cloud Scheduler setup.

## Sign-in, invitations and activation

- **Password sign-in is two steps, both enforced by the API.** `POST /api/auth/login`
  checks the email and password and returns a one-time code challenge, not a
  session. `POST /api/auth/login/verify` exchanges the 6-digit code for the
  session token. Codes expire after 5 minutes, lock after 5 wrong attempts, and
  can be re-sent after 30 seconds (`POST /api/auth/login/resend`).
- **No mail service is connected yet.** When `DEMO_MODE=true` or
  `NODE_ENV` is not `production`, the API returns the code in the login
  response and the verification screen shows it. Otherwise the code is only
  written to the server log.
- **The six demo buttons skip the code step** and work only when
  `DEMO_MODE=true`.
- **Invitations create pending accounts.** Upper management invites a user from
  Settings; the API stores the account as pending with an unusable password and
  returns a one-time activation link (`FRONTEND_URL/activate?token=…`, valid for
  7 days, stored hashed). Pending accounts cannot sign in or use demo login.
  The inviter can issue a fresh link from the users list, which revokes the
  previous one. Opening the link lets the invitee set their own password, after
  which they sign in normally.
- **Expired sessions return to the login page.** Any authenticated request that
  gets a 401 (expired token, suspended account, or a user removed by the daily
  demo reset) clears the stored session and redirects to `/login`.

Run `npm run demo:check` against a running API on port 5001 to exercise these
flows together with the project approval workflow.

## Project attachments

Files attached to org and client projects (including contract files) are
uploaded to `POST /api/{org|client}/projects/:projectId/attachments` as
multipart field `files` (PDF, Word, Excel, PNG, JPG or Figma, up to 10 MB each,
10 per request). Records are stored in `org_project_attachments` and
`client_project_attachments`; the file bytes go to storage:

- **Cloud Storage** when `ATTACHMENTS_BUCKET` is set. Use this on Cloud Run. The
  service account needs `roles/storage.objectAdmin` on that bucket only; the
  bucket can stay private because downloads are streamed through the API.
- **Local disk** otherwise, under `UPLOAD_DIR` (default `Backend/uploads`).

Every member of the project's org or client can list and download. Data Entry
can add files and remove their own files only while the project is a draft or
rejected; Upper Management can manage files at any stage. Download links in API
responses (`fileUrl`, relative to the API root) are signed and expire after one
hour; reloading the project returns fresh links. The demo reset deletes all
stored attachment files together with the database rows.

`npm run check:attachments` runs the upload, download and permission checks
against a running demo API (`API_URL`, default `http://localhost:5001/api`).

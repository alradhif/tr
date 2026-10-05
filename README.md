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

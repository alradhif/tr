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

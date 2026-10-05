# Deploying the Track+ demo on Google Cloud

The demo runs as one container on Cloud Run. The container serves the built
React app and the Express API from the same URL, and talks to a dedicated
Cloud SQL for PostgreSQL database named `trackplus_demo`. Secrets live in
Secret Manager and are injected at runtime; nothing secret is in the
repository or the image. A Cloud Scheduler job restores the demo baseline
every 24 hours.

```
Browser ──> Cloud Run service "trackplus-demo" (Express: /api + SPA)
                 │  unix socket /cloudsql/...
                 ▼
            Cloud SQL "trackplus-demo-sql" ── database trackplus_demo
                 ▲
Cloud Scheduler (daily) ──> Cloud Run job "trackplus-demo-reset"
Release ──> Cloud Run job "trackplus-demo-migrate" (prisma migrate deploy)
Secret Manager: trackplus-database-url, trackplus-jwt-secret
Cloud Storage: private bucket <project>-trackplus-demo-attachments (project attachments)
```

## Cost

Sized for a temporary demo. Rough monthly cost in `us-central1`:

| Resource | Setting | Approx. cost |
| --- | --- | --- |
| Cloud SQL PostgreSQL 16 | `db-f1-micro`, 10 GB SSD, zonal, no backups | about $9 to $11 |
| Cloud Run service | scales to zero, max 1 instance, 1 vCPU / 512 MiB | usually free tier |
| Cloud Run jobs | a few seconds per day | usually free tier |
| Cloud Scheduler | 1 job | free (3 jobs free) |
| Secret Manager | 2 secrets | a few cents |
| Artifact Registry | a few image versions | a few cents |
| Cloud Storage | private attachments bucket, cleared daily | a few cents |

Cloud SQL is the only always-on cost. Run `deploy/gcp/deploy.sh teardown` when
the demo is over. Stopping the instance in between
(`gcloud sql instances patch trackplus-demo-sql --activation-policy NEVER`)
stops the compute charge but the demo will be down until it is started again.

## Prerequisites

- A Google Cloud project with billing enabled, and `gcloud` installed and
  signed in (`gcloud auth login`) as a project Owner or Editor.
- `git` and `openssl` on the machine running the script (Cloud Shell has both).
- Run from a checkout of this repository.

If Cloud Build fails with a permission error on a newly created project, grant
the Cloud Build service account (the Compute Engine default service account on
new projects) `roles/artifactregistry.writer`, `roles/logging.logWriter` and
`roles/storage.objectViewer`.

## First deployment

```bash
export PROJECT_ID=your-project-id
export REGION=us-central1        # optional; e.g. me-central2 is closer to Saudi Arabia

deploy/gcp/deploy.sh setup       # one time: APIs, registry, Cloud SQL, secrets, service accounts
deploy/gcp/deploy.sh release     # build, migrate, load baseline, schedule reset, deploy
```

`setup` creates the billable resources. Cloud SQL creation takes several
minutes. It generates a random database password and JWT secret and writes
them straight into Secret Manager; they are never printed or stored locally.

`release` prints the demo URL at the end. On the first release it also loads
the synthetic baseline. Run `release` again to ship a new version; it re-runs
migrations and redeploys the service and jobs.

## Configuration

Runtime environment of the Cloud Run service:

| Variable | Source | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Secret `trackplus-database-url` | `postgresql://trackplus:…@localhost/trackplus_demo?host=/cloudsql/PROJECT:REGION:INSTANCE` |
| `JWT_SECRET` | Secret `trackplus-jwt-secret` | Signs session tokens. The server refuses to start without it. |
| `DEMO_MODE` | `true` | Enables quick login and the 24 h reset. |
| `ATTACHMENTS_BUCKET` | `<project>-trackplus-demo-attachments` | Private bucket for project attachments; the runtime service account has `roles/storage.objectAdmin` on it only. Files are streamed through the API. |
| `PORT` | Cloud Run (`8080`) | Listen port. |
| `FRONTEND_URL` | optional | Extra CORS origins, comma separated. Not needed when the app is served by the container. |

Script settings (environment variables for `deploy.sh`): `PROJECT_ID`
(required), `REGION`, `ATTACHMENTS_BUCKET`, `SERVICE`, `SQL_INSTANCE`, `SQL_TIER`, `DB_USER`, `REPO`,
`RESET_SCHEDULE` (cron, default `0 0 * * *`), `RESET_TIME_ZONE` (default
`Asia/Riyadh`), `IMAGE_TAG`.

To rotate the JWT secret, add a new version and redeploy (all sessions end):

```bash
openssl rand -hex 48 | tr -d '\n' | gcloud secrets versions add trackplus-jwt-secret --data-file=-
deploy/gcp/deploy.sh release
```

## Demo isolation

Demo-only behaviour is active only when **both** `DEMO_MODE=true` **and** the
connected database is named `trackplus_demo`:

- The six quick-login buttons on the login page are shown only when
  `GET /api/auth/demo/status` reports `enabled: true`, and
  `POST /api/auth/demo/login` returns 404 otherwise.
- The reset (`Backend/src/utils/resetDemo.js`) refuses to run unless both
  conditions hold, so pointing it at any other database does nothing.
- The reset truncates every table in the `public` schema of `trackplus_demo`,
  deletes uploaded attachments from the bucket, and re-seeds the synthetic
  baseline. Never reuse this instance or database
  for real data.
- On the demo, the forgot-password request returns the reset token in the
  response (there is no email delivery), so testers can complete the flow.

## Daily reset

Cloud Scheduler calls the Cloud Run Admin API to execute the
`trackplus-demo-reset` job every day at midnight Riyadh time. The app also
keeps its built-in fallback: the first API request after a 24-hour window
triggers a reset if the scheduled one did not run.

Reset immediately: `deploy/gcp/deploy.sh reset`, or
`gcloud scheduler jobs run trackplus-demo-reset --location $REGION`.

## Operations

- Logs: `gcloud run services logs read trackplus-demo --region $REGION`
- Job history: `gcloud run jobs executions list --job trackplus-demo-reset --region $REGION`
- Health check: `curl https://<service-url>/healthz`
- Connect to the database: `gcloud sql connect trackplus-demo-sql --user trackplus --database trackplus_demo`
  (the password is in the `trackplus-database-url` secret).

## Running the container locally

```bash
docker build -t trackplus .
docker run --rm -p 8080:8080 \
  -e DATABASE_URL=postgresql://USER:PASSWORD@host.docker.internal:5432/trackplus_demo \
  -e JWT_SECRET=local-dev-secret -e DEMO_MODE=true trackplus
# one time against a fresh database:
docker run --rm -e DATABASE_URL=... trackplus npx prisma migrate deploy
docker run --rm -e DATABASE_URL=... -e DEMO_MODE=true trackplus node Backend/src/utils/resetDemo.js
```

## Known limitations

- The service runs a single instance (`--max-instances 1`) so the request-time
  reset fallback never runs twice at once. That is plenty for a team demo.
- The first request after the service has scaled to zero takes a few seconds
  (cold start). Set `--min-instances 1` for a warmer demo at extra cost.
- Container disk is ephemeral. Attachments go to the Cloud Storage bucket
  when `ATTACHMENTS_BUCKET` is set (the script sets it); without it they would
  fall back to local disk and be lost on restart.
- `db-f1-micro` is a shared-core tier without an SLA; fine for a demo, not for
  production.

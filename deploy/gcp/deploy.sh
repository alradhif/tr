#!/usr/bin/env bash
# Track+ demo on Google Cloud: Cloud Run + Cloud SQL (PostgreSQL) + Secret Manager
# + Cloud Scheduler. See deploy/gcp/README.md for the full walkthrough.
#
#   deploy/gcp/deploy.sh setup     one-time infrastructure (creates billable resources)
#   deploy/gcp/deploy.sh release   build the image, migrate, deploy service + jobs + schedule
#   deploy/gcp/deploy.sh reset     restore the demo baseline now
#   deploy/gcp/deploy.sh teardown  delete everything this script created
set -euo pipefail

PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project id}"
REGION="${REGION:-us-central1}"
SERVICE="${SERVICE:-trackplus-demo}"
SQL_INSTANCE="${SQL_INSTANCE:-trackplus-demo-sql}"
SQL_TIER="${SQL_TIER:-db-f1-micro}"
DB_NAME="trackplus_demo" # demo safety checks refuse any other database name
DB_USER="${DB_USER:-trackplus}"
REPO="${REPO:-trackplus}"
RESET_SCHEDULE="${RESET_SCHEDULE:-0 0 * * *}"
RESET_TIME_ZONE="${RESET_TIME_ZONE:-Asia/Riyadh}"

RUN_SA="trackplus-run@${PROJECT_ID}.iam.gserviceaccount.com"
SCHEDULER_SA="trackplus-scheduler@${PROJECT_ID}.iam.gserviceaccount.com"
SECRET_DB_URL="trackplus-database-url"
SECRET_JWT="trackplus-jwt-secret"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/trackplus:${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"
CONNECTION="${PROJECT_ID}:${REGION}:${SQL_INSTANCE}"
MIGRATE_JOB="${SERVICE}-migrate"
RESET_JOB="${SERVICE}-reset"

gc() { gcloud --project "$PROJECT_ID" --quiet "$@"; }
random_secret() { openssl rand -hex "$1"; }
exists() { "$@" >/dev/null 2>&1; }

setup() {
  echo "==> Enabling APIs"
  gc services enable run.googleapis.com sqladmin.googleapis.com secretmanager.googleapis.com \
    artifactregistry.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com

  echo "==> Artifact Registry repository"
  exists gc artifacts repositories describe "$REPO" --location "$REGION" ||
    gc artifacts repositories create "$REPO" --location "$REGION" --repository-format docker

  echo "==> Cloud SQL instance ($SQL_TIER, no HA, no backups)"
  if ! exists gc sql instances describe "$SQL_INSTANCE"; then
    gc sql instances create "$SQL_INSTANCE" \
      --database-version POSTGRES_16 --edition ENTERPRISE --tier "$SQL_TIER" \
      --region "$REGION" --storage-type SSD --storage-size 10 --no-storage-auto-increase \
      --availability-type zonal --no-backup
  fi
  exists gc sql databases describe "$DB_NAME" --instance "$SQL_INSTANCE" ||
    gc sql databases create "$DB_NAME" --instance "$SQL_INSTANCE"

  echo "==> Database user and secrets"
  if ! exists gc secrets describe "$SECRET_DB_URL"; then
    local db_password
    db_password="$(random_secret 24)"
    if exists gc sql users describe "$DB_USER" --instance "$SQL_INSTANCE"; then
      gc sql users set-password "$DB_USER" --instance "$SQL_INSTANCE" --password "$db_password"
    else
      gc sql users create "$DB_USER" --instance "$SQL_INSTANCE" --password "$db_password"
    fi
    printf 'postgresql://%s:%s@localhost/%s?host=/cloudsql/%s' \
      "$DB_USER" "$db_password" "$DB_NAME" "$CONNECTION" |
      gc secrets create "$SECRET_DB_URL" --replication-policy automatic --data-file=-
  fi
  exists gc secrets describe "$SECRET_JWT" ||
    random_secret 48 | tr -d '\n' | gc secrets create "$SECRET_JWT" --replication-policy automatic --data-file=-

  echo "==> Service accounts"
  exists gc iam service-accounts describe "$RUN_SA" ||
    gc iam service-accounts create trackplus-run --display-name "Track+ demo runtime"
  exists gc iam service-accounts describe "$SCHEDULER_SA" ||
    gc iam service-accounts create trackplus-scheduler --display-name "Track+ demo reset scheduler"
  gc projects add-iam-policy-binding "$PROJECT_ID" \
    --member "serviceAccount:$RUN_SA" --role roles/cloudsql.client --condition None >/dev/null
  for secret in "$SECRET_DB_URL" "$SECRET_JWT"; do
    gc secrets add-iam-policy-binding "$secret" \
      --member "serviceAccount:$RUN_SA" --role roles/secretmanager.secretAccessor >/dev/null
  done
  echo "Setup complete. Next: deploy/gcp/deploy.sh release"
}

release() {
  echo "==> Building $IMAGE with Cloud Build"
  gc builds submit --region "$REGION" --tag "$IMAGE" "$(git rev-parse --show-toplevel)"

  local common=(--region "$REGION" --image "$IMAGE" --service-account "$RUN_SA"
    --set-cloudsql-instances "$CONNECTION")

  echo "==> Applying database migrations"
  gc run jobs deploy "$MIGRATE_JOB" "${common[@]}" \
    --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest" \
    --command npx --args prisma,migrate,deploy --max-retries 0 --task-timeout 600
  gc run jobs execute "$MIGRATE_JOB" --region "$REGION" --wait

  echo "==> Demo reset job"
  gc run jobs deploy "$RESET_JOB" "${common[@]}" \
    --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest" \
    --set-env-vars DEMO_MODE=true \
    --command node --args Backend/src/utils/resetDemo.js --max-retries 1 --task-timeout 600
  gc run jobs add-iam-policy-binding "$RESET_JOB" --region "$REGION" \
    --member "serviceAccount:$SCHEDULER_SA" --role roles/run.invoker >/dev/null

  if [[ "${SKIP_INITIAL_RESET:-}" != "true" ]] && ! exists gc scheduler jobs describe "$RESET_JOB" --location "$REGION"; then
    echo "==> First release: loading the demo baseline"
    gc run jobs execute "$RESET_JOB" --region "$REGION" --wait
  fi

  echo "==> Cloud Scheduler: reset on '$RESET_SCHEDULE' ($RESET_TIME_ZONE)"
  local scheduler_args=(--location "$REGION" --schedule "$RESET_SCHEDULE" --time-zone "$RESET_TIME_ZONE"
    --uri "https://run.googleapis.com/v2/projects/${PROJECT_ID}/locations/${REGION}/jobs/${RESET_JOB}:run"
    --http-method POST --oauth-service-account-email "$SCHEDULER_SA")
  if exists gc scheduler jobs describe "$RESET_JOB" --location "$REGION"; then
    gc scheduler jobs update http "$RESET_JOB" "${scheduler_args[@]}"
  else
    gc scheduler jobs create http "$RESET_JOB" "${scheduler_args[@]}"
  fi

  echo "==> Deploying Cloud Run service"
  # One instance keeps the request-time reset fallback single-writer; scales to zero when idle.
  gc run deploy "$SERVICE" "${common[@]}" \
    --set-secrets "DATABASE_URL=${SECRET_DB_URL}:latest,JWT_SECRET=${SECRET_JWT}:latest" \
    --set-env-vars DEMO_MODE=true \
    --allow-unauthenticated --port 8080 --cpu 1 --memory 512Mi \
    --min-instances 0 --max-instances 1 --concurrency 80
  echo "Demo URL: $(gc run services describe "$SERVICE" --region "$REGION" --format 'value(status.url)')"
}

reset() {
  gc run jobs execute "$RESET_JOB" --region "$REGION" --wait
}

teardown() {
  echo "Deleting every Track+ demo resource in $PROJECT_ID ($REGION), including the demo database."
  read -r -p "Type the project id to confirm: " answer
  [[ "$answer" == "$PROJECT_ID" ]] || { echo "Aborted"; exit 1; }
  gc scheduler jobs delete "$RESET_JOB" --location "$REGION" || true
  gc run services delete "$SERVICE" --region "$REGION" || true
  gc run jobs delete "$RESET_JOB" --region "$REGION" || true
  gc run jobs delete "$MIGRATE_JOB" --region "$REGION" || true
  gc sql instances delete "$SQL_INSTANCE" || true
  gc secrets delete "$SECRET_DB_URL" || true
  gc secrets delete "$SECRET_JWT" || true
  gc artifacts repositories delete "$REPO" --location "$REGION" || true
  gc iam service-accounts delete "$RUN_SA" || true
  gc iam service-accounts delete "$SCHEDULER_SA" || true
}

case "${1:-}" in
  setup) setup ;;
  release) release ;;
  reset) reset ;;
  teardown) teardown ;;
  *) sed -n '2,9p' "$0"; exit 1 ;;
esac

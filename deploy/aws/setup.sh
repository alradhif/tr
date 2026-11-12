#!/usr/bin/env bash
# Installs the Track+ demo on one Ubuntu 24.04 EC2 server: Node, PostgreSQL, nginx with HTTPS,
# the app as a systemd service, and a nightly demo reset. Safe to run again; it keeps existing
# secrets and data. Run as the default "ubuntu" user:
#   curl -fsSL https://raw.githubusercontent.com/alradhif/tr/claude/jodayn-user-design/deploy/aws/setup.sh | bash
set -euo pipefail

REPO="${REPO:-https://github.com/alradhif/tr.git}"
BRANCH="${BRANCH:-claude/jodayn-user-design}"
APP_DIR=/opt/trackplus
DATA_DIR=/var/lib/trackplus
ENV_FILE="$APP_DIR/Backend/.env"

log() { printf '\n==> %s\n' "$*"; }
secret() { openssl rand -hex "${1:-24}"; }

log "System packages"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl git nginx postgresql certbot python3-certbot-nginx
if ! command -v node >/dev/null || [ "$(node -p 'process.versions.node.split(".")[0]')" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Building the frontend needs more than the 2 GB of a t3.small.
if ! swapon --show | grep -q /swapfile; then
  log "Swap file"
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

log "Application code ($BRANCH)"
sudo mkdir -p "$APP_DIR" "$DATA_DIR/uploads"
sudo chown -R "$USER":"$USER" "$APP_DIR" "$DATA_DIR"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" fetch origin "$BRANCH" && git -C "$APP_DIR" checkout -B "$BRANCH" "origin/$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi

PUBLIC_IP="$(curl -fsS -H "X-aws-ec2-metadata-token: $(curl -fsS -X PUT http://169.254.169.254/latest/api/token -H 'X-aws-ec2-metadata-token-ttl-seconds: 60')" http://169.254.169.254/latest/meta-data/public-ipv4)"
DOMAIN="${DOMAIN:-${PUBLIC_IP//./-}.sslip.io}"

log "Database and secrets"
if [ ! -f "$ENV_FILE" ]; then
  DB_PASSWORD="$(secret 18)"
  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'trackplus') THEN
    CREATE ROLE trackplus LOGIN PASSWORD '$DB_PASSWORD';
  ELSE
    ALTER ROLE trackplus PASSWORD '$DB_PASSWORD';
  END IF;
END \$\$;
SQL
  sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='trackplus_demo'" | grep -q 1 \
    || sudo -u postgres createdb -O trackplus trackplus_demo
  ADMIN_PASSWORD="$(secret 9)"
  umask 077
  cat > "$ENV_FILE" <<ENV
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://trackplus:$DB_PASSWORD@127.0.0.1:5432/trackplus_demo
JWT_SECRET=$(secret 32)
DEMO_MODE=true
FRONTEND_URL=https://$DOMAIN
TRUST_PROXY_HOPS=1
UPLOAD_DIR=$DATA_DIR/uploads
SEED_SUPER_ADMIN_PASSWORD=$ADMIN_PASSWORD
# Invitation emails: fill these with a Gmail address and its app password, then restart.
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
ENV
  umask 022
fi

log "Install, build and migrate"
cd "$APP_DIR"
npm ci --no-audit --no-fund
npm ci --prefix frontend --no-audit --no-fund
npm run build --prefix frontend
npx prisma migrate deploy
npx prisma generate

log "Demo data"
npm run -s demo:reset

log "Service"
sudo tee /etc/systemd/system/trackplus.service >/dev/null <<UNIT
[Unit]
Description=Track+ demo
After=network.target postgresql.service

[Service]
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node Backend/src/index.js
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
UNIT

# The app also resets itself after 24 hours on the next request; this timer makes it happen
# every night at 03:00 Riyadh time even when nobody uses it.
sudo tee /etc/systemd/system/trackplus-reset.service >/dev/null <<UNIT
[Unit]
Description=Reset the Track+ demo data

[Service]
Type=oneshot
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/npm run -s demo:reset
UNIT
sudo tee /etc/systemd/system/trackplus-reset.timer >/dev/null <<UNIT
[Unit]
Description=Nightly Track+ demo reset

[Timer]
OnCalendar=*-*-* 00:00:00 UTC
Persistent=true

[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now trackplus.service trackplus-reset.timer
sudo systemctl restart trackplus.service

log "nginx and HTTPS for $DOMAIN"
sudo tee /etc/nginx/sites-available/trackplus >/dev/null <<NGINX
server {
    listen 80;
    server_name $DOMAIN;
    client_max_body_size 12m;
    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/trackplus /etc/nginx/sites-enabled/trackplus
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect || \
  echo "HTTPS certificate not issued yet; the site still works on http://$DOMAIN"

for i in $(seq 1 30); do curl -fsS http://127.0.0.1:5001/healthz >/dev/null && break; sleep 2; done
log "Done: https://$DOMAIN"
echo "Super Admin password is in $ENV_FILE (SEED_SUPER_ADMIN_PASSWORD)."

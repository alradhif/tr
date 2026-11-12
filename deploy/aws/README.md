# Deploying the Track+ demo on AWS (one EC2 server)

One small Ubuntu server runs everything: the Express API, the built React app, PostgreSQL with
the isolated `trackplus_demo` database, nginx with a free HTTPS certificate, and a nightly demo
reset. Secrets are generated on the server into `/opt/trackplus/Backend/.env` (readable only by
the app user) and are never stored in the repository.

```
Browser ──HTTPS──> nginx (:443, Let's Encrypt) ──> Node/Express (:5001, /api + SPA)
                                                     │
                                                     └──> PostgreSQL (localhost) ─ trackplus_demo
systemd timer (daily 00:00 UTC / 03:00 Riyadh) ──> npm run demo:reset
```

## Cost (free plan credits)

| Resource | Setting | Approx. monthly |
| --- | --- | --- |
| EC2 | t3.small, Ubuntu 24.04 | about $15 |
| EBS disk | 20 GiB gp3 | about $1.60 |
| Public IPv4 | one address | about $3.65 |

About $20 a month. Stopping the instance when nobody tests drops it to about $2, but the
public address (and so the link) changes on the next start unless an Elastic IP is attached.

## 1. Launch the server

EC2 → Launch instance: name `trackplus-demo`, Ubuntu Server 24.04 LTS, `t3.small`, a new key pair,
allow SSH, HTTP and HTTPS, storage 20 GiB.

## 2. Install

Open the instance → **Connect** → **EC2 Instance Connect** → Connect, then run:

```bash
curl -fsSL https://raw.githubusercontent.com/alradhif/tr/claude/jodayn-user-design/deploy/aws/setup.sh | bash
```

It prints the site address at the end, for example `https://3-120-45-67.sslip.io`
(sslip.io turns the server's IP into a name so it can have an HTTPS certificate).

The Super Admin password is generated during install:

```bash
grep SEED_SUPER_ADMIN_PASSWORD /opt/trackplus/Backend/.env
```

## 3. Invitation emails (optional)

Create a Gmail app password, then on the server:

```bash
nano /opt/trackplus/Backend/.env   # set SMTP_USER, SMTP_PASS and MAIL_FROM
sudo systemctl restart trackplus
```

Without these the demo shows invitation links and sign-in codes on screen instead.

## Update to the latest code

Run the same install command again. It keeps the database, secrets and uploads.

## Operations

| Task | Command |
| --- | --- |
| App logs | `journalctl -u trackplus -f` |
| Restart | `sudo systemctl restart trackplus` |
| Reset demo now | `cd /opt/trackplus && npm run demo:reset` |
| Next scheduled reset | `systemctl list-timers trackplus-reset.timer` |

The reset only ever runs against a database named `trackplus_demo` with `DEMO_MODE=true`;
both are checked in code before any data is touched.

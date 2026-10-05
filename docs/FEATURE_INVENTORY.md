# TrackPlus feature inventory

Every portal, screen and action in the demo, who may use it, what backs it, and its state after the
feature pass. "Verified" means it was exercised against the running API and PostgreSQL (and, where
noted, in the browser); the evidence is in [VERIFICATION.md](VERIFICATION.md).

Roles: **OU** Org upper management · **OD** Org data entry · **CU** Client upper management ·
**CD** Client data entry · **JU** Jodayn upper management · **JD** Jodayn data entry · **SA** Super Admin.

Status: ✅ implemented and verified · ⚠️ implemented, limited by missing configuration · ⛔ blocked.

## Access and accounts

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Landing page, "request a demo" form | public | `POST /api/public/demo-requests` → `demo_requests` table, notifies SA | ✅ | Was a fake 350 ms success. Validates fields, rate limited per IP (20/hour, `DEMO_REQUEST_LIMIT_PER_HOUR`). Super Admin lists them at `GET /api/super-admin/demo-requests`. The 24 h reset empties this table too. |
| Landing CTAs ("استكشف القدرات", request demo, sign in) | public | — | ✅ | Explore scrolls to capabilities; request demo opens the form. |
| Six quick-login buttons | OU OD CU CD JU JD | `POST /api/auth/demo/login {role}` | ✅ | Only when `DEMO_MODE=true` and DB is `trackplus_demo`. Restricted to the six seeded users; it no longer accepts an arbitrary user id or `SUPER_ADMIN`. |
| Password + one-time code login | all | `/api/auth/login`, `/login/verify`, `/login/resend` | ✅ | Code shown on screen in demo mode (no mail service). |
| Super Admin sign-in | SA | password + code only | ✅ | Not reachable through quick login. |
| Refresh, logout, switching accounts | all | JWT in session storage, 401 → login | ✅ | |
| Account suspension | SA | `PATCH /api/super-admin/accounts/:type/:id {isActive}` | ✅ | Blocks login (403) and live sessions (401 `SUSPENDED`). |
| Invitations with initial credentials | OU CU JU SA | `POST /{portal}/users`, `/users/:id/credentials` | ✅ | Temporary password shown once, stored as bcrypt hash. New users are **غير نشط** until first login, then **نشط**. |
| Activate / deactivate users | OU CU JU SA | `/users/:id/toggle`, `PATCH /super-admin/users/:portal/:id` | ✅ | Cannot deactivate yourself. |
| Profile name, change password | all | `GET/PATCH /api/me`, `POST /api/me/password` | ✅ | |

## Dashboards, search, notifications

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Portal dashboards and charts | all | `/{org,client,jodayn}/dashboard`, `/super-admin/dashboard` | ✅ | Live data; widget "عرض الكل" and row links navigate. |
| Dashboard customization | all | `GET/PUT/DELETE /api/me/dashboard-layout/:portal` | ✅ | Saved per user and portal; restored after reload. |
| Global search | all | `GET /api/search?q=` | ✅ | Scoped to the signed-in account. |
| Notifications | all | `GET /api/notifications`, `PATCH /:id/read`, `/read-all` | ✅ | Badge, panel, links; polled every 60 s. |

## Projects (org and client portals)

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Create draft, edit, details | OU OD CU CD | `POST/PUT/GET /{portal}/projects` | ✅ | |
| Submit for approval | OD CD | `POST /:id/submit` | ✅ | Notifies every upper manager. Data entry is locked while pending. |
| Approve | OU CU | `PATCH /:id/approve` | ✅ | Notifies the submitter. |
| Reject with reason | OU CU | `PATCH /:id/reject` | ✅ | Status `REJECTED`; data entry can still revise and resubmit (existing contract). |
| Return for changes | OU CU | `PATCH /:id/return` (new) | ✅ | Back to `DRAFT` with the requested changes shown as a banner; notification type REVIEW. |
| Project status (active, on hold, completed, cancelled) | OU CU | `PUT /:id {status}` | ✅ | Data entry cannot change it. |
| Phases and activities | all four | `/:id/phases` | ✅ | |
| Deliverables, completion, progress | all four (delete: upper) | `/:id/deliverables` | ✅ | Project progress is recomputed from deliverables. |
| Risks, close risk | all four (delete: upper) | `/:id/risks` | ✅ | |
| Change requests: approve, send for review, reject | create: all four; decide: upper | `/:id/change-requests/:id/{approve,review,reject}` | ✅ | A decided request cannot be decided again. |
| What-if scenarios | all four | `/:id/scenarios` | ✅ | AI fill from a document needs the AI key (see below). |
| Contracts | all four | `/:id/contracts` | ✅ | |
| Team members | all four (delete: upper) | `/:id/team` (org), `/:id/team-members` (client) | ✅ | |
| Budget, spent, remaining | read: all | `project.financials` | ✅ | Spent comes from completed deliverable prices. |
| Attachments upload / download / delete | per README rules | `/:id/attachments` | ✅ | Local disk or Cloud Storage. |
| Presentation (.pptx) | OU CU | client-side pptxgenjs, data from the project | ✅ | Was sample data; now uses the project's name, code, phases, deliverables, risks, change requests, scenarios and budget, plus the dialog's title, mode and notes. "Automatic" mode pre-selects every section with data; it does not use AI. |

## Organization structure (org portal)

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Departments: create, edit, employees | OU OD (delete: OU) | `/org/departments` | ✅ | |
| Department projects: export CSV, status filter | OU OD | client-side CSV | ✅ | Previously inert buttons. |
| Executing companies: create, edit, team | OU OD (delete: OU) | `/org/companies` | ✅ | |
| Company projects/team: export CSV, filter | OU OD | client-side CSV | ✅ | Previously inert buttons. |

## Strategy

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Strategy documents, goals, stages | org and client, delete: upper | `/{portal}/strategy/...` | ✅ | |
| Goal ↔ project links | org and client | `/goals/:id/links` | ✅ | |
| KPI snapshots | org and client | `/goals/:id/kpi-snapshots` (org), `/kpis` (client) | ✅ | |
| AI fill of goal form from a document | CU CD | `POST /api/ai/extract` | ⚠️ | Needs `ANTHROPIC_API_KEY`. |

## Jodayn portal

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Org and client accounts | JU JD | `/super-admin/accounts` | ✅ | Shows sector names. |
| Sectors | JU JD SA | `/super-admin/sectors` | ✅ | |
| Invoices: create, mark paid/overdue, CSV export | JU JD (delete: JU) | `/jodayn/invoices` | ✅ | Paid sets remaining to 0; invalid statuses rejected. |
| Forecasts, financial reports | JU JD (delete: JU) | `/jodayn/forecasts`, `/jodayn/reports` | ✅ | |
| Users | JU | `/jodayn/users` | ✅ | |

## Super Admin

| Feature | Backend | Status | Notes |
| --- | --- | --- | --- |
| Dashboard | `GET /super-admin/dashboard` | ✅ | |
| Tenants: create (org, client, Jodayn), details, usage, edit, suspend, delete with typed name, notify, CSV export | `/super-admin/tenants`, `/accounts/:type/:id[...]` | ✅ | Manager gets one-time credentials. |
| Platform users: create, change role, suspend, reset credentials, search | `/super-admin/users` | ✅ | |
| Packages: create, edit, delete (blocked while in use) | `/super-admin/packages` | ✅ | |
| Audit log with summary and filters | `/audit-logs`, `/super-admin/audit/summary` | ✅ | Mock fallback rows removed. |
| Demo requests | `/super-admin/demo-requests` | ✅ | API and notification; there is no dedicated list screen yet (requests arrive as notifications). |
| Settings | shared settings page | ✅ | |

## AI

| Feature | Roles | Backend | Status | Notes |
| --- | --- | --- | --- | --- |
| Assistant chat with optional PDF/text attachment | all signed-in | `POST /api/ai/assistant` | ⚠️ | Without `ANTHROPIC_API_KEY` it says so and returns a factual summary of the user's own data. With the key it answers from that data only (not tested here: no key). |
| Document extraction into forms (project contract, goal, scenario) | form users | `POST /api/ai/extract` | ⚠️ | Returns 503 "not configured" without the key; the contract file is still attached. PDF and text only; Word is not supported. |

## Demo data and reset

| Feature | Backend | Status | Notes |
| --- | --- | --- | --- |
| Isolated `trackplus_demo` database | `demoSafety` | ✅ | Reset and checks refuse any other DB name. |
| 24 h baseline reset | `npm run demo:reset`, Cloud Scheduler job, request-time fallback | ✅ locally | Cloud Scheduler job is defined in `deploy/gcp/deploy.sh` (PR #1); not run from this session. |

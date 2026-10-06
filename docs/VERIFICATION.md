# TrackPlus verification

Run on 2026-10-05 against a local API (`DEMO_MODE=true`, database `trackplus_demo`, PostgreSQL 16)
serving the production frontend build, after `npm run demo:reset`. No `ANTHROPIC_API_KEY` was set,
so AI features were verified on their "not configured" path only.

| Suite | Result |
| --- | --- |
| `npm run demo:check` (auth, approvals, invitations, activation) | 61 / 61 pass |
| `npm run check:attachments` | 32 / 32 pass |
| `npm run check:features` (new: workflows, permissions, super admin, catalog, strategy, finance, AI, demo requests) | 145 / 145 pass |
| `tests/browser/e2e.js` (Playwright, real UI across roles) | 34 / 34 pass |
| `tests/browser/crawl.js` (every portal page for all 7 roles) | 64 pages, no API 4xx/5xx, no page errors |
| Frontend `tsc -b`, `npm run build`, `npm run lint` | pass (lint: 0 errors; 9 unused-variable warnings, all in the classic scripts under `public/companies-app`, which share globals across files) |

The only console noise in the browser runs is `ERR_CERT_AUTHORITY_INVALID` for Google Fonts, caused by
this sandbox's network proxy, not by the app.

## Feature table

| Feature | Role | Test performed | Expected result | Actual result | Result |
| --- | --- | --- | --- | --- | --- |
| Quick login ×6 | OU OD CU CD JU JD | Click each demo button (browser) and `POST /auth/demo/login` | Session for the seeded user, scoped portal | Lands on own dashboard with correct role | Pass |
| Quick login is limited | public | `POST /auth/demo/login` with `SUPER_ADMIN` or a raw user id | Refused | 400/404, no token | Pass |
| Super Admin login | SA | Password + on-screen code (browser) | Super Admin portal | `/super-admin` | Pass |
| Refresh | OD | Reload a project page | Still signed in on the same page | Same page and data | Pass |
| Logout | OD, OU | Profile menu → تسجيل الخروج | Session cleared, portal closed | Token removed; `/org/dashboard` redirects to `/login` | Pass |
| Switching accounts | OD → OU → OD | Log out and log in as another role | New role's session and data | Role in session matches | Pass |
| Submit for approval | OD | Button on project page | PENDING, managers notified | PENDING; badge + panel list the project | Pass |
| Return for changes | OU | إعادة للتعديل with notes | DRAFT with notes, submitter notified | DRAFT; notes banner; REVIEW notification | Pass |
| Resubmit and approve | OD, OU | Resubmit, then اعتماد | APPROVED, notes cleared, submitter notified | As expected; persists after reload | Pass |
| Reject with reason | CU | رفض with reason | REJECTED, submitter notified with reason | As expected | Pass |
| Data entry cannot decide | OD CD | Approve/return/decide change requests | 403 | 403 | Pass |
| Edit while pending | OD | `PUT` project while PENDING | 403 | 403 | Pass |
| Project status | OU, OD | Status select (browser); `PUT {status}` as data entry | Manager can change; data entry cannot; invalid value 400 | As expected | Pass |
| Partial edits keep children | OU | Change status / description | Phases and deliverables kept | Kept (this was a data-loss bug, now fixed) | Pass |
| Deliverables and progress | OU OD | Create 2, complete 1 | Progress 50%, invalid status 400, data entry delete 403 | As expected | Pass |
| Risks | OD OU | Create, close | CLOSED | CLOSED | Pass |
| Change requests | OD OU | Submit, send for review, approve, decide again | APPROVED; second decision refused | As expected | Pass |
| What-if, contracts, phases | OU | Create through API | Stored | Stored | Pass |
| Departments, companies | OD OU, CU | Create, edit, reload, delete as data entry, read cross-tenant | Persisted; delete 403; cross-tenant 403 | As expected | Pass |
| Department export and filter | OU | Click تصدير / تصفية (browser) | CSV download; filter cycles statuses | CSV with Arabic rows; filter label changes | Pass |
| Strategy | OD OU | Document → goal → stage → project link → KPI | All stored; data entry cannot delete goal; client cannot see org goal | As expected | Pass |
| Dashboards | all six | Load each dashboard API and page | 200 with data | 200; pages render | Pass |
| Dashboard layout | OD | Save, reload, other user, bad portal | Per-user persistence; bad portal 400 | As expected | Pass |
| Search | OU, CU | Search the org project name | Org finds it; client does not | As expected | Pass |
| Notifications | tenant user | Receive, read all | Unread count then 0 | As expected | Pass |
| Profile and password | OD | Rename, wrong current password, short password | Rename persists; both bad passwords 400 | As expected | Pass |
| Invitations and activation | OU CU JU SA | Invite, initial password shown once, first login | غير نشط → نشط; hash only; reissue invalidates old | As expected (API + browser) | Pass |
| Tenant lifecycle | SA | Create, duplicate email, notify, export, suspend, reactivate, delete | Each works; suspended session 401 / login 403; delete needs typed name | As expected | Pass |
| Packages | SA | Create, edit, delete in use, delete unused | 409 while in use, then 200 | As expected | Pass |
| Platform users, audit | SA | Create user; audit summary; audit page | Stored; real entries | As expected | Pass |
| Super Admin APIs denied to tenants | OU | Call dashboard / demo requests | 403 | 403 | Pass |
| Invoices | JD JU | Create, invalid status, mark paid, delete as JD / JU | 400 / remaining 0 / 403 / 200 | As expected; UI hides delete for JD | Pass |
| Forecasts, reports, sectors | JD JU, OU | Create; delete as JD; sector as org | Stored; 403; 403 | As expected | Pass |
| Attachments | all four | Upload, download, permissions, size/type limits | Per README rules | 32 / 32 | Pass |
| Presentation | OU | Dialog title + notes → generator | Real project data, title and notes | Title, notes, code, deliverables shown | Pass |
| Landing demo request | public, SA | Fill form (browser); invalid data via API | Stored, SA notified; invalid 400 | As expected | Pass |
| AI assistant | OU | Ask a question (browser) | Honest "not configured" + real counts | As expected | Pass |
| AI extraction | OU | Upload a text file | 503 not configured | 503 | Pass |
| AI with a real key | any | — | Answers from account data | Not run: no `ANTHROPIC_API_KEY` in this environment | Blocked |
| Google Cloud deployment | — | — | Running Cloud Run demo with daily reset | Not run from this session: no GCP credentials. Scripts are in `deploy/gcp` (PR #1). | Blocked |
| Email delivery of codes and invitations | — | — | Mail sent | No mail service is connected; codes and initial passwords are shown on screen in demo mode | Blocked |

Roles: OU/OD org upper/data entry, CU/CD client upper/data entry, JU/JD Jodayn upper/data entry, SA Super Admin.

## Not covered

- Mobile layouts were not tested; all browser runs used a 1440×900 viewport.
- The project creation wizard was exercised by page load and API, not by filling every step in the browser.
- AI answers and document extraction with a real key (see Blocked above).

## Every automated assertion

### npm run demo:check

61 of 61 passed.

| # | Assertion | Result |
| --- | --- | --- |
| 1 | invalid login | Pass |
| 2 | demo login ORG_UPPER_MGMT | Pass |
| 3 | demo login ORG_DATA_ENTRY | Pass |
| 4 | demo login CLIENT_UPPER_MGMT | Pass |
| 5 | demo login CLIENT_DATA_ENTRY | Pass |
| 6 | demo login JODAYN_UPPER_MGMT | Pass |
| 7 | demo login JODAYN_DATA_ENTRY | Pass |
| 8 | password step issues no session, only a code challenge | Pass |
| 9 | wrong login code rejected | Pass |
| 10 | normal login org data entry | Pass |
| 11 | login code cannot be reused | Pass |
| 12 | per-portal login also requires the code step | Pass |
| 13 | session for a user removed by the daily reset returns 401 | Pass |
| 14 | data entry creates DRAFT (got 200 DRAFT) | Pass |
| 15 | created project survives refetch | Pass |
| 16 | data entry submit DRAFT→PENDING (got 200 PENDING) | Pass |
| 17 | upper management cannot submit | Pass |
| 18 | data entry cannot approve | Pass |
| 19 | upper management pending list includes submitted project | Pass |
| 20 | upper management approve PENDING→APPROVED (got 200 APPROVED) | Pass |
| 21 | data entry reread shows APPROVED with approver | Pass |
| 22 | second project submitted PENDING | Pass |
| 23 | upper management reject PENDING→REJECTED with reason | Pass |
| 24 | data entry resubmits REJECTED→PENDING | Pass |
| 25 | client upper lists projects | Pass |
| 26 | client data entry lists projects | Pass |
| 27 | client data entry creates DRAFT (got 200 DRAFT) | Pass |
| 28 | cross-tenant org access rejected | Pass |
| 29 | upper management invites user and receives initial credentials once | Pass |
| 30 | invited user stored as pending (غير نشط) with org link | Pass |
| 31 | initial password stored only as a bcrypt hash | Pass |
| 32 | users list shows pending status and never the password | Pass |
| 33 | duplicate email rejected | Pass |
| 34 | data entry cannot invite | Pass |
| 35 | demo login cannot target an arbitrary or pending user | Pass |
| 36 | pending invitee not listed as a demo account | Pass |
| 37 | upper management can issue new initial credentials before first login | Pass |
| 38 | reissuing invalidates the previous initial password | Pass |
| 39 | data entry cannot reissue credentials | Pass |
| 40 | other tenant cannot reissue credentials | Pass |
| 41 | invited user signs in with initial credentials and code | Pass |
| 42 | first successful login activates the account (نشط) | Pass |
| 43 | first login recorded in the activity log | Pass |
| 44 | cannot reissue initial credentials for an active account | Pass |
| 45 | activated user session loads org data | Pass |
| 46 | cannot deactivate own account | Pass |
| 47 | upper management can deactivate invited user | Pass |
| 48 | inactive user cannot log in | Pass |
| 49 | deactivated user session is rejected with 401 | Pass |
| 50 | upper management can reactivate invited user | Pass |
| 51 | reactivated user can log in | Pass |
| 52 | client upper management invites user | Pass |
| 53 | pending invitee cannot sign in with a wrong password | Pass |
| 54 | jodayn upper management invites user | Pass |
| 55 | invited user appears in users list | Pass |
| 56 | approval writes a notification row | Pass |
| 57 | jodayn upper creates a financial report | Pass |
| 58 | jodayn data entry can read the new report | Pass |
| 59 | jodayn upper can list invoices | Pass |
| 60 | jodayn data entry can list invoices | Pass |
| 61 | jodayn data entry cannot invite | Pass |

### npm run check:attachments

32 of 32 passed.

| # | Assertion | Result |
| --- | --- | --- |
| 1 | org: data entry creates a draft project | Pass |
| 2 | org: data entry uploads two files | Pass |
| 3 | org: Arabic file name kept | Pass |
| 4 | org: rows saved in PostgreSQL | Pass |
| 5 | org: manager lists attachments | Pass |
| 6 | org: project detail returns attachments | Pass |
| 7 | org: signed link returns the same bytes | Pass |
| 8 | org: unsigned download without session refused | Pass |
| 9 | org: signature only opens its own file | Pass |
| 10 | org: other portal denied | Pass |
| 11 | org: disallowed file type rejected | Pass |
| 12 | org: file over 10 MB rejected | Pass |
| 13 | org: data entry locked out while pending | Pass |
| 14 | org: manager uploads during review | Pass |
| 15 | org: manager deletes an attachment | Pass |
| 16 | org: deleted attachment no longer downloads | Pass |
| 17 | client: data entry creates a draft project | Pass |
| 18 | client: data entry uploads two files | Pass |
| 19 | client: Arabic file name kept | Pass |
| 20 | client: rows saved in PostgreSQL | Pass |
| 21 | client: manager lists attachments | Pass |
| 22 | client: project detail returns attachments | Pass |
| 23 | client: signed link returns the same bytes | Pass |
| 24 | client: unsigned download without session refused | Pass |
| 25 | client: signature only opens its own file | Pass |
| 26 | client: other portal denied | Pass |
| 27 | client: disallowed file type rejected | Pass |
| 28 | client: file over 10 MB rejected | Pass |
| 29 | client: data entry locked out while pending | Pass |
| 30 | client: manager uploads during review | Pass |
| 31 | client: manager deletes an attachment | Pass |
| 32 | client: deleted attachment no longer downloads | Pass |

### npm run check:features

145 of 145 passed.

| # | Assertion | Result |
| --- | --- | --- |
| 1 | super admin has no quick-login button session | Pass |
| 2 | super admin signs in with password + code | Pass |
| 3 | super admin dashboard loads | Pass |
| 4 | org manager is denied super admin APIs | Pass |
| 5 | super admin creates a package | Pass |
| 6 | super admin edits the package | Pass |
| 7 | super admin creates an org tenant with a one-time password | Pass |
| 8 | duplicate manager email rejected | Pass |
| 9 | package in use cannot be deleted | Pass |
| 10 | new manager starts pending (غير نشط) | Pass |
| 11 | new manager signs in with the temporary password | Pass |
| 12 | manager becomes active (نشط) after first login | Pass |
| 13 | new tenant sees no other tenant projects | Pass |
| 14 | super admin notifies a tenant | Pass |
| 15 | tenant user receives the notification | Pass |
| 16 | mark all notifications read persists | Pass |
| 17 | tenant export downloads CSV | Pass |
| 18 | super admin suspends the tenant | Pass |
| 19 | suspended tenant session is rejected | Pass |
| 20 | suspended tenant cannot sign in | Pass |
| 21 | reactivated tenant regains access | Pass |
| 22 | tenant delete requires typing the name | Pass |
| 23 | super admin deletes the tenant | Pass |
| 24 | deleted tenant session no longer works | Pass |
| 25 | unused package can be deleted | Pass |
| 26 | super admin creates a platform user | Pass |
| 27 | audit summary loads | Pass |
| 28 | org: data entry creates a draft project | Pass |
| 29 | org: new project starts as DRAFT | Pass |
| 30 | org: submit moves project to PENDING | Pass |
| 31 | org: upper management receives an approval notification | Pass |
| 32 | org: data entry cannot edit while pending | Pass |
| 33 | org: data entry cannot return a project | Pass |
| 34 | org: return requires the requested changes | Pass |
| 35 | org: manager returns project for changes (PENDING→DRAFT with notes) | Pass |
| 36 | org: data entry is notified the project was returned | Pass |
| 37 | org: data entry edits the returned draft | Pass |
| 38 | org: resubmission clears the notes and returns to PENDING | Pass |
| 39 | org: manager approves | Pass |
| 40 | org: data entry is notified of approval | Pass |
| 41 | org: approval persists on reload | Pass |
| 42 | org: data entry cannot change project status | Pass |
| 43 | org: upper management changes status | Pass |
| 44 | org: invalid status rejected | Pass |
| 45 | org: deliverables created | Pass |
| 46 | org: deliverable marked complete | Pass |
| 47 | org: project progress recomputed from deliverables (50%) | Pass |
| 48 | org: invalid deliverable status rejected | Pass |
| 49 | org: data entry cannot delete deliverables | Pass |
| 50 | org: data entry records a risk | Pass |
| 51 | org: risk closed | Pass |
| 52 | org: data entry submits a change request | Pass |
| 53 | org: data entry cannot decide change requests | Pass |
| 54 | org: manager sends change request for review | Pass |
| 55 | org: manager approves change request | Pass |
| 56 | org: decided change request cannot be decided again | Pass |
| 57 | org: phase created | Pass |
| 58 | org: status/description updates keep phases and deliverables | Pass |
| 59 | org: manager rejects with a reason | Pass |
| 60 | org: data entry is notified of rejection | Pass |
| 61 | client: data entry creates a draft project | Pass |
| 62 | client: new project starts as DRAFT | Pass |
| 63 | client: submit moves project to PENDING | Pass |
| 64 | client: upper management receives an approval notification | Pass |
| 65 | client: data entry cannot edit while pending | Pass |
| 66 | client: data entry cannot return a project | Pass |
| 67 | client: return requires the requested changes | Pass |
| 68 | client: manager returns project for changes (PENDING→DRAFT with notes) | Pass |
| 69 | client: data entry is notified the project was returned | Pass |
| 70 | client: data entry edits the returned draft | Pass |
| 71 | client: resubmission clears the notes and returns to PENDING | Pass |
| 72 | client: manager approves | Pass |
| 73 | client: data entry is notified of approval | Pass |
| 74 | client: approval persists on reload | Pass |
| 75 | client: data entry cannot change project status | Pass |
| 76 | client: upper management changes status | Pass |
| 77 | client: invalid status rejected | Pass |
| 78 | client: deliverables created | Pass |
| 79 | client: deliverable marked complete | Pass |
| 80 | client: project progress recomputed from deliverables (50%) | Pass |
| 81 | client: invalid deliverable status rejected | Pass |
| 82 | client: data entry cannot delete deliverables | Pass |
| 83 | client: data entry records a risk | Pass |
| 84 | client: risk closed | Pass |
| 85 | client: data entry submits a change request | Pass |
| 86 | client: data entry cannot decide change requests | Pass |
| 87 | client: manager sends change request for review | Pass |
| 88 | client: manager approves change request | Pass |
| 89 | client: decided change request cannot be decided again | Pass |
| 90 | client: phase created | Pass |
| 91 | client: status/description updates keep phases and deliverables | Pass |
| 92 | client: manager rejects with a reason | Pass |
| 93 | client: data entry is notified of rejection | Pass |
| 94 | org data entry creates a department | Pass |
| 95 | department edit saves | Pass |
| 96 | department edit persists | Pass |
| 97 | data entry cannot delete a department | Pass |
| 98 | client cannot read org departments | Pass |
| 99 | org data entry creates an executing company | Pass |
| 100 | company team member added | Pass |
| 101 | project linked to department and company | Pass |
| 102 | linking a project keeps its deliverables | Pass |
| 103 | strategy document created | Pass |
| 104 | strategic goal created | Pass |
| 105 | goal stage created | Pass |
| 106 | goal linked to a project | Pass |
| 107 | KPI snapshot recorded | Pass |
| 108 | goal detail loads with its links and KPIs | Pass |
| 109 | data entry cannot delete a goal | Pass |
| 110 | client goal list excludes org goals | Pass |
| 111 | what-if scenario created | Pass |
| 112 | project contract created | Pass |
| 113 | ORG_UPPER_MGMT dashboard data loads | Pass |
| 114 | ORG_DATA_ENTRY dashboard data loads | Pass |
| 115 | CLIENT_UPPER_MGMT dashboard data loads | Pass |
| 116 | CLIENT_DATA_ENTRY dashboard data loads | Pass |
| 117 | JODAYN_UPPER_MGMT dashboard data loads | Pass |
| 118 | JODAYN_DATA_ENTRY dashboard data loads | Pass |
| 119 | org user cannot open the jodayn dashboard | Pass |
| 120 | jodayn data entry creates a forecast | Pass |
| 121 | jodayn data entry cannot delete a forecast | Pass |
| 122 | jodayn staff create a sector | Pass |
| 123 | org user cannot create sectors | Pass |
| 124 | client cannot read an org project | Pass |
| 125 | org search finds its own project | Pass |
| 126 | client search does not see org projects | Pass |
| 127 | profile name saves and reloads | Pass |
| 128 | password change requires the current password | Pass |
| 129 | short new password rejected | Pass |
| 130 | dashboard layout saves and reloads | Pass |
| 131 | dashboard layout is per user | Pass |
| 132 | unknown dashboard portal rejected | Pass |
| 133 | jodayn data entry creates an invoice | Pass |
| 134 | invalid invoice status rejected | Pass |
| 135 | marking an invoice paid clears the remaining amount | Pass |
| 136 | jodayn data entry cannot delete invoices | Pass |
| 137 | jodayn upper management deletes the invoice | Pass |
| 138 | demo request validates its fields | Pass |
| 139 | landing page demo request is stored | Pass |
| 140 | super admin sees the demo request | Pass |
| 141 | super admin is notified of the demo request | Pass |
| 142 | tenants cannot read demo requests | Pass |
| 143 | assistant reports missing AI key and returns a real data summary | Pass |
| 144 | document extraction reports missing AI key (503) | Pass |
| 145 | assistant requires a session | Pass |

### tests/browser/e2e.js (Playwright)

34 of 34 passed.

| # | Assertion | Result |
| --- | --- | --- |
| 1 | org data entry quick login lands on dashboard | Pass |
| 2 | data entry draft created | Pass |
| 3 | data entry adds a deliverable | Pass |
| 4 | UI submit moves project to PENDING | Pass |
| 5 | refresh keeps the session and page | Pass |
| 6 | logout clears the session | Pass |
| 7 | portal is closed after logout | Pass |
| 8 | switching account loads the manager session | Pass |
| 9 | manager sees an unread notification badge | Pass |
| 10 | notification panel lists the submitted project | Pass |
| 11 | manager returns project for changes in the UI | Pass |
| 12 | data entry sees the requested changes | Pass |
| 13 | manager approves in the UI | Pass |
| 14 | manager changes project status in the UI | Pass |
| 15 | presentation uses the title entered in the dialog | Pass |
| 16 | presentation shows the dialog notes | Pass |
| 17 | presentation lists the project deliverables | Pass |
| 18 | presentation uses the project code, not sample data | Pass |
| 19 | assistant replies from the backend (missing key reported, real counts shown) | Pass |
| 20 | department projects export downloads a CSV | Pass |
| 21 | department filter cycles status | Pass |
| 22 | no API 5xx during the approval flow | Pass |
| 23 | client manager rejects with a reason in the UI | Pass |
| 24 | client data entry is notified of the rejection | Pass |
| 25 | super admin is not available as a quick login | Pass |
| 26 | super admin signs in with password and code | Pass |
| 27 | tenant created with one-time credentials | Pass |
| 28 | new manager shows as غير نشط before first login | Pass |
| 29 | invited manager signs in with the temporary password | Pass |
| 30 | manager shows as نشط after first login | Pass |
| 31 | audit log shows real entries | Pass |
| 32 | jodayn data entry sees no invoice delete action | Pass |
| 33 | jodayn upper management sees invoice actions | Pass |
| 34 | landing demo request submits to the backend | Pass |

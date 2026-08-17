# Changelog

Portfolio-rebuild improvements to HEdClass, worked one ticket at a time.

## Ticket 13 — README and polish
- Wrote a real `README.md`: what the app does, features, stack, setup (MySQL import, `.env`, npm scripts), test users, project structure.
- Added a `screenshots/` folder with a placeholder note (no MySQL/browser available in the environment this ticket was done in — screenshots still need to be captured and added manually).
- Swapped a few leftover `console.log` calls on error paths (`db.js`, `api/server.js`, `postReviewStudent`) to `console.error` for consistency with the rest of the codebase.
- **Why:** makes the repo readable and runnable by a stranger from the README alone.

## Ticket 12 — Audit log
- New `audit_log` table (`user_id`, `action`, `entity`, `entity_id`, `details`, `created_at`), FK'd to `users`.
- Logs classification runs (API, per degree run), approvals/overrides (with `proposed_result -> final_result`), reopens, and student deletes.
- New read-only `/classifications/activity` view showing the logged-in officer's own actions, linked from the dashboard.
- **Why:** gives officers and (eventually) registry a record of who changed what and when, without needing DB access.

## Ticket 11 — CSV export for exam board
- New role-protected `GET /classifications/export`: builds a CSV (student number, name, Yr2/Yr3/final averages, result, status, overridden flag) for the logged-in officer's cohort only and streams it as a download.
- "Export CSV" button on the dashboard.
- **Why:** exam boards need the cohort's results in a format they can open in Excel.

## Ticket 10 — Distribution chart (Chart.js)
- Added Chart.js via CDN (SRI-pinned) to the classifications dashboard.
- Bar chart of the existing `distribution` object, including the "Not eligible" outcome, alongside the existing numeric table.
- **Why:** a chart makes the cohort's spread of outcomes easier to read at a glance than the table alone.

## Ticket 9 — UX: feedback, confirmations, shared layout
- Session-based flash messages (`req.session.flash`, set in controllers, rendered + cleared via `partials/flash.ejs`): login failure, add/edit/delete/approve/override/reopen success, and blocked-delete reasons (surfaced from the API's 409 responses instead of a raw 500 page).
- Successful student/officer/degree adds now redirect to their dashboard instead of back to an empty form.
- `onsubmit="return confirm(...)"` on every delete and reopen form.
- Extracted `partials/head.ejs` and `partials/navbar.ejs`, used by all 12 views (also fixed a few pre-existing head/navbar bugs found along the way — a malformed `<html<!DOCTYPE html>` on two pages, `myUI.css` missing from several pages, a stray comma in the sign-in form tag).
- Server-side validation (required fields, valid email, marks 0–100) with flash-message error feedback. Edit forms keep their values on a validation error (they re-render from the DB); add forms reset empty — repopulating the dynamic per-module mark rows from POST data was judged out of scope for this ticket.
- **Why:** the app previously failed silently in several places (bad login, blocked delete, add-then-blank-form) — this ticket closes that gap.

## Ticket 8 — Fix IDOR and secure the API
- Restored ownership checks (`student.created_by === session.user.id`) on every student view/edit/review/delete/reopen route — previously commented out, so any classifications officer could reach any student by guessing the URL.
- REST API (port 4000) now requires an `x-api-key` header on every request, checked against `process.env.API_KEY`; the web app sends it via a shared `apiClient` (axios instance) instead of raw `axios` calls to hardcoded URLs.
- **Why:** the API had no auth at all, and the ownership checks that should have stopped cross-officer access were dead code.

## Ticket 7 — Reclassification and reopen
- `/classifications/run` now upserts: a `pending_review` classification gets its averages/proposed result refreshed on re-run; `approved`/`overridden` rows are left untouched.
- New `POST /classifications/students/:id/reopen` — resets status to `pending_review`, final result to `Pending`, clears the override flag. "Reopen" button added to the dashboard and the student detail page.
- **Why:** previously a classification could only ever be created once, and an approved student could never be corrected.

## Ticket 6 — Honours eligibility rules and calculation-time resit capping
- Extracted the classification engine into `src/api/services/classify.js` (pure functions, no DB) so eligibility and averaging logic is testable in isolation.
- Added the honours eligibility check: full credits recorded for years 1–3, and every module a pass (using the capped resit value) — an outstanding fail now produces `"Not eligible for Honours"` instead of a misleading grade band.
- Resit cap (40) now applied at calculation time only; the raw mark is stored in `student_marks` and preserved through add/edit (previously capped and overwritten at insert time, destroying the original mark).
- Added the new outcome to the `classifications` enum and the dashboard/review views.
- **Why:** the engine was computing a weighted average with no eligibility check at all, and resit marks were being silently destroyed on entry.

## Ticket 5 — Modular architecture (routes / controllers / models)
- Split the monolithic `app.js` into layers:
  - `middleware/requireRole.js` — the role guard.
  - `routes/` — `auth.js`, `registry.js`, `classifications.js` (path → controller wiring + role middleware; each router applies its role guard once via `router.use`).
  - `controllers/` — `authController.js`, `registryController.js`, `classificationsController.js` (request/response, bcrypt, dashboard stat shaping, axios calls to the API).
  - `models/` — `userModel.js`, `degreeModel.js`, `studentModel.js`, `classificationModel.js` (every SQL query, copied verbatim).
- `app.js` reduced to ~36 lines: setup, session, and three `app.use()` mounts.
- Pure refactor — no behaviour change. SQL strings unchanged; only their location moved.
- **Why:** separates HTTP concerns from data access, makes each layer testable, and removes the single 850-line file.

## Ticket 4 — Auth middleware + remove dead code
- Added a `requireRole(role)` middleware and applied it to all 23 protected routes, replacing the copy-pasted `if (req.session.user && req.session.user.role === …)` block in every handler.
- Deleted the three large commented-out route blocks (old officer-delete, student-delete, and inline `/classifications/run`) — ~160 lines.
- Removed the dead `req.session.user.degree_ids` reference in POST `/select-degree` (the property was never set).
- Kept the small commented-out ownership checks in the student view/edit/review routes as markers for Ticket 8 (Fix IDOR).
- Pure refactor: `app.js` dropped from ~852 to ~470 lines with no behaviour change. Public routes (`/`, login, `/logout`) left unguarded.
- **Why:** removes ~200 lines of duplication/dead code and centralises access control in one testable place.

## Ticket 3 — Remove assignment identifiers
- Renamed the database from `40302656` to `hedclass` (updated `.env` `DB_NAME`).
- Renamed `src/seeder/40302656.sql` → `src/seeder/seed.sql`; updated the `Database:` comment and prepended `CREATE DATABASE IF NOT EXISTS` / `USE` so the dump is self-contained.
- `package.json`: pointed `repository` at GitHub, added a description and author.
- **Why:** removes the QUB student-number identifier and makes the project read as a standalone portfolio app.

## Ticket 2 — Move secrets to environment variables (`aa888f7`)
- Installed `dotenv`; load it in `app.js`, `db.js`, and `api/server.js`.
- DB credentials now read from `process.env` in `db.js` and `server.js` (was hardcoded `root`/`root`/`40302656` in both).
- Session secret now from `process.env.SESSION_SECRET`; set `saveUninitialized: false`.
- Added git-ignored `.env` (real local values) and committed `.env.example` (placeholders).
- **Why:** removes duplicated hardcoded credentials and secret from source control.

## Ticket 1 — Restructure web folder into views/ and public/ (`811dcac`)
- Moved all 12 `.ejs` templates into `src/web/views/`.
- Moved `myUI.css` into `src/web/public/`.
- Pointed `app.set("views", …)` at `views/` and `express.static` at `public/`.
- **Why:** the static server previously exposed the whole web folder, so `db.js` (DB credentials) and all source were downloadable. Now only `public/` is served.

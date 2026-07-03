# HEdClass Improvement Backlog

Work top to bottom. One commit per ticket. Verify acceptance criteria before committing.

---

## Ticket 1 — Fix static file exposure (SECURITY, do first)
**Problem:** `app.use(express.static(path.join(__dirname)))` in `src/web/app.js` serves the entire web folder — `db.js` (with DB credentials), `app.js`, and all `.ejs` files are downloadable at e.g. `http://localhost:3000/db.js`.

**Tasks:**
- Create `src/web/views/` and move all `.ejs` files into it.
- Create `src/web/public/` and move `myUI.css` into it.
- Update `app.js`: `app.set("views", path.join(__dirname, "views"))` and `app.use(express.static(path.join(__dirname, "public")))`.
- Verify all pages still render and CSS still loads.

**Accept when:** `http://localhost:3000/db.js` and `/app.js` return 404; all pages render with styling.
**Commit:** `Restructure web folder into views and public to stop serving source files`

---

## Ticket 2 — Move secrets to environment variables
**Problem:** DB credentials hardcoded (duplicated in `src/web/db.js` and `src/api/server.js`); session secret hardcoded in `app.js`.

**Tasks:**
- `npm install dotenv`. Create `.env` (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, SESSION_SECRET) and `.env.example` with placeholders.
- Read config from `process.env` in `db.js`, `api/server.js`, and the session setup.
- Add `.env` to `.gitignore`.
- Set `saveUninitialized: false` on the session while in there.

**Accept when:** `git grep root` finds no credentials; app runs from `.env` values.
**Commit:** `Move database credentials and session secret to environment variables`

---

## Ticket 3 — Remove assignment identifiers
**Tasks:**
- Rename database from `40302656` to `hedclass` (update `.env`, and the `Database:`/`USE` references inside the seeder SQL).
- Rename `src/seeder/40302656.sql` to `src/seeder/seed.sql`.
- Update `package.json`: remove the GitLab `repository` URL (or point at GitHub), add a description and author.

**Accept when:** no occurrence of `40302656` anywhere in the repo; app runs against the `hedclass` database.
**Commit:** `Rename database and seeder for portfolio use`

---

## Ticket 4 — Auth middleware + remove dead code
**Problem:** The same `if (req.session.user && req.session.user.role === ...)` block is copy-pasted into every route. ~200 lines of commented-out routes remain in `app.js`.

**Tasks:**
- Create middleware `requireRole(role)` that redirects to `/` if the session user is missing or the wrong role; apply it to every protected route.
- Delete all commented-out route blocks in `app.js`.
- Fix the dead reference `req.session.user.degree_ids` in the select-degree POST (it never exists).

**Accept when:** no route contains an inline role check; hitting protected URLs logged-out redirects to sign-in; app.js has no commented-out routes.
**Commit:** `Add role middleware and remove dead code from app.js`

---

## Ticket 5 — Modular architecture (routes / controllers / data layer)
**Problem:** All ~850 lines live in `app.js`.

**Tasks:**
- Split into `src/web/routes/` (auth.js, registry.js, classifications.js), `src/web/controllers/` (matching controllers), and `src/web/models/` (or `data/`) for all SQL.
- `app.js` should only contain app setup, middleware, and route mounting (~50 lines).
- No behaviour changes — pure refactor. Test every page after.

**Accept when:** every feature works exactly as before; no SQL in controllers; no business logic in routes.
**Commit:** `Refactor app into routes, controllers and data layer`

---

## Ticket 6 — Correct classification engine (eligibility rules)
**Problem:** The engine (in `api/server.js`) only computes the weighted average. The domain rules require eligibility checks first. Also, resit marks are capped at insert time, destroying the original mark.

**Rules to implement (in order):**
1. Student must have full credits per year (e.g. 120) recorded for Years 1–3.
2. Every module mark must be a pass (≥ 40, using the capped resit value) — any outstanding fail → **"Not eligible for Honours"** (store as its own outcome, distinct from "Fail").
3. Resit cap (40) applied **at calculation time only** — store the raw mark in `student_marks`, keep `is_resit`, and stop capping in the add/edit student routes.
4. Weighted averages: per-year credit-weighted average, then final = Y2 × w2 + Y3 × w3 (weights from the degree row).
5. Boundaries: ≥70 First, ≥60 2:1, ≥50 2:2, ≥40 Third, else Fail.

**Tasks:** extract the engine into its own module (e.g. `src/api/services/classify.js`) so it is testable; add the eligibility outcome to the `classifications` result enum and the dashboard/review views.

**Accept when:** a student with one Year 3 mark of 35 and an average of 68 gets "Not eligible for Honours", not a 2:1; a resit entered as 65 shows raw 65 but calculates as 40.
**Commit:** `Implement honours eligibility rules and calculation-time resit capping`

---

## Ticket 7 — Reclassification and reopen
**Problem:** The run only INSERTs when no classification exists, and approved students are locked forever.

**Tasks:**
- Change the run to upsert: if a classification exists with status `pending_review`, UPDATE it with fresh averages/proposed result (so editing marks then re-running recalculates). Leave `approved`/`overridden` rows alone.
- Add POST `/classifications/students/:id/reopen`: sets status back to `pending_review`, final_result to `Pending`, is_overridden to 0. Add a "Reopen" button on approved/overridden rows.

**Accept when:** edit marks → re-run → averages update; approved student can be reopened, re-edited, re-run, re-approved.
**Commit:** `Support reclassification with upsert engine and reopen action`

---

## Ticket 8 — Fix IDOR and secure the API
**Problem:** Ownership checks in student view/edit/review routes are commented out — any classifications officer can access any student by ID. The API on port 4000 has no auth at all (anyone can `DELETE /students/:id`).

**Tasks:**
- Restore ownership checks: student must belong to the logged-in officer (`created_by`) — or better, to a degree the officer is assigned to — else redirect.
- Protect the API: require an `x-api-key` header checked against `process.env.API_KEY`; send it from the web app's axios calls.

**Accept when:** officer A cannot open officer B's student by URL; `curl -X DELETE localhost:4000/students/1` without the key returns 401.
**Commit:** `Restore ownership checks and require API key on REST API`

---

## Ticket 9 — UX: feedback, confirmations, shared layout
**Problems:** failed login redirects silently; successful adds redirect to a blank form with no confirmation; deletes have no confirmation; blocked actions fail silently; 12 views duplicate the same head/navbar.

**Tasks:**
- Session-based flash messages (set `req.session.flash`, render + clear in views): login failure, add/edit/delete success, blocked delete reasons.
- Redirect to the relevant dashboard after successful add instead of the empty form.
- `onsubmit="return confirm('...')"` on all delete and reopen forms.
- Extract EJS partials: `partials/head.ejs`, `partials/navbar.ejs`; use in all views.
- Server-side validation on all forms (marks 0–100, required fields, valid email) with error feedback.

**Accept when:** wrong password shows a message; every create/edit/delete gives visible feedback; deletes ask for confirmation; all pages share partials.
**Commit:** `Add flash messages, confirmations, validation and shared partials`

---

## Ticket 10 — Distribution chart (Chart.js)
**Tasks:**
- Add Chart.js via CDN to the classifications dashboard.
- Render the existing `distribution` object as a bar or doughnut chart (include the new "Not eligible" outcome). Keep the numeric summary alongside.

**Accept when:** chart renders and matches the table counts, updates after overrides.
**Commit:** `Add classification distribution chart to dashboard`

---

## Ticket 11 — CSV export for exam board
**Tasks:**
- GET `/classifications/export` (role-protected): streams a CSV of the cohort — student number, name, Y2/Y3/final averages, result, status, overridden flag.
- Export button on the dashboard.

**Accept when:** downloaded CSV opens in Excel with correct data for the logged-in officer's cohort only.
**Commit:** `Add CSV export of cohort classifications`

---

## Ticket 12 — Audit log
**Tasks:**
- New `audit_log` table: id, user_id, action, entity, entity_id, details (JSON/text), created_at.
- Log: classification runs, approvals, overrides (with old → new result), reopens, student deletes.
- Simple read-only "Activity" view for the officer (optional: registry sees all).

**Accept when:** overriding a student writes a row showing who, when, and what changed.
**Commit:** `Add audit log for classification actions`

---

## Ticket 13 — README and polish
**Tasks:**
- Write a real README: what the app does, screenshots, tech stack, setup (MySQL, seed, `.env`, npm scripts), test users.
- Add screenshots to a `docs/` or `screenshots/` folder.
- Final pass: consistent formatting, remove any leftover console.logs.

**Accept when:** a stranger could clone, set up, and run the app from the README alone.
**Commit:** `Add project README with setup instructions and screenshots`

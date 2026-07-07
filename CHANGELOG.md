# Changelog

Portfolio-rebuild improvements to HEdClass, worked one ticket at a time.

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

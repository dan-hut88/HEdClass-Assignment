# Changelog

Portfolio-rebuild improvements to HEdClass, worked one ticket at a time.

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

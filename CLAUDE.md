# HEdClass — Portfolio Rebuild

## What this is
A degree classification web app (originally a QUB CSC7062 assignment, now being improved as a portfolio project). Classification officers manage student cohorts and run automated degree classification; registry officers manage officers and degree programmes.

## Stack (do not change)
- Node.js 20 + Express, EJS templates — **no front-end frameworks** (no React/Vue/etc.)
- MySQL 8 via `mysql2`, sessions via `express-session`, passwords via `bcrypt`
- Client-side libraries allowed: Bootstrap 5 (already used), Chart.js
- Web app: `src/web/app.js` on port 3000. REST API: `src/api/server.js` on port 4000.
- Run: `npm run start` (starts both via concurrently)

## Working method
- Work through `TICKETS.md` **in order** — one ticket at a time.
- After each ticket: run the app, verify the acceptance criteria manually, then make **one atomic commit** using the suggested commit message (imperative mood).
- Do not start the next ticket until the current one is committed and working.
- Explain what you changed and why after each ticket so Daniel can follow the reasoning — this is a learning project as much as a portfolio one.

## Conventions
- Parameterised SQL only (already the case — keep it that way).
- No secrets in committed code — everything sensitive goes in `.env`.
- Keep views in `src/web/views/`, static assets in `src/web/public/` (after ticket 1).
- Role names: `"registry services officer"` and `"classifications officer"` (match the DB enum/values exactly).

## Database
Tables: `users`, `degree`, `user_degree`, `degree_modules`, `students`, `student_marks`, `classifications`. Seeder in `src/seeder/`. Local dev credentials are in `.env` (after ticket 2).

## Test users (local dev only)
- admin@hedclass.com / admin123 — registry services officer
- j.murphy@hedclass.com / murphy123 — classifications officer (multi-degree)
- l.chen@hedclass.com / chen123 — classifications officer

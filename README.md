# HEdClass

A degree classification web app for higher-education institutions. Classifications officers manage their student cohort and run automated honours classification; registry services officers manage officers, degree programmes and assignments.

Originally built as a university assignment (QUB CSC7062), then rebuilt ticket-by-ticket as a portfolio project — see [`TICKETS.md`](TICKETS.md) for the backlog and [`CHANGELOG.md`](CHANGELOG.md) for what changed and why at each step.

## Screenshots

_Add screenshots of the sign-in page, classifications dashboard, and student review flow to `screenshots/` and reference them here — e.g. `![Classifications dashboard](screenshots/dashboard.png)`._

## Features

- **Automated honours classification** — per-year credit-weighted averages, honours eligibility rules (full credits, no outstanding module fails), and boundary-based results (First / 2:1 / 2:2 / Third / Fail / Not eligible for Honours). Resit marks are capped at calculation time only — the raw mark is always preserved.
- **Review workflow** — every automated result starts as `pending_review`; an officer approves or overrides it with a rationale before it counts as final. Approved/overridden classifications can be reopened for re-review after marks change.
- **Reclassification** — re-running classification for a cohort recalculates any student still `pending_review`; approved or overridden results are left untouched until reopened.
- **Registry administration** — registry services officers manage classifications officers, degree programmes, module weightings and degree assignments.
- **Ownership-scoped access** — a classifications officer can only see and act on the students they created; the REST API requires a shared API key on every request.
- **Dashboard** — cohort stats, a distribution chart (Chart.js), borderline/overridden/pending flags, CSV export for the exam board, and a per-officer activity log of classification actions.

## Stack

- **Backend:** Node.js 20, Express, `express-session`, `bcrypt`
- **Views:** EJS templates, Bootstrap 5 — no front-end framework
- **Database:** MySQL 8 via `mysql2`
- **Charts:** Chart.js (CDN)
- Two processes: the web app (`src/web/app.js`, port 3000) and a REST API (`src/api/server.js`, port 4000) that the web app calls over HTTP with an API key.

## Setup

### 1. Prerequisites

- Node.js 20+
- A running MySQL 8 server

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Import the schema and seed data (a phpMyAdmin-style SQL dump) into your MySQL server:

```bash
mysql -u root -p < src/seeder/seed.sql
```

This creates a `hedclass` database with sample degrees, students, marks and officer accounts.

### 4. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | MySQL connection |
| `SESSION_SECRET` | Signs the web app's session cookie — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `API_KEY` | Shared secret the web app sends to the REST API on every request — generate the same way |

`.env` is git-ignored; never commit real credentials.

### 5. Run

```bash
npm run start
```

Starts both the web app (`http://localhost:3000`) and the REST API (`http://localhost:4000`) via `concurrently`. Or run them individually with `npm run start:web` / `npm run start:api`.

## Test users (local dev only)

| Email | Password | Role |
| --- | --- | --- |
| admin@hedclass.com | admin123 | registry services officer |
| j.murphy@hedclass.com | murphy123 | classifications officer (multi-degree) |
| l.chen@hedclass.com | chen123 | classifications officer |

## Project structure

```
src/
  api/
    server.js            REST API (port 4000) — student/officer data, classification engine
    services/classify.js Honours eligibility + classification logic (pure functions)
  web/
    app.js                Web app setup (port 3000)
    routes/                Path → controller wiring + role middleware
    controllers/            Request/response handling
    models/                  SQL queries
    middleware/requireRole.js
    views/                   EJS templates + shared partials/
    public/                  Static assets (myUI.css)
  seeder/seed.sql          Schema + sample data
```

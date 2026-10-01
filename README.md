# Careflow appointment management

React + TypeScript + Redux Toolkit frontend, shadcn-style Radix UI components, Tailwind CSS, Recharts, Sonner toasts, and Express + TypeScript + PostgreSQL backend. Public visitors do not need an account. Only administrators can access patient records and dashboard management.

## Start locally

1. Install Node.js 22.12+ and PostgreSQL (or Docker).
2. Run `npm install`.
3. Copy `.env.example` to `.env` and change `ADMIN_EMAIL`, `ADMIN_NAME`, and `ADMIN_PASSWORD` (12–72 characters).
4. Run `docker compose up -d` to start the supplied local PostgreSQL, or set `DATABASE_URL` for your existing database.
5. Run `npm run db:migrate` and `npm run admin:create`.
6. Run `npm run dev`.

Open http://localhost:5173 for public booking, http://localhost:5173/admin for admin login, and http://localhost:5173/admin/preview for a dashboard with generated sample data. Preview operations are in memory only and never grant access to real records. Public submissions always require a running API and database.

## Neon

Replace `DATABASE_URL` in `.env` with your Neon PostgreSQL connection string, including `?sslmode=require`. Use the pooled Neon endpoint for the API if needed. Run the migration and admin creation commands against the new database. The same code works with either provider; changing the URL switches databases and does not copy records between them. Keep `.env` private; no database credentials are exposed to the frontend.

## Production

Run `npm run build`, then set `NODE_ENV=production`, `APP_ORIGIN=https://your-domain.example`, and `DATABASE_URL` in the server environment. Run `npm start`; Express serves both the compiled frontend and API on `PORT` (default 4000). Serve through HTTPS. Secure session cookies require HTTPS in production. Set `TRUST_PROXY=1` only behind exactly one trusted reverse proxy; ensure the proxy overwrites forwarded IP headers. Use a persistent shared rate-limit store before running multiple API replicas (the included limiter is process-local).

## Features and security

- Public booking: full name, email, phone, department, description, start and end date/time, contact consent, validation, success reference and toast.
- Admin-only dashboard: totals, today/pending/completed metrics, area/line, doughnut and bar charts, date-range selection, patient directory, appointment search, status/department/date filters, pagination and CSV export.
- Admins can inspect, create, edit patient details, reschedule, update appointment status and delete requests with confirmation. Editing validates future appointment times, so past visits must be rescheduled before their other details can be saved. All displayed times use the browser’s timezone; the database stores UTC timestamps.
- Redux manages appointments, authentication state and light/dark preferences. The theme persists locally. Patient data is not stored in localStorage.
- Server-side input validation, parameterized SQL, bcrypt passwords, opaque HttpOnly session cookies, database-backed sessions with 8-hour expiry, admin role verification on every protected route, strict same-origin write checks, Helmet security headers, JSON body limits, and separate login/booking rate limits.
- `npm run admin:create` can reset an admin password and revokes existing sessions. There is no public admin registration or hardcoded password.
- CSV cells escape spreadsheet formulas. APIs containing personal data disable caching.

Run `npm test` for booking validation tests and `npm run build` for type checking and production compilation.

## Operational limits

Requests are appointments awaiting clinic confirmation. This app does not enforce doctor availability or prevent overlapping requests. Alerts are in-dashboard only; email/SMS delivery is not configured. Add those services if your workflow needs reminders outside the app.

Before using real clinical data, configure backups, retention, access monitoring, incident response and any privacy requirements that apply to your organization. The application has no clinical record upload or medical advice features.

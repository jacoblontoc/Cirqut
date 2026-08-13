# Cirqut

Cirqut is a public-site concept and platform foundation for a future PCB-creation assistant. The current repository contains the marketing site, pricing, waitlist, contact intake, approved-account login, legal/support pages, and the backend boundaries needed before product work begins. It does not contain the PCB workspace itself.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev -- --port 3001
npm run build
npm test
npm run lint
```

The retained local preview normally runs at `http://localhost:3001`.

## Selected platform

- Vercel: native Next.js hosting, previews, server functions, and environment management.
- Neon Postgres: relational system of record through Drizzle and the Neon HTTP driver.
- Neon Managed Better Auth: approved-account email login, with Google and GitHub reserved behind the signup policy.
- Portkey: selected future model gateway; no model integration or PCB product backend exists yet.

Public account creation defaults to `waitlist`. `/signup` redirects to `/waitlist`, and authentication alone does not grant beta access.

## Environment

Copy `.env.example` to ignored `.env.local` only after the standalone Neon project and Neon-managed Vercel integration exist. Never commit credentials.

Important variables:

- `DATABASE_URL` — pooled runtime connection.
- `DATABASE_URL_UNPOOLED` — direct migration connection.
- `NEON_AUTH_BASE_URL` — branch-specific Managed Better Auth URL.
- `NEON_AUTH_COOKIE_SECRET` — application-managed secret of at least 32 characters.
- `AUTH_SIGNUP_MODE` — `waitlist`, `invite`, or `open`; default `waitlist`.

## Database

```bash
npm run db:generate
npm run db:migrate
```

`db:migrate` changes a real database. Confirm the exact Neon project, branch, database, role, and reviewed SQL before running it. The active clean migration is `drizzle/0000_foundation.sql`; the superseded unapplied WorkOS migration is preserved outside the active migration directory.

See `docs/platform-setup.md` for current external-account state and `docs/platform-decisions.md` for the architecture rationale.

# Cirqut

Cirqut is a public-site concept and platform foundation for a future PCB-creation assistant. The current repository contains the marketing site, pricing, waitlist, contact intake, verified account flows, a separate private-beta invite gate, legal/support pages, and the backend boundaries needed before product work begins. It does not contain the PCB workspace itself.

## Local development

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
```

The retained local preview normally runs at `http://localhost:3000`.

## Selected platform

- Vercel: native Next.js hosting, previews, server functions, and environment management.
- Neon Postgres: relational system of record through Drizzle and the Neon HTTP driver.
- Neon Managed Better Auth: verified email/password accounts plus Google and GitHub behind environment policy flags.
- Portkey: selected future model gateway; no model integration or PCB product backend exists yet.

Public account creation defaults to `waitlist`; the private-beta preview can set the policy to `open`. `/signup` redirects to the create-account view, while product access still requires a one-time invite key after verification.

## Environment

Copy `.env.example` to ignored `.env.local` only after the standalone Neon project and Neon-managed Vercel integration exist. Never commit credentials.

Important variables:

- `DATABASE_URL` — pooled runtime connection.
- `DATABASE_URL_UNPOOLED` — direct migration connection.
- `NEON_AUTH_BASE_URL` — branch-specific Managed Better Auth URL.
- `NEON_AUTH_COOKIE_SECRET` — application-managed secret of at least 32 characters.
- `AUTH_SIGNUP_MODE` — `waitlist`, `invite`, or `open`; default `waitlist`.
- `NEXT_PUBLIC_AUTH_SOCIAL_ENABLED` — enables Google and GitHub buttons only when signup is open.

## Database

```bash
npm run db:generate
npm run db:migrate
```

`db:migrate` changes a real database. Confirm the exact Neon project, branch, database, role, and reviewed SQL before running it. The active migrations are `drizzle/0000_foundation.sql` through `drizzle/0003_foundation.sql`; the superseded unapplied WorkOS migration is preserved outside the active migration directory.

## Beta invite keys

After pointing `.env.local` at the intended non-production branch and applying the reviewed invite migrations, create an email-bound key with:

```bash
node scripts/create-invite.ts --email person@example.com --days 14
```

`--days` is the time allowed to redeem the key; accepted beta access does not expire with the key. The plaintext key is shown once and only its SHA-256 hash is stored. To preserve attribution for a future referral reward, an operator may also pass `--referrer-user-id <auth-user-id>`. No reward balance or payout logic exists yet.

See `docs/platform-setup.md` for current external-account state and `docs/platform-decisions.md` for the architecture rationale.

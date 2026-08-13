# Platform setup status

Updated: 2026-08-12

## Completed locally

- Migrated the active application from vinext/Cloudflare-oriented output to native Next.js 16.
- Created and linked the Vercel project `jacobs-projects-c01dad91/cirqut`.
- Installed the official Neon Auth and Neon serverless packages.
- Added a lazy Managed Better Auth server/client integration and same-origin auth proxy.
- Defaulted account creation to waitlist mode; `/signup` redirects to `/waitlist`.
- Added working waitlist and contact APIs that fail safely when the database is unavailable.
- Added user profile, organization, membership, beta access, entitlement, and audit schema foundations.
- Generated and reviewed `drizzle/0000_foundation.sql`; it has not been applied remotely.
- Added liveness (`/api/health`) and readiness (`/api/ready`) endpoints.
- Production build, five platform contracts, and lint with zero errors pass.
- Production dependencies have no known npm audit findings after removing the obsolete vinext-era React Server Components package. Four moderate advisories remain in Drizzle Kit's local-only migration dependency chain; npm's proposed forced fix is a breaking downgrade and was not applied.

## Vercel

Local project link:

- Scope: `jacobs-projects-c01dad91` (`Jacob's projects`)
- Project: `cirqut`
- Link file: `.vercel/project.json` (ignored)

No Git remote or baseline commit exists. A connected GitHub, GitLab, or Bitbucket repository is required before the Neon-managed integration can create database branches for Vercel preview deployments.

Do not attach `cirqut.org` until the user owns and verifies it.

## Neon blocker

The connected Neon account currently exposes only the organization `Vercel: Jacob's projects`, which is managed by Vercel. Neon rejects standalone project creation in that organization with `organization is managed by Vercel`. The unrelated `ecoguard-postgresql` project was not changed.

Required one-time user step:

1. Sign in at [Neon Console](https://console.neon.tech).
2. Create or select a normal Neon-owned organization.
3. Create a standalone project named `cirqut` in an AWS region close to the intended Vercel function region.

After that account step, connect through Neon Console → Integrations → Vercel → **Link Existing Neon Account** / Vercel Marketplace **Connectable Accounts → Neon**. Select only the `cirqut` Vercel project, enable a persistent `vercel-dev` branch if desired, and enable automatic obsolete preview-branch cleanup.

The integration should inject:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEON_AUTH_BASE_URL` after Managed Better Auth is enabled
- `VITE_NEON_AUTH_URL` (integration-provided; the Next.js app does not use this public variable)

Generate and add `NEON_AUTH_COOKIE_SECRET` separately in Vercel for Development, Preview, and Production. Never print or commit it. Then pull the linked environment locally:

```bash
vercel env pull .env.local --yes
```

Verify variable names only; do not print values.

## Managed Better Auth launch checklist

The local app is ready to consume the branch Auth URL but remote auth is not provisioned.

Before opening login beyond controlled testing:

1. Provision Managed Better Auth on the intended Cirqut branch.
2. Set application name to `Cirqut`.
3. Keep `AUTH_SIGNUP_MODE=waitlist` and `NEXT_PUBLIC_AUTH_SOCIAL_ENABLED=false`.
4. Pre-create approved beta users and active application `access_grants` records.
5. Add trusted localhost and Vercel preview/production domains.
6. Configure custom SMTP and email verification.
7. Create production Google and GitHub OAuth apps before enabling social login.
8. Disable localhost access on the production auth branch before launch.

Enterprise SAML/OIDC SSO is not currently documented as a Managed Better Auth feature. It remains a future adapter decision.

## Migration sequence

Do not run `npm run db:migrate` until the exact target is confirmed.

1. Pull `DATABASE_URL_UNPOOLED` for a Neon development branch.
2. Inspect `drizzle/0000_foundation.sql` again.
3. Apply to the development branch.
4. Validate all eight tables, indexes, and form inserts.
5. Test the full auth session and access-grant flow.
6. Apply to the default branch only after explicit approval.

The folder `drizzle-legacy-unapplied-workos/` is an archive only and must never be included in the active migration chain.

## Production gaps

- Counsel-approved privacy, terms, entity, jurisdiction, and contact details.
- Durable abuse/rate limiting for public forms.
- Operator tooling for waitlist review, deletion requests, grants, and audit review.
- Git-connected preview deployment flow.
- Production SMTP/OAuth configuration and end-to-end auth testing.
- Payment provider selection and billing; no payments are accepted.
- The PCB product itself; intentionally out of scope.

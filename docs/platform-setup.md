# Platform setup status

Updated: 2026-08-17

## Completed locally

- Migrated the active application from vinext/Cloudflare-oriented output to native Next.js 16.
- Created and linked the Vercel project `jacobs-projects-c01dad91/cirqut`.
- Created the public GitHub repository `jacoblontoc/Cirqut`, pushed `main`, and connected it to Vercel.
- Updated the Vercel framework preset to native Next.js.
- Installed the official Neon Auth and Neon serverless packages.
- Added a lazy Managed Better Auth server/client integration and same-origin auth proxy.
- Added email/password signup, required verification, password reset, Google/GitHub entry points, and a separate one-time invite gate.
- Made `/waitlist` session-aware and reduced `/account` to a compatibility redirect.
- Reused the homepage button system across public forms and limited the sidebar pullout animation to page-to-sidebar entry.
- Added working waitlist and contact APIs that fail safely when the database is unavailable.
- Added user profile, organization, membership, beta access, entitlement, and audit schema foundations.
- Generated and reviewed `drizzle/0000_foundation.sql`.
- Added liveness (`/api/health`) and readiness (`/api/ready`) endpoints.
- Production build, six platform contracts, and lint with zero errors pass.
- Production dependencies have no known npm audit findings after removing the obsolete vinext-era React Server Components package. Four moderate advisories remain in Drizzle Kit's local-only migration dependency chain; npm's proposed forced fix is a breaking downgrade and was not applied.

## Vercel

Local project link:

- Scope: `jacobs-projects-c01dad91` (`Jacob's projects`)
- Project: `cirqut`
- Link file: `.vercel/project.json` (ignored)

Git repository:

- Remote: `https://github.com/jacoblontoc/Cirqut.git`
- Production branch: `main`
- Vercel Git connection: active
- Framework preset: Next.js

The waitlist/social-login safety flags and `NEON_AUTH_COOKIE_SECRET` are configured for Production, Preview, and Development. The Neon-managed integration is active and provides branch-specific database URLs for Production and Development; Preview values are created dynamically per deployment. `NEON_AUTH_BASE_URL` is configured for Production and Development. Because the integration did not inject either documented Auth URL into Preview deployments, Preview uses the shared non-production `vercel-dev` Auth endpoint as a Vercel environment fallback. Values remain hidden.

`cirqut.org` and `www.cirqut.org` are verified on the Vercel project. Namecheap remains the DNS host.

## Neon

Provisioned standalone resources:

- Organization: `Criqut` (console-managed, free plan; note the spelling differs from product name `Cirqut`)
- Project: `cirqut`
- Region: AWS US West 2 (Oregon)
- Default branch: `main`
- Database: `neondb`
- Managed Better Auth: provisioned on `main`

The unrelated Vercel-managed `ecoguard-postgresql` project was not changed.

The Neon-managed Vercel connection is active for Vercel `Jacob's projects / cirqut` and Neon `Criqut / cirqut / neondb`. It created the persistent `vercel-dev` branch. A dedicated Git test branch verified that Vercel creates Preview deployments and Neon creates isolated `preview/<git-branch>` database branches containing the full application schema and branch-local Auth data.

The integration manages or dynamically injects:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `NEON_AUTH_BASE_URL` for Production and Development

The current integration did not inject `NEON_AUTH_BASE_URL` or `VITE_NEON_AUTH_URL` into Preview deployments. The project-level Preview fallback points to `vercel-dev` Auth while each Preview retains an isolated application database. Hosted Preview signup and social login remain disabled until the invite migration and Auth provisioning are repaired and revalidated; the retained local preview uses explicit open/social overrides.

`NEON_AUTH_COOKIE_SECRET` already exists separately in Vercel for Development, Preview, and Production. Never print or commit it. Pull the linked development environment locally with:

```bash
vercel env pull .env.local --yes
```

Verify variable names only; do not print values.

## Managed Better Auth launch checklist

The same-origin local session endpoint responds through the development Auth URL, and the custom account UI is implemented. Provider callbacks and required-verification email still need end-to-end validation; production remains unchanged.

Before opening login beyond controlled testing:

1. Validate the intended local and Preview trusted origins.
2. Validate required email verification, OTP, and password reset in Preview.
3. Complete Google and GitHub callback testing before enabling hosted social login broadly.
4. Repeat the reviewed settings on `main` only after Preview passes, and disable localhost there.

Enterprise SAML/OIDC SSO is not currently documented as a Managed Better Auth feature. It remains a future adapter decision.

## Migration sequence

Do not run `npm run db:migrate` until the exact target is confirmed.

The reviewed migration was verified on temporary branch `mcp-migration-2026-08-13T03-30-16`, then applied to `main` with explicit approval. The temporary branch was deleted. Validation on `main` confirms eight public application tables, twenty-two total public indexes, and three public foreign keys.

The same reviewed migration was then applied to the persistent `vercel-dev` branch with explicit approval. Validation there confirms the same eight public application tables, twenty-two total public indexes, and three public foreign keys. Local readiness and the Auth session endpoint return `200`; waitlist and contact submissions return `202`. The synthetic validation rows were deleted and verified absent.

The additive invite migrations `0001` and `0002` are also applied to `vercel-dev`. Validation confirms both invite columns, the one-use hash index, and all three matching Drizzle history rows. The first email-bound development key is pending; `main` was not changed.

The additive onboarding migration `0003` adds lightweight profile context and completion state. It was generated and reviewed locally but has not been applied to `vercel-dev` or `main`.

The first hosted Git deployment reached Vercel `READY` at `https://cirqut.vercel.app`. Production health, readiness, Auth session routing, waitlist persistence, and contact persistence passed; synthetic production validation rows were deleted and verified absent. Desktop and mobile remote QA passed without console errors, failed assets, or horizontal overflow. A separate Preview deployment reached `READY` with its isolated Neon database and the shared non-production Auth fallback; health reports both services configured, readiness is `ready`, and an unauthenticated session returns `null`.

Next steps:

1. Redeem the development key once, then confirm replay rejection and the redemption audit event.
2. Validate required verification plus Google/GitHub callbacks end to end on `vercel-dev`.
3. Revisit branch-specific Preview Auth if the Neon integration begins injecting `NEON_AUTH_BASE_URL`; remove the shared fallback once verified.

The folder `drizzle-legacy-unapplied-workos/` is an archive only and must never be included in the active migration chain.

## Production gaps

- Counsel-approved privacy, terms, entity, jurisdiction, and contact details.
- Durable abuse/rate limiting for public forms.
- Operator tooling for waitlist review, deletion requests, grants, and audit review.
- Production SMTP/OAuth configuration and end-to-end auth testing.
- Payment provider selection and billing; no payments are accepted.
- The PCB product itself; intentionally out of scope.

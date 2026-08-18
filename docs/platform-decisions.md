# Platform decisions

Updated: 2026-08-12

Status: selected for the pre-product foundation. Vercel and the local Next.js project are linked. The standalone Neon project and Neon-managed Vercel connection still require the account step documented in `platform-setup.md`.

## Selected stack

| Layer | Selection | Current boundary |
| --- | --- | --- |
| Hosting | Vercel | Native Next.js, server functions, previews, environment variables, and future production deployment. |
| Authentication | Neon Managed Better Auth | Verified email/password accounts plus Google and GitHub; application access remains separately invite-gated. |
| Primary database | Standalone Neon Postgres | Public intake, Cirqut-specific profiles, tenancy, access grants, entitlement placeholders, and audit events. |
| ORM and migrations | Drizzle ORM / Drizzle Kit | Type-safe runtime queries and reviewed PostgreSQL migrations. |
| Future enterprise identity | Provider adapter, not selected | Neon does not currently document native enterprise SAML/OIDC SSO. Do not claim or implement it prematurely. |
| Future model gateway | Portkey | Selected earlier for provider routing and BYOK governance, but intentionally not installed during the pre-product phase. |

## Hosting: Vercel

The explicit hosting decision replaces the earlier vinext/Cloudflare runtime. Native Next.js minimizes compatibility work and makes deployment behavior match local builds.

The Vercel project is named `cirqut` under the `Jacob's projects` team. The repository is linked through ignored `.vercel/project.json`. A Git remote is not configured yet, so Git-triggered preview deployments and the Neon preview-branch integration cannot be completed until a repository is connected.

Do not deploy under `cirqut.org` until the user purchases and verifies that domain. Do not claim domain ownership or availability.

## Database: standalone Neon Postgres

Use a Neon-owned project and connect it to Vercel through the Neon-managed Connectable Account integration. This keeps Neon billing and project control in Neon while still providing:

- `DATABASE_URL` for pooled runtime queries;
- `DATABASE_URL_UNPOOLED` for direct migrations;
- branch-specific variables for Vercel preview deployments;
- branch-isolated Managed Better Auth endpoints when auth is enabled.

The active schema intentionally stops before PCB product data. It includes:

- `waitlist_entries` and `contact_submissions`;
- `user_profiles` linked to Managed Better Auth user IDs;
- `organizations` and `organization_memberships`;
- `access_grants` as the private-beta authorization gate, with hashed one-time keys and optional referrer attribution for a future reward ledger;
- `organization_entitlements` as a payment-provider-neutral plan boundary;
- `audit_events` for security-relevant application events.

Do not reuse or mutate the unrelated `ecoguard-postgresql` project.

Official references:

- [Neon-managed Vercel integration](https://neon.com/docs/guides/neon-managed-vercel-integration)
- [Choose a Neon connection method](https://neon.com/docs/connect/choose-connection)
- [Drizzle with Neon](https://neon.com/docs/guides/drizzle)

## Authentication: Managed Better Auth

Managed Better Auth stores identity and sessions in the database's branch-local `neon_auth` schema. Cirqut does not store passwords.

Current policy:

- `/signup` redirects to `/login?view=signup`;
- `AUTH_SIGNUP_MODE=waitlist` remains the safe default, while private-beta Preview may use `open` after the invite gate is ready;
- email/password accounts require verification, with password reset handled by Managed Better Auth;
- authentication is not authorization—an active `access_grants` record is required for beta access;
- Google and GitHub stay disabled until their environment is open and provider credentials are configured;
- enterprise SSO is a future provider boundary, not a current Neon capability claim.

Managed Better Auth is beta and currently lacks a documented global restricted-signup switch. The application-level gate protects Cirqut access even if an identity record is created outside the UI, but production launch still requires a full abuse and bypass review.

Before production auth, configure trusted domains, custom SMTP, custom Google/GitHub OAuth credentials, email verification, and production localhost restrictions.

Official references:

- [Managed Better Auth overview](https://neon.com/docs/auth/overview)
- [Next.js quick start](https://neon.com/docs/auth/quick-start/nextjs-api-only)
- [Auth roadmap](https://neon.com/docs/auth/roadmap)
- [Production checklist](https://neon.com/docs/auth/production-checklist)

## Future model boundary

Do not add model SDKs, prompts, AI routes, source ingestion, embeddings, or PCB product tables in this phase. When model work is explicitly authorized:

- keep provider access server-only;
- support organization-scoped routing, budgets, retries, and fallbacks;
- never expose or store plaintext customer model keys;
- store only masked integration metadata and auditable usage references;
- verify confidential-document retention and logging behavior before sending customer content.

## Implementation order

1. Complete the standalone Neon organization/project account step.
2. Install the Neon-managed Vercel Connectable Account integration and pull environment variables locally.
3. Provision Managed Better Auth on the intended branch.
4. Apply `drizzle/0000_foundation.sql` to a development branch, validate, then explicitly approve production application.
5. Configure trusted domains, SMTP, email verification, and provider OAuth credentials.
6. Connect a Git repository for preview deployments and validate database/auth branch isolation.
7. Keep the site waitlist-only until the security, legal, and access-control launch gates are complete.

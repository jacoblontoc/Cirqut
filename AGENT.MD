# Agent guide for Cirqut

This file is the repository-specific operating guide for coding agents. Read it before changing the project. Prefer the instructions here over generic assumptions about the product, stack, or visual direction.

## 1. Project purpose

Cirqut is currently a public-facing website and technical foundation for a future PCB-creation assistant. The intended product makes the early PCB workflow easier for beginners and experienced electrical engineers by helping them:

- turn an idea into clear board requirements;
- research datasheets, errata, application notes, and reference designs;
- connect important conclusions to verifiable source passages;
- identify conflicts, open questions, and assumptions;
- prepare an editable starter schematic;
- retain design rationale, setup guidance, bring-up notes, and review material;
- hand a well-understood project to detailed engineering and layout.

This is not an autorouter, a full PCB editor, or a replacement for engineering review. Detailed design, layout, validation, and final approval remain with the engineer.

## 2. Current phase and scope boundary

The repository currently contains:

- the marketing front page;
- pricing, FAQ, waitlist, contact, status, security, privacy, and terms pages;
- approved-account login and a waitlist-first public signup redirect;
- Neon Managed Better Auth proxy routes and a private-beta access gate;
- a Neon Postgres/Drizzle schema for public intake, identity profiles, tenancy, entitlements, and audit events;
- native Next.js/Vercel output, build validation, lint, and platform contract tests.

Do not implement the actual PCB workspace unless the user explicitly expands the scope. In particular, do not add:

- schematic editing or rendering;
- source-document ingestion or extraction;
- citation or evidence-graph logic;
- AI chat, model calls, or prompt pipelines;
- project dashboards or product mockups;
- PCB routing, simulation, DRC, or EDA automation;
- product-domain tables beyond a separately reviewed schema change.

Infrastructure work must stop at the boundary needed by the public site, identity, team tenancy, or an explicitly requested next phase.

## 3. Product and messaging truths

Keep public copy factual, plain, and direct.

- Lead with the broad benefit: PCB creation is easier to start, understand, and review.
- Describe features by what they do. Avoid quirky microcopy, vague claims, and slogan-heavy feature names.
- Do not reduce the product to “creating a documented schematic.” The larger value is making the PCB-creation process easier.
- Mention the starter schematic as one output, not the entire product.
- Do not overemphasize KiCad. It is the first planned handoff/synchronization target, not the product identity.
- Never imply that the system replaces an engineer or guarantees a correct board.
- Do not claim that a domain, trademark, integration, or product capability exists unless it is verified.
- Pricing is preview pricing for a private beta and may change.
- The product name and wordmark are provisional. Keep the logo symbol-only; do not place “Reson,” “Cirqut,” or another product name inside the logo asset or mark component unless explicitly requested.

## 4. Visual direction

The visual system is restrained, readable, and technical without looking sterile.

### Required qualities

- near-monochrome warm neutrals;
- subtle background gradients rather than a blank white canvas;
- strong information hierarchy and comfortably readable text;
- clean Stack Sans typography;
- generous but purposeful whitespace;
- precise borders and compact technical details;
- sharp, nearly square buttons with a quiet highlight/offset interaction;
- responsive, device-agnostic layouts and imagery;
- load/reveal motion that is subtle and respects reduced-motion preferences.

### Avoid

- flashy colors, neon gradients, or glossy “AI startup” effects;
- generic SaaS feature-card grids added only to fill space;
- overly sparse screens with tiny text;
- Notion or Anthropic imitation;
- app dashboards, tabbed product previews, or fake product UI on the public front page;
- quirky labels, corny phrases, and abstract feature names;
- device-specific hero imagery or artwork locked to one screen ratio;
- unnecessary badges, eyebrow labels, explanatory sidebars, or decorative elements.

### Current tokens

The main palette and typography live in `app/globals.css`:

- `--page: #f4f2ed`
- `--surface: #fbfaf7`
- `--surface-strong: #fffefa`
- `--surface-dark: #20221f`
- `--ink: #181a17`
- muted green-gray accents only
- `Stack Sans Text` for body copy
- `Stack Sans Headline` for headings
- `Geist Mono` for small technical labels

Extend existing custom properties before introducing new one-off colors. Preserve the existing prohibition against saturated purple and blue startup palettes in the rendered-page tests.

### Buttons

Use the existing `.button` system on the marketing site and the matching sharp treatment in `app/(public-site)/public-shells.css`.

- Keep corners at roughly `2px` to `3px`.
- Keep the hover effect restrained: a small translation, offset shadow, or soft sweep.
- Preserve clear focus-visible styles.
- Do not use pill buttons unless the user explicitly changes the design language.
- Touch targets should remain at least about 42px high.

### Hero composition

The active hero is intentionally copy-and-actions only.

- Do not restore an illustration, product mockup, device frame, or decorative PCB image without an explicit design request.
- Keep the quiet page gradient in CSS and preserve the centered, device-agnostic composition.
- `public/hero-pcb-transparent-v2.png` is a retained inactive iteration, not an active page asset.
- If imagery is reintroduced later, treat it as a new reviewed design decision and update the corresponding rendered-page test.

## 5. Technology stack

- Node.js `>=22.13.0`
- TypeScript with strict mode
- React 19
- Next.js 16 App Router
- Vercel for hosting, server functions, previews, and deployment environments
- Tailwind imported for availability, with the current site primarily using authored CSS
- Neon Managed Better Auth for email, Google, and GitHub identity
- Neon Serverless Postgres for relational data
- Drizzle ORM and Drizzle Kit for schema and migrations
- Portkey selected as the future model gateway, not yet integrated

The explicit Vercel decision replaced the earlier vinext/Cloudflare runtime. Do not reintroduce a second deployment runtime unless the user makes another architectural decision.

## 6. Repository map

### Public marketing surface

- `app/page.tsx` — minimal entry point for the home page.
- `app/product-front-page.tsx` — marketing-page content and lightweight interactions.
- `app/globals.css` — global tokens, marketing layout, responsive rules, motion, and buttons.
- `app/layout.tsx` — global metadata, fonts, Open Graph, and X card metadata.
- `public/hero-pcb-transparent-v2.png` — retained inactive hero-art iteration; not rendered.
- `public/og-v4.png` — current social-preview image referenced by metadata.

### Public support surface

- `app/(public-site)/layout.tsx` — shared route-group wrapper.
- `app/(public-site)/public-shells.css` — auth, legal, contact, and support-page styles.
- `app/(public-site)/_components/auth-shell.tsx` — approved-account login for email and gated social providers.
- `app/(public-site)/_components/waitlist-form.tsx` — public private-beta application form.
- `app/(public-site)/_components/public-shells.tsx` — shared legal shell and symbol mark.
- `app/(public-site)/login`, `waitlist`, `contact`, `account`, `privacy`, `terms`, `security`, and `status` — public/account pages.
- `app/(public-site)/signup/page.tsx` — compatibility redirect to `/waitlist`; public account creation is closed.

### Authentication

- `app/api/auth/[...path]/route.ts` — Managed Better Auth proxy with waitlist-mode signup and social-entry blocking.
- `lib/auth/server.ts` — lazy server-side Neon Auth instance and environment checks.
- `lib/auth/client.ts` — browser auth client through the same-origin proxy.
- `lib/auth/policy.ts` — `waitlist`, `invite`, and `open` signup-policy boundary.
- `proxy.ts` — protects account routes server-side.

### Database

- `db/index.ts` — Neon HTTP/Drizzle client factory.
- `db/schema.ts` — public intake, user profiles, organizations, memberships, beta access grants, entitlements, and audit events. No PCB-product tables.
- `drizzle.config.ts` — PostgreSQL migration configuration.
- `drizzle/0000_foundation.sql` — reviewed foundation migration; validated on a temporary branch and applied with explicit approval to Neon `main` and `vercel-dev`.
- `drizzle-legacy-unapplied-workos/` — preserved superseded migration artifacts; never apply them.

### Platform and validation

- `.vercel/project.json` — ignored local link to the `cirqut` Vercel project.
- `app/api/waitlist`, `contact`, `health`, and `ready` — public intake and operational endpoints.
- `tests/platform-contracts.test.mjs` — platform, waitlist, auth-policy, schema, and asset contracts.
- `docs/platform-decisions.md` — architectural rationale.
- `docs/platform-setup.md` — current external-account status and remaining setup.
- `.env.example` — required environment names with placeholders only.

Legacy source files under `build/`, `examples/`, `worker/`, and `vite.config.ts` are excluded from the active Next.js build and public Git history. Do not edit or revive them without an explicit cleanup or runtime decision. Generated directories such as `.next`, `dist`, `.vinext`, `.wrangler`, `outputs`, and `work` are not source-of-truth code.

## 7. Common commands

Run from the repository root:

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
npm run db:generate
npm run db:migrate
```

Command expectations:

- `npm run dev` starts the native Next.js development server. The retained local preview normally uses `http://localhost:3001`.
- `npm run build` is the production validation gate.
- `npm test` performs a production build and runs the platform contract tests.
- `npm run lint` must finish with zero errors. One known optimization warning may remain for the external font link.
- `npm run db:generate` may change migration metadata; inspect every generated SQL file.
- `npm run db:migrate` changes a real database and must never run without the intended Neon target, reviewed SQL, and explicit authorization.

Preserve `package-lock.json` and use npm unless the user explicitly changes package managers.

## 8. Development-server rules

- Reuse an existing healthy retained preview when possible.
- If the repository moves, stop only the exact process serving this project, then restart it from the new path.
- Do not scan arbitrary ports. Use the configured/local URL or inspect the exact known listener.
- Keep server logs project-local or in an explicitly chosen temporary log file.
- After a move, verify that HMR and builds use the new directory rather than a still-running process rooted in the old path.
- A successful health check should include `/`, `/waitlist`, `/login`, `/contact`, `/privacy`, `/terms`, and `/api/health`. `/signup` should redirect to `/waitlist`.

## 9. Component and TypeScript conventions

- Prefer focused React components and plain data arrays over unnecessary abstractions.
- Keep server components as the default; add `"use client"` only for actual browser state or effects.
- Use `next/link` for internal route navigation in shared/public shells.
- Keep hash links as normal anchors when they navigate within the same document.
- Maintain strict TypeScript; do not use `any` to bypass typing without a documented reason.
- Avoid speculative client state and unneeded dependencies.
- Keep accessibility attributes, semantic landmarks, and visible focus states intact.
- All interactive controls must work with keyboard and touch input.
- When adding motion, include or preserve `prefers-reduced-motion: reduce` behavior.

## 10. Responsive behavior

The page must be content- and device-agnostic.

- Validate wide desktop, tablet, and narrow mobile layouts.
- Do not hardcode copy or artwork around a single screenshot size.
- Avoid horizontal overflow.
- Ensure hero copy remains readable without a supporting paragraph.
- Stack primary hero actions on narrow screens.
- Keep pricing and footer content usable on narrow screens.
- Navigation must remain accessible when the mobile menu is open.

Use browser visual QA when explicitly requested or when a change materially affects layout. For purely structural changes, build and rendered tests may be sufficient.

## 11. Authentication architecture

Neon Managed Better Auth is the selected identity service. It is beta and stores users, sessions, and auth configuration in the branch-local `neon_auth` schema.

- Managed Better Auth is the source of truth for authentication identity and sessions.
- Application tables own Cirqut-specific profiles, organizations, roles, beta access, entitlements, and audit records.
- Authentication never implies product access. Require an active `access_grants` record while the private beta is gated.
- `AUTH_SIGNUP_MODE` defaults to `waitlist`. Do not expose email signup or social OAuth until restricted account creation is enforceable.
- Google and GitHub UI is present but disabled unless both public signup and the explicit social flag are enabled.
- Email/password login is for pre-created or approved existing accounts. Leave room for email signup later; do not build a password store.
- Neon does not currently document native enterprise SAML/OIDC SSO. Preserve a future provider adapter boundary and never claim SSO is live.
- Protect future private routes server-side through `proxy.ts` and application authorization; hiding client UI is not authorization.
- If auth environment values are missing, APIs return `503` and account routes redirect safely to login.

Required values:

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET` — at least 32 random characters
- `AUTH_SIGNUP_MODE` — `waitlist`, `invite`, or `open`; default `waitlist`
- `NEXT_PUBLIC_AUTH_SOCIAL_ENABLED` — default `false`

Before production auth, configure trusted domains, custom SMTP, production Google/GitHub OAuth apps, email verification, and disable production localhost access. See `docs/platform-setup.md`.

## 12. Database architecture

Neon Postgres is the system of record.

- Runtime queries use `@neondatabase/serverless` over HTTP and Drizzle's `neon-http` adapter.
- `DATABASE_URL` should be the pooled runtime connection.
- `DATABASE_URL_UNPOOLED` should be the direct connection used for migrations; `DATABASE_DIRECT_URL` remains a local fallback only.
- The current schema stops at public intake, identity/tenancy, beta access, entitlement placeholders, and audit events.
- Do not add PCB sources, projects, citations, schematics, or model-run tables without a separately reviewed product schema.
- Do not reuse an unrelated database.
- Do not apply migrations to main before reviewing the SQL and confirming the exact project, branch, database, and role.
- Prefer a Neon development branch for migration trials.
- Back up or preserve a branch before destructive schema work.
- Product authorization must be organization-scoped before product tables are introduced.

Current external state: the public GitHub repository `jacoblontoc/Cirqut` is connected to the native-Next.js `cirqut` Vercel project. A console-managed Neon organization named `Criqut` exists (note the organization-name spelling differs from the product), with standalone project `cirqut`, default branch `main`, database `neondb`, and Managed Better Auth provisioned. The Neon-managed Vercel integration is active, with production/development database URLs and branch-specific Auth endpoints configured. The reviewed foundation schema is applied to both `main` and the persistent `vercel-dev` branch. Local readiness, Auth session routing, waitlist intake, and contact intake have been validated against `vercel-dev`; synthetic validation rows were removed. Git preview deployments receive isolated Neon database branches; because the integration did not inject `NEON_AUTH_BASE_URL`, Preview uses the shared non-production `vercel-dev` Auth endpoint as a Vercel environment fallback. The unrelated `ecoguard-postgresql` project must remain untouched.

## 13. Model and AI boundary

Portkey is the selected future server-side model gateway. No model SDK or route belongs in the repository yet unless explicitly requested.

When that phase begins:

- isolate provider access behind a server-only adapter;
- support workspace-scoped routing, budgets, retries, and fallbacks;
- never expose provider keys to the browser;
- never store plaintext customer model keys in Postgres;
- store only gateway integration references and masked metadata;
- default to metrics-only or privacy-preserving logging for confidential design documents;
- record model-run metadata and audit information without leaking source documents.

## 14. Secrets and environment handling

- `.env.example` contains placeholders and is committed.
- `.env.local`, `.dev.vars`, and other real environment files are ignored.
- Never commit or print credentials, connection strings, cookies, API keys, OAuth codes, or database passwords.
- Do not ask users to paste secrets into chat. Ask them to configure secrets in the relevant local/dashboard environment.
- Keep local and hosted variable names aligned.
- Production and preview secrets belong in Vercel environment variables or the Neon-managed integration. Pull them locally with `vercel env pull .env.local --yes`; never hand-copy values into committed files.
- `PORTKEY_API_KEY` is reserved only; its presence does not authorize model integration.

## 15. Database migration workflow

For any approved schema change:

1. Edit `db/schema.ts`.
2. Run `npm run db:generate`.
3. Inspect the SQL and `drizzle/meta` changes.
4. Confirm that the migration is PostgreSQL, not SQLite.
5. Confirm the exact Neon project and branch.
6. Prefer applying to a temporary/development branch first.
7. Validate the resulting schema and relevant queries.
8. Apply to main only after explicit authorization.
9. Update `docs/platform-setup.md` if external state changes.

Never silently run `db:migrate` as part of a normal frontend build.

## 16. Testing and quality gates

Minimum validation depends on the change:

### Copy or CSS-only public-page changes

- `npm run build`
- `npm run lint`
- update tests if contractual copy/assets change

### Route, auth, or shared-shell changes

- `npm test`
- `npm run lint`
- health check the affected public routes
- verify missing-auth configuration still fails safely

### Database changes

- `npm run db:generate`
- inspect generated SQL
- `npm test`
- do not apply remotely unless separately authorized

### Final acceptance

- build succeeds;
- tests pass;
- lint has zero errors;
- no new console errors;
- required routes respond;
- no horizontal overflow or broken mobile navigation for visual changes;
- preview still runs from the active repository path.

When replacing a hero or social image, update both source references and tests. Do not weaken tests simply to make a build pass; change assertions only when the product contract intentionally changed.

## 17. Legal and public-form rules

- Privacy and terms pages are pre-launch drafts, not legal approval.
- Preserve the draft/counsel-review disclosure until qualified counsel provides approved copy.
- Do not invent a company legal name, mailing address, privacy contact, or jurisdiction.
- Waitlist and contact forms are real database-backed intake endpoints when `DATABASE_URL` is configured. When it is missing, they must return a clear unavailable state and never claim success.
- Do not add tracking pixels, raw-IP retention, marketing enrollment, or email sending without explicit scope and disclosure updates.
- Do not collect or store real credentials through the presentation form.
- Update disclosures immediately when a real form or auth path becomes operational.

## 18. MCP and external-tool rules

Neon Postgres and Vercel connectors are available for account inspection and setup.

- Prefer connector tools over browser automation for semantic account operations.
- Read existing resources before creating new ones to avoid duplicates.
- Treat project creation, schema mutation, production migration, organization changes, and destructive actions as real external side effects.
- Always name the exact target before a mutation.
- Use read-only inspection freely when it is relevant and scoped.
- Do not mutate the unrelated Neon project.
- Keep external setup notes in `docs/platform-setup.md` current.

## 19. Agent workflow

For each task:

1. Read this file and the files directly relevant to the request.
2. Inspect the working tree; preserve unrelated user changes.
3. State any assumption that materially affects product scope or external state.
4. Make the smallest coherent implementation that fully handles the request.
5. Use `apply_patch` for hand-authored edits.
6. Run validation proportional to the change.
7. Keep the retained preview healthy when the task concerns the public site.
8. Report the outcome, validation, and any real external blocker.

Do not stop at a starter screen, placeholder, or partially connected interaction when the user requested a complete public-site surface. Conversely, do not infer permission to build the actual product from a request about the front page or infrastructure.

## 20. Change-control rules

Require explicit user direction before:

- deploying or publishing to a new public URL;
- applying a database migration to a remote branch;
- creating or deleting a cloud project;
- changing the selected auth, database, model-router, or hosting providers;
- adding billing or accepting payments;
- sending form submissions, invitations, emails, or external messages;
- removing legal disclosures;
- implementing the PCB product itself.

Normal in-scope implementation steps such as editing files, running local builds, generating reviewed migration files, and restarting the local preview do not require additional confirmation.

## 21. Known caveats

- Managed Better Auth and its official SDK are beta. Pin versions, read release notes before upgrades, and verify the full login/session flow after every upgrade.
- The Neon Auth package currently emits transitive peer-dependency warnings during install; do not suppress them without confirming an upstream-compatible fix.
- npm Audit currently reports four moderate advisories through Drizzle Kit's local migration-only esbuild chain. Do not run `npm audit fix --force`; its current suggestion is a breaking Drizzle Kit downgrade. Reassess when Drizzle publishes a compatible fix.
- Lint may report a non-blocking advisory for externally loaded fonts; do not add new lint errors.
- `tmp/imagegen/hero-pcb-chroma-v2.png` is an intermediate source, not the public asset.
- Older hero and Open Graph variants remain locally or as retained assets; do not switch references accidentally.
- The active repository lives at `C:\Users\Jacob L\Documents\GitHub\Cirqut`.
- `AGENT.MD` is the requested filename. Tools that only auto-discover `AGENTS.md` should be directed to read this file explicitly.

## 22. Definition of done

A change is complete when:

- it matches the user's requested scope and current product truths;
- it preserves the restrained, readable visual system;
- it does not imply unbuilt product behavior;
- security and external-service boundaries remain intact;
- required build, tests, lint, and health checks pass;
- documentation reflects any architecture or setup-state change;
- the local preview, when required, is available from the current repository path;
- the final report distinguishes completed local work from account-bound or production work that still remains.

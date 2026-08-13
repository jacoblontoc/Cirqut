import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("uses the native Vercel and Neon foundation", async () => {
  const packageJson = JSON.parse(await source("package.json"));

  assert.equal(packageJson.name, "cirqut");
  assert.equal(packageJson.scripts.dev, "next dev");
  assert.equal(packageJson.scripts.build, "next build");
  assert.ok(packageJson.dependencies.next);
  assert.ok(packageJson.dependencies["@neondatabase/auth"]);
  assert.ok(packageJson.dependencies["@neondatabase/serverless"]);
  assert.equal(packageJson.dependencies.vinext, undefined);
  assert.equal(packageJson.dependencies["@workos-inc/authkit-nextjs"], undefined);
});

test("keeps the public site waitlist-first", async () => {
  const [frontPage, signupPage, layout] = await Promise.all([
    source("app/product-front-page.tsx"),
    source("app/(public-site)/signup/page.tsx"),
    source("app/layout.tsx"),
  ]);

  assert.match(frontPage, /PCB creation made easy\./);
  assert.match(frontPage, /href="\/waitlist"/);
  assert.match(frontPage, /href="\/login"/);
  assert.doesNotMatch(frontPage, /href="\/signup"/);
  assert.doesNotMatch(frontPage, /hero-image|hero-pcb-transparent/);
  assert.match(signupPage, /redirect\("\/waitlist"\)/);
  assert.match(layout, /applicationName: "Cirqut"/);
  assert.match(layout, /Stack\+Sans\+Headline/);
  assert.match(layout, /Stack\+Sans\+Text/);
});

test("guards public account creation while preserving approved login", async () => {
  const [route, policy, login] = await Promise.all([
    source("app/api/auth/[...path]/route.ts"),
    source("lib/auth/policy.ts"),
    source("app/(public-site)/_components/auth-shell.tsx"),
  ]);

  assert.match(route, /authPath\.startsWith\("sign-up"\)/);
  assert.match(route, /authPath === "sign-in\/social"/);
  assert.match(policy, /return "waitlist"/);
  assert.match(login, /authClient\.signIn\.email/);
  assert.match(login, /authClient\.signIn\.social/);
  assert.match(login, /Google/);
  assert.match(login, /GitHub/);
  assert.match(login, /auth-shell--login/);
  assert.doesNotMatch(login, /Account access|auth-context|Welcome back/);
});

test("defines public intake, tenancy, access, entitlement, and audit tables", async () => {
  const schema = await source("db/schema.ts");

  for (const table of [
    "user_profiles",
    "organizations",
    "organization_memberships",
    "waitlist_entries",
    "access_grants",
    "contact_submissions",
    "organization_entitlements",
    "audit_events",
  ]) {
    assert.match(schema, new RegExp(`pgTable\\("${table}"`), table);
  }

  assert.doesNotMatch(schema, /workos/i);
});

test("includes public APIs, health checks, social artwork, and accessible motion", async () => {
  await Promise.all([
    access(new URL("app/api/waitlist/route.ts", root)),
    access(new URL("app/api/contact/route.ts", root)),
    access(new URL("app/api/health/route.ts", root)),
    access(new URL("app/api/ready/route.ts", root)),
    access(new URL("public/og-v4.png", root)),
  ]);

  const [css, forms] = await Promise.all([
    source("app/globals.css"),
    source("lib/public-forms.ts"),
  ]);

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(css, /#4f46e5|#7c3aed|#0ea5e9|#3730a3/i);
  assert.match(forms, /privacyAccepted/);
  assert.match(forms, /hasHoneypotValue/);
  assert.match(forms, /isAllowedFormOrigin/);
});

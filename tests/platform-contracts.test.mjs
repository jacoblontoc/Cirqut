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

  assert.match(frontPage, /Get your PCB project moving\./);
  assert.match(frontPage, /Turn requirements and research into an editable PCB starting point\./);
  assert.match(frontPage, /Private beta applications are open\./);
  assert.doesNotMatch(frontPage, /PCB creation made easy\./);
  assert.match(frontPage, /aria-labelledby="hero-title"/);
  assert.match(frontPage, /<section ref=\{heroRef\} className="hero"/);
  assert.match(frontPage, /const hero = heroRef\.current/);
  assert.match(frontPage, /site-header--visible/);
  assert.doesNotMatch(frontPage, /hero-steps|PCB project workflow/);
  assert.ok(frontPage.indexOf('className="announcement"') < frontPage.indexOf('className="hero"'));
  assert.ok(frontPage.indexOf('className="hero"') < frontPage.indexOf('className={headerVisible'));
  const announcement = frontPage.slice(frontPage.indexOf('className="announcement"'), frontPage.indexOf('className="hero"'));
  const hero = frontPage.slice(frontPage.indexOf('className="hero"'), frontPage.indexOf('className={headerVisible'));
  assert.match(announcement, /href="\/waitlist"[\s\S]*?Join the waitlist/);
  assert.match(hero, /href="\/login\?view=signup"[\s\S]*?Get Started/);
  assert.match(frontPage, /href="\/waitlist"/);
  assert.match(frontPage, /href="\/login"/);
  assert.doesNotMatch(frontPage, /href="\/signup"/);
  const footer = frontPage.slice(frontPage.indexOf('<footer className="site-footer">'));
  assert.doesNotMatch(footer, />Resources<|href="\/login"/);
  assert.match(signupPage, /redirect\("\/login\?view=signup"\)/);
  assert.match(layout, /applicationName: "Cirqut"/);
  assert.match(layout, /Stack\+Sans\+Headline/);
  assert.match(layout, /Stack\+Sans\+Text/);
});

test("supports verified accounts while keeping private-beta access separate", async () => {
  const [route, policy, login, loginPage, account, waitlistActions, waitlist, waitlistForm, onboardingForm, shells, shellCss, gateNavigation, layout, globalCss] = await Promise.all([
    source("app/api/auth/[...path]/route.ts"),
    source("lib/auth/policy.ts"),
    source("app/(public-site)/_components/auth-shell.tsx"),
    source("app/(public-site)/login/page.tsx"),
    source("app/(public-site)/account/page.tsx"),
    source("app/(public-site)/waitlist/actions.ts"),
    source("app/(public-site)/waitlist/page.tsx"),
    source("app/(public-site)/_components/waitlist-form.tsx"),
    source("app/(public-site)/_components/beta-access-forms.tsx"),
    source("app/(public-site)/_components/public-shells.tsx"),
    source("app/(public-site)/public-shells.css"),
    source("app/auth-gate-navigation.tsx"),
    source("app/layout.tsx"),
    source("app/globals.css"),
  ]);

  assert.match(route, /authPath\.startsWith\("sign-up"\)/);
  assert.match(route, /authPath === "sign-in\/social"/);
  assert.match(policy, /return "waitlist"/);
  assert.match(login, /authClient\.signIn\.email/);
  assert.match(login, /authClient\.signIn\.social/);
  assert.match(login, /authClient\.signUp\.email/);
  assert.match(login, /authClient\.emailOtp\.verifyEmail/);
  assert.match(login, /authClient\.emailOtp\.sendVerificationOtp/);
  assert.match(login, /authClient\.requestPasswordReset/);
  assert.match(login, /authClient\.resetPassword/);
  assert.match(login, /Continue with Google/);
  assert.match(login, /Continue with GitHub/);
  assert.match(login, /Continue with Email/);
  assert.match(login, /view === "signup" && !signupEmailOpen/);
  assert.match(login, /view === "signup" && signupEmailOpen/);
  assert.match(login, /id="signup-email-form"/);
  assert.match(login, /Back to sign-up options/);
  assert.match(loginPage, /key=\{view\}/);
  assert.match(login, /src="\/auth\/google\.png"/);
  assert.match(login, /src="\/auth\/github\.svg"/);
  assert.match(login, /callbackURL: "\/waitlist"/);
  assert.doesNotMatch(login, /\/account/);
  assert.match(login, /AuthGateShell/);
  assert.match(account, /redirect\("\/waitlist"\)/);
  assert.doesNotMatch(account, /getAuth|accessGrants|account-card/);
  assert.match(waitlistActions, /WITH redeemed AS/);
  assert.match(waitlistActions, /invite_key_hash = NULL/);
  assert.match(waitlistActions, /expires_at = NULL/);
  assert.match(waitlistActions, /referrerAuthUserId/);
  assert.match(waitlistActions, /beta_invite\.redeemed/);
  assert.match(waitlistActions, /revalidatePath\("\/waitlist"\)/);
  assert.match(waitlistActions, /saveOnboarding/);
  assert.match(waitlistActions, /onboardingCompletedAt/);
  assert.match(waitlistActions, /eq\(accessGrants\.status, "active"\)/);
  assert.match(waitlistActions, /tools\.includes\("none"\) && tools\.length > 1/);
  assert.match(waitlist, /dynamic = "force-dynamic"/);
  assert.match(waitlist, /getAuth\(\)\.getSession/);
  assert.match(waitlist, /user\.emailVerified/);
  assert.match(waitlist, /eq\(accessGrants\.authUserId, user\.id\)/);
  assert.doesNotMatch(waitlist, /eq\(accessGrants\.email, email\)/);
  assert.match(waitlist, /AuthGateShell/);
  assert.match(waitlist, /WaitlistForm/);
  assert.match(waitlist, /BetaAccessForms/);
  assert.match(waitlist, /userProfiles\.onboardingCompletedAt/);
  assert.match(waitlist, /A few quick questions\./);
  assert.doesNotMatch(waitlist, /auth-context|auth-feature-list/);
  assert.match(login, /button button--dark button--large button--full auth-submit/);
  assert.match(waitlistForm, /button button--dark button--large button--full auth-submit/);
  assert.match(shells, /auth-gate__form-pane/);
  assert.match(shells, /data-auth-gate-back/);
  assert.match(shells, /auth-gate__bezel/);
  assert.match(shells, /auth-gate__visual-pane/);
  assert.doesNotMatch(shells, /<img|<Image/);
  assert.doesNotMatch(shells, /className="auth-header"|className="auth-footer"/);
  const formPaneBlock = shellCss.match(/\.auth-gate__form-pane\s*\{([^}]*)\}/)?.[1] ?? "";
  const visualPaneBlock = shellCss.match(/\.auth-gate__visual-pane\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.doesNotMatch(formPaneBlock, /animation:/);
  assert.doesNotMatch(visualPaneBlock, /animation:/);
  assert.doesNotMatch(visualPaneBlock, /url\(/);
  assert.match(shellCss, /data-auth-gate="entering"[\s\S]*?auth-gate-from-left[\s\S]*?auth-gate-from-right/);
  assert.match(shellCss, /\.auth-gate \.auth-card\s*\{[\s\S]*?auth-gate-content-fade/);
  assert.match(shellCss, /data-auth-gate="exiting"[\s\S]*?auth-gate-to-left[\s\S]*?auth-gate-to-right/);
  assert.match(shellCss, /\.auth-page\.auth-gate\s*\{[\s\S]*?z-index:\s*1001[\s\S]*?background:\s*transparent/);
  assert.match(shellCss, /prefers-reduced-motion:\s*reduce[\s\S]*?\.auth-gate__form-pane/);
  assert.match(gateNavigation, /cloneNode\(true\)/);
  assert.match(gateNavigation, /authGate = "entering"/);
  assert.match(gateNavigation, /router\.push/);
  assert.match(gateNavigation, /router\.replace/);
  assert.match(gateNavigation, /aria-hidden="true" inert/);
  assert.match(layout, /<AuthGateNavigation \/>/);
  assert.match(globalCss, /\.auth-route-backdrop\s*\{[\s\S]*?z-index:\s*1000/);
  assert.match(globalCss, /\.button:disabled/);
  assert.match(onboardingForm, /What best describes you\?/);
  assert.match(onboardingForm, /How experienced are you with PCB design\?/);
  assert.match(onboardingForm, /What tools have you used\?/);
  assert.match(onboardingForm, /What are you hoping Cirqut helps with\?/);
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
  assert.match(schema, /inviteKeyHash: text\("invite_key_hash"\)/);
  assert.match(schema, /referrerAuthUserId: text\("referrer_auth_user_id"\)/);
  assert.match(schema, /onboardingCompletedAt: timestamp\("onboarding_completed_at"/);
});

test("includes public APIs, health checks, social artwork, and accessible motion", async () => {
  await Promise.all([
    access(new URL("app/api/waitlist/route.ts", root)),
    access(new URL("app/api/contact/route.ts", root)),
    access(new URL("app/api/health/route.ts", root)),
    access(new URL("app/api/ready/route.ts", root)),
    access(new URL("public/hero-pcb-soldering-edge-v3.png", root)),
    access(new URL("public/og-v4.png", root)),
    access(new URL("public/auth/google.png", root)),
    access(new URL("public/auth/github.svg", root)),
  ]);

  const [css, forms] = await Promise.all([
    source("app/globals.css"),
    source("lib/public-forms.ts"),
  ]);

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.hero\s*\{[\s\S]*?min-height:\s*calc\(100svh - 38px\)/);
  assert.match(css, /url\("\/hero-pcb-soldering-edge-v3\.png"\)/);
  assert.match(css, /\.hero h1\s*\{[\s\S]*?white-space:\s*nowrap/);
  assert.doesNotMatch(css, /contentLoad/);
  assert.match(css, /\.site-header--visible\s*\{[\s\S]*?opacity:\s*1/);
  assert.doesNotMatch(css, /#4f46e5|#7c3aed|#0ea5e9|#3730a3/i);
  assert.match(forms, /privacyAccepted/);
  assert.match(forms, /hasHoneypotValue/);
  assert.match(forms, /isAllowedFormOrigin/);
});

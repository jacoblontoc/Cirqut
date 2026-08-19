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
  const [route, policy, login, loginPage, account, waitlistActions, waitlist, waitlistForm, onboardingForm, shells, shellCss, gateNavigation, layout, globalCss, dashboard, dashboardLayout, dashboardShell, dashboardDialogs, dashboardCss, workspaceData, dashboardActions, projectPage, boardPage, membersPage, invitePage] = await Promise.all([
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
    source("app/dashboard/page.tsx"),
    source("app/dashboard/layout.tsx"),
    source("app/dashboard/dashboard-shell.tsx"),
    source("app/dashboard/dashboard-dialogs.tsx"),
    source("app/dashboard/dashboard.module.css"),
    source("app/dashboard/workspace-data.ts"),
    source("app/dashboard/actions.ts"),
    source("app/dashboard/projects/[projectId]/page.tsx"),
    source("app/dashboard/projects/[projectId]/boards/[boardId]/page.tsx"),
    source("app/dashboard/members/page.tsx"),
    source("app/invite/[token]/page.tsx"),
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
  assert.match(login, /view === "signup" && <p className="auth-switch">Already have an account\? <Link href=\{loginHref\}>Log in<\/Link><\/p>/);
  assert.match(login, /view === "signup" && !signupEmailOpen/);
  assert.match(login, /view === "signup" && signupEmailOpen/);
  assert.match(login, /id="signup-email-form"/);
  assert.match(login, /Back to sign-up options/);
  assert.match(loginPage, /key=\{view\}/);
  assert.match(login, /src="\/auth\/google\.png"/);
  assert.match(login, /src="\/auth\/github\.svg"/);
  assert.match(login, /router\.push\(returnTo\)/);
  assert.match(login, /callbackURL: returnTo/);
  assert.match(loginPage, /requestedReturnTo\.startsWith\("\/invite\/"\)/);
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
  assert.match(waitlistActions, /saveAccountUsername/);
  assert.match(waitlistActions, /usernamePattern = \/\^\[a-z0-9_\]\{3,24\}\$\//);
  assert.match(waitlistActions, /error\.code === "23505"/);
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
  assert.match(waitlist, /const needsOnboarding = databaseReady && accessActive && !onboardingComplete/);
  assert.match(waitlist, /back=\{needsOnboarding \? <OnboardingBackButton \/> : undefined\}/);
  assert.match(waitlist, /accessActive && onboardingComplete/);
  assert.match(waitlist, /<DashboardGateExit \/>/);
  assert.match(waitlist, /<DashboardShell[\s\S]*?avatarUrl=\{user\.image\}[\s\S]*?productUpdatesConsent=\{productUpdatesConsent\}[\s\S]*?username=\{username\}/);
  assert.doesNotMatch(waitlist, /A few quick questions\.|Help Cirqut fit how you work|You’re in\./);
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
  assert.match(formPaneBlock, /background:\s*#fffefa/);
  assert.match(visualPaneBlock, /background:\s*#f4f4f0/);
  assert.doesNotMatch(visualPaneBlock, /border-left|gradient\(/);
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
  assert.match(onboardingForm, /name="username"[\s\S]*pattern="\[a-z0-9_\]\{3,24\}"/);
  assert.match(onboardingForm, /export function OnboardingBackButton/);
  assert.match(onboardingForm, /authClient\.signOut\(\)/);
  assert.match(onboardingForm, /router\.replace\("\/"\)/);
  assert.match(onboardingForm, /document\.body\.dataset\.authGate = "exiting"/);
  assert.match(onboardingForm, /router\.replace\("\/dashboard"\)/);
  assert.match(onboardingForm, /!needsOnboarding && <div className="beta-account-meta"/);
  assert.match(onboardingForm, /!needsOnboarding && <button className="button button--light button--full beta-signout"/);
  assert.match(globalCss, /data-auth-gate-target="dashboard"/);
  assert.match(workspaceData, /getAuth\(\)\.getSession/);
  assert.match(workspaceData, /!grant \|\| !profile\?\.onboardingCompletedAt/);
  assert.match(workspaceData, /redirect\("\/waitlist"\)/);
  assert.match(workspaceData, /organizationMemberships\.authUserId, user\.id/);
  assert.match(workspaceData, /workspaces\.find\(\(workspace\) => workspace\.id === requestedWorkspaceId\)/);
  assert.match(dashboardLayout, /avatarUrl=\{context\.user\.image\}/);
  assert.match(dashboardLayout, /productUpdatesConsent=\{context\.productUpdatesConsent\}/);
  assert.match(dashboard, /eq\(projects\.organizationId, context\.activeWorkspace\.id\)/);
  assert.match(dashboard, /Create your first project/);
  assert.match(dashboardShell, /Collapse sidebar/);
  assert.match(dashboardShell, /import Image from "next\/image"/);
  assert.match(dashboardShell, /collapsed \? "\/icons\/angle-right\.svg" : "\/icons\/angle-left\.svg"/);
  assert.doesNotMatch(dashboardShell, /\{collapsed \? "→" : "←"\}|>S<\/span>/);
  assert.match(dashboardShell, /safeAvatarUrl/);
  assert.match(dashboardShell, /unoptimized/);
  assert.match(dashboardShell, /src="\/avatar\/cirqut-default\.png"/);
  assert.match(dashboardShell, /backgroundColor = avatarColor\(avatarSeed\)/);
  const avatarPalette = [...(dashboardShell.match(/const AVATAR_COLORS = \[([\s\S]*?)\] as const;/)?.[1] ?? "").matchAll(/#[\dA-F]{6}/g)].map(([hex]) => hex);
  assert.equal(avatarPalette.length, 8);
  for (const hex of avatarPalette) {
    const value = Number.parseInt(hex.slice(1), 16);
    const channels = [value >> 16, (value >> 8) & 255, value & 255].map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    assert.ok((luminance + 0.05) / 0.05 >= 7, `${hex} must keep strong contrast with black`);
  }
  assert.doesNotMatch(dashboardShell, />Account</);
  assert.match(dashboardShell, /Workspace navigation[\s\S]*Projects[\s\S]*Members[\s\S]*sidebarFooter[\s\S]*account menu/);
  assert.match(dashboardShell, /action=\{switchWorkspace\}/);
  assert.match(dashboardShell, /role="slider"[\s\S]*aria-label="Resize dashboard sidebar"[\s\S]*aria-valuenow=\{sidebarWidth\}/);
  assert.match(dashboardShell, /resize\.startWidth \+ event\.clientX - resize\.startX/);
  assert.match(dashboardShell, /Settings[\s\S]*Help & feedback[\s\S]*Keyboard shortcuts[\s\S]*Sign out/);
  assert.doesNotMatch(dashboardShell, />Preferences<|openModal\("preferences"\)/);
  assert.match(dashboardShell, /LOCAL_PREFERENCES_KEY = "cirqut:dashboard-preferences"/);
  assert.match(dashboardShell, /<main className=\{styles\.workspace\} aria-label="Dashboard workspace">\{children\}<\/main>/);
  assert.doesNotMatch(dashboardShell, /Cirqut/);
  for (const section of ["Account", "Appearance", "Notifications", "Project defaults", "Accessibility"]) {
    assert.match(dashboardDialogs, new RegExp(section.replace("&", "\\&")));
  }
  assert.doesNotMatch(dashboardDialogs, /What best describes you\?|PCB design experience|Tools used|What Cirqut should help with/);
  assert.match(dashboardDialogs, /role="dialog" aria-modal="true"/);
  assert.doesNotMatch(dashboardDialogs, /styles\.modalHeader/);
  assert.match(dashboardDialogs, /styles\.srOnly[^>]*id="dashboard-modal-title"/);
  assert.match(dashboardDialogs, /event\.key === "Escape"/);
  assert.match(dashboardDialogs, /useState<SettingsPage>\("general"\)/);
  assert.match(dashboardDialogs, /kind === "settings"/);
  assert.match(dashboardDialogs, /modalNavGroup}>Settings[\s\S]*settingsSections[\s\S]*modalNavGroup}>Preferences[\s\S]*modalNavGroup}>Projects/);
  for (const icon of ["settings-sliders", "plug-connection", "age-alt", "credit-card", "database", "user", "night-day", "bell", "clip", "universal-access"]) {
    assert.match(dashboardDialogs, new RegExp(`/icons/${icon}\\.svg`));
    await access(new URL(`public/icons/${icon}.svg`, root));
  }
  assert.match(dashboardCss, /\.dashboard\[data-theme="dark"\] \.modalNavIcon \{ filter: invert\(1\); \}/);
  for (const section of ["Profile", "Password", "Sessions", "Danger zone"]) {
    assert.match(dashboardDialogs, new RegExp(`settingsGroupHeading[\\s\\S]*>${section}<`));
  }
  assert.match(dashboardDialogs, /authClient\.updateUser\(\{ image \}\)/);
  assert.match(dashboardDialogs, /authClient\.updateUser\(\{ image: null \}\)/);
  assert.match(dashboardDialogs, /action=\{usernameAction\}[\s\S]*name="username"/);
  assert.match(dashboardDialogs, /authClient\.changePassword/);
  assert.match(dashboardDialogs, /authClient\.revokeOtherSessions/);
  assert.match(dashboardDialogs, /authClient\.deleteUser/);
  assert.match(dashboardDialogs, /authClient\.signOut/);
  assert.match(dashboardDialogs, /type="range"/);
  assert.match(dashboardDialogs, /role="listbox"/);
  assert.match(dashboardCss, /\.collapsed \.sidebar \{ width: 64px; \}/);
  assert.match(dashboardCss, /\.toggle\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?right:\s*-22px;/);
  assert.match(dashboardCss, /\.dashboard\[data-resizing-sidebar="true"\] \.sidebar \{ transition: none; \}/);
  assert.match(dashboardCss, /\.sidebarResizeHandle\s*\{[\s\S]*?cursor:\s*col-resize;[\s\S]*?touch-action:\s*none;/);
  assert.match(dashboardCss, /\.modalWindow\s*\{[\s\S]*?border-radius:\s*12px/);
  assert.match(dashboardCss, /\.confirmWindow\s*\{[\s\S]*?border-radius:\s*12px/);
  assert.match(dashboardCss, /\.modalFocusRoot\s*\{[\s\S]*?width:\s*min\(1180px, 100%\)/);
  assert.match(dashboardCss, /\.modalBody\s*\{[\s\S]*?grid-template-columns:\s*230px minmax\(0, 1fr\)/);
  assert.match(dashboardCss, /\.modalContent\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(dashboardCss, /\.settingsForm,[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent/);
  assert.doesNotMatch(dashboardCss, /gradient\(/);
  const dashboardSidebarBlock = dashboardCss.match(/\.sidebar\s*\{([^}]*)\}/)?.[1] ?? "";
  const dashboardWorkspaceBlock = dashboardCss.match(/\.workspace\s*\{([^}]*)\}/)?.[1] ?? "";
  const dashboardMenuBlock = dashboardCss.match(/\.profileMenu\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(dashboardSidebarBlock, /background:\s*var\(--dash-panel\)/);
  assert.doesNotMatch(dashboardSidebarBlock, /border-right/);
  assert.match(dashboardWorkspaceBlock, /background:\s*var\(--dash-bg\)/);
  assert.match(dashboardCss, /\.accountArea \{[\s\S]*position: relative;/);
  assert.match(dashboardMenuBlock, /transition:\s*opacity/);
  assert.doesNotMatch(dashboardMenuBlock, /transform:/);
  assert.match(dashboardCss, /\.modalOverlay\s*\{[\s\S]*backdrop-filter:\s*blur\(5px\)[\s\S]*transition:\s*opacity/);
  assert.match(dashboardActions, /context\.workspaces\.find\(\(item\) => item\.id === workspaceId\)/);
  assert.match(dashboardActions, /eq\(projects\.organizationId, context\.activeWorkspace\.id\)/);
  assert.match(dashboardActions, /eq\(workspaceInvitations\.organizationId, context\.activeWorkspace\.id\)/);
  assert.match(dashboardActions, /activeWorkspace\.role !== "owner" && context\.activeWorkspace\.role !== "admin"/);
  assert.match(dashboardActions, /generateWorkspaceInviteToken\(\)/);
  assert.match(dashboardActions, /tokenHash: hashInviteKey\(token\)/);
  assert.match(dashboardActions, /status = 'pending'[\s\S]*expires_at > now\(\)/);
  assert.match(dashboardActions, /ON CONFLICT \(organization_id, auth_user_id\) DO NOTHING/);
  assert.match(projectPage, /eq\(projects\.organizationId, context\.activeWorkspace\.id\)/);
  assert.match(boardPage, /eq\(projects\.id, projectId\)[\s\S]*eq\(projects\.organizationId, context\.activeWorkspace\.id\)/);
  assert.match(membersPage, /Workspace members[\s\S]*Pending invitations/);
  assert.match(invitePage, /normalizeWorkspaceInviteToken[\s\S]*acceptWorkspaceInvitation/);
  assert.doesNotMatch(dashboardShell, />Tutorial<|>Research<|>Decisions<|>Handoff</);
  assert.doesNotMatch(login, /Account access|auth-context|Welcome back/);
});

test("defines public intake, tenancy, access, entitlement, and audit tables", async () => {
  const schema = await source("db/schema.ts");
  const accountUsernameMigration = await source("drizzle/0004_account-username.sql");
  const collaborativeMigration = await source("drizzle/0005_collaborative-foundation.sql");

  for (const table of [
    "user_profiles",
    "organizations",
    "organization_memberships",
    "projects",
    "boards",
    "workspace_invitations",
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
  assert.match(schema, /username: text\("username"\)/);
  assert.match(schema, /uniqueIndex\("user_profiles_username_unique"\)\.on\(table\.username\)/);
  assert.match(accountUsernameMigration, /ADD COLUMN "username" text/);
  assert.match(accountUsernameMigration, /CREATE UNIQUE INDEX "user_profiles_username_unique"/);
  assert.match(collaborativeMigration, /CREATE TABLE "projects"/);
  assert.match(collaborativeMigration, /CREATE TABLE "boards"/);
  assert.match(collaborativeMigration, /CREATE TABLE "workspace_invitations"/);
  assert.match(collaborativeMigration, /workspace_invitations_token_hash_unique/);
  assert.match(collaborativeMigration, /organizations_created_by_unique/);
  assert.doesNotMatch(schema, /revision|variant/);
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
    access(new URL("public/avatar/cirqut-default.png", root)),
    access(new URL("public/icons/angle-left.svg", root)),
    access(new URL("public/icons/angle-right.svg", root)),
    access(new URL("public/icons/settings.svg", root)),
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

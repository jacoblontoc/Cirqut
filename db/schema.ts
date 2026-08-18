import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const membershipRole = pgEnum("membership_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const waitlistStatus = pgEnum("waitlist_status", [
  "pending",
  "reviewing",
  "invited",
  "joined",
  "declined",
]);

export const accessGrantStatus = pgEnum("access_grant_status", [
  "pending",
  "active",
  "revoked",
  "expired",
]);

export const entitlementStatus = pgEnum("entitlement_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
]);

// Managed Better Auth owns users and sessions in the neon_auth schema.
// This table stores only Cirqut-specific profile and authorization metadata.
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  authUserId: text("auth_user_id").notNull(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  persona: text("persona"),
  pcbExperience: text("pcb_experience"),
  pcbTools: jsonb("pcb_tools").$type<string[]>(),
  cirqutGoals: jsonb("cirqut_goals").$type<string[]>(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("user_profiles_auth_user_id_unique").on(table.authUserId),
  index("user_profiles_email_idx").on(table.email),
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  createdByAuthUserId: text("created_by_auth_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organizations_slug_unique").on(table.slug),
]);

export const organizationMemberships = pgTable("organization_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  authUserId: text("auth_user_id").notNull(),
  role: membershipRole("role").notNull().default("member"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("organization_memberships_org_user_unique").on(
    table.organizationId,
    table.authUserId,
  ),
  index("organization_memberships_auth_user_idx").on(table.authUserId),
]);

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  name: text("name"),
  role: text("role"),
  company: text("company"),
  teamSize: text("team_size"),
  useCase: text("use_case"),
  status: waitlistStatus("status").notNull().default("pending"),
  source: text("source").notNull().default("website"),
  productUpdatesConsent: boolean("product_updates_consent").notNull().default(false),
  privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("waitlist_entries_email_unique").on(table.email),
  index("waitlist_entries_status_idx").on(table.status),
]);

// Access grants are an application-level beta gate. Authentication alone does
// not grant access while the private beta is gated.
export const accessGrants = pgTable("access_grants", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  authUserId: text("auth_user_id"),
  inviteKeyHash: text("invite_key_hash"),
  status: accessGrantStatus("status").notNull().default("pending"),
  grantedByAuthUserId: text("granted_by_auth_user_id"),
  // Optional referral attribution. Reward accounting belongs in a future ledger.
  referrerAuthUserId: text("referrer_auth_user_id"),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("access_grants_email_unique").on(table.email),
  uniqueIndex("access_grants_auth_user_id_unique").on(table.authUserId),
  uniqueIndex("access_grants_invite_key_hash_unique").on(table.inviteKeyHash),
  index("access_grants_status_idx").on(table.status),
]);

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull().default("general"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("contact_submissions_status_idx").on(table.status),
  index("contact_submissions_email_idx").on(table.email),
]);

// Billing is not connected yet. This keeps plan enforcement separate from a
// future payment provider so the provider can change without changing access rules.
export const organizationEntitlements = pgTable("organization_entitlements", {
  organizationId: uuid("organization_id")
    .primaryKey()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planCode: text("plan_code").notNull().default("beta"),
  status: entitlementStatus("status").notNull().default("trialing"),
  seatLimit: integer("seat_limit"),
  billingProvider: text("billing_provider"),
  externalCustomerId: text("external_customer_id"),
  currentPeriodEndsAt: timestamp("current_period_ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  actorAuthUserId: text("actor_auth_user_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("audit_events_organization_time_idx").on(table.organizationId, table.occurredAt),
  index("audit_events_actor_idx").on(table.actorAuthUserId),
]);

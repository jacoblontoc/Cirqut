CREATE TYPE "public"."workspace_invitation_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"purpose" text,
	"description" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"created_by_auth_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by_auth_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"token_hash" text NOT NULL,
	"status" "workspace_invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by_auth_user_id" text NOT NULL,
	"accepted_by_auth_user_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boards" ADD CONSTRAINT "boards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boards_project_updated_idx" ON "boards" USING btree ("project_id","updated_at");--> statement-breakpoint
CREATE INDEX "boards_creator_idx" ON "boards" USING btree ("created_by_auth_user_id");--> statement-breakpoint
CREATE INDEX "projects_organization_updated_idx" ON "projects" USING btree ("organization_id","updated_at");--> statement-breakpoint
CREATE INDEX "projects_creator_idx" ON "projects" USING btree ("created_by_auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_token_hash_unique" ON "workspace_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_invitations_org_email_unique" ON "workspace_invitations" USING btree ("organization_id","email");--> statement-breakpoint
CREATE INDEX "workspace_invitations_org_status_idx" ON "workspace_invitations" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "workspace_invitations_email_idx" ON "workspace_invitations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_created_by_unique" ON "organizations" USING btree ("created_by_auth_user_id");
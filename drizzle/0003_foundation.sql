ALTER TABLE "user_profiles" ADD COLUMN "persona" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "pcb_experience" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "pcb_tools" jsonb;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "cirqut_goals" jsonb;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "onboarding_completed_at" timestamp with time zone;
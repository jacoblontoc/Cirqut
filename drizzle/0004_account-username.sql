ALTER TABLE "user_profiles" ADD COLUMN "username" text;--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_username_unique" ON "user_profiles" USING btree ("username");
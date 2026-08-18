ALTER TABLE "access_grants" ADD COLUMN "invite_key_hash" text;--> statement-breakpoint
CREATE UNIQUE INDEX "access_grants_invite_key_hash_unique" ON "access_grants" USING btree ("invite_key_hash");
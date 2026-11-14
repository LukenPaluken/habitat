ALTER TABLE "account" ADD COLUMN "issuer" text;--> statement-breakpoint
-- Backfill rows created before Better Auth 1.7: email + password accounts use the
-- synthetic issuer "local:credential" (OAuth ones "local:oauth:<provider>").
UPDATE "account" SET "issuer" = CASE
  WHEN "provider_id" = 'credential' THEN 'local:credential'
  ELSE 'local:oauth:' || "provider_id"
END;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_account_issuer_account_id" ON "account" USING btree ("issuer","account_id");

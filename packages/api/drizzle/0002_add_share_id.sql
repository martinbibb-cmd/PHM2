-- Add shareId column to visit_sessions table for customer sharing
ALTER TABLE "visit_sessions" ADD COLUMN "share_id" varchar(36);

-- Add unique constraint on share_id
ALTER TABLE "visit_sessions" ADD CONSTRAINT "visit_sessions_share_id_unique" UNIQUE("share_id");

-- Create index for faster lookups by share_id
CREATE INDEX IF NOT EXISTS "visit_sessions_share_id_idx" ON "visit_sessions" ("share_id");

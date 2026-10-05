-- One-time, idempotent creation of the Media table (DB-backed uploads).
-- Run against the real production datasource during build so it targets the
-- exact database the app connects to. Safe to run repeatedly.
CREATE TABLE IF NOT EXISTS "Media" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

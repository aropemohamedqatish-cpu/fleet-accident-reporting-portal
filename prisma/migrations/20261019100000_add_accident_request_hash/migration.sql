ALTER TABLE "Accident" ADD COLUMN "requestHash" TEXT;

UPDATE "Accident"
SET "requestHash" = "idempotencyKey"
WHERE "requestHash" IS NULL;

ALTER TABLE "Accident" ALTER COLUMN "requestHash" SET NOT NULL;

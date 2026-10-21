CREATE TYPE "SecurityEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_RATE_LIMITED');

CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "eventType" "SecurityEventType" NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_email_eventType_createdAt_idx"
ON "SecurityEvent"("email", "eventType", "createdAt");

CREATE INDEX "SecurityEvent_ipAddress_eventType_createdAt_idx"
ON "SecurityEvent"("ipAddress", "eventType", "createdAt");

CREATE INDEX "SecurityEvent_createdAt_idx"
ON "SecurityEvent"("createdAt");

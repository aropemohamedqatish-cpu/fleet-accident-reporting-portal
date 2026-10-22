-- CreateEnum
CREATE TYPE "admin_role" AS ENUM ('AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "security_event_type" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGIN_RATE_LIMITED');

-- CreateEnum
CREATE TYPE "media_type" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "admin_role" NOT NULL DEFAULT 'AGENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT false,
    "session_version" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accident_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "event_type" "security_event_type" NOT NULL,
    "email" TEXT NOT NULL,
    "ip_address" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "governorate" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accidents" (
    "id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "governorate" TEXT,
    "reporter_name" TEXT NOT NULL,
    "reporter_phone" TEXT NOT NULL,
    "location_description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "assigned_to_id" TEXT,

    CONSTRAINT "accidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accident_media" (
    "id" TEXT NOT NULL,
    "accident_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "media_type" "media_type" NOT NULL DEFAULT 'IMAGE',
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accident_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "window_started_at" TIMESTAMPTZ(3) NOT NULL,
    "request_count" INTEGER NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "api_rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_accident_id" ON "audit_logs"("accident_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_security_events_email_event_created" ON "security_events"("email", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "idx_security_events_ip_event_created" ON "security_events"("ip_address", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "idx_security_events_created_at" ON "security_events"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_number_key" ON "vehicles"("plate_number");

-- CreateIndex
CREATE INDEX "idx_vehicles_governorate" ON "vehicles"("governorate");

-- CreateIndex
CREATE UNIQUE INDEX "accidents_idempotency_key_key" ON "accidents"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_accidents_assigned_to_id" ON "accidents"("assigned_to_id");

-- CreateIndex
CREATE INDEX "idx_accidents_created_at" ON "accidents"("created_at");

-- CreateIndex
CREATE INDEX "idx_accidents_status_created_at" ON "accidents"("status", "created_at");

-- CreateIndex
CREATE INDEX "idx_accidents_vehicle_id" ON "accidents"("vehicle_id");

-- CreateIndex
CREATE INDEX "idx_accident_media_accident_id" ON "accident_media"("accident_id");

-- CreateIndex
CREATE INDEX "idx_api_rate_limit_buckets_updated_at" ON "api_rate_limit_buckets"("updated_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_accident_id_fkey" FOREIGN KEY ("accident_id") REFERENCES "accidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accidents" ADD CONSTRAINT "accidents_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accident_media" ADD CONSTRAINT "accident_media_accident_id_fkey" FOREIGN KEY ("accident_id") REFERENCES "accidents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

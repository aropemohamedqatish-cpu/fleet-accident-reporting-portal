CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Accident" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterPhone" TEXT NOT NULL,
    "locationDescription" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Accident_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AccidentMedia" (
    "id" TEXT NOT NULL,
    "accidentId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccidentMedia_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");
CREATE UNIQUE INDEX "Accident_idempotencyKey_key" ON "Accident"("idempotencyKey");

ALTER TABLE "Accident"
ADD CONSTRAINT "Accident_vehicleId_fkey"
FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AccidentMedia"
ADD CONSTRAINT "AccidentMedia_accidentId_fkey"
FOREIGN KEY ("accidentId") REFERENCES "Accident"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Vehicle"
ADD COLUMN "governorate" TEXT;

ALTER TABLE "Accident"
ADD COLUMN "governorate" TEXT;

CREATE INDEX "Vehicle_governorate_idx"
ON "Vehicle"("governorate");

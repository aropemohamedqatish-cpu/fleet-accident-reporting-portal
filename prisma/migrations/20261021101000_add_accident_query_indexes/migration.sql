CREATE INDEX "Accident_createdAt_idx" ON "Accident"("createdAt");
CREATE INDEX "Accident_status_createdAt_idx" ON "Accident"("status", "createdAt");
CREATE INDEX "Accident_vehicleId_idx" ON "Accident"("vehicleId");
CREATE INDEX "AccidentMedia_accidentId_idx" ON "AccidentMedia"("accidentId");

/* Repro: exercises the exact DB write path of app/api/incidents/route.ts
 * Usage: npx tsx scripts/diag-submit.ts
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

async function main() {
  const key = randomUUID();
  const accidentId = randomUUID();
  console.log("key:", key);

  const vehicle = await prisma.vehicle.findFirst({
    where: { plateNumber: "1200001", isActive: true },
    select: { id: true },
  });
  console.log("vehicle:", vehicle);
  if (!vehicle) throw new Error("vehicle 1200001 not found");

  const created = await prisma.$transaction(async (tx) =>
    tx.accident.create({
      data: {
        id: accidentId,
        idempotencyKey: key,
        requestHash: "diag-hash",
        vehicleId: vehicle.id,
        reporterName: "أحمد محمد الخطيب",
        reporterPhone: "0912345678",
        locationDescription: "تشخيص يدوي",
        latitude: null,
        longitude: null,
        notes: "بلاغ تشخيصي تجريبي لحل مشكلة الحفظ",
        media: {
          create: [
            {
              fileUrl: `/uploads/incidents/1200001/${accidentId}/${randomUUID()}.jpg`,
              fileType: "image/jpeg",
              mediaType: "IMAGE",
              fileSize: 1024,
            },
          ],
        },
      },
      select: { id: true },
    })
  );
  console.log("created:", created);

  // cleanup
  await prisma.accidentMedia.deleteMany({ where: { accidentId } });
  await prisma.accident.delete({ where: { id: accidentId } });
  console.log("cleanup done — DB WRITE PATH OK");
}

main()
  .catch((e) => {
    console.error("DIAG SUBMIT FAILED:");
    console.error("name:", (e as Error)?.name);
    console.error("message:", (e as Error)?.message);
    console.error("code:", (e as Record<string, unknown>)?.["code"]);
    console.error("meta:", JSON.stringify((e as Record<string, unknown>)?.["meta"] ?? null));
    console.error("stack:", (e as Error)?.stack);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(process.exitCode || 0);
  });

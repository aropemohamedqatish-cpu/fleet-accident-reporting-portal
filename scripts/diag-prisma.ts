import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("1) prisma.vehicle.findFirst ...");
  const v = await prisma.vehicle.findFirst({
    where: { plateNumber: "1200001", isActive: true },
    select: { id: true },
  });
  console.log("vehicle:", v);

  console.log("2) prisma.accident.findUnique (idempotency probe) ...");
  const a = await prisma.accident.findUnique({
    where: { idempotencyKey: "00000000-0000-4000-8000-000000000000" },
    select: { id: true, requestHash: true },
  });
  console.log("accident probe:", a);

  console.log("ALL PRISMA CHECKS PASSED");
}

main()
  .catch((e) => {
    console.error("PRISMA CHECK FAILED:");
    console.error("name:", (e as Error)?.name);
    console.error("message:", (e as Error)?.message);
    console.error("code:", (e as Record<string, unknown>)?.["code"]);
    console.error("stack:", (e as Error)?.stack);
    console.error("full:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });

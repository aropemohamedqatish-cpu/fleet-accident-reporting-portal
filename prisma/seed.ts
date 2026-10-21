import "dotenv/config";
import { setTimeout as delay } from "node:timers/promises";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import pg from "pg";

const VEHICLE_BATCH_SIZE = 25;
const VEHICLE_BATCH_DELAY_MS = 300;
const DATABASE_MAX_ATTEMPTS = 5;
const DATABASE_RETRY_DELAY_MS = 1_000;
const RETRYABLE_DATABASE_CODES = new Set([
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "53300",
  "57P01",
  "ECONNRESET",
  "ETIMEDOUT",
  "EPIPE",
]);

const connectionString = process.env.DATABASE_URL;
const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD?.trim();
const adminName = process.env.ADMIN_NAME?.trim() || "مدير النظام";

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}
if (!adminEmail || !adminPassword) {
  throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to seed an initial admin user.");
}
if (adminPassword.length < 12 || adminPassword.length > 128) {
  throw new Error("ADMIN_PASSWORD must be between 12 and 128 characters.");
}

const pool = new pg.Pool({
  connectionString,
  max: 1,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
  keepAlive: true,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getDatabaseErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  if ("code" in error && typeof error.code === "string") return error.code;

  if ("meta" in error && typeof error.meta === "object" && error.meta !== null) {
    const meta = error.meta;
    if ("driverAdapterError" in meta && typeof meta.driverAdapterError === "object" && meta.driverAdapterError !== null) {
      const adapterError = meta.driverAdapterError;
      if ("cause" in adapterError && typeof adapterError.cause === "object" && adapterError.cause !== null) {
        const cause = adapterError.cause;
        if ("originalCode" in cause && typeof cause.originalCode === "string") return cause.originalCode;
        if ("code" in cause && typeof cause.code === "string") return cause.code;
      }
    }
  }

  return undefined;
}

async function withDatabaseRetry<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const code = getDatabaseErrorCode(error);
      if (!code || !RETRYABLE_DATABASE_CODES.has(code) || attempt >= DATABASE_MAX_ATTEMPTS) {
        throw error;
      }

      const delayMs = DATABASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `⚠️ تعذّر ${operationName} بسبب انقطاع مؤقت عن قاعدة البيانات (المحاولة ${attempt}/${DATABASE_MAX_ATTEMPTS}). إعادة المحاولة بعد ${delayMs}ms.`,
      );
      await delay(delayMs);
    }
  }
}

async function main() {
  console.log("⏳ بدأت عملية إدخال بيانات الأسطول وحساب الإدارة...");
  await withDatabaseRetry("فحص اتصال قاعدة البيانات", () => prisma.$queryRaw`SELECT 1`);

  const prefixes = ["12", "61"];
  const vehicles = prefixes.flatMap((prefix) =>
    Array.from({ length: 200 }, (_, index) => ({
      plateNumber: `${prefix}${String(index + 1).padStart(5, "0")}`,
      isActive: true,
    })),
  );

  let insertedVehicles = 0;
  for (let offset = 0; offset < vehicles.length; offset += VEHICLE_BATCH_SIZE) {
    const batch = vehicles.slice(offset, offset + VEHICLE_BATCH_SIZE);
    const result = await withDatabaseRetry(
      `إضافة دفعة المركبات ${Math.floor(offset / VEHICLE_BATCH_SIZE) + 1}`,
      () =>
        prisma.vehicle.createMany({
          data: batch,
          skipDuplicates: true,
        }),
    );
    insertedVehicles += result.count;

    if (offset + VEHICLE_BATCH_SIZE < vehicles.length) {
      await delay(VEHICLE_BATCH_DELAY_MS);
    }
  }

  console.log(`✅ تمت إضافة ${insertedVehicles} مركبة جديدة.`);

  const passwordHash = await bcrypt.hash(adminPassword!, 12);
  const admin = await withDatabaseRetry("إعداد حساب المدير", () =>
    prisma.adminUser.upsert({
      where: { email: adminEmail! },
      update: {},
      create: {
        email: adminEmail!,
        passwordHash,
        name: adminName,
        role: "ADMIN",
        mustChangePassword: true,
      },
      select: { id: true },
    }),
  );
  console.log(`✅ تم التأكد من وجود حساب الإدارة (${admin.id}).`);
}

main()
  .catch((e) => {
    console.error("❌ حدث خطأ:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
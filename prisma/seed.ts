import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import pg from "pg";

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

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("⏳ بدأت عملية إدخال بيانات الأسطول وحساب الإدارة...");

  const prefixes = ["12", "61"];
  const vehicles = prefixes.flatMap((prefix) =>
    Array.from({ length: 200 }, (_, index) => ({
      plateNumber: `${prefix}${String(index + 1).padStart(5, "0")}`,
      isActive: true,
    })),
  );

  const result = await prisma.vehicle.createMany({
    data: vehicles,
    skipDuplicates: true,
  });

  console.log(`✅ تمت إضافة ${result.count} مركبة جديدة.`);

  const passwordHash = await bcrypt.hash(adminPassword!, 12);
  const admin = await prisma.adminUser.upsert({
    where: { email: adminEmail! },
    update: {
      passwordHash,
      name: adminName,
      role: "ADMIN",
      isActive: true,
      mustChangePassword: true,
      sessionVersion: { increment: 1 },
    },
    create: {
      email: adminEmail!,
      passwordHash,
      name: adminName,
      role: "ADMIN",
      mustChangePassword: true,
    },
    select: { id: true },
  });
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
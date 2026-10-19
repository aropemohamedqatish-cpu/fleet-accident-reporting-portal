/* Sync admin user from .env into DB (robust, pure pg — avoids Prisma adapter hang).
 * Usage: node scripts/sync-admin.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pg = require("pg");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

(async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  const name = (process.env.ADMIN_NAME || "").trim() || "مدير النظام";
  const jwtBytes = Buffer.from(process.env.JWT_SECRET || "").length;

  console.log("email:", JSON.stringify(email));
  console.log("password length:", password.length);
  console.log("JWT bytes:", jwtBytes);

  if (!email || !password) {
    console.error("MISSING ADMIN_EMAIL/ADMIN_PASSWORD in .env");
    process.exit(1);
  }
  if (password.length < 12 || password.length > 128) {
    console.error("ADMIN_PASSWORD must be 12..128 chars");
    process.exit(1);
  }
  if (jwtBytes < 32) {
    console.error("JWT_SECRET must be >= 32 bytes");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  });
  try {
    const hash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();
    // Upsert by email (case-sensitive exact, matching loginAction exactMatch)
    const { rows } = await pool.query(
      `INSERT INTO "AdminUser" (id, email, "passwordHash", name, role, "createdAt")
       VALUES ($1, $2, $3, $4, 'ADMIN', NOW())
       ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", name = EXCLUDED.name, role = 'ADMIN'
       RETURNING id, email, name, role`,
      [id, email, hash, name]
    );
    console.log("UPSERT OK:", JSON.stringify(rows[0]));

    // Remove stale admin accounts with different email to avoid confusion
    const { rows: others } = await pool.query('SELECT email FROM "AdminUser" WHERE email <> $1', [email]);
    if (others.length > 0) {
      console.log("Other admin accounts still present:", others.map((r) => r.email).join(", "));
      console.log("Keeping them (no auto-delete). Use the email above to log in.");
    }

    // Verify immediately
    const v = await pool.query('SELECT "passwordHash" FROM "AdminUser" WHERE email = $1', [email]);
    const ok = await bcrypt.compare(password, v.rows[0].passwordHash);
    console.log("VERIFY password matches:", ok);
    if (!ok) {
      console.error("VERIFY FAILED");
      process.exit(1);
    }
    console.log("DONE — login with:", email);
  } catch (e) {
    console.error("SYNC ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
  process.exit(process.exitCode || 0);
})();

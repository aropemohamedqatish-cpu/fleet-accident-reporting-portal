/* Diagnostic: list admin users + verify ADMIN_PASSWORD from .env against stored hash.
 * Usage: node scripts/check-admin.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pg = require("pg");
const bcrypt = require("bcryptjs");

(async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();
  console.log("ENV ADMIN_EMAIL:", JSON.stringify(email));
  console.log("ENV ADMIN_PASSWORD length:", password.length);
  console.log("ENV JWT_SECRET bytes:", Buffer.from(process.env.JWT_SECRET || "").length);

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  });
  try {
    const { rows } = await pool.query(
      'SELECT id, email, name, role, "createdAt" FROM "AdminUser" ORDER BY "createdAt" ASC'
    );
    console.log("AdminUser count:", rows.length);
    for (const r of rows) {
      console.log(" -", JSON.stringify({ id: r.id, email: r.email, name: r.name, role: r.role }));
    }
    if (rows.length > 0) {
      const { rows: full } = await pool.query('SELECT email, "passwordHash" FROM "AdminUser"');
      for (const r of full) {
        let ok = false;
        try {
          ok = await bcrypt.compare(password, r.passwordHash);
        } catch (e) {
          console.log("bcrypt compare error for", r.email, e.message);
        }
        console.log(`password matches [${r.email}]:`, ok);
      }
    }
  } catch (e) {
    console.error("DB ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();

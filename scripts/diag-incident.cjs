/* Diagnostic: check Accident/Vehicle tables vs Prisma schema.
 * Usage: node scripts/diag-incident.cjs  -> writes scripts/diag-output.json
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pg = require("pg");

(async () => {
  const out = { startedAt: new Date().toISOString(), checks: {} };
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  });
  try {
    // 1. tables exist?
    const { rows: tables } = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    out.checks.tables = tables.map((r) => r.tablename);

    // 2. columns per table
    for (const t of ["Vehicle", "Accident", "AccidentMedia", "AdminUser"]) {
      try {
        const { rows } = await pool.query(
          "SELECT column_name, data_type FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position",
          [t]
        );
        out.checks["columns_" + t] = rows;
      } catch (e) {
        out.checks["columns_" + t + "_error"] = e.message;
      }
    }

    // 3. vehicle count + sample
    try {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS c FROM "Vehicle"');
      out.checks.vehicleCount = rows[0].c;
      const { rows: s } = await pool.query('SELECT "plateNumber", "isActive" FROM "Vehicle" ORDER BY "plateNumber" LIMIT 5');
      out.checks.vehicleSample = s;
      // check a mid plate from fleet (1200001, 6100200)
      const { rows: lookup } = await pool.query('SELECT "plateNumber", "isActive" FROM "Vehicle" WHERE "plateNumber" IN ($1,$2,$3)',
        ["1200001", "1200002", "6100200"]);
      out.checks.vehicleLookup = lookup;
    } catch (e) {
      out.checks.vehicle_error = e.message;
    }

    // 4. try the exact queries route.ts does (findUnique by idempotencyKey)
    try {
      const { rows } = await pool.query('SELECT id, "idempotencyKey", "requestHash" FROM "Accident" LIMIT 1');
      out.checks.accident_idempotency_probe = "OK rows=" + rows.length;
    } catch (e) {
      out.checks.accident_idempotency_probe = "FAIL: " + e.message;
    }

    // 5. try AccidentMedia mediaType column
    try {
      const { rows } = await pool.query('SELECT "mediaType" FROM "AccidentMedia" LIMIT 1');
      out.checks.media_mediatype_probe = "OK rows=" + rows.length;
    } catch (e) {
      out.checks.media_mediatype_probe = "FAIL: " + e.message;
    }

    // 6. uploads dir writable?
    try {
      const dir = path.join(__dirname, "..", "public", "uploads", "incidents");
      fs.mkdirSync(dir, { recursive: true });
      const probe = path.join(dir, ".write-test");
      fs.writeFileSync(probe, "ok");
      fs.unlinkSync(probe);
      out.checks.uploadsWritable = true;
    } catch (e) {
      out.checks.uploadsWritable = "FAIL: " + e.message;
    }

    out.ok = true;
  } catch (e) {
    out.ok = false;
    out.fatal = e.message + "\n" + e.stack;
  } finally {
    await pool.end().catch(() => {});
    const p = path.join(__dirname, "diag-output.json");
    fs.writeFileSync(p, JSON.stringify(out, null, 2), "utf8");
    console.log("wrote " + p);
  }
})();

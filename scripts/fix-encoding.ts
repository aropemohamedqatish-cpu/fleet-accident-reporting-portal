/* Fix DB encoding: recreate fleet_db as UTF8 (data is reseedable, accidents=0).
 * Steps: terminate connections, drop, create with UTF8 from template0, push schema, reseed.
 * Usage: npx tsx scripts/fix-encoding.ts
 */
import "dotenv/config";
import pg from "pg";

const adminDbUrl = (process.env.DATABASE_URL || "").replace(/\/fleet_db(\?|$)/, "/postgres$1");

async function main() {
  console.log("admin url db:", adminDbUrl.replace(/:[^:@/]+@/, ":****@"));
  const admin = new pg.Pool({ connectionString: adminDbUrl });

  // show available UTF8-compatible collations (windows)
  const colls = await admin.query(
    "SELECT collname, collencoding FROM pg_collation WHERE collencoding IN (6, -1) ORDER BY collname LIMIT 40"
  );
  console.log("candidate collations:", colls.rows.map((r) => r.collname).slice(0, 40));

  // terminate connections to fleet_db
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='fleet_db' AND pid <> pg_backend_pid()"
  );
  console.log("terminated backends");

  await admin.query("DROP DATABASE IF EXISTS fleet_db");
  console.log("dropped fleet_db");

  // Try creation candidates in order
  const candidates = [
    "CREATE DATABASE fleet_db WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'",
    "CREATE DATABASE fleet_db WITH ENCODING 'UTF8' TEMPLATE template0",
  ];
  let created = false;
  for (const sql of candidates) {
    try {
      console.log("trying:", sql);
      await admin.query(sql);
      created = true;
      console.log("CREATED OK");
      break;
    } catch (e) {
      console.error("create failed:", (e as Error).message);
    }
  }
  if (!created) throw new Error("could not create UTF8 database");
  const check = await admin.query(
    "SELECT datname, pg_encoding_to_char(encoding) AS enc FROM pg_database WHERE datname='fleet_db'"
  );
  console.log("new db:", check.rows);
  await admin.end();
  process.exit(0);
}

main().catch((e) => {
  console.error("FIX FAILED:", e);
  process.exit(1);
});

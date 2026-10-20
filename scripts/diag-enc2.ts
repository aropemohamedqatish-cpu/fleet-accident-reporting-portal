/* Check DB encoding v2 - no Accident dependency */
import "dotenv/config";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  const a = await pool.query("SHOW server_encoding");
  console.log("server_encoding:", a.rows[0]);
  const c = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  console.log("tables:", c.rows.map((r) => r.tablename));
  await pool.end();
  process.exit(0);
}
main().catch(async (e) => { console.error("ERR:", e.message); await pool.end(); process.exit(1); });

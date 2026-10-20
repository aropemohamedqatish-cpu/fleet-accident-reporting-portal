/* Check DB encoding */
import "dotenv/config";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  const a = await pool.query("SHOW server_encoding");
  const b = await pool.query("SHOW client_encoding");
  const c = await pool.query("SELECT datname, pg_encoding_to_char(encoding) AS enc, datcollate, datctype FROM pg_database WHERE datname IN ('fleet_db','postgres')");
  console.log("server_encoding:", a.rows);
  console.log("client_encoding:", b.rows);
  console.log("databases:", c.rows);
  const d = await pool.query('SELECT COUNT(*)::int AS c FROM "Accident"');
  console.log("accident count:", d.rows);
  await pool.end();
  process.exit(0);
}
main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1); });

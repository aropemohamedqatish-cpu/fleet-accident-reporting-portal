/* End-to-end login logic test: mirrors app/login/actions.ts + JWT sign/verify.
 * Usage: node scripts/test-login.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const pg = require("pg");
const bcrypt = require("bcryptjs");

(async () => {
  let failures = 0;
  const ok = (name, cond) => {
    console.log((cond ? "PASS" : "FAIL") + " - " + name);
    if (!cond) failures++;
  };

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD || "").trim();

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  });

  try {
    // 1. Same lookup as loginAction (exact match)
    const { rows } = await pool.query(
      'SELECT id, email, name, "passwordHash", role FROM "AdminUser" WHERE email = $1',
      [email]
    );
    ok("admin user found by exact email", rows.length === 1);
    const user = rows[0];

    // 2. Same bcrypt.compare as loginAction
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    ok("bcrypt.compare(password, passwordHash) === true", passwordMatches === true);

    // 3. JWT secret length check (same rule as lib/session-token.ts)
    const jwtBytes = Buffer.from(process.env.JWT_SECRET || "").length;
    ok("JWT_SECRET >= 32 bytes (got " + jwtBytes + ")", jwtBytes >= 32);

    // 4. JWT sign + verify round-trip (jose, same as app)
    const { SignJWT, jwtVerify } = await import("jose");
    const key = new TextEncoder().encode(process.env.JWT_SECRET);
    const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuer("arope-fleet-portal")
      .setAudience("arope-claims-dashboard")
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(key);
    ok("session JWT signs without error", typeof token === "string" && token.length > 50);
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: "arope-fleet-portal",
      audience: "arope-claims-dashboard",
    });
    ok("session JWT verifies (login would create session)", payload.sub === user.id);

    console.log(failures === 0 ? "ALL TESTS PASSED ✔" : `${failures} TEST(S) FAILED ✘`);
    process.exitCode = failures === 0 ? 0 : 1;
  } catch (e) {
    console.error("TEST ERROR:", e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
  process.exit(process.exitCode || 0);
})();

import pg from "pg";
import { loadBackendEnvironment } from "./loadEnvironment.js";

loadBackendEnvironment();

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL?.trim();
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
const localDatabaseHosts = new Set(["localhost", "::1"]);

if (isProduction) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be configured for the production database.");
  }

  let databaseHost;
  try {
    const parsedDatabaseUrl = new URL(databaseUrl);
    if (!["postgres:", "postgresql:"].includes(parsedDatabaseUrl.protocol)) {
      throw new Error("Unsupported database URL scheme.");
    }
    databaseHost = parsedDatabaseUrl.hostname
      .replace(/^\[|\]$/g, "")
      .replace(/\.$/, "")
      .toLowerCase();
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL in production.");
  }

  if (
    localDatabaseHosts.has(databaseHost) ||
    databaseHost.endsWith(".localhost") ||
    databaseHost.startsWith("127.")
  ) {
    throw new Error("DATABASE_URL must point to a remote database in production, not localhost.");
  }
}

const dbSsl = process.env.DB_SSL?.toLowerCase();
if (dbSsl !== undefined && dbSsl !== "true" && dbSsl !== "false") {
  throw new Error("DB_SSL must be set to either true or false.");
}

pg.types.setTypeParser(1114, (str) => {
  return str || null;
});

const poolMax = parseInt(process.env.DB_POOL_MAX || "80", 10);
const poolMin = parseInt(process.env.DB_POOL_MIN || "5", 10);
const poolIdleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || "120000", 10);
const poolConnectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || "20000", 10);

const poolConfig = databaseUrl
  ? {
      connectionString: databaseUrl,
      ...(dbSsl === undefined ? {} : {
        ssl: dbSsl === "true" ? { rejectUnauthorized: false } : false
      }),
      max: poolMax,
      min: poolMin,
      idleTimeoutMillis: poolIdleTimeout,
      connectionTimeoutMillis: poolConnectionTimeout,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "shnoor_parking",
      ...(dbSsl === "true" ? { ssl: { rejectUnauthorized: false } } : {}),
      max: poolMax,
      min: poolMin,
      idleTimeoutMillis: poolIdleTimeout,
      connectionTimeoutMillis: poolConnectionTimeout,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };

console.log("Database connection config:", {
  host: poolConfig.host || "from DATABASE_URL",
  port: poolConfig.port || "from DATABASE_URL",
  database: poolConfig.database || "from DATABASE_URL"
});
   
const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  const isIgnorableIdleError =
    err.code === "ECONNRESET" ||
    err.code === "EPIPE" ||
    (err.message && (
      err.message.includes("ECONNRESET") ||
      err.message.includes("Connection terminated unexpectedly") ||
      err.message.includes("terminating connection") ||
      err.message.includes("socket closed")
    ));
  if (!isIgnorableIdleError) {
    console.error("Postgres pool error:", err.message);
  }
});


setInterval(async () => {
  try {
    await pool.query("SELECT 1");
  } catch (err) {
   
  }
}, 25000).unref();

export default pool;

import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const { Pool } = pg;

pg.types.setTypeParser(1114, (str) => {
  return str || null;
});

const poolMax = parseInt(process.env.DB_POOL_MAX || "80", 10);
const poolMin = parseInt(process.env.DB_POOL_MIN || "5", 10);
const poolIdleTimeout = parseInt(process.env.DB_IDLE_TIMEOUT || "120000", 10);
const poolConnectionTimeout = parseInt(process.env.DB_CONNECTION_TIMEOUT || "20000", 10);

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
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
      max: poolMax,
      min: poolMin,
      idleTimeoutMillis: poolIdleTimeout,
      connectionTimeoutMillis: poolConnectionTimeout,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    };

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

// Lightweight background heartbeat to prevent cloud database (Neon/AWS) idle connection drops
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
  } catch (err) {
    // Ignore transient background keepalive errors
  }
}, 25000).unref();

export default pool;

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

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    }
  : {
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "shnoor_parking",
      max: 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
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

export default pool;

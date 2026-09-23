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
  return str ? new Date(str + "Z").toISOString() : null;
});

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      idleTimeoutMillis: 30000
    })
  : new Pool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "shnoor_parking",
      idleTimeoutMillis: 30000
    });

pool.on("error", (err) => {
  console.error("Postgres pool idle client error:", err.message);
});

export default pool;

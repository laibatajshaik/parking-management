import pg from "pg";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const dbName = process.env.DB_NAME || "shnoor_parking";
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres"
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }

  const dbClient = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: dbName
  });

  try {
    await dbClient.connect();

    const sqlFile = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    await dbClient.query(sqlFile);

    const adminCheck = await dbClient.query("SELECT * FROM users WHERE email = $1", ["admin@shnoor.com"]);
    if (adminCheck.rowCount === 0) {
      const hashedPw = await bcrypt.hash("admin", 10);
      await dbClient.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["Admin", "admin@shnoor.com", hashedPw, "admin"]
      );
    }

    const staffCheck = await dbClient.query("SELECT * FROM users WHERE email = $1", ["staff@shnoor.com"]);
    if (staffCheck.rowCount === 0) {
      const hashedPw = await bcrypt.hash("staff", 10);
      await dbClient.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["Parking Staff", "staff@shnoor.com", hashedPw, "staff"]
      );
    }

    const customerCheck = await dbClient.query("SELECT * FROM users WHERE email = $1", ["customer@shnoor.com"]);
    if (customerCheck.rowCount === 0) {
      const hashedPw = await bcrypt.hash("customer", 10);
      await dbClient.query(
        "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
        ["Customer", "customer@shnoor.com", hashedPw, "customer"]
      );
    }

    console.log("Database initialized successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await dbClient.end();
  }
}

init();

import pool from "./db.js";
import bcrypt from "bcryptjs";

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '+91 98765 43210';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
      UPDATE users SET status = 'Active' WHERE status IS NULL OR status = '';
      UPDATE users SET phone = '+91 98765 43210' WHERE phone IS NULL OR phone = '';
    `);

    const adminPass = await bcrypt.hash("admin", 10);
    const staffPass = await bcrypt.hash("staff", 10);
    const customerPass = await bcrypt.hash("customer", 10);

    await pool.query(
      "UPDATE users SET name = 'Taj', role = 'admin', password = $1, status = 'Active' WHERE email = 'admin@shnoor.com'",
      [adminPass]
    );
    await pool.query(
      "UPDATE users SET name = 'Laiba Taj', role = 'staff', password = $1, status = 'Active' WHERE email = 'staff@shnoor.com'",
      [staffPass]
    );
    await pool.query(
      "UPDATE users SET name = 'Laiba', role = 'customer', password = $1, status = 'Active' WHERE email = 'customer@shnoor.com'",
      [customerPass]
    );

    await pool.query(`
      INSERT INTO users (name, email, password, phone, role, status, created_at)
      VALUES ('Taj', 'admin@shnoor.com', $1, '+91 98765 43212', 'admin', 'Active', '2026-04-01 08:00:00')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, status = 'Active'
    `, [adminPass]);

    await pool.query(`
      INSERT INTO users (name, email, password, phone, role, status, created_at)
      VALUES ('Laiba Taj', 'staff@shnoor.com', $1, '+91 98765 43211', 'staff', 'Active', '2026-05-14 11:20:00')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, status = 'Active'
    `, [staffPass]);

    await pool.query(`
      INSERT INTO users (name, email, password, phone, role, status, created_at)
      VALUES ('Laiba', 'customer@shnoor.com', $1, '+91 98765 43210', 'customer', 'Active', '2026-05-10 10:30:00')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, status = 'Active'
    `, [customerPass]);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parking_slots (
        id SERIAL PRIMARY KEY,
        slot_number VARCHAR(20) UNIQUE NOT NULL,
        zone VARCHAR(50) NOT NULL,
        slot_type VARCHAR(50) DEFAULT 'Standard',
        status VARCHAR(50) DEFAULT 'available',
        is_available BOOLEAN DEFAULT true,
        hourly_rate NUMERIC(10, 2) DEFAULT 50.00
      );
      ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
      ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10, 2) DEFAULT 50.00;
      ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true;
    `);

    await pool.query("TRUNCATE TABLE parking_slots RESTART IDENTITY;");

    const initialSlots = [
      ['A-01', 'Zone A', 'Standard', 'available', true, 50.00],
      ['A-02', 'Zone A', 'Standard', 'occupied', false, 50.00],
      ['A-03', 'Zone A', 'Standard', 'reserved', false, 50.00],
      ['A-04', 'Zone A', 'Standard', 'occupied', false, 50.00],
      ['A-05', 'Zone A', 'Standard', 'available', true, 50.00],
      ['A-06', 'Zone A', 'Standard', 'reserved', false, 50.00],

      ['B-01', 'Zone B', 'Standard', 'occupied', false, 50.00],
      ['B-02', 'Zone B', 'Standard', 'available', true, 50.00],
      ['B-03', 'Zone B', 'Standard', 'available', true, 50.00],
      ['B-04', 'Zone B', 'Standard', 'occupied', false, 50.00],
      ['B-05', 'Zone B', 'Standard', 'reserved', false, 50.00],
      ['B-06', 'Zone B', 'Standard', 'available', true, 50.00],

      ['C-01', 'Zone C', 'VIP / EV', 'available', true, 80.00],
      ['C-02', 'Zone C', 'VIP / EV', 'reserved', false, 80.00],
      ['C-03', 'Zone C', 'VIP / EV', 'occupied', false, 80.00],
      ['C-04', 'Zone C', 'VIP / EV', 'available', true, 80.00],
      ['C-05', 'Zone C', 'VIP / EV', 'occupied', false, 80.00],
      ['C-06', 'Zone C', 'VIP / EV', 'available', true, 80.00],

      ['D-01', 'Zone D', 'Bike', 'occupied', false, 25.00],
      ['D-02', 'Zone D', 'Bike', 'available', true, 25.00],
      ['D-03', 'Zone D', 'Bike', 'reserved', false, 25.00],
      ['D-04', 'Zone D', 'Bike', 'occupied', false, 25.00],
      ['D-05', 'Zone D', 'Bike', 'available', true, 25.00],
      ['D-06', 'Zone D', 'Bike', 'available', true, 25.00],
    ];

    for (const slot of initialSlots) {
      await pool.query(
        "INSERT INTO parking_slots (slot_number, zone, slot_type, status, is_available, hourly_rate) VALUES ($1, $2, $3, $4, $5, $6)",
        slot
      );
    }

    console.log("Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrate();

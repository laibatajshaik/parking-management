import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import pool from "./db.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const initDbSchema = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(50) DEFAULT '+91 98765 43210',
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '+91 98765 43210';
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
    `);

    const adminPass = await bcrypt.hash("admin", 10);
    const staffPass = await bcrypt.hash("staff", 10);
    const customerPass = await bcrypt.hash("customer", 10);

    await pool.query(`
      INSERT INTO users (name, email, password, phone, role, status, created_at)
      VALUES 
        ('Taj', 'admin@shnoor.com', $1, '+91 98765 43212', 'admin', 'Active', '2026-04-01 08:00:00'),
        ('Laiba Taj', 'staff@shnoor.com', $2, '+91 98765 43211', 'staff', 'Active', '2026-05-14 11:20:00'),
        ('Laiba', 'customer@shnoor.com', $3, '+91 98765 43210', 'customer', 'Active', '2026-05-10 10:30:00')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role, status = EXCLUDED.status;
    `, [adminPass, staffPass, customerPass]);

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
    `);

    const slotsCountRes = await pool.query("SELECT COUNT(*) FROM parking_slots");
    if (parseInt(slotsCountRes.rows[0].count) < 24) {
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
          "INSERT INTO parking_slots (slot_number, zone, slot_type, status, is_available, hourly_rate) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (slot_number) DO NOTHING",
          slot
        );
      }
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        model VARCHAR(100) DEFAULT 'Standard',
        owner_name VARCHAR(100) NOT NULL,
        owner_email VARCHAR(150) NOT NULL,
        owner_phone VARCHAR(50) DEFAULT '+91 98765 43210',
        status VARCHAR(50) DEFAULT 'Parked',
        current_slot VARCHAR(20) DEFAULT 'A-02',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const vehCountRes = await pool.query("SELECT COUNT(*) FROM vehicles");
    if (parseInt(vehCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot, created_at)
        VALUES
          ('KA01 AB 1234', 'Car', 'Hyundai Creta', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'Parked', 'A-02', '2026-05-10 10:30:00'),
          ('KA02 CD 5678', 'SUV', 'Tata Harrier', 'Laiba Taj', 'staff@shnoor.com', '+91 98765 43211', 'Parked', 'B-01', '2026-05-12 14:15:00'),
          ('KA03 EF 9012', 'EV', 'Tata Nexon EV', 'Taj', 'admin@shnoor.com', '+91 98765 43212', 'Checked Out', 'C-03', '2026-04-18 09:00:00'),
          ('KA04 GH 3456', 'Bike', 'Royal Enfield Hunter 350', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'Parked', 'D-01', '2026-05-15 11:20:00'),
          ('KA05 IJ 7890', 'Car', 'Honda City', 'Laiba Taj', 'staff@shnoor.com', '+91 98765 43211', 'Parked', 'A-04', '2026-05-20 16:45:00'),
          ('KA06 KL 2345', 'Bike', 'Yamaha MT-15', 'Taj', 'admin@shnoor.com', '+91 98765 43212', 'Parked', 'D-04', '2026-05-22 08:30:00')
        ON CONFLICT (vehicle_number) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_history (
        id SERIAL PRIMARY KEY,
        vehicle_number VARCHAR(50) NOT NULL,
        slot_number VARCHAR(20) NOT NULL,
        entry_time TIMESTAMP NOT NULL,
        exit_time TIMESTAMP,
        duration VARCHAR(50),
        fee VARCHAR(50),
        status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const histCountRes = await pool.query("SELECT COUNT(*) FROM vehicle_history");
    if (parseInt(histCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, exit_time, duration, fee, status)
        VALUES
          ('KA01 AB 1234', 'A-02', '2026-05-27 08:30:00', NULL, 'Ongoing (3h 30m)', '₹150.00', 'Parked'),
          ('KA01 AB 1234', 'A-05', '2026-05-25 10:00:00', '2026-05-25 13:00:00', '3h 00m', '₹150.00', 'Completed'),
          ('KA01 AB 1234', 'B-02', '2026-05-22 14:00:00', '2026-05-22 16:30:00', '2h 30m', '₹125.00', 'Completed'),
          ('KA02 CD 5678', 'B-01', '2026-05-27 09:15:00', NULL, 'Ongoing (2h 45m)', '₹100.00', 'Parked'),
          ('KA02 CD 5678', 'B-04', '2026-05-24 11:30:00', '2026-05-24 15:30:00', '4h 00m', '₹200.00', 'Completed'),
          ('KA03 EF 9012', 'C-03', '2026-05-26 07:00:00', '2026-05-26 12:00:00', '5h 00m', '₹300.00', 'Completed'),
          ('KA03 EF 9012', 'C-01', '2026-05-23 09:00:00', '2026-05-23 11:00:00', '2h 00m', '₹160.00', 'Completed'),
          ('KA04 GH 3456', 'D-01', '2026-05-27 08:00:00', NULL, 'Ongoing (4h 00m)', '₹100.00', 'Parked'),
          ('KA04 GH 3456', 'D-02', '2026-05-26 15:00:00', '2026-05-26 18:00:00', '3h 00m', '₹75.00', 'Completed'),
          ('KA05 IJ 7890', 'A-04', '2026-05-27 10:00:00', NULL, 'Ongoing (2h 00m)', '₹100.00', 'Parked'),
          ('KA06 KL 2345', 'D-04', '2026-05-27 09:30:00', NULL, 'Ongoing (2h 30m)', '₹62.50', 'Parked');
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error("Schema init error:", err);
  }
};

initDbSchema();

app.post("/api/signup", async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  let dbRole = "customer";
  if (role === "admin" || role === "staff" || role === "customer") {
    dbRole = role;
  }

  try {
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userPhone = phone || "+91 98765 43210";
    await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status) VALUES ($1, $2, $3, $4, $5, 'Active')",
      [name, email, hashedPassword, userPhone, dbRole]
    );

    res.status(201).json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "+91 98765 43210",
        role: user.role,
        status: user.status || "Active"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/api/admin/dashboard-overview", async (req, res) => {
  try {
    const slotsRes = await pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC");
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");

    const slots = slotsRes.rows;
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === "available" || (s.is_available && s.status !== "reserved")).length;
    const occupiedSlots = slots.filter(s => s.status === "occupied" || (!s.is_available && s.status !== "reserved")).length;
    const reservedSlots = slots.filter(s => s.status === "reserved").length;

    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        occupancyRate,
        todayRevenue: 1345,
        totalUsers: parseInt(usersRes.rows[0]?.count || 0)
      },
      slots,
      activeSessions: [
        { user_name: "Laiba", vehicle_number: "KA01 AB 1234", status: "Active" },
        { user_name: "Laiba Taj", vehicle_number: "KA02 CD 5678", status: "Active" },
        { user_name: "Taj", vehicle_number: "KA03 EF 9012", status: "Completed" },
        { user_name: "Laiba", vehicle_number: "KA04 GH 3456", status: "Active" },
      ]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching dashboard overview data" });
  }
});

app.get("/api/parking-slots", async (req, res) => {
  try {
    const slotsResult = await pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC");
    res.json({ success: true, slots: slotsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching parking slots" });
  }
});

app.post("/api/admin/slots", async (req, res) => {
  const { slot_number, zone, slot_type, hourly_rate, status } = req.body;

  if (!slot_number || !zone) {
    return res.status(400).json({ error: "Slot number and zone are required" });
  }

  const slotType = slot_type || "Standard";
  const rate = parseFloat(hourly_rate) || 50.00;
  const slotStatus = status || "available";
  const isAvailable = slotStatus === "available";

  try {
    const existCheck = await pool.query("SELECT * FROM parking_slots WHERE slot_number = $1", [slot_number]);
    if (existCheck.rowCount > 0) {
      return res.status(400).json({ error: `Slot ${slot_number} already exists` });
    }

    const insertRes = await pool.query(
      "INSERT INTO parking_slots (slot_number, zone, slot_type, hourly_rate, status, is_available) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [slot_number, zone, slotType, rate, slotStatus, isAvailable]
    );

    res.status(201).json({ success: true, slot: insertRes.rows[0], message: "Parking slot created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating parking slot" });
  }
});

app.put("/api/admin/slots/:id", async (req, res) => {
  const { id } = req.params;
  const { slot_number, zone, slot_type, hourly_rate, status } = req.body;

  if (!slot_number || !zone) {
    return res.status(400).json({ error: "Slot number and zone are required" });
  }

  const slotType = slot_type || "Standard";
  const rate = parseFloat(hourly_rate) || 50.00;
  const slotStatus = status || "available";
  const isAvailable = slotStatus === "available";

  try {
    const updateRes = await pool.query(
      "UPDATE parking_slots SET slot_number = $1, zone = $2, slot_type = $3, hourly_rate = $4, status = $5, is_available = $6 WHERE id = $7 RETURNING *",
      [slot_number, zone, slotType, rate, slotStatus, isAvailable, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Parking slot not found" });
    }

    res.json({ success: true, slot: updateRes.rows[0], message: "Parking slot updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: `Slot number ${slot_number} is already in use` });
    }
    res.status(500).json({ error: "Server error updating parking slot" });
  }
});

app.delete("/api/admin/slots/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await pool.query("DELETE FROM parking_slots WHERE id = $1 RETURNING slot_number", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Parking slot not found" });
    }
    res.json({ success: true, message: `Slot ${delRes.rows[0].slot_number} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting parking slot" });
  }
});

app.post("/api/parking-slots/:slotNumber/status", async (req, res) => {
  const { slotNumber } = req.params;
  const { status } = req.body;

  if (!status || !["available", "occupied", "reserved"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'available', 'occupied', or 'reserved'" });
  }

  const isAvailable = status === "available";

  try {
    const slotResult = await pool.query(
      "UPDATE parking_slots SET status = $1, is_available = $2 WHERE slot_number = $3 RETURNING *",
      [status, isAvailable, slotNumber]
    );

    if (slotResult.rowCount === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json({ success: true, slot: slotResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating slot status" });
  }
});

app.post("/api/parking-slots/:slotNumber/toggle", async (req, res) => {
  const { slotNumber } = req.params;
  try {
    const slotResult = await pool.query("SELECT is_available, status FROM parking_slots WHERE slot_number = $1", [slotNumber]);
    if (slotResult.rowCount === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }
    const current = slotResult.rows[0].status;
    let newStatus = "available";
    let isAvailable = true;

    if (current === "available") {
      newStatus = "occupied";
      isAvailable = false;
    } else if (current === "occupied") {
      newStatus = "reserved";
      isAvailable = false;
    } else {
      newStatus = "available";
      isAvailable = true;
    }

    await pool.query("UPDATE parking_slots SET is_available = $1, status = $2 WHERE slot_number = $3", [isAvailable, newStatus, slotNumber]);
    res.json({ success: true, is_available: isAvailable, status: newStatus });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error toggling slot" });
  }
});

app.get("/api/admin/vehicles", async (req, res) => {
  try {
    const vehiclesResult = await pool.query("SELECT * FROM vehicles ORDER BY id ASC");
    res.json({ success: true, vehicles: vehiclesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching vehicles" });
  }
});

app.get("/api/admin/vehicles/:vehicleNumber/history", async (req, res) => {
  const { vehicleNumber } = req.params;
  try {
    const histResult = await pool.query(
      "SELECT * FROM vehicle_history WHERE vehicle_number = $1 ORDER BY id DESC",
      [vehicleNumber]
    );
    res.json({ success: true, history: histResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching vehicle history" });
  }
});

app.post("/api/admin/vehicles", async (req, res) => {
  const { vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot } = req.body;

  if (!vehicle_number || !vehicle_type || !owner_name || !owner_email) {
    return res.status(400).json({ error: "Vehicle number, type, owner name, and email are required" });
  }

  const vModel = model || "Standard";
  const vPhone = owner_phone || "+91 98765 43210";
  const vStatus = status || "Parked";
  const vSlot = current_slot || "A-01";

  try {
    const existCheck = await pool.query("SELECT * FROM vehicles WHERE vehicle_number = $1", [vehicle_number]);
    if (existCheck.rowCount > 0) {
      return res.status(400).json({ error: `Vehicle ${vehicle_number} is already registered` });
    }

    const insertRes = await pool.query(
      "INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [vehicle_number.toUpperCase(), vehicle_type, vModel, owner_name, owner_email, vPhone, vStatus, vSlot]
    );

    await pool.query(
      "INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, duration, fee, status) VALUES ($1, $2, CURRENT_TIMESTAMP, 'Ongoing', '₹50.00', $3)",
      [vehicle_number.toUpperCase(), vSlot, vStatus]
    );

    res.status(201).json({ success: true, vehicle: insertRes.rows[0], message: "Vehicle registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error registering vehicle" });
  }
});

app.put("/api/admin/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  const { vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot } = req.body;

  if (!vehicle_number || !vehicle_type || !owner_name || !owner_email) {
    return res.status(400).json({ error: "Vehicle number, type, owner name, and email are required" });
  }

  const vModel = model || "Standard";
  const vPhone = owner_phone || "+91 98765 43210";
  const vStatus = status || "Parked";
  const vSlot = current_slot || "A-01";

  try {
    const updateRes = await pool.query(
      "UPDATE vehicles SET vehicle_number = $1, vehicle_type = $2, model = $3, owner_name = $4, owner_email = $5, owner_phone = $6, status = $7, current_slot = $8 WHERE id = $9 RETURNING *",
      [vehicle_number.toUpperCase(), vehicle_type, vModel, owner_name, owner_email, vPhone, vStatus, vSlot, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json({ success: true, vehicle: updateRes.rows[0], message: "Vehicle updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: `Vehicle number ${vehicle_number} is already in use` });
    }
    res.status(500).json({ error: "Server error updating vehicle" });
  }
});

app.delete("/api/admin/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await pool.query("DELETE FROM vehicles WHERE id = $1 RETURNING vehicle_number", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    await pool.query("DELETE FROM vehicle_history WHERE vehicle_number = $1", [delRes.rows[0].vehicle_number]);
    res.json({ success: true, message: `Vehicle ${delRes.rows[0].vehicle_number} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting vehicle" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const usersResult = await pool.query("SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    res.json({ success: true, users: usersResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching registered users" });
  }
});

app.post("/api/admin/users", async (req, res) => {
  const { name, email, password, phone, role, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const pass = password || "password123";
  const userPhone = phone || "+91 98765 43210";
  const userRole = role || "customer";
  const userStatus = status || "Active";

  try {
    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const insertResult = await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, role, status, created_at",
      [name, email, hashedPassword, userPhone, userRole, userStatus]
    );

    res.status(201).json({ success: true, user: insertResult.rows[0], message: "User added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating user" });
  }
});

app.get("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const userResult = await pool.query("SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = $1", [id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: userResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching user details" });
  }
});

app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, role, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const userPhone = phone || "+91 98765 43210";
  const userRole = role || "customer";
  const userStatus = status || "Active";

  try {
    const updateResult = await pool.query(
      "UPDATE users SET name = $1, email = $2, phone = $3, role = $4, status = $5 WHERE id = $6 RETURNING id, name, email, phone, role, status, created_at",
      [name, email, userPhone, userRole, userStatus, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: updateResult.rows[0], message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email is already in use by another user" });
    }
    res.status(500).json({ error: "Server error updating user" });
  }
});

app.put("/api/admin/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || (status !== "Active" && status !== "Inactive")) {
    return res.status(400).json({ error: "Valid status ('Active' or 'Inactive') is required" });
  }

  try {
    const updateResult = await pool.query(
      "UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, phone, role, status, created_at",
      [status, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: updateResult.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating user status" });
  }
});

app.delete("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteResult = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id, name",
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: `User ${deleteResult.rows[0].name} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting user" });
  }
});

app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    await pool.query(
      "INSERT INTO contact_messages (name, email, message) VALUES ($1, $2, $3)",
      [name, email, message]
    );
    res.status(201).json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error saving message" });
  }
});

app.get("/api/admin/messages", async (req, res) => {
  try {
    const messagesResult = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json({ success: true, messages: messagesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching messages" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

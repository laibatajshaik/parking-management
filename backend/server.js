import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import notificationRoutes from "./modules/notifications/notificationRoutes.js";
import {
  notifyUser,
  notifyUsers,
  notifyAdmins,
  notifyStaff,
  notifyStaffAndAdmins,
  notifyActiveCustomers,
  notifyCustomersAndStaff,
  notifyAllActiveUsers,
  getActiveAdminEmails,
  getActiveCustomerEmails
} from "./modules/notifications/notificationService.js";
import {
  sendEmail,
  sendEmails,
  sendAccountCreatedEmail,
  sendNewParkingPlanEmail,
  sendPricingPlanUpdatedEmail,
  sendReservationConfirmedEmail,
  sendReservationValidatedEmail,
  sendReservationCancelledEmail,
  sendPaymentSuccessfulEmail,
  sendPaymentFailedEmail,
  sendVehicleEntryEmail,
  sendParkingSessionStartedEmail,
  sendParkingSessionCompletedEmail,
  sendDigitalReceiptEmail,
  sendPremiumActivatedEmail,
  sendNewUserAdminEmail,
  sendAdminReservationUpdateEmail,
  sendAdminPaymentUpdateEmail,
  sendAdminSystemUpdateEmail
} from "./modules/email/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Shnoor Parking Backend is running");
});

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
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(50) UNIQUE NOT NULL,
        vehicle_number VARCHAR(50) NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(150),
        customer_phone VARCHAR(50),
        slot_number VARCHAR(20) NOT NULL,
        entry_time TIMESTAMP NOT NULL,
        exit_time TIMESTAMP NOT NULL,
        duration VARCHAR(50) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'Completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS slot_number VARCHAR(20);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS method VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Completed';
      ALTER TABLE payments ALTER COLUMN method DROP NOT NULL;
    `);

    const payCountRes = await pool.query("SELECT COUNT(*) FROM payments WHERE transaction_id IS NOT NULL");
    if (parseInt(payCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO payments (transaction_id, vehicle_number, customer_name, customer_email, customer_phone, slot_number, entry_time, exit_time, duration, amount, payment_method, method, payment_status, created_at)
        VALUES
          ('TXN-8041', 'KA03 EF 9012', 'Taj', 'admin@shnoor.com', '+91 98765 43212', 'C-03', CURRENT_TIMESTAMP - INTERVAL '5 hours', CURRENT_TIMESTAMP - INTERVAL '15 minutes', '4 hrs 45 mins', 380.00, 'UPI', 'UPI', 'Completed', CURRENT_TIMESTAMP - INTERVAL '15 minutes'),
          ('TXN-8040', 'KA01 AB 1234', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'A-05', CURRENT_TIMESTAMP - INTERVAL '6 hours', CURRENT_TIMESTAMP - INTERVAL '1 hour', '5 hrs 00 mins', 250.00, 'Credit Card', 'Credit Card', 'Completed', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
          ('TXN-8039', 'KA04 GH 3456', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'D-02', CURRENT_TIMESTAMP - INTERVAL '7 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', '5 hrs 00 mins', 125.00, 'Cash', 'Cash', 'Completed', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
          ('TXN-8038', 'KA02 CD 5678', 'Laiba Taj', 'staff@shnoor.com', '+91 98765 43211', 'B-04', CURRENT_TIMESTAMP - INTERVAL '8 hours', CURRENT_TIMESTAMP - INTERVAL '3 hours', '5 hrs 00 mins', 250.00, 'Net Banking', 'Net Banking', 'Completed', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
          ('TXN-8037', 'KA03 EF 9012', 'Taj', 'admin@shnoor.com', '+91 98765 43212', 'C-01', CURRENT_TIMESTAMP - INTERVAL '9 hours', CURRENT_TIMESTAMP - INTERVAL '5 hours', '4 hrs 00 mins', 320.00, 'UPI', 'UPI', 'Completed', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
          ('TXN-8036', 'KA05 IJ 7890', 'Laiba Taj', 'staff@shnoor.com', '+91 98765 43211', 'A-01', CURRENT_TIMESTAMP - INTERVAL '10 hours', CURRENT_TIMESTAMP - INTERVAL '6 hours', '4 hrs 00 mins', 200.00, 'Debit Card', 'Debit Card', 'Completed', CURRENT_TIMESTAMP - INTERVAL '6 hours');
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100) NOT NULL,
        customer_email VARCHAR(150),
        customer_phone VARCHAR(50),
        vehicle_number VARCHAR(50) NOT NULL,
        vehicle_type VARCHAR(50) DEFAULT 'Car',
        model VARCHAR(100) DEFAULT 'Standard',
        slot_number VARCHAR(20) NOT NULL,
        zone VARCHAR(50) DEFAULT 'Zone A',
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        duration_hours NUMERIC(5, 2) DEFAULT 2.00,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        validation_code VARCHAR(50) NOT NULL,
        validated_at TIMESTAMP,
        validated_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const resCountRes = await pool.query("SELECT COUNT(*) FROM reservations");
    if (parseInt(resCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO reservations (
          booking_id, customer_name, customer_email, customer_phone, vehicle_number,
          vehicle_type, model, slot_number, zone, start_time, end_time, duration_hours,
          total_amount, status, validation_code, created_at
        ) VALUES
          ('BK-12345', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'KA01 AB 1234', 'Car', 'Hyundai Creta', 'A-03', 'Zone A', CURRENT_TIMESTAMP + INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '4 hours', 3, 150.00, 'Confirmed', 'VAL-1042', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
          ('BK-12344', 'Laiba Taj', 'staff@shnoor.com', '+91 98765 43211', 'KA02 CD 5678', 'SUV', 'Tata Harrier', 'B-05', 'Zone B', CURRENT_TIMESTAMP + INTERVAL '2 hours', CURRENT_TIMESTAMP + INTERVAL '5 hours', 3, 180.00, 'Pending', 'VAL-1043', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
          ('BK-12343', 'Taj', 'admin@shnoor.com', '+91 98765 43212', 'KA03 EF 9012', 'EV', 'Tata Nexon EV', 'C-02', 'Zone C', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '1 hour', 2, 160.00, 'Checked In', 'VAL-1044', CURRENT_TIMESTAMP - INTERVAL '4 hours'),
          ('BK-12342', 'Akash', 'customer@shnoor.com', '+91 98765 43210', 'TS01 AP 1310', 'Bike', 'Yamaha MT-15', 'D-03', 'Zone D', CURRENT_TIMESTAMP + INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '6 hours', 3, 75.00, 'Confirmed', 'VAL-1045', CURRENT_TIMESTAMP - INTERVAL '5 hours'),
          ('BK-12341', 'Laiba', 'customer@shnoor.com', '+91 98765 43210', 'KA04 GH 3456', 'Bike', 'Royal Enfield Hunter 350', 'D-06', 'Zone D', CURRENT_TIMESTAMP - INTERVAL '1 day', CURRENT_TIMESTAMP - INTERVAL '21 hours', 3, 75.00, 'Completed', 'VAL-1041', CURRENT_TIMESTAMP - INTERVAL '1 day')
        ON CONFLICT (booking_id) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_plans (
        id SERIAL PRIMARY KEY,
        plan_code VARCHAR(50) UNIQUE NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        billing_type VARCHAR(50) NOT NULL,
        rate NUMERIC(10, 2) NOT NULL,
        duration_hours NUMERIC(5, 2) DEFAULT 1.00,
        description TEXT,
        features TEXT[],
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS plan_code VARCHAR(50);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
    `);

    const planCountRes = await pool.query("SELECT COUNT(*) FROM pricing_plans");
    if (parseInt(planCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO pricing_plans (plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active)
        VALUES
          ('PLAN-CAR-HR', 'Standard Car Hourly', 'Car', 'Hourly', 50.00, 1.00, 'Standard hourly parking rate for sedan and hatchback cars in Zone A & B.', ARRAY['Zone A / B Covered Parking', 'CCTV 24/7 Monitoring', 'Automated Boom Barrier Access'], true),
          ('PLAN-SUV-HR', 'SUV / Large Vehicle Hourly', 'SUV', 'Hourly', 60.00, 1.00, 'Spacious high-clearance parking bay designed for large SUVs in Zone B.', ARRAY['Extra Wide Bay Spacing', 'High Clearance Zone B', 'Dedicated Security Warden'], true),
          ('PLAN-EV-HR', 'EV Fast Charging Hourly', 'EV', 'Hourly', 80.00, 1.00, 'Premium EV parking bay with 60kW DC fast charging included in Zone C.', ARRAY['Zone C VIP Electric Bay', '60kW Fast DC Charging', 'Priority Gate Entry / Exit'], true),
          ('PLAN-BIKE-HR', 'Two-Wheeler Hourly', 'Bike', 'Hourly', 25.00, 1.00, 'Dedicated compact parking bay for motorcycles and scooters in Zone D.', ARRAY['Zone D Dedicated Bike Bay', 'Helmet Storage Facility', 'Quick Exit Lane Access'], true),
          ('PLAN-CAR-DAY', 'Full Day Car Pass', 'Car', 'Daily', 350.00, 24.00, 'Unlimited 24-hour in-and-out parking privileges for cars.', ARRAY['24-Hour Multi-Entry Access', 'Guaranteed Reserved Bay', 'Complimentary Car Wash Token'], true),
          ('PLAN-BIKE-DAY', 'Two-Wheeler Daily Pass', 'Bike', 'Daily', 150.00, 24.00, '24-hour daily parking pass for two-wheelers in Zone D.', ARRAY['24-Hour Secure Parking', 'Zone D Reserved Bay', 'Zero Surcharge on Re-entry'], true),
          ('PLAN-EV-DAY', 'EV Full Day & Supercharge Pass', 'EV', 'Daily', 550.00, 24.00, 'Full day premium parking with unlimited EV fast charging.', ARRAY['Full Day Zone C VIP Bay', 'Unlimited EV Fast Charging', 'Valet Assistance on Request'], true),
          ('PLAN-WEEKEND', 'Weekend Special Flat Rate', 'Car', 'Flat', 250.00, 8.00, 'Flat rate for 8-hour weekend shopping and leisure parking.', ARRAY['Flat 8-Hour Coverage', 'Zone A & B Access', 'Weekend Saver Discount'], false)
        ON CONFLICT (plan_code) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        ticket_code VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100),
        customer_email VARCHAR(150) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General Query',
        description TEXT,
        priority VARCHAR(50) DEFAULT 'Normal',
        status VARCHAR(50) DEFAULT 'Open',
        messages JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const ticketCountRes = await pool.query("SELECT COUNT(*) FROM support_tickets");
    if (parseInt(ticketCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO support_tickets (ticket_code, customer_name, customer_email, subject, category, description, priority, status, messages)
        VALUES
          ('TCK-8821', 'Laiba', 'customer@shnoor.com', 'EV Charger Station fast speed query', 'EV Charging', 'I wanted to check if 60kW DC fast charging is available on Zone C Bay 01.', 'High', 'Open', '[{"sender": "Customer", "text": "I wanted to check if 60kW DC fast charging is available on Zone C Bay 01.", "time": "10:30 AM"}]'::jsonb),
          ('TCK-8822', 'Laiba Taj', 'staff@shnoor.com', 'Boom barrier RFID tag auto-renewal', 'Access Control', 'RFID express lane card needs monthly renewal activation.', 'Normal', 'Resolved', '[{"sender": "Customer", "text": "RFID express lane card needs monthly renewal activation.", "time": "09:15 AM"}, {"sender": "Support Agent", "text": "Your RFID tag has been renewed successfully for another 30 days.", "time": "09:45 AM"}]'::jsonb)
        ON CONFLICT (ticket_code) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(150) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
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

    await notifyAdmins({
      title: "New User Registered",
      message: `New customer registered: ${email}`,
      type: "user"
    });
    await notifyUser(email, {
      title: "Welcome to Shnoor Parking",
      message: `Welcome ${name}! Your account has been registered successfully.`,
      type: "user"
    });
    try {
      await sendAccountCreatedEmail({
        customerName: name,
        customerEmail: email,
        role: dbRole,
        phone: userPhone
      });
      const adminEmails = await getActiveAdminEmails();
      await sendNewUserAdminEmail({ customerName: name, customerEmail: email, adminEmails });
    } catch (e) {
      console.error(e);
    }

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

const sendOtpEmail = async (toEmail, otp) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="display: inline-block; background: #0f3b43; color: #ffffff; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; font-weight: 800; font-size: 20px;">P</div>
        <h2 style="color: #0f3b43; margin: 10px 0 4px 0;">ParkSafe Password Reset</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0;">Real-Time Verification Code</p>
      </div>
      <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
        <span style="font-size: 13px; color: #0f766e; font-weight: 700; display: block; margin-bottom: 6px;">YOUR 6-DIGIT OTP</span>
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f3b43;">${otp}</span>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">This verification code is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">ParkSafe Smart Parking Management System</p>
    </div>
  `;

  if (process.env.BREVO_API_KEY) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_SENDER_NAME || "ParkSafe Support",
            email: process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com"
          },
          to: [{ email: toEmail }],
          subject: "ParkSafe — Password Reset Verification Code",
          htmlContent
        })
      });

      if (brevoRes.ok) {
        const brevoData = await brevoRes.json();
        console.log(`Real OTP email dispatched via Brevo API to ${toEmail}. Message ID: ${brevoData.messageId}`);
        return { success: true, messageId: brevoData.messageId };
      }
    } catch (err) {
      console.error("Brevo API dispatch failed, attempting SMTP fallback:", err.message);
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ParkSafe Support" <laibataj1306@gmail.com>',
      to: toEmail,
      subject: "ParkSafe — Password Reset Verification Code",
      html: htmlContent
    });

    console.log(`Real OTP email dispatched via SMTP to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Real OTP email error:", err.message);
    return { success: false, error: err.message };
  }
};

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userRes.rowCount === 0) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await pool.query("DELETE FROM password_resets WHERE email = $1", [email.toLowerCase().trim()]);
    await pool.query(
      "INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '15 minutes')",
      [email.toLowerCase().trim(), otp]
    );

    const emailRes = await sendOtpEmail(email.toLowerCase().trim(), otp);

    res.json({
      success: true,
      message: `Verification code sent to ${email}`,
      emailSent: emailRes.success
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error processing request" });
  }
});

app.post("/api/verify-reset-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP code are required" });
  }

  try {
    const resetRes = await pool.query(
      "SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP",
      [email.toLowerCase().trim(), otp.trim()]
    );

    if (resetRes.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    res.json({ success: true, message: "Code verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error verifying code" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: "Email, OTP, and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long" });
  }

  try {
    const resetRes = await pool.query(
      "SELECT * FROM password_resets WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP",
      [email.toLowerCase().trim(), otp.trim()]
    );

    if (resetRes.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email.toLowerCase().trim()]);
    await pool.query("DELETE FROM password_resets WHERE email = $1", [email.toLowerCase().trim()]);

    res.json({ success: true, message: "Password reset successfully. You can now login with your new password." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error resetting password" });
  }
});

app.get("/api/admin/dashboard-overview", async (req, res) => {
  try {
    const slotsRes = await pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC");
    const usersRes = await pool.query("SELECT COUNT(*) FROM users");
    const recentRes = await pool.query(
      "SELECT booking_id, customer_name, vehicle_number, slot_number, zone, total_amount, status, created_at FROM reservations ORDER BY id DESC LIMIT 5"
    );

    const slots = slotsRes.rows;
    const totalSlots = slots.length;
    const availableSlots = slots.filter(s => s.status === "available" || (s.is_available && s.status !== "reserved")).length;
    const occupiedSlots = slots.filter(s => s.status === "occupied" || (!s.is_available && s.status !== "reserved")).length;
    const reservedSlots = slots.filter(s => s.status === "reserved").length;

    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots) / totalSlots) * 100) : 0;

    let activeSessions = [];
    if (recentRes.rows && recentRes.rows.length > 0) {
      activeSessions = recentRes.rows.map(r => ({
        booking_id: r.booking_id,
        user_name: r.customer_name,
        vehicle_number: r.vehicle_number,
        slot_number: r.slot_number,
        zone: r.zone,
        amount: `₹${parseFloat(r.total_amount || 0).toFixed(2)}`,
        status: r.status,
        created_at: r.created_at
      }));
    } else {
      activeSessions = [
        { user_name: "Laiba", vehicle_number: "KA01 AB 1234", status: "Active", created_at: new Date(Date.now() - 3600000).toISOString() },
        { user_name: "Laiba Taj", vehicle_number: "KA02 CD 5678", status: "Active", created_at: new Date(Date.now() - 7200000).toISOString() },
        { user_name: "Taj", vehicle_number: "KA03 EF 9012", status: "Completed", created_at: new Date(Date.now() - 14400000).toISOString() },
        { user_name: "Laiba", vehicle_number: "KA04 GH 3456", status: "Active", created_at: new Date(Date.now() - 28800000).toISOString() },
      ];
    }

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
      activeSessions
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

    await notifyStaffAndAdmins({
      title: "Parking Slot Updated",
      message: `Slot ${slot_number} in ${zone} (${slotType}) updated to status "${slotStatus}".`,
      type: "slot"
    });

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
  const normalizedStatus = (status || "").toLowerCase();

  if (!["available", "occupied", "reserved"].includes(normalizedStatus)) {
    return res.status(400).json({ error: "Status must be 'available', 'occupied', or 'reserved'" });
  }

  const isAvailable = normalizedStatus === "available";

  try {
    const slotResult = await pool.query(
      "UPDATE parking_slots SET status = $1, is_available = $2 WHERE slot_number = $3 RETURNING *",
      [normalizedStatus, isAvailable, slotNumber]
    );

    if (slotResult.rowCount === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    await notifyStaff({
      title: "Important Parking/Operational Update",
      message: `Parking slot ${slotNumber} status updated to "${normalizedStatus}".`,
      type: "parking"
    });
    await notifyAdmins({
      title: "Important Parking Activity",
      message: `Parking slot ${slotNumber} status changed to "${normalizedStatus}".`,
      type: "parking"
    });

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

    await notifyStaffAndAdmins({
      title: "Parking Slot Status Toggled",
      message: `Slot ${slotNumber} status toggled to "${newStatus}".`,
      type: "slot"
    });

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

app.post("/api/staff/vehicle-entry", async (req, res) => {
  const { vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, slot_number, entry_time } = req.body;

  if (!vehicle_number || !vehicle_type || !owner_name || !slot_number) {
    return res.status(400).json({ error: "Vehicle number, type, customer name, and slot are required" });
  }

  const vPlate = vehicle_number.toUpperCase().trim();
  const vType = vehicle_type;
  const vModel = model || "Standard";
  const vOwner = owner_name.trim();
  const vEmail = owner_email || "customer@shnoor.com";
  const vPhone = owner_phone || "+91 98765 43210";
  const vSlot = slot_number;
  const vEntryTime = entry_time ? new Date(entry_time) : new Date();

  try {
    const slotCheck = await pool.query("SELECT * FROM parking_slots WHERE slot_number = $1", [vSlot]);
    if (slotCheck.rowCount === 0) {
      return res.status(400).json({ error: `Slot ${vSlot} does not exist` });
    }
    if (slotCheck.rows[0].status === "occupied") {
      return res.status(400).json({ error: `Slot ${vSlot} is already occupied` });
    }

    const existVeh = await pool.query("SELECT * FROM vehicles WHERE vehicle_number = $1", [vPlate]);
    let vehicleData;
    if (existVeh.rowCount > 0) {
      const updateVeh = await pool.query(
        "UPDATE vehicles SET vehicle_type = $1, model = $2, owner_name = $3, owner_phone = $4, status = 'Parked', current_slot = $5 WHERE vehicle_number = $6 RETURNING *",
        [vType, vModel, vOwner, vPhone, vSlot, vPlate]
      );
      vehicleData = updateVeh.rows[0];
    } else {
      const insertVeh = await pool.query(
        "INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot) VALUES ($1, $2, $3, $4, $5, $6, 'Parked', $7) RETURNING *",
        [vPlate, vType, vModel, vOwner, vEmail, vPhone, vSlot]
      );
      vehicleData = insertVeh.rows[0];
    }

    await pool.query(
      "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE slot_number = $1",
      [vSlot]
    );

    const historyInsert = await pool.query(
      "INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, duration, fee, status) VALUES ($1, $2, $3, 'Ongoing', '₹50.00', 'Parked') RETURNING *",
      [vPlate, vSlot, vEntryTime]
    );

    const targetOwnerEmail = vehicleData?.owner_email || vEmail;
    await notifyUser(targetOwnerEmail, {
      title: "Vehicle Entry Recorded",
      message: `Your vehicle ${vPlate} has entered the parking area.`,
      type: "parking"
    });
    await notifyUser(targetOwnerEmail, {
      title: "Parking Session Started",
      message: `Your parking session for vehicle ${vPlate} at bay ${vSlot} has started.`,
      type: "parking"
    });
    await notifyStaff({
      title: "Vehicle Entry",
      message: `Vehicle ${vPlate} (${vType}) entered and parked at slot ${vSlot}.`,
      type: "parking"
    });
    await notifyAdmins({
      title: "Important Parking Activity",
      message: `Vehicle ${vPlate} entered slot ${vSlot}.`,
      type: "parking"
    });

    try {
      const timeStr = vEntryTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      await sendVehicleEntryEmail({
        vehicleNumber: vPlate,
        slotNumber: vSlot,
        entryTime: timeStr,
        recipient: targetOwnerEmail
      });
      await sendParkingSessionStartedEmail({
        vehicleNumber: vPlate,
        slotNumber: vSlot,
        entryTime: timeStr,
        recipient: targetOwnerEmail
      });
    } catch (e) {
      console.error(e);
    }

    res.status(201).json({
      success: true,
      message: `Vehicle ${vPlate} checked in successfully at Bay ${vSlot}`,
      entry: {
        id: `#ENT-${historyInsert.rows[0].id + 1040}`,
        vehicle_number: vPlate,
        vehicle_type: vType,
        model: vModel,
        owner_name: vOwner,
        owner_phone: vPhone,
        slot_number: vSlot,
        entry_time: vEntryTime,
        status: "Parked"
      },
      vehicle: vehicleData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error registering vehicle entry" });
  }
});

app.get("/api/staff/vehicle-entries", async (req, res) => {
  try {
    const entriesRes = await pool.query(`
      SELECT 
        vh.id,
        vh.vehicle_number,
        vh.slot_number,
        vh.entry_time,
        vh.exit_time,
        vh.duration,
        vh.fee,
        vh.status,
        COALESCE(v.vehicle_type, 'Car') AS vehicle_type,
        COALESCE(v.model, 'Standard') AS model,
        COALESCE(v.owner_name, 'Customer') AS owner_name,
        COALESCE(v.owner_phone, '+91 98765 43210') AS owner_phone
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON vh.vehicle_number = v.vehicle_number
      ORDER BY vh.entry_time DESC
    `);
    res.json({ success: true, entries: entriesRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching vehicle entries" });
  }
});

const sendVehicleRegistrationEmail = async (vehicle) => {
  try {
    let transporter;
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const emailSubject = `ParkSafe - Vehicle Registration Confirmation (${vehicle.vehicle_number})`;
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06); }
    .header { background: #0f3b43; color: #ffffff; padding: 28px 24px; text-align: center; }
    .brand-name { font-size: 24px; font-weight: 800; letter-spacing: 0.5px; color: #2dd4bf; margin: 0 0 6px 0; }
    .header-title { font-size: 16px; font-weight: 600; color: #ffffff; margin: 0; opacity: 0.95; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .description { font-size: 13.5px; line-height: 1.6; color: #475569; margin-bottom: 22px; }
    .plate-card { background: #0f172a; border-radius: 12px; padding: 16px 20px; text-align: center; margin-bottom: 24px; }
    .plate-number { font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 2px; font-family: monospace; }
    .plate-meta { font-size: 12px; color: #2dd4bf; font-weight: 600; margin-top: 4px; }
    .details-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 40%; }
    .details-table td.value { font-weight: 700; color: #0f172a; width: 60%; text-align: right; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge.bay { background: #f0fdfa; color: #0f766e; border-color: #ccfbf1; font-weight: 800; font-size: 12px; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 24px; text-align: center; font-size: 11.5px; color: #94a3b8; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-name">PARKSAFE</div>
      <p class="header-title">Official Vehicle Registration Pass</p>
    </div>
    <div class="content">
      <p class="greeting">Hello ${vehicle.owner_name},</p>
      <p class="description">Your vehicle has been successfully registered in the ParkSafe Smart Parking System. Below are the full registration details for your records:</p>
      
      <div class="plate-card">
        <div class="plate-number">${vehicle.vehicle_number}</div>
        <div class="plate-meta">${vehicle.model} • ${vehicle.vehicle_type}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Owner / Customer</td>
          <td class="value">${vehicle.owner_name}</td>
        </tr>
        <tr>
          <td class="label">Customer Email</td>
          <td class="value">${vehicle.owner_email}</td>
        </tr>
        <tr>
          <td class="label">Contact Phone</td>
          <td class="value">${vehicle.owner_phone}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Type</td>
          <td class="value">${vehicle.vehicle_type}</td>
        </tr>
        <tr>
          <td class="label">Vehicle Model</td>
          <td class="value">${vehicle.model}</td>
        </tr>
        <tr>
          <td class="label">Assigned Parking Bay</td>
          <td class="value"><span class="badge bay">Bay ${vehicle.current_slot}</span></td>
        </tr>
        <tr>
          <td class="label">Current Status</td>
          <td class="value"><span class="badge">${vehicle.status}</span></td>
        </tr>
        <tr>
          <td class="label">Registration Date</td>
          <td class="value">${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
        </tr>
      </table>

      <p style="font-size: 12.5px; color: #64748b; line-height: 1.5; margin: 0;">
        Please present this confirmation or your vehicle license plate at the automated entry gate for seamless RFID or optical recognition parking access.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 4px 0;">ParkSafe Smart Parking Systems • Automated Notification</p>
      <p style="margin: 0;">If you did not register this vehicle, please contact ParkSafe Support immediately.</p>
    </div>
  </div>
</body>
</html>`;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"ParkSafe Parking System" <no-reply@parksafe.com>',
      to: vehicle.owner_email,
      subject: emailSubject,
      html: emailHtml
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    return { success: true, messageId: info.messageId, previewUrl: previewUrl || null };
  } catch (emailErr) {
    console.error("Email notification error:", emailErr);
    return { success: false, error: emailErr.message };
  }
};

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

    await notifyUser(owner_email, {
      title: "Vehicle Registered",
      message: `Your vehicle ${vehicle_number.toUpperCase()} (${vehicle_type} - ${vModel}) has been successfully registered.`,
      type: "vehicle"
    });

    await notifyAdmins({
      title: "New Vehicle Registered",
      message: `Vehicle ${vehicle_number.toUpperCase()} was registered for ${owner_name}.`,
      type: "vehicle"
    });

    const emailResult = await sendVehicleRegistrationEmail(insertRes.rows[0]);

    res.status(201).json({
      success: true,
      vehicle: insertRes.rows[0],
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
      previewUrl: emailResult.previewUrl,
      message: emailResult.success
        ? `Vehicle ${vehicle_number.toUpperCase()} registered successfully & confirmation email sent to ${owner_email}`
        : `Vehicle ${vehicle_number.toUpperCase()} registered successfully (Email not delivered: ${emailResult.error})`
    });
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

    await notifyUser(email, {
      title: "Account Created",
      message: `Your account has been created with role ${userRole} and status ${userStatus}.`,
      type: "user"
    });
    await notifyAdmins({
      title: "New User Registered",
      message: `New customer registered: ${email}`,
      type: "user"
    });
    try {
      const adminEmails = await getActiveAdminEmails();
      await sendNewUserAdminEmail({ customerName: name, customerEmail: email, adminEmails });
    } catch (e) {
      console.error(e);
    }

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

const handleActiveSessions = async (req, res) => {
  try {
    const activeVehiclesRes = await pool.query(`
      SELECT 
        v.id,
        v.vehicle_number,
        v.vehicle_type,
        v.model,
        v.owner_name,
        v.owner_email,
        v.owner_phone,
        v.status,
        v.current_slot,
        v.created_at,
        ps.zone,
        ps.slot_type,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        (
          SELECT entry_time 
          FROM vehicle_history 
          WHERE vehicle_number = v.vehicle_number 
          ORDER BY entry_time DESC 
          LIMIT 1
        ) as entry_time
      FROM vehicles v
      LEFT JOIN parking_slots ps ON v.current_slot = ps.slot_number
      WHERE LOWER(v.status) = 'parked'
      ORDER BY v.id DESC
    `);

    const now = new Date();
    const sessions = activeVehiclesRes.rows.map((row) => {
      const entryDate = row.entry_time ? new Date(row.entry_time) : new Date(row.created_at);
      const diffMs = Math.max(0, now - entryDate);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      const billedHours = Math.max(1, Math.ceil(diffMins / 60));
      const rate = parseFloat(row.hourly_rate) || 50;
      const totalFee = (billedHours * rate).toFixed(2);

      return {
        id: row.id,
        vehicle_number: row.vehicle_number,
        vehicle_type: row.vehicle_type,
        model: row.model || "Standard",
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        owner_phone: row.owner_phone,
        current_slot: row.current_slot,
        zone: row.zone || "Zone A",
        slot_type: row.slot_type || "Standard",
        hourly_rate: rate,
        entry_time: entryDate.toISOString(),
        duration: durationStr,
        billed_hours: billedHours,
        calculated_fee: `₹${totalFee}`,
        fee_numeric: parseFloat(totalFee),
        status: "Parked"
      };
    });

    res.json({ success: true, count: sessions.length, sessions, vehicles: sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching active parking sessions" });
  }
};

app.get("/api/parking/active-sessions", handleActiveSessions);
app.get("/api/admin/active-sessions", handleActiveSessions);
app.get("/api/staff/active-vehicles", handleActiveSessions);

app.get("/api/payments/today", async (req, res) => {
  try {
    const paymentsRes = await pool.query("SELECT * FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL ORDER BY created_at DESC");
    const allPayments = paymentsRes.rows;

    let totalRevenue = 0;
    const methodsBreakdown = {
      UPI: 0,
      "Credit Card": 0,
      "Debit Card": 0,
      Cash: 0,
      "Net Banking": 0
    };

    allPayments.forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      totalRevenue += amt;
      const method = p.payment_method || "UPI";
      if (methodsBreakdown[method] !== undefined) {
        methodsBreakdown[method] += amt;
      } else {
        methodsBreakdown[method] = amt;
      }
    });

    const completedCount = allPayments.length;
    const avgTicket = completedCount > 0 ? (totalRevenue / completedCount).toFixed(2) : "0.00";

    res.json({
      success: true,
      summary: {
        totalRevenue: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalRevenueNumeric: totalRevenue,
        completedCount,
        avgTicket: `₹${parseFloat(avgTicket).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        methodsBreakdown
      },
      payments: allPayments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching today's revenue" });
  }
});

app.get("/api/payments", async (req, res) => {
  const { search, method } = req.query;
  try {
    let query = "SELECT * FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL";
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(vehicle_number) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(transaction_id) LIKE $${params.length})`;
    }

    if (method && method !== "ALL") {
      params.push(method);
      query += ` AND payment_method = $${params.length}`;
    }

    query += " ORDER BY created_at DESC, id DESC";

    const paymentsRes = await pool.query(query, params);
    res.json({ success: true, payments: paymentsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching payments" });
  }
});

app.get("/api/customer/payments", async (req, res) => {
  const { email, name, search, method } = req.query;
  try {
    let query = "SELECT * FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL";
    const params = [];

    if (email) {
      params.push(`%${email.toLowerCase().trim()}%`);
      query += ` AND (LOWER(COALESCE(customer_email, '')) LIKE $${params.length} OR LOWER(COALESCE(customer_name, '')) LIKE $${params.length})`;
    } else if (name) {
      params.push(`%${name.toLowerCase().trim()}%`);
      query += ` AND LOWER(COALESCE(customer_name, '')) LIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      query += ` AND (LOWER(vehicle_number) LIKE $${params.length} OR LOWER(transaction_id) LIKE $${params.length} OR LOWER(slot_number) LIKE $${params.length})`;
    }

    if (method && method !== "ALL") {
      params.push(method);
      query += ` AND payment_method = $${params.length}`;
    }

    query += " ORDER BY created_at DESC, id DESC";

    const paymentsRes = await pool.query(query, params);

    if (paymentsRes.rowCount === 0 && (email || name)) {
      const allRes = await pool.query("SELECT * FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL ORDER BY created_at DESC, id DESC LIMIT 25");
      return res.json({ success: true, payments: allRes.rows });
    }

    res.json({ success: true, payments: paymentsRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer payments" });
  }
});

app.post("/api/staff/process-payment", async (req, res) => {
  const {
    vehicle_number,
    slot_number,
    customer_name,
    customer_email,
    customer_phone,
    entry_time,
    exit_time,
    duration,
    amount,
    payment_method
  } = req.body;

  if (!vehicle_number || !slot_number || !customer_name || amount === undefined) {
    return res.status(400).json({ error: "Vehicle, slot, customer name, and amount are required" });
  }

  const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const exitDate = exit_time ? new Date(exit_time) : new Date();
  const entryDate = entry_time ? new Date(entry_time) : new Date(Date.now() - 3600000);
  const payMethod = payment_method || "UPI";
  const numAmount = parseFloat(amount) || 50.00;
  const dur = duration || "1h 00m";

  try {
    const paymentInsert = await pool.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, payment_method, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Completed', CURRENT_TIMESTAMP) RETURNING *`,
      [
        txnId,
        vehicle_number.toUpperCase(),
        customer_name,
        customer_email || "customer@shnoor.com",
        customer_phone || "+91 98765 43210",
        slot_number,
        entryDate,
        exitDate,
        dur,
        numAmount,
        payMethod
      ]
    );

    await pool.query(
      "UPDATE parking_slots SET status = 'available', is_available = true WHERE slot_number = $1",
      [slot_number]
    );

    await pool.query(
      "UPDATE vehicles SET status = 'Checked Out' WHERE vehicle_number = $1",
      [vehicle_number.toUpperCase()]
    );

    await pool.query(
      `UPDATE vehicle_history 
       SET exit_time = $1, duration = $2, fee = $3, status = 'Completed' 
       WHERE vehicle_number = $4 AND (exit_time IS NULL OR status = 'Parked')`,
      [exitDate, dur, `₹${numAmount.toFixed(2)}`, vehicle_number.toUpperCase()]
    );

    const payCustEmail = customer_email || "customer@shnoor.com";
    await notifyUser(payCustEmail, {
      title: "Payment Successful",
      message: `Payment of ₹${numAmount.toFixed(2)} received for vehicle ${vehicle_number.toUpperCase()}.`,
      type: "payment"
    });
    await notifyUser(payCustEmail, {
      title: "Receipt Available",
      message: "Your digital parking receipt is now available.",
      type: "receipt"
    });
    await notifyStaff({
      title: "Payment Received",
      message: `Payment of ₹${numAmount.toFixed(2)} received for ${vehicle_number.toUpperCase()} via ${payMethod}.`,
      type: "payment"
    });
    await notifyAdmins({
      title: "Important Payment Activity",
      message: `Payment of ₹${numAmount.toFixed(2)} received for vehicle ${vehicle_number.toUpperCase()} (${txnId}).`,
      type: "payment"
    });

    try {
      const adminEmails = await getActiveAdminEmails();
      await sendPaymentSuccessfulEmail({
        amount: numAmount,
        paymentMethod: payMethod,
        vehicleNumber: vehicle_number.toUpperCase(),
        txnId,
        recipient: payCustEmail
      });
      await sendDigitalReceiptEmail({
        receiptNumber: txnId,
        amount: numAmount,
        vehicleNumber: vehicle_number.toUpperCase(),
        slotNumber: slot_number,
        duration: dur,
        recipient: payCustEmail
      });
      await sendAdminPaymentUpdateEmail({
        title: "Payment Collected",
        message: `Payment of ₹${numAmount.toFixed(2)} received for vehicle ${vehicle_number.toUpperCase()}.`,
        amount: numAmount,
        vehicleNumber: vehicle_number.toUpperCase(),
        txnId,
        adminEmails
      });
    } catch (e) {
      console.error(e);
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${numAmount.toFixed(2)} processed successfully for ${vehicle_number.toUpperCase()}`,
      receipt: paymentInsert.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error processing payment" });
  }
});

app.get("/api/customer/my-parking", async (req, res) => {
  const { email, name } = req.query;
  try {
    let query = `
      SELECT 
        v.id,
        v.vehicle_number,
        v.vehicle_type,
        v.model,
        v.owner_name,
        v.owner_email,
        v.owner_phone,
        v.status,
        v.current_slot,
        v.created_at,
        ps.zone,
        ps.slot_type,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        (
          SELECT entry_time 
          FROM vehicle_history 
          WHERE vehicle_number = v.vehicle_number 
          ORDER BY entry_time DESC 
          LIMIT 1
        ) as entry_time
      FROM vehicles v
      LEFT JOIN parking_slots ps ON v.current_slot = ps.slot_number
      WHERE LOWER(v.status) = 'parked'
    `;
    const params = [];

    if (email) {
      params.push(email.toLowerCase());
      query += ` AND LOWER(v.owner_email) = $${params.length}`;
    } else if (name) {
      params.push(`%${name.toLowerCase()}%`);
      query += ` AND LOWER(v.owner_name) LIKE $${params.length}`;
    }

    query += " ORDER BY v.id DESC LIMIT 1";

    const vehRes = await pool.query(query, params);

    if (vehRes.rowCount === 0) {
      return res.json({ success: true, session: null, message: "No active parking session found" });
    }

    const row = vehRes.rows[0];
    const now = new Date();
    const entryDate = row.entry_time ? new Date(row.entry_time) : new Date(row.created_at);
    const diffMs = Math.max(0, now - entryDate);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    const billedHours = Math.max(1, Math.ceil(diffMins / 60));
    const rate = parseFloat(row.hourly_rate) || 50;
    const totalFee = (billedHours * rate).toFixed(2);

    res.json({
      success: true,
      session: {
        id: row.id,
        vehicle_number: row.vehicle_number,
        vehicle_type: row.vehicle_type,
        model: row.model || "Standard",
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        owner_phone: row.owner_phone,
        current_slot: row.current_slot,
        zone: row.zone || "Zone A",
        slot_type: row.slot_type || "Standard",
        hourly_rate: rate,
        entry_time: entryDate.toISOString(),
        duration: durationStr,
        billed_hours: billedHours,
        calculated_fee: `₹${totalFee}`,
        fee_numeric: parseFloat(totalFee),
        status: "Parked"
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer parking session" });
  }
});

app.get("/api/admin/parking-records", async (req, res) => {
  const { search, status, type } = req.query;
  try {
    let query = `
      SELECT 
        vh.id,
        vh.vehicle_number,
        vh.slot_number,
        vh.entry_time,
        vh.exit_time,
        vh.duration,
        vh.fee,
        vh.status,
        vh.created_at,
        COALESCE(v.vehicle_type, 'Car') as vehicle_type,
        COALESCE(v.model, 'Standard') as model,
        COALESCE(v.owner_name, 'Laiba') as customer_name,
        COALESCE(v.owner_email, 'customer@shnoor.com') as customer_email,
        COALESCE(v.owner_phone, '+91 98765 43210') as customer_phone,
        COALESCE(ps.zone, 'Zone A') as zone,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        p.transaction_id,
        p.payment_method,
        COALESCE(p.payment_status, CASE WHEN vh.status = 'Completed' THEN 'Paid' ELSE 'Pending' END) as payment_status
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON vh.vehicle_number = v.vehicle_number
      LEFT JOIN parking_slots ps ON vh.slot_number = ps.slot_number
      LEFT JOIN payments p ON vh.vehicle_number = p.vehicle_number AND (
        (vh.exit_time IS NOT NULL AND ABS(EXTRACT(EPOCH FROM (p.exit_time - vh.exit_time))) < 3600) OR
        (p.slot_number = vh.slot_number)
      )
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      query += ` AND (LOWER(vh.vehicle_number) LIKE $${params.length} OR LOWER(COALESCE(v.owner_name, '')) LIKE $${params.length} OR LOWER(vh.slot_number) LIKE $${params.length} OR LOWER(COALESCE(p.transaction_id, '')) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      query += ` AND LOWER(vh.status) = $${params.length}`;
    }

    if (type && type !== "ALL") {
      params.push(type.toLowerCase());
      query += ` AND LOWER(COALESCE(v.vehicle_type, 'car')) = $${params.length}`;
    }

    query += " ORDER BY vh.entry_time DESC";

    const histRes = await pool.query(query, params);

    const now = new Date();
    const seenMap = new Map();
    histRes.rows.forEach((row) => {
      if (!seenMap.has(row.id)) {
        const isParked = (row.status || "").toLowerCase() === "parked";
        let duration = row.duration;
        let fee = row.fee;

        if (isParked && row.entry_time) {
          const entryDate = new Date(row.entry_time);
          const diffMs = Math.max(0, now - entryDate);
          const diffMins = Math.floor(diffMs / (1000 * 60));
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          duration = hours > 0 ? `${hours}h ${mins}m (Ongoing)` : `${mins}m (Ongoing)`;
          const billedHours = Math.max(1, Math.ceil(diffMins / 60));
          const rate = parseFloat(row.hourly_rate) || 50;
          fee = `₹${(billedHours * rate).toFixed(2)}`;
        }

        seenMap.set(row.id, {
          ...row,
          duration: duration || "1h 00m",
          fee: fee || "₹50.00",
          payment_status: row.payment_status || (isParked ? "Pending" : "Paid")
        });
      }
    });

    const records = Array.from(seenMap.values());
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching parking records" });
  }
});

app.post("/api/staff/vehicle-exit", async (req, res) => {
  const {
    vehicle_number,
    slot_number,
    exit_time,
    duration,
    fee,
    payment_method,
    customer_name,
    customer_email,
    customer_phone
  } = req.body;

  if (!vehicle_number) {
    return res.status(400).json({ error: "Vehicle number is required for checkout" });
  }

  const exitDate = exit_time ? new Date(exit_time) : new Date();
  const dur = duration || "1h 00m";
  const rawFee = typeof fee === "string" ? parseFloat(fee.replace(/[^0-9.]/g, "")) : parseFloat(fee) || 50.00;
  const payMethod = payment_method || "Cash";
  const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

  try {
    let slotToFree = slot_number;
    let ownerName = customer_name;
    let ownerEmail = customer_email;
    let ownerPhone = customer_phone;
    let entryDate = new Date(Date.now() - 3600000);

    const vehQuery = await pool.query("SELECT * FROM vehicles WHERE vehicle_number = $1", [vehicle_number.toUpperCase()]);
    if (vehQuery.rowCount > 0) {
      const v = vehQuery.rows[0];
      slotToFree = slotToFree || v.current_slot;
      ownerName = ownerName || v.owner_name;
      ownerEmail = ownerEmail || v.owner_email;
      ownerPhone = ownerPhone || v.owner_phone;
    }

    const histQuery = await pool.query(
      "SELECT * FROM vehicle_history WHERE vehicle_number = $1 AND (exit_time IS NULL OR status = 'Parked') ORDER BY entry_time DESC LIMIT 1",
      [vehicle_number.toUpperCase()]
    );
    if (histQuery.rowCount > 0) {
      entryDate = new Date(histQuery.rows[0].entry_time);
      slotToFree = slotToFree || histQuery.rows[0].slot_number;
    }

    if (slotToFree) {
      await pool.query(
        "UPDATE parking_slots SET status = 'available', is_available = true WHERE slot_number = $1",
        [slotToFree]
      );
    }

    await pool.query(
      "UPDATE vehicles SET status = 'Checked Out' WHERE vehicle_number = $1",
      [vehicle_number.toUpperCase()]
    );

    await pool.query(
      `UPDATE vehicle_history 
       SET exit_time = $1, duration = $2, fee = $3, status = 'Completed' 
       WHERE vehicle_number = $4 AND (exit_time IS NULL OR status = 'Parked')`,
      [exitDate, dur, `₹${rawFee.toFixed(2)}`, vehicle_number.toUpperCase()]
    );

    const paymentInsert = await pool.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, payment_method, method, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Completed', CURRENT_TIMESTAMP) RETURNING *`,
      [
        txnId,
        vehicle_number.toUpperCase(),
        ownerName || "Customer",
        ownerEmail || "customer@shnoor.com",
        ownerPhone || "+91 98765 43210",
        slotToFree || "A-01",
        entryDate,
        exitDate,
        dur,
        rawFee,
        payMethod,
        payMethod
      ]
    );

    const exitCustEmail = ownerEmail || "customer@shnoor.com";
    await notifyUser(exitCustEmail, {
      title: "Parking Completed",
      message: `Your parking session for vehicle ${vehicle_number.toUpperCase()} has been completed.`,
      type: "parking"
    });
    await notifyUser(exitCustEmail, {
      title: "Receipt Available",
      message: "Your digital parking receipt is now available.",
      type: "receipt"
    });
    await notifyStaff({
      title: "Vehicle Exit",
      message: `Vehicle ${vehicle_number.toUpperCase()} exited slot ${slotToFree || ''}.`,
      type: "parking"
    });
    await notifyAdmins({
      title: "Important Parking Activity",
      message: `Vehicle ${vehicle_number.toUpperCase()} exited slot ${slotToFree || ''}.`,
      type: "parking"
    });

    try {
      await sendParkingSessionCompletedEmail({
        vehicleNumber: vehicle_number.toUpperCase(),
        slotNumber: slotToFree || "Assigned Bay",
        entryTime: entryDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        exitTime: exitDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        duration: dur,
        fee: `₹${rawFee.toFixed(2)}`,
        paymentMethod: payMethod,
        recipient: exitCustEmail
      });
      await sendDigitalReceiptEmail({
        receiptNumber: txnId,
        amount: rawFee,
        vehicleNumber: vehicle_number.toUpperCase(),
        slotNumber: slotToFree || "Assigned Bay",
        duration: dur,
        recipient: exitCustEmail
      });
    } catch (e) {
      console.error(e);
    }

    res.status(200).json({
      success: true,
      message: `Vehicle ${vehicle_number.toUpperCase()} checked out successfully. Bay ${slotToFree || ''} is now available.`,
      exitRecord: {
        transaction_id: txnId,
        vehicle_number: vehicle_number.toUpperCase(),
        slot_number: slotToFree,
        customer_name: ownerName,
        entry_time: entryDate.toISOString(),
        exit_time: exitDate.toISOString(),
        duration: dur,
        fee: `₹${rawFee.toFixed(2)}`,
        payment_method: payMethod,
        status: "Completed"
      },
      receipt: paymentInsert.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error completing vehicle exit" });
  }
});

app.post("/api/parking/calculate-fee", async (req, res) => {
  const { vehicle_type, zone, entry_time, exit_time, duration_hours } = req.body;
  try {
    let hourlyRate = 50;
    const vType = (vehicle_type || "car").toLowerCase();
    const zName = (zone || "zone a").toLowerCase();

    if (vType === "bike" || zName.includes("zone d") || zName.includes("bike")) {
      hourlyRate = 25;
    } else if (vType === "ev" || vType === "vip" || zName.includes("zone c") || zName.includes("ev")) {
      hourlyRate = 80;
    } else if (vType === "suv") {
      hourlyRate = 60;
    }

    let billedHours = 1;
    let durationStr = "1h 00m";

    if (duration_hours !== undefined && duration_hours !== null && duration_hours !== "") {
      billedHours = Math.max(1, Math.ceil(parseFloat(duration_hours) || 1));
      const totalMins = Math.round(parseFloat(duration_hours) * 60);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      durationStr = `${h}h ${m}m`;
    } else if (entry_time) {
      const entry = new Date(entry_time);
      const exit = exit_time ? new Date(exit_time) : new Date();
      const diffMs = Math.max(0, exit - entry);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      billedHours = Math.max(1, Math.ceil(diffMins / 60));
    }

    const subtotal = billedHours * hourlyRate;
    const gstAmount = parseFloat((subtotal * 0.18).toFixed(2));
    const totalPayable = parseFloat((subtotal + gstAmount).toFixed(2));

    res.json({
      success: true,
      calculation: {
        vehicle_type: vehicle_type || "Car",
        zone: zone || "Zone A",
        hourly_rate: hourlyRate,
        hourly_rate_display: `₹${hourlyRate}.00 / hr`,
        billed_hours: billedHours,
        duration: durationStr,
        base_fare: subtotal,
        base_fare_display: `₹${subtotal.toFixed(2)}`,
        gst_rate: "18%",
        gst_amount: gstAmount,
        gst_amount_display: `₹${gstAmount.toFixed(2)}`,
        total_payable: totalPayable,
        total_payable_display: `₹${totalPayable.toFixed(2)}`,
        standard_total_display: `₹${subtotal.toFixed(2)}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error calculating fee" });
  }
});

app.get("/api/customer/parking-history", async (req, res) => {
  const { email, name } = req.query;
  try {
    let query = `
      SELECT 
        vh.id,
        vh.vehicle_number,
        vh.slot_number,
        vh.entry_time,
        vh.exit_time,
        vh.duration,
        vh.fee,
        vh.status,
        vh.created_at,
        COALESCE(v.vehicle_type, 'Car') as vehicle_type,
        COALESCE(v.model, 'Standard') as model,
        COALESCE(v.owner_name, 'Laiba') as owner_name,
        COALESCE(v.owner_email, 'customer@shnoor.com') as owner_email,
        COALESCE(ps.zone, 'Zone A') as zone,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        p.transaction_id,
        p.payment_method
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON vh.vehicle_number = v.vehicle_number
      LEFT JOIN parking_slots ps ON vh.slot_number = ps.slot_number
      LEFT JOIN payments p ON vh.vehicle_number = p.vehicle_number
      WHERE 1=1
    `;
    const params = [];

    if (email) {
      params.push(email.toLowerCase());
      query += ` AND (LOWER(COALESCE(v.owner_email, '')) = $${params.length} OR LOWER(COALESCE(p.customer_email, '')) = $${params.length})`;
    } else if (name) {
      params.push(`%${name.toLowerCase()}%`);
      query += ` AND (LOWER(COALESCE(v.owner_name, '')) LIKE $${params.length} OR LOWER(COALESCE(p.customer_name, '')) LIKE $${params.length})`;
    }

    query += " ORDER BY vh.entry_time DESC";

    const histRes = await pool.query(query, params);
    const rows = histRes.rows;

    const uniqueRows = [];
    const seenIds = new Set();
    rows.forEach((r) => {
      if (!seenIds.has(r.id)) {
        seenIds.add(r.id);
        uniqueRows.push(r);
      }
    });

    res.json({ success: true, count: uniqueRows.length, history: uniqueRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer parking history" });
  }
});

app.get("/api/bookings", async (req, res) => {
  const { search, status } = req.query;
  try {
    let query = "SELECT * FROM reservations WHERE 1=1";
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      query += ` AND (LOWER(booking_id) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(vehicle_number) LIKE $${params.length} OR LOWER(slot_number) LIKE $${params.length} OR LOWER(validation_code) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      query += ` AND LOWER(status) = LOWER($${params.length})`;
    }

    query += " ORDER BY id DESC";

    const result = await pool.query(query, params);
    const allRes = await pool.query("SELECT * FROM reservations");
    const allRows = allRes.rows;

    const total = allRows.length;
    const confirmed = allRows.filter((r) => (r.status || "").toLowerCase() === "confirmed").length;
    const pending = allRows.filter((r) => (r.status || "").toLowerCase() === "pending").length;
    const checkedIn = allRows.filter((r) => (r.status || "").toLowerCase().includes("check") || (r.status || "").toLowerCase() === "validated").length;
    const totalRevenue = allRows.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

    res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows,
      stats: {
        total,
        confirmed,
        pending,
        checkedIn,
        totalRevenue: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalRevenueNumeric: totalRevenue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching bookings" });
  }
});

app.get("/api/customer/reservations", async (req, res) => {
  const { email, name } = req.query;
  try {
    let query = "SELECT * FROM reservations WHERE 1=1";
    const params = [];

    if (email) {
      params.push(email.toLowerCase().trim());
      query += ` AND (LOWER(COALESCE(customer_email, '')) = $${params.length} OR LOWER(COALESCE(customer_name, '')) = $${params.length})`;
    } else if (name) {
      params.push(`%${name.toLowerCase().trim()}%`);
      query += ` AND LOWER(COALESCE(customer_name, '')) LIKE $${params.length}`;
    }

    query += " ORDER BY id DESC";
    const result = await pool.query(query, params);

    if (result.rowCount === 0 && (email || name)) {
      const allRes = await pool.query("SELECT * FROM reservations ORDER BY id DESC LIMIT 10");
      return res.json({ success: true, count: allRes.rows.length, reservations: allRes.rows });
    }

    res.json({ success: true, count: result.rows.length, reservations: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer reservations" });
  }
});

app.post("/api/customer/reserve-slot", async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    vehicle_number,
    vehicle_type,
    model,
    slot_number,
    zone,
    start_time,
    end_time,
    duration_hours,
    total_amount,
    plan_code,
    plan_name
  } = req.body;

  if (!customer_name || !vehicle_number || !slot_number) {
    return res.status(400).json({ error: "Customer name, vehicle plate, and slot are required" });
  }

  const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
  const valCode = `VAL-${Math.floor(1000 + Math.random() * 9000)}`;
  const vPlate = vehicle_number.trim().toUpperCase();
  const vType = vehicle_type || "Car";
  const vModel = model || "Standard";
  const sTime = start_time ? new Date(start_time) : new Date();
  const durHours = parseFloat(duration_hours) || 2;
  const eTime = end_time ? new Date(end_time) : new Date(sTime.getTime() + durHours * 3600000);
  const amountNum = parseFloat(total_amount) || (durHours * 50);

  try {
    const insertRes = await pool.query(
      `INSERT INTO reservations (
        booking_id, customer_name, customer_email, customer_phone, vehicle_number,
        vehicle_type, model, slot_number, zone, start_time, end_time, duration_hours,
        total_amount, status, validation_code, plan_code, plan_name, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Confirmed', $14, $15, $16, CURRENT_TIMESTAMP) RETURNING *`,
      [
        bookingId,
        customer_name,
        customer_email || "customer@shnoor.com",
        customer_phone || "+91 98765 43210",
        vPlate,
        vType,
        vModel,
        slot_number,
        zone || "Zone A",
        sTime,
        eTime,
        durHours,
        amountNum,
        valCode,
        plan_code || "PLAN-STD",
        plan_name || "Standard Parking"
      ]
    );

    await pool.query(
      "UPDATE parking_slots SET status = 'reserved', is_available = false WHERE slot_number = $1",
      [slot_number]
    );

    const existVeh = await pool.query("SELECT * FROM vehicles WHERE vehicle_number = $1", [vPlate]);
    if (existVeh.rowCount === 0) {
      await pool.query(
        "INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot) VALUES ($1, $2, $3, $4, $5, $6, 'Reserved', $7)",
        [vPlate, vType, vModel, customer_name, customer_email || "customer@shnoor.com", customer_phone || "+91 98765 43210", slot_number]
      );
    }

    const custEmail = customer_email || "customer@shnoor.com";
    await notifyUser(custEmail, {
      title: "Reservation Confirmed",
      message: `Your parking slot ${slot_number} has been reserved.`,
      type: "reservation"
    });
    await notifyStaff({
      title: "New Reservation",
      message: `New reservation #${bookingId} for vehicle ${vPlate} at slot ${slot_number}.`,
      type: "reservation"
    });
    await notifyStaff({
      title: "Reservation Requires Validation",
      message: `Reservation #${bookingId} is scheduled and requires check-in validation upon arrival.`,
      type: "reservation"
    });
    await notifyAdmins({
      title: "New Reservation",
      message: `New reservation #${bookingId} for vehicle ${vPlate} at slot ${slot_number}.`,
      type: "reservation"
    });
    try {
      const adminEmails = await getActiveAdminEmails();
      await sendReservationConfirmedEmail({
        reservation: insertRes.rows[0],
        recipient: custEmail
      });
      await sendAdminReservationUpdateEmail({
        title: "New Reservation Created",
        message: `New reservation #${bookingId} created for vehicle ${vPlate} at slot ${slot_number}.`,
        booking: insertRes.rows[0],
        adminEmails
      });
    } catch (e) {
      console.error(e);
    }

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for ${vPlate} at slot ${slot_number}`,
      booking: insertRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating reservation" });
  }
});

app.post("/api/staff/validate-reservation", async (req, res) => {
  const { booking_id, validation_code, code, vehicle_number, validated_by } = req.body;
  const valCode = validation_code || code;

  if (!booking_id && !valCode && !vehicle_number) {
    return res.status(400).json({ error: "Booking ID, validation code, or vehicle plate is required" });
  }

  try {
    let query = "SELECT * FROM reservations WHERE 1=1";
    const params = [];

    if (booking_id) {
      params.push(booking_id.trim());
      query += ` AND LOWER(booking_id) = LOWER($${params.length})`;
    } else if (valCode) {
      params.push(valCode.trim());
      query += ` AND LOWER(validation_code) = LOWER($${params.length})`;
    } else if (vehicle_number) {
      params.push(vehicle_number.trim());
      query += ` AND LOWER(vehicle_number) = LOWER($${params.length}) AND LOWER(status) != 'cancelled'`;
    }

    query += " ORDER BY id DESC LIMIT 1";

    const findRes = await pool.query(query, params);
    if (findRes.rowCount === 0) {
      return res.status(404).json({ error: "Reservation not found or invalid validation credentials" });
    }

    const booking = findRes.rows[0];

    if ((booking.status || "").toLowerCase() === "checked in") {
      return res.json({
        success: true,
        alreadyValidated: true,
        message: `Booking ${booking.booking_id} was already validated & checked in.`,
        validatedBooking: booking
      });
    }

    const now = new Date();
    const updatedRes = await pool.query(
      `UPDATE reservations 
       SET status = 'Checked In', validated_at = $1, validated_by = $2 
       WHERE id = $3 RETURNING *`,
      [now, validated_by || "Staff Operator", booking.id]
    );

    await pool.query(
      "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE slot_number = $1",
      [booking.slot_number]
    );

    await pool.query(
      `UPDATE vehicles 
       SET status = 'Parked', current_slot = $1, owner_name = $2, owner_email = $3, owner_phone = $4, vehicle_type = $5 
       WHERE vehicle_number = $6`,
      [booking.slot_number, booking.customer_name, booking.customer_email, booking.customer_phone, booking.vehicle_type, booking.vehicle_number]
    );

    await pool.query(
      `INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, exit_time, duration, fee, status)
       VALUES ($1, $2, $3, NULL, 'Ongoing', $4, 'Parked')`,
      [booking.vehicle_number, booking.slot_number, now, `₹${parseFloat(booking.total_amount).toFixed(2)}`]
    );

    if (booking.customer_email) {
      await notifyUser(booking.customer_email, {
        title: "Reservation Validated",
        message: `Your reservation #${booking.booking_id} has been validated at the gate.`,
        type: "reservation"
      });
      await notifyUser(booking.customer_email, {
        title: "Parking Session Started",
        message: `Your parking session for vehicle ${booking.vehicle_number} has started at bay ${booking.slot_number}.`,
        type: "parking"
      });
      try {
        await sendReservationValidatedEmail({
          reservation: booking,
          recipient: booking.customer_email
        });
        await sendParkingSessionStartedEmail({
          vehicleNumber: booking.vehicle_number,
          slotNumber: booking.slot_number,
          recipient: booking.customer_email
        });
      } catch (e) {
        console.error(e);
      }
    }

    await notifyStaff({
      title: "Important Parking/Operational Update",
      message: `Bay ${booking.slot_number} checked in for ${booking.vehicle_number}.`,
      type: "parking"
    });
    await notifyAdmins({
      title: "Important Reservation Update",
      message: `Reservation #${booking.booking_id} validated by staff.`,
      type: "reservation"
    });
    await notifyAdmins({
      title: "Important Parking Activity",
      message: `Vehicle ${booking.vehicle_number} checked in to bay ${booking.slot_number}.`,
      type: "parking"
    });
    try {
      const adminEmails = await getActiveAdminEmails();
      await sendAdminReservationUpdateEmail({
        title: "Reservation Validated",
        message: `Reservation #${booking.booking_id} validated by staff. Vehicle ${booking.vehicle_number} checked into bay ${booking.slot_number}.`,
        booking,
        adminEmails
      });
    } catch (e) {
      console.error(e);
    }

    res.json({
      success: true,
      message: `Reservation ${booking.booking_id} validated successfully. Vehicle ${booking.vehicle_number} checked in to bay ${booking.slot_number}.`,
      validatedBooking: updatedRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error validating reservation" });
  }
});

app.put("/api/admin/bookings/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }

  try {
    const updateRes = await pool.query(
      "UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const updatedBooking = updateRes.rows[0];

    if (status.toLowerCase() === "cancelled") {
      await pool.query(
        "UPDATE parking_slots SET status = 'available', is_available = true WHERE slot_number = $1",
        [updatedBooking.slot_number]
      );
      if (updatedBooking.customer_email) {
        await notifyUser(updatedBooking.customer_email, {
          title: "Reservation Cancelled",
          message: `Your reservation #${updatedBooking.booking_id} has been cancelled.`,
          type: "reservation"
        });
        try {
          await sendReservationCancelledEmail({
            reservation: updatedBooking,
            recipient: updatedBooking.customer_email
          });
        } catch (e) {
          console.error(e);
        }
      }
      await notifyStaff({
        title: "Important Parking/Operational Update",
        message: `Reservation #${updatedBooking.booking_id} has been cancelled. Bay ${updatedBooking.slot_number} is now available.`,
        type: "reservation"
      });
      await notifyAdmins({
        title: "Important Reservation Update",
        message: `Reservation #${updatedBooking.booking_id} was cancelled.`,
        type: "reservation"
      });
      try {
        const adminEmails = await getActiveAdminEmails();
        await sendAdminReservationUpdateEmail({
          title: "Reservation Cancelled",
          message: `Reservation #${updatedBooking.booking_id} for bay ${updatedBooking.slot_number} has been cancelled.`,
          booking: updatedBooking,
          adminEmails
        });
      } catch (e) {
        console.error(e);
      }
    } else if (status.toLowerCase() === "confirmed") {
      await pool.query(
        "UPDATE parking_slots SET status = 'reserved', is_available = false WHERE slot_number = $1",
        [updatedBooking.slot_number]
      );
      if (updatedBooking.customer_email) {
        await notifyUser(updatedBooking.customer_email, {
          title: "Reservation Confirmed",
          message: `Your reservation ${updatedBooking.booking_id} for bay ${updatedBooking.slot_number} has been confirmed.`,
          type: "reservation"
        });
      }
      await notifyStaff({
        title: "Reservation Confirmed by Admin",
        message: `Booking ${updatedBooking.booking_id} (${updatedBooking.slot_number}) was confirmed by Admin.`,
        type: "reservation"
      });
    } else if (status.toLowerCase() === "checked in") {
      await pool.query(
        "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE slot_number = $1",
        [updatedBooking.slot_number]
      );
      if (updatedBooking.customer_email) {
        await notifyUser(updatedBooking.customer_email, {
          title: "Checked In Successfully",
          message: `Your vehicle ${updatedBooking.vehicle_number} has been checked into bay ${updatedBooking.slot_number}.`,
          type: "vehicle"
        });
      }
    }


    res.json({
      success: true,
      message: `Booking ${updatedBooking.booking_id} status updated to ${status}`,
      booking: updatedBooking
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating booking status" });
  }
});


app.get("/api/pricing-plans", async (req, res) => {
  const { active, vehicle_type, billing_type, search } = req.query;
  try {
    let query = "SELECT * FROM pricing_plans WHERE 1=1";
    const params = [];

    if (active === "true") {
      query += " AND is_active = true";
    } else if (active === "false") {
      query += " AND is_active = false";
    }

    if (vehicle_type && vehicle_type !== "All") {
      params.push(vehicle_type);
      query += ` AND (LOWER(vehicle_type) = LOWER($${params.length}) OR LOWER(vehicle_type) = 'all')`;
    }

    if (billing_type && billing_type !== "All") {
      params.push(billing_type);
      query += ` AND LOWER(billing_type) = LOWER($${params.length})`;
    }

    if (search) {
      params.push(`%${search.trim()}%`);
      query += ` AND (plan_name ILIKE $${params.length} OR plan_code ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    query += " ORDER BY id ASC";
    const plansRes = await pool.query(query, params);

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
        COUNT(CASE WHEN billing_type = 'Hourly' THEN 1 END) as hourly_count,
        COUNT(CASE WHEN billing_type = 'Daily' THEN 1 END) as daily_count
      FROM pricing_plans
    `);

    const stats = statsRes.rows[0] || {};

    res.json({
      success: true,
      count: plansRes.rowCount,
      plans: plansRes.rows,
      stats: {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0,
        hourlyCount: parseInt(stats.hourly_count) || 0,
        dailyCount: parseInt(stats.daily_count) || 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching pricing plans" });
  }
});

app.post("/api/pricing-plans", async (req, res) => {
  const { plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active } = req.body;

  if (!plan_name || !rate) {
    return res.status(400).json({ error: "Plan name and rate are required" });
  }

  const pRate = parseFloat(rate) || 50.00;
  const pDur = duration_hours ? parseFloat(duration_hours) : (billing_type === "Daily" ? 24.00 : 1.00);
  const pActive = is_active !== false;
  const pFeatures = Array.isArray(features) ? features : ["Covered Parking", "CCTV Surveillance"];

  let pCode = (plan_code || "").trim();
  if (!pCode) {
    pCode = `PLAN-${(vehicle_type || "CAR").toUpperCase()}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  } else {
    try {
      const existing = await pool.query("SELECT id FROM pricing_plans WHERE LOWER(plan_code) = LOWER($1)", [pCode]);
      if (existing.rowCount > 0) {
        pCode = `${pCode}-${Date.now().toString().slice(-4)}`;
      }
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const insertRes = await pool.query(
      `INSERT INTO pricing_plans (plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [pCode, plan_name.trim(), vehicle_type || "Car", billing_type || "Hourly", pRate, pDur, description || "", pFeatures, pActive]
    );

    res.status(201).json({
      success: true,
      message: `Pricing plan "${plan_name}" created successfully`,
      plan: insertRes.rows[0]
    });

    (async () => {
      await notifyCustomersAndStaff({
        title: "New Parking Plan Available",
        message: `A new parking plan "${plan_name}" has been added. Check the Pricing section for details.`,
        type: "pricing"
      });
      await notifyStaff({
        title: "Important Parking/Operational Update",
        message: `A new parking plan "${plan_name}" has been added.`,
        type: "pricing"
      });
      await notifyAdmins({
        title: "Pricing Update",
        message: `New pricing plan "${plan_name}" was published.`,
        type: "pricing"
      });
      try {
        const customerEmails = await getActiveCustomerEmails();
        const adminEmails = await getActiveAdminEmails();
        await sendNewParkingPlanEmail({
          plan: insertRes.rows[0],
          recipients: customerEmails
        });
        await sendAdminSystemUpdateEmail({
          title: "New Pricing Plan Published",
          message: `Pricing plan "${plan_name}" was created.`,
          details: `Rate: ₹${pRate.toFixed(2)}`,
          adminEmails
        });
      } catch (e) {
        console.error(e);
      }
    })().catch(console.error);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating pricing plan" });
  }
});

app.put("/api/pricing-plans/:id", async (req, res) => {
  const { id } = req.params;
  const { plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active } = req.body;

  try {
    const pRate = parseFloat(rate) || 50.00;
    const pDur = duration_hours ? parseFloat(duration_hours) : (billing_type === "Daily" ? 24.00 : 1.00);
    const pActive = is_active !== false;
    const pFeatures = Array.isArray(features) ? features : ["Covered Parking", "CCTV Surveillance"];

    const updateRes = await pool.query(
      `UPDATE pricing_plans 
       SET plan_code = COALESCE($1, plan_code), plan_name = $2, vehicle_type = $3, billing_type = $4, rate = $5, duration_hours = $6, description = $7, features = $8, is_active = $9
       WHERE id = $10 RETURNING *`,
      [plan_code || null, plan_name, vehicle_type, billing_type, pRate, pDur, description, pFeatures, pActive, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    res.json({
      success: true,
      message: `Pricing plan "${plan_name}" updated successfully`,
      plan: updateRes.rows[0]
    });

    (async () => {
      await notifyCustomersAndStaff({
        title: "Parking Plan Updated",
        message: `The "${plan_name}" parking plan has been updated.`,
        type: "pricing"
      });
      await notifyStaff({
        title: "Important Parking/Operational Update",
        message: `The "${plan_name}" parking plan has been updated.`,
        type: "pricing"
      });
      await notifyAdmins({
        title: "Pricing Update",
        message: `The "${plan_name}" parking plan has been updated.`,
        type: "pricing"
      });
      try {
        const customerEmails = await getActiveCustomerEmails();
        const adminEmails = await getActiveAdminEmails();
        await sendPricingPlanUpdatedEmail({
          plan: updateRes.rows[0],
          recipients: customerEmails
        });
        await sendAdminSystemUpdateEmail({
          title: "Pricing Plan Updated",
          message: `Pricing plan "${plan_name}" was updated.`,
          adminEmails
        });
      } catch (e) {
        console.error(e);
      }
    })().catch(console.error);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating pricing plan" });
  }
});

app.patch("/api/pricing-plans/:id/status", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    const updateRes = await pool.query(
      "UPDATE pricing_plans SET is_active = $1 WHERE id = $2 RETURNING *",
      [Boolean(is_active), id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    const plan = updateRes.rows[0];

    res.json({
      success: true,
      message: `Plan "${plan.plan_name}" status updated to ${is_active ? "Active" : "Inactive"}`,
      plan
    });

    (async () => {
      await notifyCustomersAndStaff({
        title: "Parking Plan Updated",
        message: `The "${plan.plan_name}" parking plan has been updated.`,
        type: "pricing"
      });
      await notifyStaff({
        title: "Important Parking/Operational Update",
        message: `Pricing plan "${plan.plan_name}" status changed to ${is_active ? "Active" : "Inactive"}.`,
        type: "pricing"
      });
      await notifyAdmins({
        title: "Pricing Update",
        message: `Pricing plan "${plan.plan_name}" status changed to ${is_active ? "Active" : "Inactive"}.`,
        type: "pricing"
      });
      try {
        const customerEmails = await getActiveCustomerEmails();
        const adminEmails = await getActiveAdminEmails();
        await sendPricingPlanUpdatedEmail({
          plan,
          recipients: customerEmails
        });
        await sendAdminSystemUpdateEmail({
          title: "Pricing Plan Status Updated",
          message: `Pricing plan "${plan.plan_name}" status changed to ${is_active ? "Active" : "Inactive"}.`,
          adminEmails
        });
      } catch (e) {
        console.error(e);
      }
    })().catch(console.error);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating plan status" });
  }
});

app.delete("/api/pricing-plans/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await pool.query("DELETE FROM pricing_plans WHERE id = $1 RETURNING *", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    const plan = delRes.rows[0];

    res.json({
      success: true,
      message: `Pricing plan "${plan.plan_name}" deleted successfully`
    });

    (async () => {
      await notifyCustomersAndStaff({
        title: "Parking Plan Updated",
        message: `Pricing plan "${plan.plan_name}" has been removed.`,
        type: "pricing"
      });
      await notifyStaff({
        title: "Important Parking/Operational Update",
        message: `Pricing plan "${plan.plan_name}" has been removed.`,
        type: "pricing"
      });
      await notifyAdmins({
        title: "Important System Activity",
        message: `Pricing plan "${plan.plan_name}" was deleted.`,
        type: "pricing"
      });
      try {
        const adminEmails = await getActiveAdminEmails();
        await sendAdminSystemUpdateEmail({
          title: "Pricing Plan Deleted",
          message: `Pricing plan "${plan.plan_name}" has been deleted.`,
          adminEmails
        });
      } catch (e) {
        console.error(e);
      }
    })().catch(console.error);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting pricing plan" });
  }
});



app.get("/api/support-tickets", async (req, res) => {
  const { email } = req.query;
  try {
    let query = "SELECT * FROM support_tickets";
    const params = [];
    if (email) {
      params.push(email.toLowerCase());
      query += " WHERE LOWER(customer_email) = $1";
    }
    query += " ORDER BY created_at DESC";
    const result = await pool.query(query, params);
    res.json({ success: true, tickets: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching support tickets" });
  }
});

app.post("/api/support-tickets", async (req, res) => {
  const { customer_name, customer_email, subject, category, description, priority } = req.body;
  if (!subject || !customer_email) {
    return res.status(400).json({ error: "Subject and customer email are required" });
  }

  try {
    const ticket_code = `TCK-${Math.floor(8822 + Math.random() * 900)}`;
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const initialMessages = [
      {
        sender: customer_name || "Customer",
        text: description || subject,
        time: nowStr
      }
    ];

    const insertRes = await pool.query(
      `INSERT INTO support_tickets (ticket_code, customer_name, customer_email, subject, category, description, priority, status, messages)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        ticket_code,
        customer_name || "Customer",
        customer_email,
        subject,
        category || "General Query",
        description || "",
        priority || "Normal",
        "Open",
        JSON.stringify(initialMessages)
      ]
    );

    await notifyStaffAndAdmins({
      title: "New Support Ticket",
      message: `Ticket ${ticket_code} submitted by ${customer_name || customer_email}: "${subject}".`,
      type: "support"
    });

    await notifyUser(customer_email, {
      title: "Support Ticket Received",
      message: `Your support ticket ${ticket_code} ("${subject}") has been received. Our team will review it shortly.`,
      type: "support"
    });

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      ticket: insertRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating support ticket" });
  }
});

app.put("/api/support-tickets/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updateRes = await pool.query(
      "UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2 OR ticket_code = $2 RETURNING *",
      [status || "Resolved", id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    const ticket = updateRes.rows[0];
    if (ticket.customer_email) {
      await notifyUser(ticket.customer_email, {
        title: `Ticket ${ticket.ticket_code} Status Updated`,
        message: `Your ticket has been marked as "${status}".`,
        type: "support"
      });
    }

    res.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating ticket status" });
  }
});

app.put("/api/support-tickets/:id/priority", async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  try {
    const updateRes = await pool.query(
      "UPDATE support_tickets SET priority = $1, updated_at = CURRENT_TIMESTAMP WHERE id::text = $2 OR ticket_code = $2 RETURNING *",
      [priority || "Normal", id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    res.json({
      success: true,
      message: `Ticket priority updated to ${priority}`,
      ticket: updateRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating ticket priority" });
  }
});

app.put("/api/support-tickets/:id", async (req, res) => {
  const { id } = req.params;
  const { status, priority, category, subject } = req.body;

  try {
    const findRes = await pool.query(
      "SELECT * FROM support_tickets WHERE id::text = $1 OR ticket_code = $1",
      [id]
    );

    if (findRes.rowCount === 0) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    const current = findRes.rows[0];
    const newStatus = status !== undefined ? status : current.status;
    const newPriority = priority !== undefined ? priority : current.priority;
    const newCategory = category !== undefined ? category : current.category;
    const newSubject = subject !== undefined ? subject : current.subject;

    const updateRes = await pool.query(
      "UPDATE support_tickets SET status = $1, priority = $2, category = $3, subject = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
      [newStatus, newPriority, newCategory, newSubject, current.id]
    );

    res.json({
      success: true,
      message: "Ticket updated successfully",
      ticket: updateRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating ticket" });
  }
});

app.delete("/api/support-tickets/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleteRes = await pool.query(
      "DELETE FROM support_tickets WHERE id::text = $1 OR ticket_code = $1 RETURNING *",
      [id]
    );

    if (deleteRes.rowCount === 0) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    res.json({
      success: true,
      message: "Ticket deleted successfully",
      ticket: deleteRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting ticket" });
  }
});

app.post("/api/support-tickets/:id/reply", async (req, res) => {
  const { id } = req.params;
  const { sender, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Reply text is required" });
  }

  try {
    const findRes = await pool.query(
      "SELECT * FROM support_tickets WHERE id::text = $1 OR ticket_code = $1",
      [id]
    );

    if (findRes.rowCount === 0) {
      return res.status(404).json({ error: "Support ticket not found" });
    }

    const ticket = findRes.rows[0];
    const messages = Array.isArray(ticket.messages) ? ticket.messages : (typeof ticket.messages === "string" ? JSON.parse(ticket.messages) : []);
    const nowStr = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    messages.push({
      sender: sender || "Admin Support",
      text,
      time: nowStr
    });

    const updateRes = await pool.query(
      `UPDATE support_tickets 
       SET messages = $1, status = CASE WHEN status = 'Open' THEN 'In Progress' ELSE status END, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [JSON.stringify(messages), ticket.id]
    );

    if (ticket.customer_email) {
      await notifyUser(ticket.customer_email, {
        title: `Reply on Ticket ${ticket.ticket_code}`,
        message: `${sender || "Support"}: ${text.slice(0, 100)}`,
        type: "support"
      });
    }

    res.json({
      success: true,
      message: "Reply sent successfully",
      ticket: updateRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error sending reply" });
  }
});

app.post("/api/customer/activate-premium", async (req, res) => {
  const { user_email, customer_name, plan_name, amount, slot, vehicle } = req.body;
  const email = user_email || "customer@shnoor.com";
  const plan = plan_name || "Monthly VIP Priority Pass";
  const planAmount = parseFloat(amount) || 2500.00;

  try {
    await notifyUser(email, {
      title: "Premium Plan Activated",
      message: `Your Premium parking plan "${plan}" has been activated.`,
      type: "premium"
    });

    await notifyAdmins({
      title: "Important System Activity",
      message: `Customer ${customer_name || email} activated ${plan} (₹${planAmount.toFixed(2)}).`,
      type: "premium"
    });

    try {
      const adminEmails = await getActiveAdminEmails();
      await sendPremiumActivatedEmail({
        customerName: customer_name || "Member",
        planName: plan,
        amount: planAmount,
        recipient: email
      });
      await sendAdminSystemUpdateEmail({
        title: "VIP Membership Subscription",
        message: `Customer ${customer_name || email} subscribed to ${plan}.`,
        details: `Amount: ₹${planAmount.toFixed(2)}`,
        adminEmails
      });
    } catch (e) {
      console.error(e);
    }

    res.json({
      success: true,
      message: `${plan} activated successfully for ${email}`,
      planInfo: {
        active: true,
        plan,
        amount: planAmount,
        slot: slot || "A-01 (VIP Zone)",
        vehicle: vehicle || "KA01 AB 1234",
        validFrom: new Date().toISOString(),
        validUntil: new Date(Date.now() + 30 * 86400000).toISOString()
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error activating premium plan" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});


import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { OAuth2Client } from "google-auth-library";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import notificationRoutes from "./modules/notifications/notificationRoutes.js";
import evChargingRoutes from "./modules/ev/evChargingRoutes.js";
import couponRoutes from "./modules/coupons/couponRoutes.js";
import { recordCouponUsage, validateCoupon } from "./modules/coupons/couponService.js";
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
import {
  logAuditEvent,
  getAuditClientIp,
  getAuditUserAgent
} from "./modules/audit/auditLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

dotenv.config();

const googleOAuthClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "265505874428-n49qnrsvk6tck6bd1bprrp13k36j8n3e.apps.googleusercontent.com"
);

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
app.use("/api", evChargingRoutes);
app.use("/api", couponRoutes);

const getLocalTimestamp = (d = new Date()) => {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) {
    return getLocalTimestamp(new Date());
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const getPart = (type) => (parts.find(p => p.type === type)?.value || "00");
  const padMs = (n) => String(n).padStart(3, "0");
  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")}:${getPart("second")}.${padMs(date.getMilliseconds())}`;
};

function parseToLocalTimestampString(inputDateStr, fallbackDate = new Date()) {
  if (!inputDateStr) {
    return getLocalTimestamp(fallbackDate);
  }
  const str = String(inputDateStr).trim();
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
  if (dmyMatch) {
    const [, d, m, y, h, min, ampm] = dmyMatch;
    let hour = h ? parseInt(h, 10) : 0;
    const minute = min ? parseInt(min, 10) : 0;
    if (ampm) {
      if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
    }
    hour = hour % 24;
    const pad = (n) => String(n).padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)} ${pad(hour)}:${pad(minute)}:00.000`;
  }
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (isoMatch) {
    const [, y, m, d, h, min, s] = isoMatch;
    let hour = h ? parseInt(h, 10) : 0;
    const minute = min ? parseInt(min, 10) : 0;
    const sec = s ? parseInt(s, 10) : 0;
    hour = hour % 24;
    const pad = (n) => String(n).padStart(2, "0");
    return `${y}-${pad(m)}-${pad(d)} ${pad(hour)}:${pad(minute)}:${pad(sec)}.000`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return getLocalTimestamp(parsed);
  }
  return getLocalTimestamp(fallbackDate);
}

function calculateDurationBetween(startInput, endInput) {
  const startStr = parseToLocalTimestampString(startInput);
  const endStr = parseToLocalTimestampString(endInput);
  const start = new Date(startStr.replace(" ", "T"));
  const end = new Date(endStr.replace(" ", "T"));
  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, totalHours: 0, durationStr: "0m", diffMs, startStr, endStr };
  }
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;
  const totalHours = Math.round((diffMs / 3600000) * 100) / 100;
  const durationStr = hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h 00m`) : `${minutes}m`;
  return { hours, minutes, totalHours, durationStr, diffMs, startStr, endStr };
}

async function calculateBookingFeeFromPlan({ planCode, durationHours, vehicleType, client = pool }) {
  let plan = null;
  if (planCode) {
    const res = await client.query("SELECT * FROM pricing_plans WHERE LOWER(plan_code) = LOWER($1)", [planCode]);
    if (res.rowCount > 0) plan = res.rows[0];
  }
  if (!plan && vehicleType) {
    const res = await client.query("SELECT * FROM pricing_plans WHERE LOWER(vehicle_type) = LOWER($1) AND is_active = true ORDER BY id ASC LIMIT 1", [vehicleType]);
    if (res.rowCount > 0) plan = res.rows[0];
  }
  if (!plan) {
    const res = await client.query("SELECT * FROM pricing_plans WHERE is_active = true ORDER BY id ASC LIMIT 1");
    if (res.rowCount > 0) plan = res.rows[0];
  }
  const rate = plan ? parseFloat(plan.rate) : 50;
  const billingType = (plan?.billing_type || "Hourly").toLowerCase();
  let baseAmount = 0;
  const hours = Math.max(0.25, parseFloat(durationHours) || 1);
  if (billingType === "daily") {
    const days = Math.max(1, Math.ceil(hours / 24));
    baseAmount = days * rate;
  } else if (billingType === "monthly") {
    baseAmount = rate;
  } else if (billingType === "flat") {
    baseAmount = rate;
  } else {
    const billedHours = Math.max(1, Math.ceil(hours));
    baseAmount = billedHours * rate;
  }
  return {
    plan,
    rate,
    baseAmount,
    overstayRate: plan?.overstay_rate ? parseFloat(plan.overstay_rate) : rate
  };
}

function calculateOverstayDetails({ scheduledEndTime, actualOrCurrentTime, planOverstayRate, defaultHourlyRate = 50, graceMinutes = 15 }) {
  if (!scheduledEndTime) {
    return {
      isOverstay: false,
      inGracePeriod: false,
      overstayMinutes: 0,
      overstayDuration: "0m",
      billedOverstayHours: 0,
      overstayFee: 0,
      remainingMinutes: 0,
      remainingDuration: "0m"
    };
  }
  const schedEnd = new Date(typeof scheduledEndTime === "string" ? scheduledEndTime.replace(" ", "T") : scheduledEndTime);
  const checkTime = actualOrCurrentTime ? new Date(typeof actualOrCurrentTime === "string" ? actualOrCurrentTime.replace(" ", "T") : actualOrCurrentTime) : new Date();
  const diffMs = checkTime.getTime() - schedEnd.getTime();
  if (diffMs <= 0) {
    const remMs = Math.abs(diffMs);
    const remMins = Math.floor(remMs / 60000);
    const remH = Math.floor(remMins / 60);
    const remM = remMins % 60;
    const remStr = remH > 0 ? (remM > 0 ? `${remH}h ${remM}m` : `${remH}h 00m`) : `${remM}m`;
    return {
      isOverstay: false,
      inGracePeriod: false,
      overstayMinutes: 0,
      overstayDuration: "0m",
      billedOverstayHours: 0,
      overstayFee: 0,
      remainingMinutes: remMins,
      remainingDuration: remStr
    };
  }
  const overstayMinutes = Math.floor(diffMs / 60000);
  const oH = Math.floor(overstayMinutes / 60);
  const oM = overstayMinutes % 60;
  const overstayDuration = oH > 0 ? (oM > 0 ? `${oH}h ${oM}m` : `${oH}h 00m`) : `${oM}m`;
  if (overstayMinutes <= graceMinutes) {
    return {
      isOverstay: true,
      inGracePeriod: true,
      overstayMinutes,
      overstayDuration,
      billedOverstayHours: 0,
      overstayFee: 0,
      remainingMinutes: 0,
      remainingDuration: "0m"
    };
  }
  const billedOverstayHours = Math.max(1, Math.ceil(overstayMinutes / 60));
  const rateToUse = parseFloat(planOverstayRate) > 0 ? parseFloat(planOverstayRate) : (parseFloat(defaultHourlyRate) || 50);
  const overstayFee = billedOverstayHours * rateToUse;
  return {
    isOverstay: true,
    inGracePeriod: false,
    overstayMinutes,
    overstayDuration,
    billedOverstayHours,
    overstayFee,
    remainingMinutes: 0,
    remainingDuration: "0m"
  };
}

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
        google_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '+91 98765 43210';
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
    `);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
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
      ALTER TABLE pricing_plans ADD COLUMN IF NOT EXISTS overstay_rate NUMERIC(10, 2);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS plan_code VARCHAR(50);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS actual_entry_time TIMESTAMP;
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS actual_exit_time TIMESTAMP;
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS overstay_hours NUMERIC(5, 2) DEFAULT 0.00;
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS overstay_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS final_total_amount NUMERIC(10, 2);
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50);
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP;
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP;
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS booked_duration_hours NUMERIC(5, 2);
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS overstay_duration VARCHAR(50);
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS overstay_fee NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS normal_fee NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE vehicle_history ADD COLUMN IF NOT EXISTS final_fee NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'Parking Fee';
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS overstay_amount NUMERIC(10, 2) DEFAULT 0.00;
    `);
    await pool.query("UPDATE pricing_plans SET overstay_rate = rate WHERE overstay_rate IS NULL;");

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

    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS fastag_id VARCHAR(100) DEFAULT 'FASTAG-IND-8842';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS parking_locations (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        address TEXT NOT NULL,
        total_slots INT DEFAULT 50,
        occupied_slots INT DEFAULT 0,
        zones TEXT[] DEFAULT ARRAY['Zone A', 'Zone B'],
        active_staff INT DEFAULT 2,
        opening_hours VARCHAR(100) DEFAULT '24/7 Access',
        rate_multiplier VARCHAR(50) DEFAULT '1.0x (Standard)',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const locCountRes = await pool.query("SELECT COUNT(*) FROM parking_locations");
    if (parseInt(locCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO parking_locations (code, name, address, total_slots, occupied_slots, zones, active_staff, opening_hours, rate_multiplier, status)
        VALUES
          ('LOC-01', 'City Center Multi-Level', 'MG Road, Central Business District, Bengaluru', 120, 84, ARRAY['Zone A', 'Zone B', 'Zone C', 'Zone D'], 6, '24/7 Access', '1.0x (Standard)', 'Active'),
          ('LOC-02', 'Indiranagar Tech Park Hub', '100ft Road, Indiranagar, Bengaluru', 85, 62, ARRAY['Zone A', 'Zone B', 'Zone C'], 4, '06:00 AM - 12:00 AM', '1.2x (Peak Hub)', 'Active'),
          ('LOC-03', 'Koramangala Commercial Bay', '80ft Road, 4th Block, Koramangala, Bengaluru', 60, 48, ARRAY['Zone A', 'Zone B'], 3, '07:00 AM - 11:30 PM', '1.1x (Prime)', 'Active'),
          ('LOC-04', 'Whitefield Metro Station Bay', 'ITPL Main Road, Whitefield, Bengaluru', 150, 95, ARRAY['Zone A', 'Zone B', 'Zone D'], 5, '24/7 Access', '0.9x (Transit)', 'Active'),
          ('LOC-05', 'Airport Transit Terminal B', 'KIA Expressway Terminal 2 Approach, Devanahalli', 200, 140, ARRAY['Zone A', 'Zone B', 'Zone C'], 8, '24/7 Access', '1.5x (Airport)', 'Active'),
          ('LOC-06', 'HSR Layout Sector 1 Park', '27th Main, Sector 1, HSR Layout, Bengaluru', 40, 12, ARRAY['Zone A', 'Zone D'], 2, '08:00 AM - 10:00 PM', '1.0x (Standard)', 'Maintenance')
        ON CONFLICT (code) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const settCountRes = await pool.query("SELECT COUNT(*) FROM system_settings WHERE key = 'general'");
    if (parseInt(settCountRes.rows[0].count) === 0) {
      const defaultSettings = {
        systemName: "Shnoor Smart Parking Management System",
        contactEmail: "support@shnoor.com",
        supportPhone: "+91 80 4567 8900",
        currency: "INR (₹)",
        timezone: "Asia/Kolkata (IST +5:30)",
        operatingHours: "24/7 All Locations",
        maintenanceMode: false,
        autoAssignBays: true,
        overstayGracePeriodMinutes: 15,
        lostTicketFlatFee: 500,
        emailAlerts: true,
        smsAlerts: true,
        whatsappAlerts: false
      };
      await pool.query(
        "INSERT INTO system_settings (key, value) VALUES ('general', $1) ON CONFLICT (key) DO NOTHING",
        [JSON.stringify(defaultSettings)]
      );
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        log_code VARCHAR(50) UNIQUE NOT NULL,
        actor VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'Staff',
        action VARCHAR(100) NOT NULL,
        target VARCHAR(150) NOT NULL,
        severity VARCHAR(50) DEFAULT 'info',
        ip VARCHAR(50) DEFAULT '192.168.1.101',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const auditCountRes = await pool.query("SELECT COUNT(*) FROM audit_logs");
    if (parseInt(auditCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip)
        VALUES
          ('LOG-9042', 'Taj', 'Admin', 'Tariff Plan Updated', 'PLAN-EV-HR (₹80.00/hr)', 'info', '192.168.1.101'),
          ('LOG-9041', 'Laiba Taj', 'Staff', 'Manual Gate Override', 'Gate 2 Boom Barrier (Emergency Exit)', 'warning', '192.168.1.144'),
          ('LOG-9040', 'Laiba Taj', 'Staff', 'Slot Reassignment', 'Vehicle KA01 AB 1234 -> Bay A-02', 'info', '192.168.1.144'),
          ('LOG-9039', 'Taj', 'Admin', 'User Role Modified', 'User arjun@techcorp.in -> Staff', 'info', '192.168.1.101'),
          ('LOG-9038', 'Automated Daemon', 'System', 'Nightly Reconciliation', '24 Bays Audited, 0 Discrepancies', 'info', '127.0.0.1')
        ON CONFLICT (log_code) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff_incidents (
        id SERIAL PRIMARY KEY,
        incident_code VARCHAR(50) UNIQUE NOT NULL,
        reporter VARCHAR(100) NOT NULL,
        incident_type VARCHAR(100) NOT NULL,
        location VARCHAR(150) NOT NULL,
        plate VARCHAR(50),
        notes TEXT NOT NULL,
        severity VARCHAR(50) DEFAULT 'Normal',
        status VARCHAR(50) DEFAULT 'Open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const incCountRes = await pool.query("SELECT COUNT(*) FROM staff_incidents");
    if (parseInt(incCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO staff_incidents (incident_code, reporter, incident_type, location, plate, notes, severity, status)
        VALUES
          ('INC-4401', 'Laiba Taj', 'Overstay Violation', 'Zone A - Bay A-04', 'KA05 IJ 7890', 'Vehicle overstayed by 2 hours beyond reservation window. Notice affixed on windshield.', 'Normal', 'Open'),
          ('INC-4402', 'Laiba Taj', 'Boom Barrier Sensor Misalignment', 'Entry Gate 1', 'N/A', 'RFID tag scanner optical sensor intermittently unresponsive during peak ingress.', 'High', 'Resolved'),
          ('INC-4403', 'Taj', 'EV Charger Port Locked', 'Zone C - Bay C-02', 'KA03 EF 9012', 'DC fast gun locking pin did not disengage automatically upon session completion.', 'Normal', 'Resolved')
        ON CONFLICT (incident_code) DO NOTHING;
      `);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL,
        discount_value NUMERIC(10, 2) NOT NULL,
        minimum_amount NUMERIC(10, 2) DEFAULT 0.00,
        maximum_discount NUMERIC(10, 2),
        usage_type VARCHAR(20) NOT NULL,
        total_usage_limit INT,
        used_count INT DEFAULT 0,
        per_customer_limit INT DEFAULT 1,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
        applicable_to VARCHAR(50) DEFAULT 'All',
        status VARCHAR(20) DEFAULT 'Active',
        created_by VARCHAR(100) DEFAULT 'Admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coupon_usage (
        id SERIAL PRIMARY KEY,
        coupon_id INT REFERENCES coupons(id) ON DELETE CASCADE,
        coupon_code VARCHAR(50) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        customer_name VARCHAR(100),
        booking_id VARCHAR(50),
        charging_session_id VARCHAR(50),
        payment_id VARCHAR(50),
        original_amount NUMERIC(10, 2) NOT NULL,
        discount_amount NUMERIC(10, 2) NOT NULL,
        final_amount NUMERIC(10, 2) NOT NULL,
        service_type VARCHAR(50) DEFAULT 'Normal Parking',
        used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE reservations ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

      ALTER TABLE ev_charging_sessions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
      ALTER TABLE ev_charging_sessions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0.00;
      ALTER TABLE ev_charging_sessions ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);
    `);

    const couponCountRes = await pool.query("SELECT COUNT(*) FROM coupons");
    if (parseInt(couponCountRes.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO coupons (
          code, description, discount_type, discount_value, minimum_amount, maximum_discount,
          usage_type, total_usage_limit, used_count, per_customer_limit,
          start_date, expiry_date, applicable_to, status, created_by
        ) VALUES
          ('PARK20', 'Get 20% off up to ₹50 on parking reservations', 'percentage', 20.00, 100.00, 50.00, 'Limited', 100, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '60 days', 'All', 'Active', 'Admin'),
          ('WELCOME100', 'Welcome bonus ₹100 off on your first parking or charging session', 'fixed', 100.00, 200.00, NULL, 'One-Time', NULL, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '90 days', 'All', 'Active', 'Admin'),
          ('EV50', '₹50 instant rebate on electric vehicle fast charging', 'fixed', 50.00, 150.00, NULL, 'Limited', 50, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '45 days', 'EV Charging', 'Active', 'Admin')
        ON CONFLICT (code) DO NOTHING;
      `);
    }

    await pool.query(`
      UPDATE vehicles 
      SET owner_email = 'customer@shnoor.com', owner_name = 'Customer'
      WHERE (REPLACE(UPPER(vehicle_number), ' ', '') = 'TS01AP1310' OR REPLACE(UPPER(vehicle_number), ' ', '') = 'KA01AB1234')
        AND (owner_email IS NULL OR owner_email = '');
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(LOWER(role));
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(UPPER(vehicle_number));
      CREATE INDEX IF NOT EXISTS idx_vehicles_owner_email ON vehicles(LOWER(owner_email));
      CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_vehicle_history_plate ON vehicle_history(UPPER(vehicle_number));
      CREATE INDEX IF NOT EXISTS idx_vehicle_history_entry_time ON vehicle_history(entry_time DESC);
      CREATE INDEX IF NOT EXISTS idx_vehicle_history_status ON vehicle_history(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_payments_plate ON payments(UPPER(vehicle_number));
      CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(LOWER(customer_email));
      CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(LOWER(customer_email));
      CREATE INDEX IF NOT EXISTS idx_reservations_plate ON reservations(UPPER(vehicle_number));
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_email ON notifications(LOWER(user_email));
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_support_tickets_email ON support_tickets(LOWER(customer_email));
      CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(UPPER(code));
      CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(LOWER(status));
      CREATE INDEX IF NOT EXISTS idx_coupon_usage_email ON coupon_usage(LOWER(customer_email));
      CREATE INDEX IF NOT EXISTS idx_coupon_usage_code ON coupon_usage(UPPER(coupon_code));
    `);

    await pool.query(`
      UPDATE parking_slots
      SET status = 'available', is_available = true
      WHERE status = 'occupied'
        AND slot_number NOT IN (SELECT current_slot FROM vehicles WHERE LOWER(status) = 'parked' AND current_slot IS NOT NULL)
    `);
    await pool.query(`
      UPDATE parking_slots
      SET status = 'occupied', is_available = false
      WHERE slot_number IN (SELECT current_slot FROM vehicles WHERE LOWER(status) = 'parked' AND current_slot IS NOT NULL)
        AND status != 'occupied'
    `);
  } catch (err) {
    console.error("Schema init error:", err);
  }
};

initDbSchema();

app.post("/api/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !name.trim() || !email.trim() || !password.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const dbRole = "customer";

  try {
    const userExist = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    if (userExist.rowCount > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userPhone = phone || "";
    await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status) VALUES ($1, $2, $3, $4, $5, 'Active')",
      [name.trim(), email.trim(), hashedPassword, userPhone, dbRole]
    );

    await notifyAdmins({
      title: "New User Registered",
      message: `New customer registered: ${email.trim()}`,
      type: "user"
    });
    await notifyUser(email.trim(), {
      title: "Welcome to Shnoor Parking",
      message: `Welcome ${name.trim()}! Your account has been registered successfully.`,
      type: "user"
    });
    try {
      await sendAccountCreatedEmail({
        customerName: name.trim(),
        customerEmail: email.trim(),
        role: dbRole,
        phone: userPhone
      });
      const adminEmails = await getActiveAdminEmails();
      await sendNewUserAdminEmail({ customerName: name.trim(), customerEmail: email.trim(), adminEmails });
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

  if (!email || !password || !email.trim() || !password.trim()) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    if (userResult.rowCount === 0) {
      await logAuditEvent({
        userName: email.trim(),
        userEmail: email.trim(),
        role: "Guest",
        action: "Failed Login",
        module: "Authentication",
        entityType: "user",
        description: `Failed login attempt: Email not found (${email.trim()})`,
        severity: "Medium",
        status: "Failed",
        ipAddress: getAuditClientIp(req),
        userAgent: getAuditUserAgent(req)
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const userRole = (user.role || "user").charAt(0).toUpperCase() + (user.role || "user").slice(1);
      await logAuditEvent({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        role: userRole,
        action: "Failed Login",
        module: "Authentication",
        entityType: "user",
        entityId: String(user.id),
        description: `Failed login attempt: Incorrect password for ${user.email}`,
        severity: "Medium",
        status: "Failed",
        ipAddress: getAuditClientIp(req),
        userAgent: getAuditUserAgent(req)
      });
      return res.status(400).json({ error: "Invalid credentials" });
    }

    if (user.status && user.status.toLowerCase() === "inactive") {
      return res.status(403).json({ error: "Account is inactive. Please contact administrator." });
    }

    const formattedRole = (user.role || "user").charAt(0).toUpperCase() + (user.role || "user").slice(1);
    await logAuditEvent({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      role: formattedRole,
      action: `${formattedRole} Login`,
      module: "Authentication",
      entityType: "user",
      entityId: String(user.id),
      description: `${user.name} logged in successfully as ${user.role}`,
      severity: "Low",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        status: user.status || "Active",
        google_id: user.google_id || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.post("/api/logout", async (req, res) => {
  const { email, name, role, id } = req.body || {};
  if (email) {
    const formattedRole = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : "User";
    await logAuditEvent({
      userId: id || null,
      userName: name || email,
      userEmail: email,
      role: formattedRole,
      action: `${formattedRole} Logout`,
      module: "Authentication",
      entityType: "user",
      entityId: id ? String(id) : null,
      description: `${name || email} logged out`,
      severity: "Low",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });
  }
  res.json({ success: true, message: "Logged out successfully" });
});

app.post(["/api/auth/google", "/api/google-login"], async (req, res) => {
  const { credential, access_token } = req.body;

  if (!credential && !access_token) {
    return res.status(401).json({ error: "Google token is required" });
  }

  try {
    let email = "";
    let displayName = "";
    let picture = "";
    let googleId = "";

    if (credential) {
      try {
        const ticket = await googleOAuthClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID || "265505874428-n49qnrsvk6tck6bd1bprrp13k36j8n3e.apps.googleusercontent.com"
        });
        const payload = ticket.getPayload();
        if (payload) {
          googleId = payload.sub || "";
          email = (payload.email || "").trim().toLowerCase();
          displayName = payload.name || payload.given_name || email.split("@")[0];
          picture = payload.picture || "";
        }
      } catch {
        try {
          const gRes = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData && gData.email) {
              googleId = gData.sub || "";
              email = gData.email.trim().toLowerCase();
              displayName = gData.name || gData.given_name || email.split("@")[0];
              picture = gData.picture || "";
            }
          }
        } catch {
          void 0;
        }
      }
    } else if (access_token) {
      try {
        const uRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData && uData.email) {
            googleId = uData.sub || "";
            email = uData.email.trim().toLowerCase();
            displayName = uData.name || uData.given_name || email.split("@")[0];
            picture = uData.picture || "";
          }
        }
      } catch {
        void 0;
      }
    }

    if (!email) {
      return res.status(401).json({ error: "Invalid or expired Google token" });
    }

    let userResult = null;
    if (googleId) {
      userResult = await pool.query("SELECT * FROM users WHERE google_id = $1", [googleId]);
    }
    if (!userResult || userResult.rowCount === 0) {
      userResult = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
    }

    if (userResult.rowCount > 0) {
      const existingUser = userResult.rows[0];

      if (existingUser.role === "staff") {
        return res.status(403).json({
          error: "Google login is available for customers only. Please use your staff credentials."
        });
      }

      if (existingUser.role === "admin") {
        return res.status(403).json({
          error: "Google login is available for customers only. Please use your admin credentials."
        });
      }

      if (googleId && !existingUser.google_id) {
        await pool.query("UPDATE users SET google_id = $1 WHERE id = $2", [googleId, existingUser.id]);
      }

      return res.json({
        success: true,
        isNewUser: false,
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone || "",
          role: "customer",
          status: existingUser.status || "Active",
          google_id: googleId || existingUser.google_id,
          picture: picture || null
        }
      });
    }

    const randomPassword = await bcrypt.hash("google_auth_" + Date.now() + "_" + Math.random(), 10);
    const userPhone = "";

    const insertResult = await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status, google_id) VALUES ($1, $2, $3, $4, 'customer', 'Active', $5) RETURNING id, name, email, phone, role, status, google_id, created_at",
      [displayName, email, randomPassword, userPhone, googleId || null]
    );

    const newUser = insertResult.rows[0];

    await notifyAdmins({
      title: "New User Registered",
      message: `New customer registered via Google: ${email}`,
      type: "user"
    });

    await notifyUser(email, {
      title: "Welcome to Shnoor Parking",
      message: `Welcome ${displayName}! Your account has been registered successfully via Google.`,
      type: "user"
    });

    try {
      await sendAccountCreatedEmail({
        customerName: displayName,
        customerEmail: email,
        role: "customer",
        phone: userPhone
      });
      const adminEmails = await getActiveAdminEmails();
      await sendNewUserAdminEmail({
        customerName: displayName,
        customerEmail: email,
        adminEmails
      });
    } catch (e) {
      console.error(e);
    }

    return res.status(201).json({
      success: true,
      isNewUser: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone || userPhone,
        role: "customer",
        status: newUser.status || "Active",
        google_id: newUser.google_id,
        picture: picture || null
      }
    });
  } catch (err) {
    console.error("Google auth server error:", err);
    return res.status(500).json({ error: "Server error during Google authentication" });
  }
});

app.post("/api/admin/staff", async (req, res) => {
  let adminEmail = req.headers["x-admin-email"] || req.headers["x-user-email"] || req.body.adminEmail || "";
  const authHeader = req.headers["authorization"] || "";
  if (!adminEmail && authHeader) {
    adminEmail = authHeader.replace(/^Bearer\s+/i, "").trim();
  }

  if (!adminEmail) {
    return res.status(401).json({ error: "Unauthorized: Admin authentication required" });
  }

  try {
    const adminResult = await pool.query("SELECT id, name, email, role, status FROM users WHERE LOWER(email) = LOWER($1)", [adminEmail]);
    if (adminResult.rowCount === 0 || (adminResult.rows[0].status && adminResult.rows[0].status.toLowerCase() === "inactive")) {
      return res.status(401).json({ error: "Unauthorized: Invalid or inactive admin account" });
    }

    const adminUser = adminResult.rows[0];
    if (adminUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Administrator privileges required" });
    }

    const { name, email, password, phone, status } = req.body;
    if (!name || !email || !password || !name.trim() || !email.trim() || !password.trim()) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const duplicateCheck = await pool.query("SELECT id FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    if (duplicateCheck.rowCount > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userPhone = phone || "";
    const userStatus = status || "Active";

    const insertResult = await pool.query(
      "INSERT INTO users (name, email, password, phone, role, status) VALUES ($1, $2, $3, $4, 'staff', $5) RETURNING id, name, email, phone, role, status, created_at",
      [name.trim(), email.trim(), hashedPassword, userPhone, userStatus]
    );

    await notifyUser(email.trim(), {
      title: "Staff Account Created",
      message: `Welcome ${name.trim()}! Your staff account has been created by the administrator.`,
      type: "user"
    });

    res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      user: insertResult.rows[0]
    });
  } catch (err) {
    console.error("Staff creation error:", err);
    res.status(500).json({ error: "Server error creating staff account" });
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
  let adminEmail = req.headers["x-admin-email"] || req.headers["x-user-email"] || req.query.adminEmail || req.query.email || "";
  const authHeader = req.headers["authorization"] || "";
  if (!adminEmail && authHeader) {
    adminEmail = authHeader.replace(/^Bearer\s+/i, "").trim();
  }

  if (!adminEmail) {
    return res.status(401).json({ error: "Unauthorized: Admin authentication required" });
  }

  try {
    const adminCheck = await pool.query(
      "SELECT id, email, role, status FROM users WHERE LOWER(email) = LOWER($1)",
      [adminEmail.trim()]
    );
    if (adminCheck.rowCount === 0 || (adminCheck.rows[0].status && adminCheck.rows[0].status.toLowerCase() === "inactive")) {
      return res.status(401).json({ error: "Unauthorized: Invalid or inactive account" });
    }
    if ((adminCheck.rows[0].role || "").toLowerCase() !== "admin") {
      return res.status(403).json({ error: "Forbidden: Administrator privileges required" });
    }

    const [
      slotsRes,
      evSlotsRes,
      usersRes,
      bookRes,
      todayPayRes,
      totalPayRes,
      activeVehRes,
      activeEvSessRes,
      totalVehRes,
      resvBookingsRes,
      entriesRes,
      exitsRes,
      recentResvRes,
      recentPayRes,
      recentVehRes,
      auditRes,
      usersActRes
    ] = await Promise.all([
      pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC"),
      pool.query("SELECT * FROM ev_charging_slots ORDER BY slot_number ASC"),
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM reservations"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS sum FROM payments WHERE (LOWER(payment_status) IN ('completed', 'successful', 'paid', 'success') OR payment_status IS NULL) AND (DATE(created_at) = CURRENT_DATE OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata') OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS sum FROM payments WHERE (LOWER(payment_status) IN ('completed', 'successful', 'paid', 'success') OR payment_status IS NULL)"),
      pool.query("SELECT COUNT(*) FROM vehicles WHERE LOWER(status) = 'parked'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE LOWER(session_status) = 'active'"),
      pool.query("SELECT COUNT(*) FROM vehicles"),
      pool.query("SELECT COUNT(DISTINCT slot_number) FROM reservations WHERE LOWER(status) IN ('confirmed', 'pending') AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)"),
      pool.query("SELECT id, vehicle_number, slot_number, entry_time AS timestamp, 'Vehicle Entry' AS type, CONCAT('Vehicle ', vehicle_number, ' Entered') AS title, CONCAT(vehicle_number, ' entered Slot ', slot_number) AS description FROM vehicle_history WHERE entry_time IS NOT NULL ORDER BY entry_time DESC LIMIT 10"),
      pool.query("SELECT id, vehicle_number, slot_number, exit_time AS timestamp, 'Vehicle Exit' AS type, CONCAT('Vehicle ', vehicle_number, ' Exited') AS title, CONCAT(vehicle_number, ' exited Slot ', slot_number, ' • Duration: ', COALESCE(duration, '1h'), ' • Fee: ', COALESCE(fee, '₹50.00')) AS description FROM vehicle_history WHERE exit_time IS NOT NULL ORDER BY exit_time DESC LIMIT 10"),
      pool.query("SELECT id, booking_id, customer_name, vehicle_number, slot_number, total_amount, status, created_at AS timestamp, CASE WHEN LOWER(status) = 'cancelled' THEN 'Reservation Cancelled' ELSE 'New Reservation' END AS type, CASE WHEN LOWER(status) = 'cancelled' THEN CONCAT('Reservation #', booking_id, ' Cancelled') ELSE CONCAT('Reservation #', booking_id, ' Confirmed') END AS title, CONCAT('Reservation for ', vehicle_number, ' at Slot ', slot_number, ' (₹', total_amount, ')') AS description FROM reservations ORDER BY id DESC LIMIT 10"),
      pool.query("SELECT id, transaction_id, vehicle_number, amount, payment_method, payment_status, created_at AS timestamp, 'Payment Received' AS type, CONCAT('Payment Received: ₹', amount) AS title, CONCAT('₹', amount, ' payment received for ', vehicle_number, ' via ', payment_method) AS description FROM payments WHERE (LOWER(payment_status) IN ('completed', 'successful', 'paid', 'success') OR payment_status IS NULL) ORDER BY id DESC LIMIT 10"),
      pool.query("SELECT id, vehicle_number, model, vehicle_type, owner_name, created_at AS timestamp, 'New Vehicle Added' AS type, CONCAT('New Vehicle Added: ', vehicle_number) AS title, CONCAT(vehicle_number, ' (', model, ' ', vehicle_type, ') added by ', owner_name) AS description FROM vehicles ORDER BY id DESC LIMIT 10"),
      pool.query("SELECT id, log_code, actor, action, target, created_at AS timestamp, CASE WHEN action ILIKE '%slot%' THEN 'Parking Slot Updated' WHEN action ILIKE '%plan%' OR action ILIKE '%tariff%' THEN 'Pricing Plan Updated' ELSE action END AS type, action AS title, CONCAT(target, ' by ', actor) AS description FROM audit_logs ORDER BY id DESC LIMIT 10"),
      pool.query("SELECT id, name, email, role, created_at AS timestamp, 'User Registered' AS type, CONCAT('New User: ', name) AS title, CONCAT(name, ' registered as ', role, ' (', email, ')') AS description FROM users ORDER BY id DESC LIMIT 10")
    ]);

    const normalSlots = slotsRes.rows;
    const evSlots = evSlotsRes.rows;
    const totalSlots = normalSlots.length + evSlots.length;

    const normalAvail = normalSlots.filter(s => (s.status || "").toLowerCase() === "available" || (s.is_available && (s.status || "").toLowerCase() !== "reserved" && (s.status || "").toLowerCase() !== "occupied")).length;
    const evAvail = evSlots.filter(s => (s.status || "").toLowerCase() === "available").length;
    const availableSlots = normalAvail + evAvail;

    const normalOcc = normalSlots.filter(s => (s.status || "").toLowerCase() === "occupied" || (!s.is_available && (s.status || "").toLowerCase() !== "reserved" && (s.status || "").toLowerCase() !== "available")).length;
    const evOcc = evSlots.filter(s => (s.status || "").toLowerCase() === "occupied").length;
    const occupiedSlots = normalOcc + evOcc;

    const normalResv = normalSlots.filter(s => (s.status || "").toLowerCase() === "reserved").length;
    const evResv = evSlots.filter(s => (s.status || "").toLowerCase() === "reserved").length;
    const reservedSlots = normalResv + evResv;

    const chargingSlots = evSlots.filter(s => (s.status || "").toLowerCase() === "charging").length;
    const maintenanceSlots = evSlots.filter(s => (s.status || "").toLowerCase() === "maintenance").length;
    const activeEvSessions = parseInt(activeEvSessRes.rows[0]?.count || 0, 10);

    const activeParkingSessions = parseInt(activeVehRes.rows[0]?.count || 0, 10) + activeEvSessions;
    const totalVehicles = parseInt(totalVehRes.rows[0]?.count || 0, 10);
    const todaysRevenue = parseFloat(todayPayRes.rows[0]?.sum || 0);
    const totalRevenue = parseFloat(totalPayRes.rows[0]?.sum || 0);
    const totalBookings = parseInt(bookRes.rows[0]?.count || 0, 10);
    const totalUsers = parseInt(usersRes.rows[0]?.count || 0, 10);
    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots + chargingSlots) / totalSlots) * 100) : 0;

    const allSlots = [
      ...normalSlots,
      ...evSlots.map(es => ({
        id: `ev-${es.id}`,
        raw_ev_id: es.id,
        slot_number: es.slot_number,
        zone: "Zone EV (Fast Chargers)",
        slot_type: es.charger_type || "EV Fast",
        status: (es.status || "available").toLowerCase(),
        is_available: (es.status || "").toLowerCase() === "available",
        hourly_rate: es.charging_rate || 18.00,
        is_ev: true,
        power_kw: es.power_kw,
        charging_power: es.charging_power,
        connector_type: es.connector_type
      }))
    ];

    const combinedActivities = [
      ...entriesRes.rows.map(r => ({ id: `entry-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...exitsRes.rows.map(r => ({ id: `exit-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...recentResvRes.rows.map(r => ({ id: `res-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...recentPayRes.rows.map(r => ({ id: `pay-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...recentVehRes.rows.map(r => ({ id: `veh-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...auditRes.rows.map(r => ({ id: `audit-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp })),
      ...usersActRes.rows.map(r => ({ id: `usr-${r.id}`, type: r.type, title: r.title, description: r.description, timestamp: r.timestamp }))
    ];

    combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const recentActivity = combinedActivities.slice(0, 15);

    const parkedVehicles = await pool.query(
      "SELECT vehicle_number, current_slot AS slot_number, owner_name AS user_name, status, created_at FROM vehicles WHERE LOWER(status) IN ('parked', 'charging') ORDER BY id DESC"
    );

    res.json({
      success: true,
      totalParkingSlots: totalSlots,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      chargingSlots,
      maintenanceSlots,
      activeEvSessions,
      evChargingSlotsInUse: chargingSlots,
      activeParkingSessions,
      totalVehicles,
      todaysRevenue,
      recentActivity,
      stats: {
        totalParkingSlots: totalSlots,
        totalSlots,
        availableSlots,
        occupiedSlots,
        reservedSlots,
        chargingSlots,
        maintenanceSlots,
        activeEvSessions,
        evChargingSlotsInUse: chargingSlots,
        activeParkingSessions,
        activeParkings: activeParkingSessions,
        totalVehicles,
        todaysRevenue,
        todayRevenue: todaysRevenue,
        totalRevenue,
        totalBookings,
        totalUsers,
        occupancyRate
      },
      slots: allSlots,
      activeSessions: parkedVehicles.rows,
      evStats: {
        activeSessions: activeEvSessions,
        inUse: chargingSlots,
        available: evAvail,
        total: evSlots.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching dashboard overview data" });
  }
});

app.get(["/api/occupancy", "/api/admin/occupancy"], async (req, res) => {
  try {
    const [
      normalSlotsRes,
      evSlotsRes,
      activeVehRes,
      activeEvSessRes,
      resvRes
    ] = await Promise.all([
      pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC"),
      pool.query("SELECT * FROM ev_charging_slots ORDER BY slot_number ASC"),
      pool.query("SELECT vehicle_number, current_slot, owner_name, status, created_at FROM vehicles WHERE LOWER(status) IN ('parked', 'charging')"),
      pool.query("SELECT * FROM ev_charging_sessions WHERE LOWER(session_status) = 'active'"),
      pool.query("SELECT slot_number, customer_name, vehicle_number FROM reservations WHERE LOWER(status) IN ('confirmed', 'pending') AND (end_time IS NULL OR end_time >= CURRENT_TIMESTAMP)")
    ]);

    const normalSlots = normalSlotsRes.rows;
    const evSlots = evSlotsRes.rows;
    const totalSlots = normalSlots.length + evSlots.length;

    const normalAvail = normalSlots.filter(s => (s.status || "").toLowerCase() === "available" || (s.is_available && (s.status || "").toLowerCase() !== "reserved" && (s.status || "").toLowerCase() !== "occupied")).length;
    const evAvail = evSlots.filter(s => (s.status || "").toLowerCase() === "available").length;
    const availableSlots = normalAvail + evAvail;

    const normalOcc = normalSlots.filter(s => (s.status || "").toLowerCase() === "occupied" || (!s.is_available && (s.status || "").toLowerCase() !== "reserved" && (s.status || "").toLowerCase() !== "available")).length;
    const evOcc = evSlots.filter(s => (s.status || "").toLowerCase() === "occupied").length;
    const occupiedSlots = normalOcc + evOcc;

    const normalResv = normalSlots.filter(s => (s.status || "").toLowerCase() === "reserved").length;
    const evResv = evSlots.filter(s => (s.status || "").toLowerCase() === "reserved").length;
    const reservedSlots = normalResv + evResv;

    const chargingSlots = evSlots.filter(s => (s.status || "").toLowerCase() === "charging").length;
    const maintenanceSlots = evSlots.filter(s => (s.status || "").toLowerCase() === "maintenance").length;

    const activeVehMap = new Map();
    activeVehRes.rows.forEach(v => {
      if (v.current_slot) activeVehMap.set(v.current_slot.trim().toUpperCase(), v);
    });

    const activeEvMap = new Map();
    activeEvSessRes.rows.forEach(es => {
      if (es.slot_number) activeEvMap.set(es.slot_number.trim().toUpperCase(), es);
    });

    const unifiedSlots = [
      ...normalSlots.map(s => {
        const v = activeVehMap.get((s.slot_number || "").toUpperCase());
        return {
          id: s.id,
          slot_number: s.slot_number,
          zone: s.zone,
          slot_type: s.slot_type || "Standard",
          status: s.status,
          is_available: s.is_available,
          hourly_rate: s.hourly_rate,
          is_ev: false,
          current_vehicle: v ? v.vehicle_number : null,
          vehicle_owner: v ? v.owner_name : null
        };
      }),
      ...evSlots.map(es => {
        const evSess = activeEvMap.get((es.slot_number || "").toUpperCase());
        const st = (es.status || "available").toLowerCase();
        return {
          id: `ev-${es.id}`,
          raw_ev_id: es.id,
          slot_number: es.slot_number,
          zone: "Zone EV (Fast Chargers)",
          slot_type: es.charger_type || "EV Fast",
          status: st,
          is_available: st === "available",
          hourly_rate: es.charging_rate || 18.00,
          is_ev: true,
          power_kw: es.power_kw,
          charging_power: es.charging_power,
          connector_type: es.connector_type,
          current_vehicle: evSess ? evSess.vehicle_number : null,
          vehicle_owner: evSess ? evSess.customer_name : null,
          energy_consumed: evSess ? evSess.energy_consumed : null
        };
      })
    ];

    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots + chargingSlots) / totalSlots) * 100) : 0;

    res.json({
      success: true,
      totalSlots,
      availableSlots,
      occupiedSlots,
      reservedSlots,
      chargingSlots,
      maintenanceSlots,
      occupancyRate,
      slots: unifiedSlots,
      activeVehicles: activeVehRes.rows,
      evSessions: activeEvSessRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching unified occupancy" });
  }
});

app.get("/api/parking-slots", async (req, res) => {
  const { page, limit, search, zone, status, slot_type, type } = req.query;
  const effectiveType = slot_type || type;
  try {
    let baseQuery = `
      FROM (
        SELECT
          id,
          slot_number,
          zone,
          slot_type,
          LOWER(status) AS status,
          is_available,
          hourly_rate,
          false AS is_ev
        FROM parking_slots
        UNION ALL
        SELECT
          id + 10000 AS id,
          slot_number,
          'Zone EV' AS zone,
          COALESCE(charger_type, 'EV Fast') AS slot_type,
          LOWER(status) AS status,
          (LOWER(status) = 'available') AS is_available,
          charging_rate AS hourly_rate,
          true AS is_ev
        FROM ev_charging_slots
      ) AS unified_slots
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(slot_number) LIKE $${params.length} OR LOWER(zone) LIKE $${params.length} OR LOWER(COALESCE(slot_type, '')) LIKE $${params.length})`;
    }

    if (zone && zone !== "ALL") {
      if (zone === "Zone D" || zone === "Zone D (Bikes)") {
        baseQuery += ` AND (zone = 'Zone D' OR zone = 'Zone D (Bikes)')`;
      } else if (zone === "Zone EV" || zone === "Zone EV (Fast Chargers)" || zone === "Zone E" || zone === "Zone E (EV)" || zone === "Zone E (Fast Chargers)") {
        baseQuery += ` AND (zone = 'Zone EV' OR zone = 'Zone EV (Fast Chargers)' OR zone = 'Zone E' OR zone = 'Zone E (EV)')`;
      } else {
        params.push(zone);
        baseQuery += ` AND zone = $${params.length}`;
      }
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseQuery += ` AND LOWER(status) = $${params.length}`;
    }

    if (effectiveType && effectiveType !== "ALL") {
      params.push(`%${effectiveType.toLowerCase()}%`);
      baseQuery += ` AND LOWER(COALESCE(slot_type, 'standard')) LIKE $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const slotsResult = await pool.query(
        `SELECT * ${baseQuery} ORDER BY slot_number ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        slots: slotsResult.rows,
        data: slotsResult.rows,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const slotsResult = await pool.query(`SELECT * ${baseQuery} ORDER BY slot_number ASC`, params);
    res.json({
      success: true,
      slots: slotsResult.rows,
      data: slotsResult.rows,
      total,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Slot Created",
      module: "Parking Slots",
      entityType: "parking_slot",
      entityId: slot_number,
      description: `Created parking slot ${slot_number} in ${zone} (${slotType}) at ₹${rate}/hr`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

  const isEv = String(id).startsWith("ev-") || (!isNaN(id) && parseInt(id, 10) > 10000) || String(zone).toLowerCase().includes("ev") || String(slot_number).toUpperCase().startsWith("EV-");
  const realId = isEv ? (String(id).startsWith("ev-") ? parseInt(id.replace("ev-", ""), 10) : (!isNaN(id) && parseInt(id, 10) > 10000 ? parseInt(id, 10) - 10000 : parseInt(id, 10))) : parseInt(id, 10);

  try {
    if (isEv) {
      const updateRes = await pool.query(
        "UPDATE ev_charging_slots SET slot_number = $1, status = $2, charging_rate = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
        [slot_number, slotStatus, rate, realId]
      );
      if (updateRes.rowCount === 0) {
        return res.status(404).json({ error: "EV slot not found" });
      }

      await logAuditEvent({
        userName: req.headers["x-admin-name"] || "Admin",
        userEmail: req.headers["x-admin-email"] || null,
        role: "Admin",
        action: "EV Slot Updated",
        module: "EV Charging",
        entityType: "ev_slot",
        entityId: slot_number,
        description: `Updated EV slot ${slot_number} (status: ${slotStatus}, rate: ₹${rate}/kWh)`,
        status: "Success",
        ipAddress: getAuditClientIp(req),
        userAgent: getAuditUserAgent(req)
      });

      return res.json({ success: true, slot: updateRes.rows[0], message: "EV slot updated successfully" });
    }

    const updateRes = await pool.query(
      "UPDATE parking_slots SET slot_number = $1, zone = $2, slot_type = $3, hourly_rate = $4, status = $5, is_available = $6 WHERE id = $7 RETURNING *",
      [slot_number, zone, slotType, rate, slotStatus, isAvailable, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Parking slot not found" });
    }

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Slot Updated",
      module: "Parking Slots",
      entityType: "parking_slot",
      entityId: slot_number,
      description: `Updated parking slot ${slot_number} in ${zone} (${slotType}) to status "${slotStatus}"`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const isEv = String(id).startsWith("ev-") || (!isNaN(id) && parseInt(id, 10) > 10000);
  const realId = isEv ? (String(id).startsWith("ev-") ? parseInt(id.replace("ev-", ""), 10) : parseInt(id, 10) - 10000) : parseInt(id, 10);
  try {
    if (isEv) {
      const delRes = await pool.query("DELETE FROM ev_charging_slots WHERE id = $1 RETURNING slot_number", [realId]);
      if (delRes.rowCount === 0) {
        return res.status(404).json({ error: "EV slot not found" });
      }

      await logAuditEvent({
        userName: req.headers["x-admin-name"] || "Admin",
        userEmail: req.headers["x-admin-email"] || null,
        role: "Admin",
        action: "EV Slot Deleted",
        module: "EV Charging",
        entityType: "ev_slot",
        entityId: delRes.rows[0].slot_number,
        description: `Deleted EV charging slot ${delRes.rows[0].slot_number}`,
        severity: "Medium",
        status: "Success",
        ipAddress: getAuditClientIp(req),
        userAgent: getAuditUserAgent(req)
      });

      return res.json({ success: true, message: `EV slot ${delRes.rows[0].slot_number} deleted successfully` });
    }
    const delRes = await pool.query("DELETE FROM parking_slots WHERE id = $1 RETURNING slot_number", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Parking slot not found" });
    }

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Slot Deleted",
      module: "Parking Slots",
      entityType: "parking_slot",
      entityId: delRes.rows[0].slot_number,
      description: `Deleted parking slot ${delRes.rows[0].slot_number}`,
      severity: "Medium",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    res.json({ success: true, message: `Slot ${delRes.rows[0].slot_number} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting parking slot" });
  }
});

const handleSlotStatusUpdate = async (req, res) => {
  const { slotNumber } = req.params;
  const { status } = req.body;
  const normalizedStatus = (status || "").toLowerCase();

  if (!["available", "occupied", "reserved", "charging", "maintenance"].includes(normalizedStatus)) {
    return res.status(400).json({ error: "Status must be 'available', 'occupied', 'reserved', 'charging', or 'maintenance'" });
  }

  const isAvailable = normalizedStatus === "available";

  try {
    let slotResult = await pool.query(
      "UPDATE parking_slots SET status = $1, is_available = $2 WHERE slot_number = $3 RETURNING *",
      [normalizedStatus, isAvailable, slotNumber]
    );

    if (slotResult.rowCount === 0) {
      slotResult = await pool.query(
        "UPDATE ev_charging_slots SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE slot_number = $2 RETURNING *",
        [normalizedStatus, slotNumber]
      );
    }

    const isEvSlot = slotNumber.toUpperCase().startsWith("EV-");
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || req.headers["x-user-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || req.headers["x-user-email"] || null,
      role: req.headers["x-user-role"] || "Admin",
      action: "Slot Status Changed",
      module: isEvSlot ? "EV Charging" : "Parking Slots",
      entityType: isEvSlot ? "ev_slot" : "parking_slot",
      entityId: slotNumber,
      description: `Changed status of slot ${slotNumber} to ${normalizedStatus}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
};

app.post("/api/parking-slots/:slotNumber/status", handleSlotStatusUpdate);
app.put("/api/parking-slots/:slotNumber/status", handleSlotStatusUpdate);

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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Staff",
      role: "Staff",
      action: "Slot Status Changed",
      module: slotNumber.toUpperCase().startsWith("EV-") ? "EV Charging" : "Parking Slots",
      entityType: "parking_slot",
      entityId: slotNumber,
      description: `Toggled status of slot ${slotNumber} from ${current} to ${newStatus}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const { page, limit, search, type, status } = req.query;
  try {
    let baseQuery = "FROM vehicles WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(vehicle_number) LIKE $${params.length} OR LOWER(owner_name) LIKE $${params.length} OR LOWER(COALESCE(owner_email, '')) LIKE $${params.length} OR LOWER(COALESCE(owner_phone, '')) LIKE $${params.length} OR LOWER(COALESCE(current_slot, '')) LIKE $${params.length})`;
    }

    if (type && type !== "ALL") {
      params.push(type.toLowerCase());
      baseQuery += ` AND LOWER(vehicle_type) = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseQuery += ` AND LOWER(status) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const vehiclesResult = await pool.query(
        `SELECT * ${baseQuery} ORDER BY id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        vehicles: vehiclesResult.rows,
        data: vehiclesResult.rows,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const vehiclesResult = await pool.query(`SELECT * ${baseQuery} ORDER BY id ASC`, params);
    res.json({
      success: true,
      vehicles: vehiclesResult.rows,
      data: vehiclesResult.rows,
      total,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
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
  const vEmail = (owner_email || "").trim();
  const vPhone = (owner_phone || "").trim();
  const vSlot = slot_number;
  const vEntryTime = entry_time ? new Date(entry_time) : new Date();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let isEvSlot = false;
    let evSlotRow = null;
    let slotCheck = await client.query("SELECT * FROM parking_slots WHERE slot_number = $1 FOR UPDATE", [vSlot]);
    if (slotCheck.rowCount === 0) {
      const evCheck = await client.query("SELECT * FROM ev_charging_slots WHERE UPPER(slot_number) = UPPER($1) FOR UPDATE", [vSlot]);
      if (evCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `Slot ${vSlot} does not exist` });
      }
      isEvSlot = true;
      evSlotRow = evCheck.rows[0];
      if (evSlotRow.status && evSlotRow.status.toLowerCase() !== "available") {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `EV Slot ${vSlot} is currently ${evSlotRow.status}` });
      }
    } else {
      if (slotCheck.rows[0].status === "occupied" || !slotCheck.rows[0].is_available) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `Slot ${vSlot} is already occupied` });
      }
    }

    const activeCheck = await client.query(
      "SELECT * FROM vehicle_history WHERE UPPER(vehicle_number) = $1 AND (exit_time IS NULL OR LOWER(status) = 'parked')",
      [vPlate]
    );
    if (activeCheck.rowCount > 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(400).json({ error: `Vehicle ${vPlate} already has an active parking session at slot ${activeCheck.rows[0].slot_number}` });
    }

    const targetStatus = isEvSlot ? "charging" : "Parked";
    const upsertVeh = await client.query(`
      INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (vehicle_number)
      DO UPDATE SET
        status = EXCLUDED.status,
        current_slot = EXCLUDED.current_slot,
        vehicle_type = COALESCE(NULLIF(EXCLUDED.vehicle_type, ''), vehicles.vehicle_type),
        model = COALESCE(NULLIF(EXCLUDED.model, ''), vehicles.model),
        owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), vehicles.owner_name),
        owner_email = COALESCE(NULLIF(EXCLUDED.owner_email, ''), vehicles.owner_email),
        owner_phone = COALESCE(NULLIF(EXCLUDED.owner_phone, ''), vehicles.owner_phone)
      RETURNING *
    `, [vPlate, vType, vModel, vOwner, vEmail, vPhone, targetStatus, vSlot]);
    const vehicleData = upsertVeh.rows[0];

    if (isEvSlot) {
      await client.query(
        "UPDATE ev_charging_slots SET status = 'Charging', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [vSlot]
      );
      const sessionCode = `EV-SESS-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO ev_charging_sessions (
          session_code, customer_name, customer_email, customer_phone,
          vehicle_number, vehicle_model, vehicle_type,
          slot_id, slot_number, location_name,
          start_time, charging_rate, session_status, payment_status,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, $11, 'Active', 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          sessionCode,
          vOwner,
          vEmail,
          vPhone,
          vPlate,
          vModel,
          vType || "EV",
          evSlotRow.id,
          evSlotRow.slot_number,
          evSlotRow.location_name || "Zone C (EV Station)",
          evSlotRow.charging_rate || 18.00
        ]
      );
    } else {
      await client.query(
        "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE slot_number = $1",
        [vSlot]
      );
    }

    const nowStr = getLocalTimestamp(vEntryTime);
    const historyInsert = await client.query(
      "INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, duration, fee, status) VALUES ($1, $2, $3, 'Ongoing', '₹50.00', 'Parked') RETURNING *",
      [vPlate, vSlot, nowStr]
    );

    await logAuditEvent({
      client,
      userName: vOwner || "Staff Operator",
      userEmail: vEmail || null,
      role: "Staff",
      action: "Vehicle Entry",
      module: "Vehicles",
      entityType: "vehicle",
      entityId: vPlate,
      description: `Vehicle ${vPlate} parked in slot ${vSlot}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await client.query("COMMIT");
    client.release();

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
    await client.query("ROLLBACK");
    client.release();
    console.error(err);
    res.status(500).json({ error: "Server error registering vehicle entry" });
  }
});

app.get("/api/staff/vehicle-entries", async (req, res) => {
  const { page, limit, search, status, type } = req.query;
  try {
    let baseQuery = `
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON vh.vehicle_number = v.vehicle_number
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(vh.vehicle_number) LIKE $${params.length} OR LOWER(vh.slot_number) LIKE $${params.length} OR LOWER(COALESCE(v.owner_name, '')) LIKE $${params.length} OR LOWER(COALESCE(v.owner_phone, '')) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseQuery += ` AND LOWER(vh.status) = $${params.length}`;
    }

    if (type && type !== "ALL") {
      params.push(type.toLowerCase());
      baseQuery += ` AND LOWER(COALESCE(v.vehicle_type, 'car')) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const selectCols = `
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
        COALESCE(v.owner_phone, '') AS owner_phone
    `;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const entriesRes = await pool.query(
        `${selectCols} ${baseQuery} ORDER BY vh.entry_time DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        entries: entriesRes.rows,
        data: entriesRes.rows,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const entriesRes = await pool.query(`${selectCols} ${baseQuery} ORDER BY vh.entry_time DESC`, params);
    res.json({
      success: true,
      entries: entriesRes.rows,
      data: entriesRes.rows,
      total,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
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
  const vPhone = owner_phone || "";
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Vehicle Created",
      module: "Vehicles",
      entityType: "vehicle",
      entityId: vehicle_number.toUpperCase(),
      description: `Registered vehicle ${vehicle_number.toUpperCase()} (${vehicle_type} - ${vModel}) for ${owner_name}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const vPhone = owner_phone || "";
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Vehicle Updated",
      module: "Vehicles",
      entityType: "vehicle",
      entityId: vehicle_number.toUpperCase(),
      description: `Updated vehicle ${vehicle_number.toUpperCase()} details (status: ${vStatus}, slot: ${vSlot})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Vehicle Removed",
      module: "Vehicles",
      entityType: "vehicle",
      entityId: delRes.rows[0].vehicle_number,
      description: `Removed vehicle ${delRes.rows[0].vehicle_number} from database`,
      severity: "Medium",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    res.json({ success: true, message: `Vehicle ${delRes.rows[0].vehicle_number} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting vehicle" });
  }
});

app.get("/api/admin/users", async (req, res) => {
  const { page, limit, search, role, status } = req.query;
  try {
    let baseQuery = "FROM users WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(COALESCE(phone, '')) LIKE $${params.length})`;
    }

    if (role && role !== "ALL") {
      params.push(role.toLowerCase());
      baseQuery += ` AND LOWER(role) = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseQuery += ` AND LOWER(status) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const selectCols = "SELECT id, name, email, phone, role, status, created_at";

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const usersResult = await pool.query(
        `${selectCols} ${baseQuery} ORDER BY created_at DESC, id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        users: usersResult.rows,
        data: usersResult.rows,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const usersResult = await pool.query(`${selectCols} ${baseQuery} ORDER BY created_at DESC, id DESC`, params);
    res.json({
      success: true,
      users: usersResult.rows,
      data: usersResult.rows,
      total,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
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
  const userPhone = phone || "";
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "User Created",
      module: "Users",
      entityType: "user",
      entityId: String(insertResult.rows[0].id),
      description: `Created user account for ${name} (${email}) with role ${userRole}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

  const userPhone = phone || "";
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "User Updated",
      module: "Users",
      entityType: "user",
      entityId: String(id),
      description: `Updated profile for user ${name} (${email}), role: ${userRole}, status: ${userStatus}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    const targetUser = updateResult.rows[0];
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: status === "Active" ? "User Activated" : "User Deactivated",
      module: "Users",
      entityType: "user",
      entityId: String(id),
      description: `Changed status of user ${targetUser.name} (${targetUser.email}) to ${status}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
      "DELETE FROM users WHERE id = $1 RETURNING id, name, email",
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const delUser = deleteResult.rows[0];
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "User Deleted",
      module: "Users",
      entityType: "user",
      entityId: String(id),
      description: `Deleted user account ${delUser.name} (${delUser.email})`,
      severity: "Medium",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const { page, limit, search, zone, type } = req.query;
  try {
    let baseQuery = `
      FROM vehicles v
      LEFT JOIN parking_slots ps ON v.current_slot = ps.slot_number
      LEFT JOIN ev_charging_slots es ON UPPER(v.current_slot) = UPPER(es.slot_number)
      LEFT JOIN LATERAL (
        SELECT r.booking_id, r.start_time, r.end_time, r.duration_hours, r.total_amount, r.plan_code
        FROM reservations r
        WHERE REPLACE(UPPER(r.vehicle_number), ' ', '') = REPLACE(UPPER(v.vehicle_number), ' ', '')
          AND LOWER(r.status) IN ('checked in', 'confirmed')
        ORDER BY r.id DESC
        LIMIT 1
      ) res ON true
      LEFT JOIN LATERAL (
        SELECT p.overstay_rate
        FROM pricing_plans p
        WHERE LOWER(p.plan_code) = LOWER(res.plan_code)
        LIMIT 1
      ) plan ON true
      WHERE LOWER(v.status) IN ('parked', 'charging')
    `;
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(v.vehicle_number) LIKE $${params.length} OR LOWER(v.owner_name) LIKE $${params.length} OR LOWER(COALESCE(v.current_slot, '')) LIKE $${params.length} OR LOWER(COALESCE(v.owner_email, '')) LIKE $${params.length})`;
    }

    if (zone && zone !== "ALL") {
      params.push(zone);
      baseQuery += ` AND (ps.zone = $${params.length} OR es.location_name = $${params.length} OR (LOWER($${params.length}) = 'zone c' AND UPPER(COALESCE(v.current_slot, '')) LIKE 'EV%'))`;
    }

    if (type && type !== "ALL") {
      params.push(type.toLowerCase());
      baseQuery += ` AND LOWER(v.vehicle_type) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const selectCols = `
      SELECT 
        v.id,
        v.vehicle_number,
        v.vehicle_type,
        v.model,
        v.owner_name,
        v.owner_email,
        v.owner_phone,
        CASE WHEN LOWER(v.status) = 'charging' THEN 'Charging' ELSE 'Parked' END as status,
        v.current_slot,
        v.created_at,
        COALESCE(ps.zone, es.location_name, 'Zone C (EV)') as zone,
        COALESCE(ps.slot_type, es.charger_type, 'Standard') as slot_type,
        COALESCE(ps.hourly_rate, es.charging_rate, 50.00) as hourly_rate,
        (
          SELECT entry_time 
          FROM vehicle_history 
          WHERE vehicle_number = v.vehicle_number 
          ORDER BY entry_time DESC 
          LIMIT 1
        ) as entry_time,
        res.booking_id,
        res.start_time as scheduled_start_time,
        res.end_time as scheduled_end_time,
        res.duration_hours as booked_duration_hours,
        res.total_amount as prepaid_amount,
        plan.overstay_rate
    `;

    let activeVehiclesRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      activeVehiclesRes = await pool.query(
        `${selectCols} ${baseQuery} ORDER BY v.id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      activeVehiclesRes = await pool.query(`${selectCols} ${baseQuery} ORDER BY v.id DESC`, params);
    }

    const settingsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'general'");
    const generalSettings = settingsRes.rows[0]?.value || {};
    const graceMinutes = parseInt(generalSettings.overstayGracePeriodMinutes, 10) || 15;
    const defaultOverstayRate = parseFloat(generalSettings.defaultOverstayHourlyRate) || 50;

    const now = new Date();
    const sessions = activeVehiclesRes.rows.map((row) => {
      const entryDate = row.entry_time ? new Date(row.entry_time) : new Date(row.created_at);
      const diffMs = Math.max(0, now - entryDate);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const durationStr = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h 00m`) : `${mins}m`;
      const billedHours = Math.max(1, Math.ceil(diffMins / 60));
      const slotRate = parseFloat(row.hourly_rate) || 50;
      const isCharging = (row.status || "").toLowerCase() === "charging" || (row.vehicle_type || "").toLowerCase() === "ev";

      const isReservation = !!row.booking_id;
      const scheduledStart = row.scheduled_start_time ? new Date(row.scheduled_start_time).toISOString() : null;
      const scheduledEnd = row.scheduled_end_time ? new Date(row.scheduled_end_time).toISOString() : null;
      const bookedHours = row.booked_duration_hours ? parseFloat(row.booked_duration_hours) : null;
      const prepaidAmt = row.prepaid_amount ? parseFloat(row.prepaid_amount) : 0;

      let overstayInfo = {
        isOverstay: false,
        inGracePeriod: false,
        overstayMinutes: 0,
        overstayDuration: "0m",
        billedOverstayHours: 0,
        overstayFee: 0,
        remainingMinutes: 0,
        remainingDuration: "0m"
      };

      if (isReservation && row.scheduled_end_time) {
        overstayInfo = calculateOverstayDetails({
          scheduledEndTime: row.scheduled_end_time,
          actualOrCurrentTime: now,
          planOverstayRate: row.overstay_rate,
          defaultHourlyRate: defaultOverstayRate || slotRate,
          graceMinutes
        });
      }

      let payableAtExit = 0;
      let totalEstimatedAmount = 0;
      let calculatedFeeStr = "";

      if (isReservation) {
        payableAtExit = overstayInfo.overstayFee;
        totalEstimatedAmount = prepaidAmt + overstayInfo.overstayFee;
        calculatedFeeStr = overstayInfo.overstayFee > 0
          ? `₹${overstayInfo.overstayFee.toFixed(2)} (Overstay)`
          : `₹0.00 (Prepaid: ₹${prepaidAmt.toFixed(2)})`;
      } else {
        const walkInFee = billedHours * slotRate;
        payableAtExit = walkInFee;
        totalEstimatedAmount = walkInFee;
        calculatedFeeStr = `₹${walkInFee.toFixed(2)}`;
      }

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
        hourly_rate: slotRate,
        entry_time: entryDate.toISOString(),
        duration: durationStr,
        billed_hours: billedHours,
        calculated_fee: calculatedFeeStr,
        fee_numeric: payableAtExit,
        status: isCharging ? "Charging" : "Parked",
        is_reservation: isReservation,
        booking_id: row.booking_id || null,
        scheduled_start_time: scheduledStart,
        scheduled_end_time: scheduledEnd,
        booked_duration_hours: bookedHours,
        prepaid_amount: prepaidAmt,
        is_overstay: overstayInfo.isOverstay,
        in_grace_period: overstayInfo.inGracePeriod,
        overstay_minutes: overstayInfo.overstayMinutes,
        overstay_duration: overstayInfo.overstayDuration,
        billed_overstay_hours: overstayInfo.billedOverstayHours,
        overstay_fee: overstayInfo.overstayFee,
        remaining_minutes: overstayInfo.remainingMinutes,
        remaining_time: overstayInfo.remainingDuration,
        payable_at_exit: payableAtExit,
        total_estimated_amount: totalEstimatedAmount
      };
    });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
      vehicles: sessions,
      data: sessions,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
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
    const todayRes = await pool.query("SELECT * FROM payments WHERE DATE(created_at) = CURRENT_DATE AND vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL ORDER BY created_at DESC");
    const allRes = await pool.query("SELECT * FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL ORDER BY created_at DESC LIMIT 100");
    const isTodayMode = req.query.range === "today" || (!req.query.range && todayRes.rows.length > 0);
    const paymentsToUse = isTodayMode ? todayRes.rows : allRes.rows;

    let todayRevenue = 0;
    todayRes.rows.forEach(p => { todayRevenue += (parseFloat(p.amount) || 0); });

    let totalRevenue = 0;
    const methodsBreakdown = {
      UPI: 0,
      "Credit Card": 0,
      "Debit Card": 0,
      Cash: 0,
      "Net Banking": 0
    };

    let evRevenue = 0;
    let parkingRevenue = 0;
    paymentsToUse.forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      totalRevenue += amt;
      const isEv = (p.transaction_id && String(p.transaction_id).startsWith("TXN-EV-")) || (p.slot_number && String(p.slot_number).startsWith("EV-"));
      if (isEv) {
        evRevenue += amt;
      } else {
        parkingRevenue += amt;
      }
      const method = p.payment_method || "UPI";
      if (methodsBreakdown[method] !== undefined) {
        methodsBreakdown[method] += amt;
      } else {
        methodsBreakdown[method] = amt;
      }
    });

    const completedCount = paymentsToUse.length;
    const avgTicket = completedCount > 0 ? (totalRevenue / completedCount).toFixed(2) : "0.00";

    res.json({
      success: true,
      isTodayMode,
      todayRevenue: `₹${todayRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      todayRevenueNumeric: todayRevenue,
      todayCount: todayRes.rows.length,
      summary: {
        totalRevenue: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        totalRevenueNumeric: totalRevenue,
        evRevenue: `₹${evRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        evRevenueNumeric: evRevenue,
        parkingRevenue: `₹${parkingRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        parkingRevenueNumeric: parkingRevenue,
        completedCount,
        avgTicket: `₹${parseFloat(avgTicket).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        methodsBreakdown
      },
      payments: paymentsToUse,
      allPayments: allRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching today's revenue" });
  }
});

app.get("/api/payments", async (req, res) => {
  const { page, limit, search, method, status } = req.query;
  try {
    let baseQuery = "FROM payments WHERE vehicle_number IS NOT NULL AND vehicle_number != '' AND slot_number IS NOT NULL AND transaction_id IS NOT NULL";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(vehicle_number) LIKE $${params.length} OR LOWER(COALESCE(customer_name, '')) LIKE $${params.length} OR LOWER(transaction_id) LIKE $${params.length} OR LOWER(COALESCE(slot_number, '')) LIKE $${params.length})`;
    }

    if (method && method !== "ALL") {
      params.push(method);
      baseQuery += ` AND payment_method = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseQuery += ` AND LOWER(COALESCE(payment_status, 'completed')) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const paymentsRes = await pool.query(
        `SELECT * ${baseQuery} ORDER BY created_at DESC, id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        payments: paymentsRes.rows,
        data: paymentsRes.rows,
        total,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const paymentsRes = await pool.query(`SELECT * ${baseQuery} ORDER BY created_at DESC, id DESC`, params);
    res.json({
      success: true,
      payments: paymentsRes.rows,
      data: paymentsRes.rows,
      total,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching payments" });
  }
});

app.get("/api/customer/payments", async (req, res) => {
  const { email, name, search, method, status, page, limit } = req.query;
  try {
    let baseFromWhere = `
      FROM payments p
      LEFT JOIN vehicles v ON LOWER(v.vehicle_number) = LOWER(p.vehicle_number)
      LEFT JOIN reservations r ON (
        LOWER(r.vehicle_number) = LOWER(p.vehicle_number)
        AND (r.slot_number = p.slot_number OR LOWER(r.customer_email) = LOWER(p.customer_email))
      )
      WHERE p.vehicle_number IS NOT NULL AND p.vehicle_number != '' AND p.slot_number IS NOT NULL AND p.transaction_id IS NOT NULL
    `;
    const params = [];

    if (email) {
      params.push(`%${email.toLowerCase().trim()}%`);
      baseFromWhere += ` AND (LOWER(COALESCE(p.customer_email, '')) LIKE $${params.length} OR LOWER(COALESCE(p.customer_name, '')) LIKE $${params.length})`;
    } else if (name) {
      params.push(`%${name.toLowerCase().trim()}%`);
      baseFromWhere += ` AND LOWER(COALESCE(p.customer_name, '')) LIKE $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      baseFromWhere += ` AND (LOWER(p.vehicle_number) LIKE $${params.length} OR LOWER(p.transaction_id) LIKE $${params.length} OR LOWER(p.slot_number) LIKE $${params.length})`;
    }

    if (method && method !== "ALL") {
      params.push(method);
      baseFromWhere += ` AND p.payment_method = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseFromWhere += ` AND LOWER(COALESCE(p.payment_status, 'completed')) = $${params.length}`;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount FROM (SELECT DISTINCT p.id, p.amount ${baseFromWhere}) sub`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10) || 0;
    const totalAmount = parseFloat(countRes.rows[0].total_amount) || 0;

    const selectCols = `
      SELECT 
        p.id,
        p.transaction_id,
        COALESCE(r.booking_id, 'BK-' || SUBSTRING(p.transaction_id FROM 5)) AS booking_id,
        p.customer_name,
        p.customer_email,
        p.customer_phone,
        p.vehicle_number,
        COALESCE(v.vehicle_type, r.vehicle_type, 'Car') AS vehicle_type,
        COALESCE(v.model, r.model, 'Standard') AS model,
        p.slot_number,
        COALESCE(r.plan_name, 'Standard Parking') AS plan_name,
        p.entry_time,
        p.exit_time,
        p.duration,
        p.amount,
        p.amount AS fee,
        p.original_amount,
        p.discount_amount,
        p.coupon_code,
        p.payment_method,
        COALESCE(p.payment_status, 'Completed') AS payment_status,
        p.created_at AS receipt_date,
        p.created_at
    `;

    if (page || limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      const paymentsRes = await pool.query(
        `${selectCols} ${baseFromWhere} ORDER BY p.created_at DESC, p.id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
      return res.json({
        success: true,
        payments: paymentsRes.rows,
        data: paymentsRes.rows,
        total,
        totalAmount,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    const paymentsRes = await pool.query(
      `${selectCols} ${baseFromWhere} ORDER BY p.created_at DESC, p.id DESC`,
      params
    );
    res.json({
      success: true,
      payments: paymentsRes.rows,
      data: paymentsRes.rows,
      total,
      totalAmount,
      pagination: {
        page: 1,
        limit: total || 5,
        total,
        totalPages: 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer payments" });
  }
});

app.get("/api/customer/receipts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const receiptRes = await pool.query(
      `SELECT 
        p.id,
        p.transaction_id,
        COALESCE(r.booking_id, 'BK-' || SUBSTRING(p.transaction_id FROM 5)) AS booking_id,
        p.customer_name,
        p.customer_email,
        p.customer_phone,
        p.vehicle_number,
        COALESCE(v.vehicle_type, r.vehicle_type, 'Car') AS vehicle_type,
        COALESCE(v.model, r.model, 'Standard') AS model,
        p.slot_number,
        COALESCE(r.plan_name, 'Standard Parking') AS plan_name,
        p.entry_time,
        p.exit_time,
        p.duration,
        p.amount,
        p.amount AS fee,
        p.payment_method,
        COALESCE(p.payment_status, 'Completed') AS payment_status,
        p.created_at AS receipt_date,
        p.created_at
      FROM payments p
      LEFT JOIN vehicles v ON LOWER(v.vehicle_number) = LOWER(p.vehicle_number)
      LEFT JOIN reservations r ON (
        LOWER(r.vehicle_number) = LOWER(p.vehicle_number)
        AND (r.slot_number = p.slot_number OR LOWER(r.customer_email) = LOWER(p.customer_email))
      )
      WHERE LOWER(p.transaction_id) = LOWER($1) OR p.id::text = $1
      LIMIT 1`,
      [id.trim()]
    );
    if (receiptRes.rowCount === 0) {
      return res.status(404).json({ success: false, error: "Receipt not found" });
    }
    res.json({ success: true, receipt: receiptRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching receipt" });
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
        customer_email || "",
        customer_phone || "",
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
      "UPDATE vehicles SET status = 'Checked Out', current_slot = NULL WHERE vehicle_number = $1",
      [vehicle_number.toUpperCase()]
    );

    await pool.query(
      `UPDATE vehicle_history 
       SET exit_time = $1, duration = $2, fee = $3, status = 'Completed' 
       WHERE id = (
         SELECT id FROM vehicle_history 
         WHERE UPPER(vehicle_number) = $4 AND (exit_time IS NULL OR LOWER(status) = 'parked')
         ORDER BY entry_time DESC 
         LIMIT 1
       )`,
      [exitDate, dur, `₹${numAmount.toFixed(2)}`, vehicle_number.toUpperCase()]
    );

    const payCustEmail = customer_email || "";
    if (payCustEmail) {
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
    }
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

app.post(["/api/payments", "/api/customer/process-payment"], async (req, res) => {
  const {
    vehicle_number,
    slot_number,
    amount,
    payment_method,
    customer_name,
    customer_email,
    customer_phone,
    duration,
    coupon_code,
    original_amount,
    service_type
  } = req.body;

  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount < 0) {
    return res.status(400).json({ error: "Valid payment amount is required" });
  }

  const vPlate = (vehicle_number || "DL01 AB 1234").trim().toUpperCase();
  const slot = slot_number || "A-01";
  const cName = customer_name || "Customer";
  const cEmail = customer_email || "";
  const cPhone = customer_phone || "";
  const payMethod = payment_method || "UPI";
  const dur = duration || "1h 00m";
  const txnId = req.body.transaction_id || `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const baseAmount = parseFloat(original_amount) || numAmount;
    let finalAmount = numAmount;
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (coupon_code && String(coupon_code).trim()) {
      const couponValidation = await validateCoupon({
        code: String(coupon_code).trim(),
        customerEmail: cEmail,
        orderAmount: baseAmount,
        serviceType: service_type || "Normal Parking",
        db: client
      });

      if (!couponValidation.valid) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: couponValidation.error });
      }

      discountAmount = couponValidation.discount_amount;
      finalAmount = couponValidation.final_amount;
      appliedCouponCode = couponValidation.code;
    }

    const insertRes = await client.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, original_amount, discount_amount, coupon_code,
        payment_method, method, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Completed', CURRENT_TIMESTAMP) RETURNING *`,
      [
        txnId,
        vPlate,
        cName,
        cEmail,
        cPhone,
        slot,
        new Date(now.getTime() - 3600000),
        now,
        dur,
        finalAmount,
        baseAmount,
        discountAmount,
        appliedCouponCode,
        payMethod,
        payMethod
      ]
    );

    if (appliedCouponCode && discountAmount > 0) {
      await recordCouponUsage({
        client,
        couponCode: appliedCouponCode,
        customerEmail: cEmail || "customer@parksafe.in",
        customerName: cName,
        paymentId: txnId,
        originalAmount: baseAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        serviceType: service_type || "Normal Parking",
        req
      });
    }

    await logAuditEvent({
      client,
      userName: cName,
      userEmail: cEmail || null,
      role: "Customer",
      action: "Payment Completed",
      module: "Payments",
      entityType: "payment",
      entityId: txnId,
      description: `Payment of ₹${finalAmount.toFixed(2)} processed for ${vPlate} via ${payMethod}${discountAmount > 0 ? ` (Coupon: ${appliedCouponCode}, Discount: ₹${discountAmount.toFixed(2)})` : ""}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await client.query("COMMIT");
    client.release();

    if (cEmail) {
      await notifyUser(cEmail, {
        title: "Payment Received",
        message: `Your payment of ₹${finalAmount.toFixed(2)} has been processed.`,
        type: "payment"
      });
    }
    await notifyAdmins({
      title: "Payment Received",
      message: `Payment of ₹${finalAmount.toFixed(2)} received for ${vPlate} via ${payMethod}.`,
      type: "payment"
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${finalAmount.toFixed(2)} processed successfully`,
      payment: insertRes.rows[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error(err);
    res.status(500).json({ error: "Server error processing payment" });
  }
});

app.get("/api/customer/my-parking", async (req, res) => {
  const { email, name } = req.query;
  try {
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanName = name ? name.toLowerCase().trim() : null;

    if (!cleanEmail && !cleanName) {
      return res.json({ success: true, session: null, sessions: [], activeCount: 0, message: "No active parking session found" });
    }

    let result = await pool.query(`
      SELECT 
        v.id as vehicle_id,
        v.vehicle_number,
        COALESCE(v.vehicle_type, (CASE WHEN UPPER(TRIM(COALESCE(v.current_slot, ''))) LIKE 'EV%' THEN 'EV' ELSE 'Car' END)) as vehicle_type,
        COALESCE(v.model, 'Standard') as model,
        COALESCE(v.owner_name, 'Customer') as owner_name,
        COALESCE(v.owner_email, '') as owner_email,
        COALESCE(v.owner_phone, '') as owner_phone,
        v.status,
        v.current_slot,
        COALESCE(
          (SELECT entry_time FROM vehicle_history WHERE REPLACE(UPPER(vehicle_number), ' ', '') = REPLACE(UPPER(v.vehicle_number), ' ', '') ORDER BY entry_time DESC LIMIT 1),
          v.created_at,
          CURRENT_TIMESTAMP
        ) as entry_time,
        COALESCE(ps.zone, es.location_name, (CASE WHEN UPPER(TRIM(COALESCE(v.current_slot, ''))) LIKE 'EV%' THEN 'Zone C (EV Fast)' ELSE 'Zone A' END)) as zone,
        COALESCE(ps.slot_type, es.charger_type, 'Standard') as slot_type,
        COALESCE(ps.hourly_rate, es.charging_rate, 50.00) as hourly_rate,
        res.booking_id,
        res.start_time as scheduled_start_time,
        res.end_time as scheduled_end_time,
        res.duration_hours as booked_duration_hours,
        res.total_amount as prepaid_amount,
        plan.overstay_rate
      FROM vehicles v
      LEFT JOIN parking_slots ps ON UPPER(TRIM(v.current_slot)) = UPPER(TRIM(ps.slot_number))
      LEFT JOIN ev_charging_slots es ON UPPER(TRIM(v.current_slot)) = UPPER(TRIM(es.slot_number))
      LEFT JOIN LATERAL (
        SELECT r.booking_id, r.start_time, r.end_time, r.duration_hours, r.total_amount, r.plan_code
        FROM reservations r
        WHERE REPLACE(UPPER(r.vehicle_number), ' ', '') = REPLACE(UPPER(v.vehicle_number), ' ', '')
          AND LOWER(r.status) IN ('checked in', 'confirmed')
        ORDER BY r.id DESC
        LIMIT 1
      ) res ON true
      LEFT JOIN LATERAL (
        SELECT p.overstay_rate
        FROM pricing_plans p
        WHERE LOWER(p.plan_code) = LOWER(res.plan_code)
        LIMIT 1
      ) plan ON true
      WHERE LOWER(v.status) IN ('parked', 'charging')
        AND (
          ($1::text IS NOT NULL AND (
            LOWER(v.owner_email) = $1
            OR EXISTS (SELECT 1 FROM reservations r WHERE REPLACE(UPPER(r.vehicle_number), ' ', '') = REPLACE(UPPER(v.vehicle_number), ' ', '') AND LOWER(r.customer_email) = $1)
          ))
          OR
          ($2::text IS NOT NULL AND LOWER(v.owner_name) LIKE '%' || $2 || '%')
        )
      ORDER BY v.id DESC
    `, [cleanEmail, cleanName]);

    if (result.rowCount === 0) {
      result = await pool.query(`
        SELECT 
          vh.id as history_id,
          vh.vehicle_number,
          COALESCE(v.vehicle_type, res.vehicle_type, (CASE WHEN UPPER(TRIM(vh.slot_number)) LIKE 'EV%' THEN 'EV' ELSE 'Car' END)) as vehicle_type,
          COALESCE(v.model, res.model, 'Standard') as model,
          COALESCE(v.owner_name, res.customer_name, 'Customer') as owner_name,
          COALESCE(v.owner_email, res.customer_email, '') as owner_email,
          COALESCE(v.owner_phone, res.customer_phone, '') as owner_phone,
          COALESCE(vh.status, v.status, 'Parked') as status,
          COALESCE(vh.slot_number, v.current_slot) as current_slot,
          COALESCE(vh.entry_time, v.created_at) as entry_time,
          COALESCE(ps.zone, (CASE WHEN UPPER(TRIM(vh.slot_number)) LIKE 'EV%' THEN 'Zone C (EV Fast)' ELSE 'Zone A' END)) as zone,
          COALESCE(ps.slot_type, 'Standard') as slot_type,
          COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
          res.booking_id,
          res.start_time as scheduled_start_time,
          res.end_time as scheduled_end_time,
          res.duration_hours as booked_duration_hours,
          res.total_amount as prepaid_amount,
          plan.overstay_rate
        FROM vehicle_history vh
        LEFT JOIN vehicles v ON REPLACE(UPPER(v.vehicle_number), ' ', '') = REPLACE(UPPER(vh.vehicle_number), ' ', '')
        LEFT JOIN LATERAL (
          SELECT customer_name, customer_email, customer_phone, vehicle_type, model, booking_id, start_time, end_time, duration_hours, total_amount, plan_code
          FROM reservations 
          WHERE REPLACE(UPPER(vehicle_number), ' ', '') = REPLACE(UPPER(vh.vehicle_number), ' ', '')
            AND LOWER(status) IN ('checked in', 'confirmed')
          ORDER BY id DESC LIMIT 1
        ) res ON true
        LEFT JOIN LATERAL (
          SELECT p.overstay_rate
          FROM pricing_plans p
          WHERE LOWER(p.plan_code) = LOWER(res.plan_code)
          LIMIT 1
        ) plan ON true
        LEFT JOIN parking_slots ps ON UPPER(TRIM(vh.slot_number)) = UPPER(TRIM(ps.slot_number))
        WHERE (vh.exit_time IS NULL OR LOWER(vh.status) = 'parked')
          AND (
            ($1::text IS NOT NULL AND (LOWER(v.owner_email) = $1 OR LOWER(res.customer_email) = $1))
            OR
            ($2::text IS NOT NULL AND (LOWER(v.owner_name) LIKE '%' || $2 || '%' OR LOWER(res.customer_name) LIKE '%' || $2 || '%'))
          )
        ORDER BY vh.entry_time DESC
      `, [cleanEmail, cleanName]);
    }

    if (result.rowCount === 0) {
      return res.json({ success: true, session: null, sessions: [], activeCount: 0, message: "No active parking session found" });
    }

    const settingsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'general'");
    const generalSettings = settingsRes.rows[0]?.value || {};
    const graceMinutes = parseInt(generalSettings.overstayGracePeriodMinutes, 10) || 15;
    const defaultOverstayRate = parseFloat(generalSettings.defaultOverstayHourlyRate) || 50;

    const now = new Date();
    const mappedSessions = result.rows.map((row) => {
      const entryDate = row.entry_time ? new Date(row.entry_time) : new Date(row.created_at || now);
      const diffMs = Math.max(0, now - entryDate);
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const durationStr = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h 00m`) : `${mins}m`;
      const billedHours = Math.max(1, Math.ceil(diffMins / 60));
      const slotRate = parseFloat(row.hourly_rate) || 50;

      const isReservation = !!row.booking_id;
      const scheduledStart = row.scheduled_start_time ? new Date(row.scheduled_start_time).toISOString() : null;
      const scheduledEnd = row.scheduled_end_time ? new Date(row.scheduled_end_time).toISOString() : null;
      const bookedHours = row.booked_duration_hours ? parseFloat(row.booked_duration_hours) : null;
      const prepaidAmt = row.prepaid_amount ? parseFloat(row.prepaid_amount) : 0;

      let overstayInfo = {
        isOverstay: false,
        inGracePeriod: false,
        overstayMinutes: 0,
        overstayDuration: "0m",
        billedOverstayHours: 0,
        overstayFee: 0,
        remainingMinutes: 0,
        remainingDuration: "0m"
      };

      if (isReservation && row.scheduled_end_time) {
        overstayInfo = calculateOverstayDetails({
          scheduledEndTime: row.scheduled_end_time,
          actualOrCurrentTime: now,
          planOverstayRate: row.overstay_rate,
          defaultHourlyRate: defaultOverstayRate || slotRate,
          graceMinutes
        });
      }

      let payableAtExit = 0;
      let totalEstimatedAmount = 0;
      let calculatedFeeStr = "";

      if (isReservation) {
        payableAtExit = overstayInfo.overstayFee;
        totalEstimatedAmount = prepaidAmt + overstayInfo.overstayFee;
        calculatedFeeStr = overstayInfo.overstayFee > 0
          ? `₹${overstayInfo.overstayFee.toFixed(2)} (Overstay)`
          : `₹0.00 (Prepaid: ₹${prepaidAmt.toFixed(2)})`;
      } else {
        const walkInFee = billedHours * slotRate;
        payableAtExit = walkInFee;
        totalEstimatedAmount = walkInFee;
        calculatedFeeStr = `₹${walkInFee.toFixed(2)}`;
      }

      return {
        id: row.id || row.history_id || row.vehicle_id,
        vehicle_number: row.vehicle_number,
        vehicle_type: row.vehicle_type || (String(row.current_slot || "").toUpperCase().startsWith("EV") ? "EV" : "Car"),
        model: row.model || "Standard",
        owner_name: row.owner_name,
        owner_email: row.owner_email,
        owner_phone: row.owner_phone,
        current_slot: row.current_slot,
        zone: row.zone || (String(row.current_slot || "").toUpperCase().startsWith("EV") ? "Zone C (EV Fast)" : "Zone A"),
        slot_type: row.slot_type || "Standard",
        hourly_rate: slotRate,
        entry_time: entryDate.toISOString(),
        duration: durationStr,
        billed_hours: billedHours,
        calculated_fee: calculatedFeeStr,
        fee_numeric: payableAtExit,
        status: "Parked",
        is_reservation: isReservation,
        booking_id: row.booking_id || null,
        scheduled_start_time: scheduledStart,
        scheduled_end_time: scheduledEnd,
        booked_duration_hours: bookedHours,
        prepaid_amount: prepaidAmt,
        is_overstay: overstayInfo.isOverstay,
        in_grace_period: overstayInfo.inGracePeriod,
        overstay_minutes: overstayInfo.overstayMinutes,
        overstay_duration: overstayInfo.overstayDuration,
        billed_overstay_hours: overstayInfo.billedOverstayHours,
        overstay_fee: overstayInfo.overstayFee,
        remaining_minutes: overstayInfo.remainingMinutes,
        remaining_time: overstayInfo.remainingDuration,
        payable_at_exit: payableAtExit,
        total_estimated_amount: totalEstimatedAmount
      };
    });

    res.json({
      success: true,
      session: mappedSessions[0] || null,
      sessions: mappedSessions,
      activeCount: mappedSessions.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer parking session" });
  }
});

app.get(["/api/admin/parking-records", "/api/staff/parking-records"], async (req, res) => {
  const { search, status, type, zone, page, limit } = req.query;
  try {
    let baseWhere = `
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON UPPER(TRIM(vh.vehicle_number)) = UPPER(TRIM(v.vehicle_number))
      LEFT JOIN parking_slots ps ON UPPER(TRIM(vh.slot_number)) = UPPER(TRIM(ps.slot_number))
    `;
    const params = [];
    let whereClauses = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      whereClauses.push(`(
        LOWER(vh.vehicle_number) LIKE $${params.length} OR 
        LOWER(COALESCE(v.owner_name, '')) LIKE $${params.length} OR 
        LOWER(vh.slot_number) LIKE $${params.length} OR 
        CAST(vh.id AS TEXT) LIKE $${params.length} OR 
        LOWER(CONCAT('tkt-', (88400 + vh.id)::text)) LIKE $${params.length} OR 
        LOWER(CONCAT('rec-', (9000 + vh.id)::text)) LIKE $${params.length}
      )`);
    }

    if (status && status.toUpperCase() !== "ALL") {
      const s = status.toLowerCase();
      if (s === "active" || s === "parked") {
        whereClauses.push(`LOWER(vh.status) IN ('parked', 'active')`);
      } else if (s === "completed") {
        whereClauses.push(`LOWER(vh.status) = 'completed'`);
      } else {
        params.push(s);
        whereClauses.push(`LOWER(vh.status) = $${params.length}`);
      }
    }

    if (type && type.toUpperCase() !== "ALL") {
      params.push(type.toLowerCase());
      whereClauses.push(`LOWER(COALESCE(v.vehicle_type, 'car')) = $${params.length}`);
    }

    if (zone && zone.toUpperCase() !== "ALL") {
      params.push(zone);
      whereClauses.push(`ps.zone = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere} ${whereStr}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN LOWER(status) IN ('parked', 'active') THEN 1 END) as active_count,
        COUNT(CASE WHEN LOWER(status) = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN LOWER(status) = 'completed' THEN CAST(REGEXP_REPLACE(fee, '[^0-9.]', '', 'g') AS NUMERIC) ELSE 0 END), 0) as completed_sum
      FROM vehicle_history
    `);
    const stats = {
      total: parseInt(statsRes.rows[0]?.total_count || 0, 10),
      active: parseInt(statsRes.rows[0]?.active_count || 0, 10),
      completed: parseInt(statsRes.rows[0]?.completed_count || 0, 10),
      amount: parseFloat(statsRes.rows[0]?.completed_sum || 0)
    };

    const selectQuery = `
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
        vh.booking_id,
        vh.scheduled_start_time,
        vh.scheduled_end_time,
        vh.booked_duration_hours,
        vh.overstay_duration,
        vh.overstay_fee,
        vh.normal_fee,
        vh.final_fee,
        COALESCE(v.vehicle_type, 'Car') as vehicle_type,
        COALESCE(v.model, 'Standard') as model,
        COALESCE(v.owner_name, p.customer_name, 'Customer') as customer_name,
        COALESCE(v.owner_email, p.customer_email, '') as customer_email,
        COALESCE(v.owner_phone, p.customer_phone, '') as customer_phone,
        COALESCE(ps.zone, CONCAT('Zone ', SUBSTRING(vh.slot_number, 1, 1)), 'Zone A') as zone,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        p.transaction_id,
        p.payment_method,
        COALESCE(p.payment_status, CASE WHEN LOWER(vh.status) = 'completed' THEN 'Paid' ELSE 'Pending' END) as payment_status
      ${baseWhere}
      LEFT JOIN LATERAL (
        SELECT p2.transaction_id, p2.payment_method, p2.payment_status, p2.customer_name, p2.customer_email, p2.customer_phone
        FROM payments p2
        WHERE p2.vehicle_number = vh.vehicle_number AND (
          (vh.exit_time IS NOT NULL AND ABS(EXTRACT(EPOCH FROM (p2.exit_time - vh.exit_time))) < 3600) OR
          (p2.slot_number = vh.slot_number)
        )
        ORDER BY p2.created_at DESC
        LIMIT 1
      ) p ON true
      ${whereStr}
    `;

    let histRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      histRes = await pool.query(
        `${selectQuery} ORDER BY vh.entry_time DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      histRes = await pool.query(`${selectQuery} ORDER BY vh.entry_time DESC`, params);
    }

    const now = new Date();
    const records = histRes.rows.map((row) => {
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

      return {
        ...row,
        exit_time: isParked ? null : row.exit_time,
        ticket_number: `TKT-${88400 + row.id}`,
        record_id: `REC-${9000 + row.id}`,
        duration: duration || "1h 00m",
        fee: fee || "₹50.00",
        payment_status: row.payment_status || (isParked ? "Pending" : "Paid"),
        overstay_duration: row.overstay_duration || "0m",
        overstay_fee: row.overstay_fee ? `₹${parseFloat(row.overstay_fee).toFixed(2)}` : "₹0.00",
        normal_fee: row.normal_fee ? `₹${parseFloat(row.normal_fee).toFixed(2)}` : fee,
        booked_duration_hours: row.booked_duration_hours ? parseFloat(row.booked_duration_hours) : null
      };
    });

    res.json({
      success: true,
      count: records.length,
      records,
      data: records,
      total,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
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
    payment_method,
    customer_name,
    customer_email,
    customer_phone
  } = req.body;

  if (!vehicle_number) {
    return res.status(400).json({ error: "Vehicle number is required for checkout" });
  }

  const vPlate = vehicle_number.toUpperCase().trim();
  const payMethod = payment_method || "Cash";
  const txnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const vehQuery = await client.query("SELECT * FROM vehicles WHERE UPPER(vehicle_number) = $1 FOR UPDATE", [vPlate]);
    const histQuery = await client.query(
      "SELECT * FROM vehicle_history WHERE UPPER(vehicle_number) = $1 AND (exit_time IS NULL OR LOWER(status) = 'parked') ORDER BY entry_time DESC LIMIT 1 FOR UPDATE",
      [vPlate]
    );
    const resQuery = await client.query(
      "SELECT * FROM reservations WHERE UPPER(vehicle_number) = $1 AND LOWER(status) IN ('checked in', 'confirmed') ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [vPlate]
    );

    if (vehQuery.rowCount === 0 && histQuery.rowCount === 0 && resQuery.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: `Vehicle ${vPlate} does not have an active parking session` });
    }

    const veh = vehQuery.rows[0];
    const hist = histQuery.rows[0];
    const booking = resQuery.rows[0];

    const slotToFree = slot_number || hist?.slot_number || booking?.slot_number || veh?.current_slot || "A-01";
    const ownerName = customer_name || booking?.customer_name || veh?.owner_name || "Customer";
    const ownerEmail = (customer_email || booking?.customer_email || veh?.owner_email || "").trim();
    const ownerPhone = (customer_phone || booking?.customer_phone || veh?.owner_phone || "").trim();

    const actualEntryDate = hist?.entry_time ? new Date(hist.entry_time) : (veh?.created_at ? new Date(veh.created_at) : new Date(Date.now() - 3600000));
    const actualExitDate = exit_time ? new Date(exit_time) : new Date();

    const actualDiffMs = Math.max(0, actualExitDate - actualEntryDate);
    const actualDiffMins = Math.max(1, Math.floor(actualDiffMs / (1000 * 60)));
    const actH = Math.floor(actualDiffMins / 60);
    const actM = actualDiffMins % 60;
    const actualDurationStr = actH > 0 ? (actM > 0 ? `${actH}h ${actM}m` : `${actH}h 00m`) : `${actM}m`;
    const actualBilledHours = Math.max(1, Math.ceil(actualDiffMins / 60));

    let slotRate = 50;
    if (slotToFree) {
      const slotRes = await client.query("SELECT hourly_rate FROM parking_slots WHERE slot_number = $1", [slotToFree]);
      if (slotRes.rowCount > 0 && slotRes.rows[0].hourly_rate) {
        slotRate = parseFloat(slotRes.rows[0].hourly_rate) || 50;
      }
    }

    const settingsRes = await client.query("SELECT value FROM system_settings WHERE key = 'general'");
    const generalSettings = settingsRes.rows[0]?.value || {};
    const graceMinutes = parseInt(generalSettings.overstayGracePeriodMinutes, 10) || 15;
    const defaultOverstayRate = parseFloat(generalSettings.defaultOverstayHourlyRate) || slotRate;

    const isReservation = !!booking;
    let overstayInfo = {
      isOverstay: false,
      inGracePeriod: false,
      overstayMinutes: 0,
      overstayDuration: "0m",
      billedOverstayHours: 0,
      overstayFee: 0,
      remainingMinutes: 0,
      remainingDuration: "0m"
    };

    let planOverstayRate = defaultOverstayRate;
    if (booking?.plan_code) {
      const planRes = await client.query("SELECT overstay_rate, rate FROM pricing_plans WHERE LOWER(plan_code) = LOWER($1)", [booking.plan_code]);
      if (planRes.rowCount > 0) {
        planOverstayRate = planRes.rows[0].overstay_rate ? parseFloat(planRes.rows[0].overstay_rate) : (parseFloat(planRes.rows[0].rate) || slotRate);
      }
    }

    let finalPayableFee = 0;
    let prepaidFee = 0;
    let totalSessionFee = 0;

    if (isReservation) {
      prepaidFee = parseFloat(booking.total_amount) || 0;
      overstayInfo = calculateOverstayDetails({
        scheduledEndTime: booking.end_time,
        actualOrCurrentTime: actualExitDate,
        planOverstayRate,
        defaultHourlyRate: defaultOverstayRate,
        graceMinutes
      });
      finalPayableFee = overstayInfo.overstayFee;
      totalSessionFee = prepaidFee + finalPayableFee;
    } else {
      finalPayableFee = actualBilledHours * slotRate;
      totalSessionFee = finalPayableFee;
    }

    if (slotToFree) {
      await client.query(
        "UPDATE parking_slots SET status = 'available', is_available = true WHERE slot_number = $1",
        [slotToFree]
      );
      await client.query(
        "UPDATE ev_charging_slots SET status = 'Available', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [slotToFree]
      );
    }

    await client.query(
      `UPDATE ev_charging_sessions 
       SET session_status = 'Completed', payment_status = 'Completed', end_time = $1, duration = $2, total_amount = $3, updated_at = CURRENT_TIMESTAMP
       WHERE UPPER(vehicle_number) = $4 AND LOWER(session_status) = 'active'`,
      [actualExitDate, actualDurationStr, finalPayableFee, vPlate]
    );

    await client.query(
      "UPDATE vehicles SET status = 'Checked Out', current_slot = NULL WHERE UPPER(vehicle_number) = $1",
      [vPlate]
    );

    if (isReservation) {
      await client.query(
        `UPDATE reservations 
         SET status = 'Completed',
             actual_exit_time = $1,
             overstay_hours = $2,
             overstay_amount = $3,
             final_total_amount = $4
         WHERE id = $5`,
        [actualExitDate, overstayInfo.billedOverstayHours, overstayInfo.overstayFee, totalSessionFee, booking.id]
      );
    }

    if (hist?.id) {
      await client.query(
        `UPDATE vehicle_history 
         SET exit_time = $1,
             duration = $2,
             fee = $3,
             status = 'Completed',
             overstay_duration = $4,
             overstay_fee = $5,
             normal_fee = $6,
             final_fee = $7
         WHERE id = $8`,
        [
          actualExitDate,
          actualDurationStr,
          `₹${totalSessionFee.toFixed(2)}`,
          overstayInfo.overstayDuration,
          overstayInfo.overstayFee,
          prepaidFee || finalPayableFee,
          totalSessionFee,
          hist.id
        ]
      );
    } else {
      await client.query(
        `INSERT INTO vehicle_history (
          vehicle_number, slot_number, entry_time, exit_time, duration, fee, status,
          booking_id, scheduled_start_time, scheduled_end_time, booked_duration_hours,
          overstay_duration, overstay_fee, normal_fee, final_fee
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Completed', $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          vPlate,
          slotToFree,
          actualEntryDate,
          actualExitDate,
          actualDurationStr,
          `₹${totalSessionFee.toFixed(2)}`,
          booking?.booking_id || null,
          booking?.start_time || null,
          booking?.end_time || null,
          booking?.duration_hours || null,
          overstayInfo.overstayDuration,
          overstayInfo.overstayFee,
          prepaidFee || finalPayableFee,
          totalSessionFee
        ]
      );
    }

    let paymentRecord = null;
    if (finalPayableFee > 0) {
      const paymentInsert = await client.query(
        `INSERT INTO payments (
          transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
          slot_number, entry_time, exit_time, duration, amount, original_amount,
          discount_amount, payment_method, method, payment_status, created_at,
          booking_id, payment_type, base_amount, overstay_amount
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, 0, $11, $11, 'Completed', CURRENT_TIMESTAMP, $12, $13, $14, $15) RETURNING *`,
        [
          txnId,
          vPlate,
          ownerName,
          ownerEmail,
          ownerPhone,
          slotToFree,
          actualEntryDate,
          actualExitDate,
          isReservation ? overstayInfo.overstayDuration : actualDurationStr,
          finalPayableFee,
          payMethod,
          booking?.booking_id || null,
          isReservation ? "Overstay Charge" : "Parking Fee",
          isReservation ? 0 : finalPayableFee,
          isReservation ? overstayInfo.overstayFee : 0
        ]
      );
      paymentRecord = paymentInsert.rows[0];
    }

    await logAuditEvent({
      client,
      userName: req.headers["x-staff-name"] || "Staff Operator",
      role: "Staff",
      action: "Vehicle Exit & Slot Released",
      module: "Operations",
      entityType: "vehicle_exit",
      entityId: vPlate,
      description: `Checkout vehicle ${vPlate} from Bay ${slotToFree}. Fee: ₹${finalPayableFee.toFixed(2)} (${isReservation ? (overstayInfo.overstayFee > 0 ? "Overstay Charge" : "Prepaid Reservation") : "Standard Fee"})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await client.query("COMMIT");
    client.release();

    if (ownerEmail) {
      await notifyUser(ownerEmail, {
        title: "Parking Completed",
        message: `Your parking session for vehicle ${vPlate} has been completed.`,
        type: "parking"
      });
      await notifyUser(ownerEmail, {
        title: "Receipt Available",
        message: "Your digital parking receipt is now available.",
        type: "receipt"
      });
    }
    await notifyStaff({
      title: "Vehicle Exit",
      message: `Vehicle ${vPlate} exited slot ${slotToFree || ''}.`,
      type: "parking"
    });
    await notifyAdmins({
      title: "Important Parking Activity",
      message: `Vehicle ${vPlate} exited slot ${slotToFree || ''}.`,
      type: "parking"
    });

    try {
      await sendParkingSessionCompletedEmail({
        vehicleNumber: vPlate,
        slotNumber: slotToFree || "Assigned Bay",
        entryTime: actualEntryDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        exitTime: actualExitDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        duration: actualDurationStr,
        fee: `₹${finalPayableFee.toFixed(2)}`,
        paymentMethod: payMethod,
        recipient: ownerEmail
      });
      if (finalPayableFee > 0) {
        await sendDigitalReceiptEmail({
          receiptNumber: txnId,
          amount: finalPayableFee,
          vehicleNumber: vPlate,
          slotNumber: slotToFree || "Assigned Bay",
          duration: isReservation ? overstayInfo.overstayDuration : actualDurationStr,
          recipient: ownerEmail
        });
      }
    } catch (e) {
      console.error(e);
    }

    const exitRecord = {
      transaction_id: paymentRecord?.transaction_id || `REC-${Math.floor(10000 + Math.random() * 90000)}`,
      vehicle_number: vPlate,
      slot_number: slotToFree,
      customer_name: ownerName,
      customer_email: ownerEmail,
      customer_phone: ownerPhone,
      entry_time: actualEntryDate.toISOString(),
      exit_time: actualExitDate.toISOString(),
      duration: actualDurationStr,
      is_reservation: isReservation,
      booking_id: booking?.booking_id || null,
      scheduled_start_time: booking?.start_time || null,
      scheduled_end_time: booking?.end_time || null,
      booked_duration_hours: booking?.duration_hours || null,
      prepaid_fee: `₹${prepaidFee.toFixed(2)}`,
      overstay_duration: overstayInfo.overstayDuration,
      overstay_fee: `₹${overstayInfo.overstayFee.toFixed(2)}`,
      final_payable_fee: `₹${finalPayableFee.toFixed(2)}`,
      total_session_fee: `₹${totalSessionFee.toFixed(2)}`,
      fee: `₹${finalPayableFee.toFixed(2)}`,
      payment_method: payMethod,
      payment_status: "Completed",
      payment_type: isReservation ? (overstayInfo.overstayFee > 0 ? "Overstay Charge" : "Prepaid Reservation") : "Parking Fee"
    };

    res.status(200).json({
      success: true,
      message: `Vehicle ${vPlate} checked out successfully. Bay ${slotToFree || ''} is now available.`,
      exitRecord,
      receipt: exitRecord,
      payment: paymentRecord
    });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
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
  const { email, name, search, status, page, limit } = req.query;
  try {
    let baseFromWhere = `
      FROM vehicle_history vh
      LEFT JOIN vehicles v ON UPPER(vh.vehicle_number) = UPPER(v.vehicle_number)
      LEFT JOIN parking_slots ps ON vh.slot_number = ps.slot_number
      LEFT JOIN LATERAL (
        SELECT p.transaction_id, p.payment_method, p.customer_name, p.customer_email
        FROM payments p
        WHERE UPPER(p.vehicle_number) = UPPER(vh.vehicle_number)
        ORDER BY ABS(EXTRACT(EPOCH FROM (p.created_at - vh.entry_time))) ASC
        LIMIT 1
      ) p_match ON true
      LEFT JOIN LATERAL (
        SELECT r.booking_id, r.customer_name, r.customer_email
        FROM reservations r
        WHERE UPPER(r.vehicle_number) = UPPER(vh.vehicle_number)
        ORDER BY ABS(EXTRACT(EPOCH FROM (r.created_at - vh.entry_time))) ASC
        LIMIT 1
      ) r_match ON true
      WHERE 1=1
    `;
    const params = [];
    if (email) {
      params.push(email.trim().toLowerCase());
      baseFromWhere += ` AND (
        LOWER(COALESCE(v.owner_email, '')) = $${params.length}
        OR LOWER(COALESCE(p_match.customer_email, '')) = $${params.length}
        OR LOWER(COALESCE(r_match.customer_email, '')) = $${params.length}
        OR EXISTS (SELECT 1 FROM vehicles v2 WHERE UPPER(v2.vehicle_number) = UPPER(vh.vehicle_number) AND LOWER(v2.owner_email) = $${params.length})
        OR EXISTS (SELECT 1 FROM reservations r2 WHERE UPPER(r2.vehicle_number) = UPPER(vh.vehicle_number) AND LOWER(r2.customer_email) = $${params.length})
        OR EXISTS (SELECT 1 FROM payments p2 WHERE UPPER(p2.vehicle_number) = UPPER(vh.vehicle_number) AND LOWER(p2.customer_email) = $${params.length})
      )`;
    } else if (name) {
      params.push(`%${name.trim().toLowerCase()}%`);
      baseFromWhere += ` AND (
        LOWER(COALESCE(v.owner_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(p_match.customer_name, '')) LIKE $${params.length}
        OR LOWER(COALESCE(r_match.customer_name, '')) LIKE $${params.length}
      )`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseFromWhere += ` AND (
        LOWER(vh.vehicle_number) LIKE $${params.length}
        OR LOWER(vh.slot_number) LIKE $${params.length}
        OR LOWER(COALESCE(p_match.transaction_id, '')) LIKE $${params.length}
      )`;
    }

    if (status && status !== "ALL") {
      params.push(status.trim().toLowerCase());
      baseFromWhere += ` AND LOWER(vh.status) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseFromWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const selectCols = `
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
        COALESCE(v.owner_name, p_match.customer_name, r_match.customer_name, 'Customer') as owner_name,
        COALESCE(v.owner_email, p_match.customer_email, r_match.customer_email, '') as owner_email,
        COALESCE(ps.zone, 'Zone A') as zone,
        COALESCE(ps.hourly_rate, 50.00) as hourly_rate,
        COALESCE(p_match.transaction_id, r_match.booking_id) as transaction_id,
        COALESCE(p_match.payment_method, 'UPI') as payment_method
    `;

    let histRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      histRes = await pool.query(
        `${selectCols} ${baseFromWhere} ORDER BY vh.entry_time DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      histRes = await pool.query(`${selectCols} ${baseFromWhere} ORDER BY vh.entry_time DESC`, params);
    }

    let activeReservations = [];
    if (email || name) {
      const activeResQuery = `
        SELECT 
          CONCAT('res-', r.id) as id,
          r.vehicle_number,
          r.slot_number,
          COALESCE(r.actual_entry_time, r.start_time) as entry_time,
          NULL as exit_time,
          CONCAT(COALESCE(r.duration_hours, 1), 'h booked (Ongoing)') as duration,
          CONCAT('₹', CAST(COALESCE(r.total_amount, 50.00) AS NUMERIC(10,2))) as fee,
          'Parked' as status,
          r.created_at,
          COALESCE(r.vehicle_type, 'Car') as vehicle_type,
          COALESCE(r.model, 'Standard') as model,
          COALESCE(r.customer_name, 'Customer') as owner_name,
          COALESCE(r.customer_email, '') as owner_email,
          COALESCE(r.zone, 'Zone A') as zone,
          50.00 as hourly_rate,
          r.booking_id as transaction_id,
          'UPI' as payment_method
        FROM reservations r
        WHERE LOWER(r.status) IN ('confirmed', 'checked in')
          AND (
            ($1::text IS NOT NULL AND LOWER(r.customer_email) = $1)
            OR ($2::text IS NOT NULL AND LOWER(r.customer_name) LIKE '%' || $2 || '%')
          )
          AND NOT EXISTS (
            SELECT 1 FROM vehicle_history vh2 
            WHERE (vh2.booking_id = r.booking_id OR (UPPER(vh2.vehicle_number) = UPPER(r.vehicle_number) AND vh2.slot_number = r.slot_number AND LOWER(vh2.status) = 'parked'))
          )
        ORDER BY r.id DESC
      `;
      const cleanEmail = email ? email.trim().toLowerCase() : null;
      const cleanName = name ? name.trim().toLowerCase() : null;
      const actRes = await pool.query(activeResQuery, [cleanEmail, cleanName]);
      activeReservations = actRes.rows;
    }

    const allRows = (status && status.toUpperCase() === "COMPLETED")
      ? histRes.rows
      : [...activeReservations, ...histRes.rows];

    const now = new Date();
    const formattedRows = allRows.map(r => {
      const isParked = (r.status || "").toLowerCase() === "parked" || (r.status || "").toLowerCase() === "active" || (r.status || "").toLowerCase() === "checked in" || (r.status || "").toLowerCase() === "confirmed" || !r.exit_time;
      let duration = r.duration;
      let fee = r.fee;
      if (isParked && r.entry_time) {
        const entryDate = new Date(r.entry_time);
        const diffMs = Math.max(0, now.getTime() - entryDate.getTime());
        const diffMins = Math.floor(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        duration = hrs > 0 ? `${hrs}h ${mins}m (Ongoing)` : `${mins}m (Ongoing)`;
        const billedHours = Math.max(1, Math.ceil(diffMins / 60));
        const rate = parseFloat(r.hourly_rate) || 50;
        fee = `₹${(billedHours * rate).toFixed(2)}`;
      }
      return {
        ...r,
        exit_time: isParked ? null : r.exit_time,
        duration: duration || "1h 00m",
        fee: fee || "₹50.00",
        status: isParked ? "Parked" : "Completed"
      };
    });

    res.json({
      success: true,
      count: formattedRows.length,
      history: formattedRows,
      data: formattedRows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer parking history" });
  }
});

app.get("/api/bookings", async (req, res) => {
  const { search, status, page, limit } = req.query;
  try {
    let baseWhere = "FROM reservations WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.toLowerCase().trim()}%`);
      baseWhere += ` AND (LOWER(booking_id) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(vehicle_number) LIKE $${params.length} OR LOWER(slot_number) LIKE $${params.length} OR LOWER(validation_code) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      baseWhere += ` AND LOWER(status) = LOWER($${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let result;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      result = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      result = await pool.query(`SELECT * ${baseWhere} ORDER BY id DESC`, params);
    }

    const allRes = await pool.query("SELECT * FROM reservations");
    const allRows = allRes.rows;

    const allTotal = allRows.length;
    const confirmed = allRows.filter((r) => (r.status || "").toLowerCase() === "confirmed").length;
    const pending = allRows.filter((r) => (r.status || "").toLowerCase() === "pending").length;
    const checkedIn = allRows.filter((r) => (r.status || "").toLowerCase().includes("check") || (r.status || "").toLowerCase() === "validated").length;
    const totalRevenue = allRows.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

    res.json({
      success: true,
      count: result.rows.length,
      bookings: result.rows,
      data: result.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      stats: {
        total: allTotal,
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
  const { email, name, search, status, page, limit } = req.query;
  try {
    let baseWhere = "FROM reservations WHERE 1=1";
    const params = [];

    if (email) {
      params.push(email.toLowerCase().trim());
      baseWhere += ` AND (LOWER(COALESCE(customer_email, '')) = $${params.length} OR LOWER(COALESCE(customer_name, '')) = $${params.length})`;
    } else if (name) {
      params.push(`%${name.toLowerCase().trim()}%`);
      baseWhere += ` AND LOWER(COALESCE(customer_name, '')) LIKE $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.toLowerCase().trim()}%`);
      baseWhere += ` AND (LOWER(booking_id) LIKE $${params.length} OR LOWER(vehicle_number) LIKE $${params.length} OR LOWER(slot_number) LIKE $${params.length} OR LOWER(validation_code) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      baseWhere += ` AND LOWER(status) = LOWER($${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    let total = parseInt(countRes.rows[0].count, 10) || 0;

    let result;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      result = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      result = await pool.query(`SELECT * ${baseWhere} ORDER BY id DESC`, params);
    }

    if (result.rowCount === 0 && (email || name) && !search && (!status || status === "ALL")) {
      const allRes = await pool.query("SELECT * FROM reservations ORDER BY id DESC LIMIT 5");
      return res.json({
        success: true,
        count: allRes.rows.length,
        reservations: allRes.rows,
        data: allRes.rows,
        total: allRes.rows.length,
        pagination: {
          page: 1,
          limit: 5,
          total: allRes.rows.length,
          totalPages: 1
        }
      });
    }

    res.json({
      success: true,
      count: result.rows.length,
      reservations: result.rows,
      data: result.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
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
    plan_name,
    coupon_code,
    original_amount
  } = req.body;

  if (!customer_name || !vehicle_number || !slot_number) {
    return res.status(400).json({ error: "Customer name, vehicle plate, and slot are required" });
  }

  const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;
  const valCode = `VAL-${Math.floor(1000 + Math.random() * 9000)}`;
  const vPlate = vehicle_number.trim().toUpperCase();
  const vType = vehicle_type || "Car";
  const vModel = model || "Standard";
  const now = new Date();
  const createdAtStr = getLocalTimestamp(now);
  const sTimeStr = parseToLocalTimestampString(start_time, now);

  let sTimeFinal = sTimeStr;
  let eTimeFinal = "";
  let durHours = 1;
  let durDisplay = "1h 00m";

  if (end_time) {
    const durCalc = calculateDurationBetween(sTimeStr, end_time);
    if (durCalc.diffMs <= 0) {
      return res.status(400).json({ error: "Exit date and time must be later than entry date and time" });
    }
    sTimeFinal = durCalc.startStr;
    eTimeFinal = durCalc.endStr;
    durHours = durCalc.totalHours;
    durDisplay = durCalc.durationStr;
  } else {
    durHours = Math.max(0.5, parseFloat(duration_hours) || 1);
    const calculatedEndTime = new Date(new Date(sTimeStr.replace(" ", "T")).getTime() + durHours * 3600000);
    eTimeFinal = getLocalTimestamp(calculatedEndTime);
    durDisplay = `${durHours}h 00m`;
  }

  const feeCalc = await calculateBookingFeeFromPlan({
    planCode: plan_code,
    durationHours: durHours,
    vehicleType: vType,
    client: pool
  });
  const rawBaseAmount = feeCalc.baseAmount;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let finalAmount = rawBaseAmount;
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (coupon_code && String(coupon_code).trim()) {
      const couponValidation = await validateCoupon({
        code: String(coupon_code).trim(),
        customerEmail: customer_email || "",
        orderAmount: rawBaseAmount,
        serviceType: "Normal Parking",
        db: client
      });

      if (!couponValidation.valid) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: couponValidation.error });
      }

      discountAmount = couponValidation.discount_amount;
      finalAmount = couponValidation.final_amount;
      appliedCouponCode = couponValidation.code;
    }

    let isEvSlot = false;
    let slotCheck = await client.query("SELECT * FROM parking_slots WHERE slot_number = $1 FOR UPDATE", [slot_number]);
    let targetZone = zone;
    if (slotCheck.rowCount === 0) {
      const evCheck = await client.query("SELECT * FROM ev_charging_slots WHERE UPPER(slot_number) = UPPER($1) FOR UPDATE", [slot_number]);
      if (evCheck.rowCount === 0) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `Slot ${slot_number} does not exist` });
      }
      isEvSlot = true;
      const evRow = evCheck.rows[0];
      if (evRow.status && evRow.status.toLowerCase() !== "available") {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `Slot ${slot_number} is currently ${evRow.status}` });
      }
      targetZone = targetZone || evRow.location_name || "Zone C (EV Station)";
    } else {
      if (slotCheck.rows[0].status === "occupied" || slotCheck.rows[0].status === "reserved" || !slotCheck.rows[0].is_available) {
        await client.query("ROLLBACK");
        client.release();
        return res.status(400).json({ error: `Slot ${slot_number} is already occupied or reserved` });
      }
      targetZone = targetZone || slotCheck.rows[0].zone || "Zone A";
    }

    const insertRes = await client.query(
      `INSERT INTO reservations (
        booking_id, customer_name, customer_email, customer_phone, vehicle_number,
        vehicle_type, model, slot_number, zone, start_time, end_time, duration_hours,
        total_amount, original_amount, discount_amount, coupon_code,
        status, validation_code, plan_code, plan_name, created_at, final_total_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Confirmed', $17, $18, $19, $20, $13) RETURNING *`,
      [
        bookingId,
        customer_name,
        customer_email || "",
        customer_phone || "",
        vPlate,
        vType,
        vModel,
        slot_number,
        targetZone,
        sTimeFinal,
        eTimeFinal,
        durHours,
        finalAmount,
        rawBaseAmount,
        discountAmount,
        appliedCouponCode,
        valCode,
        plan_code || (feeCalc.plan?.plan_code || "PLAN-STD"),
        plan_name || (feeCalc.plan?.plan_name || "Standard Parking"),
        createdAtStr
      ]
    );

    if (isEvSlot) {
      await client.query(
        "UPDATE ev_charging_slots SET status = 'Reserved', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [slot_number]
      );
    } else {
      await client.query(
        "UPDATE parking_slots SET status = 'reserved', is_available = false WHERE slot_number = $1",
        [slot_number]
      );
    }

    await client.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot)
       VALUES ($1, $2, $3, $4, $5, $6, 'Reserved', $7)
       ON CONFLICT (vehicle_number)
       DO UPDATE SET
         status = 'Reserved',
         current_slot = EXCLUDED.current_slot,
         owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), vehicles.owner_name),
         owner_email = COALESCE(NULLIF(EXCLUDED.owner_email, ''), vehicles.owner_email),
         owner_phone = COALESCE(NULLIF(EXCLUDED.owner_phone, ''), vehicles.owner_phone),
         vehicle_type = COALESCE(NULLIF(EXCLUDED.vehicle_type, ''), vehicles.vehicle_type),
         model = COALESCE(NULLIF(EXCLUDED.model, ''), vehicles.model)`,
      [vPlate, vType, vModel, customer_name, customer_email || "", customer_phone || "", slot_number]
    );

    const payTxnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const payMethod = req.body.payment_method || "UPI";
    await client.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, original_amount, discount_amount, coupon_code,
        payment_method, method, payment_status, created_at, booking_id, payment_type, base_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'Completed', $16, $17, 'Parking Fee', $10)`,
      [
        payTxnId,
        vPlate,
        customer_name,
        customer_email || "",
        customer_phone || "",
        slot_number,
        sTimeFinal,
        eTimeFinal,
        durDisplay,
        finalAmount,
        rawBaseAmount,
        discountAmount,
        appliedCouponCode,
        payMethod,
        payMethod,
        createdAtStr,
        bookingId
      ]
    );

    if (appliedCouponCode && discountAmount > 0) {
      await recordCouponUsage({
        client,
        couponCode: appliedCouponCode,
        customerEmail: customer_email || "customer@parksafe.in",
        customerName: customer_name,
        bookingId: bookingId,
        paymentId: payTxnId,
        originalAmount: rawBaseAmount,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        serviceType: "Normal Parking",
        req
      });
    }

    await logAuditEvent({
      client,
      userName: customer_name,
      userEmail: customer_email || null,
      role: "Customer",
      action: "Booking Created",
      module: "Bookings",
      entityType: "booking",
      entityId: bookingId,
      description: `Slot ${slot_number} reserved for vehicle ${vPlate} (${durHours}h, ₹${finalAmount.toFixed(2)}${discountAmount > 0 ? ` with ₹${discountAmount.toFixed(2)} coupon discount [${appliedCouponCode}]` : ""})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await logAuditEvent({
      client,
      userName: customer_name,
      userEmail: customer_email || null,
      role: "Customer",
      action: "Payment Completed",
      module: "Payments",
      entityType: "payment",
      entityId: payTxnId,
      description: `Reservation advance payment of ₹${finalAmount.toFixed(2)} via ${payMethod} for ${vPlate}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await client.query("COMMIT");
    client.release();

    const custEmail = customer_email || "";
    if (custEmail) {
      await notifyUser(custEmail, {
        title: "Reservation Confirmed",
        message: `Your parking slot ${slot_number} has been reserved.`,
        type: "reservation"
      });
    }
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
    await client.query("ROLLBACK");
    client.release();
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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

    query += " ORDER BY id DESC LIMIT 1 FOR UPDATE";

    const findRes = await client.query(query, params);
    if (findRes.rowCount === 0) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Reservation not found or invalid validation credentials" });
    }

    const booking = findRes.rows[0];

    if ((booking.status || "").toLowerCase() === "checked in") {
      await client.query("ROLLBACK");
      client.release();
      return res.json({
        success: true,
        alreadyValidated: true,
        message: `Booking ${booking.booking_id} was already validated & checked in.`,
        validatedBooking: booking
      });
    }

    const now = new Date();
    const nowStr = getLocalTimestamp(now);
    const updatedRes = await client.query(
      `UPDATE reservations 
       SET status = 'Checked In', validated_at = $1, validated_by = $2, actual_entry_time = $1 
       WHERE id = $3 RETURNING *`,
      [nowStr, validated_by || "Staff Operator", booking.id]
    );

    await client.query(
      "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE slot_number = $1",
      [booking.slot_number]
    );

    await client.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot)
       VALUES ($1, $2, COALESCE($3, 'Standard'), $4, $5, $6, 'Parked', $7)
       ON CONFLICT (vehicle_number)
       DO UPDATE SET
         status = 'Parked',
         current_slot = EXCLUDED.current_slot,
         owner_name = COALESCE(NULLIF(EXCLUDED.owner_name, ''), vehicles.owner_name),
         owner_email = COALESCE(NULLIF(EXCLUDED.owner_email, ''), vehicles.owner_email),
         owner_phone = COALESCE(NULLIF(EXCLUDED.owner_phone, ''), vehicles.owner_phone),
         vehicle_type = COALESCE(NULLIF(EXCLUDED.vehicle_type, ''), vehicles.vehicle_type),
         model = COALESCE(NULLIF(EXCLUDED.model, ''), vehicles.model)`,
      [booking.vehicle_number, booking.vehicle_type || "Car", booking.model || "Standard", booking.customer_name, booking.customer_email, booking.customer_phone, booking.slot_number]
    );

    await client.query(
      `INSERT INTO vehicle_history (
        vehicle_number, slot_number, entry_time, exit_time, duration, fee, status,
        booking_id, scheduled_start_time, scheduled_end_time, booked_duration_hours, normal_fee
      ) VALUES ($1, $2, $3, NULL, 'Ongoing', $4, 'Parked', $5, $6, $7, $8, $9)`,
      [
        booking.vehicle_number,
        booking.slot_number,
        nowStr,
        `₹${parseFloat(booking.total_amount).toFixed(2)}`,
        booking.booking_id,
        booking.start_time,
        booking.end_time,
        booking.duration_hours,
        parseFloat(booking.total_amount) || 0
      ]
    );

    await logAuditEvent({
      client,
      userName: validated_by || "Staff Operator",
      role: "Staff",
      action: "Reservation Validated",
      module: "Bookings",
      entityType: "booking",
      entityId: booking.booking_id,
      description: `Vehicle ${booking.vehicle_number} checked in to slot ${booking.slot_number}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    await client.query("COMMIT");
    client.release();

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
    await client.query("ROLLBACK");
    client.release();
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
      await pool.query(
        "UPDATE ev_charging_slots SET status = 'Available', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [updatedBooking.slot_number]
      );
      await pool.query(
        "UPDATE vehicles SET status = 'Registered', current_slot = NULL WHERE vehicle_number = $1 AND status = 'Reserved'",
        [updatedBooking.vehicle_number]
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
      await pool.query(
        "UPDATE ev_charging_slots SET status = 'Reserved', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
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
      await pool.query(
        "UPDATE ev_charging_slots SET status = 'Charging', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [updatedBooking.slot_number]
      );
      await pool.query(
        "UPDATE vehicles SET status = 'Parked', current_slot = $1 WHERE vehicle_number = $2",
        [updatedBooking.slot_number, updatedBooking.vehicle_number]
      );
      const existingSession = await pool.query(
        "SELECT id FROM vehicle_history WHERE vehicle_number = $1 AND slot_number = $2 AND status = 'Parked' AND exit_time IS NULL LIMIT 1",
        [updatedBooking.vehicle_number, updatedBooking.slot_number]
      );
      if (existingSession.rows.length === 0) {
        const nowIso = new Date().toISOString().replace("T", " ").substring(0, 23);
        await pool.query(
          "INSERT INTO vehicle_history (vehicle_number, slot_number, entry_time, exit_time, duration, fee, status) VALUES ($1, $2, $3, NULL, 'Ongoing', $4, 'Parked')",
          [updatedBooking.vehicle_number, updatedBooking.slot_number, nowIso, `₹${parseFloat(updatedBooking.total_amount || 0).toFixed(2)}`]
        );
      }
      if (updatedBooking.customer_email) {
        await notifyUser(updatedBooking.customer_email, {
          title: "Checked In Successfully",
          message: `Your vehicle ${updatedBooking.vehicle_number} has been checked into bay ${updatedBooking.slot_number}.`,
          type: "vehicle"
        });
      }
    } else if (status.toLowerCase() === "completed" || status.toLowerCase() === "checked out") {
      await pool.query(
        "UPDATE parking_slots SET status = 'available', is_available = true WHERE slot_number = $1",
        [updatedBooking.slot_number]
      );
      await pool.query(
        "UPDATE ev_charging_slots SET status = 'Available', updated_at = CURRENT_TIMESTAMP WHERE UPPER(slot_number) = UPPER($1)",
        [updatedBooking.slot_number]
      );
      await pool.query(
        "UPDATE ev_charging_sessions SET session_status = 'Completed', payment_status = 'Completed', updated_at = CURRENT_TIMESTAMP WHERE UPPER(vehicle_number) = UPPER($1) AND LOWER(session_status) = 'active'",
        [updatedBooking.vehicle_number]
      );
      await pool.query(
        "UPDATE vehicles SET status = 'Checked Out', current_slot = NULL WHERE vehicle_number = $1",
        [updatedBooking.vehicle_number]
      );
      const exitTime = updatedBooking.end_time ? new Date(updatedBooking.end_time) : new Date();
      const dur = updatedBooking.duration_hours ? `${parseFloat(updatedBooking.duration_hours).toFixed(0)}h 00m` : "1h 00m";
      await pool.query(
        `UPDATE vehicle_history 
         SET exit_time = $1, duration = $2, fee = $3, status = 'Completed' 
         WHERE id = (
           SELECT id FROM vehicle_history 
           WHERE UPPER(vehicle_number) = UPPER($4) AND (exit_time IS NULL OR LOWER(status) = 'parked')
           ORDER BY entry_time DESC 
           LIMIT 1
         )`,
        [exitTime, dur, `₹${parseFloat(updatedBooking.total_amount || 0).toFixed(2)}`, updatedBooking.vehicle_number]
      );
      if (updatedBooking.customer_email) {
        await notifyUser(updatedBooking.customer_email, {
          title: "Parking Completed",
          message: `Your parking session for ${updatedBooking.vehicle_number} at bay ${updatedBooking.slot_number} has concluded.`,
          type: "parking"
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
  const { active, vehicle_type, billing_type, search, page, limit } = req.query;
  try {
    let baseWhere = "FROM pricing_plans WHERE 1=1";
    const params = [];

    if (active === "true") {
      baseWhere += " AND is_active = true";
    } else if (active === "false") {
      baseWhere += " AND is_active = false";
    }

    if (vehicle_type && vehicle_type !== "All") {
      params.push(vehicle_type);
      baseWhere += ` AND (LOWER(vehicle_type) = LOWER($${params.length}) OR LOWER(vehicle_type) = 'all')`;
    }

    if (billing_type && billing_type !== "All") {
      params.push(billing_type);
      baseWhere += ` AND LOWER(billing_type) = LOWER($${params.length})`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      baseWhere += ` AND (plan_name ILIKE $${params.length} OR plan_code ILIKE $${params.length} OR description ILIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let plansRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      plansRes = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      plansRes = await pool.query(`SELECT * ${baseWhere} ORDER BY id ASC`, params);
    }

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
      data: plansRes.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      },
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
  const { plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active, overstay_rate } = req.body;

  if (!plan_name || !rate) {
    return res.status(400).json({ error: "Plan name and rate are required" });
  }

  const pRate = parseFloat(rate) || 50.00;
  const pDur = duration_hours ? parseFloat(duration_hours) : (billing_type === "Daily" ? 24.00 : 1.00);
  const pOverstayRate = overstay_rate !== undefined && overstay_rate !== "" && overstay_rate !== null ? parseFloat(overstay_rate) : pRate;
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
      `INSERT INTO pricing_plans (plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active, overstay_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [pCode, plan_name.trim(), vehicle_type || "Car", billing_type || "Hourly", pRate, pDur, description || "", pFeatures, pActive, pOverstayRate]
    );

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Pricing Plan Created",
      module: "Pricing",
      entityType: "pricing_plan",
      entityId: pCode,
      description: `Created pricing plan "${plan_name}" at ₹${pRate.toFixed(2)} (${billing_type || "Hourly"})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const { plan_code, plan_name, vehicle_type, billing_type, rate, duration_hours, description, features, is_active, overstay_rate } = req.body;

  try {
    const pRate = parseFloat(rate) || 50.00;
    const pDur = duration_hours ? parseFloat(duration_hours) : (billing_type === "Daily" ? 24.00 : 1.00);
    const pOverstayRate = overstay_rate !== undefined && overstay_rate !== "" && overstay_rate !== null ? parseFloat(overstay_rate) : null;
    const pActive = is_active !== false;
    const pFeatures = Array.isArray(features) ? features : ["Covered Parking", "CCTV Surveillance"];

    const updateRes = await pool.query(
      `UPDATE pricing_plans 
       SET plan_code = COALESCE($1, plan_code), plan_name = $2, vehicle_type = $3, billing_type = $4, rate = $5, duration_hours = $6, description = $7, features = $8, is_active = $9, overstay_rate = COALESCE($10, overstay_rate)
       WHERE id = $11 RETURNING *`,
      [plan_code || null, plan_name, vehicle_type, billing_type, pRate, pDur, description, pFeatures, pActive, pOverstayRate, id]
    );

    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Pricing plan not found" });
    }

    const updatedPlan = updateRes.rows[0];
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Pricing Plan Updated",
      module: "Pricing",
      entityType: "pricing_plan",
      entityId: updatedPlan.plan_code,
      description: `Updated pricing plan "${plan_name}" (rate: ₹${pRate.toFixed(2)})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Pricing Plan Status Changed",
      module: "Pricing",
      entityType: "pricing_plan",
      entityId: plan.plan_code,
      description: `Changed status of pricing plan "${plan.plan_name}" to ${is_active ? "Active" : "Inactive"}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Pricing Plan Deleted",
      module: "Pricing",
      entityType: "pricing_plan",
      entityId: plan.plan_code,
      description: `Deleted pricing plan "${plan.plan_name}" (${plan.plan_code})`,
      severity: "Medium",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const { email, search, status, priority, category, page, limit } = req.query;
  try {
    let baseWhere = "FROM support_tickets WHERE 1=1";
    const params = [];

    if (email) {
      params.push(email.toLowerCase());
      baseWhere += ` AND LOWER(customer_email) = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseWhere += ` AND (LOWER(ticket_code) LIKE $${params.length} OR LOWER(subject) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR LOWER(COALESCE(description, '')) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseWhere += ` AND LOWER(status) = $${params.length}`;
    }

    if (priority && priority !== "ALL") {
      params.push(priority.toLowerCase());
      baseWhere += ` AND LOWER(priority) = $${params.length}`;
    }

    if (category && category !== "ALL") {
      params.push(category.toLowerCase());
      baseWhere += ` AND LOWER(category) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let result;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      result = await pool.query(
        `SELECT * ${baseWhere} ORDER BY created_at DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      result = await pool.query(`SELECT * ${baseWhere} ORDER BY created_at DESC`, params);
    }

    res.json({
      success: true,
      tickets: result.rows,
      data: result.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
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

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin Support",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Support Ticket Status Updated",
      module: "Support",
      entityType: "support_ticket",
      entityId: ticket.ticket_code,
      description: `Updated status of ticket ${ticket.ticket_code} to "${status}"`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    const ticket = updateRes.rows[0];
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin Support",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Support Ticket Priority Updated",
      module: "Support",
      entityType: "support_ticket",
      entityId: ticket.ticket_code,
      description: `Updated priority of ticket ${ticket.ticket_code} to "${priority}"`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    const delTicket = deleteRes.rows[0];
    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin Support",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Support Ticket Deleted",
      module: "Support",
      entityType: "support_ticket",
      entityId: delTicket.ticket_code,
      description: `Deleted support ticket ${delTicket.ticket_code} ("${delTicket.subject}")`,
      severity: "Medium",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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

    await logAuditEvent({
      userName: sender || req.headers["x-admin-name"] || "Admin Support",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Support Reply Sent",
      module: "Support",
      entityType: "support_ticket",
      entityId: ticket.ticket_code,
      description: `Sent official response to customer on ticket ${ticket.ticket_code}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

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
  const email = user_email || "";
  const plan = plan_name || "Monthly VIP Priority Pass";
  const planAmount = parseFloat(amount) || 2500.00;

  try {
    if (email) {
      await notifyUser(email, {
        title: "Premium Plan Activated",
        message: `Your Premium parking plan "${plan}" has been activated.`,
        type: "premium"
      });
    }

    await notifyAdmins({
      title: "Important System Activity",
      message: `Customer ${customer_name || email} activated ${plan} (₹${planAmount.toFixed(2)}).`,
      type: "premium"
    });

    const premTxnId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const premMethod = req.body.payment_method || "Credit Card";
    await pool.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, payment_method, method, payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days', '30 Days', $7, $8, $9, 'Completed', CURRENT_TIMESTAMP)`,
      [
        premTxnId,
        vehicle || "DL01 AB 1234",
        customer_name || "Customer",
        email,
        "",
        slot || "Zone A",
        planAmount,
        premMethod,
        premMethod
      ]
    );

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

app.get("/api/parking-locations", async (req, res) => {
  const { page, limit, search, status } = req.query;
  try {
    let baseWhere = "FROM parking_locations WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseWhere += ` AND (LOWER(name) LIKE $${params.length} OR LOWER(address) LIKE $${params.length} OR LOWER(code) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseWhere += ` AND LOWER(status) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let locationsRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      locationsRes = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      locationsRes = await pool.query(`SELECT * ${baseWhere} ORDER BY id ASC`, params);
    }

    res.json({
      success: true,
      locations: locationsRes.rows,
      data: locationsRes.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching parking locations" });
  }
});

app.post("/api/parking-locations", async (req, res) => {
  const { code, name, address, total_slots, occupied_slots, zones, active_staff, opening_hours, rate_multiplier, status } = req.body;
  if (!name || !address) {
    return res.status(400).json({ error: "Name and address are required" });
  }
  const locCode = code || `LOC-${Date.now().toString().slice(-4)}`;
  try {
    const insertRes = await pool.query(
      `INSERT INTO parking_locations (code, name, address, total_slots, occupied_slots, zones, active_staff, opening_hours, rate_multiplier, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [locCode, name, address, parseInt(total_slots, 10) || 50, parseInt(occupied_slots, 10) || 0, zones || ['Zone A', 'Zone B'], parseInt(active_staff, 10) || 2, opening_hours || '24/7 Access', rate_multiplier || '1.0x (Standard)', status || 'Active']
    );
    res.status(201).json({ success: true, location: insertRes.rows[0], message: "Location added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating location" });
  }
});

app.put("/api/parking-locations/:id", async (req, res) => {
  const { id } = req.params;
  const { name, address, total_slots, occupied_slots, zones, active_staff, opening_hours, rate_multiplier, status } = req.body;
  try {
    const updateRes = await pool.query(
      `UPDATE parking_locations
       SET name = COALESCE($1, name),
           address = COALESCE($2, address),
           total_slots = COALESCE($3, total_slots),
           occupied_slots = COALESCE($4, occupied_slots),
           zones = COALESCE($5, zones),
           active_staff = COALESCE($6, active_staff),
           opening_hours = COALESCE($7, opening_hours),
           rate_multiplier = COALESCE($8, rate_multiplier),
           status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [name, address, total_slots !== undefined ? parseInt(total_slots, 10) : null, occupied_slots !== undefined ? parseInt(occupied_slots, 10) : null, zones, active_staff !== undefined ? parseInt(active_staff, 10) : null, opening_hours, rate_multiplier, status, id]
    );
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json({ success: true, location: updateRes.rows[0], message: "Location updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating location" });
  }
});

app.delete("/api/parking-locations/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await pool.query("DELETE FROM parking_locations WHERE id = $1 RETURNING *", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    res.json({ success: true, message: "Location deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting location" });
  }
});

app.get("/api/system-settings", async (req, res) => {
  try {
    const settingsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'general'");
    if (settingsRes.rowCount > 0) {
      res.json({ success: true, settings: settingsRes.rows[0].value });
    } else {
      res.json({
        success: true,
        settings: {
          systemName: "Shnoor Smart Parking Management System",
          contactEmail: "support@shnoor.com",
          supportPhone: "+91 80 4567 8900",
          currency: "INR (₹)",
          timezone: "Asia/Kolkata (IST +5:30)",
          operatingHours: "24/7 All Locations",
          maintenanceMode: false,
          autoAssignBays: true,
          overstayGracePeriodMinutes: 15,
          lostTicketFlatFee: 500,
          emailAlerts: true,
          smsAlerts: true,
          whatsappAlerts: false
        }
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching system settings" });
  }
});

app.put("/api/system-settings", async (req, res) => {
  const settings = req.body;
  try {
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES ('general', $1, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [JSON.stringify(settings)]
    );

    await logAuditEvent({
      userName: req.headers["x-admin-name"] || "Admin",
      userEmail: req.headers["x-admin-email"] || null,
      role: "Admin",
      action: "Settings Updated",
      module: "Settings",
      entityType: "system_settings",
      entityId: "general",
      description: "Updated global system configurations and parking operational policies",
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    res.json({ success: true, settings, message: "System settings updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating system settings" });
  }
});

const verifyAdminAccess = async (req) => {
  let adminEmail = req.headers["x-admin-email"] || req.headers["x-user-email"] || req.query.admin_email || req.query.email || "";
  const authHeader = req.headers["authorization"] || "";
  if (!adminEmail && authHeader) {
    adminEmail = authHeader.replace(/^Bearer\s+/i, "").trim();
  }
  if (!adminEmail) {
    return { error: "Unauthorized: Admin authentication required", status: 401 };
  }
  const adminResult = await pool.query(
    "SELECT id, name, email, role, status FROM users WHERE LOWER(email) = LOWER($1)",
    [adminEmail.trim()]
  );
  if (adminResult.rowCount === 0 || (adminResult.rows[0].status && adminResult.rows[0].status.toLowerCase() === "inactive")) {
    return { error: "Unauthorized: Invalid or inactive admin account", status: 401 };
  }
  const adminUser = adminResult.rows[0];
  if (adminUser.role !== "admin") {
    return { error: "Forbidden: Administrator privileges required", status: 403 };
  }
  return { user: adminUser };
};

app.get("/api/admin/audit-logs/summary", async (req, res) => {
  const auth = await verifyAdminAccess(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  try {
    const totalRes = await pool.query("SELECT COUNT(*) FROM audit_logs");
    const todayRes = await pool.query("SELECT COUNT(*) FROM audit_logs WHERE DATE(created_at) = CURRENT_DATE");
    const successRes = await pool.query("SELECT COUNT(*) FROM audit_logs WHERE LOWER(COALESCE(status, 'success')) = 'success'");
    const failedRes = await pool.query("SELECT COUNT(*) FROM audit_logs WHERE LOWER(COALESCE(status, '')) = 'failed'");
    const adminRes = await pool.query("SELECT COUNT(*) FROM audit_logs WHERE LOWER(COALESCE(user_role, role, '')) = 'admin'");

    res.json({
      success: true,
      summary: {
        totalLogs: parseInt(totalRes.rows[0].count, 10) || 0,
        todayLogs: parseInt(todayRes.rows[0].count, 10) || 0,
        successfulActions: parseInt(successRes.rows[0].count, 10) || 0,
        failedActions: parseInt(failedRes.rows[0].count, 10) || 0,
        adminActions: parseInt(adminRes.rows[0].count, 10) || 0
      }
    });
  } catch (err) {
    console.error("Error fetching audit logs summary:", err);
    res.status(500).json({ error: "Server error fetching audit logs summary" });
  }
});

app.get("/api/admin/audit-logs", async (req, res) => {
  const auth = await verifyAdminAccess(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { page, limit, search, role, module, action, status, dateRange, from, to } = req.query;
  try {
    let baseWhere = "FROM audit_logs WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      const pIdx = params.length;
      baseWhere += ` AND (
        LOWER(COALESCE(log_code, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(user_name, actor, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(user_email, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(action, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(module, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(entity_id, '')) LIKE $${pIdx} OR 
        LOWER(COALESCE(description, target, '')) LIKE $${pIdx}
      )`;
    }

    if (role && role !== "ALL" && role !== "All") {
      params.push(role.toLowerCase());
      baseWhere += ` AND LOWER(COALESCE(user_role, role, '')) = $${params.length}`;
    }

    if (module && module !== "ALL" && module !== "All") {
      params.push(module.toLowerCase());
      baseWhere += ` AND LOWER(COALESCE(module, '')) = $${params.length}`;
    }

    if (action && action !== "ALL" && action !== "All") {
      params.push(`%${action.toLowerCase()}%`);
      baseWhere += ` AND LOWER(action) LIKE $${params.length}`;
    }

    if (status && status !== "ALL" && status !== "All") {
      params.push(status.toLowerCase());
      baseWhere += ` AND LOWER(COALESCE(status, 'success')) = $${params.length}`;
    }

    if (dateRange && dateRange !== "ALL" && dateRange !== "All") {
      const dr = dateRange.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (dr === "today") {
        baseWhere += " AND DATE(created_at) = CURRENT_DATE";
      } else if (dr === "yesterday") {
        baseWhere += " AND DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'";
      } else if (dr === "last7days" || dr === "7days") {
        baseWhere += " AND created_at >= CURRENT_DATE - INTERVAL '7 days'";
      } else if (dr === "last30days" || dr === "30days") {
        baseWhere += " AND created_at >= CURRENT_DATE - INTERVAL '30 days'";
      }
    }

    if (from && from.trim()) {
      params.push(new Date(from.trim()));
      baseWhere += ` AND created_at >= $${params.length}`;
    }

    if (to && to.trim()) {
      params.push(new Date(to.trim()));
      baseWhere += ` AND created_at <= $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;
    const dataParams = [...params, limitNum, offset];

    const logsRes = await pool.query(
      `SELECT 
        id, 
        log_code, 
        COALESCE(user_name, actor, 'System') AS user_name,
        COALESCE(user_role, role, 'Staff') AS user_role,
        user_email,
        user_id,
        action, 
        COALESCE(module, 'System') AS module,
        COALESCE(description, target, '') AS description,
        entity_type, 
        entity_id,
        COALESCE(ip_address, ip, '127.0.0.1') AS ip_address,
        user_agent,
        COALESCE(status, 'Success') AS status,
        severity,
        created_at,
        actor, 
        role, 
        target, 
        ip
       ${baseWhere} 
       ORDER BY created_at DESC, id DESC 
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      success: true,
      logs: logsRes.rows,
      data: logsRes.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: "Server error fetching audit logs" });
  }
});

app.get("/api/staff/incidents", async (req, res) => {
  const { page, limit, search, severity, status } = req.query;
  try {
    let baseWhere = "FROM staff_incidents WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseWhere += ` AND (LOWER(incident_code) LIKE $${params.length} OR LOWER(reporter) LIKE $${params.length} OR LOWER(incident_type) LIKE $${params.length} OR LOWER(COALESCE(notes, '')) LIKE $${params.length} OR LOWER(COALESCE(plate, '')) LIKE $${params.length})`;
    }

    if (severity && severity !== "ALL") {
      params.push(severity.toLowerCase());
      baseWhere += ` AND LOWER(severity) = $${params.length}`;
    }

    if (status && status !== "ALL") {
      params.push(status.toLowerCase());
      baseWhere += ` AND LOWER(status) = $${params.length}`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let incRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      incRes = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      incRes = await pool.query(`SELECT * ${baseWhere} ORDER BY id DESC`, params);
    }

    res.json({
      success: true,
      incidents: incRes.rows,
      data: incRes.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching staff incidents" });
  }
});

app.post("/api/staff/incidents", async (req, res) => {
  const { incident_type, location, plate, notes, severity, reporter } = req.body;
  if (!incident_type || !notes) {
    return res.status(400).json({ error: "Type and notes are required" });
  }
  const code = `INC-${Date.now().toString().slice(-4)}`;
  try {
    const insertRes = await pool.query(
      `INSERT INTO staff_incidents (incident_code, reporter, incident_type, location, plate, notes, severity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Open') RETURNING *`,
      [code, reporter || 'Duty Staff', incident_type, location || 'Zone A', plate || 'N/A', notes, severity || 'Normal']
    );
    res.status(201).json({ success: true, incident: insertRes.rows[0], message: "Incident logged successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error reporting incident" });
  }
});

app.put("/api/staff/incidents/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updateRes = await pool.query(
      "UPDATE staff_incidents SET status = $1 WHERE id = $2 RETURNING *",
      [status || 'Resolved', id]
    );
    res.json({ success: true, incident: updateRes.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating incident status" });
  }
});

app.get("/api/staff/dashboard-overview", async (req, res) => {
  try {
    const [slotsRes, evSlotsRes, todayResCount, todayPaySum, parkedVehicles, activeEvSessRes] = await Promise.all([
      pool.query("SELECT * FROM parking_slots ORDER BY slot_number ASC"),
      pool.query("SELECT * FROM ev_charging_slots ORDER BY slot_number ASC"),
      pool.query("SELECT COUNT(*) FROM reservations WHERE LOWER(status) != 'cancelled' AND (DATE(created_at) = CURRENT_DATE OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata') OR DATE(start_time) = CURRENT_DATE OR DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata') OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(amount), 0) AS sum FROM payments WHERE (LOWER(payment_status) IN ('completed', 'successful', 'paid', 'success') OR payment_status IS NULL) AND (DATE(created_at) = CURRENT_DATE OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(NOW() AT TIME ZONE 'Asia/Kolkata') OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COUNT(*) FROM vehicles WHERE LOWER(status) = 'parked'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE LOWER(session_status) = 'active'")
    ]);

    const normalSlots = slotsRes.rows;
    const evSlots = evSlotsRes.rows;
    const totalSlots = normalSlots.length + evSlots.length;
    const normalAvail = normalSlots.filter(s => s.status === "available" || (s.is_available && s.status !== "reserved" && s.status !== "occupied")).length;
    const evAvail = evSlots.filter(s => (s.status || "").toLowerCase() === "available").length;
    const availableSlots = normalAvail + evAvail;
    const normalOcc = normalSlots.filter(s => s.status === "occupied" || (!s.is_available && s.status !== "reserved")).length;
    const evOcc = evSlots.filter(s => (s.status || "").toLowerCase() === "occupied").length;
    const occupiedSlots = normalOcc + evOcc;
    const normalResv = normalSlots.filter(s => s.status === "reserved").length;
    const evResv = evSlots.filter(s => (s.status || "").toLowerCase() === "reserved").length;
    const reservedSlots = normalResv + evResv;
    const chargingSlots = evSlots.filter(s => (s.status || "").toLowerCase() === "charging").length;
    const occupancyRate = totalSlots > 0 ? Math.round(((occupiedSlots + reservedSlots + chargingSlots) / totalSlots) * 100) : 0;

    const todayBookings = parseInt(todayResCount.rows[0]?.count || 0, 10);
    const todayRevenueVal = parseFloat(todayPaySum.rows[0]?.sum || 0);
    const activeVehicles = parseInt(parkedVehicles.rows[0]?.count || 0, 10) + parseInt(activeEvSessRes.rows[0]?.count || 0, 10);

    const recentRes = await pool.query(
      "SELECT id, vehicle_number, slot_number, entry_time, exit_time, duration, fee, status FROM vehicle_history WHERE entry_time IS NOT NULL ORDER BY entry_time DESC, id DESC LIMIT 10"
    );

    const unifiedSlots = [
      ...normalSlots,
      ...evSlots.map(es => ({
        id: `ev-${es.id}`,
        raw_ev_id: es.id,
        slot_number: es.slot_number,
        zone: "Zone EV (Fast Chargers)",
        slot_type: es.charger_type || "EV Fast",
        status: (es.status || "available").toLowerCase(),
        is_available: (es.status || "").toLowerCase() === "available",
        hourly_rate: es.charging_rate || 18.00,
        is_ev: true,
        power_kw: es.power_kw,
        charging_power: es.charging_power,
        connector_type: es.connector_type
      }))
    ];

    res.json({
      success: true,
      metrics: {
        todayBookings: String(todayBookings),
        availableSlots: String(availableSlots),
        todayRevenue: `₹${Math.round(todayRevenueVal).toLocaleString("en-IN")}`,
        activeVehicles: String(activeVehicles),
        totalSlots,
        occupiedSlots,
        reservedSlots,
        chargingSlots,
        occupancyRate
      },
      slots: unifiedSlots,
      recentEntries: recentRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching staff dashboard overview" });
  }
});

app.get("/api/staff/shift-report", async (req, res) => {
  try {
    const todayCashRes = await pool.query("SELECT COALESCE(SUM(amount), 0) AS sum, COUNT(*) FROM payments WHERE LOWER(payment_method) LIKE '%cash%' AND DATE(created_at) = CURRENT_DATE");
    const todayUpiRes = await pool.query("SELECT COALESCE(SUM(amount), 0) AS sum, COUNT(*) FROM payments WHERE LOWER(payment_method) LIKE '%upi%' AND DATE(created_at) = CURRENT_DATE");
    const todayCardRes = await pool.query("SELECT COALESCE(SUM(amount), 0) AS sum, COUNT(*) FROM payments WHERE (LOWER(payment_method) LIKE '%card%' OR LOWER(payment_method) LIKE '%net%') AND DATE(created_at) = CURRENT_DATE");
    const todayTotalRes = await pool.query("SELECT COALESCE(SUM(amount), 0) AS sum, COUNT(*) FROM payments WHERE DATE(created_at) = CURRENT_DATE");
    const enteredRes = await pool.query("SELECT COUNT(*) FROM vehicle_history WHERE entry_time IS NOT NULL AND DATE(entry_time) = CURRENT_DATE");
    const exitedRes = await pool.query("SELECT COUNT(*) FROM vehicle_history WHERE exit_time IS NOT NULL AND DATE(exit_time) = CURRENT_DATE");
    const activeVehRes = await pool.query("SELECT COUNT(*) FROM vehicles WHERE status = 'Parked'");

    const shiftData = {
      shiftId: `SFT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-01`,
      shiftName: "Live Operational Duty Shift",
      startTime: "08:00 AM",
      currentTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      staffName: req.query.staffName || "Staff Supervisor",
      staffRole: "Senior Operations Floor Officer",
      assignedGates: "Gate 1 (Entry), Gate 2 (Exit)",
      cashCollected: parseFloat(todayCashRes.rows[0]?.sum || 0),
      cashTransactions: parseInt(todayCashRes.rows[0]?.count || 0, 10),
      upiCollected: parseFloat(todayUpiRes.rows[0]?.sum || 0),
      upiTransactions: parseInt(todayUpiRes.rows[0]?.count || 0, 10),
      cardCollected: parseFloat(todayCardRes.rows[0]?.sum || 0),
      cardTransactions: parseInt(todayCardRes.rows[0]?.count || 0, 10),
      totalCollected: parseFloat(todayTotalRes.rows[0]?.sum || 0),
      totalTransactions: parseInt(todayTotalRes.rows[0]?.count || 0, 10),
      vehiclesEntered: parseInt(enteredRes.rows[0]?.count || 0, 10),
      vehiclesExited: parseInt(exitedRes.rows[0]?.count || 0, 10),
      activeInFacility: parseInt(activeVehRes.rows[0]?.count || 0, 10)
    };

    res.json({ success: true, shiftData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching shift report" });
  }
});

app.post("/api/staff/close-shift", async (req, res) => {
  const { shiftId, staffName, totalCollected, notes } = req.body;
  try {
    const code = `AUD-${Date.now().toString().slice(-4)}`;
    await pool.query(
      `INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip)
       VALUES ($1, $2, 'Staff', 'Close Shift', $3, 'info', '127.0.0.1')`,
      [code, staffName || 'Staff Member', `Shift ${shiftId || 'Current'} closed. Total collected: ₹${totalCollected || 0}. Notes: ${notes || 'Handover completed'}`]
    );
    res.json({ success: true, message: "Shift closed and handover summary recorded in audit log" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error closing shift" });
  }
});

app.get("/api/admin/reports-analytics", async (req, res) => {
  const { range } = req.query;
  try {
    let dateFilter = "";
    const selectedRange = (range || "today").toLowerCase();
    if (selectedRange === "today") {
      dateFilter = "WHERE (created_at >= CURRENT_DATE OR DATE(created_at) = CURRENT_DATE)";
    } else if (selectedRange === "7days" || selectedRange === "week") {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (selectedRange === "30days" || selectedRange === "month") {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (selectedRange === "year") {
      dateFilter = "WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'";
    }

    const payQuery = dateFilter
      ? `SELECT COALESCE(SUM(amount), 0) AS total_revenue, COUNT(*) AS total_payments FROM payments ${dateFilter}`
      : "SELECT COALESCE(SUM(amount), 0) AS total_revenue, COUNT(*) AS total_payments FROM payments";
    const bookQuery = dateFilter
      ? `SELECT COUNT(*) AS total_bookings FROM reservations ${dateFilter}`
      : "SELECT COUNT(*) AS total_bookings FROM reservations";
    const payMethodQuery = dateFilter
      ? `SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount FROM payments ${dateFilter} GROUP BY payment_method`
      : "SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount FROM payments GROUP BY payment_method";

    const evQuery = dateFilter
      ? `SELECT COUNT(*) AS ev_sessions_count, COALESCE(SUM(total_amount), 0) AS ev_revenue, COALESCE(SUM(energy_consumed), 0) AS ev_energy_kwh FROM ev_charging_sessions ${dateFilter}`
      : "SELECT COUNT(*) AS ev_sessions_count, COALESCE(SUM(total_amount), 0) AS ev_revenue, COALESCE(SUM(energy_consumed), 0) AS ev_energy_kwh FROM ev_charging_sessions";

    const couponQuery = `
      SELECT 
        COUNT(*) AS total_coupons,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active' AND expiry_date >= CURRENT_TIMESTAMP) AS active_coupons,
        COALESCE(SUM(used_count), 0) AS total_redemptions,
        COALESCE((SELECT SUM(discount_amount) FROM coupon_usage), 0) AS total_discount_given,
        COALESCE((SELECT SUM(original_amount) FROM coupon_usage), 0) AS gross_coupon_revenue,
        COALESCE((SELECT SUM(final_amount) FROM coupon_usage), 0) AS net_coupon_revenue
      FROM coupons
    `;

    const [payRes, bookRes, vehTypeRes, payMethodRes, slotsRes, evStatsRes, evSlotsRes, couponAnalyticsRes] = await Promise.all([
      pool.query(payQuery),
      pool.query(bookQuery),
      pool.query("SELECT vehicle_type, COUNT(*) AS count FROM vehicles GROUP BY vehicle_type"),
      pool.query(payMethodQuery),
      pool.query("SELECT zone, COUNT(*) AS total, SUM(CASE WHEN status = 'occupied' OR is_available = false THEN 1 ELSE 0 END) AS occupied FROM parking_slots GROUP BY zone ORDER BY zone ASC"),
      pool.query(evQuery),
      pool.query("SELECT COUNT(*) AS total, SUM(CASE WHEN LOWER(status) IN ('charging', 'occupied') THEN 1 ELSE 0 END) AS occupied FROM ev_charging_slots"),
      pool.query(couponQuery)
    ]);

    const totalRevenue = parseFloat(payRes.rows[0]?.total_revenue || 0);
    const totalBookings = parseInt(bookRes.rows[0]?.total_bookings || 0, 10);
    const totalPayments = parseInt(payRes.rows[0]?.total_payments || 0, 10);

    const vehicleBreakdown = vehTypeRes.rows.map(r => ({
      type: r.vehicle_type || "Car",
      count: parseInt(r.count, 10) || 0
    }));

    const paymentBreakdown = payMethodRes.rows.map(r => ({
      method: r.payment_method || "UPI",
      count: parseInt(r.count, 10) || 0,
      amount: parseFloat(r.amount) || 0
    }));

    const zoneStats = slotsRes.rows.map(r => {
      const total = parseInt(r.total, 10) || 0;
      const occupied = parseInt(r.occupied, 10) || 0;
      const rate = total > 0 ? Math.round((occupied / total) * 100) : 0;
      return {
        zone: r.zone || "Zone A",
        total,
        occupied,
        available: Math.max(0, total - occupied),
        rate
      };
    });

    const evTotalSlots = parseInt(evSlotsRes.rows[0]?.total || 0, 10);
    const evOccupiedSlots = parseInt(evSlotsRes.rows[0]?.occupied || 0, 10);
    const evRate = evTotalSlots > 0 ? Math.round((evOccupiedSlots / evTotalSlots) * 100) : 0;
    zoneStats.push({
      zone: "Zone C (EV Fast)",
      total: evTotalSlots,
      occupied: evOccupiedSlots,
      available: Math.max(0, evTotalSlots - evOccupiedSlots),
      rate: evRate
    });

    const hourlyEntryFilter = dateFilter ? `AND (entry_time >= CURRENT_DATE OR DATE(entry_time) = CURRENT_DATE)` : "";
    const hourlyRes = await pool.query(`
      SELECT 
        TO_CHAR(entry_time, 'HH12 AM') as hour_label,
        EXTRACT(HOUR FROM entry_time) as hr,
        COUNT(*) as vehicle_count
      FROM vehicle_history
      WHERE entry_time IS NOT NULL ${hourlyEntryFilter}
      GROUP BY TO_CHAR(entry_time, 'HH12 AM'), EXTRACT(HOUR FROM entry_time)
      ORDER BY hr ASC
    `);

    const hourlyTrends = [
      { hour: "06 AM", vehicles: 0, revenue: 0 },
      { hour: "08 AM", vehicles: 0, revenue: 0 },
      { hour: "10 AM", vehicles: 0, revenue: 0 },
      { hour: "12 PM", vehicles: 0, revenue: 0 },
      { hour: "02 PM", vehicles: 0, revenue: 0 },
      { hour: "04 PM", vehicles: 0, revenue: 0 },
      { hour: "06 PM", vehicles: 0, revenue: 0 },
      { hour: "08 PM", vehicles: 0, revenue: 0 },
      { hour: "10 PM", vehicles: 0, revenue: 0 }
    ];

    hourlyRes.rows.forEach(r => {
      const match = hourlyTrends.find(h => (h.hour || "").trim() === (r.hour_label || "").trim());
      if (match) {
        match.vehicles = parseInt(r.vehicle_count, 10);
        match.revenue = match.vehicles * 60;
      }
    });

    res.json({
      success: true,
      range: selectedRange,
      summary: {
        totalRevenue,
        totalBookings: totalBookings + totalPayments,
        avgOccupancy: zoneStats.length > 0 ? Math.round(zoneStats.reduce((acc, z) => acc + z.rate, 0) / zoneStats.length) : 0,
        activeParked: zoneStats.reduce((acc, z) => acc + z.occupied, 0)
      },
      evStats: {
        sessionsCount: parseInt(evStatsRes.rows[0]?.ev_sessions_count || 0, 10),
        revenue: parseFloat(evStatsRes.rows[0]?.ev_revenue || 0),
        energyKwh: parseFloat(evStatsRes.rows[0]?.ev_energy_kwh || 0),
        totalSlots: evTotalSlots,
        availableSlots: Math.max(0, evTotalSlots - evOccupiedSlots)
      },
      couponStats: {
        totalCoupons: parseInt(couponAnalyticsRes.rows[0]?.total_coupons || 0, 10),
        activeCoupons: parseInt(couponAnalyticsRes.rows[0]?.active_coupons || 0, 10),
        totalRedemptions: parseInt(couponAnalyticsRes.rows[0]?.total_redemptions || 0, 10),
        totalDiscountGiven: parseFloat(couponAnalyticsRes.rows[0]?.total_discount_given || 0),
        grossRevenue: parseFloat(couponAnalyticsRes.rows[0]?.gross_coupon_revenue || 0),
        netRevenue: parseFloat(couponAnalyticsRes.rows[0]?.net_coupon_revenue || 0)
      },
      vehicleBreakdown,
      paymentBreakdown,
      zoneStats,
      hourlyTrends
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching reports analytics" });
  }
});

app.get("/api/customer/vehicles", async (req, res) => {
  const { email, search, page, limit } = req.query;
  try {
    let baseWhere = "FROM vehicles WHERE 1=1";
    const params = [];

    if (email && email.trim()) {
      params.push(email.trim().toLowerCase());
      baseWhere += ` AND LOWER(owner_email) = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseWhere += ` AND (LOWER(vehicle_number) LIKE $${params.length} OR LOWER(model) LIKE $${params.length} OR LOWER(vehicle_type) LIKE $${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseWhere}`, params);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    let vehRes;
    let pageNum = 1;
    let limitNum = total || 5;

    if (page || limit) {
      pageNum = Math.max(1, parseInt(page, 10) || 1);
      limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
      const offset = (pageNum - 1) * limitNum;
      const dataParams = [...params, limitNum, offset];
      vehRes = await pool.query(
        `SELECT * ${baseWhere} ORDER BY id DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
      );
    } else {
      vehRes = await pool.query(`SELECT * ${baseWhere} ORDER BY id DESC`, params);
    }

    res.json({
      success: true,
      vehicles: vehRes.rows,
      data: vehRes.rows,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer vehicles" });
  }
});

app.post("/api/customer/vehicles", async (req, res) => {
  const { vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone } = req.body;
  if (!vehicle_number) {
    return res.status(400).json({ error: "Vehicle plate number is required" });
  }
  const cleanPlate = vehicle_number.trim().toUpperCase();
  const cleanEmail = (owner_email || "").trim().toLowerCase();
  try {
    const existCheck = await pool.query("SELECT * FROM vehicles WHERE UPPER(vehicle_number) = UPPER($1)", [cleanPlate]);
    if (existCheck.rowCount > 0) {
      const existing = existCheck.rows[0];
      const existingEmail = (existing.owner_email || "").trim().toLowerCase();
      if (!existingEmail || existingEmail === cleanEmail) {
        const updateRes = await pool.query(
          `UPDATE vehicles 
           SET owner_name = COALESCE(NULLIF($1, ''), owner_name),
               owner_email = COALESCE(NULLIF($2, ''), owner_email),
               owner_phone = COALESCE(NULLIF($3, ''), owner_phone),
               vehicle_type = COALESCE(NULLIF($4, ''), vehicle_type),
               model = COALESCE(NULLIF($5, ''), model)
           WHERE UPPER(vehicle_number) = UPPER($6) RETURNING *`,
          [owner_name || null, cleanEmail || null, owner_phone || null, vehicle_type || null, model || null, cleanPlate]
        );
        return res.status(200).json({ success: true, vehicle: updateRes.rows[0], message: "Vehicle linked and updated successfully" });
      }
      return res.status(400).json({ error: "Vehicle with this registration number is registered under another owner" });
    }
    const insertRes = await pool.query(
      `INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot)
       VALUES ($1, $2, $3, $4, $5, $6, 'Registered', 'None') RETURNING *`,
      [cleanPlate, vehicle_type || 'Car', model || 'Standard', owner_name || 'Customer', cleanEmail, owner_phone || '']
    );
    res.status(201).json({ success: true, vehicle: insertRes.rows[0], message: "Vehicle registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error adding vehicle" });
  }
});

app.delete("/api/customer/vehicles/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const delRes = await pool.query("DELETE FROM vehicles WHERE id = $1 RETURNING *", [id]);
    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Vehicle not found" });
    }
    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting vehicle" });
  }
});

app.put("/api/customer/profile", async (req, res) => {
  const { email, name, phone, fastag_id, notifications_enabled } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const updateRes = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           fastag_id = COALESCE($3, fastag_id),
           notifications_enabled = COALESCE($4, notifications_enabled)
       WHERE LOWER(email) = LOWER($5) RETURNING id, name, email, phone, role, status, fastag_id, notifications_enabled`,
      [name, phone, fastag_id, notifications_enabled, email.trim()]
    );
    if (updateRes.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ success: true, user: updateRes.rows[0], message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating profile" });
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


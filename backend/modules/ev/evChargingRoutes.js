import express from "express";
import pool from "../../db.js";
import {
  notifyUser,
  notifyAdmins,
  notifyStaff
} from "../notifications/notificationService.js";

const router = express.Router();

router.get("/ev-charging-slots", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search = "",
      status = "ALL",
      charger_type = "ALL",
      connector_type = "ALL",
      all = false
    } = req.query;

    const isAll = all === "true" || all === true;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = "FROM ev_charging_slots WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(slot_number) LIKE $${params.length} OR LOWER(location_name) LIKE $${params.length} OR LOWER(charger_type) LIKE $${params.length} OR LOWER(connector_type) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      baseQuery += ` AND LOWER(status) = LOWER($${params.length})`;
    }

    if (charger_type && charger_type !== "ALL") {
      params.push(charger_type);
      baseQuery += ` AND LOWER(charger_type) = LOWER($${params.length})`;
    }

    if (connector_type && connector_type !== "ALL") {
      params.push(connector_type);
      baseQuery += ` AND LOWER(connector_type) = LOWER($${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    let dataQuery = `SELECT * ${baseQuery} ORDER BY slot_number ASC`;
    if (!isAll) {
      params.push(limitNum);
      params.push(offset);
      dataQuery += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    }

    const dataRes = await pool.query(dataQuery, params);

    res.json({
      success: true,
      slots: dataRes.rows,
      data: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching EV charging slots" });
  }
});

router.post("/ev-charging-slots", async (req, res) => {
  try {
    const {
      slot_number,
      location_id,
      location_name,
      parking_slot_id,
      charger_type = "DC Fast Charger",
      connector_type = "CCS2",
      charging_power = "60 kW",
      power_kw,
      charging_rate = 18.00,
      status = "Available",
      admin_name = "Admin"
    } = req.body;

    if (!slot_number || !slot_number.trim()) {
      return res.status(400).json({ error: "Slot number is required" });
    }

    const cleanSlotNumber = slot_number.trim().toUpperCase();

    const existingCheck = await pool.query(
      "SELECT id FROM ev_charging_slots WHERE UPPER(slot_number) = $1",
      [cleanSlotNumber]
    );
    if (existingCheck.rowCount > 0) {
      return res.status(409).json({ error: `Slot number ${cleanSlotNumber} already exists` });
    }

    const parsedRate = Math.max(1, parseFloat(charging_rate) || 18.00);
    const parsedPowerKw = parseFloat(power_kw) || parseFloat(String(charging_power).replace(/[^0-9.]/g, "")) || 60.00;

    const insertRes = await pool.query(
      `INSERT INTO ev_charging_slots (
        slot_number, location_id, location_name, parking_slot_id,
        charger_type, connector_type, charging_power, power_kw,
        charging_rate, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        cleanSlotNumber,
        location_id || null,
        location_name || "Central Parking Garage",
        parking_slot_id || null,
        charger_type,
        connector_type,
        charging_power || `${parsedPowerKw} kW`,
        parsedPowerKw,
        parsedRate,
        status || "Available"
      ]
    );

    await pool.query(
      "INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip, created_at) VALUES ($1, $2, 'Admin', 'Created EV Slot', $3, 'Low', '127.0.0.1', CURRENT_TIMESTAMP)",
      [`LOG-${Date.now().toString().slice(-4)}`, admin_name, `Slot ${cleanSlotNumber}`]
    );

    res.status(201).json({
      success: true,
      message: `EV charging slot ${cleanSlotNumber} created successfully`,
      slot: insertRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error creating EV charging slot" });
  }
});

router.put("/ev-charging-slots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      slot_number,
      location_id,
      location_name,
      parking_slot_id,
      charger_type,
      connector_type,
      charging_power,
      power_kw,
      charging_rate,
      status,
      admin_name = "Admin"
    } = req.body;

    const slotRes = await pool.query("SELECT * FROM ev_charging_slots WHERE id = $1", [id]);
    if (slotRes.rowCount === 0) {
      return res.status(404).json({ error: "EV charging slot not found" });
    }

    const existing = slotRes.rows[0];
    const newSlotNumber = slot_number ? slot_number.trim().toUpperCase() : existing.slot_number;

    if (newSlotNumber !== existing.slot_number) {
      const conflictCheck = await pool.query(
        "SELECT id FROM ev_charging_slots WHERE UPPER(slot_number) = $1 AND id != $2",
        [newSlotNumber, id]
      );
      if (conflictCheck.rowCount > 0) {
        return res.status(409).json({ error: `Slot number ${newSlotNumber} already exists` });
      }
    }

    const updatedPowerKw = power_kw !== undefined ? parseFloat(power_kw) : charging_power ? (parseFloat(String(charging_power).replace(/[^0-9.]/g, "")) || existing.power_kw) : existing.power_kw;
    const updatedRate = charging_rate !== undefined ? parseFloat(charging_rate) : existing.charging_rate;

    const updateRes = await pool.query(
      `UPDATE ev_charging_slots SET
        slot_number = $1,
        location_id = $2,
        location_name = $3,
        parking_slot_id = $4,
        charger_type = $5,
        connector_type = $6,
        charging_power = $7,
        power_kw = $8,
        charging_rate = $9,
        status = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *`,
      [
        newSlotNumber,
        location_id !== undefined ? location_id : existing.location_id,
        location_name !== undefined ? location_name : existing.location_name,
        parking_slot_id !== undefined ? parking_slot_id : existing.parking_slot_id,
        charger_type || existing.charger_type,
        connector_type || existing.connector_type,
        charging_power || existing.charging_power,
        updatedPowerKw,
        updatedRate,
        status || existing.status,
        id
      ]
    );

    await pool.query(
      "INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip, created_at) VALUES ($1, $2, 'Admin', 'Updated EV Slot', $3, 'Low', '127.0.0.1', CURRENT_TIMESTAMP)",
      [`LOG-${Date.now().toString().slice(-4)}`, admin_name, `Slot ${newSlotNumber} (${status || existing.status})`]
    );

    res.json({
      success: true,
      message: `EV charging slot ${newSlotNumber} updated successfully`,
      slot: updateRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error updating EV charging slot" });
  }
});

router.delete("/ev-charging-slots/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const admin_name = req.body.admin_name || req.query.admin_name || "Admin";

    const slotRes = await pool.query("SELECT * FROM ev_charging_slots WHERE id = $1", [id]);
    if (slotRes.rowCount === 0) {
      return res.status(404).json({ error: "EV charging slot not found" });
    }

    const slot = slotRes.rows[0];

    const activeSessionCheck = await pool.query(
      "SELECT id FROM ev_charging_sessions WHERE slot_id = $1 AND LOWER(session_status) = 'active'",
      [id]
    );
    if (activeSessionCheck.rowCount > 0) {
      return res.status(400).json({ error: "Cannot delete an EV slot with an active charging session" });
    }

    await pool.query("DELETE FROM ev_charging_slots WHERE id = $1", [id]);

    await pool.query(
      "INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip, created_at) VALUES ($1, $2, 'Admin', 'Deleted EV Slot', $3, 'Medium', '127.0.0.1', CURRENT_TIMESTAMP)",
      [`LOG-${Date.now().toString().slice(-4)}`, admin_name, `Slot ${slot.slot_number}`]
    );

    res.json({
      success: true,
      message: `EV charging slot ${slot.slot_number} deleted successfully`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting EV charging slot" });
  }
});

router.get("/ev-charging/sessions", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search = "",
      status = "ALL",
      date = ""
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = "FROM ev_charging_sessions s LEFT JOIN ev_charging_slots sl ON s.slot_id = sl.id WHERE 1=1";
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(s.session_code) LIKE $${params.length} OR LOWER(s.customer_name) LIKE $${params.length} OR LOWER(s.customer_email) LIKE $${params.length} OR LOWER(s.vehicle_number) LIKE $${params.length} OR LOWER(s.slot_number) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      baseQuery += ` AND LOWER(s.session_status) = LOWER($${params.length})`;
    }

    if (date) {
      params.push(date);
      baseQuery += ` AND DATE(s.created_at) = DATE($${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    params.push(limitNum);
    params.push(offset);
    const dataQuery = `SELECT s.*, sl.charger_type, sl.connector_type, sl.charging_power, sl.power_kw ${baseQuery} ORDER BY s.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const dataRes = await pool.query(dataQuery, params);

    res.json({
      success: true,
      sessions: dataRes.rows,
      data: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching EV charging sessions" });
  }
});

router.get("/ev-charging/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sessionRes = await pool.query(
      `SELECT s.*, sl.charger_type, sl.connector_type, sl.charging_power, sl.power_kw
       FROM ev_charging_sessions s
       LEFT JOIN ev_charging_slots sl ON s.slot_id = sl.id
       WHERE (s.id::text = $1::text OR s.session_code = $1::text)`,
      [String(id)]
    );

    if (sessionRes.rowCount === 0) {
      return res.status(404).json({ error: "Charging session not found" });
    }

    res.json({
      success: true,
      session: sessionRes.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching charging session" });
  }
});

router.post("/ev-charging/sessions/start", async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      customer_email,
      customer_name,
      customer_phone,
      vehicle_number,
      vehicle_model = "EV Model",
      vehicle_type = "EV",
      slot_id,
      slot_number
    } = req.body;

    if (!customer_email || !customer_email.trim()) {
      return res.status(400).json({ error: "Customer email is required to start EV charging" });
    }

    if (!vehicle_number || !vehicle_number.trim()) {
      return res.status(400).json({ error: "Vehicle plate number is required" });
    }

    if (!slot_id && !slot_number) {
      return res.status(400).json({ error: "Charging slot ID or slot number is required" });
    }

    const cleanEmail = customer_email.trim().toLowerCase();
    const cleanPlate = vehicle_number.trim().toUpperCase();

    await client.query("BEGIN");

    let slotQuery = "SELECT * FROM ev_charging_slots WHERE ";
    let slotParams = [];
    if (slot_id) {
      slotQuery += "id = $1 FOR UPDATE";
      slotParams = [slot_id];
    } else {
      slotQuery += "UPPER(slot_number) = $1 FOR UPDATE";
      slotParams = [slot_number.trim().toUpperCase()];
    }

    const slotRes = await client.query(slotQuery, slotParams);
    if (slotRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Specified EV charging slot does not exist" });
    }

    const slot = slotRes.rows[0];
    if (slot.status && slot.status.toLowerCase() !== "available") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: `Charging slot ${slot.slot_number} is currently ${slot.status}` });
    }

    const activeUserSession = await client.query(
      "SELECT id, session_code, slot_number FROM ev_charging_sessions WHERE LOWER(customer_email) = $1 AND LOWER(session_status) = 'active'",
      [cleanEmail]
    );
    if (activeUserSession.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: `You already have an active charging session (${activeUserSession.rows[0].session_code}) at Bay ${activeUserSession.rows[0].slot_number}`
      });
    }

    const activePlateSession = await client.query(
      "SELECT id, session_code FROM ev_charging_sessions WHERE UPPER(vehicle_number) = $1 AND LOWER(session_status) = 'active'",
      [cleanPlate]
    );
    if (activePlateSession.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        error: `Vehicle ${cleanPlate} already has an active charging session (${activePlateSession.rows[0].session_code})`
      });
    }

    let resolvedName = customer_name ? customer_name.trim() : "";
    let resolvedPhone = customer_phone ? customer_phone.trim() : "";
    let resolvedUserId = null;

    const userRes = await client.query(
      "SELECT id, name, phone FROM users WHERE LOWER(email) = $1",
      [cleanEmail]
    );
    if (userRes.rowCount > 0) {
      resolvedUserId = userRes.rows[0].id;
      if (!resolvedName) resolvedName = userRes.rows[0].name;
      if (!resolvedPhone) resolvedPhone = userRes.rows[0].phone;
    }
    if (!resolvedName) resolvedName = "Customer";

    let resolvedVehId = null;
    const vehRes = await client.query(
      "SELECT id, model FROM vehicles WHERE UPPER(vehicle_number) = $1",
      [cleanPlate]
    );
    if (vehRes.rowCount > 0) {
      resolvedVehId = vehRes.rows[0].id;
    } else {
      const newVehRes = await client.query(
        `INSERT INTO vehicles (vehicle_number, vehicle_type, model, owner_name, owner_email, owner_phone, status, current_slot, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'charging', $7, CURRENT_TIMESTAMP)
         RETURNING id`,
        [cleanPlate, vehicle_type || "EV", vehicle_model || "Electric Vehicle", resolvedName, cleanEmail, resolvedPhone, slot.slot_number]
      );
      resolvedVehId = newVehRes.rows[0]?.id || null;
    }

    const sessionCode = `EV-SESS-${Date.now().toString().slice(-6)}`;

    const insertSessionRes = await client.query(
      `INSERT INTO ev_charging_sessions (
        session_code, user_id, customer_name, customer_email, customer_phone,
        vehicle_id, vehicle_number, vehicle_model, vehicle_type,
        slot_id, slot_number, location_name,
        start_time, charging_rate, session_status, payment_status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, $13, 'Active', 'Pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        sessionCode,
        resolvedUserId,
        resolvedName,
        cleanEmail,
        resolvedPhone,
        resolvedVehId,
        cleanPlate,
        vehicle_model || "Electric Vehicle",
        vehicle_type || "EV",
        slot.id,
        slot.slot_number,
        slot.location_name || "Central Parking Garage",
        slot.charging_rate || 18.00
      ]
    );

    await client.query(
      "UPDATE ev_charging_slots SET status = 'Charging', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [slot.id]
    );

    if (slot.parking_slot_id) {
      await client.query(
        "UPDATE parking_slots SET status = 'occupied', is_available = false WHERE id = $1",
        [slot.parking_slot_id]
      );
    }

    await client.query(
      "INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip, created_at) VALUES ($1, $2, 'Customer', 'Started EV Charging', $3, 'Low', '127.0.0.1', CURRENT_TIMESTAMP)",
      [`LOG-${Date.now().toString().slice(-4)}`, resolvedName, `${cleanPlate} at Bay ${slot.slot_number}`]
    );

    await client.query("COMMIT");

    const createdSession = insertSessionRes.rows[0];

    try {
      await notifyUser(cleanEmail, {
        title: "EV Charging Started",
        message: `Charging session started for ${cleanPlate} at Bay ${slot.slot_number}. Tariff rate: ₹${parseFloat(slot.charging_rate).toFixed(2)}/kWh.`,
        type: "parking"
      });
      await notifyStaff({
        title: "New EV Charging Session",
        message: `Vehicle ${cleanPlate} started charging at Bay ${slot.slot_number} (${slot.charger_type}).`,
        type: "parking"
      });
      await notifyAdmins({
        title: "New EV Charging Session",
        message: `Vehicle ${cleanPlate} started charging at Bay ${slot.slot_number} by ${resolvedName}.`,
        type: "parking"
      });
    } catch {
      void 0;
    }

    res.status(201).json({
      success: true,
      message: `Charging session started at ${slot.slot_number}`,
      session: createdSession
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error starting EV charging session" });
  } finally {
    client.release();
  }
});

router.post("/ev-charging/sessions/:id/stop", async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const {
      payment_method = "UPI",
      requester_email,
      actor_role = "customer"
    } = req.body;

    await client.query("BEGIN");

    const sessionRes = await client.query(
      `SELECT * FROM ev_charging_sessions
       WHERE (id::text = $1::text OR session_code = $1::text)
       FOR UPDATE`,
      [String(id)]
    );

    if (sessionRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Charging session not found" });
    }

    const session = sessionRes.rows[0];

    let chargerPowerKw = 60.00;
    let slotParkingSlotId = null;
    if (session.slot_id) {
      const slotInfoRes = await client.query(
        "SELECT charging_power, power_kw, parking_slot_id FROM ev_charging_slots WHERE id = $1",
        [session.slot_id]
      );
      if (slotInfoRes.rowCount > 0) {
        const sl = slotInfoRes.rows[0];
        slotParkingSlotId = sl.parking_slot_id;
        chargerPowerKw = parseFloat(sl.power_kw) || parseFloat(String(sl.charging_power).replace(/[^0-9.]/g, "")) || 60.00;
      }
    }

    if (session.session_status && session.session_status.toLowerCase() !== "active") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: `Session is already ${session.session_status}` });
    }

    if (actor_role === "customer" && requester_email) {
      if (requester_email.trim().toLowerCase() !== session.customer_email.trim().toLowerCase()) {
        await client.query("ROLLBACK");
        return res.status(403).json({ error: "Unauthorized: You do not own this charging session" });
      }
    }

    const startTime = new Date(session.start_time);
    const endTime = new Date();
    const diffMs = Math.max(1000, endTime.getTime() - startTime.getTime());
    const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    const theoreticalEnergy = (chargerPowerKw * (totalMinutes / 60));
    const energyConsumed = parseFloat(Math.max(1.8, theoreticalEnergy).toFixed(2));

    const rate = parseFloat(session.charging_rate) || 18.00;
    const totalAmount = parseFloat((energyConsumed * rate).toFixed(2));

    const txnId = `TXN-EV-${Math.floor(10000 + Math.random() * 90000)}`;

    const paymentRes = await client.query(
      `INSERT INTO payments (
        transaction_id, vehicle_number, customer_name, customer_email, customer_phone,
        slot_number, entry_time, exit_time, duration, amount, payment_method, method,
        payment_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Completed', CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        txnId,
        session.vehicle_number,
        session.customer_name,
        session.customer_email,
        session.customer_phone,
        session.slot_number,
        startTime,
        endTime,
        durationStr,
        totalAmount,
        payment_method,
        payment_method
      ]
    );

    const payment = paymentRes.rows[0];

    const updateSessionRes = await client.query(
      `UPDATE ev_charging_sessions SET
        end_time = CURRENT_TIMESTAMP,
        duration = $1,
        energy_consumed = $2,
        total_amount = $3,
        payment_method = $4,
        payment_status = 'Completed',
        session_status = 'Completed',
        payment_id = $5,
        transaction_id = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        durationStr,
        energyConsumed,
        totalAmount,
        payment_method,
        payment.id,
        txnId,
        session.id
      ]
    );

    if (session.slot_id) {
      await client.query(
        "UPDATE ev_charging_slots SET status = 'Available', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [session.slot_id]
      );
    }

    const targetParkingSlotId = slotParkingSlotId || session.parking_slot_id;
    if (targetParkingSlotId) {
      await client.query(
        "UPDATE parking_slots SET status = 'available', is_available = true WHERE id = $1",
        [targetParkingSlotId]
      );
    }

    await client.query(
      "UPDATE vehicles SET status = 'Active', current_slot = NULL WHERE UPPER(vehicle_number) = $1",
      [session.vehicle_number.toUpperCase()]
    );

    await client.query(
      "INSERT INTO audit_logs (log_code, actor, role, action, target, severity, ip, created_at) VALUES ($1, $2, 'System', 'Completed EV Charging Session', $3, 'Low', '127.0.0.1', CURRENT_TIMESTAMP)",
      [`LOG-${Date.now().toString().slice(-4)}`, session.customer_name, `${session.session_code} • ₹${totalAmount.toFixed(2)} via ${payment_method}`]
    );

    await client.query("COMMIT");

    const updatedSession = updateSessionRes.rows[0];

    try {
      await notifyUser(session.customer_email, {
        title: "EV Charging Session Completed",
        message: `Your EV charging session finished. ${energyConsumed} kWh consumed. Total payment: ₹${totalAmount.toFixed(2)} received via ${payment_method}.`,
        type: "payment"
      });
      await notifyStaff({
        title: "EV Charging Session Completed",
        message: `Vehicle ${session.vehicle_number} finished charging at Bay ${session.slot_number}. Amount: ₹${totalAmount.toFixed(2)}.`,
        type: "payment"
      });
      await notifyAdmins({
        title: "EV Charging Payment Received",
        message: `Payment of ₹${totalAmount.toFixed(2)} received for EV charging session ${session.session_code} (${session.vehicle_number}).`,
        type: "payment"
      });
    } catch {
      void 0;
    }

    res.json({
      success: true,
      message: "EV charging session completed and payment processed successfully",
      session: updatedSession,
      payment
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Server error stopping EV charging session" });
  } finally {
    client.release();
  }
});

router.get("/customer/charging-sessions", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const {
      page = 1,
      limit = 5,
      search = "",
      status = "ALL"
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;

    let baseQuery = "FROM ev_charging_sessions s LEFT JOIN ev_charging_slots sl ON s.slot_id = sl.id WHERE LOWER(s.customer_email) = LOWER($1)";
    const params = [email.trim()];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      baseQuery += ` AND (LOWER(s.session_code) LIKE $${params.length} OR LOWER(s.vehicle_number) LIKE $${params.length} OR LOWER(s.slot_number) LIKE $${params.length})`;
    }

    if (status && status !== "ALL") {
      params.push(status);
      baseQuery += ` AND LOWER(s.session_status) = LOWER($${params.length})`;
    }

    const countRes = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    params.push(limitNum);
    params.push(offset);
    const dataQuery = `SELECT s.*, sl.charger_type, sl.connector_type, sl.charging_power, sl.power_kw ${baseQuery} ORDER BY s.id DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const dataRes = await pool.query(dataQuery, params);

    res.json({
      success: true,
      sessions: dataRes.rows,
      data: dataRes.rows,
      history: dataRes.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching customer charging sessions" });
  }
});

router.get("/customer/charging/active", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: "Customer email is required" });
    }

    const sessionRes = await pool.query(
      `SELECT s.*, sl.charger_type, sl.connector_type, sl.charging_power, sl.power_kw, sl.location_name AS bay_location
       FROM ev_charging_sessions s
       LEFT JOIN ev_charging_slots sl ON s.slot_id = sl.id
       WHERE LOWER(s.customer_email) = LOWER($1) AND LOWER(s.session_status) = 'active'
       ORDER BY s.id DESC LIMIT 1`,
      [email.trim()]
    );

    if (sessionRes.rowCount === 0) {
      return res.json({
        success: true,
        session: null
      });
    }

    const session = sessionRes.rows[0];
    const startTime = new Date(session.start_time);
    const now = new Date();
    const elapsedMinutes = Math.max(1, Math.round((now.getTime() - startTime.getTime()) / 60000));
    const hours = Math.floor(elapsedMinutes / 60);
    const mins = elapsedMinutes % 60;
    const liveDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins} mins`;

    const chargerPowerKw = parseFloat(session.power_kw) || 60.00;
    const estEnergy = parseFloat(Math.max(0.5, (chargerPowerKw * (elapsedMinutes / 60))).toFixed(2));
    const rate = parseFloat(session.charging_rate) || 18.00;
    const estFee = parseFloat((estEnergy * rate).toFixed(2));

    res.json({
      success: true,
      session: {
        ...session,
        liveDuration,
        estimatedEnergy: estEnergy,
        estimatedFee: estFee
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching active customer session" });
  }
});

router.get("/admin/ev-charging-overview", async (req, res) => {
  try {
    const [
      slotsRes,
      availSlotsRes,
      activeSessRes,
      todaySessRes,
      todayRevRes,
      todayEnergyRes,
      totalEnergyRes,
      totalRevRes
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM ev_charging_slots"),
      pool.query("SELECT COUNT(*) FROM ev_charging_slots WHERE LOWER(status) = 'available'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE LOWER(session_status) = 'active'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE (DATE(created_at) = CURRENT_DATE OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) AS sum FROM ev_charging_sessions WHERE (LOWER(payment_status) = 'completed' OR LOWER(session_status) = 'completed') AND (DATE(created_at) = CURRENT_DATE OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(energy_consumed), 0) AS sum FROM ev_charging_sessions WHERE (DATE(created_at) = CURRENT_DATE OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(energy_consumed), 0) AS sum FROM ev_charging_sessions"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) AS sum FROM ev_charging_sessions WHERE LOWER(payment_status) = 'completed' OR LOWER(session_status) = 'completed'")
    ]);

    const totalSlots = parseInt(slotsRes.rows[0].count, 10);
    const availableSlots = parseInt(availSlotsRes.rows[0].count, 10);
    const activeSessions = parseInt(activeSessRes.rows[0].count, 10);
    const sessionsToday = parseInt(todaySessRes.rows[0].count, 10);
    const revenueToday = parseFloat(todayRevRes.rows[0].sum || 0);
    const energyConsumedToday = parseFloat(todayEnergyRes.rows[0].sum || 0);
    const totalEnergy = parseFloat(totalEnergyRes.rows[0].sum || 0);
    const totalRevenue = parseFloat(totalRevRes.rows[0].sum || 0);

    res.json({
      success: true,
      stats: {
        totalSlots,
        availableSlots,
        occupiedSlots: Math.max(0, totalSlots - availableSlots),
        activeSessions,
        sessionsToday,
        revenueToday: `₹${revenueToday.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        revenueTodayNumeric: revenueToday,
        energyConsumedToday: `${energyConsumedToday.toFixed(1)} kWh`,
        energyConsumedTodayNumeric: energyConsumedToday,
        totalEnergy: `${totalEnergy.toFixed(1)} kWh`,
        totalRevenue: `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching admin EV overview" });
  }
});

router.get("/staff/ev-charging-overview", async (req, res) => {
  try {
    const [
      availSlotsRes,
      inUseSlotsRes,
      activeSessRes,
      todaySessRes,
      todayRevRes
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM ev_charging_slots WHERE LOWER(status) = 'available'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_slots WHERE LOWER(status) IN ('charging', 'occupied')"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE LOWER(session_status) = 'active'"),
      pool.query("SELECT COUNT(*) FROM ev_charging_sessions WHERE (DATE(created_at) = CURRENT_DATE OR created_at >= CURRENT_DATE)"),
      pool.query("SELECT COALESCE(SUM(total_amount), 0) AS sum FROM ev_charging_sessions WHERE (LOWER(payment_status) = 'completed' OR LOWER(session_status) = 'completed') AND (DATE(created_at) = CURRENT_DATE OR created_at >= CURRENT_DATE)")
    ]);

    const availableSlots = parseInt(availSlotsRes.rows[0].count, 10);
    const slotsInUse = parseInt(inUseSlotsRes.rows[0].count, 10);
    const activeSessions = parseInt(activeSessRes.rows[0].count, 10);
    const todaySessions = parseInt(todaySessRes.rows[0].count, 10);
    const todayRevenueVal = parseFloat(todayRevRes.rows[0].sum || 0);

    res.json({
      success: true,
      metrics: {
        availableSlots: String(availableSlots),
        slotsInUse: String(slotsInUse),
        activeSessions: String(activeSessions),
        todaySessions: String(todaySessions),
        todayRevenue: `₹${Math.round(todayRevenueVal).toLocaleString("en-IN")}`,
        todayRevenueNumeric: todayRevenueVal
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching staff EV overview" });
  }
});

export default router;

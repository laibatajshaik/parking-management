import express from "express";
import pool from "../../db.js";
import { validateCoupon } from "./couponService.js";
import { logAuditEvent, getAuditClientIp, getAuditUserAgent } from "../audit/auditLogger.js";

const router = express.Router();

router.post("/coupons/apply", async (req, res) => {
  try {
    const { code, customer_email, order_amount, service_type } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, error: "Please enter a coupon code." });
    }

    const result = await validateCoupon({
      code,
      customerEmail: customer_email,
      orderAmount: parseFloat(order_amount) || 0,
      serviceType: service_type || "Normal Parking"
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error });
    }

    return res.json({
      success: true,
      coupon: {
        id: result.coupon_id,
        code: result.code,
        description: result.description,
        discount_type: result.discount_type,
        discount_value: result.discount_value,
        discount_amount: result.discount_amount,
        final_amount: result.final_amount,
        minimum_amount: result.minimum_amount,
        maximum_discount: result.maximum_discount,
        usage_type: result.usage_type,
        applicable_to: result.applicable_to
      },
      ...result
    });
  } catch (err) {
    console.error("Coupon apply error:", err);
    return res.status(500).json({ success: false, error: "Server error validating coupon." });
  }
});

router.get(["/coupons", "/customer/coupons"], async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        code,
        description,
        discount_type,
        discount_value,
        minimum_amount,
        maximum_discount,
        usage_type,
        total_usage_limit,
        used_count,
        per_customer_limit,
        start_date,
        expiry_date,
        applicable_to,
        status,
        (CASE 
          WHEN LOWER(status) != 'active' THEN 'Inactive'
          WHEN expiry_date IS NOT NULL AND expiry_date < CURRENT_TIMESTAMP THEN 'Expired'
          WHEN total_usage_limit IS NOT NULL AND used_count >= total_usage_limit THEN 'Exhausted'
          ELSE 'Active'
        END) AS computed_status
      FROM coupons
      ORDER BY 
        CASE WHEN LOWER(status) = 'active' THEN 0 ELSE 1 END,
        id ASC
    `);
    return res.json({
      success: true,
      coupons: result.rows
    });
  } catch (err) {
    console.error("Fetch coupons error:", err);
    return res.status(500).json({ success: false, error: "Failed to load coupons" });
  }
});

router.get("/admin/coupons", async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      usage_type = "all",
      applicable_to = "all",
      page = 1,
      limit = 5
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;

    let whereConditions = [];
    let queryParams = [];

    if (search && search.trim()) {
      queryParams.push(`%${search.trim().toUpperCase()}%`);
      const pIdx = queryParams.length;
      whereConditions.push(`(UPPER(code) LIKE $${pIdx} OR UPPER(COALESCE(description, '')) LIKE $${pIdx})`);
    }

    if (status && status !== "all") {
      const s = status.toLowerCase();
      if (s === "expired") {
        whereConditions.push("expiry_date < CURRENT_TIMESTAMP");
      } else if (s === "active") {
        whereConditions.push("(LOWER(status) = 'active' AND expiry_date >= CURRENT_TIMESTAMP)");
      } else if (s === "inactive") {
        whereConditions.push("LOWER(status) = 'inactive'");
      }
    }

    if (usage_type && usage_type !== "all") {
      queryParams.push(usage_type);
      whereConditions.push(`LOWER(usage_type) = LOWER($${queryParams.length})`);
    }

    if (applicable_to && applicable_to !== "all") {
      queryParams.push(applicable_to);
      whereConditions.push(`LOWER(applicable_to) = LOWER($${queryParams.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

    const countRes = await pool.query(`SELECT COUNT(*) FROM coupons ${whereClause}`, queryParams);
    const total = parseInt(countRes.rows[0].count, 10) || 0;

    const dataParams = [...queryParams, limitNum, offset];
    const dataRes = await pool.query(
      `SELECT * FROM coupons 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    const statsRes = await pool.query(`
      SELECT 
        COUNT(*) AS total_coupons,
        COUNT(*) FILTER (WHERE LOWER(status) = 'active' AND expiry_date >= CURRENT_TIMESTAMP) AS active_coupons,
        COALESCE(SUM(used_count), 0) AS total_redemptions,
        COALESCE((SELECT SUM(discount_amount) FROM coupon_usage), 0) AS total_discount_given
      FROM coupons
    `);

    const statsRow = statsRes.rows[0] || {};

    return res.json({
      success: true,
      coupons: dataRes.rows,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      stats: {
        totalCoupons: parseInt(statsRow.total_coupons, 10) || 0,
        activeCoupons: parseInt(statsRow.active_coupons, 10) || 0,
        totalRedemptions: parseInt(statsRow.total_redemptions, 10) || 0,
        totalDiscountGiven: parseFloat(statsRow.total_discount_given) || 0
      }
    });
  } catch (err) {
    console.error("Admin coupons fetch error:", err);
    return res.status(500).json({ success: false, error: "Server error fetching coupons." });
  }
});

router.post("/admin/coupons", async (req, res) => {
  try {
    const {
      code,
      description = "",
      discount_type = "percentage",
      discount_value,
      minimum_amount = 0,
      maximum_discount = null,
      usage_type = "Limited",
      total_usage_limit = 100,
      per_customer_limit = 1,
      start_date,
      expiry_date,
      applicable_to = "All",
      status = "Active",
      created_by = "Admin"
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3) {
      return res.status(400).json({ error: "Coupon code must be at least 3 alphanumeric characters." });
    }

    const existCheck = await pool.query(
      "SELECT id FROM coupons WHERE UPPER(code) = UPPER($1)",
      [cleanCode]
    );
    if (existCheck.rowCount > 0) {
      return res.status(400).json({ error: `Coupon code "${cleanCode}" already exists.` });
    }

    const dVal = parseFloat(discount_value);
    if (isNaN(dVal) || dVal <= 0) {
      return res.status(400).json({ error: "Discount value must be greater than 0." });
    }
    if (discount_type === "percentage" && dVal > 100) {
      return res.status(400).json({ error: "Percentage discount cannot exceed 100%." });
    }

    const minAmt = parseFloat(minimum_amount) || 0;
    if (minAmt < 0) {
      return res.status(400).json({ error: "Minimum order amount cannot be negative." });
    }
    let maxDisc = null;
    if (maximum_discount !== null && maximum_discount !== undefined && maximum_discount !== "") {
      maxDisc = parseFloat(maximum_discount);
      if (isNaN(maxDisc) || maxDisc <= 0) {
        return res.status(400).json({ error: "Maximum discount must be a positive number if specified." });
      }
    }

    const cleanUsageType = usage_type === "One-Time" ? "One-Time" : "Limited";
    let finalPerCustLimit = 1;
    let finalTotalLimit = null;

    if (cleanUsageType === "One-Time") {
      finalPerCustLimit = 1; 
      finalTotalLimit = null; 
    } else {
      finalTotalLimit = total_usage_limit ? Math.max(1, parseInt(total_usage_limit, 10)) : 100;
      finalPerCustLimit = per_customer_limit ? Math.max(1, parseInt(per_customer_limit, 10)) : 1;
    }

    const sDate = start_date ? new Date(start_date) : new Date();
    const eDate = expiry_date ? new Date(expiry_date) : new Date(Date.now() + 30 * 86400000);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      return res.status(400).json({ error: "Invalid start or expiry date." });
    }
    if (sDate > eDate) {
      return res.status(400).json({ error: "Start date cannot be after expiry date." });
    }

    const insertRes = await pool.query(
      `INSERT INTO coupons (
        code, description, discount_type, discount_value, minimum_amount, maximum_discount,
        usage_type, total_usage_limit, used_count, per_customer_limit,
        start_date, expiry_date, applicable_to, status, created_by,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, 0, $9,
        $10, $11, $12, $13, $14,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        cleanCode,
        description.trim(),
        discount_type === "percentage" ? "percentage" : "fixed",
        dVal,
        minAmt,
        maxDisc,
        cleanUsageType,
        finalTotalLimit,
        finalPerCustLimit,
        sDate,
        eDate,
        applicable_to || "All",
        status === "Inactive" ? "Inactive" : "Active",
        created_by || "Admin"
      ]
    );

    const newCoupon = insertRes.rows[0];

    await logAuditEvent({
      userName: created_by || "Admin",
      role: "Admin",
      action: "Coupon Created",
      module: "Coupons",
      entityType: "coupon",
      entityId: newCoupon.code,
      description: `Created new ${cleanUsageType} coupon "${newCoupon.code}" (${newCoupon.discount_type === "percentage" ? `${newCoupon.discount_value}%` : `₹${newCoupon.discount_value}`} off)`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    return res.status(201).json({
      success: true,
      message: `Coupon "${newCoupon.code}" created successfully.`,
      coupon: newCoupon
    });
  } catch (err) {
    console.error("Create coupon error:", err);
    return res.status(500).json({ error: "Server error creating coupon." });
  }
});

router.put("/admin/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description = "",
      discount_type = "percentage",
      discount_value,
      minimum_amount = 0,
      maximum_discount = null,
      usage_type = "Limited",
      total_usage_limit = 100,
      per_customer_limit = 1,
      start_date,
      expiry_date,
      applicable_to = "All",
      status = "Active",
      updated_by = "Admin"
    } = req.body;

    const existRes = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    const currentCoupon = existRes.rows[0];

    const cleanCode = code ? code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "") : currentCoupon.code;
    if (cleanCode !== currentCoupon.code) {
      const dupCheck = await pool.query("SELECT id FROM coupons WHERE UPPER(code) = UPPER($1) AND id != $2", [cleanCode, id]);
      if (dupCheck.rowCount > 0) {
        return res.status(400).json({ error: `Coupon code "${cleanCode}" already in use by another coupon.` });
      }
    }

    const dVal = parseFloat(discount_value);
    if (isNaN(dVal) || dVal <= 0) {
      return res.status(400).json({ error: "Discount value must be greater than 0." });
    }
    if (discount_type === "percentage" && dVal > 100) {
      return res.status(400).json({ error: "Percentage discount cannot exceed 100%." });
    }

    const minAmt = parseFloat(minimum_amount) || 0;
    let maxDisc = null;
    if (maximum_discount !== null && maximum_discount !== undefined && maximum_discount !== "") {
      maxDisc = parseFloat(maximum_discount);
      if (isNaN(maxDisc) || maxDisc <= 0) {
        return res.status(400).json({ error: "Maximum discount must be a positive number." });
      }
    }

    const cleanUsageType = usage_type === "One-Time" ? "One-Time" : "Limited";
    let finalPerCustLimit = 1;
    let finalTotalLimit = null;

    if (cleanUsageType === "One-Time") {
      finalPerCustLimit = 1;
      finalTotalLimit = null;
    } else {
      finalTotalLimit = total_usage_limit ? Math.max(1, parseInt(total_usage_limit, 10)) : null;
      finalPerCustLimit = per_customer_limit ? Math.max(1, parseInt(per_customer_limit, 10)) : 1;
    }

    const sDate = start_date ? new Date(start_date) : new Date(currentCoupon.start_date);
    const eDate = expiry_date ? new Date(expiry_date) : new Date(currentCoupon.expiry_date);

    if (sDate > eDate) {
      return res.status(400).json({ error: "Start date cannot be after expiry date." });
    }

    const updateRes = await pool.query(
      `UPDATE coupons SET
        code = $1,
        description = $2,
        discount_type = $3,
        discount_value = $4,
        minimum_amount = $5,
        maximum_discount = $6,
        usage_type = $7,
        total_usage_limit = $8,
        per_customer_limit = $9,
        start_date = $10,
        expiry_date = $11,
        applicable_to = $12,
        status = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *`,
      [
        cleanCode,
        description.trim(),
        discount_type === "percentage" ? "percentage" : "fixed",
        dVal,
        minAmt,
        maxDisc,
        cleanUsageType,
        finalTotalLimit,
        finalPerCustLimit,
        sDate,
        eDate,
        applicable_to || "All",
        status === "Inactive" ? "Inactive" : "Active",
        id
      ]
    );

    const updatedCoupon = updateRes.rows[0];

    await logAuditEvent({
      userName: updated_by || "Admin",
      role: "Admin",
      action: "Coupon Updated",
      module: "Coupons",
      entityType: "coupon",
      entityId: updatedCoupon.code,
      description: `Updated coupon "${updatedCoupon.code}" (Status: ${updatedCoupon.status}, Type: ${updatedCoupon.usage_type})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    return res.json({
      success: true,
      message: `Coupon "${updatedCoupon.code}" updated successfully.`,
      coupon: updatedCoupon
    });
  } catch (err) {
    console.error("Update coupon error:", err);
    return res.status(500).json({ error: "Server error updating coupon." });
  }
});

router.put("/admin/coupons/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, updated_by = "Admin" } = req.body;

    const existRes = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    const currentCoupon = existRes.rows[0];

    const newStatus = status
      ? (status.toLowerCase() === "active" ? "Active" : "Inactive")
      : (currentCoupon.status === "Active" ? "Inactive" : "Active");

    const updateRes = await pool.query(
      "UPDATE coupons SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [newStatus, id]
    );

    const updatedCoupon = updateRes.rows[0];

    await logAuditEvent({
      userName: updated_by || "Admin",
      role: "Admin",
      action: "Coupon Status Changed",
      module: "Coupons",
      entityType: "coupon",
      entityId: updatedCoupon.code,
      description: `Coupon "${updatedCoupon.code}" status changed to ${newStatus}`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    return res.json({
      success: true,
      message: `Coupon "${updatedCoupon.code}" is now ${newStatus}.`,
      coupon: updatedCoupon
    });
  } catch (err) {
    console.error("Toggle coupon status error:", err);
    return res.status(500).json({ error: "Server error changing coupon status." });
  }
});

router.delete("/admin/coupons/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.headers["x-admin-email"] || req.query.adminEmail || "Admin";

    const existRes = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (existRes.rowCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    const coupon = existRes.rows[0];

    await pool.query("DELETE FROM coupons WHERE id = $1", [id]);

    await logAuditEvent({
      userName: adminEmail,
      role: "Admin",
      action: "Coupon Deleted",
      module: "Coupons",
      entityType: "coupon",
      entityId: coupon.code,
      description: `Deleted coupon "${coupon.code}" (${coupon.discount_type}: ${coupon.discount_value})`,
      status: "Success",
      ipAddress: getAuditClientIp(req),
      userAgent: getAuditUserAgent(req)
    });

    return res.json({
      success: true,
      message: `Coupon "${coupon.code}" deleted successfully.`
    });
  } catch (err) {
    console.error("Delete coupon error:", err);
    return res.status(500).json({ error: "Server error deleting coupon." });
  }
});

router.get("/admin/coupons/:id/usage", async (req, res) => {
  try {
    const { id } = req.params;

    const couponRes = await pool.query("SELECT * FROM coupons WHERE id = $1", [id]);
    if (couponRes.rowCount === 0) {
      return res.status(404).json({ error: "Coupon not found." });
    }
    const coupon = couponRes.rows[0];

    const usageRes = await pool.query(
      `SELECT * FROM coupon_usage 
       WHERE coupon_id = $1 OR UPPER(coupon_code) = UPPER($2)
       ORDER BY used_at DESC`,
      [coupon.id, coupon.code]
    );

    return res.json({
      success: true,
      coupon,
      usage: usageRes.rows,
      totalUses: usageRes.rowCount
    });
  } catch (err) {
    console.error("Fetch coupon usage error:", err);
    return res.status(500).json({ error: "Server error fetching coupon usage." });
  }
});

export default router;

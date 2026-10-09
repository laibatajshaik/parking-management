import pool from "../../db.js";
import { logAuditEvent, getAuditClientIp, getAuditUserAgent } from "../audit/auditLogger.js";

export async function validateCoupon({
  code,
  customerEmail = "",
  orderAmount = 0,
  serviceType = "Normal Parking",
  db = pool
}) {
  if (!code || typeof code !== "string" || !code.trim()) {
    return { valid: false, error: "Please enter a coupon code." };
  }

  const cleanCode = code.trim().toUpperCase();
  const numOrderAmount = parseFloat(orderAmount) || 0;

  if (numOrderAmount <= 0) {
    return { valid: false, error: "Order amount must be greater than zero to apply a coupon." };
  }

  const couponRes = await db.query(
    "SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)",
    [cleanCode]
  );

  if (couponRes.rowCount === 0) {
    return { valid: false, error: "Invalid coupon code." };
  }

  const coupon = couponRes.rows[0];

  if ((coupon.status || "").toLowerCase() !== "active") {
    return { valid: false, error: "Coupon is inactive." };
  }

  const now = new Date();
  const startDate = new Date(coupon.start_date);
  const expiryDate = new Date(coupon.expiry_date);

  if (now < startDate) {
    return { valid: false, error: "Coupon is not active yet." };
  }

  if (now > expiryDate) {
    return { valid: false, error: "Coupon has expired." };
  }

  const usageType = (coupon.usage_type || "Limited").toLowerCase();
  const usedCount = parseInt(coupon.used_count, 10) || 0;
  const totalLimit = coupon.total_usage_limit !== null ? parseInt(coupon.total_usage_limit, 10) : null;

  if (usageType === "limited" && totalLimit !== null && usedCount >= totalLimit) {
    return { valid: false, error: "Coupon usage limit reached." };
  }

  const cleanEmail = (customerEmail || "").trim().toLowerCase();
  const perCustomerLimit = parseInt(coupon.per_customer_limit, 10) || 1;

  if (cleanEmail) {
    const customerUsageRes = await db.query(
      `SELECT COUNT(*) FROM coupon_usage 
       WHERE LOWER(customer_email) = LOWER($1) AND (coupon_id = $2 OR UPPER(coupon_code) = UPPER($3))`,
      [cleanEmail, coupon.id, cleanCode]
    );
    const customerUsedCount = parseInt(customerUsageRes.rows[0].count, 10) || 0;

    if (usageType === "one-time" && customerUsedCount >= 1) {
      return { valid: false, error: "You have already used this coupon." };
    }

    if (customerUsedCount >= perCustomerLimit) {
      return { valid: false, error: "You have reached the usage limit for this coupon." };
    }
  }

  const minAmount = parseFloat(coupon.minimum_amount) || 0;
  if (numOrderAmount < minAmount) {
    return {
      valid: false,
      error: `Minimum order amount of ₹${minAmount.toFixed(2)} required for this coupon.`
    };
  }

  const applicableTo = (coupon.applicable_to || "All").trim().toLowerCase();
  const normalizedService = (serviceType || "Parking").trim().toLowerCase();

  if (applicableTo !== "all") {
    const isEvCoupon = applicableTo.includes("ev");
    const isEvService = normalizedService.includes("ev") || normalizedService.includes("charging");

    if (isEvCoupon && !isEvService) {
      return { valid: false, error: "This coupon is only applicable for EV Charging services." };
    }
    if (!isEvCoupon && isEvService) {
      return { valid: false, error: "This coupon is only applicable for Normal Parking services." };
    }
  }

  const discountType = (coupon.discount_type || "fixed").toLowerCase();
  const discountValue = parseFloat(coupon.discount_value) || 0;
  let calculatedDiscount = 0;

  if (discountType === "percentage") {
    calculatedDiscount = (numOrderAmount * discountValue) / 100;
    if (coupon.maximum_discount !== null && coupon.maximum_discount !== undefined) {
      const maxDiscount = parseFloat(coupon.maximum_discount);
      if (!isNaN(maxDiscount) && maxDiscount > 0) {
        calculatedDiscount = Math.min(calculatedDiscount, maxDiscount);
      }
    }
  } else {
    calculatedDiscount = Math.min(numOrderAmount, discountValue);
  }

  calculatedDiscount = Math.max(0, Math.min(numOrderAmount, parseFloat(calculatedDiscount.toFixed(2))));
  const finalAmount = Math.max(0, parseFloat((numOrderAmount - calculatedDiscount).toFixed(2)));

  return {
    valid: true,
    coupon_id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: discountValue,
    minimum_amount: minAmount,
    maximum_discount: coupon.maximum_discount ? parseFloat(coupon.maximum_discount) : null,
    usage_type: coupon.usage_type,
    applicable_to: coupon.applicable_to,
    original_amount: numOrderAmount,
    discount_amount: calculatedDiscount,
    final_amount: finalAmount,
    message: `Coupon ${coupon.code} applied successfully! You saved ₹${calculatedDiscount.toFixed(2)}.`
  };
}

export async function recordCouponUsage({
  client,
  couponCode,
  customerEmail,
  customerName = "Customer",
  bookingId = null,
  chargingSessionId = null,
  paymentId = null,
  originalAmount,
  discountAmount,
  finalAmount,
  serviceType = "Normal Parking",
  req = null
}) {
  if (!couponCode || !couponCode.trim()) return null;

  const cleanCode = couponCode.trim().toUpperCase();

  const lockRes = await client.query(
    "SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) FOR UPDATE",
    [cleanCode]
  );

  if (lockRes.rowCount === 0) {
    throw new Error(`Coupon "${cleanCode}" not found.`);
  }

  const coupon = lockRes.rows[0];

  if ((coupon.status || "").toLowerCase() !== "active") {
    throw new Error(`Coupon "${cleanCode}" is no longer active.`);
  }

  const usageType = (coupon.usage_type || "Limited").toLowerCase();
  const usedCount = parseInt(coupon.used_count, 10) || 0;
  const totalLimit = coupon.total_usage_limit !== null ? parseInt(coupon.total_usage_limit, 10) : null;

  if (usageType === "limited" && totalLimit !== null && usedCount >= totalLimit) {
    throw new Error("Coupon usage limit reached.");
  }

  const cleanEmail = (customerEmail || "").trim().toLowerCase();
  const perCustomerLimit = parseInt(coupon.per_customer_limit, 10) || 1;

  if (cleanEmail) {
    const custUsageRes = await client.query(
      `SELECT COUNT(*) FROM coupon_usage 
       WHERE LOWER(customer_email) = LOWER($1) AND (coupon_id = $2 OR UPPER(coupon_code) = UPPER($3))`,
      [cleanEmail, coupon.id, cleanCode]
    );
    const custUsedCount = parseInt(custUsageRes.rows[0].count, 10) || 0;

    if (usageType === "one-time" && custUsedCount >= 1) {
      throw new Error("You have already used this coupon.");
    }
    if (custUsedCount >= perCustomerLimit) {
      throw new Error("You have reached the usage limit for this coupon.");
    }
  }

  await client.query(
    "UPDATE coupons SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
    [coupon.id]
  );

  const insertUsageRes = await client.query(
    `INSERT INTO coupon_usage (
      coupon_id, coupon_code, customer_email, customer_name,
      booking_id, charging_session_id, payment_id,
      original_amount, discount_amount, final_amount,
      service_type, used_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
    RETURNING *`,
    [
      coupon.id,
      coupon.code,
      cleanEmail || "guest@parksafe.in",
      customerName || "Customer",
      bookingId,
      chargingSessionId,
      paymentId,
      parseFloat(originalAmount) || 0,
      parseFloat(discountAmount) || 0,
      parseFloat(finalAmount) || 0,
      serviceType || "Normal Parking"
    ]
  );

  await logAuditEvent({
    client,
    userName: customerName || "Customer",
    userEmail: cleanEmail || null,
    role: "Customer",
    action: "Coupon Applied",
    module: "Coupons",
    entityType: "coupon",
    entityId: coupon.code,
    description: `Coupon ${coupon.code} applied for ₹${parseFloat(discountAmount).toFixed(2)} discount on ${serviceType} (Order: ₹${parseFloat(originalAmount).toFixed(2)} -> Paid: ₹${parseFloat(finalAmount).toFixed(2)})`,
    status: "Success",
    ipAddress: getAuditClientIp(req),
    userAgent: getAuditUserAgent(req)
  });

  return insertUsageRes.rows[0];
}

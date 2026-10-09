import pool from "../../db.js";

export async function logAuditEvent({
  userId = null,
  userName = "System",
  userEmail = null,
  role = "Admin",
  action = "System Event",
  module = "System",
  entityType = null,
  entityId = null,
  description = "",
  severity = "Low",
  status = "Success",
  ipAddress = "127.0.0.1",
  userAgent = null,
  client = null
}) {
  try {
    const logCode = `LOG-${Math.floor(1000 + Math.random() * 9000)}`;
    const db = client || pool;

    const query = `
      INSERT INTO audit_logs (
        log_code, actor, role, action, target, severity, ip,
        user_id, user_name, user_email, user_role, module, description,
        entity_type, entity_id, ip_address, user_agent, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, CURRENT_TIMESTAMP
      ) RETURNING *;
    `;

    const values = [
      logCode,
      userName || "System",
      role || "Staff",
      action,
      description || action,
      severity || "Low",
      ipAddress || "127.0.0.1",
      userId,
      userName || "System",
      userEmail,
      role || "Staff",
      module || "System",
      description || action,
      entityType,
      entityId ? String(entityId) : null,
      ipAddress || "127.0.0.1",
      userAgent,
      status || "Success"
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Audit logging error:", err.message);
    return null;
  }
}

export function getAuditClientIp(req) {
  if (!req) return "127.0.0.1";
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "127.0.0.1";
}

export function getAuditUserAgent(req) {
  if (!req) return null;
  return req.headers["user-agent"] || null;
}

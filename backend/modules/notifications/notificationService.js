import pool from "../../db.js";

export const createNotification = async ({ user_email, title, message, type = "info" }) => {
  const result = await pool.query(
    `INSERT INTO notifications (user_email, title, message, type, is_read, created_at)
     VALUES ($1, $2, $3, $4, FALSE, CURRENT_TIMESTAMP)
     RETURNING *`,
    [user_email, title, message, type]
  );
  return result.rows[0];
};

export const getNotificationsByUser = async (email, options = {}) => {
  const { page, limit, type, is_read, search } = options;
  let query = `SELECT id, user_email, title, message, type, is_read, created_at
     FROM notifications
     WHERE LOWER(user_email) = LOWER($1)`;
  let countQuery = `SELECT COUNT(*) FROM notifications WHERE LOWER(user_email) = LOWER($1)`;
  const params = [email];

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    query += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(message) LIKE $${params.length})`;
    countQuery += ` AND (LOWER(title) LIKE $${params.length} OR LOWER(message) LIKE $${params.length})`;
  }

  if (type && type !== "ALL" && type !== "all") {
    const t = type.toLowerCase();
    if (t === "payment") {
      query += ` AND LOWER(type) IN ('payment', 'receipt', 'pricing')`;
      countQuery += ` AND LOWER(type) IN ('payment', 'receipt', 'pricing')`;
    } else if (t === "parking") {
      query += ` AND LOWER(type) IN ('vehicle', 'slot')`;
      countQuery += ` AND LOWER(type) IN ('vehicle', 'slot')`;
    } else if (t === "system") {
      query += ` AND LOWER(type) IN ('alert', 'support', 'user', 'premium', 'info', 'system')`;
      countQuery += ` AND LOWER(type) IN ('alert', 'support', 'user', 'premium', 'info', 'system')`;
    } else {
      params.push(t);
      query += ` AND LOWER(type) = $${params.length}`;
      countQuery += ` AND LOWER(type) = $${params.length}`;
    }
  }

  if (is_read !== undefined && is_read !== null && is_read !== "ALL" && is_read !== "") {
    const isReadBool = is_read === true || is_read === "true";
    params.push(isReadBool);
    query += ` AND is_read = $${params.length}`;
    countQuery += ` AND is_read = $${params.length}`;
  }

  query += " ORDER BY created_at DESC";

  const countRes = await pool.query(countQuery, params);
  const total = parseInt(countRes.rows[0].count, 10) || 0;

  const unreadCountRes = await pool.query(
    "SELECT COUNT(*) FROM notifications WHERE LOWER(user_email) = LOWER($1) AND is_read = FALSE",
    [email]
  );
  const unreadCount = parseInt(unreadCountRes.rows[0].count, 10) || 0;

  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 5));
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const result = await pool.query(query, params);
    return {
      notifications: result.rows,
      total,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  const result = await pool.query(query, params);
  return {
    notifications: result.rows,
    total,
    unreadCount,
    pagination: {
      page: 1,
      limit: total || 5,
      total,
      totalPages: 1
    }
  };
};

export const markNotificationAsRead = async (id) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

export const markAllNotificationsAsRead = async (email) => {
  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE LOWER(user_email) = LOWER($1)
     RETURNING *`,
    [email]
  );
  return result.rows;
};

export const notifyUser = async (email, { title, message, type = "info" }) => {
  if (!email || !title || !message) return null;
  try {
    return await createNotification({ user_email: email, title, message, type });
  } catch (err) {
    console.error("Failed to notify user:", email, err.message);
    return null;
  }
};

export const notifyUsers = async (emails, { title, message, type = "info" }) => {
  if (!Array.isArray(emails) || emails.length === 0) return [];
  const uniqueEmails = [...new Set(emails.filter((e) => typeof e === "string" && e.trim().length > 0))];
  const promises = uniqueEmails.map((email) => notifyUser(email, { title, message, type }));
  const results = await Promise.allSettled(promises);
  return results.filter((r) => r.status === "fulfilled" && r.value !== null).map((r) => r.value);
};

export const notifyAdmins = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'admin' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("admin@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify admins:", err.message);
    return [];
  }
};

export const notifyStaff = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'staff' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("staff@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify staff:", err.message);
    return [];
  }
};

export const notifyStaffAndAdmins = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) IN ('admin', 'staff') AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("admin@shnoor.com", "staff@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify staff and admins:", err.message);
    return [];
  }
};

export const notifyActiveCustomers = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'customer' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("customer@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify active customers:", err.message);
    return [];
  }
};

export const notifyCustomersAndStaff = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) IN ('customer', 'staff') AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("customer@shnoor.com", "staff@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify customers and staff:", err.message);
    return [];
  }
};

export const notifyAllActiveUsers = async ({ title, message, type = "info" }) => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    if (emails.length === 0) {
      emails.push("customer@shnoor.com", "staff@shnoor.com", "admin@shnoor.com");
    }
    return await notifyUsers(emails, { title, message, type });
  } catch (err) {
    console.error("Failed to notify all active users:", err.message);
    return [];
  }
};

export const getActiveAdminEmails = async () => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'admin' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows
      .map((r) => r.email)
      .filter((e) => Boolean(e) && !e.toLowerCase().endsWith("@shnoor.com"));
    const primaryAdmin = "laibataj1301@gmail.com";
    if (!emails.includes(primaryAdmin)) {
      emails.push(primaryAdmin);
    }
    return emails;
  } catch (err) {
    console.error("Failed to get admin emails:", err.message);
    return ["laibataj1301@gmail.com"];
  }
};

export const getActiveStaffEmails = async () => {
  return [];
};

export const getActiveCustomerEmails = async () => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'customer' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows
      .map((r) => r.email)
      .filter((e) => Boolean(e) && !e.toLowerCase().endsWith("@shnoor.com"));
    return emails;
  } catch (err) {
    console.error("Failed to get customer emails:", err.message);
    return [];
  }
};

export default {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  notifyUser,
  notifyUsers,
  notifyAdmins,
  notifyStaff,
  notifyStaffAndAdmins,
  notifyActiveCustomers,
  notifyCustomersAndStaff,
  notifyAllActiveUsers,
  getActiveAdminEmails,
  getActiveStaffEmails,
  getActiveCustomerEmails
};



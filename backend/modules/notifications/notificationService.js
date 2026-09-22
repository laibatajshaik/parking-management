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

export const getNotificationsByUser = async (email) => {
  const result = await pool.query(
    `SELECT id, user_email, title, message, type, is_read, created_at
     FROM notifications
     WHERE LOWER(user_email) = LOWER($1)
     ORDER BY created_at DESC`,
    [email]
  );
  return result.rows;
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
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    const alertEmail = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
    if (alertEmail && !emails.includes(alertEmail)) {
      emails.push(alertEmail);
    }
    return emails.length > 0 ? emails : ["admin@shnoor.com"];
  } catch (err) {
    console.error("Failed to get admin emails:", err.message);
    return ["admin@shnoor.com"];
  }
};

export const getActiveStaffEmails = async () => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'staff' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    const alertEmail = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
    if (alertEmail && !emails.includes(alertEmail)) {
      emails.push(alertEmail);
    }
    return emails.length > 0 ? emails : ["staff@shnoor.com"];
  } catch (err) {
    console.error("Failed to get staff emails:", err.message);
    return ["staff@shnoor.com"];
  }
};

export const getActiveCustomerEmails = async () => {
  try {
    const res = await pool.query(
      "SELECT DISTINCT email FROM users WHERE LOWER(role) = 'customer' AND (status IS NULL OR LOWER(status) != 'inactive')"
    );
    const emails = res.rows.map((r) => r.email).filter(Boolean);
    const alertEmail = process.env.BREVO_SENDER_EMAIL || "laibataj1306@gmail.com";
    if (alertEmail && !emails.includes(alertEmail)) {
      emails.push(alertEmail);
    }
    return emails.length > 0 ? emails : ["customer@shnoor.com"];
  } catch (err) {
    console.error("Failed to get customer emails:", err.message);
    return ["customer@shnoor.com"];
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



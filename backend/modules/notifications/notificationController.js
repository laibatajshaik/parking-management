import notificationService from "./notificationService.js";

export const getNotifications = async (req, res) => {
  try {
    const email = req.query.email || req.query.user_email;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "User email is required"
      });
    }

    const notifications = await notificationService.getNotificationsByUser(email.trim());
    const unreadCount = notifications.filter((n) => !n.is_read).length;

    res.json({
      success: true,
      notifications,
      unread_count: unreadCount,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error retrieving notifications"
    });
  }
};

export const createNotification = async (req, res) => {
  try {
    const { user_email, title, message, type } = req.body;

    if (!user_email || !title || !message) {
      return res.status(400).json({
        success: false,
        error: "user_email, title, and message are required"
      });
    }

    const notification = await notificationService.createNotification({
      user_email: user_email.trim(),
      title: title.trim(),
      message: message.trim(),
      type: type || "info"
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error creating notification"
    });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Notification ID is required"
      });
    }

    const updated = await notificationService.markNotificationAsRead(id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Notification not found"
      });
    }

    res.json({
      success: true,
      message: "Notification marked as read",
      notification: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error marking notification as read"
    });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const email = req.body.user_email || req.body.email || req.query.email;
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: "User email is required"
      });
    }

    const updated = await notificationService.markAllNotificationsAsRead(email.trim());

    res.json({
      success: true,
      message: "All notifications marked as read",
      updated_count: updated.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server error marking all notifications as read"
    });
  }
};

export default {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead
};

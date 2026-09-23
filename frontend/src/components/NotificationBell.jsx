import { useState, useEffect, useRef, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  Car,
  AlertCircle,
  Info,
  Clock,
  Inbox,
  Tag,
  Crown,
  MapPin,
  User
} from "lucide-react";
import { API_BASE_URL } from "../config/api.js";

function formatExactTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });

  if (isToday) {
    return `Today, ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  }
  const dateStr = date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short"
  });
  return `${dateStr}, ${timeStr}`;
}

function getNotificationIcon(type) {
  switch (type) {
    case "reservation":
      return <Calendar size={15} className="pw-noti-type-icon pw-noti-type-reservation" />;
    case "payment":
    case "receipt":
      return <CreditCard size={15} className="pw-noti-type-icon pw-noti-type-payment" />;
    case "vehicle":
      return <Car size={15} className="pw-noti-type-icon pw-noti-type-vehicle" />;
    case "pricing":
      return <Tag size={15} className="pw-noti-type-icon pw-noti-type-pricing" />;
    case "slot":
      return <MapPin size={15} className="pw-noti-type-icon pw-noti-type-slot" />;
    case "premium":
      return <Crown size={15} className="pw-noti-type-icon pw-noti-type-premium" />;
    case "user":
      return <User size={15} className="pw-noti-type-icon pw-noti-type-user" />;
    case "alert":
      return <AlertCircle size={15} className="pw-noti-type-icon pw-noti-type-alert" />;
    default:
      return <Info size={15} className="pw-noti-type-icon pw-noti-type-info" />;
  }
}

export default function NotificationBell({ userEmail = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const resolveEmail = useCallback(() => {
    if (userEmail && userEmail.trim()) {
      return userEmail.trim();
    }
    try {
      const saved = localStorage.getItem("shnoor_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed && parsed.email ? parsed.email : "";
      }
    } catch {
      return "";
    }
    return "";
  }, [userEmail]);

  const fetchNotifications = useCallback(async () => {
    const email = resolveEmail();
    if (!email) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data && data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        const count = typeof data.unread_count === "number"
          ? data.unread_count
          : data.notifications.filter((n) => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch {
      void 0;
    }
  }, [resolveEmail]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const handleUpdate = () => fetchNotifications();
    window.addEventListener("shnoor_notification_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener("shnoor_notification_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PUT"
      });
      fetchNotifications();
    } catch {
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    const email = resolveEmail();
    if (!email) return;

    try {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);

      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: email })
      });
      fetchNotifications();
    } catch {
      fetchNotifications();
    }
  };

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  return (
    <div className="pw-noti-container" ref={dropdownRef}>
      <button
        type="button"
        className="pw-topbar-bell"
        aria-label="Notifications"
        onClick={handleToggle}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="pw-bell-dot pw-bell-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="pw-noti-popover">
          <div className="pw-noti-header">
            <div className="pw-noti-title-wrap">
              <h4 className="pw-noti-title">Notifications</h4>
              {unreadCount > 0 && (
                <span className="pw-noti-unread-pill">{unreadCount} new</span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                className="pw-noti-mark-all-btn"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="pw-noti-list">
            {notifications.length === 0 ? (
              <div className="pw-noti-empty">
                <Inbox size={32} className="pw-noti-empty-icon" />
                <p className="pw-noti-empty-title">No notifications yet</p>
                <span className="pw-noti-empty-desc">You are all caught up!</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`pw-noti-item ${item.is_read ? "read" : "unread"}`}
                  onClick={() => !item.is_read && handleMarkAsRead(item.id)}
                >
                  <div className="pw-noti-item-icon-box">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="pw-noti-item-content">
                    <div className="pw-noti-item-header">
                      <span className="pw-noti-item-title">{item.title}</span>
                      {!item.is_read && <span className="pw-noti-unread-indicator"></span>}
                    </div>
                    <p className="pw-noti-item-message">{item.message}</p>
                    <div className="pw-noti-item-footer">
                      <span className="pw-noti-item-time">
                        <Clock size={11} />
                        <span>{formatExactTime(item.created_at)}</span>
                      </span>
                      {!item.is_read && (
                        <button
                          type="button"
                          className="pw-noti-item-mark-btn"
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          title="Mark as read"
                        >
                          <Check size={13} />
                          <span>Mark read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

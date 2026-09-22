import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  CreditCard,
  Car,
  AlertCircle,
  Clock,
  Inbox,
  Tag,
  Crown,
  MapPin,
  User,
  HelpCircle
} from "lucide-react";
import { API_BASE_URL } from "../config/api.js";

function formatRelativeTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getNotificationIcon(type) {
  switch (type) {
    case "reservation":
      return <Calendar size={16} className="pw-noti-type-icon pw-noti-type-reservation" />;
    case "payment":
    case "receipt":
      return <CreditCard size={16} className="pw-noti-type-icon pw-noti-type-payment" />;
    case "vehicle":
      return <Car size={16} className="pw-noti-type-icon pw-noti-type-vehicle" />;
    case "pricing":
      return <Tag size={16} className="pw-noti-type-icon pw-noti-type-pricing" />;
    case "slot":
      return <MapPin size={16} className="pw-noti-type-icon pw-noti-type-slot" />;
    case "premium":
      return <Crown size={16} className="pw-noti-type-icon pw-noti-type-premium" />;
    case "user":
      return <User size={16} className="pw-noti-type-icon pw-noti-type-user" />;
    case "support":
      return <HelpCircle size={16} className="pw-noti-type-icon pw-noti-type-info" />;
    case "alert":
      return <AlertCircle size={16} className="pw-noti-type-icon pw-noti-type-alert" />;
    default:
      return <Bell size={16} className="pw-noti-type-icon pw-noti-type-info" />;
  }
}

export default function DashboardNotifications({ userEmail = "", maxItems = 5, title = "Recent Notifications & Activity" }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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
    } finally {
      setLoading(false);
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

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: "PUT"
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        window.dispatchEvent(new Event("shnoor_notification_updated"));
      }
    } catch {
      void 0;
    }
  };

  const handleMarkAllAsRead = async () => {
    const email = resolveEmail();
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        window.dispatchEvent(new Event("shnoor_notification_updated"));
      }
    } catch {
      void 0;
    }
  };

  const displayedList = notifications.slice(0, maxItems);

  return (
    <div className="pw-recent-table-card" style={{ padding: "18px 20px" }}>
      <div className="pw-chart-header" style={{ marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-teal-sub, #f0fdfa)",
              color: "#0d9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <Bell size={17} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h3 className="pw-table-title" style={{ margin: 0 }}>{title}</h3>
            {unreadCount > 0 && (
              <span
                style={{
                  background: "#0d9488",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "999px"
                }}
              >
                {unreadCount} new
              </span>
            )}
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="pw-noti-mark-all-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: "none",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "0.76rem",
              fontWeight: 600,
              color: "#0d9488",
              cursor: "pointer"
            }}
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck size={14} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading && displayedList.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)", fontSize: "0.85rem" }}>
            Loading updates...
          </div>
        ) : displayedList.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "28px 16px",
              background: "var(--bg-sub, #f8fafc)",
              borderRadius: "10px",
              border: "1px dashed var(--border-color, #cbd5e1)"
            }}
          >
            <Inbox size={28} style={{ color: "#94a3b8", marginBottom: "6px" }} />
            <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
              No notifications yet
            </span>
            <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
              Live alerts and system updates will appear here automatically.
            </span>
          </div>
        ) : (
          displayedList.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border-color, #e2e8f0)",
                background: item.is_read
                  ? "var(--bg-card, #ffffff)"
                  : "var(--bg-teal-sub, rgba(13, 148, 136, 0.05))",
                transition: "all 0.2s ease"
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "var(--bg-sub, #f1f5f9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px"
                }}
              >
                {getNotificationIcon(item.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                      {item.title}
                    </span>
                    {!item.is_read && (
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#0d9488",
                          display: "inline-block"
                        }}
                      />
                    )}
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                      fontSize: "0.72rem",
                      color: "var(--text-secondary, #94a3b8)",
                      flexShrink: 0
                    }}
                  >
                    <Clock size={11} />
                    <span>{formatRelativeTime(item.created_at)}</span>
                  </span>
                </div>

                <p
                  style={{
                    margin: "4px 0 0 0",
                    fontSize: "0.80rem",
                    color: "var(--text-secondary, #64748b)",
                    lineHeight: 1.45
                  }}
                >
                  {item.message}
                </p>

                {!item.is_read && (
                  <div style={{ marginTop: "6px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontSize: "0.70rem",
                        color: "#0d9488",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontWeight: 600
                      }}
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                    >
                      <Check size={12} />
                      <span>Mark read</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

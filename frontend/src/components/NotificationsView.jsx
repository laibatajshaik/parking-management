import { useState, useEffect, useCallback, useMemo } from "react";
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
  HelpCircle,
  Search,
  RefreshCw,
  Filter
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
      return <Calendar size={18} className="pw-noti-type-icon pw-noti-type-reservation" />;
    case "payment":
    case "receipt":
      return <CreditCard size={18} className="pw-noti-type-icon pw-noti-type-payment" />;
    case "vehicle":
      return <Car size={18} className="pw-noti-type-icon pw-noti-type-vehicle" />;
    case "pricing":
      return <Tag size={18} className="pw-noti-type-icon pw-noti-type-pricing" />;
    case "slot":
      return <MapPin size={18} className="pw-noti-type-icon pw-noti-type-slot" />;
    case "premium":
      return <Crown size={18} className="pw-noti-type-icon pw-noti-type-premium" />;
    case "user":
      return <User size={18} className="pw-noti-type-icon pw-noti-type-user" />;
    case "support":
      return <HelpCircle size={18} className="pw-noti-type-icon pw-noti-type-info" />;
    case "alert":
      return <AlertCircle size={18} className="pw-noti-type-icon pw-noti-type-alert" />;
    default:
      return <Bell size={18} className="pw-noti-type-icon pw-noti-type-info" />;
  }
}

export default function NotificationsView({
  userEmail = "",
  role = "customer",
  title = "Notifications & Alerts",
  subtitle = "Real-time updates, activity alerts, and official system announcements."
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const resolveEmail = useCallback(() => {
    if (userEmail && userEmail.trim()) {
      return userEmail.trim();
    }
    try {
      const saved = localStorage.getItem("shnoor_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed.email;
      }
    } catch {
      return "";
    }
    if (role === "admin") return "admin@shnoor.com";
    if (role === "staff") return "staff@shnoor.com";
    return "customer@shnoor.com";
  }, [userEmail, role]);

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
    const interval = setInterval(fetchNotifications, 30000);
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

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filterType === "unread" && item.is_read) return false;
      if (filterType === "reservation" && item.type !== "reservation") return false;
      if (filterType === "payment" && item.type !== "payment" && item.type !== "receipt" && item.type !== "pricing") return false;
      if (filterType === "parking" && item.type !== "vehicle" && item.type !== "slot") return false;
      if (filterType === "system" && item.type !== "alert" && item.type !== "support" && item.type !== "user" && item.type !== "premium") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (item.title || "").toLowerCase().includes(q);
        const matchesMsg = (item.message || "").toLowerCase().includes(q);
        const matchesType = (item.type || "").toLowerCase().includes(q);
        return matchesTitle || matchesMsg || matchesType;
      }
      return true;
    });
  }, [notifications, filterType, searchQuery]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
      <div className="pw-recent-table-card" style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  background: "var(--bg-teal-sub, #f0fdfa)",
                  color: "#0d9488",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bell size={20} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                    {title}
                  </h2>
                  {unreadCount > 0 ? (
                    <span
                      style={{
                        background: "#0d9488",
                        color: "#ffffff",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "999px"
                      }}
                    >
                      {unreadCount} Unread
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "var(--bg-sub, #f1f5f9)",
                        color: "var(--text-secondary, #64748b)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: "999px"
                      }}
                    >
                      All caught up
                    </span>
                  )}
                </div>
                {subtitle && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary, #64748b)" }}>
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={fetchNotifications}
              title="Refresh notifications"
              className="pw-btn-action-refresh"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--bg-sub, #f8fafc)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "0.80rem",
                fontWeight: 600,
                color: "var(--text-primary, #0f172a)",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={14} className={loading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#0d9488",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  fontSize: "0.80rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
              >
                <CheckCheck size={16} />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {[
              { id: "all", label: "All", count: notifications.length },
              { id: "unread", label: "Unread", count: unreadCount },
              { id: "reservation", label: "Reservations" },
              { id: "payment", label: "Payments & Fees" },
              { id: "parking", label: "Parking & Slots" },
              { id: "system", label: "System Alerts" }
            ].map((tab) => {
              const isActive = filterType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 14px",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    border: isActive
                      ? "1px solid #0d9488"
                      : "1px solid var(--border-color, #e2e8f0)",
                    background: isActive
                      ? "var(--bg-teal-sub, rgba(13, 148, 136, 0.1))"
                      : "var(--bg-card, #ffffff)",
                    color: isActive ? "#0d9488" : "var(--text-secondary, #64748b)"
                  }}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "999px",
                        fontSize: "0.70rem",
                        background: isActive ? "#0d9488" : "var(--bg-sub, #f1f5f9)",
                        color: isActive ? "#ffffff" : "var(--text-secondary, #64748b)",
                        fontWeight: 700
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div
            className="pw-search-box-pill"
            style={{
              width: "280px",
              boxSizing: "border-box",
              margin: 0
            }}
          >
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
              style={{ fontSize: "0.80rem" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {loading && notifications.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)", fontSize: "0.88rem" }}>
              <RefreshCw size={24} className="pw-spin" style={{ margin: "0 auto 10px", display: "block" }} />
              Loading real-time notifications...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 16px",
                background: "var(--bg-sub, #f8fafc)",
                borderRadius: "12px",
                border: "1px dashed var(--border-color, #cbd5e1)",
                textAlign: "center"
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  background: "var(--bg-card, #ffffff)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                  color: "#94a3b8",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}
              >
                {searchQuery || filterType !== "all" ? <Filter size={24} /> : <Inbox size={24} />}
              </div>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                {searchQuery || filterType !== "all" ? "No matching notifications found" : "No notifications right now"}
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "0.80rem", color: "var(--text-secondary, #64748b)", maxWidth: "380px" }}>
                {searchQuery || filterType !== "all"
                  ? "Try clearing your search query or selecting a different category filter above."
                  : "All official updates, booking confirmations, and activity alerts will appear here in real time."}
              </p>
              {(searchQuery || filterType !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  style={{
                    marginTop: "14px",
                    background: "none",
                    border: "1px solid #0d9488",
                    color: "#0d9488",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: item.is_read
                    ? "1px solid var(--border-color, #e2e8f0)"
                    : "1px solid rgba(13, 148, 136, 0.3)",
                  background: item.is_read
                    ? "var(--bg-card, #ffffff)"
                    : "var(--bg-teal-sub, rgba(13, 148, 136, 0.05))",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "10px",
                    background: item.is_read ? "var(--bg-sub, #f1f5f9)" : "var(--bg-card, #ffffff)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: item.is_read ? "none" : "0 2px 6px rgba(13, 148, 136, 0.15)"
                  }}
                >
                  {getNotificationIcon(item.type)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "0.90rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                        {item.title}
                      </span>
                      {!item.is_read && (
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "#0d9488",
                            display: "inline-block"
                          }}
                        />
                      )}
                      <span
                        style={{
                          textTransform: "uppercase",
                          fontSize: "0.68rem",
                          letterSpacing: "0.5px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "4px",
                          background: "var(--bg-sub, #f1f5f9)",
                          color: "var(--text-secondary, #64748b)"
                        }}
                      >
                        {item.type || "system"}
                      </span>
                    </div>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        color: "var(--text-secondary, #94a3b8)",
                        flexShrink: 0
                      }}
                    >
                      <Clock size={12} />
                      <span>{formatExactTime(item.created_at)}</span>
                    </span>
                  </div>

                  <p
                    style={{
                      margin: "6px 0 0 0",
                      fontSize: "0.84rem",
                      color: "var(--text-secondary, #475569)",
                      lineHeight: 1.5
                    }}
                  >
                    {item.message}
                  </p>

                  {!item.is_read && (
                    <div style={{ marginTop: "10px", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "0.75rem",
                          color: "#0d9488",
                          background: "none",
                          border: "1px solid rgba(13, 148, 136, 0.3)",
                          cursor: "pointer",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontWeight: 600,
                          transition: "all 0.15s ease"
                        }}
                        onClick={(e) => handleMarkAsRead(item.id, e)}
                      >
                        <Check size={13} />
                        <span>Mark as read</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

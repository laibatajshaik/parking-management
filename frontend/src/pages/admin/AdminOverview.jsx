import { useState, useEffect } from "react";
import {
  TrendingUp,
  Car,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Layers,
  Clock,
  RefreshCw,
  AlertTriangle,
  LogIn,
  LogOut,
  Tag,
  Activity,
  Users,
  ShieldCheck,
  Search,
  Download,
  X,
  CheckCircle,
  ChevronRight,
  Zap
} from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";
import Pagination from "../../components/Pagination.jsx";

function getActivityBadge(type) {
  const t = (type || "").toLowerCase();
  if (t.includes("ev") || t.includes("charging")) {
    return {
      bg: "#ecfdf5",
      color: "#059669",
      border: "#a7f3d0",
      icon: Zap
    };
  }
  if (t.includes("entry") || t.includes("entered") || t.includes("check-in") || t.includes("check in")) {
    return {
      bg: "var(--bg-teal-sub, #f0fdf4)",
      color: "#16a34a",
      border: "#bbf7d0",
      icon: LogIn
    };
  }
  if (t.includes("exit") || t.includes("exited") || t.includes("check-out") || t.includes("check out")) {
    return {
      bg: "#f0f9ff",
      color: "#0284c7",
      border: "#bae6fd",
      icon: LogOut
    };
  }
  if (t.includes("cancellation") || t.includes("cancelled")) {
    return {
      bg: "#fef2f2",
      color: "#dc2626",
      border: "#fecaca",
      icon: AlertTriangle
    };
  }
  if (t.includes("reservation") || t.includes("booking")) {
    return {
      bg: "#f5f3ff",
      color: "#7c3aed",
      border: "#ddd6fe",
      icon: CalendarCheck
    };
  }
  if (t.includes("payment")) {
    return {
      bg: "#ecfdf5",
      color: "#059669",
      border: "#a7f3d0",
      icon: CreditCard
    };
  }
  if (t.includes("vehicle")) {
    return {
      bg: "#f0fdfa",
      color: "#0d9488",
      border: "#99f6e4",
      icon: Car
    };
  }
  if (t.includes("user")) {
    return {
      bg: "#eef2ff",
      color: "#4f46e5",
      border: "#c7d2fe",
      icon: Users
    };
  }
  if (t.includes("slot") || t.includes("bay") || t.includes("reassignment")) {
    return {
      bg: "#fffbeb",
      color: "#d97706",
      border: "#fde68a",
      icon: Layers
    };
  }
  if (t.includes("plan") || t.includes("pricing") || t.includes("tariff")) {
    return {
      bg: "#fdf4ff",
      color: "#c026d3",
      border: "#f5d0fe",
      icon: Tag
    };
  }
  return {
    bg: "#f8fafc",
    color: "#475569",
    border: "#e2e8f0",
    icon: Activity
  };
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return "Just now";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (isNaN(diffMs) || diffMs < 0) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  } catch {
    return "Just now";
  }
}

function formatFullTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return String(isoStr);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return String(isoStr);
  }
}

function formatDateOnly(isoStr) {
  if (!isoStr) return "Today";
  try {
    const str = String(isoStr).trim();
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      const monthStr = monthNames[parseInt(m, 10) - 1] || m;
      return `${parseInt(d, 10)} ${monthStr} ${y}`;
    }
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return String(isoStr);
    return dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(isoStr);
  }
}

function formatTimeOnly(isoStr) {
  if (!isoStr) return "—";
  try {
    const str = String(isoStr).trim();
    const ampmMatch = str.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/i);
    if (ampmMatch) {
      const h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2];
      const ampm = ampmMatch[3].toLowerCase();
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    }
    const match = str.match(/(?:[T ]|^)(\d{1,2}):(\d{2})/);
    if (match) {
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = h >= 12 ? "pm" : "am";
      h = h % 12 || 12;
      return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
    }
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return String(isoStr);
    return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return String(isoStr);
  }
}

function getStatusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") {
    return (
      <span className="pw-badge-status-completed" style={{ background: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}>
        <CheckCircle2 size={11} />
        <span>Confirmed</span>
      </span>
    );
  }
  if (s === "checked in") {
    return (
      <span className="pw-badge-status-parked" style={{ background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" }}>
        <Tag size={11} />
        <span>Checked In</span>
      </span>
    );
  }
  if (s === "pending") {
    return (
      <span className="pw-badge-status-pending" style={{ background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" }}>
        <Clock size={11} />
        <span>Pending</span>
      </span>
    );
  }
  if (s === "cancelled") {
    return (
      <span className="pw-badge-status-cancelled" style={{ background: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" }}>
        <X size={11} />
        <span>Cancelled</span>
      </span>
    );
  }
  return (
    <span className="pw-badge-status-completed">
      <CheckCircle2 size={11} />
      <span>{status || "Active"}</span>
    </span>
  );
}

export default function AdminOverview({
  overviewData,
  data,
  isLoading,
  error,
  onRefresh,
  setActiveTab
}) {
  const [filterType, setFilterType] = useState("ALL");
  const currentData = overviewData || data;

  const totalParkingSlots = currentData?.totalParkingSlots !== undefined ? currentData.totalParkingSlots : 0;
  const availableSlots = currentData?.availableSlots !== undefined ? currentData.availableSlots : 0;
  const reservedSlots = currentData?.reservedSlots !== undefined ? currentData.reservedSlots : 0;
  const activeParkingSessions = currentData?.activeParkingSessions !== undefined ? currentData.activeParkingSessions : 0;
  const totalVehicles = currentData?.totalVehicles !== undefined ? currentData.totalVehicles : 0;
  const todaysRevenue = currentData?.todaysRevenue !== undefined ? currentData.todaysRevenue : 0;
  const activeEvSessions = currentData?.activeEvSessions !== undefined ? currentData.activeEvSessions : (currentData?.evStats?.activeSessions || 0);
  const rawActivities = currentData?.recentActivity || [];

  const recentActivity = rawActivities.filter((act) => {
    if (filterType === "ALL") return true;
    const t = (act.type || "").toLowerCase();
    if (filterType === "ENTRY_EXIT") return t.includes("entry") || t.includes("exit") || t.includes("entered") || t.includes("exited");
    if (filterType === "PAYMENTS") return t.includes("payment");
    if (filterType === "BOOKINGS") return t.includes("reservation") || t.includes("booking") || t.includes("cancelled");
    return true;
  });

  const [bookings, setBookings] = useState([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("ALL");
  const [bookingPage, setBookingPage] = useState(1);
  const [bookingLimit, setBookingLimit] = useState(5);
  const [actionAlert, setActionAlert] = useState("");

  useEffect(() => {
    setBookingPage(1);
  }, [bookingSearch, bookingStatusFilter]);

  const fetchBookings = async () => {
    setIsBookingsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`);
      const resData = await res.json();
      setIsBookingsLoading(false);
      if (resData.success && Array.isArray(resData.bookings)) {
        setBookings(resData.bookings);
      }
    } catch {
      setIsBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        setActionAlert(resData.message || `Booking status updated to ${newStatus}`);
        setTimeout(() => setActionAlert(""), 4000);
        fetchBookings();
        if (onRefresh) onRefresh();
      }
    } catch {
      setActionAlert("Failed to update reservation status");
      setTimeout(() => setActionAlert(""), 4000);
    }
  };

  const handleDownloadPass = (booking) => {
    if (!booking) return;
    const formattedAmount = parseFloat(booking.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParkSafe Reservation Pass - ${booking.booking_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
    }
    .ticket {
      width: 400px;
      background: #ffffff;
      border: 2px solid #0f3b43;
      border-radius: 14px;
      padding: 26px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #0f3b43;
      letter-spacing: 0.5px;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 12px;
      border-radius: 999px;
      background: #dbeafe;
      color: #1d4ed8;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .ticket-id {
      font-size: 14px;
      font-weight: 800;
      color: #0d9488;
      margin-top: 6px;
    }
    .val-code {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 600;
    }
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 0.5px;
    }
    .slot-pill {
      background: #0d9488;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .val {
      font-weight: 700;
      color: #1e293b;
    }
    .total-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 12px 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .total-label {
      font-weight: 700;
      color: #166534;
      font-size: 13px;
    }
    .total-val {
      font-weight: 800;
      color: #15803d;
      font-size: 18px;
    }
    .barcode-box {
      text-align: center;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .barcode {
      font-family: "Courier New", monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .barcode-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 1px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">${(booking.status || "CONFIRMED").toUpperCase()} RESERVATION</span>
      <div class="ticket-id">${booking.booking_id}</div>
      <div class="val-code">Validation Code: ${booking.validation_code}</div>
    </div>
    <div class="plate-banner">
      <span>${booking.vehicle_number}</span>
      <span class="slot-pill">Bay ${booking.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer</span>
        <span class="val">${booking.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact</span>
        <span class="val">${booking.customer_phone || "—"}</span>
      </div>
      <div class="item">
        <span class="label">Reserved Start</span>
        <span class="val">${formatDateOnly(booking.start_time)} ${formatTimeOnly(booking.start_time)}</span>
      </div>
      <div class="item">
        <span class="label">Reserved End</span>
        <span class="val">${formatDateOnly(booking.end_time)} ${formatTimeOnly(booking.end_time)}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${booking.duration_hours} Hours</span>
      </div>
      <div class="item">
        <span class="label">Parking Zone</span>
        <span class="val">${booking.zone || "Zone A"}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Model</span>
        <span class="val">${booking.model || "Standard"} (${booking.vehicle_type || "Car"})</span>
      </div>
      <div class="item">
        <span class="label">Status</span>
        <span class="val">${booking.status}</span>
      </div>
    </div>
    <div class="total-banner">
      <span class="total-label">Reservation Tariff</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${booking.booking_id} • ${booking.validation_code}</div>
    </div>
    <div class="footer">
      Please present this digital pass or validation code to the parking operator at the gate upon arrival.
    </div>
  </div>
</body>
</html>`;
    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (booking.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Reservation_Pass_${cleanPlate}_${booking.booking_id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filteredBookings = bookings.filter((b) => {
    const q = bookingSearch.toLowerCase();
    const matchesSearch =
      !q ||
      (b.booking_id || "").toLowerCase().includes(q) ||
      (b.customer_name || "").toLowerCase().includes(q) ||
      (b.vehicle_number || "").toLowerCase().includes(q) ||
      (b.slot_number || "").toLowerCase().includes(q) ||
      (b.validation_code || "").toLowerCase().includes(q);
    const matchesStatus =
      bookingStatusFilter === "ALL" ||
      (b.status || "").toLowerCase() === bookingStatusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="pw-admin-overview-container" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <div style={{
          background: "var(--bg-sub, #fef2f2)",
          border: "1px solid var(--border-color, #fecaca)",
          color: "#dc2626",
          padding: "14px 18px",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: "0.88rem", fontWeight: 700 }}>
              {error}
            </span>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            style={{
              background: "#dc2626",
              color: "#ffffff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.8rem",
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && !currentData && (
        <div style={{
          padding: "48px 20px",
          textAlign: "center",
          background: "var(--bg-card, #ffffff)",
          borderRadius: "12px",
          border: "1px solid var(--border-color, #e2e8f0)"
        }}>
          <RefreshCw size={28} className="pw-spin" style={{ margin: "0 auto 12px", color: "#0d9488" }} />
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary, #0f172a)" }}>
            Loading live parking metrics from database...
          </p>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
        gap: "14px",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
      }}>
        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("slot-management")}
          title="Manage Parking Slots"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Total Parking Slots</span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-sub, #f1f5f9)",
              color: "#475569",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Layers size={16} />
            </div>
          </div>
          <span className="pw-metric-value">{totalParkingSlots}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <TrendingUp size={12} />
            <span>Facility Capacity</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("parking-occupancy")}
          title="View Parking Occupancy"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Available Slots</span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-teal-sub, #f0fdf4)",
              color: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{availableSlots}</span>
          <span className="pw-metric-trend positive" style={{ color: "#16a34a", marginTop: "6px" }}>
            <CheckCircle2 size={12} />
            <span>Ready for Allocation</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("bookings-reservations")}
          title="View Bookings & Reservations"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Reserved Slots</span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-sub, #fffbeb)",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <CalendarCheck size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#d97706" }}>{reservedSlots}</span>
          <span className="pw-metric-trend positive" style={{ color: "#d97706", marginTop: "6px" }}>
            <CalendarCheck size={12} />
            <span>Active Reservations</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("active-parking-sessions")}
          title="View Active Parking Sessions"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Active Parking Sessions</span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-teal-sub, #f0fdfa)",
              color: "#0d9488",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Car size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{activeParkingSessions}</span>
          <span className="pw-metric-trend positive" style={{ color: "#0d9488", marginTop: "6px" }}>
            <Car size={12} />
            <span>Vehicles Parked Inside</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("ev-charging")}
          title="Manage EV Charging Stations"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">EV Charging</span>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--bg-teal-sub, #ecfdf5)",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Zap size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#059669" }}>{activeEvSessions}</span>
          <span className="pw-metric-trend positive" style={{ color: "#059669", marginTop: "6px" }}>
            <Zap size={12} />
            <span>Active EV Sessions</span>
          </span>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        gap: "14px",
        width: "100%",
        minWidth: 0,
        boxSizing: "border-box"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            className="pw-metric-card"
            style={{ cursor: "pointer", flex: 1, transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
            onClick={() => setActiveTab && setActiveTab("vehicle-management")}
            title="Manage Registered Vehicles"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className="pw-metric-label">Total Vehicles</span>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--bg-sub, #eff6ff)",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <ShieldCheck size={16} />
              </div>
            </div>
            <span className="pw-metric-value">{totalVehicles}</span>
            <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
              <ShieldCheck size={12} />
              <span>Registered in Database</span>
            </span>
          </div>

          <div
            className="pw-metric-card"
            style={{ cursor: "pointer", flex: 1, transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
            onClick={() => setActiveTab && setActiveTab("payments-revenue")}
            title="View Revenue Reports"
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <span className="pw-metric-label">Today's Revenue</span>
              <div style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "var(--bg-teal-sub, #f0fdf4)",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <CreditCard size={16} />
              </div>
            </div>
            <span className="pw-metric-value" style={{ color: "#059669" }}>
              {`₹${parseFloat(todaysRevenue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="pw-metric-trend positive" style={{ color: "#059669", marginTop: "6px" }}>
              <CreditCard size={12} />
              <span>Completed Today</span>
            </span>
          </div>
        </div>

        <div
          className="pw-recent-table-card"
          style={{
            gridColumn: "span 1",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: "280px"
          }}
        >
          <div className="pw-chart-header" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "12px",
            borderBottom: "1px solid var(--border-color, #e2e8f0)",
            marginBottom: "12px",
            flexWrap: "wrap",
            gap: "8px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={17} style={{ color: "#0d9488" }} />
              <h3 style={{
                margin: 0,
                fontSize: "0.98rem",
                fontWeight: 800,
                color: "var(--text-primary, #0f172a)"
              }}>
                Recent Activity
              </h3>
              <span style={{
                fontSize: "0.68rem",
                background: "var(--bg-teal-sub, #f0fdfa)",
                color: "#0d9488",
                padding: "2px 8px",
                borderRadius: "999px",
                fontWeight: 700,
                border: "1px solid var(--border-color, #ccfbf1)"
              }}>
                Live Feed
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  fontSize: "0.74rem",
                  padding: "4px 8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  background: "var(--bg-sub, #f8fafc)",
                  color: "var(--text-primary, #0f172a)",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <option value="ALL">All Activity</option>
                <option value="ENTRY_EXIT">Entries & Exits</option>
                <option value="PAYMENTS">Payments</option>
                <option value="BOOKINGS">Reservations</option>
              </select>

              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={onRefresh}
                title="Refresh live activity"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  fontSize: "0.74rem"
                }}
              >
                <RefreshCw size={12} className={isLoading ? "pw-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            overflowY: "auto",
            maxHeight: "310px",
            paddingRight: "4px"
          }}>
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((act) => {
                const badge = getActivityBadge(act.type);
                const IconComponent = badge.icon;
                return (
                  <div
                    key={act.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "var(--bg-sub, #f8fafc)",
                      border: "1px solid var(--border-color, #f1f5f9)",
                      gap: "10px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <div style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <IconComponent size={14} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: badge.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.3px"
                          }}>
                            {act.type}
                          </span>
                        </div>
                        <div style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-primary, #0f172a)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {act.title}
                        </div>
                        <div style={{
                          fontSize: "0.74rem",
                          color: "var(--text-secondary, #64748b)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}>
                          {act.description || "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        color: "var(--text-primary, #0f172a)"
                      }}>
                        {formatRelativeTime(act.timestamp)}
                      </div>
                      <div style={{
                        fontSize: "0.66rem",
                        color: "var(--text-secondary, #94a3b8)"
                      }}>
                        {formatFullTime(act.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                padding: "36px 20px",
                textAlign: "center",
                color: "var(--text-secondary, #94a3b8)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Clock size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem", color: "var(--text-primary, #0f172a)" }}>
                  No recent activity
                </h4>
                <p style={{ margin: 0, fontSize: "0.76rem" }}>
                  Real-time database actions (vehicle check-ins, exits, reservations, payments) will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pw-recent-table-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: "14px", padding: "18px 20px", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CalendarCheck size={18} style={{ color: "#0d9488" }} />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
              Today's Bookings & Reservations
            </h3>
            <span style={{ fontSize: "0.70rem", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0d9488", padding: "2px 8px", borderRadius: "999px", fontWeight: 700, border: "1px solid var(--border-color, #ccfbf1)" }}>
              {bookings.length} Registered
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div className="pw-search-box-pill" style={{ padding: "4px 10px", height: "32px" }}>
              <Search size={13} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search booking ID, plate, name..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{ fontSize: "0.76rem", border: "none", background: "transparent", outline: "none", width: "170px" }}
              />
            </div>

            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value)}
              style={{ fontSize: "0.74rem", padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-sub, #f8fafc)", color: "var(--text-primary, #0f172a)", fontWeight: 600, height: "32px", cursor: "pointer" }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchBookings}
              title="Refresh reservations"
              style={{ padding: "4px 8px", fontSize: "0.74rem", height: "32px" }}
            >
              <RefreshCw size={12} className={isBookingsLoading ? "pw-spin" : ""} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab && setActiveTab("bookings-reservations")}
              title="View all bookings in full module"
              style={{ fontSize: "0.74rem", fontWeight: 700, color: "#0d9488", background: "transparent", border: "1px solid #99f6e4", borderRadius: "6px", padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", height: "32px" }}
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {actionAlert && (
          <div style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid #bbf7d0", color: "#16a34a", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <CheckCircle2 size={14} />
            <span>{actionAlert}</span>
          </div>
        )}

        <div className="pw-users-table-scroll-container" style={{ margin: 0, width: "100%", overflowX: "auto" }}>
          <div style={{ minWidth: "1120px", width: "100%", display: "flex", flexDirection: "column", gap: "6px", boxSizing: "border-box" }}>
            <div className="pw-users-header-row pw-mgmt-grid-row pw-bookings-reservations-grid" style={{ padding: "8px 12px" }}>
              <span>Booking Ref</span>
              <span>Customer Details</span>
              <span>Vehicle Info</span>
              <span>Assigned Bay</span>
              <span>Reserved Window</span>
              <span>Duration & Fee</span>
              <span style={{ textAlign: "center" }}>Status</span>
              <span style={{ textAlign: "center" }}>Actions</span>
            </div>

            <div className="pw-user-cards-stack" style={{ width: "100%", minWidth: "100%", margin: 0 }}>
              {filteredBookings.length > 0 ? (
                filteredBookings.slice((bookingPage - 1) * bookingLimit, bookingPage * bookingLimit).map((b) => {
                  const amt = parseFloat(b.total_amount) || 0;
                  return (
                    <div key={b.id || b.booking_id} className="pw-user-card-box pw-mgmt-grid-row pw-bookings-reservations-grid" style={{ padding: "8px 12px" }}>
                    <div>
                      <div className="pw-txn-badge" style={{ background: "var(--bg-teal-sub, #f0fdfa)", color: "#0d9488", borderColor: "var(--border-color, #99f6e4)" }}>
                        <CalendarCheck size={11} />
                        <span>{b.booking_id}</span>
                      </div>
                      <div className="pw-veh-model-sub" style={{ marginTop: "3px", fontSize: "0.70rem", color: "var(--text-secondary, #94a3b8)" }}>
                        Code: <strong>{b.validation_code}</strong>
                      </div>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                        {b.customer_name}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>
                        {b.customer_phone || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                        <span>{b.vehicle_number}</span>
                      </span>
                      <div className="pw-veh-model-sub" style={{ marginTop: "3px" }}>
                        {b.model || "Standard"} • {b.vehicle_type || "Car"}
                      </div>
                    </div>

                    <div>
                      <div className="pw-badge-slot-cell" style={{ marginBottom: "2px" }}>
                        <Layers size={11} />
                        <span>Bay {b.slot_number}</span>
                      </div>
                      <span style={{ fontSize: "0.70rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>
                        {b.zone || "Zone A"}
                      </span>
                      {((b.slot_number || "").startsWith("EV") || (b.vehicle_type || "").toUpperCase() === "EV" || (b.plan_code || "").includes("EV")) && (
                        <div style={{ marginTop: "2px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 6px", borderRadius: "4px", fontSize: "0.68rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                            <Zap size={10} /> EV
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pw-user-card-date-col">
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-primary, #1e293b)", fontWeight: 600, fontSize: "0.76rem" }}>
                        <Clock size={11} style={{ color: "#0d9488" }} />
                        <span>{formatDateOnly(b.start_time)}</span>
                      </div>
                      <div style={{ fontSize: "0.70rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                        {formatTimeOnly(b.start_time)} - {formatTimeOnly(b.end_time)}
                      </div>
                    </div>

                    <div>
                      <div className="pw-fee-amount" style={{ fontSize: "0.90rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="pw-duration-chip" style={{ fontSize: "0.68rem", padding: "1px 5px", marginTop: "2px" }}>
                        <span>{b.duration_hours} hrs</span>
                      </div>
                      {b.coupon_code && parseFloat(b.discount_amount || 0) > 0 && (
                        <div style={{ marginTop: "2px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "0.68rem", fontWeight: 700, color: "#16a34a", background: "#dcfce7", padding: "1px 6px", borderRadius: "4px" }}>
                            <Tag size={10} /> {b.coupon_code} (-₹{parseFloat(b.discount_amount).toFixed(0)})
                          </span>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getStatusBadge(b.status)}
                    </div>

                    <div className="pw-user-card-actions-col" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", flexWrap: "nowrap" }}>
                      {b.status === "Confirmed" && (
                        <button
                          type="button"
                          className="pw-btn-action-view"
                          onClick={() => handleUpdateBookingStatus(b.id, "Checked In")}
                          title="Check-In / Validate customer arrival"
                          style={{ padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap", flexShrink: 0, color: "#0f766e", borderColor: "#99f6e4" }}
                        >
                          <CheckCircle2 size={12} style={{ color: "#0d9488" }} />
                          <span>Check-In</span>
                        </button>
                      )}

                      {b.status === "Pending" && (
                        <button
                          type="button"
                          className="pw-btn-action-view"
                          onClick={() => handleUpdateBookingStatus(b.id, "Confirmed")}
                          title="Confirm reservation"
                          style={{ padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap", flexShrink: 0, color: "#047857", borderColor: "#a7f3d0" }}
                        >
                          <CheckCircle size={12} style={{ color: "#16a34a" }} />
                          <span>Confirm</span>
                        </button>
                      )}

                      {b.status !== "Cancelled" && b.status !== "Completed" && (
                        <button
                          type="button"
                          className="pw-btn-action-delete"
                          onClick={() => handleUpdateBookingStatus(b.id, "Cancelled")}
                          title="Cancel reservation"
                          style={{ padding: "4px 6px", flexShrink: 0 }}
                        >
                          <X size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="pw-btn-action-download"
                        onClick={() => handleDownloadPass(b)}
                        title="Download official reservation pass"
                        style={{ padding: "4px 8px", fontSize: "0.72rem", whiteSpace: "nowrap", flexShrink: 0 }}
                      >
                        <Download size={12} />
                        <span>Pass</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                <CalendarCheck size={28} style={{ opacity: 0.4, margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
                  No reservations matching your filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

        {filteredBookings.length > 0 && (
          <Pagination
            page={bookingPage}
            limit={bookingLimit}
            total={filteredBookings.length}
            onPageChange={setBookingPage}
            onLimitChange={(newLimit) => {
              setBookingLimit(newLimit);
              setBookingPage(1);
            }}
            limitOptions={[5, 10, 25, 50]}
          />
        )}
      </div>
    </div>
  );
}

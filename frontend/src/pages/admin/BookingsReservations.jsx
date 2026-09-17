import { useState, useEffect } from "react";
import { CalendarCheck, Search, RefreshCw, CheckCircle2, Clock, Layers, Download, X, TrendingUp, Tag, CheckCircle, XCircle } from "lucide-react";

export default function BookingsReservations({ setStatusActionMessage }) {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    checkedIn: 0,
    totalRevenue: "₹0.00",
    totalRevenueNumeric: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPassBooking] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/bookings");
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.bookings) {
        setBookings(data.bookings);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) {
      const now = new Date();
      return now.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const formatDateOnly = (isoStr) => {
    if (!isoStr) {
      return new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  const formatTimeOnly = (isoStr) => {
    if (!isoStr) {
      return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return isoStr;
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (setStatusActionMessage) {
          setStatusActionMessage(data.message || `Booking status updated to ${newStatus}`);
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
        fetchBookings();
      }
    } catch {
      if (setStatusActionMessage) {
        setStatusActionMessage("Failed to update booking status");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const handleDownloadPass = (booking) => {
    const target = booking || selectedPassBooking;
    if (!target) return;

    const formattedAmount = parseFloat(target.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParkSafe Reservation Pass - ${target.booking_id}</title>
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
      <span class="status-badge">${(target.status || "CONFIRMED").toUpperCase()} RESERVATION</span>
      <div class="ticket-id">${target.booking_id}</div>
      <div class="val-code">Validation Code: ${target.validation_code}</div>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span class="slot-pill">Bay ${target.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer</span>
        <span class="val">${target.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact</span>
        <span class="val">${target.customer_phone || "+91 98765 43210"}</span>
      </div>
      <div class="item">
        <span class="label">Reserved Start</span>
        <span class="val">${formatDate(target.start_time)}</span>
      </div>
      <div class="item">
        <span class="label">Reserved End</span>
        <span class="val">${formatDate(target.end_time)}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${target.duration_hours} Hours</span>
      </div>
      <div class="item">
        <span class="label">Parking Zone</span>
        <span class="val">${target.zone || "Zone A"}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Model</span>
        <span class="val">${target.model || "Standard"} (${target.vehicle_type || "Car"})</span>
      </div>
      <div class="item">
        <span class="label">Status</span>
        <span class="val">${target.status}</span>
      </div>
    </div>
    <div class="total-banner">
      <span class="total-label">Reservation Tariff</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${target.booking_id} • ${target.validation_code}</div>
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
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Reservation_Pass_${cleanPlate}_${target.booking_id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (b.booking_id || "").toLowerCase().includes(q) ||
      (b.customer_name || "").toLowerCase().includes(q) ||
      (b.customer_email || "").toLowerCase().includes(q) ||
      (b.vehicle_number || "").toLowerCase().includes(q) ||
      (b.slot_number || "").toLowerCase().includes(q) ||
      (b.validation_code || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (b.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st) => {
    const raw = (st || "").toLowerCase();
    if (raw === "confirmed") {
      return (
        <span className="pw-badge-status-completed" style={{ background: "var(--bg-teal-sub, #ecfdf5)", color: "#2dd4bf", border: "1px solid var(--border-color, #a7f3d0)" }}>
          <CheckCircle2 size={11} />
          <span>Confirmed</span>
        </span>
      );
    }
    if (raw === "pending") {
      return (
        <span className="pw-badge-status-pending" style={{ background: "var(--bg-sub, #fffbeb)", color: "#facc15", border: "1px solid var(--border-color, #fde68a)" }}>
          <Clock size={11} />
          <span>Pending</span>
        </span>
      );
    }
    if (raw === "checked in" || raw === "validated") {
      return (
        <span className="pw-badge-status-parked" style={{ background: "var(--bg-sub, #eff6ff)", color: "#38bdf8", border: "1px solid var(--border-color, #bfdbfe)" }}>
          <Tag size={11} />
          <span>Checked In</span>
        </span>
      );
    }
    if (raw === "completed") {
      return (
        <span className="pw-badge-status-completed">
          <CheckCircle size={11} />
          <span>Completed</span>
        </span>
      );
    }
    if (raw === "cancelled") {
      return (
        <span className="pw-badge-status-cancelled" style={{ background: "var(--bg-sub, #fef2f2)", color: "#f87171", border: "1px solid var(--border-color, #fecaca)" }}>
          <XCircle size={11} />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="pw-badge-status-completed">
        <span>{st}</span>
      </span>
    );
  };

  return (
    <div className="pw-bookings-reservations-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Reservations</span>
          <span className="pw-metric-value">{stats.total || bookings.length}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Facility booking queue</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Confirmed Bookings</span>
          <span className="pw-metric-value" style={{ color: "#047857" }}>{stats.confirmed}</span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={12} />
            <span>Guaranteed reserved bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Checked-In / Arrived</span>
          <span className="pw-metric-value" style={{ color: "#1d4ed8" }}>{stats.checkedIn}</span>
          <span className="pw-metric-trend positive">
            <Tag size={12} />
            <span>Active on facility grounds</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Reservation Revenue</span>
          <span className="pw-metric-value">{stats.totalRevenue || "₹0.00"}</span>
          <span className="pw-metric-trend positive">
            <span>Advance booking receipts</span>
          </span>
        </div>
      </div>

      <div className="pw-users-panel-card" style={{ marginTop: "24px" }}>
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search booking ID, customer, plate, bay, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-users-filter-group">
            <div className="pw-filter-dropdown-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pw-custom-select"
              >
                <option value="ALL">All Reservation Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
                <option value="Checked In">Checked In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchBookings}
              title="Refresh reservations"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-bookings-reservations-grid">
            <span>Booking Ref</span>
            <span>Customer Details</span>
            <span>Vehicle Info</span>
            <span>Assigned Bay</span>
            <span>Reserved Window</span>
            <span>Duration & Fee</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((b) => {
                const amt = parseFloat(b.total_amount) || 0;

                return (
                  <div key={b.id || b.booking_id} className="pw-user-card-box pw-mgmt-grid-row pw-bookings-reservations-grid">
                    <div>
                      <div className="pw-txn-badge" style={{ background: "var(--bg-teal-sub, #f0fdfa)", color: "#2dd4bf", borderColor: "var(--border-color, #99f6e4)" }}>
                        <CalendarCheck size={12} />
                        <span>{b.booking_id}</span>
                      </div>
                      <div className="pw-veh-model-sub" style={{ marginTop: "4px", fontSize: "0.72rem", color: "#64748b" }}>
                        Code: <strong>{b.validation_code}</strong>
                      </div>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                        {b.customer_name}
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        {b.customer_phone || "+91 98765 43210"}
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
                      <div className="pw-badge-slot-cell" style={{ marginBottom: "3px" }}>
                        <Layers size={11} />
                        <span>Bay {b.slot_number}</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                        {b.zone || "Zone A"}
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-primary, #1e293b)", fontWeight: 600, fontSize: "0.78rem" }}>
                        <Clock size={11} style={{ color: "#0d9488" }} />
                        <span>{formatDateOnly(b.start_time)}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                        {formatTimeOnly(b.start_time)} - {formatTimeOnly(b.end_time)}
                      </div>
                    </div>

                    <div>
                      <div className="pw-fee-amount" style={{ fontSize: "0.92rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <div className="pw-duration-chip" style={{ fontSize: "0.70rem", padding: "1px 5px", marginTop: "2px" }}>
                        <span>{b.duration_hours} hrs</span>
                      </div>
                    </div>

                    <div>
                      {getStatusBadge(b.status)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                      {b.status === "Confirmed" && (
                        <button
                          type="button"
                          className="pw-btn-action-view-receipt"
                          onClick={() => handleUpdateStatus(b.id, "Checked In")}
                          title="Check-In / Validate customer arrival"
                          style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                        >
                          <span>Check-In</span>
                        </button>
                      )}

                      {b.status === "Pending" && (
                        <button
                          type="button"
                          className="pw-btn-action-view-receipt"
                          onClick={() => handleUpdateStatus(b.id, "Confirmed")}
                          title="Confirm reservation"
                          style={{ padding: "4px 8px", fontSize: "0.74rem", background: "#ecfdf5", color: "#047857" }}
                        >
                          <span>Confirm</span>
                        </button>
                      )}

                      {b.status !== "Cancelled" && b.status !== "Completed" && (
                        <button
                          type="button"
                          className="pw-btn-action-delete"
                          onClick={() => handleUpdateStatus(b.id, "Cancelled")}
                          title="Cancel reservation"
                          style={{ padding: "4px 6px" }}
                        >
                          <X size={12} />
                        </button>
                      )}

                      <button
                        type="button"
                        className="pw-btn-action-download"
                        onClick={() => handleDownloadPass(b)}
                        title="Download official reservation pass"
                      >
                        <Download size={12} />
                        <span>Pass</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <CalendarCheck size={36} className="pw-empty-icon" />
                  <h4>No reservations found</h4>
                  <p>No customer bookings matching the selected search query or status filter.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pw-users-table-footer">
          <span>Showing {filteredBookings.length} of {bookings.length} reservations</span>
        </div>
      </div>
    </div>
  );
}

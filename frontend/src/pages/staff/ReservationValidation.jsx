import { useState, useEffect } from "react";
import { Search, CheckCircle2, CalendarCheck, Clock, Car, Download, Printer, RefreshCw } from "lucide-react";

export default function ReservationValidation({ setStatusActionMessage }) {
  const [reservations, setReservations] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedPass, setValidatedPass] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReservations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/bookings");
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.bookings) {
        setReservations(data.bookings);
        const pendingOrConfirmed = data.bookings.find(
          (b) => (b.status || "").toLowerCase() === "confirmed" || (b.status || "").toLowerCase() === "pending"
        );
        if (pendingOrConfirmed && !selectedBooking) {
          setSelectedBooking(pendingOrConfirmed);
        }
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
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

  const handleSearchAndSelect = (e) => {
    e?.preventDefault();
    if (!searchCode) return;

    const q = searchCode.trim().toLowerCase();
    const found = reservations.find(
      (b) =>
        (b.booking_id || "").toLowerCase() === q ||
        (b.validation_code || "").toLowerCase() === q ||
        (b.vehicle_number || "").toLowerCase() === q ||
        (b.customer_phone || "").toLowerCase() === q
    );

    if (found) {
      setSelectedBooking(found);
      setValidatedPass(null);
    } else {
      if (setStatusActionMessage) {
        setStatusActionMessage(`No reservation matching "${searchCode}" found`);
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const handleValidateCheckIn = async () => {
    if (!selectedBooking) return;
    setIsValidating(true);

    try {
      const res = await fetch("http://localhost:5000/api/staff/validate-reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: selectedBooking.booking_id,
          validated_by: "Staff Operator - North Gate"
        })
      });
      const data = await res.json();
      setIsValidating(false);

      if (res.ok && data.success) {
        setValidatedPass(data.validatedBooking);
        setSelectedBooking(data.validatedBooking);
        if (setStatusActionMessage) {
          setStatusActionMessage(data.message || `Reservation ${selectedBooking.booking_id} validated successfully!`);
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
        fetchReservations();
      } else {
        if (setStatusActionMessage) {
          setStatusActionMessage(data.error || "Validation failed");
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
      }
    } catch {
      setIsValidating(false);
      if (setStatusActionMessage) {
        setStatusActionMessage("Connection error during reservation validation");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const handleDownloadArrivalPass = (booking) => {
    const target = booking || validatedPass || selectedBooking;
    if (!target) return;

    const formattedAmount = parseFloat(target.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParkSafe Arrival Pass - ${target.booking_id}</title>
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
      width: 390px;
      background: #ffffff;
      border: 2px solid #0f3b43;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #0f3b43;
    }
    .status-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #ecfdf5;
      color: #047857;
      font-size: 11px;
      font-weight: 800;
    }
    .ticket-id {
      font-size: 13px;
      font-weight: 700;
      color: #0d9488;
      margin-top: 4px;
    }
    .terminal {
      font-size: 11px;
      color: #64748b;
      margin-top: 3px;
    }
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-weight: 800;
    }
    .slot-pill {
      background: #0d9488;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
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
    }
    .val {
      font-weight: 700;
      color: #1e293b;
    }
    .total-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 10px 14px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .total-label {
      font-weight: 700;
      color: #166534;
      font-size: 12px;
    }
    .total-val {
      font-weight: 800;
      color: #15803d;
      font-size: 16px;
    }
    .barcode-box {
      text-align: center;
      padding: 8px;
      background: #f1f5f9;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .barcode {
      font-family: "Courier New", monospace;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .barcode-sub {
      font-size: 9px;
      color: #64748b;
      margin-top: 3px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">GATE ARRIVAL PASS • VALIDATED</span>
      <div class="ticket-id">${target.booking_id}</div>
      <div class="terminal">Operator: Staff Duty • Gate: North Inbound</div>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span class="slot-pill">Bay ${target.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer Name</span>
        <span class="val">${target.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact</span>
        <span class="val">${target.customer_phone || "+91 98765 43210"}</span>
      </div>
      <div class="item">
        <span class="label">Check-in Time</span>
        <span class="val">${formatDate(target.validated_at || new Date())}</span>
      </div>
      <div class="item">
        <span class="label">Reserved Window</span>
        <span class="val">${formatTimeOnly(target.start_time)} - ${formatTimeOnly(target.end_time)}</span>
      </div>
      <div class="item">
        <span class="label">Zone</span>
        <span class="val">${target.zone || "Zone A"}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${target.duration_hours} Hours</span>
      </div>
    </div>
    <div class="total-banner">
      <span class="total-label">Prepaid Tariff</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${target.booking_id} • ${target.vehicle_number}</div>
    </div>
    <div class="footer">
      Please display on dashboard or keep with driver until departure.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Arrival_Pass_${cleanPlate}_${target.booking_id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const pendingList = reservations.filter(
    (b) => (b.status || "").toLowerCase() === "confirmed" || (b.status || "").toLowerCase() === "pending"
  );

  return (
    <div className="pw-staff-validation-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Bookings Queue</span>
          <span className="pw-metric-value">{pendingList.length}</span>
          <span className="pw-metric-trend positive">
            <CalendarCheck size={12} />
            <span>Awaiting arrival</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Today's Total Reserved</span>
          <span className="pw-metric-value">{reservations.length}</span>
          <span className="pw-metric-trend positive">
            <Clock size={12} />
            <span>Scheduled arrivals</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Validated & Inside</span>
          <span className="pw-metric-value" style={{ color: "#047857" }}>
            {reservations.filter((b) => (b.status || "").toLowerCase() === "checked in").length}
          </span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={12} />
            <span>Parked in bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Validation System</span>
          <span className="pw-metric-value" style={{ fontSize: "1.1rem", color: "#0d9488", marginTop: "4px" }}>
            Operational
          </span>
          <span className="pw-metric-trend positive">
            <span>Fast Gate Check-in</span>
          </span>
        </div>
      </div>

      <div className="pw-validation-two-col-grid" style={{ marginTop: "24px" }}>
        <div className="pw-validation-search-col">
          <div className="pw-payment-box-card">
            <h3 className="pw-box-card-title">1. Search & Scan Reservation</h3>
            <p className="pw-box-card-sub">Enter customer booking ID, validation code, or vehicle license plate</p>

            <form onSubmit={handleSearchAndSelect} style={{ marginTop: "16px" }}>
              <div className="pw-form-field">
                <label className="pw-detail-label">Booking ID / Validation Code / Plate Number</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="e.g. BK-12345 or VAL-1042 or KA01 AB 1234"
                    className="pw-form-input"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                  />
                  <button type="submit" className="pw-btn-primary" style={{ padding: "0 16px", whiteSpace: "nowrap" }}>
                    <Search size={14} />
                    <span>Verify</span>
                  </button>
                </div>
              </div>
            </form>

            <div style={{ marginTop: "20px" }}>
              <div className="pw-section-header-row">
                <span className="pw-detail-label" style={{ fontWeight: 700, color: "#1e293b" }}>
                  Upcoming Reservations Today ({pendingList.length})
                </span>
                <button
                  type="button"
                  className="pw-btn-action-refresh"
                  onClick={fetchReservations}
                  style={{ padding: "4px 8px", fontSize: "0.74rem" }}
                >
                  <RefreshCw size={12} className={isLoading ? "pw-spin" : ""} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="pw-validation-queue-list">
                {pendingList.length > 0 ? (
                  pendingList.map((b) => {
                    const isSelected = selectedBooking && selectedBooking.id === b.id;
                    return (
                      <div
                        key={b.id || b.booking_id}
                        className={`pw-validation-queue-item ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setSelectedBooking(b);
                          setValidatedPass(null);
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className="pw-veh-plate-badge" style={{ fontSize: "0.82rem", padding: "3px 8px" }}>
                            {b.vehicle_number}
                          </span>
                          <span className="pw-badge-slot-cell">Bay {b.slot_number}</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                            {b.customer_name}
                          </span>
                          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                            {b.booking_id} • Code: {b.validation_code}
                          </span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ fontSize: "0.72rem", color: "#0f766e" }}>
                            ⏰ {formatTimeOnly(b.start_time)} - {formatTimeOnly(b.end_time)}
                          </span>
                          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#047857" }}>
                            ₹{parseFloat(b.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="pw-empty-selection-placeholder" style={{ padding: "24px 16px" }}>
                    <CalendarCheck size={28} className="pw-empty-icon" />
                    <p>No pending arrivals in queue. Search by code or plate above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pw-validation-details-col">
          <div className="pw-payment-box-card">
            <h3 className="pw-box-card-title">2. Reservation Verification & Check-In</h3>
            <p className="pw-box-card-sub">Confirm customer identity, vehicle bay, and validate admission</p>

            {selectedBooking ? (
              <div style={{ marginTop: "16px" }}>
                <div className="pw-detail-user-profile-header">
                  <span className="pw-veh-plate-badge" style={{ fontSize: "1rem", padding: "6px 14px" }}>
                    <Car size={16} />
                    <span>{selectedBooking.vehicle_number}</span>
                  </span>
                  <div className="pw-detail-user-meta">
                    <h4 className="pw-detail-user-name">
                      {selectedBooking.model || "Standard"} ({selectedBooking.vehicle_type || "Car"})
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                      Assigned Bay: <strong>{selectedBooking.slot_number}</strong> ({selectedBooking.zone || "Zone A"})
                    </span>
                  </div>
                </div>

                <div className="pw-detail-fields-grid" style={{ marginTop: "16px" }}>
                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Booking Reference</span>
                    <div className="pw-detail-val" style={{ color: "#0d9488", fontWeight: 800 }}>
                      {selectedBooking.booking_id}
                    </div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Validation Code</span>
                    <div className="pw-detail-val" style={{ letterSpacing: "1px", fontWeight: 800 }}>
                      {selectedBooking.validation_code}
                    </div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Customer Name</span>
                    <div className="pw-detail-val">{selectedBooking.customer_name}</div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Contact Phone</span>
                    <div className="pw-detail-val">{selectedBooking.customer_phone || "+91 98765 43210"}</div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Reserved Window</span>
                    <div className="pw-detail-val" style={{ fontSize: "0.82rem" }}>
                      {formatTimeOnly(selectedBooking.start_time)} - {formatTimeOnly(selectedBooking.end_time)}
                    </div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Duration</span>
                    <div className="pw-detail-val">{selectedBooking.duration_hours} Hours</div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Prepaid Tariff</span>
                    <div className="pw-detail-val" style={{ color: "#047857" }}>
                      ₹{parseFloat(selectedBooking.total_amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Current Status</span>
                    <div className="pw-detail-val" style={{ fontWeight: 700 }}>
                      {selectedBooking.status}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {(selectedBooking.status || "").toLowerCase() !== "checked in" ? (
                    <button
                      type="button"
                      className="pw-btn-primary"
                      onClick={handleValidateCheckIn}
                      disabled={isValidating}
                      style={{ padding: "12px", width: "100%", justifyContent: "center", fontSize: "0.95rem" }}
                    >
                      <CheckCircle2 size={16} />
                      <span>{isValidating ? "Validating Check-In..." : "Validate & Check-In Customer"}</span>
                    </button>
                  ) : (
                    <div className="pw-user-action-alert" style={{ margin: 0, justifyContent: "center" }}>
                      <CheckCircle2 size={16} />
                      <span>Customer successfully checked in to Bay {selectedBooking.slot_number}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="pw-btn-download-slip"
                      onClick={() => handleDownloadArrivalPass(selectedBooking)}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      <Download size={15} />
                      <span>Download Arrival Slip</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-print"
                      onClick={() => window.print()}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      <Printer size={15} />
                      <span>Print Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pw-empty-selection-placeholder">
                <CalendarCheck size={36} className="pw-empty-icon" />
                <p>Select an upcoming booking from the list or search a code above to view validation details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import { Car, Bike, Search, RefreshCw, Clock, Layers, CalendarCheck, Eye, Printer, Download, X, Zap } from "lucide-react";

export default function ParkingRecords() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedRecordModal, setSelectedRecordModal] = useState(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/parking-records`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.records) {
        setRecords(data.records);
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Ongoing";
    try {
      const d = new Date(isoStr);
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

  const validRecords = records.filter(
    (r) =>
      r.vehicle_number &&
      r.vehicle_number.trim() !== "" &&
      r.vehicle_number !== "—" &&
      (r.slot_number || r.slot) &&
      r.slot_number !== "—" &&
      r.slot !== "—"
  );

  const filteredRecords = validRecords.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (r.vehicle_number && r.vehicle_number.toLowerCase().includes(q)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(q)) ||
      (r.customer_email && r.customer_email.toLowerCase().includes(q)) ||
      (r.customer_phone && r.customer_phone.includes(q)) ||
      (r.slot_number && r.slot_number.toLowerCase().includes(q)) ||
      (r.transaction_id && r.transaction_id.toLowerCase().includes(q));

    const recStatus = (r.status || "").toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Parked" && recStatus === "parked") ||
      (statusFilter === "Completed" && recStatus === "completed");

    const recType = (r.vehicle_type || "Car").toLowerCase();
    const matchesType =
      typeFilter === "ALL" || recType === typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });

  const activeCount = validRecords.filter((r) => (r.status || "").toLowerCase() === "parked").length;
  const completedCount = validRecords.filter((r) => (r.status || "").toLowerCase() === "completed").length;
  const totalRevenueNumeric = validRecords.reduce((acc, r) => {
    const num = parseFloat((r.fee || "0").replace(/[^0-9.]/g, "")) || 0;
    return acc + num;
  }, 0);

  const handleDownloadSlip = (rec) => {
    const target = rec || selectedRecordModal;
    if (!target) return;

    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ParkSafe Parking Record - ${target.vehicle_number}</title>
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
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
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
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #f0fdfa;
      color: #0f766e;
      font-size: 11px;
      font-weight: 700;
    }
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 12px 0;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .item {
      display: flex;
      flex-direction: column;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">${target.status === "Parked" ? "ACTIVE PARKING" : "COMPLETED PARKING"}</span>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span>Bay ${target.slot_number}</span>
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
        <span class="label">Entry Time</span>
        <span class="val">${formatDate(target.entry_time)}</span>
      </div>
      <div class="item">
        <span class="label">Exit Time</span>
        <span class="val">${formatDate(target.exit_time)}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${target.duration}</span>
      </div>
      <div class="item">
        <span class="label">Total Fee</span>
        <span class="val">${target.fee}</span>
      </div>
      <div class="item">
        <span class="label">Payment Status</span>
        <span class="val">${target.payment_status}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Type</span>
        <span class="val">${target.model} (${target.vehicle_type})</span>
      </div>
    </div>
    <div class="footer">
      Official Parking Audit Record • ParkSafe Facility Systems
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Record_${cleanPlate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="pw-parking-records-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Parking Records</span>
          <span className="pw-metric-value">{records.length}</span>
          <span className="pw-metric-trend positive">
            <span>All historical & active sessions</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active / Parked Now</span>
          <span className="pw-metric-value">{activeCount}</span>
          <span className="pw-metric-trend positive">
            <span>Currently inside bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Completed Sessions</span>
          <span className="pw-metric-value">{completedCount}</span>
          <span className="pw-metric-trend positive">
            <span>Checked out & settled</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Cumulative Tariffs</span>
          <span className="pw-metric-value">
            ₹{totalRevenueNumeric.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
          <span className="pw-metric-trend positive">
            <span>Total recorded value</span>
          </span>
        </div>
      </div>

      <div className="pw-users-panel-card" style={{ marginTop: "18px" }}>
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search vehicle plate, customer, bay, or txn ID..."
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
                <option value="ALL">All Statuses</option>
                <option value="Parked">Active / Parked</option>
                <option value="Completed">Completed / Exit</option>
              </select>
            </div>

            <div className="pw-filter-dropdown-wrap">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="pw-custom-select"
              >
                <option value="ALL">All Vehicle Types</option>
                <option value="Car">Cars</option>
                <option value="SUV">SUVs</option>
                <option value="Bike">Bikes</option>
                <option value="EV">EVs</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchRecords}
              title="Refresh records"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-parking-records-grid">
            <span>Vehicle & Model</span>
            <span>Customer Info</span>
            <span>Slot Bay</span>
            <span>Entry Time</span>
            <span>Exit Time</span>
            <span>Duration</span>
            <span>Fee / Tariff</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const isParked = (r.status || "").toLowerCase() === "parked";
                const typeKey = (r.vehicle_type || "Car").toLowerCase();
                const isBike = typeKey === "bike";
                const isEv = typeKey === "ev";

                return (
                  <div key={r.id} className="pw-user-card-box pw-mgmt-grid-row pw-parking-records-grid">
                    <div className="pw-veh-plate-col">
                      <div>
                        <span className="pw-veh-plate-badge">
                          {isBike ? <Bike size={13} /> : isEv ? <Zap size={13} /> : <Car size={13} />}
                          <span>{r.vehicle_number}</span>
                        </span>
                      </div>
                      <div className="pw-veh-model-sub">
                        {r.model} • {r.vehicle_type}
                      </div>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold">{r.customer_name}</div>
                      <div className="pw-contact-cell" style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>
                        <span>{r.customer_phone || "+91 98765 43210"}</span>
                      </div>
                    </div>

                    <div>
                      <span className="pw-badge-slot-cell">
                        <Layers size={11} />
                        <span>Bay {r.slot_number}</span>
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-value" style={{ fontSize: "0.78rem" }}>
                        {formatDate(r.entry_time)}
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-value" style={{ fontSize: "0.78rem" }}>
                        {formatDate(r.exit_time)}
                      </span>
                    </div>

                    <div>
                      <span className="pw-duration-chip">
                        <Clock size={11} />
                        <span>{r.duration}</span>
                      </span>
                    </div>

                    <div>
                      <span className="pw-fee-amount" style={{ color: "#0f766e" }}>
                        {r.fee}
                      </span>
                    </div>

                    <div>
                      <span
                        className={`pw-veh-status-pill ${isParked ? "parked" : "checkedout"}`}
                        style={{ fontSize: "0.72rem" }}
                      >
                        <span className="pw-status-dot"></span>
                        {isParked ? "Parked" : "Completed"}
                      </span>
                    </div>

                    <div className="pw-user-card-actions-col" style={{ justifyContent: "flex-end", gap: "6px" }}>
                      <button
                        type="button"
                        className="pw-btn-action-view"
                        onClick={() => setSelectedRecordModal(r)}
                        title="View Full Record Details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        className="pw-btn-action-download"
                        onClick={() => handleDownloadSlip(r)}
                        title="Download Parking Slip"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <CalendarCheck size={36} className="pw-empty-icon" />
                  <h4>No parking records match your filter criteria</h4>
                  <p>Try modifying your search keywords or status filter.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pw-users-table-footer">
          <span>Showing {filteredRecords.length} of {validRecords.length} total parking records</span>
        </div>
      </div>

      {selectedRecordModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedRecordModal(null)}>
          <div className="pw-user-detail-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Parking Record: {selectedRecordModal.vehicle_number}</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setSelectedRecordModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-detail-user-profile-header">
                <span className="pw-veh-plate-badge" style={{ fontSize: "1rem", padding: "6px 14px" }}>
                  <Car size={16} />
                  <span>{selectedRecordModal.vehicle_number}</span>
                </span>
                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">{selectedRecordModal.model} ({selectedRecordModal.vehicle_type})</h4>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                    Bay: <strong>{selectedRecordModal.slot_number}</strong> • {selectedRecordModal.zone}
                  </span>
                </div>
              </div>

              <div className="pw-detail-fields-grid" style={{ marginTop: "16px" }}>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Customer Name</span>
                  <div className="pw-detail-val">{selectedRecordModal.customer_name}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Customer Contact</span>
                  <div className="pw-detail-val">{selectedRecordModal.customer_phone || "+91 98765 43210"}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Customer Email</span>
                  <div className="pw-detail-val">{selectedRecordModal.customer_email || "customer@shnoor.com"}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Assigned Bay</span>
                  <div className="pw-detail-val">Bay {selectedRecordModal.slot_number} ({selectedRecordModal.zone})</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Entry Timestamp</span>
                  <div className="pw-detail-val">{formatDate(selectedRecordModal.entry_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Exit Timestamp</span>
                  <div className="pw-detail-val">{formatDate(selectedRecordModal.exit_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Total Duration</span>
                  <div className="pw-detail-val">{selectedRecordModal.duration}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Fee / Tariff</span>
                  <div className="pw-detail-val" style={{ color: "#0f766e", fontWeight: 800 }}>
                    {selectedRecordModal.fee}
                  </div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Payment Status</span>
                  <div className="pw-detail-val" style={{ color: selectedRecordModal.payment_status === "Paid" ? "#16a34a" : "#d97706" }}>
                    {selectedRecordModal.payment_status}
                  </div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Session Status</span>
                  <div className="pw-detail-val">{selectedRecordModal.status}</div>
                </div>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-download-slip"
                onClick={() => handleDownloadSlip(selectedRecordModal)}
                style={{ padding: "8px 16px" }}
              >
                <Download size={14} />
                <span>Download Slip</span>
              </button>

              <button
                type="button"
                className="pw-btn-action-view"
                onClick={() => window.print()}
                style={{ padding: "8px 16px" }}
              >
                <Printer size={14} />
                <span>Print Record</span>
              </button>

              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setSelectedRecordModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

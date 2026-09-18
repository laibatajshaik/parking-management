import { useState, useEffect } from "react";
import { Car, Bike, Search, RefreshCw, Clock, Layers, History, Download, Printer, X, Zap, Receipt } from "lucide-react";

export default function ParkingHistory({ loggedInUser }) {
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const user = loggedInUser || { name: "Laiba", email: "customer@shnoor.com" };
      const queryParam = user.email
        ? `email=${encodeURIComponent(user.email)}`
        : `name=${encodeURIComponent(user.name || "Laiba")}`;
      const res = await fetch(`http://localhost:5000/api/customer/parking-history?${queryParam}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.history) {
        setHistoryList(data.history);
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [loggedInUser]);

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

  const validHistory = historyList.filter(
    (item) =>
      item.vehicle_number &&
      item.vehicle_number.trim() !== "" &&
      item.vehicle_number !== "—" &&
      item.slot_number &&
      item.slot_number.trim() !== "" &&
      item.slot_number !== "—"
  );

  const filteredHistory = validHistory.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (item.vehicle_number && item.vehicle_number.toLowerCase().includes(q)) ||
      (item.slot_number && item.slot_number.toLowerCase().includes(q)) ||
      (item.transaction_id && item.transaction_id.toLowerCase().includes(q));

    const itemStatus = (item.status || "").toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "Completed" && itemStatus === "completed") ||
      (statusFilter === "Parked" && itemStatus === "parked");

    return matchesSearch && matchesStatus;
  });

  const handleDownloadSlip = (item) => {
    const target = item || selectedSessionModal;
    if (!target) return;

    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ParkSafe Parking History - ${target.vehicle_number}</title>
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
      width: 380px;
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
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
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
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <div style="font-size: 11px; color: #0f766e; font-weight: bold; margin-top: 4px;">CUSTOMER SESSION PASS</div>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span>Bay ${target.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer</span>
        <span class="val">${target.owner_name}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${target.duration}</span>
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
        <span class="label">Amount Paid</span>
        <span class="val">${target.fee}</span>
      </div>
      <div class="item">
        <span class="label">Status</span>
        <span class="val">${target.status}</span>
      </div>
    </div>
    <div class="footer">
      Official Customer Trip Record • ParkSafe
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Trip_${cleanPlate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="pw-customer-history-module">
      <div className="pw-users-panel-card">
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search by license plate or bay..."
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
                <option value="ALL">All Sessions</option>
                <option value="Completed">Completed Trips</option>
                <option value="Parked">Active Parkings</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchHistory}
              title="Refresh parking history"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-customer-history-grid">
            <span>Vehicle Plate</span>
            <span>Assigned Bay</span>
            <span>Entry Timestamp</span>
            <span>Exit Timestamp</span>
            <span>Duration</span>
            <span>Amount Paid</span>
            <span>Trip Status</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((item) => {
                const isParked = (item.status || "").toLowerCase() === "parked";
                const typeKey = (item.vehicle_type || "Car").toLowerCase();

                return (
                  <div key={item.id} className="pw-user-card-box pw-mgmt-grid-row pw-customer-history-grid">
                    <div className="pw-veh-plate-col">
                      <div>
                        <span className="pw-veh-plate-badge">
                          {typeKey === "bike" ? <Bike size={13} /> : typeKey === "ev" ? <Zap size={13} /> : <Car size={13} />}
                          <span>{item.vehicle_number}</span>
                        </span>
                      </div>
                      <div className="pw-veh-model-sub">
                        {item.model} • {item.vehicle_type}
                      </div>
                    </div>

                    <div>
                      <span className="pw-badge-slot-cell">
                        <Layers size={11} />
                        <span>Bay {item.slot_number}</span>
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-value" style={{ fontSize: "0.78rem" }}>
                        {formatDate(item.entry_time)}
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-value" style={{ fontSize: "0.78rem" }}>
                        {formatDate(item.exit_time)}
                      </span>
                    </div>

                    <div>
                      <span className="pw-duration-chip">
                        <Clock size={11} />
                        <span>{item.duration}</span>
                      </span>
                    </div>

                    <div>
                      <span className="pw-fee-amount" style={{ color: "#0f766e" }}>
                        {item.fee}
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
                        onClick={() => setSelectedSessionModal(item)}
                        title="View Trip Summary"
                      >
                        <Receipt size={13} />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        className="pw-btn-action-download"
                        onClick={() => handleDownloadSlip(item)}
                        title="Download Trip Slip"
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
                  <History size={36} className="pw-empty-icon" />
                  <h4>No parking history found</h4>
                  <p>When you check in and park at our facilities, your session records will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pw-users-table-footer">
          <span>Showing {filteredHistory.length} of {validHistory.length} past parking trips</span>
        </div>
      </div>

      {selectedSessionModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedSessionModal(null)}>
          <div className="pw-user-detail-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Trip Summary: {selectedSessionModal.vehicle_number}</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setSelectedSessionModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-detail-user-profile-header">
                <span className="pw-veh-plate-badge" style={{ fontSize: "1rem", padding: "6px 14px" }}>
                  <Car size={16} />
                  <span>{selectedSessionModal.vehicle_number}</span>
                </span>
                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">{selectedSessionModal.model} ({selectedSessionModal.vehicle_type})</h4>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                    Bay <strong>{selectedSessionModal.slot_number}</strong> • {selectedSessionModal.zone}
                  </span>
                </div>
              </div>

              <div className="pw-detail-fields-grid" style={{ marginTop: "16px" }}>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Check-in Time</span>
                  <div className="pw-detail-val">{formatDate(selectedSessionModal.entry_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Check-out Time</span>
                  <div className="pw-detail-val">{formatDate(selectedSessionModal.exit_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Total Duration</span>
                  <div className="pw-detail-val">{selectedSessionModal.duration}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Amount Paid</span>
                  <div className="pw-detail-val" style={{ color: "#0f766e", fontWeight: 800 }}>
                    {selectedSessionModal.fee}
                  </div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Trip Status</span>
                  <div className="pw-detail-val">{selectedSessionModal.status}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Assigned Location</span>
                  <div className="pw-detail-val">Bay {selectedSessionModal.slot_number}</div>
                </div>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-download-slip"
                onClick={() => handleDownloadSlip(selectedSessionModal)}
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
                <span>Print</span>
              </button>

              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setSelectedSessionModal(null)}
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

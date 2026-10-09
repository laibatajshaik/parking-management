import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import { Car, Bike, Search, RefreshCw, Clock, Layers, Phone, CreditCard, Zap, Eye, X, Download } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function ActiveParking({ onSelectVehicleForPayment, onCheckout }) {
  const [sessions, setSessions] = useState([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        type: typeFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/parking/active-sessions?${params}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.sessions) {
        setSessions(data.sessions);
        setTotalSessions(data.total !== undefined ? data.total : data.sessions.length);
      }
    } catch {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, typeFilter]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 20000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
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

  const handleExportCsv = () => {
    const headers = ["Vehicle Number", "Model", "Type", "Slot Bay", "Owner Name", "Phone", "Entry Time", "Duration", "Fee", "Hourly Rate", "Booked Duration", "Overstay Duration", "Overstay Fee"];
    const rows = filteredSessions.map((s) => [
      s.vehicle_number,
      s.model || "Standard",
      s.vehicle_type || "Car",
      s.current_slot,
      s.owner_name,
      s.owner_phone || "",
      s.entry_time,
      s.duration,
      s.calculated_fee,
      s.hourly_rate,
      s.booked_duration_hours ? `${s.booked_duration_hours}h` : "N/A",
      s.overstay_duration || "0m",
      s.overstay_fee ? `₹${s.overstay_fee}` : "₹0.00"
    ]);
    exportToCsv("active_parking_sessions.csv", headers, rows);
  };

  const filteredSessions = sessions;

  return (
    <div className="pw-staff-active-parking-module">
      <div className="pw-users-panel-card">
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search active vehicle plate, owner, bay..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-users-filter-group">
            <div className="pw-filter-dropdown-wrap">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
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
              onClick={fetchSessions}
              title="Refresh active parking list"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="pw-export-btn"
              onClick={handleExportCsv}
              title="Export Active Sessions CSV"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-staff-active-grid">
            <span>Vehicle Plate & Model</span>
            <span>Type & Slot</span>
            <span>Customer & Contact</span>
            <span>Entry Time</span>
            <span>Duration</span>
            <span>Current Fee</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((s) => {
                const typeKey = (s.vehicle_type || "Car").toLowerCase();
                const isBike = typeKey === "bike";
                const isEV = typeKey === "ev";

                return (
                  <div key={s.id} className="pw-user-card-box pw-mgmt-grid-row pw-staff-active-grid">
                    <div className="pw-veh-plate-col">
                      <div>
                        <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                          {isBike ? <Bike size={13} /> : isEV ? <Zap size={13} /> : <Car size={13} />}
                          <span>{s.vehicle_number}</span>
                        </span>
                      </div>
                      <div className="pw-veh-model-sub">
                        {s.model || "Standard"}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span className={`pw-veh-type-badge ${typeKey}`}>
                          {s.vehicle_type || "Car"}
                        </span>
                        <span className="pw-badge-slot-cell">
                          <Layers size={11} />
                          <span>Bay {s.current_slot}</span>
                        </span>
                      </div>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                        {s.owner_name}
                      </div>
                      <div className="pw-contact-cell">
                        <Phone size={11} className="pw-cell-icon" />
                        <span>{s.owner_phone || "—"}</span>
                      </div>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-label">{s.scheduled_start_time ? "Booked Window" : "Checked In"}</span>
                      <span className="pw-user-col-value">{formatDate(s.scheduled_start_time || s.entry_time)}</span>
                      {s.scheduled_end_time && (
                        <span style={{ fontSize: "0.68rem", color: s.is_overstay ? "#ef4444" : "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>
                          Exit: {formatDate(s.scheduled_end_time)}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="pw-duration-chip">
                        <Clock size={12} />
                        <span>{s.duration}</span>
                      </div>
                      {s.booked_duration_hours && (
                        <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #64748b)", marginTop: "2px" }}>
                          {s.booked_duration_hours}h booked
                        </div>
                      )}
                      {s.is_overstay && (
                        <div style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700, background: "rgba(239, 68, 68, 0.12)", padding: "1px 6px", borderRadius: "4px", marginTop: "3px", display: "inline-block" }}>
                          Overstay: {s.overstay_duration}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="pw-fee-cell">
                        {s.is_reservation ? (
                          s.is_overstay ? (
                            <>
                              <span className="pw-fee-amount" style={{ color: "#ef4444" }}>+₹{Number(s.overstay_fee || 0).toFixed(2)}</span>
                              <span className="pw-fee-rate">Overstay charge</span>
                            </>
                          ) : (
                            <>
                              <span className="pw-fee-amount" style={{ color: "#16a34a" }}>₹0.00</span>
                              <span className="pw-fee-rate">Pre-paid (On-time)</span>
                            </>
                          )
                        ) : (
                          <>
                            <span className="pw-fee-amount">{s.calculated_fee}</span>
                            <span className="pw-fee-rate">₹{s.hourly_rate}/hr</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pw-user-card-actions-col">
                      <button
                        type="button"
                        className="pw-btn-action-history"
                        onClick={() => setSelectedSessionModal(s)}
                        title="View Full Session Details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        className="pw-btn-action-checkout"
                        onClick={() => {
                          if (onSelectVehicleForPayment) {
                            onSelectVehicleForPayment(s);
                          } else if (onCheckout) {
                            onCheckout(s);
                          }
                        }}
                        title="Proceed to Payment & Checkout"
                      >
                        <CreditCard size={13} />
                        <span>Checkout</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <Car size={32} className="pw-empty-icon" />
                  <h4>No active vehicles found</h4>
                  <p>All parking bays in this filter category are currently vacant.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Pagination
          currentPage={page}
          totalItems={totalSessions}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemLabel="active vehicles"
        />
      </div>

      {selectedSessionModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedSessionModal(null)}>
          <div className="pw-user-detail-modal" style={{ maxWidth: "520px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Active Session: {selectedSessionModal.vehicle_number}</h3>
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
                <span className="pw-veh-plate-badge" style={{ fontSize: "0.95rem", padding: "6px 14px" }}>
                  <Car size={16} />
                  <span>{selectedSessionModal.vehicle_number}</span>
                </span>
                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">{selectedSessionModal.model} ({selectedSessionModal.vehicle_type})</h4>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                    Bay <strong>{selectedSessionModal.current_slot}</strong> • {selectedSessionModal.zone}
                  </span>
                </div>
              </div>

              <div className="pw-detail-fields-grid" style={{ marginTop: "16px" }}>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Customer Name</span>
                  <div className="pw-detail-val">{selectedSessionModal.owner_name}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Customer Phone</span>
                  <div className="pw-detail-val">{selectedSessionModal.owner_phone || "—"}</div>
                </div>
                {selectedSessionModal.scheduled_start_time && (
                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Scheduled Start</span>
                    <div className="pw-detail-val">{formatDate(selectedSessionModal.scheduled_start_time)}</div>
                  </div>
                )}
                {selectedSessionModal.scheduled_end_time && (
                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Scheduled Exit</span>
                    <div className="pw-detail-val" style={selectedSessionModal.is_overstay ? { color: "#ef4444", fontWeight: 700 } : {}}>
                      {formatDate(selectedSessionModal.scheduled_end_time)}
                    </div>
                  </div>
                )}
                {selectedSessionModal.booked_duration_hours && (
                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Booked Duration</span>
                    <div className="pw-detail-val">{selectedSessionModal.booked_duration_hours} hr(s)</div>
                  </div>
                )}
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Actual Entry Time</span>
                  <div className="pw-detail-val">{formatDate(selectedSessionModal.entry_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Elapsed Parking Time</span>
                  <div className="pw-detail-val">{selectedSessionModal.duration}</div>
                </div>
                {selectedSessionModal.is_overstay ? (
                  <div className="pw-detail-field-card" style={{ border: "1px solid rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.05)" }}>
                    <span className="pw-detail-label" style={{ color: "#ef4444" }}>Overstay Duration & Fee</span>
                    <div className="pw-detail-val" style={{ color: "#ef4444", fontWeight: 800 }}>
                      {selectedSessionModal.overstay_duration} (+₹{Number(selectedSessionModal.overstay_fee || 0).toFixed(2)})
                    </div>
                  </div>
                ) : (
                  <div className="pw-detail-field-card">
                    <span className="pw-detail-label">Timing Status</span>
                    <div className="pw-detail-val" style={{ color: "#16a34a", fontWeight: 700 }}>
                      {selectedSessionModal.scheduled_end_time ? "Within Scheduled Window" : "Standard Parking"}
                    </div>
                  </div>
                )}
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Amount Due At Exit</span>
                  <div className="pw-detail-val" style={{ color: selectedSessionModal.is_overstay ? "#ef4444" : "#0d9488", fontWeight: 800 }}>
                    {selectedSessionModal.is_reservation
                      ? `₹${Number(selectedSessionModal.payable_at_exit !== undefined ? selectedSessionModal.payable_at_exit : (selectedSessionModal.overstay_fee || 0)).toFixed(2)}`
                      : selectedSessionModal.calculated_fee}
                  </div>
                </div>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setSelectedSessionModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="pw-btn-confirm-delete"
                style={{ background: "#0d9488" }}
                onClick={() => {
                  const s = selectedSessionModal;
                  setSelectedSessionModal(null);
                  if (onSelectVehicleForPayment) {
                    onSelectVehicleForPayment(s);
                  }
                }}
              >
                <CreditCard size={15} />
                <span>Proceed to Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

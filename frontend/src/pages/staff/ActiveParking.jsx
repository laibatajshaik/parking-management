import { useState, useEffect } from "react";
import { Car, Bike, Search, RefreshCw, Clock, Layers, Phone, CreditCard, Zap, Eye, X } from "lucide-react";

export default function ActiveParking({ onSelectVehicleForPayment }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedSessionModal, setSelectedSessionModal] = useState(null);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/parking/active-sessions");
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 20000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (s.vehicle_number || "").toLowerCase().includes(q) ||
      (s.owner_name || "").toLowerCase().includes(q) ||
      (s.current_slot || "").toLowerCase().includes(q) ||
      (s.model || "").toLowerCase().includes(q);

    const matchesType =
      typeFilter === "ALL" ||
      (s.vehicle_type || "").toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-users-filter-group">
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
              onClick={fetchSessions}
              title="Refresh active parking list"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
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
                        <span>{s.owner_phone || "+91 98765 43210"}</span>
                      </div>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-label">Checked In</span>
                      <span className="pw-user-col-value">{formatDate(s.entry_time)}</span>
                    </div>

                    <div>
                      <div className="pw-duration-chip">
                        <Clock size={12} />
                        <span>{s.duration}</span>
                      </div>
                    </div>

                    <div>
                      <div className="pw-fee-cell">
                        <span className="pw-fee-amount">{s.calculated_fee}</span>
                        <span className="pw-fee-rate">₹{s.hourly_rate}/hr</span>
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

        <div className="pw-users-table-footer">
          <span>Showing {filteredSessions.length} of {sessions.length} parked vehicles</span>
        </div>
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
                  <div className="pw-detail-val">{selectedSessionModal.owner_phone || "+91 98765 43210"}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Check-in Time</span>
                  <div className="pw-detail-val">{formatDate(selectedSessionModal.entry_time)}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Current Duration</span>
                  <div className="pw-detail-val">{selectedSessionModal.duration}</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Hourly Tariff</span>
                  <div className="pw-detail-val">₹{selectedSessionModal.hourly_rate}.00 / hr</div>
                </div>
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Accrued Amount</span>
                  <div className="pw-detail-val" style={{ color: "#0d9488", fontWeight: 700 }}>
                    {selectedSessionModal.calculated_fee}
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
                style={{ background: "#0f3b43" }}
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

import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import { Car, Bike, Search, RefreshCw, Clock, Layers, Phone, Mail, Zap } from "lucide-react";

export default function ActiveParkingSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/parking/active-sessions`);
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
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const validSessions = sessions.filter(
    (s) =>
      s.vehicle_number &&
      s.vehicle_number.trim() !== "" &&
      s.vehicle_number !== "—" &&
      (s.current_slot || s.slot_number) &&
      s.current_slot !== "—" &&
      s.slot_number !== "—"
  );

  const filteredSessions = validSessions.filter((s) => {
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

    const matchesZone =
      zoneFilter === "ALL" ||
      (s.zone || "").toLowerCase() === zoneFilter.toLowerCase();

    return matchesSearch && matchesType && matchesZone;
  });

  const totalParked = validSessions.length;
  const carsCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "car" || (s.vehicle_type || "").toLowerCase() === "suv").length;
  const bikesCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "bike").length;
  const evCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "ev").length;
  const totalAccruedFee = validSessions.reduce((sum, s) => sum + (parseFloat(s.fee_numeric) || 0), 0);

  return (
    <div className="pw-active-sessions-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Parked Vehicles</span>
          <span className="pw-metric-value">{totalParked}</span>
          <span className="pw-metric-trend positive">
            <span>Currently inside facility</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Cars & SUVs Parked</span>
          <span className="pw-metric-value">{carsCount}</span>
          <span className="pw-metric-trend positive">
            <span>Standard Bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Two-Wheelers & EVs</span>
          <span className="pw-metric-value">{bikesCount + evCount}</span>
          <span className="pw-metric-trend positive">
            <span>{bikesCount} Bikes • {evCount} EVs</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Accrued Ongoing Charges</span>
          <span className="pw-metric-value">₹{totalAccruedFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          <span className="pw-metric-trend positive">
            <span>Live accumulation</span>
          </span>
        </div>
      </div>

      <div className="pw-users-panel-card" style={{ marginTop: "24px" }}>
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search plate, owner, bay..."
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

            <div className="pw-filter-dropdown-wrap">
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                className="pw-custom-select"
              >
                <option value="ALL">All Zones</option>
                <option value="Zone A">Zone A (Standard)</option>
                <option value="Zone B">Zone B (Standard)</option>
                <option value="Zone C">Zone C (VIP/EV)</option>
                <option value="Zone D">Zone D (Bike)</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchSessions}
              title="Refresh active sessions"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-active-sessions-grid">
            <span>Vehicle Plate & Model</span>
            <span>Type & Zone</span>
            <span>Owner / Contact</span>
            <span>Entry Time</span>
            <span>Duration</span>
            <span>Accrued Fee</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((s) => {
                const typeKey = (s.vehicle_type || "Car").toLowerCase();
                const isBike = typeKey === "bike";
                const isEV = typeKey === "ev";

                return (
                  <div key={s.id} className="pw-user-card-box pw-mgmt-grid-row pw-active-sessions-grid">
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
                          <span>Bay {s.current_slot} ({s.zone})</span>
                        </span>
                      </div>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                        {s.owner_name}
                      </div>
                      <div className="pw-contact-cell">
                        <Mail size={11} className="pw-cell-icon" />
                        <span>{s.owner_email || "customer@shnoor.com"}</span>
                      </div>
                      <div className="pw-contact-cell">
                        <Phone size={11} className="pw-cell-icon" />
                        <span>{s.owner_phone || "+91 98765 43210"}</span>
                      </div>
                    </div>

                    <div className="pw-user-card-date-col">
                      <span className="pw-user-col-label">Check-in</span>
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

                    <div style={{ textAlign: "right" }}>
                      <span className="pw-veh-status-pill parked">
                        <span className="pw-status-dot"></span>
                        <span>Parked</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <Car size={32} className="pw-empty-icon" />
                  <h4>No active parking sessions found</h4>
                  <p>There are no parked vehicles matching your current search or filters.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="pw-users-table-footer">
          <span>Showing {filteredSessions.length} of {validSessions.length} active parked vehicles</span>
        </div>
      </div>
    </div>
  );
}

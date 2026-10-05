import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import { Car, Bike, Search, RefreshCw, Clock, Layers, Phone, Mail, Zap, Download } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function ActiveParkingSessions() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalSessions, setTotalSessions] = useState(0);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        type: typeFilter,
        zone: zoneFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/parking/active-sessions?${params}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        setTotalSessions(data.total !== undefined ? data.total : data.sessions.length);
      }
    } catch {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, typeFilter, zoneFilter]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 30000);
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

  const validSessions = sessions;
  const filteredSessions = sessions;

  const totalParked = validSessions.length;
  const carsCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "car" || (s.vehicle_type || "").toLowerCase() === "suv").length;
  const bikesCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "bike").length;
  const evCount = validSessions.filter((s) => (s.vehicle_type || "").toLowerCase() === "ev").length;
  const totalAccruedFee = validSessions.reduce((sum, s) => sum + (parseFloat(s.fee_numeric) || 0), 0);

  const handleExportCsv = () => {
    const headers = ["Vehicle Plate", "Type", "Model", "Slot", "Zone", "Owner Name", "Email", "Phone", "Entry Time", "Duration", "Accrued Fee", "Status"];
    const rows = (filteredSessions || []).map((s) => [
      s.vehicle_number || "",
      s.vehicle_type || "Car",
      s.model || "Standard",
      s.current_slot || "",
      s.zone || "",
      s.owner_name || "",
      s.owner_email || "",
      s.owner_phone || "",
      formatDate(s.entry_time),
      s.duration || "",
      s.calculated_fee || `₹${s.fee_numeric || 0}`,
      s.status || "Parked"
    ]);
    exportToCsv("Active_Parking_Sessions", headers, rows);
  };

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

            <div className="pw-filter-dropdown-wrap">
              <select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value);
                  setPage(1);
                }}
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
              disabled={isLoading}
              title="Refresh active sessions"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: isLoading ? "not-allowed" : "pointer", fontSize: "0.84rem", fontWeight: 600 }}
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin-icon" : ""} />
              <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              className="pw-btn-action-download"
              onClick={handleExportCsv}
              title="Download active sessions as CSV"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}
            >
              <Download size={14} />
              <span>Export CSV</span>
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
                        <span>{s.owner_email || "—"}</span>
                      </div>
                      <div className="pw-contact-cell">
                        <Phone size={11} className="pw-cell-icon" />
                        <span>{s.owner_phone || "—"}</span>
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

        <Pagination
          currentPage={page}
          totalItems={totalSessions}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemLabel="active sessions"
        />
      </div>
    </div>
  );
}

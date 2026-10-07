import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  Zap,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BatteryCharging,
  DollarSign,
  Activity,
  Car,
  X
} from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function StaffEVCharging() {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    availableSlots: "0",
    slotsInUse: "0",
    activeSessions: "0",
    todaySessions: "0",
    todayRevenue: "₹0"
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalSessions, setTotalSessions] = useState(0);

  const [sessionToStop, setSessionToStop] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isStopping, setIsStopping] = useState(false);
  const [actionAlert, setActionAlert] = useState("");

  const triggerAlert = (msg) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(""), 4500);
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/staff/ev-charging-overview`);
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch {
      void 0;
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        status: statusFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/ev-charging/sessions?${params}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        setTotalSessions(data.pagination ? data.pagination.total : data.sessions.length);
      }
    } catch {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchMetrics();
    fetchSessions();
  }, [fetchMetrics, fetchSessions]);

  const handleRefresh = async () => {
    await fetchMetrics();
    await fetchSessions();
  };

  const handleStopSession = async (e) => {
    e.preventDefault();
    if (!sessionToStop) return;
    setIsStopping(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging/sessions/${sessionToStop.id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          actor_role: "staff"
        })
      });
      const data = await res.json();
      setIsStopping(false);
      if (res.ok && data.success) {
        setSessionToStop(null);
        triggerAlert(`Charging session ${sessionToStop.session_code} completed. Payment: ₹${data.session.total_amount}`);
        handleRefresh();
      } else {
        triggerAlert(data.error || "Failed to complete session");
      }
    } catch {
      setIsStopping(false);
      triggerAlert("Server communication error");
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "Session Code",
      "Customer Name",
      "Customer Email",
      "Vehicle Plate",
      "Bay Slot",
      "Start Time",
      "Duration",
      "Energy Consumed",
      "Amount",
      "Payment Status",
      "Session Status"
    ];
    const rows = sessions.map((sess) => [
      sess.session_code,
      sess.customer_name,
      sess.customer_email,
      sess.vehicle_number,
      sess.slot_number,
      sess.start_time ? new Date(sess.start_time).toLocaleString("en-IN") : "",
      sess.duration || "Active",
      sess.energy_consumed ? `${sess.energy_consumed} kWh` : "0 kWh",
      `₹${parseFloat(sess.total_amount || 0).toFixed(2)}`,
      sess.payment_status || "Pending",
      sess.session_status || "Active"
    ]);
    exportToCsv("Staff_EV_Charging_Sessions.csv", headers, rows);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
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

  return (
    <div className="pw-staff-ev-module" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {actionAlert && (
        <div style={{
          padding: "12px 18px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          color: "#166534",
          fontWeight: 700,
          fontSize: "0.86rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CheckCircle2 size={16} />
          <span>{actionAlert}</span>
        </div>
      )}

      <div className="pw-metrics-summary-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
        gap: "14px"
      }}>
        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Available Charging Slots</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdf4)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{metrics.availableSlots}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Ready for charging</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Charging Slots In Use</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #fff7ed)", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BatteryCharging size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#ea580c" }}>{metrics.slotsInUse}</span>
          <span className="pw-metric-trend" style={{ marginTop: "6px", color: "#c2410c" }}>
            <span>Currently occupied</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Active Charging Sessions</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #eef2ff)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#4f46e5" }}>{metrics.activeSessions}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Live power delivery</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Today's Charging Sessions</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #f1f5f9)", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={16} />
            </div>
          </div>
          <span className="pw-metric-value">{metrics.todaySessions}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Today's operations</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Today's Charging Revenue</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdf4)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{metrics.todayRevenue}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Collected fees</span>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="pw-table-controls-row" style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
            <div className="pw-search-box-pill" style={{ minWidth: "240px" }}>
              <Search size={14} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search session ID, vehicle, bay, customer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pw-pill-input"
              />
            </div>

            <select
              className="pw-calc-select"
              style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.82rem" }}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">All Session States</option>
              <option value="Active">Active Only</option>
              <option value="Completed">Completed Only</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={handleRefresh}
              title="Refresh EV sessions"
            >
              <RefreshCw size={13} className={isLoading ? "pw-spin" : ""} />
            </button>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={handleExportCsv}
              disabled={sessions.length === 0}
              title="Export Sessions CSV"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        <div className="pw-table-card" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", overflowX: "auto" }}>
          <table className="pw-admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "850px" }}>
            <thead>
              <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                <th style={{ padding: "12px 16px" }}>SESSION</th>
                <th style={{ padding: "12px 16px" }}>CUSTOMER</th>
                <th style={{ padding: "12px 16px" }}>VEHICLE</th>
                <th style={{ padding: "12px 16px" }}>CHARGING BAY</th>
                <th style={{ padding: "12px 16px" }}>START TIME</th>
                <th style={{ padding: "12px 16px" }}>DURATION</th>
                <th style={{ padding: "12px 16px" }}>ENERGY</th>
                <th style={{ padding: "12px 16px" }}>AMOUNT</th>
                <th style={{ padding: "12px 16px" }}>STATUS</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length > 0 ? (
                sessions.map((sess) => {
                  const isAct = (sess.session_status || "").toLowerCase() === "active";
                  return (
                    <tr key={sess.id} style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)", fontSize: "0.84rem" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d9488" }}>
                        {sess.session_code}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{sess.customer_name}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #64748b)" }}>{sess.customer_email}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 800 }}>{sess.vehicle_number}</div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #64748b)" }}>{sess.vehicle_model}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        Bay {sess.slot_number}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary, #64748b)", fontSize: "0.78rem" }}>
                        {formatDate(sess.start_time)}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {sess.duration || (isAct ? "Ongoing" : "—")}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>
                        {sess.energy_consumed ? `${sess.energy_consumed} kWh` : isAct ? "Accumulating" : "0 kWh"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                        ₹{parseFloat(sess.total_amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`pw-status-pill ${isAct ? "active" : "completed"}`} style={{ fontSize: "0.72rem" }}>
                          {sess.session_status || "Active"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {isAct ? (
                          <button
                            type="button"
                            onClick={() => setSessionToStop(sess)}
                            style={{
                              background: "var(--bg-sub, #fef2f2)",
                              border: "1px solid var(--border-color, #fecaca)",
                              color: "#dc2626",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "0.76rem",
                              fontWeight: 800,
                              cursor: "pointer"
                            }}
                          >
                            Stop & Complete
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>Completed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                    <BatteryCharging size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No Charging Sessions Found</p>
                    <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem" }}>Active and completed sessions will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalItems={totalSessions}
          pageSize={limit}
          pageSizeOptions={[5, 10, 25, 50]}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
        />
      </div>

      {sessionToStop && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <BatteryCharging size={20} style={{ color: "#dc2626" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Stop EV Charging Session</h3>
              </div>
              <button type="button" onClick={() => setSessionToStop(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "16px", fontSize: "0.84rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Session:</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>{sessionToStop.session_code}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Vehicle:</span>
                <span style={{ fontWeight: 800 }}>{sessionToStop.vehicle_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Bay Slot:</span>
                <span style={{ fontWeight: 700 }}>Bay {sessionToStop.slot_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Customer:</span>
                <span>{sessionToStop.customer_name}</span>
              </div>
            </div>

            <form onSubmit={handleStopSession} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Payment Method Collected</label>
                <select
                  className="pw-calc-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Fastag">Fastag RFID</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setSessionToStop(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStopping}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#ffffff", fontWeight: 800, cursor: "pointer" }}
                >
                  {isStopping ? "Finalizing..." : "Complete & Release Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

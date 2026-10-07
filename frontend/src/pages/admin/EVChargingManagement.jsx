import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  Zap,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  BatteryCharging,
  DollarSign,
  Activity,
  Layers,
  X
} from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function EVChargingManagement({ setStatusActionMessage }) {
  const [activeSubTab, setActiveSubTab] = useState("slots");
  const [slots, setSlots] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [overviewStats, setOverviewStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    activeSessions: 0,
    sessionsToday: 0,
    revenueToday: "₹0.00",
    energyConsumedToday: "0.0 kWh",
    totalEnergy: "0.0 kWh",
    totalRevenue: "₹0.00"
  });

  const [slotSearch, setSlotSearch] = useState("");
  const [slotStatusFilter, setSlotStatusFilter] = useState("ALL");
  const [slotTypeFilter, setSlotTypeFilter] = useState("ALL");
  const [slotPage, setSlotPage] = useState(1);
  const [slotLimit, setSlotLimit] = useState(5);
  const [totalSlots, setTotalSlots] = useState(0);

  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionStatusFilter, setSessionStatusFilter] = useState("ALL");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionLimit, setSessionLimit] = useState(5);
  const [totalSessions, setTotalSessions] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    slot_number: "",
    location_name: "Central Parking Garage",
    charger_type: "DC Fast Charger",
    connector_type: "CCS2",
    charging_power: "60 kW",
    charging_rate: "18.00",
    status: "Available"
  });

  const [editingSlot, setEditingSlot] = useState(null);
  const [editFormData, setEditFormData] = useState({
    slot_number: "",
    location_name: "Central Parking Garage",
    charger_type: "DC Fast Charger",
    connector_type: "CCS2",
    charging_power: "60 kW",
    charging_rate: "18.00",
    status: "Available"
  });

  const [slotToDelete, setSlotToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionAlert, setActionAlert] = useState("");

  const triggerAlert = (msg) => {
    setActionAlert(msg);
    if (setStatusActionMessage) setStatusActionMessage(msg);
    setTimeout(() => setActionAlert(""), 4500);
  };

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/ev-charging-overview`);
      const data = await res.json();
      if (data.success && data.stats) {
        setOverviewStats(data.stats);
      }
    } catch {
      void 0;
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        page: String(slotPage),
        limit: String(slotLimit),
        search: slotSearch || "",
        status: slotStatusFilter,
        charger_type: slotTypeFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots?${params}`);
      const data = await res.json();
      setIsLoadingSlots(false);
      if (data.success && Array.isArray(data.slots)) {
        setSlots(data.slots);
        setTotalSlots(data.pagination ? data.pagination.total : data.slots.length);
      }
    } catch {
      setIsLoadingSlots(false);
    }
  }, [slotPage, slotLimit, slotSearch, slotStatusFilter, slotTypeFilter]);

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const params = new URLSearchParams({
        page: String(sessionPage),
        limit: String(sessionLimit),
        search: sessionSearch || "",
        status: sessionStatusFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/ev-charging/sessions?${params}`);
      const data = await res.json();
      setIsLoadingSessions(false);
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
        setTotalSessions(data.pagination ? data.pagination.total : data.sessions.length);
      }
    } catch {
      setIsLoadingSessions(false);
    }
  }, [sessionPage, sessionLimit, sessionSearch, sessionStatusFilter]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    if (activeSubTab === "slots") {
      fetchSlots();
    } else {
      fetchSessions();
    }
  }, [activeSubTab, fetchSlots, fetchSessions]);

  const handleRefresh = async () => {
    await fetchOverview();
    if (activeSubTab === "slots") {
      await fetchSlots();
    } else {
      await fetchSessions();
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!addFormData.slot_number.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addFormData)
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setAddFormData({
          slot_number: "",
          location_name: "Central Parking Garage",
          charger_type: "DC Fast Charger",
          connector_type: "CCS2",
          charging_power: "60 kW",
          charging_rate: "18.00",
          status: "Available"
        });
        triggerAlert(data.message || "EV Charging slot added successfully");
        fetchSlots();
        fetchOverview();
      } else {
        triggerAlert(data.error || "Failed to create EV charging slot");
      }
    } catch {
      setIsSubmitting(false);
      triggerAlert("Server communication error");
    }
  };

  const handleEditSlot = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots/${editingSlot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok && data.success) {
        setEditingSlot(null);
        triggerAlert(data.message || "EV Charging slot updated successfully");
        fetchSlots();
        fetchOverview();
      } else {
        triggerAlert(data.error || "Failed to update EV charging slot");
      }
    } catch {
      setIsSubmitting(false);
      triggerAlert("Server communication error");
    }
  };

  const handleToggleStatus = async (slot) => {
    const nextStatus = slot.status === "Available" ? "Maintenance" : slot.status === "Maintenance" ? "Inactive" : "Available";
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots/${slot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerAlert(`Slot ${slot.slot_number} marked as ${nextStatus}`);
        fetchSlots();
        fetchOverview();
      } else {
        triggerAlert(data.error || "Could not update slot status");
      }
    } catch {
      triggerAlert("Server error updating status");
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots/${slotToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (res.ok && data.success) {
        setSlotToDelete(null);
        triggerAlert(data.message || "Slot removed successfully");
        fetchSlots();
        fetchOverview();
      } else {
        triggerAlert(data.error || "Failed to delete slot");
      }
    } catch {
      setIsSubmitting(false);
      triggerAlert("Server error deleting slot");
    }
  };

  const handleExportSlotsCsv = () => {
    const headers = [
      "Slot Number",
      "Location",
      "Charger Type",
      "Connector",
      "Power Rating",
      "Tariff Rate (₹/kWh)",
      "Status",
      "Created At"
    ];
    const rows = slots.map((s) => [
      s.slot_number,
      s.location_name || "Central Parking Garage",
      s.charger_type,
      s.connector_type,
      s.charging_power,
      `₹${parseFloat(s.charging_rate || 0).toFixed(2)}`,
      s.status,
      s.created_at ? new Date(s.created_at).toLocaleString("en-IN") : ""
    ]);
    exportToCsv("EV_Charging_Slots.csv", headers, rows);
  };

  const handleExportSessionsCsv = () => {
    const headers = [
      "Session Code",
      "Customer Name",
      "Customer Email",
      "Vehicle Plate",
      "Vehicle Model",
      "Charging Bay",
      "Start Time",
      "End Time",
      "Duration",
      "Energy Consumed (kWh)",
      "Charging Rate (₹/kWh)",
      "Total Amount (₹)",
      "Payment Method",
      "Payment Status",
      "Session Status"
    ];
    const rows = sessions.map((sess) => [
      sess.session_code,
      sess.customer_name,
      sess.customer_email,
      sess.vehicle_number,
      sess.vehicle_model || "",
      sess.slot_number,
      sess.start_time ? new Date(sess.start_time).toLocaleString("en-IN") : "",
      sess.end_time ? new Date(sess.end_time).toLocaleString("en-IN") : "In Progress",
      sess.duration || "Active",
      sess.energy_consumed ? `${sess.energy_consumed} kWh` : "0 kWh",
      `₹${parseFloat(sess.charging_rate || 0).toFixed(2)}`,
      `₹${parseFloat(sess.total_amount || 0).toFixed(2)}`,
      sess.payment_method || "UPI",
      sess.payment_status || "Pending",
      sess.session_status || "Active"
    ]);
    exportToCsv("EV_Charging_Sessions.csv", headers, rows);
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
    <div className="pw-admin-ev-module" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
            <span className="pw-metric-label">Total EV Charging Slots</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #f1f5f9)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={16} />
            </div>
          </div>
          <span className="pw-metric-value">{overviewStats.totalSlots}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Configured EV Bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Available Slots</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdf4)", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{overviewStats.availableSlots}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Ready for charging</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Active Charging Sessions</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #fff7ed)", color: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BatteryCharging size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#ea580c" }}>{overviewStats.activeSessions}</span>
          <span className="pw-metric-trend" style={{ marginTop: "6px", color: "#c2410c" }}>
            <span>Vehicles currently plugged</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Charging Sessions Today</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #eef2ff)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={16} />
            </div>
          </div>
          <span className="pw-metric-value">{overviewStats.sessionsToday}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Dispatched Today</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">EV Revenue Today</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdf4)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={16} />
            </div>
          </div>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{overviewStats.revenueToday}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Collected payments</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span className="pw-metric-label">Energy Consumed Today</span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--bg-sub, #fdf4ff)", color: "#c026d3", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={16} />
            </div>
          </div>
          <span className="pw-metric-value">{overviewStats.energyConsumedToday}</span>
          <span className="pw-metric-trend positive" style={{ marginTop: "6px" }}>
            <span>Power delivered</span>
          </span>
        </div>
      </div>

      <div style={{
        display: "flex",
        borderBottom: "2px solid var(--border-color, #e2e8f0)",
        gap: "12px",
        marginTop: "4px"
      }}>
        <button
          type="button"
          onClick={() => setActiveSubTab("slots")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            fontWeight: 800,
            fontSize: "0.94rem",
            cursor: "pointer",
            borderBottom: activeSubTab === "slots" ? "3px solid #0d9488" : "3px solid transparent",
            color: activeSubTab === "slots" ? "#0d9488" : "var(--text-secondary, #64748b)",
            marginBottom: "-2px"
          }}
        >
          EV Charging Slots ({totalSlots})
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("sessions")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            fontWeight: 800,
            fontSize: "0.94rem",
            cursor: "pointer",
            borderBottom: activeSubTab === "sessions" ? "3px solid #0d9488" : "3px solid transparent",
            color: activeSubTab === "sessions" ? "#0d9488" : "var(--text-secondary, #64748b)",
            marginBottom: "-2px"
          }}
        >
          Charging Sessions ({totalSessions})
        </button>
      </div>

      {activeSubTab === "slots" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="pw-table-controls-row" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
              <div className="pw-search-box-pill" style={{ minWidth: "220px" }}>
                <Search size={14} className="pw-search-icon" />
                <input
                  type="text"
                  placeholder="Search slot, charger type..."
                  value={slotSearch}
                  onChange={(e) => {
                    setSlotSearch(e.target.value);
                    setSlotPage(1);
                  }}
                  className="pw-pill-input"
                />
              </div>

              <select
                className="pw-calc-select"
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.82rem" }}
                value={slotStatusFilter}
                onChange={(e) => {
                  setSlotStatusFilter(e.target.value);
                  setSlotPage(1);
                }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Available">Available</option>
                <option value="Charging">Charging</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>

              <select
                className="pw-calc-select"
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.82rem" }}
                value={slotTypeFilter}
                onChange={(e) => {
                  setSlotTypeFilter(e.target.value);
                  setSlotPage(1);
                }}
              >
                <option value="ALL">All Charger Types</option>
                <option value="DC Fast Charger">DC Fast Charger</option>
                <option value="AC Level 2">AC Level 2</option>
                <option value="Ultra-Fast DC">Ultra-Fast DC</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleRefresh}
                title="Refresh EV slots"
              >
                <RefreshCw size={13} className={isLoadingSlots ? "pw-spin" : ""} />
              </button>

              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleExportSlotsCsv}
                disabled={slots.length === 0}
                title="Export Slots CSV"
              >
                <Download size={13} />
              </button>

              <button
                type="button"
                className="pw-btn-primary"
                onClick={() => setIsAddModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Plus size={15} />
                <span>Add Charging Slot</span>
              </button>
            </div>
          </div>

          <div className="pw-table-card" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", overflowX: "auto" }}>
            <table className="pw-admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
              <thead>
                <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                  <th style={{ padding: "12px 16px" }}>SLOT</th>
                  <th style={{ padding: "12px 16px" }}>LOCATION</th>
                  <th style={{ padding: "12px 16px" }}>CHARGER TYPE</th>
                  <th style={{ padding: "12px 16px" }}>CONNECTOR</th>
                  <th style={{ padding: "12px 16px" }}>POWER</th>
                  <th style={{ padding: "12px 16px" }}>RATE / kWh</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {slots.length > 0 ? (
                  slots.map((s) => {
                    const st = (s.status || "Available").toLowerCase();
                    const pillClass = st === "available" ? "completed" : st === "charging" ? "active" : st === "maintenance" ? "pending" : "cancelled";
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)", fontSize: "0.84rem" }}>
                        <td style={{ padding: "12px 16px", fontWeight: 800 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Zap size={14} />
                            </div>
                            <span style={{ color: "var(--text-primary, #0f172a)" }}>{s.slot_number}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", color: "var(--text-secondary, #64748b)" }}>
                          {s.location_name || "Central Parking Garage"}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 600 }}>{s.charger_type}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ background: "var(--bg-sub, #f1f5f9)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.74rem", fontWeight: 700 }}>
                            {s.connector_type}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>
                          {s.charging_power}
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                          ₹{parseFloat(s.charging_rate || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`pw-status-pill ${pillClass}`} style={{ fontSize: "0.72rem" }}>
                            {s.status}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", alignItems: "center" }}>
                            <button
                              type="button"
                              className="pw-btn-action-view"
                              onClick={() => {
                                setEditingSlot(s);
                                setEditFormData({
                                  slot_number: s.slot_number,
                                  location_name: s.location_name || "Central Parking Garage",
                                  charger_type: s.charger_type,
                                  connector_type: s.connector_type,
                                  charging_power: s.charging_power,
                                  charging_rate: String(s.charging_rate || "18.00"),
                                  status: s.status
                                });
                              }}
                              title="Edit Slot"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              type="button"
                              className="pw-btn-action-view"
                              onClick={() => handleToggleStatus(s)}
                              title="Toggle Status (Available / Maintenance / Inactive)"
                            >
                              <Activity size={13} />
                            </button>

                            <button
                              type="button"
                              className="pw-btn-action-delete"
                              onClick={() => setSlotToDelete(s)}
                              title="Delete Slot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                      <Zap size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No EV Charging Slots Found</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem" }}>Add your first EV charging bay using the button above.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={slotPage}
            totalItems={totalSlots}
            pageSize={slotLimit}
            pageSizeOptions={[5, 10, 25, 50]}
            onPageChange={setSlotPage}
            onPageSizeChange={(newSize) => {
              setSlotLimit(newSize);
              setSlotPage(1);
            }}
          />
        </div>
      )}

      {activeSubTab === "sessions" && (
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
                  placeholder="Search session ID, customer, vehicle, slot..."
                  value={sessionSearch}
                  onChange={(e) => {
                    setSessionSearch(e.target.value);
                    setSessionPage(1);
                  }}
                  className="pw-pill-input"
                />
              </div>

              <select
                className="pw-calc-select"
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.82rem" }}
                value={sessionStatusFilter}
                onChange={(e) => {
                  setSessionStatusFilter(e.target.value);
                  setSessionPage(1);
                }}
              >
                <option value="ALL">All Session States</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleRefresh}
                title="Refresh sessions"
              >
                <RefreshCw size={13} className={isLoadingSessions ? "pw-spin" : ""} />
              </button>

              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleExportSessionsCsv}
                disabled={sessions.length === 0}
                title="Export Sessions CSV"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="pw-table-card" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", overflowX: "auto" }}>
            <table className="pw-admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
              <thead>
                <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                  <th style={{ padding: "12px 16px" }}>SESSION</th>
                  <th style={{ padding: "12px 16px" }}>CUSTOMER</th>
                  <th style={{ padding: "12px 16px" }}>VEHICLE</th>
                  <th style={{ padding: "12px 16px" }}>SLOT</th>
                  <th style={{ padding: "12px 16px" }}>START TIME</th>
                  <th style={{ padding: "12px 16px" }}>DURATION</th>
                  <th style={{ padding: "12px 16px" }}>ENERGY</th>
                  <th style={{ padding: "12px 16px" }}>AMOUNT</th>
                  <th style={{ padding: "12px 16px" }}>PAYMENT</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
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
                          <span className={`pw-status-pill ${(sess.payment_status || "Pending").toLowerCase() === "completed" ? "completed" : "pending"}`} style={{ fontSize: "0.72rem" }}>
                            {sess.payment_status || "Pending"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span className={`pw-status-pill ${isAct ? "active" : "completed"}`} style={{ fontSize: "0.72rem" }}>
                            {sess.session_status || "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                      <BatteryCharging size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No Charging Sessions Recorded</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem" }}>Sessions will appear automatically when customers start charging.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={sessionPage}
            totalItems={totalSessions}
            pageSize={sessionLimit}
            pageSizeOptions={[5, 10, 25, 50]}
            onPageChange={setSessionPage}
            onPageSizeChange={(newSize) => {
              setSessionLimit(newSize);
              setSessionPage(1);
            }}
          />
        </div>
      )}

      {isAddModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={20} style={{ color: "#0d9488" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Add EV Charging Slot</h3>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSlot} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Slot Identifier / Number *</label>
                <input
                  type="text"
                  placeholder="e.g. EV-07"
                  required
                  value={addFormData.slot_number}
                  onChange={(e) => setAddFormData({ ...addFormData, slot_number: e.target.value })}
                  className="pw-calc-input"
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Location</label>
                <input
                  type="text"
                  value={addFormData.location_name}
                  onChange={(e) => setAddFormData({ ...addFormData, location_name: e.target.value })}
                  className="pw-calc-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Charger Type</label>
                  <select
                    className="pw-calc-select"
                    value={addFormData.charger_type}
                    onChange={(e) => setAddFormData({ ...addFormData, charger_type: e.target.value })}
                  >
                    <option value="DC Fast Charger">DC Fast Charger</option>
                    <option value="AC Level 2">AC Level 2</option>
                    <option value="Ultra-Fast DC">Ultra-Fast DC</option>
                  </select>
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Connector Type</label>
                  <select
                    className="pw-calc-select"
                    value={addFormData.connector_type}
                    onChange={(e) => setAddFormData({ ...addFormData, connector_type: e.target.value })}
                  >
                    <option value="CCS2">CCS2</option>
                    <option value="Type 2">Type 2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="GB/T">GB/T</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Charging Power</label>
                  <input
                    type="text"
                    placeholder="e.g. 60 kW"
                    value={addFormData.charging_power}
                    onChange={(e) => setAddFormData({ ...addFormData, charging_power: e.target.value })}
                    className="pw-calc-input"
                  />
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Tariff Rate (₹ / kWh) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={addFormData.charging_rate}
                    onChange={(e) => setAddFormData({ ...addFormData, charging_rate: e.target.value })}
                    className="pw-calc-input"
                  />
                </div>
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Initial Status</label>
                <select
                  className="pw-calc-select"
                  value={addFormData.status}
                  onChange={(e) => setAddFormData({ ...addFormData, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pw-btn-primary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  {isSubmitting ? "Saving..." : "Create Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSlot && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit3 size={20} style={{ color: "#0d9488" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Edit Slot {editingSlot.slot_number}</h3>
              </div>
              <button type="button" onClick={() => setEditingSlot(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSlot} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Slot Identifier / Number</label>
                <input
                  type="text"
                  required
                  value={editFormData.slot_number}
                  onChange={(e) => setEditFormData({ ...editFormData, slot_number: e.target.value })}
                  className="pw-calc-input"
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Location</label>
                <input
                  type="text"
                  value={editFormData.location_name}
                  onChange={(e) => setEditFormData({ ...editFormData, location_name: e.target.value })}
                  className="pw-calc-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Charger Type</label>
                  <select
                    className="pw-calc-select"
                    value={editFormData.charger_type}
                    onChange={(e) => setEditFormData({ ...editFormData, charger_type: e.target.value })}
                  >
                    <option value="DC Fast Charger">DC Fast Charger</option>
                    <option value="AC Level 2">AC Level 2</option>
                    <option value="Ultra-Fast DC">Ultra-Fast DC</option>
                  </select>
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Connector Type</label>
                  <select
                    className="pw-calc-select"
                    value={editFormData.connector_type}
                    onChange={(e) => setEditFormData({ ...editFormData, connector_type: e.target.value })}
                  >
                    <option value="CCS2">CCS2</option>
                    <option value="Type 2">Type 2</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="GB/T">GB/T</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Charging Power</label>
                  <input
                    type="text"
                    value={editFormData.charging_power}
                    onChange={(e) => setEditFormData({ ...editFormData, charging_power: e.target.value })}
                    className="pw-calc-input"
                  />
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Tariff Rate (₹ / kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={editFormData.charging_rate}
                    onChange={(e) => setEditFormData({ ...editFormData, charging_rate: e.target.value })}
                    className="pw-calc-input"
                  />
                </div>
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Status</label>
                <select
                  className="pw-calc-select"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                >
                  <option value="Available">Available</option>
                  <option value="Charging">Charging</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="pw-btn-primary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {slotToDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#dc2626", marginBottom: "12px" }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Confirm Deletion</h3>
            </div>
            <p style={{ margin: 0, fontSize: "0.86rem", color: "var(--text-secondary, #64748b)", lineHeight: 1.5 }}>
              Are you sure you want to delete EV charging slot <strong>{slotToDelete.slot_number}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setSlotToDelete(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDeleteSlot}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", background: "#dc2626", color: "#ffffff", fontWeight: 800, cursor: "pointer" }}
              >
                {isSubmitting ? "Deleting..." : "Delete Slot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

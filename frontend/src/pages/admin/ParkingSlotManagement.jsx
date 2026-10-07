import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  Car,
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  RefreshCw,
  Download,
  Zap
} from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function ParkingSlotManagement({
  slots,
  getSlotState,
  fetchDashboardData,
  setStatusActionMessage,
  handleSlotStatusChange,
  availableCount,
  occupiedCount,
  reservedCount
}) {
  const [slotSearch, setSlotSearch] = useState("");
  const [slotZoneFilter, setSlotZoneFilter] = useState("ALL");
  const [slotStatusFilter, setSlotStatusFilter] = useState("ALL");
  const [slotTypeFilter, setSlotTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [paginatedSlots, setPaginatedSlots] = useState([]);
  const [totalSlots, setTotalSlots] = useState(0);

  const [evSlots, setEvSlots] = useState([]);
  const [evActiveSessions, setEvActiveSessions] = useState([]);
  const [evSearch, setEvSearch] = useState("");
  const [evStatusFilter, setEvStatusFilter] = useState("ALL");

  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [addSlotFormData, setAddSlotFormData] = useState({
    slot_number: "",
    zone: "Zone A",
    slot_type: "Standard",
    hourly_rate: "50",
    status: "available"
  });

  const [editingSlot, setEditingSlot] = useState(null);
  const [editSlotFormData, setEditSlotFormData] = useState({
    slot_number: "",
    zone: "Zone A",
    slot_type: "Standard",
    hourly_rate: "50",
    status: "available"
  });

  const [slotToDelete, setSlotToDelete] = useState(null);
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: slotSearch || "",
        zone: slotZoneFilter,
        status: slotStatusFilter,
        type: slotTypeFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/parking-slots?${params}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.slots)) {
        setPaginatedSlots(data.slots);
        setTotalSlots(data.total !== undefined ? data.total : data.slots.length);
      }
    } catch {}
  }, [page, limit, slotSearch, slotZoneFilter, slotStatusFilter, slotTypeFilter]);

  const fetchEvSlots = useCallback(async () => {
    try {
      const [slotsRes, sessRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/ev-charging-slots?all=true`),
        fetch(`${API_BASE_URL}/api/ev-charging/sessions?status=Active`)
      ]);
      const sData = await slotsRes.json();
      const sessData = await sessRes.json();
      if (sData.success && Array.isArray(sData.slots)) {
        setEvSlots(sData.slots);
      }
      if (sessData.success && Array.isArray(sessData.sessions)) {
        setEvActiveSessions(sessData.sessions);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchEvSlots();
  }, [fetchSlots, fetchEvSlots]);

  const filteredSlotManagerSlots = paginatedSlots;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (fetchDashboardData) await fetchDashboardData();
      await Promise.all([fetchSlots(), fetchEvSlots()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEvStatusChange = async (slotId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        if (setStatusActionMessage) {
          setStatusActionMessage(`EV Slot updated to ${newStatus}`);
          setTimeout(() => setStatusActionMessage(""), 3000);
        }
        await fetchEvSlots();
      }
    } catch {}
  };

  const handleExportCsv = () => {
    const headers = ["Bay Slot", "Zone", "Slot Type", "Hourly Rate", "Status"];
    const rows = (filteredSlotManagerSlots || []).map((s) => [
      s.slot_number || "",
      s.zone || "",
      s.slot_type || "Standard",
      `₹${parseFloat(s.hourly_rate || 50).toFixed(2)}/hr`,
      s.status || "available"
    ]);
    exportToCsv("Parking_Slots_Inventory", headers, rows);
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setIsAddingSlot(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addSlotFormData)
      });
      const data = await res.json();
      setIsAddingSlot(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Slot ${addSlotFormData.slot_number} created successfully`);
        setIsAddSlotModalOpen(false);
        setAddSlotFormData({
          slot_number: "",
          zone: "Zone A",
          slot_type: "Standard",
          hourly_rate: "50",
          status: "available"
        });
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchDashboardData();
        fetchSlots();
      } else {
        setStatusActionMessage(data.error || "Failed to create slot");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsAddingSlot(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const openEditSlotModal = (slot) => {
    setEditingSlot(slot);
    setEditSlotFormData({
      slot_number: slot.slot_number || "",
      zone: slot.zone || "Zone A",
      slot_type: slot.slot_type || "Standard",
      hourly_rate: String(slot.hourly_rate || "50"),
      status: slot.status || "available"
    });
  };

  const handleSaveSlotEdit = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setIsSavingSlot(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/slots/${editingSlot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSlotFormData)
      });
      const data = await res.json();
      setIsSavingSlot(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Slot ${editSlotFormData.slot_number} updated successfully`);
        setEditingSlot(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchDashboardData();
        fetchSlots();
      } else {
        setStatusActionMessage(data.error || "Failed to update slot");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsSavingSlot(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleConfirmDeleteSlot = async () => {
    if (!slotToDelete) return;
    setIsDeletingSlot(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/slots/${slotToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setIsDeletingSlot(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Slot ${slotToDelete.slot_number} deleted successfully`);
        setSlotToDelete(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchDashboardData();
        fetchSlots();
      } else {
        setStatusActionMessage(data.error || "Failed to delete slot");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsDeletingSlot(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  return (
    <div className="pw-users-module-card">
      <div className="pw-metrics-four-grid" style={{ marginBottom: "6px" }}>
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Parking Slots</span>
          <span className="pw-metric-value">{slots.length}</span>
          <span className="pw-metric-trend positive">
            <span>Zones A, B, C, D</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Available (Green)</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{availableCount}</span>
          <span className="pw-metric-trend positive" style={{ color: "#16a34a" }}>
            <span>Ready for parking</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Occupied (Red)</span>
          <span className="pw-metric-value" style={{ color: "#dc2626" }}>{occupiedCount}</span>
          <span className="pw-metric-trend" style={{ color: "#dc2626" }}>
            <span>Vehicles parked</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Reserved (Blue)</span>
          <span className="pw-metric-value" style={{ color: "#2563eb" }}>{reservedCount}</span>
          <span className="pw-metric-trend" style={{ color: "#2563eb" }}>
            <span>Advance booked</span>
          </span>
        </div>
      </div>

      <div className="pw-users-toolbar">
        <div className="pw-user-search-wrapper">
          <Search size={14} className="pw-search-icon" />
          <input
            type="text"
            placeholder="Search bay number, zone, or type..."
            value={slotSearch}
            onChange={(e) => {
              setSlotSearch(e.target.value);
              setPage(1);
            }}
            className="pw-user-search-input"
          />
          {slotSearch && (
            <button
              type="button"
              className="pw-clear-search-btn"
              onClick={() => {
                setSlotSearch("");
                setPage(1);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pw-user-filters-group">
          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Zone:</span>
            <select
              value={slotZoneFilter}
              onChange={(e) => {
                setSlotZoneFilter(e.target.value);
                setPage(1);
              }}
              className="pw-custom-select"
            >
              <option value="ALL">All Zones</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D (Bikes)">Zone D (Bikes)</option>
              <option value="Zone EV">Zone EV</option>
            </select>
          </div>

          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Type:</span>
            <select
              value={slotTypeFilter}
              onChange={(e) => {
                setSlotTypeFilter(e.target.value);
                setPage(1);
              }}
              className="pw-custom-select"
            >
              <option value="ALL">All Types</option>
              <option value="Standard">Standard</option>
              <option value="VIP / EV">VIP / EV</option>
              <option value="Bike">Bike</option>
            </select>
          </div>

          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Status:</span>
            <select
              value={slotStatusFilter}
              onChange={(e) => {
                setSlotStatusFilter(e.target.value);
                setPage(1);
              }}
              className="pw-custom-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <button
            type="button"
            className="pw-btn-action-refresh"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh slots list"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: isRefreshing ? "not-allowed" : "pointer", fontSize: "0.84rem", fontWeight: 600 }}
          >
            <RefreshCw size={14} className={isRefreshing ? "pw-spin-icon" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            className="pw-btn-action-download"
            onClick={handleExportCsv}
            title="Download parking slots as CSV"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="pw-btn-add-user"
            onClick={() => {
              setAddSlotFormData({
                slot_number: "",
                zone: "Zone A",
                slot_type: "Standard",
                hourly_rate: "50",
                status: "available"
              });
              setIsAddSlotModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add New Slot</span>
          </button>
        </div>
      </div>

      <div className="pw-users-table-scroll-container">
        <div className="pw-users-header-row pw-mgmt-grid-row pw-slot-mgmt-grid">
          <span>Slot Bay & Zone</span>
          <span>Slot Type</span>
          <span>Hourly Rate</span>
          <span>Current Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="pw-user-cards-stack">
          {filteredSlotManagerSlots.length > 0 ? (
            filteredSlotManagerSlots.map((s) => {
              const state = getSlotState(s);
              const typeKey = (s.slot_type || "").toLowerCase().includes("ev") ? "ev" : (s.slot_type || "Standard").toLowerCase().includes("vip") ? "vip" : (s.slot_type || "").toLowerCase().includes("bike") ? "bike" : "standard";

              return (
                <div key={s.id} className="pw-user-card-box pw-mgmt-grid-row pw-slot-mgmt-grid">
                  <div className="pw-user-card-main-col">
                    <div className={`pw-slot-avatar-small ${state}`}>
                      {s.slot_number}
                    </div>
                    <div>
                      <div className="pw-user-name-bold">Bay {s.slot_number}</div>
                      <span className="pw-role-badge customer" style={{ marginTop: "4px" }}>
                        {s.zone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className={`pw-slot-type-badge ${typeKey}`}>
                      {s.slot_type || "Standard"}
                    </span>
                  </div>

                  <div className="pw-user-card-date-col">
                    <span className="pw-user-col-label">Hourly Rate</span>
                    <span className="pw-user-col-value">₹{s.hourly_rate || "50"}/hr</span>
                  </div>

                  <div>
                    <span
                      className={`pw-tile-status-chip ${state === "available" ? "avail" : state === "occupied" ? "occ" : state === "charging" ? "charging" : state === "maintenance" ? "maint" : "reserved"}`}
                      style={{ cursor: "pointer" }}
                      onClick={async () => {
                        const nextStatus = state === "available" ? "occupied" : state === "occupied" ? "reserved" : "available";
                        await handleSlotStatusChange(s.slot_number, nextStatus);
                        fetchSlots();
                      }}
                      title="Click to cycle status"
                    >
                      {state === "available" ? "🟢 Free" : state === "occupied" ? "🔴 Occupied" : state === "charging" ? "⚡ Charging" : state === "maintenance" ? "⚠️ Maintenance" : "🔵 Reserved"}
                    </span>
                  </div>

                  <div className="pw-user-card-actions-col">
                    <button
                      type="button"
                      className="pw-btn-action-view"
                      onClick={() => setSelectedSlotModal(s)}
                      title="View Slot Details"
                    >
                      <Eye size={13} />
                      <span>Details</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-edit"
                      onClick={() => openEditSlotModal(s)}
                      title="Edit Slot Parameters"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
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
                </div>
              );
            })
          ) : (
            <div className="pw-empty-users-card">
              <div className="pw-empty-state">
                <Car size={32} className="pw-empty-icon" />
                <h4>No slots match your filters</h4>
                <p>Try clearing search or adjusting zone and status filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Pagination
        currentPage={page}
        totalItems={totalSlots}
        itemsPerPage={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        itemLabel="parking slots"
      />

      <div style={{ marginTop: "40px", paddingTop: "28px", borderTop: "2px dashed var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <Zap size={20} style={{ color: "#10b981" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0, color: "var(--text-primary, #0f172a)" }}>
                EV CHARGING SLOTS
              </h3>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#059669" }}>
                Dedicated High-Voltage Charging Stations
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem", color: "var(--text-secondary, #64748b)" }}>
              Zone C Electric Vehicle Charging Infrastructure • Real-time Hardware & Session Monitor
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="pw-search-box-pill" style={{ minWidth: "220px" }}>
              <Search size={14} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search EV bay, type, power..."
                value={evSearch}
                onChange={(e) => setEvSearch(e.target.value)}
                className="pw-pill-input"
              />
            </div>
            <select
              value={evStatusFilter}
              onChange={(e) => setEvStatusFilter(e.target.value)}
              className="pw-custom-select"
              style={{ width: "auto", minWidth: "140px" }}
            >
              <option value="ALL">All EV Statuses</option>
              <option value="Available">Available</option>
              <option value="Charging">Charging</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {evSlots.filter((s) => {
            const q = (evSearch || "").trim().toLowerCase();
            const queryMatch =
              !q ||
              (s.slot_number || "").toLowerCase().includes(q) ||
              (s.location_name || "").toLowerCase().includes(q) ||
              (s.charger_type || "").toLowerCase().includes(q) ||
              (s.connector_type || "").toLowerCase().includes(q);
            const statusMatch = evStatusFilter === "ALL" || (s.status || "").toLowerCase() === evStatusFilter.toLowerCase();
            return queryMatch && statusMatch;
          }).length > 0 ? (
            evSlots.filter((s) => {
              const q = (evSearch || "").trim().toLowerCase();
              const queryMatch =
                !q ||
                (s.slot_number || "").toLowerCase().includes(q) ||
                (s.location_name || "").toLowerCase().includes(q) ||
                (s.charger_type || "").toLowerCase().includes(q) ||
                (s.connector_type || "").toLowerCase().includes(q);
              const statusMatch = evStatusFilter === "ALL" || (s.status || "").toLowerCase() === evStatusFilter.toLowerCase();
              return queryMatch && statusMatch;
            }).map((ev) => {
              const activeSession = evActiveSessions.find(
                (s) => s.slot_id === ev.id || String(s.slot_number).toUpperCase() === String(ev.slot_number).toUpperCase()
              );
              const statusLower = (ev.status || "available").toLowerCase();
              const isAvail = statusLower === "available";
              const isCharging = statusLower === "charging" || !!activeSession;
              const isMaint = statusLower === "maintenance";

              return (
                <div
                  key={ev.id}
                  style={{
                    background: "var(--bg-card, #ffffff)",
                    border: `1.5px solid ${isCharging ? "#3b82f6" : isAvail ? "#10b981" : isMaint ? "#f59e0b" : "#e2e8f0"}`,
                    borderRadius: "12px",
                    padding: "16px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-primary, #0f172a)" }}>
                          {ev.slot_number}
                        </span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}>
                          {ev.charging_power || "60 kW"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", marginTop: "2px" }}>
                        {ev.location_name || "Zone C (EV Station)"}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: isAvail ? "rgba(16, 185, 129, 0.12)" : isCharging ? "rgba(59, 130, 246, 0.12)" : isMaint ? "rgba(245, 158, 11, 0.12)" : "rgba(100, 116, 139, 0.12)",
                        color: isAvail ? "#059669" : isCharging ? "#2563eb" : isMaint ? "#d97706" : "#475569",
                        border: `1px solid ${isAvail ? "#a7f3d0" : isCharging ? "#bfdbfe" : isMaint ? "#fde68a" : "#cbd5e1"}`
                      }}
                    >
                      {isCharging ? "⚡ Charging" : ev.status}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "var(--bg-muted, #f8fafc)", padding: "10px", borderRadius: "8px", fontSize: "0.76rem" }}>
                    <div>
                      <span style={{ color: "var(--text-secondary, #64748b)", display: "block", fontSize: "0.7rem" }}>Charger Type</span>
                      <strong style={{ color: "var(--text-primary, #0f172a)" }}>{ev.charger_type || "DC Fast"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary, #64748b)", display: "block", fontSize: "0.7rem" }}>Connector</span>
                      <strong style={{ color: "var(--text-primary, #0f172a)" }}>{ev.connector_type || "CCS2"}</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary, #64748b)", display: "block", fontSize: "0.7rem" }}>Tariff Rate</span>
                      <strong style={{ color: "#0d9488" }}>₹{parseFloat(ev.charging_rate || 18).toFixed(2)}/kWh</strong>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary, #64748b)", display: "block", fontSize: "0.7rem" }}>Status</span>
                      <strong style={{ color: "var(--text-primary, #0f172a)" }}>{ev.status}</strong>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-color, #f1f5f9)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.75rem" }}>
                      {activeSession ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#2563eb", fontWeight: 700 }}>
                          <Zap size={12} /> {activeSession.vehicle_number}
                        </span>
                      ) : isAvail ? (
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>Ready for vehicle</span>
                      ) : (
                        <span style={{ color: "#64748b" }}>{ev.status}</span>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "6px" }}>
                      {isAvail ? (
                        <button
                          type="button"
                          onClick={() => handleEvStatusChange(ev.id, "Maintenance")}
                          style={{ padding: "4px 8px", fontSize: "0.7rem", fontWeight: 600, borderRadius: "6px", border: "1px solid #fde68a", background: "#fef3c7", color: "#92400e", cursor: "pointer" }}
                        >
                          Maintenance
                        </button>
                      ) : isMaint ? (
                        <button
                          type="button"
                          onClick={() => handleEvStatusChange(ev.id, "Available")}
                          style={{ padding: "4px 8px", fontSize: "0.7rem", fontWeight: 600, borderRadius: "6px", border: "1px solid #a7f3d0", background: "#ecfdf5", color: "#065f46", cursor: "pointer" }}
                        >
                          Set Available
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: "1 / -1", padding: "24px", textAlign: "center", background: "var(--bg-card, #ffffff)", borderRadius: "10px", border: "1px dashed var(--border-color, #cbd5e1)" }}>
              <Zap size={24} style={{ color: "#94a3b8", margin: "0 auto 8px auto" }} />
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary, #64748b)" }}>No EV charging slots match your filters.</p>
            </div>
          )}
        </div>
      </div>

      {isAddSlotModalOpen && (
        <div className="pw-modal-backdrop" onClick={() => setIsAddSlotModalOpen(false)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Add New Parking Slot</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setIsAddSlotModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddSlot}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-slot-number">Slot Bay Number</label>
                    <input
                      id="add-slot-number"
                      type="text"
                      className="pw-form-input"
                      placeholder="e.g. A-07, E-01"
                      value={addSlotFormData.slot_number}
                      onChange={(e) => setAddSlotFormData({ ...addSlotFormData, slot_number: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-slot-zone">Zone</label>
                    <select
                      id="add-slot-zone"
                      className="pw-form-input"
                      value={addSlotFormData.zone}
                      onChange={(e) => setAddSlotFormData({ ...addSlotFormData, zone: e.target.value })}
                    >
                      <option value="Zone A">Zone A</option>
                      <option value="Zone B">Zone B</option>
                      <option value="Zone C">Zone C</option>
                      <option value="Zone D">Zone D</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-slot-type">Slot Type</label>
                    <select
                      id="add-slot-type"
                      className="pw-form-input"
                      value={addSlotFormData.slot_type}
                      onChange={(e) => setAddSlotFormData({ ...addSlotFormData, slot_type: e.target.value })}
                    >
                      <option value="Standard">Standard</option>
                      <option value="VIP / EV">VIP / EV</option>
                      <option value="Bike">Bike</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-slot-rate">Hourly Rate (₹)</label>
                    <input
                      id="add-slot-rate"
                      type="number"
                      className="pw-form-input"
                      placeholder="50"
                      value={addSlotFormData.hourly_rate}
                      onChange={(e) => setAddSlotFormData({ ...addSlotFormData, hourly_rate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card" style={{ gridColumn: "span 2" }}>
                    <label className="pw-detail-label" htmlFor="add-slot-status">Initial Status</label>
                    <select
                      id="add-slot-status"
                      className="pw-form-input"
                      value={addSlotFormData.status}
                      onChange={(e) => setAddSlotFormData({ ...addSlotFormData, status: e.target.value })}
                    >
                      <option value="available">Available (Green)</option>
                      <option value="occupied">Occupied (Red)</option>
                      <option value="reserved">Reserved (Blue)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  disabled={isAddingSlot}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isAddingSlot}
                >
                  <Plus size={15} />
                  <span>{isAddingSlot ? "Adding..." : "Add Slot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSlot && (
        <div className="pw-modal-backdrop" onClick={() => setEditingSlot(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Edit Slot {editingSlot.slot_number}</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setEditingSlot(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSlotEdit}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-slot-number">Slot Bay Number</label>
                    <input
                      id="edit-slot-number"
                      type="text"
                      className="pw-form-input"
                      value={editSlotFormData.slot_number}
                      onChange={(e) => setEditSlotFormData({ ...editSlotFormData, slot_number: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-slot-zone">Zone</label>
                    <select
                      id="edit-slot-zone"
                      className="pw-form-input"
                      value={editSlotFormData.zone}
                      onChange={(e) => setEditSlotFormData({ ...editSlotFormData, zone: e.target.value })}
                    >
                      <option value="Zone A">Zone A</option>
                      <option value="Zone B">Zone B</option>
                      <option value="Zone C">Zone C</option>
                      <option value="Zone D">Zone D</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-slot-type">Slot Type</label>
                    <select
                      id="edit-slot-type"
                      className="pw-form-input"
                      value={editSlotFormData.slot_type}
                      onChange={(e) => setEditSlotFormData({ ...editSlotFormData, slot_type: e.target.value })}
                    >
                      <option value="Standard">Standard</option>
                      <option value="VIP / EV">VIP / EV</option>
                      <option value="Bike">Bike</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-slot-rate">Hourly Rate (₹)</label>
                    <input
                      id="edit-slot-rate"
                      type="number"
                      className="pw-form-input"
                      value={editSlotFormData.hourly_rate}
                      onChange={(e) => setEditSlotFormData({ ...editSlotFormData, hourly_rate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card" style={{ gridColumn: "span 2" }}>
                    <label className="pw-detail-label" htmlFor="edit-slot-status">Current Status</label>
                    <select
                      id="edit-slot-status"
                      className="pw-form-input"
                      value={editSlotFormData.status}
                      onChange={(e) => setEditSlotFormData({ ...editSlotFormData, status: e.target.value })}
                    >
                      <option value="available">Available (Green)</option>
                      <option value="occupied">Occupied (Red)</option>
                      <option value="reserved">Reserved (Blue)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setEditingSlot(null)}
                  disabled={isSavingSlot}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isSavingSlot}
                >
                  <CheckCircle size={15} />
                  <span>{isSavingSlot ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {slotToDelete && (
        <div className="pw-modal-backdrop" onClick={() => setSlotToDelete(null)}>
          <div className="pw-confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-delete-modal-head">
              <div className="pw-delete-icon-circle">
                <AlertTriangle size={26} />
              </div>
              <h3 className="pw-delete-modal-title">Delete Parking Slot</h3>
              <p className="pw-delete-modal-desc">
                Are you sure you want to delete Parking Slot <strong>{slotToDelete.slot_number}</strong> ({slotToDelete.zone})? This action is permanent.
              </p>
            </div>

            <div className="pw-delete-modal-actions">
              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setSlotToDelete(null)}
                disabled={isDeletingSlot}
              >
                Cancel
              </button>

              <button
                type="button"
                className="pw-btn-confirm-delete"
                onClick={handleConfirmDeleteSlot}
                disabled={isDeletingSlot}
              >
                <Trash2 size={14} />
                <span>{isDeletingSlot ? "Deleting..." : "Yes, Delete Slot"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedSlotModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedSlotModal(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Slot {selectedSlotModal.slot_number} Details</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setSelectedSlotModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-detail-user-profile-header">
                <div
                  className="pw-detail-avatar-large"
                  style={{
                    background:
                      getSlotState(selectedSlotModal) === "available"
                        ? "#dcfce7"
                        : getSlotState(selectedSlotModal) === "occupied"
                        ? "#fee2e2"
                        : "#dbeafe",
                    color:
                      getSlotState(selectedSlotModal) === "available"
                        ? "#15803d"
                        : getSlotState(selectedSlotModal) === "occupied"
                        ? "#b91c1c"
                        : "#1d4ed8"
                  }}
                >
                  {selectedSlotModal.slot_number}
                </div>

                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">Parking Bay {selectedSlotModal.slot_number}</h4>
                  <div className="pw-detail-badges-row">
                    <span className="pw-role-badge customer">
                      {selectedSlotModal.zone}
                    </span>
                    <span
                      className={`pw-tile-status-chip ${
                        getSlotState(selectedSlotModal) === "available"
                          ? "avail"
                          : getSlotState(selectedSlotModal) === "occupied"
                          ? "occ"
                          : "reserved"
                      }`}
                    >
                      {getSlotState(selectedSlotModal) === "available"
                        ? "Available (Green)"
                        : getSlotState(selectedSlotModal) === "occupied"
                        ? "Occupied (Red)"
                        : "Reserved (Blue)"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pw-detail-fields-grid">
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Zone</span>
                  <span className="pw-detail-value">{selectedSlotModal.zone}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Slot Type</span>
                  <span className="pw-detail-value">{selectedSlotModal.slot_type || "Standard"}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Hourly Rate</span>
                  <span className="pw-detail-value">₹{selectedSlotModal.hourly_rate || "50"} / hour</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Current State</span>
                  <span
                    className="pw-detail-value"
                    style={{
                      color:
                        getSlotState(selectedSlotModal) === "available"
                          ? "#16a34a"
                          : getSlotState(selectedSlotModal) === "occupied"
                          ? "#dc2626"
                          : "#2563eb"
                    }}
                  >
                    {getSlotState(selectedSlotModal).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-modal-close"
                onClick={() => setSelectedSlotModal(null)}
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

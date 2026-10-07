import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Car,
  Search,
  CheckCircle2,
  BookmarkCheck,
  X,
  Zap,
  Clock,
  RefreshCw,
  Layers,
  AlertTriangle,
  Wrench,
  BatteryCharging
} from "lucide-react";
import BikeTopView from "../../components/BikeTopView.jsx";
import Pagination from "../../components/Pagination.jsx";

export default function ParkingOccupancy({
  slots: propSlots,
  getSlotState: propGetSlotState,
  handleSlotStatusChange: propHandleSlotStatusChange,
  availableCount: propAvailableCount,
  occupiedCount: propOccupiedCount,
  reservedCount: propReservedCount,
  chargingCount: propChargingCount,
  maintenanceCount: propMaintenanceCount,
  totalCount: propTotalCount,
  onRefresh
}) {
  const [occupancyData, setOccupancyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [baySearch, setBaySearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [activeSessionSearch, setActiveSessionSearch] = useState("");
  const [sessionTypeFilter, setSessionTypeFilter] = useState("ALL");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionLimit, setSessionLimit] = useState(5);

  const fetchUnifiedOccupancy = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/occupancy`);
      const data = await res.json();
      if (data.success) {
        setOccupancyData(data);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnifiedOccupancy();
    const interval = setInterval(fetchUnifiedOccupancy, 20000);
    return () => clearInterval(interval);
  }, [fetchUnifiedOccupancy]);

  const rawSlots = occupancyData?.slots || propSlots || [];

  const getSlotState = useCallback(
    (slot) => {
      if (!slot) return "available";
      if (propGetSlotState) return propGetSlotState(slot);
      const st = (slot.status || "").toLowerCase();
      if (st === "charging") return "charging";
      if (st === "maintenance") return "maintenance";
      if (st === "reserved") return "reserved";
      if (st === "occupied") return "occupied";
      if (!slot.is_available) return "occupied";
      return "available";
    },
    [propGetSlotState]
  );

  const totalSlotsCount = occupancyData?.totalSlots ?? propTotalCount ?? rawSlots.length;
  const availableCount = occupancyData?.availableSlots ?? propAvailableCount ?? rawSlots.filter((s) => getSlotState(s) === "available").length;
  const occupiedCount = occupancyData?.occupiedSlots ?? propOccupiedCount ?? rawSlots.filter((s) => getSlotState(s) === "occupied").length;
  const reservedCount = occupancyData?.reservedSlots ?? propReservedCount ?? rawSlots.filter((s) => getSlotState(s) === "reserved").length;
  const chargingCount = occupancyData?.chargingSlots ?? propChargingCount ?? rawSlots.filter((s) => getSlotState(s) === "charging").length;
  const maintenanceCount = occupancyData?.maintenanceSlots ?? propMaintenanceCount ?? rawSlots.filter((s) => getSlotState(s) === "maintenance").length;

  const handleUpdateStatus = async (slot, newStatus) => {
    if (!slot) return;
    const isAvail = newStatus === "available";
    try {
      if (slot.is_ev || slot.raw_ev_id || String(slot.id).startsWith("ev-")) {
        const rawId = slot.raw_ev_id || String(slot.id).replace("ev-", "");
        const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots/${rawId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus })
        });
        const d = await res.json();
        if (d.success) {
          setActionMessage(`EV Slot ${slot.slot_number} status updated to ${newStatus}.`);
          setSelectedSlotModal((prev) => (prev ? { ...prev, status: newStatus, is_available: isAvail } : null));
          fetchUnifiedOccupancy();
          if (onRefresh) onRefresh();
        }
      } else {
        if (propHandleSlotStatusChange) {
          propHandleSlotStatusChange(slot.id, newStatus);
          setSelectedSlotModal((prev) => (prev ? { ...prev, status: newStatus, is_available: isAvail } : null));
        } else {
          const res = await fetch(`${API_BASE_URL}/api/admin/slots/${slot.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, is_available: isAvail })
          });
          const d = await res.json();
          if (d.success) {
            setActionMessage(`Slot ${slot.slot_number} status updated to ${newStatus}.`);
            setSelectedSlotModal((prev) => (prev ? { ...prev, status: newStatus, is_available: isAvail } : null));
          }
        }
        fetchUnifiedOccupancy();
        if (onRefresh) onRefresh();
      }
    } catch {
      setActionMessage("Failed to update slot status");
    }
    setTimeout(() => setActionMessage(""), 4000);
  };

  const filteredSlots = useMemo(() => {
    return rawSlots
      .filter((slot) => {
        const isEvSlot = Boolean(slot.is_ev || slot.raw_ev_id || String(slot.slot_number).startsWith("EV-"));
        const slotZone = isEvSlot ? "Zone EV" : slot.zone || "Zone A";

        const zoneMatch = selectedZone === "ALL" || slotZone === selectedZone || (selectedZone === "Zone EV" && isEvSlot);

        const q = baySearch.trim().toLowerCase();
        const queryMatch =
          !q ||
          (slot.slot_number || "").toLowerCase().includes(q) ||
          slotZone.toLowerCase().includes(q) ||
          (slot.slot_type || "").toLowerCase().includes(q) ||
          (slot.current_vehicle || "").toLowerCase().includes(q);

        const state = getSlotState(slot);
        const statusMatch = selectedStatusFilter === "ALL" || state === selectedStatusFilter.toLowerCase();

        return zoneMatch && queryMatch && statusMatch;
      })
      .sort((a, b) => {
        const isEvA = Boolean(a.is_ev || a.raw_ev_id || String(a.slot_number).startsWith("EV-"));
        const isEvB = Boolean(b.is_ev || b.raw_ev_id || String(b.slot_number).startsWith("EV-"));
        if (isEvA !== isEvB) {
          return isEvA ? 1 : -1;
        }
        const zoneA = a.zone || "";
        const zoneB = b.zone || "";
        if (zoneA !== zoneB) {
          return zoneA.localeCompare(zoneB);
        }
        return (a.slot_number || "").localeCompare(b.slot_number || "", undefined, {
          numeric: true,
          sensitivity: "base"
        });
      });
  }, [rawSlots, selectedZone, baySearch, selectedStatusFilter, getSlotState]);

  const unifiedSessions = useMemo(() => {
    const list = [];
    const activeVehicles = occupancyData?.activeVehicles || [];
    const evSessions = occupancyData?.evSessions || [];

    activeVehicles.forEach((v) => {
      const isEv = (v.status || "").toLowerCase() === "charging" || String(v.current_slot).toUpperCase().startsWith("EV");
      if (!isEv) {
        list.push({
          id: `std-${v.vehicle_number}-${v.current_slot}`,
          vehicle_number: v.vehicle_number,
          slot_number: v.current_slot,
          is_ev: false,
          customer_name: v.owner_name || "Customer",
          customer_email: v.owner_email || "—",
          start_time: v.created_at || v.entry_time,
          status: "Parked",
          energy_consumed: null,
          rate_or_fee: "₹50.00 / hr",
          type_label: "Standard Parking"
        });
      }
    });

    evSessions.forEach((s) => {
      const isAct = (s.session_status || "").toLowerCase() === "active";
      list.push({
        id: `ev-${s.id}`,
        vehicle_number: s.vehicle_number,
        slot_number: s.slot_number,
        is_ev: true,
        customer_name: s.customer_name || "Customer",
        customer_email: s.customer_email || "—",
        start_time: s.start_time || s.created_at,
        status: isAct ? "Charging" : s.session_status,
        energy_consumed: s.energy_consumed ? `${parseFloat(s.energy_consumed).toFixed(1)} kWh` : "Live",
        rate_or_fee: s.total_amount ? `₹${parseFloat(s.total_amount).toFixed(2)}` : `₹${s.charging_rate || 18}/kWh`,
        type_label: "EV Fast Charging"
      });
    });

    return list;
  }, [occupancyData]);

  const filteredSessions = useMemo(() => {
    return unifiedSessions.filter((sess) => {
      const q = activeSessionSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (sess.vehicle_number || "").toLowerCase().includes(q) ||
        (sess.slot_number || "").toLowerCase().includes(q) ||
        (sess.customer_name || "").toLowerCase().includes(q) ||
        (sess.customer_email || "").toLowerCase().includes(q);

      const matchesType =
        sessionTypeFilter === "ALL" ||
        (sessionTypeFilter === "EV" && sess.is_ev) ||
        (sessionTypeFilter === "STANDARD" && !sess.is_ev);

      return matchesSearch && matchesType;
    });
  }, [unifiedSessions, activeSessionSearch, sessionTypeFilter]);

  useEffect(() => {
    setSessionPage(1);
  }, [activeSessionSearch, sessionTypeFilter]);

  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * sessionLimit;
    return filteredSessions.slice(start, start + sessionLimit);
  }, [filteredSessions, sessionPage, sessionLimit]);

  return (
    <div className="pw-occupancy-view-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Layers size={22} style={{ color: "#0d9488" }} />
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
              Facility Occupancy (All 30 Bays)
            </h2>
          </div>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.84rem", color: "var(--text-secondary, #64748b)" }}>
            Unified real-time bay telemetry across 24 standard parking slots and 6 EV charging stations
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchUnifiedOccupancy();
            if (onRefresh) onRefresh();
          }}
          disabled={isLoading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #cbd5e1)",
            background: "var(--bg-card, #ffffff)",
            color: "var(--text-primary, #0f172a)",
            fontWeight: 700,
            fontSize: "0.82rem",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} style={{ color: "#0d9488" }} />
          <span>Refresh Live Map</span>
        </button>
      </div>

      {actionMessage && (
        <div style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid #bbf7d0", color: "#16a34a", padding: "10px 14px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
        gap: "12px",
        width: "100%",
        boxSizing: "border-box"
      }}>
        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Total Slots</span>
          <span className="pw-metric-value" style={{ fontSize: "1.45rem" }}>{totalSlotsCount}</span>
          <span className="pw-metric-trend positive" style={{ fontSize: "0.72rem", marginTop: "4px" }}>
            <span>24 Normal + 6 EV</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Available Slots</span>
          <span className="pw-metric-value" style={{ color: "#16a34a", fontSize: "1.45rem" }}>{availableCount}</span>
          <span className="pw-metric-trend positive" style={{ color: "#16a34a", fontSize: "0.72rem", marginTop: "4px" }}>
            <span>Free for Parking / EV</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Occupied Slots</span>
          <span className="pw-metric-value" style={{ color: "#dc2626", fontSize: "1.45rem" }}>{occupiedCount}</span>
          <span className="pw-metric-trend" style={{ color: "#dc2626", fontSize: "0.72rem", marginTop: "4px" }}>
            <span>Vehicles Parked</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Reserved Slots</span>
          <span className="pw-metric-value" style={{ color: "#2563eb", fontSize: "1.45rem" }}>{reservedCount}</span>
          <span className="pw-metric-trend positive" style={{ color: "#2563eb", fontSize: "0.72rem", marginTop: "4px" }}>
            <span>Pre-Booked Passes</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Charging EV</span>
          <span className="pw-metric-value" style={{ color: "#059669", fontSize: "1.45rem" }}>{chargingCount}</span>
          <span className="pw-metric-trend positive" style={{ color: "#059669", fontSize: "0.72rem", marginTop: "4px" }}>
            <span>Active Power Draw</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ padding: "12px 14px" }}>
          <span className="pw-metric-label">Maintenance EV</span>
          <span className="pw-metric-value" style={{ color: "#d97706", fontSize: "1.45rem" }}>{maintenanceCount}</span>
          <span className="pw-metric-trend" style={{ color: "#d97706", fontSize: "0.72rem", marginTop: "4px" }}>
            <span>Offline Servicing</span>
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div className="pw-occupancy-legend-chips" style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            <span
              className="pw-status-legend-pill avail"
              style={{ cursor: "pointer", background: selectedStatusFilter === "available" ? "#16a34a" : undefined, color: selectedStatusFilter === "available" ? "#ffffff" : undefined }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "available" ? "ALL" : "available")}
            >
              <CheckCircle2 size={13} />
              <span>Available ({availableCount})</span>
            </span>
            <span
              className="pw-status-legend-pill occ"
              style={{ cursor: "pointer", background: selectedStatusFilter === "occupied" ? "#dc2626" : undefined, color: selectedStatusFilter === "occupied" ? "#ffffff" : undefined }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "occupied" ? "ALL" : "occupied")}
            >
              <Car size={13} />
              <span>Occupied ({occupiedCount})</span>
            </span>
            <span
              className="pw-status-legend-pill reserved"
              style={{ cursor: "pointer", background: selectedStatusFilter === "reserved" ? "#2563eb" : undefined, color: selectedStatusFilter === "reserved" ? "#ffffff" : undefined }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "reserved" ? "ALL" : "reserved")}
            >
              <BookmarkCheck size={13} />
              <span>Reserved ({reservedCount})</span>
            </span>
            <span
              className="pw-status-legend-pill"
              style={{ cursor: "pointer", background: selectedStatusFilter === "charging" ? "#059669" : "#ecfdf5", color: selectedStatusFilter === "charging" ? "#ffffff" : "#059669", border: "1px solid #a7f3d0" }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "charging" ? "ALL" : "charging")}
            >
              <Zap size={13} />
              <span>Charging ({chargingCount})</span>
            </span>
            <span
              className="pw-status-legend-pill"
              style={{ cursor: "pointer", background: selectedStatusFilter === "maintenance" ? "#d97706" : "#fffbeb", color: selectedStatusFilter === "maintenance" ? "#ffffff" : "#b45309", border: "1px solid #fde68a" }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "maintenance" ? "ALL" : "maintenance")}
            >
              <Wrench size={13} />
              <span>Maintenance ({maintenanceCount})</span>
            </span>
          </div>

          <div className="pw-bay-search-box" style={{ minWidth: "220px" }}>
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search bay, vehicle, zone..."
              value={baySearch}
              onChange={(e) => setBaySearch(e.target.value)}
              className="pw-bay-search-input"
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div className="pw-zone-pill-filters" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {["ALL", "Zone A", "Zone B", "Zone C", "Zone D", "Zone EV"].map((z) => (
              <button
                key={z}
                type="button"
                className={`pw-zone-btn ${selectedZone === z ? "active" : ""}`}
                onClick={() => setSelectedZone(z)}
              >
                {z === "Zone D" ? "Zone D (Bikes)" : z === "Zone EV" ? "⚡ Zone EV (6 Chargers)" : z}
              </button>
            ))}
          </div>

          <div className="pw-zone-pill-filters" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {["ALL", "available", "occupied", "reserved", "charging", "maintenance"].map((st) => (
              <button
                key={st}
                type="button"
                className={`pw-zone-btn ${selectedStatusFilter === st ? "active" : ""}`}
                onClick={() => setSelectedStatusFilter(st)}
              >
                {st === "ALL" ? "All Statuses" : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: "12px",
        marginTop: "6px"
      }}>
        {filteredSlots.map((bay) => {
          const isEv = Boolean(bay.is_ev || bay.raw_ev_id || String(bay.slot_number).startsWith("EV-"));
          const state = getSlotState(bay);
          const isBike = bay.zone === "Zone D";

          let borderClr = "#e2e8f0";
          let bgClr = "var(--bg-card, #ffffff)";
          let statusText = "Free";

          if (state === "available") {
            borderClr = "#86efac";
            bgClr = isEv ? "#f0fdf4" : "var(--bg-card, #ffffff)";
            statusText = "Available";
          } else if (state === "occupied") {
            borderClr = "#fca5a5";
            bgClr = "#fef2f2";
            statusText = "Occupied";
          } else if (state === "reserved") {
            borderClr = "#93c5fd";
            bgClr = "#eff6ff";
            statusText = "Reserved";
          } else if (state === "charging") {
            borderClr = "#38bdf8";
            bgClr = "#f0f9ff";
            statusText = "Charging";
          } else if (state === "maintenance") {
            borderClr = "#fcd34d";
            bgClr = "#fffbeb";
            statusText = "Servicing";
          }

          return (
            <div
              key={bay.id || bay.slot_number}
              onClick={() => setSelectedSlotModal(bay)}
              style={{
                borderRadius: "10px",
                border: `1.5px solid ${borderClr}`,
                background: bgClr,
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "130px",
                cursor: "pointer",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                position: "relative"
              }}
              title={`Click to view/change status of bay ${bay.slot_number}`}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "var(--text-primary, #0f172a)" }}>
                  {bay.slot_number}
                </span>
                {isEv ? (
                  <span style={{
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "2px 5px",
                    borderRadius: "4px",
                    background: "#dcfce7",
                    color: "#059669",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "2px"
                  }}>
                    <Zap size={9} />
                    <span>EV</span>
                  </span>
                ) : (
                  <span style={{ fontSize: "0.65rem", color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>
                    {bay.zone || "Zone A"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0" }}>
                {isEv ? (
                  state === "charging" ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <BatteryCharging size={26} style={{ color: "#0284c7" }} />
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#0284c7" }}>
                        {bay.charging_power || "60 kW"}
                      </span>
                    </div>
                  ) : state === "maintenance" ? (
                    <Wrench size={24} style={{ color: "#d97706" }} />
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                      <Zap size={24} style={{ color: "#16a34a" }} />
                      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary, #64748b)" }}>
                        {bay.charging_power || "Fast"}
                      </span>
                    </div>
                  )
                ) : state === "occupied" ? (
                  isBike ? (
                    <BikeTopView isSelected={false} />
                  ) : (
                    <Car size={26} className="pw-car-icon red" />
                  )
                ) : state === "reserved" ? (
                  <BookmarkCheck size={24} className="pw-reserved-icon blue" />
                ) : (
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#16a34a" }}>Free</span>
                )}

                {bay.current_vehicle && (
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    marginTop: "4px",
                    background: "#0f172a",
                    color: "#ffffff",
                    padding: "1px 6px",
                    borderRadius: "4px"
                  }}>
                    {bay.current_vehicle}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color, #f1f5f9)", paddingTop: "6px" }}>
                <span style={{
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  color: state === "available" ? "#16a34a" : state === "occupied" ? "#dc2626" : state === "reserved" ? "#2563eb" : state === "charging" ? "#0284c7" : "#d97706"
                }}>
                  {statusText}
                </span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>
                  ₹{bay.hourly_rate || (isEv ? "18" : "50")}{isEv ? "/kWh" : "/hr"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
              Active Vehicles & Live Charging Sessions
            </h3>
            <p style={{ margin: "2px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
              Real-time feed of all vehicles parked in standard bays or plugged into EV charging ports
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <div className="pw-bay-search-box" style={{ minWidth: "180px" }}>
              <Search size={13} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search plate, bay, user..."
                value={activeSessionSearch}
                onChange={(e) => setActiveSessionSearch(e.target.value)}
                className="pw-bay-search-input"
                style={{ fontSize: "0.76rem" }}
              />
            </div>

            <select
              value={sessionTypeFilter}
              onChange={(e) => setSessionTypeFilter(e.target.value)}
              style={{
                fontSize: "0.76rem",
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--bg-card, #ffffff)",
                color: "var(--text-primary, #0f172a)",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Bay Types</option>
              <option value="STANDARD">Standard Parking</option>
              <option value="EV">EV Fast Charging</option>
            </select>
          </div>
        </div>

        <div className="pw-users-table-scroll-container" style={{ margin: 0, width: "100%", overflowX: "auto" }}>
          <div
            className="pw-users-header-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1fr 1.2fr 1.3fr 1.1fr 1fr 0.9fr 1fr",
              minWidth: "850px",
              padding: "10px 14px",
              fontWeight: 700,
              fontSize: "0.78rem"
            }}
          >
            <span>Vehicle Plate</span>
            <span>Bay / Slot</span>
            <span>Type</span>
            <span>Customer</span>
            <span>Start Time</span>
            <span style={{ textAlign: "center" }}>Status</span>
            <span>Energy</span>
            <span style={{ textAlign: "right" }}>Tariff / Fee</span>
          </div>

          <div className="pw-user-cards-stack" style={{ minWidth: "850px" }}>
            {paginatedSessions.length > 0 ? (
              paginatedSessions.map((sess) => {
                const startD = sess.start_time ? new Date(sess.start_time) : new Date();
                const startTimeStr = startD.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

                return (
                  <div
                    key={sess.id}
                    className="pw-user-card-box"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.3fr 1fr 1.2fr 1.3fr 1.1fr 1fr 0.9fr 1fr",
                      alignItems: "center",
                      minWidth: "850px",
                      padding: "10px 14px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex", fontSize: "0.78rem" }}>
                        {sess.is_ev ? <Zap size={11} style={{ color: "#059669" }} /> : <Car size={11} style={{ color: "#0d9488" }} />}
                        <span>{sess.vehicle_number}</span>
                      </span>
                    </div>

                    <div>
                      <span style={{
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        color: sess.is_ev ? "#059669" : "#0d9488",
                        background: sess.is_ev ? "#ecfdf5" : "var(--bg-sub, #f1f5f9)",
                        padding: "2px 8px",
                        borderRadius: "6px"
                      }}>
                        {sess.slot_number}
                      </span>
                    </div>

                    <div>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: sess.is_ev ? "#0284c7" : "var(--text-secondary, #64748b)"
                      }}>
                        {sess.type_label}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.80rem", color: "var(--text-primary, #0f172a)" }}>
                        {sess.customer_name}
                      </div>
                      <div style={{ fontSize: "0.70rem", color: "var(--text-secondary, #64748b)" }}>
                        {sess.customer_email}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.76rem", color: "var(--text-secondary, #64748b)" }}>
                      <Clock size={11} style={{ display: "inline", marginRight: "4px" }} />
                      {startTimeStr}
                    </div>

                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "12px",
                        background: sess.is_ev ? "rgba(2, 132, 199, 0.12)" : "rgba(220, 38, 38, 0.10)",
                        color: sess.is_ev ? "#0284c7" : "#dc2626"
                      }}>
                        {sess.status}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.80rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                      {sess.energy_consumed || "—"}
                    </div>

                    <div style={{ textAlign: "right", fontWeight: 800, color: "#0d9488", fontSize: "0.85rem" }}>
                      {sess.rate_or_fee}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                <Car size={32} style={{ opacity: 0.35, margin: "0 auto 8px" }} />
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600 }}>
                  No active vehicles or EV charging sessions matching your filter.
                </p>
              </div>
            )}
          </div>
        </div>

        {filteredSessions.length > 0 && (
          <Pagination
            page={sessionPage}
            limit={sessionLimit}
            total={filteredSessions.length}
            onPageChange={setSessionPage}
            onLimitChange={(newLimit) => {
              setSessionLimit(newLimit);
              setSessionPage(1);
            }}
            limitOptions={[5, 10, 25, 50]}
          />
        )}
      </div>

      {selectedSlotModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedSlotModal(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">
                  {selectedSlotModal.is_ev || String(selectedSlotModal.slot_number).startsWith("EV-") ? "EV Charging Station " : "Parking Bay "}
                  {selectedSlotModal.slot_number}
                </h3>
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
                        : getSlotState(selectedSlotModal) === "charging"
                        ? "#e0f2fe"
                        : getSlotState(selectedSlotModal) === "maintenance"
                        ? "#fef3c7"
                        : "#dbeafe",
                    color:
                      getSlotState(selectedSlotModal) === "available"
                        ? "#15803d"
                        : getSlotState(selectedSlotModal) === "occupied"
                        ? "#b91c1c"
                        : getSlotState(selectedSlotModal) === "charging"
                        ? "#0284c7"
                        : getSlotState(selectedSlotModal) === "maintenance"
                        ? "#b45309"
                        : "#1d4ed8"
                  }}
                >
                  {selectedSlotModal.slot_number}
                </div>

                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">
                    {selectedSlotModal.is_ev || String(selectedSlotModal.slot_number).startsWith("EV-") ? "EV Charger Bay" : "Parking Bay"}{" "}
                    {selectedSlotModal.slot_number}
                  </h4>
                  <div className="pw-detail-badges-row">
                    <span className="pw-role-badge customer">
                      {selectedSlotModal.zone || (selectedSlotModal.is_ev ? "Zone EV" : "Zone A")}
                    </span>
                    <span className="pw-tile-status-chip">
                      {getSlotState(selectedSlotModal).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pw-detail-fields-grid">
                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Zone</span>
                  <span className="pw-detail-value">{selectedSlotModal.zone || "Zone A"}</span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Bay Type</span>
                  <span className="pw-detail-value">
                    {selectedSlotModal.slot_type || (selectedSlotModal.is_ev ? "DC Fast Charger" : "Standard")}
                  </span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Rate</span>
                  <span className="pw-detail-value">
                    ₹{selectedSlotModal.hourly_rate || (selectedSlotModal.is_ev ? "18" : "50")}{" "}
                    {selectedSlotModal.is_ev ? "/ kWh" : "/ hour"}
                  </span>
                </div>

                <div className="pw-detail-field-card">
                  <span className="pw-detail-label">Power / Spec</span>
                  <span className="pw-detail-value">
                    {selectedSlotModal.charging_power || selectedSlotModal.power_kw ? `${selectedSlotModal.charging_power || selectedSlotModal.power_kw + " kW"} • ${selectedSlotModal.connector_type || "CCS2"}` : "Standard Bay"}
                  </span>
                </div>
              </div>

              <div className="pw-modal-activity-box">
                <span className="pw-activity-title">Change Bay Status:</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #86efac",
                      background: getSlotState(selectedSlotModal) === "available" ? "#16a34a" : "#f0fdf4",
                      color: getSlotState(selectedSlotModal) === "available" ? "#ffffff" : "#15803d",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      cursor: "pointer"
                    }}
                    onClick={() => handleUpdateStatus(selectedSlotModal, "available")}
                  >
                    Set Available
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #fca5a5",
                      background: getSlotState(selectedSlotModal) === "occupied" ? "#dc2626" : "#fef2f2",
                      color: getSlotState(selectedSlotModal) === "occupied" ? "#ffffff" : "#b91c1c",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      cursor: "pointer"
                    }}
                    onClick={() => handleUpdateStatus(selectedSlotModal, "occupied")}
                  >
                    Set Occupied
                  </button>

                  <button
                    type="button"
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1.5px solid #93c5fd",
                      background: getSlotState(selectedSlotModal) === "reserved" ? "#2563eb" : "#eff6ff",
                      color: getSlotState(selectedSlotModal) === "reserved" ? "#ffffff" : "#1d4ed8",
                      fontWeight: 700,
                      fontSize: "0.76rem",
                      cursor: "pointer"
                    }}
                    onClick={() => handleUpdateStatus(selectedSlotModal, "reserved")}
                  >
                    Set Reserved
                  </button>

                  {(selectedSlotModal.is_ev || String(selectedSlotModal.slot_number).startsWith("EV-")) && (
                    <>
                      <button
                        type="button"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid #38bdf8",
                          background: getSlotState(selectedSlotModal) === "charging" ? "#0284c7" : "#f0f9ff",
                          color: getSlotState(selectedSlotModal) === "charging" ? "#ffffff" : "#0284c7",
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          cursor: "pointer"
                        }}
                        onClick={() => handleUpdateStatus(selectedSlotModal, "charging")}
                      >
                        Set Charging
                      </button>

                      <button
                        type="button"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: "1.5px solid #fcd34d",
                          background: getSlotState(selectedSlotModal) === "maintenance" ? "#d97706" : "#fffbeb",
                          color: getSlotState(selectedSlotModal) === "maintenance" ? "#ffffff" : "#b45309",
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          cursor: "pointer"
                        }}
                        onClick={() => handleUpdateStatus(selectedSlotModal, "maintenance")}
                      >
                        Set Maintenance
                      </button>
                    </>
                  )}
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

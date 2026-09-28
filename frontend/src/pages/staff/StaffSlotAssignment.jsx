import { useState, useEffect } from "react";
import { CheckCircle2, Search, ArrowRight } from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";

export default function StaffSlotAssignment({ onNavigateToEntry }) {
  const [selectedZone, setSelectedZone] = useState("Zone A");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBay, setSelectedBay] = useState(null);
  const [statusActionMsg, setStatusActionMsg] = useState("");
  const [bays, setBays] = useState([]);

  const fetchBays = () => {
    Promise.all([
      fetch(`${API_BASE_URL}/api/parking-slots`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/api/admin/vehicles`).then((r) => r.json())
    ])
      .then(([slotsData, vehData]) => {
        if (slotsData.success && slotsData.slots) {
          const vehMap = {};
          if (vehData.success && vehData.vehicles) {
            vehData.vehicles.forEach((v) => {
              if (v.current_slot && v.status === "Parked") {
                vehMap[v.current_slot] = v;
              }
            });
          }
          setBays(
            slotsData.slots.map((s) => {
              const matchedVeh = vehMap[s.slot_number];
              return {
                id: s.id,
                slot: s.slot_number,
                zone: s.zone,
                type: s.slot_type || (s.slot_number.startsWith("D") ? "Bike" : s.slot_number.startsWith("C") ? "EV" : "Car"),
                status: s.status,
                vehicle: matchedVeh ? matchedVeh.vehicle_number : s.status === "available" ? null : "Assigned",
                parkedSince: matchedVeh ? "Active Session" : s.status === "reserved" ? "Reserved Booking" : s.status === "available" ? null : "Ongoing",
                user: matchedVeh ? matchedVeh.owner_name : s.status === "available" ? null : "Registered User"
              };
            })
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchBays();
  }, []);

  const handleToggleStatus = (slotNumber, newStatus) => {
    fetch(`${API_BASE_URL}/api/parking-slots/${encodeURIComponent(slotNumber)}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    })
      .then((res) => res.json())
      .then(() => {
        fetchBays();
        setStatusActionMsg(`Bay ${slotNumber} updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setStatusActionMsg(""), 3000);
        if (selectedBay && selectedBay.slot === slotNumber) {
          setSelectedBay((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
      })
      .catch(() => {});
  };

  const filteredBays = bays.filter((b) => {
    const matchesZone = b.zone === selectedZone;
    const matchesSearch =
      b.slot.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.vehicle && b.vehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.user && b.user.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesZone && matchesSearch;
  });

  const totalZoneBays = bays.filter((b) => b.zone === selectedZone).length;
  const availZoneBays = bays.filter((b) => b.zone === selectedZone && b.status === "available").length;
  const occZoneBays = bays.filter((b) => b.zone === selectedZone && b.status === "occupied").length;
  const resZoneBays = bays.filter((b) => b.zone === selectedZone && b.status === "reserved").length;

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">{selectedZone} Total Bays</span>
          <span className="pw-metric-value">{totalZoneBays}</span>
          <span className="pw-metric-trend positive">
            <span>Capacity</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Available Free Bays</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{availZoneBays}</span>
          <span className="pw-metric-trend positive">
            <span>Ready for Check-In</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Occupied Bays</span>
          <span className="pw-metric-value" style={{ color: "#dc2626" }}>{occZoneBays}</span>
          <span className="pw-metric-trend positive">
            <span>Parked Vehicles</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Reserved Advance Bays</span>
          <span className="pw-metric-value" style={{ color: "#0284c7" }}>{resZoneBays}</span>
          <span className="pw-metric-trend positive">
            <span>Hold for Customer</span>
          </span>
        </div>
      </div>

      {statusActionMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{statusActionMsg}</span>
        </div>
      )}

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {["Zone A", "Zone B", "Zone C", "Zone D"].map((z) => (
            <button
              key={z}
              type="button"
              className={`pw-filter-pill ${selectedZone === z ? "active" : ""}`}
              onClick={() => {
                setSelectedZone(z);
                setSelectedBay(null);
              }}
              style={{
                background: selectedZone === z ? "#0d9488" : "var(--bg-sub, #f1f5f9)",
                color: selectedZone === z ? "#ffffff" : "var(--text-secondary, #475569)",
                border: selectedZone === z ? "1px solid #0d9488" : "1px solid var(--border-color, #cbd5e1)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {z} ({z === "Zone A" ? "Cars" : z === "Zone B" ? "SUVs" : z === "Zone C" ? "EV Fast" : "Bikes"})
            </button>
          ))}
        </div>

        <div className="pw-search-box-pill">
          <Search size={14} className="pw-search-icon" />
          <input
            type="text"
            placeholder="Search bay, plate or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pw-pill-input"
          />
        </div>
      </div>

      <div className={`pw-slot-assignment-grid ${selectedBay ? "has-selected-bay" : ""}`}>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
              Live Bay Grid — {selectedZone}
            </h4>
            <div style={{ display: "flex", gap: "10px", fontSize: "0.74rem", fontWeight: 700 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#16a34a" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} /> Available
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#dc2626" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }} /> Occupied
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#0284c7" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0284c7" }} /> Reserved
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
            {filteredBays.map((bay) => {
              const isSel = selectedBay?.slot === bay.slot;
              const isAvail = bay.status === "available";
              const isOcc = bay.status === "occupied";
              

              return (
                <div
                  key={bay.slot}
                  onClick={() => setSelectedBay(bay)}
                  style={{
                    background: isSel ? "var(--bg-teal-sub, #f0fdfa)" : isAvail ? "var(--bg-sub, #f0fdf4)" : isOcc ? "var(--bg-sub, #fef2f2)" : "var(--bg-sub, #f0f9ff)",
                    border: isSel ? "2px solid #0d9488" : "1.5px solid var(--border-color, #bbf7d0)",
                    borderRadius: "10px",
                    padding: "14px 10px",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: isAvail ? "#15803d" : isOcc ? "#b91c1c" : "#0369a1" }}>
                    {bay.slot}
                  </div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, marginTop: "4px", color: isAvail ? "#16a34a" : isOcc ? "#dc2626" : "#0284c7", textTransform: "uppercase" }}>
                    {bay.status}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #94a3b8)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {bay.vehicle || "Free Bay"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedBay && (
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#0d9488" }}>{selectedBay.zone}</span>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 900, color: "var(--text-primary, #0f172a)", margin: "2px 0 0 0" }}>Bay {selectedBay.slot}</h4>
                </div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "999px", background: "var(--bg-sub, #f0fdf4)", color: selectedBay.status === "available" ? "#16a34a" : selectedBay.status === "occupied" ? "#dc2626" : "#0284c7" }}>
                  {selectedBay.status.toUpperCase()}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg-sub, #f8fafc)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "16px", fontSize: "0.82rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Vehicle Type:</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{selectedBay.type}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Parked Plate:</span>
                  <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{selectedBay.vehicle || "None (Available)"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Driver / User:</span>
                  <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{selectedBay.user || "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Parked Since:</span>
                  <span style={{ fontWeight: 700, color: "#0f766e" }}>{selectedBay.parkedSince || "N/A"}</span>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label className="pw-calc-label" style={{ marginBottom: "8px", display: "block" }}>Quick Status Override</label>
                <div className="pw-btn-trio-grid">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedBay.slot, "available")}
                    style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "8px 4px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}
                  >
                    Set Available
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedBay.slot, "occupied")}
                    style={{ background: "var(--bg-sub, #fef2f2)", border: "1px solid var(--border-color, #fecaca)", color: "#f87171", padding: "8px 4px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}
                  >
                    Set Occupied
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(selectedBay.slot, "reserved")}
                    style={{ background: "var(--bg-sub, #f0f9ff)", border: "1px solid var(--border-color, #bae6fd)", color: "#38bdf8", padding: "8px 4px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 800, cursor: "pointer" }}
                  >
                    Set Reserved
                  </button>
                </div>
              </div>
            </div>

            {selectedBay.status === "available" && onNavigateToEntry && (
              <button
                type="button"
                className="pw-calc-btn-submit"
                onClick={() => onNavigateToEntry(selectedBay.slot)}
                style={{ width: "100%", padding: "10px", fontSize: "0.85rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
              >
                <span>Check In Vehicle into Bay {selectedBay.slot}</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

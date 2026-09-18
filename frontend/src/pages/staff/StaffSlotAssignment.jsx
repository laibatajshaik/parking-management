import { useState } from "react";
import { CheckCircle2, Search, ArrowRight } from "lucide-react";

export default function StaffSlotAssignment({ onNavigateToEntry }) {
  const [selectedZone, setSelectedZone] = useState("Zone A");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBay, setSelectedBay] = useState(null);
  const [statusActionMsg, setStatusActionMsg] = useState("");

  const [bays, setBays] = useState([
    { id: 1, slot: "A-01", zone: "Zone A", type: "Car", status: "occupied", vehicle: "KA01 AB 1234", parkedSince: "10:15 AM", user: "Rahul Sharma" },
    { id: 2, slot: "A-02", zone: "Zone A", type: "Car", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 3, slot: "A-03", zone: "Zone A", type: "Car", status: "reserved", vehicle: "KA05 MN 4321", parkedSince: "Advance Booking", user: "Vikram Malhotra" },
    { id: 4, slot: "A-04", zone: "Zone A", type: "Car", status: "occupied", vehicle: "KA02 CD 5678", parkedSince: "09:30 AM", user: "Priya S" },
    { id: 5, slot: "A-05", zone: "Zone A", type: "Car", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 6, slot: "A-06", zone: "Zone A", type: "Car", status: "available", vehicle: null, parkedSince: null, user: null },

    { id: 7, slot: "B-01", zone: "Zone B", type: "SUV", status: "occupied", vehicle: "KA03 EF 9012", parkedSince: "08:45 AM", user: "Ananya D" },
    { id: 8, slot: "B-02", zone: "Zone B", type: "SUV", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 9, slot: "B-03", zone: "Zone B", type: "SUV", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 10, slot: "B-04", zone: "Zone B", type: "SUV", status: "occupied", vehicle: "KA04 GH 3456", parkedSince: "10:00 AM", user: "Rohan Verma" },
    { id: 11, slot: "B-05", zone: "Zone B", type: "SUV", status: "reserved", vehicle: "KA01 XY 7788", parkedSince: "Advance Booking", user: "Karan Johar" },
    { id: 12, slot: "B-06", zone: "Zone B", type: "SUV", status: "available", vehicle: null, parkedSince: null, user: null },

    { id: 13, slot: "C-01", zone: "Zone C", type: "EV", status: "occupied", vehicle: "KA51 EV 2024", parkedSince: "10:10 AM", user: "Nikhil Kamath" },
    { id: 14, slot: "C-02", zone: "Zone C", type: "EV", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 15, slot: "C-03", zone: "Zone C", type: "EV", status: "occupied", vehicle: "KA02 EV 9900", parkedSince: "09:15 AM", user: "Siddharth R" },
    { id: 16, slot: "C-04", zone: "Zone C", type: "EV", status: "available", vehicle: null, parkedSince: null, user: null },

    { id: 17, slot: "D-01", zone: "Zone D", type: "Bike", status: "occupied", vehicle: "KA01 BK 4455", parkedSince: "08:30 AM", user: "Ajay Kumar" },
    { id: 18, slot: "D-02", zone: "Zone D", type: "Bike", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 19, slot: "D-03", zone: "Zone D", type: "Bike", status: "available", vehicle: null, parkedSince: null, user: null },
    { id: 20, slot: "D-04", zone: "Zone D", type: "Bike", status: "occupied", vehicle: "KA04 TR 9876", parkedSince: "10:20 AM", user: "Deepak S" }
  ]);

  const handleToggleStatus = (slotNumber, newStatus) => {
    setBays(
      bays.map((b) =>
        b.slot === slotNumber
          ? {
              ...b,
              status: newStatus,
              vehicle: newStatus === "available" ? null : b.vehicle || "WALK-IN ASSIGNED",
              parkedSince: newStatus === "available" ? null : "Just Now"
            }
          : b
      )
    );
    setStatusActionMsg(`Bay ${slotNumber} updated to ${newStatus.toUpperCase()}`);
    setTimeout(() => setStatusActionMsg(""), 3000);
    if (selectedBay && selectedBay.slot === slotNumber) {
      setSelectedBay({ ...selectedBay, status: newStatus });
    }
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

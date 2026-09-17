import { useState } from "react";
import { MapPin, Search, Plus, Edit2, Trash2, X, Building } from "lucide-react";

export default function ParkingLocations() {
  const [locations, setLocations] = useState([
    {
      id: 1,
      code: "LOC-DTP",
      name: "Downtown Plaza Multi-Level",
      address: "MG Road, Central Business District, Bengaluru",
      totalSlots: 150,
      occupiedSlots: 88,
      zones: ["Zone A (Ground)", "Zone B (Basement 1)", "Zone C (EV VIP)", "Zone D (Bikes)"],
      activeStaff: 4,
      openingHours: "24/7 All Days",
      rateMultiplier: "1.0x (Standard)",
      status: "Operational"
    },
    {
      id: 2,
      code: "LOC-CMP",
      name: "City Mall Grand Parking",
      address: "Indiranagar 100ft Road, Bengaluru",
      totalSlots: 220,
      occupiedSlots: 165,
      zones: ["Zone A (Covered)", "Zone B (Open Air)", "Zone C (EV Fast)"],
      activeStaff: 6,
      openingHours: "08:00 AM - 11:30 PM",
      rateMultiplier: "1.2x (Mall Premium)",
      status: "Operational"
    },
    {
      id: 3,
      code: "LOC-APT",
      name: "Airport Terminal 2 Express Lot",
      address: "Kempegowda International Airport Rd, Devanahalli",
      totalSlots: 350,
      occupiedSlots: 290,
      zones: ["Zone A (VIP Express)", "Zone B (Long Stay)", "Zone C (EV Fast)", "Zone D (Two-Wheeler)"],
      activeStaff: 10,
      openingHours: "24/7 All Days",
      rateMultiplier: "1.5x (Airport Express)",
      status: "Operational"
    },
    {
      id: 4,
      code: "LOC-ITP",
      name: "Tech Park Campus Garage",
      address: "Outer Ring Road, Bellandur, Bengaluru",
      totalSlots: 180,
      occupiedSlots: 142,
      zones: ["Zone A (Corporate)", "Zone B (Visitors)", "Zone C (EV Green)"],
      activeStaff: 5,
      openingHours: "06:00 AM - 11:00 PM",
      rateMultiplier: "1.0x (Standard)",
      status: "Operational"
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingLocation, setEditingLocation] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    totalSlots: 100,
    openingHours: "24/7 All Days",
    rateMultiplier: "1.0x (Standard)",
    status: "Operational"
  });

  const filteredLocations = locations.filter((loc) => {
    const matchesSearch =
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || loc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingLocation(null);
    setFormData({
      name: "",
      code: `LOC-${Math.floor(100 + Math.random() * 900)}`,
      address: "",
      totalSlots: 100,
      openingHours: "24/7 All Days",
      rateMultiplier: "1.0x (Standard)",
      status: "Operational"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (loc) => {
    setModalMode("edit");
    setEditingLocation(loc);
    setFormData({
      name: loc.name,
      code: loc.code,
      address: loc.address,
      totalSlots: loc.totalSlots,
      openingHours: loc.openingHours,
      rateMultiplier: loc.rateMultiplier,
      status: loc.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setLocations(locations.filter((l) => l.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (modalMode === "create") {
      const newLoc = {
        id: Date.now(),
        code: formData.code,
        name: formData.name,
        address: formData.address,
        totalSlots: parseInt(formData.totalSlots, 10) || 100,
        occupiedSlots: 0,
        zones: ["Zone A", "Zone B"],
        activeStaff: 2,
        openingHours: formData.openingHours,
        rateMultiplier: formData.rateMultiplier,
        status: formData.status
      };
      setLocations([...locations, newLoc]);
    } else {
      setLocations(
        locations.map((l) =>
          l.id === editingLocation.id
            ? {
                ...l,
                name: formData.name,
                address: formData.address,
                totalSlots: parseInt(formData.totalSlots, 10) || l.totalSlots,
                openingHours: formData.openingHours,
                rateMultiplier: formData.rateMultiplier,
                status: formData.status
              }
            : l
        )
      );
    }
    setIsModalOpen(false);
  };

  const totalCapacity = locations.reduce((sum, l) => sum + l.totalSlots, 0);
  const totalOccupied = locations.reduce((sum, l) => sum + l.occupiedSlots, 0);
  const totalStaff = locations.reduce((sum, l) => sum + l.activeStaff, 0);

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Locations</span>
          <span className="pw-metric-value">{locations.length}</span>
          <span className="pw-metric-trend positive">
            <span>Operational Branches</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Parking Capacity</span>
          <span className="pw-metric-value">{totalCapacity}</span>
          <span className="pw-metric-trend positive">
            <span>Bays across all sites</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Live Occupancy</span>
          <span className="pw-metric-value">{totalOccupied}</span>
          <span className="pw-metric-trend positive">
            <span>{Math.round((totalOccupied / (totalCapacity || 1)) * 100)}% Overall Utilization</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Staff on Duty</span>
          <span className="pw-metric-value">{totalStaff}</span>
          <span className="pw-metric-trend positive">
            <span>Assigned Wardens</span>
          </span>
        </div>
      </div>

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, flexWrap: "wrap" }}>
          <div className="pw-search-box-pill" style={{ width: "300px" }}>
            <Search size={15} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search location name, code, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["All", "Operational", "Maintenance"].map((st) => (
              <button
                key={st}
                type="button"
                className={`pw-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
                style={{
                  background: statusFilter === st ? "#0f766e" : "#f1f5f9",
                  color: statusFilter === st ? "#ffffff" : "#475569",
                  border: statusFilter === st ? "1px solid #0f766e" : "1px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "5px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="pw-calc-btn-submit"
          onClick={handleOpenCreate}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "0.84rem" }}
        >
          <Plus size={16} />
          <span>Add New Location</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "18px" }}>
        {filteredLocations.map((loc) => {
          const occPct = Math.round((loc.occupiedSlots / (loc.totalSlots || 1)) * 100);
          return (
            <div
              key={loc.id}
              style={{
                background: "var(--bg-card, #ffffff)",
                borderRadius: "14px",
                border: "1px solid var(--border-color, #e2e8f0)",
                padding: "20px",
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "16px"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Building size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>{loc.name}</h4>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>{loc.code}</span>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: loc.status === "Operational" ? "var(--bg-teal-sub, #f0fdf4)" : "var(--bg-sub, #fef2f2)", color: loc.status === "Operational" ? "#16a34a" : "#dc2626", border: loc.status === "Operational" ? "1px solid var(--border-color, #bbf7d0)" : "1px solid var(--border-color, #fecaca)" }}>
                    {loc.status}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#64748b", marginBottom: "14px" }}>
                  <MapPin size={14} style={{ color: "#0f766e", flexShrink: 0 }} />
                  <span>{loc.address}</span>
                </div>

                <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "6px" }}>
                    <span style={{ color: "#334155" }}>Bay Utilization</span>
                    <span style={{ color: "#0f766e" }}>{loc.occupiedSlots} / {loc.totalSlots} ({occPct}%)</span>
                  </div>
                  <div style={{ height: "6px", background: "var(--border-color, #e2e8f0)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${occPct}%`, height: "100%", background: occPct > 85 ? "#ef4444" : occPct > 60 ? "#f59e0b" : "#10b981", borderRadius: "999px" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.78rem" }}>
                  <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>Operating Hours</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{loc.openingHours}</span>
                  </div>
                  <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "8px 10px", borderRadius: "6px" }}>
                    <span style={{ color: "#64748b", display: "block", fontSize: "0.7rem" }}>Active Staff</span>
                    <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{loc.activeStaff} Wardens</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                  {loc.zones.slice(0, 2).map((z, idx) => (
                    <span key={idx} style={{ fontSize: "0.68rem", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", padding: "2px 6px", borderRadius: "4px" }}>
                      {z}
                    </span>
                  ))}
                  {loc.zones.length > 2 && (
                    <span style={{ fontSize: "0.68rem", background: "var(--bg-sub, #f8fafc)", color: "#64748b", padding: "2px 6px", borderRadius: "4px" }}>
                      +{loc.zones.length - 2} more
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(loc)}
                    style={{ background: "var(--bg-sub, #f8fafc)", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#334155" }}
                    title="Edit Location"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(loc.id)}
                    style={{ background: "var(--bg-sub, #fef2f2)", border: "1px solid var(--border-color, #fecaca)", borderRadius: "6px", padding: "6px", cursor: "pointer", color: "#ef4444" }}
                    title="Delete Location"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
                {modalMode === "create" ? "Add New Parking Facility" : "Edit Parking Facility"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Facility Name</label>
                <input
                  type="text"
                  required
                  className="pw-calc-input"
                  placeholder="e.g. Downtown Plaza Garage"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Location Code</label>
                  <input
                    type="text"
                    required
                    className="pw-calc-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Total Bays</label>
                  <input
                    type="number"
                    required
                    className="pw-calc-input"
                    value={formData.totalSlots}
                    onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                  />
                </div>
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Address</label>
                <input
                  type="text"
                  required
                  className="pw-calc-input"
                  placeholder="e.g. MG Road, Bengaluru"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Operating Hours</label>
                  <input
                    type="text"
                    className="pw-calc-input"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                  />
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Status</label>
                  <select
                    className="pw-calc-input"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  className="pw-calc-btn-reset"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pw-calc-btn-submit"
                >
                  {modalMode === "create" ? "Create Facility" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

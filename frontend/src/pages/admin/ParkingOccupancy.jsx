import { useState } from "react";
import {
  Car,
  Search,
  CheckCircle2,
  BookmarkCheck,
  X
} from "lucide-react";
import BikeTopView from "../../components/BikeTopView.jsx";

export default function ParkingOccupancy({
  slots,
  getSlotState,
  handleSlotStatusChange,
  availableCount,
  occupiedCount,
  reservedCount
}) {
  const [baySearch, setBaySearch] = useState("");
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedSlotModal, setSelectedSlotModal] = useState(null);

  const filteredSlots = slots
    .filter((slot) => {
      const zoneMatch = selectedZone === "ALL" || slot.zone === selectedZone;
      const queryMatch =
        !baySearch ||
        slot.slot_number.toLowerCase().includes(baySearch.toLowerCase()) ||
        slot.zone.toLowerCase().includes(baySearch.toLowerCase());

      const slotState = getSlotState(slot);
      const statusMatch =
        selectedStatusFilter === "ALL" ||
        slotState === selectedStatusFilter.toLowerCase();

      return zoneMatch && queryMatch && statusMatch;
    })
    .sort((a, b) => {
      if (a.zone !== b.zone) {
        return a.zone.localeCompare(b.zone);
      }
      return a.slot_number.localeCompare(b.slot_number, undefined, {
        numeric: true,
        sensitivity: "base"
      });
    });

  return (
    <>
      <div className="pw-occupancy-view-card">
        <div className="pw-occupancy-toolbar">
          <div className="pw-occupancy-legend-chips">
            <span
              className="pw-status-legend-pill avail"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "available" ? "ALL" : "available")}
            >
              <CheckCircle2 size={13} />
              <span>Available ({availableCount}) - Green</span>
            </span>
            <span
              className="pw-status-legend-pill occ"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "occupied" ? "ALL" : "occupied")}
            >
              <Car size={13} />
              <span>Occupied ({occupiedCount}) - Red</span>
            </span>
            <span
              className="pw-status-legend-pill reserved"
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedStatusFilter(selectedStatusFilter === "reserved" ? "ALL" : "reserved")}
            >
              <BookmarkCheck size={13} />
              <span>Reserved ({reservedCount}) - Blue</span>
            </span>
          </div>

          <div className="pw-bay-search-box">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search bay or zone..."
              value={baySearch}
              onChange={(e) => setBaySearch(e.target.value)}
              className="pw-bay-search-input"
            />
          </div>
        </div>

        <div className="pw-occupancy-toolbar" style={{ marginTop: "-4px" }}>
          <div className="pw-zone-pill-filters">
            {["ALL", "Zone A", "Zone B", "Zone C", "Zone D"].map((zone) => (
              <button
                key={zone}
                type="button"
                className={`pw-zone-btn ${selectedZone === zone ? "active" : ""}`}
                onClick={() => setSelectedZone(zone)}
              >
                {zone === "Zone D" ? "Zone D (Bikes)" : zone}
              </button>
            ))}
          </div>

          <div className="pw-zone-pill-filters">
            {["ALL", "available", "occupied", "reserved"].map((st) => (
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

        <div className="pw-24-bays-grid">
          {filteredSlots.map((bay) => {
            const state = getSlotState(bay);
            const isBike = bay.zone === "Zone D";
            return (
              <div
                key={bay.id}
                className={`pw-bay-tile ${state}`}
                onClick={() => setSelectedSlotModal(bay)}
                style={{ cursor: "pointer" }}
                title={`Click to view/change status of slot ${bay.slot_number}`}
              >
                <div className="pw-bay-tile-head">
                  <span className="pw-bay-tile-num">{bay.slot_number}</span>
                  <span className="pw-bay-tile-zone">{bay.zone}</span>
                </div>

                <div className="pw-bay-tile-body">
                  {state === "available" && (
                    <span className="pw-tile-avail-label">Available</span>
                  )}

                  {state === "occupied" && (
                    isBike ? (
                      <BikeTopView isSelected={false} />
                    ) : (
                      <Car size={30} className="pw-car-icon red" />
                    )
                  )}

                  {state === "reserved" && (
                    <BookmarkCheck size={28} className="pw-reserved-icon blue" />
                  )}
                </div>

                <div className="pw-bay-tile-foot">
                  <span className={`pw-tile-status-chip ${state === "available" ? "avail" : state === "occupied" ? "occ" : "reserved"}`}>
                    {state === "available" ? "Free" : state === "occupied" ? "Occupied" : "Reserved"}
                  </span>
                  <span className="pw-tile-rate">₹{bay.hourly_rate || "50"}/hr</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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

              <div className="pw-modal-activity-box">
                <span className="pw-activity-title">Change Slot Status:</span>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #86efac",
                      background: getSlotState(selectedSlotModal) === "available" ? "#16a34a" : "#f0fdf4",
                      color: getSlotState(selectedSlotModal) === "available" ? "#ffffff" : "#15803d",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      handleSlotStatusChange(selectedSlotModal.slot_number, "available");
                      setSelectedSlotModal({ ...selectedSlotModal, status: "available", is_available: true });
                    }}
                  >
                    Set Available (Green)
                  </button>

                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #fca5a5",
                      background: getSlotState(selectedSlotModal) === "occupied" ? "#dc2626" : "#fef2f2",
                      color: getSlotState(selectedSlotModal) === "occupied" ? "#ffffff" : "#b91c1c",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      handleSlotStatusChange(selectedSlotModal.slot_number, "occupied");
                      setSelectedSlotModal({ ...selectedSlotModal, status: "occupied", is_available: false });
                    }}
                  >
                    Set Occupied (Red)
                  </button>

                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid #93c5fd",
                      background: getSlotState(selectedSlotModal) === "reserved" ? "#2563eb" : "#eff6ff",
                      color: getSlotState(selectedSlotModal) === "reserved" ? "#ffffff" : "#1d4ed8",
                      fontWeight: "700",
                      fontSize: "0.78rem",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                      handleSlotStatusChange(selectedSlotModal.slot_number, "reserved");
                      setSelectedSlotModal({ ...selectedSlotModal, status: "reserved", is_available: false });
                    }}
                  >
                    Set Reserved (Blue)
                  </button>
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
    </>
  );
}

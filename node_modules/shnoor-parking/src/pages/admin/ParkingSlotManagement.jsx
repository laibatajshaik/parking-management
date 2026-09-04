import { useState } from "react";
import {
  Car,
  Search,
  Plus,
  Eye,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle
} from "lucide-react";

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

  const filteredSlotManagerSlots = slots.filter((slot) => {
    const query = (slotSearch || "").toLowerCase();
    const matchesSearch =
      !query ||
      slot.slot_number.toLowerCase().includes(query) ||
      slot.zone.toLowerCase().includes(query) ||
      (slot.slot_type && slot.slot_type.toLowerCase().includes(query));

    const matchesZone = slotZoneFilter === "ALL" || slot.zone === slotZoneFilter;
    const slotState = getSlotState(slot);
    const matchesStatus = slotStatusFilter === "ALL" || slotState === slotStatusFilter.toLowerCase();
    const matchesType = slotTypeFilter === "ALL" || (slot.slot_type || "Standard").toLowerCase() === slotTypeFilter.toLowerCase();

    return matchesSearch && matchesZone && matchesStatus && matchesType;
  });

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setIsAddingSlot(true);
    setStatusActionMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/slots", {
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
      const res = await fetch(`http://localhost:5000/api/admin/slots/${editingSlot.id}`, {
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
      const res = await fetch(`http://localhost:5000/api/admin/slots/${slotToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setIsDeletingSlot(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Slot ${slotToDelete.slot_number} deleted successfully`);
        setSlotToDelete(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchDashboardData();
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
            onChange={(e) => setSlotSearch(e.target.value)}
            className="pw-user-search-input"
          />
          {slotSearch && (
            <button
              type="button"
              className="pw-clear-search-btn"
              onClick={() => setSlotSearch("")}
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
              onChange={(e) => setSlotZoneFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Zones</option>
              <option value="Zone A">Zone A</option>
              <option value="Zone B">Zone B</option>
              <option value="Zone C">Zone C</option>
              <option value="Zone D">Zone D</option>
            </select>
          </div>

          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Type:</span>
            <select
              value={slotTypeFilter}
              onChange={(e) => setSlotTypeFilter(e.target.value)}
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
              onChange={(e) => setSlotStatusFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

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

      <div className="pw-users-header-row">
        <span style={{ minWidth: "170px" }}>Slot Bay & Zone</span>
        <span style={{ minWidth: "140px" }}>Slot Type</span>
        <span style={{ minWidth: "120px" }}>Hourly Rate</span>
        <span style={{ minWidth: "140px" }}>Current Status</span>
        <span style={{ marginLeft: "auto", textAlign: "right" }}>Actions</span>
      </div>

      <div className="pw-user-cards-stack">
        {filteredSlotManagerSlots.length > 0 ? (
          filteredSlotManagerSlots.map((s) => {
            const state = getSlotState(s);
            const typeKey = (s.slot_type || "Standard").toLowerCase().includes("vip") ? "vip" : (s.slot_type || "").toLowerCase().includes("bike") ? "bike" : "standard";

            return (
              <div key={s.id} className="pw-user-card-box">
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

                <div style={{ minWidth: "140px" }}>
                  <span className={`pw-slot-type-badge ${typeKey}`}>
                    {s.slot_type || "Standard"}
                  </span>
                </div>

                <div className="pw-user-card-date-col">
                  <span className="pw-user-col-label">Hourly Rate</span>
                  <span className="pw-user-col-value">₹{s.hourly_rate || "50"}/hr</span>
                </div>

                <div style={{ minWidth: "140px" }}>
                  <span
                    className={`pw-tile-status-chip ${state === "available" ? "avail" : state === "occupied" ? "occ" : "reserved"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      const nextStatus = state === "available" ? "occupied" : state === "occupied" ? "reserved" : "available";
                      handleSlotStatusChange(s.slot_number, nextStatus);
                    }}
                    title="Click to cycle status"
                  >
                    {state === "available" ? "🟢 Free" : state === "occupied" ? "🔴 Occupied" : "🔵 Reserved"}
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

      <div className="pw-users-table-footer">
        <span>Showing {filteredSlotManagerSlots.length} of {slots.length} total parking slots</span>
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

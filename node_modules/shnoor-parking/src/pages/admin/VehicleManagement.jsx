import { useState } from "react";
import {
  Car,
  Bike,
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  CheckCircle,
  Mail,
  Phone,
  History
} from "lucide-react";

export default function VehicleManagement({
  vehiclesList,
  slots,
  fetchVehicles,
  formatDate,
  setStatusActionMessage
}) {
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("ALL");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("ALL");

  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [addVehicleFormData, setAddVehicleFormData] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    model: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    status: "Parked",
    current_slot: "A-01"
  });

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editVehicleFormData, setEditVehicleFormData] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    model: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    status: "Parked",
    current_slot: "A-01"
  });

  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [vehicleForHistory, setVehicleForHistory] = useState(null);
  const [vehicleHistoryList, setVehicleHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const filteredVehicles = vehiclesList.filter((veh) => {
    const query = (vehicleSearch || "").toLowerCase();
    const matchesSearch =
      !query ||
      veh.vehicle_number.toLowerCase().includes(query) ||
      veh.owner_name.toLowerCase().includes(query) ||
      veh.owner_email.toLowerCase().includes(query) ||
      (veh.model && veh.model.toLowerCase().includes(query));

    const matchesType =
      vehicleTypeFilter === "ALL" ||
      (veh.vehicle_type || "").toLowerCase() === vehicleTypeFilter.toLowerCase();

    const matchesStatus =
      vehicleStatusFilter === "ALL" ||
      (veh.status || "Parked").toLowerCase() === vehicleStatusFilter.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  const fetchVehicleHistory = (vehicle) => {
    setVehicleForHistory(vehicle);
    setIsLoadingHistory(true);
    fetch(`http://localhost:5000/api/admin/vehicles/${encodeURIComponent(vehicle.vehicle_number)}/history`)
      .then((res) => res.json())
      .then((data) => {
        setIsLoadingHistory(false);
        if (data.success && data.history) {
          setVehicleHistoryList(data.history);
        } else {
          setVehicleHistoryList([]);
        }
      })
      .catch(() => {
        setIsLoadingHistory(false);
        setVehicleHistoryList([]);
      });
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setIsAddingVehicle(true);
    setStatusActionMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addVehicleFormData)
      });
      const data = await res.json();
      setIsAddingVehicle(false);

      if (res.ok && data.success) {
        setStatusActionMessage(data.message || `Vehicle ${addVehicleFormData.vehicle_number} registered successfully & confirmation email sent to ${addVehicleFormData.owner_email}`);
        setIsAddVehicleModalOpen(false);
        setAddVehicleFormData({
          vehicle_number: "",
          vehicle_type: "Car",
          model: "",
          owner_name: "",
          owner_email: "",
          owner_phone: "",
          status: "Parked",
          current_slot: "A-01"
        });
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchVehicles();
      } else {
        setStatusActionMessage(data.error || "Failed to register vehicle");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsAddingVehicle(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const openEditVehicleModal = (veh) => {
    setEditingVehicle(veh);
    setEditVehicleFormData({
      vehicle_number: veh.vehicle_number || "",
      vehicle_type: veh.vehicle_type || "Car",
      model: veh.model || "",
      owner_name: veh.owner_name || "",
      owner_email: veh.owner_email || "",
      owner_phone: veh.owner_phone || "+91 98765 43210",
      status: veh.status || "Parked",
      current_slot: veh.current_slot || "A-01"
    });
  };

  const handleSaveVehicleEdit = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;
    setIsSavingVehicle(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/admin/vehicles/${editingVehicle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editVehicleFormData)
      });
      const data = await res.json();
      setIsSavingVehicle(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Vehicle ${editVehicleFormData.vehicle_number} updated successfully`);
        setEditingVehicle(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchVehicles();
      } else {
        setStatusActionMessage(data.error || "Failed to update vehicle");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsSavingVehicle(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleConfirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setIsDeletingVehicle(true);
    setStatusActionMessage("");

    try {
      const res = await fetch(`http://localhost:5000/api/admin/vehicles/${vehicleToDelete.id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setIsDeletingVehicle(false);

      if (res.ok && data.success) {
        setStatusActionMessage(`Vehicle ${vehicleToDelete.vehicle_number} deleted successfully`);
        setVehicleToDelete(null);
        setTimeout(() => setStatusActionMessage(""), 3500);
        fetchVehicles();
      } else {
        setStatusActionMessage(data.error || "Failed to delete vehicle");
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } catch {
      setIsDeletingVehicle(false);
      setStatusActionMessage("Error connecting to server");
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const parkedVehCount = vehiclesList.filter((v) => (v.status || "").toLowerCase() === "parked").length;
  const checkedOutVehCount = vehiclesList.filter((v) => (v.status || "").toLowerCase() === "checked out").length;

  return (
    <div className="pw-users-module-card">
      <div className="pw-metrics-four-grid" style={{ marginBottom: "6px" }}>
        <div className="pw-metric-card">
          <span className="pw-metric-label">Registered Vehicles</span>
          <span className="pw-metric-value">{vehiclesList.length}</span>
          <span className="pw-metric-trend positive">
            <span>Cars, SUVs, EVs, Bikes</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Currently Parked</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{parkedVehCount}</span>
          <span className="pw-metric-trend positive" style={{ color: "#16a34a" }}>
            <span>Active in bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Checked Out</span>
          <span className="pw-metric-value" style={{ color: "#64748b" }}>{checkedOutVehCount}</span>
          <span className="pw-metric-trend" style={{ color: "#64748b" }}>
            <span>Exit recorded</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Pass Holders</span>
          <span className="pw-metric-value">{vehiclesList.length}</span>
        </div>
      </div>

      <div className="pw-users-toolbar">
        <div className="pw-user-search-wrapper">
          <Search size={14} className="pw-search-icon" />
          <input
            type="text"
            placeholder="Search plate, owner, model, or email..."
            value={vehicleSearch}
            onChange={(e) => setVehicleSearch(e.target.value)}
            className="pw-user-search-input"
          />
          {vehicleSearch && (
            <button
              type="button"
              className="pw-clear-search-btn"
              onClick={() => setVehicleSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pw-user-filters-group">
          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Type:</span>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Types</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Bike">Bike</option>
              <option value="EV">EV</option>
            </select>
          </div>

          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Status:</span>
            <select
              value={vehicleStatusFilter}
              onChange={(e) => setVehicleStatusFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Status</option>
              <option value="Parked">Parked</option>
              <option value="Checked Out">Checked Out</option>
            </select>
          </div>

          <button
            type="button"
            className="pw-btn-add-user"
            onClick={() => {
              setAddVehicleFormData({
                vehicle_number: "",
                vehicle_type: "Car",
                model: "",
                owner_name: "",
                owner_email: "",
                owner_phone: "",
                status: "Parked",
                current_slot: "A-01"
              });
              setIsAddVehicleModalOpen(true);
            }}
          >
            <Plus size={15} />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      <div className="pw-users-table-scroll-container">
        <div className="pw-users-header-row pw-mgmt-grid-row pw-veh-mgmt-grid">
          <span>Vehicle Plate & Model</span>
          <span>Type</span>
          <span>Owner / Customer</span>
          <span>Registration Date</span>
          <span>Current Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="pw-user-cards-stack">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((v) => {
              const isParked = (v.status || "").toLowerCase() === "parked";
              const typeKey = (v.vehicle_type || "Car").toLowerCase();

              return (
                <div key={v.id} className="pw-user-card-box pw-mgmt-grid-row pw-veh-mgmt-grid">
                  <div className="pw-veh-plate-col">
                    <div>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                        {typeKey === "bike" ? <Bike size={13} /> : <Car size={13} />}
                        <span>{v.vehicle_number}</span>
                      </span>
                    </div>
                    <div className="pw-veh-model-sub">
                      {v.model || "Vehicle"}
                    </div>
                  </div>

                  <div>
                    <span className={`pw-veh-type-badge ${typeKey}`}>
                      {v.vehicle_type || "Car"}
                    </span>
                  </div>

                  <div className="pw-user-card-contact-col">
                    <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                      {v.owner_name}
                    </div>
                    <div className="pw-contact-cell">
                      <Mail size={11} className="pw-cell-icon" />
                      <span>{v.owner_email}</span>
                    </div>
                    <div className="pw-contact-cell">
                      <Phone size={11} className="pw-cell-icon" />
                      <span>{v.owner_phone || "+91 98765 43210"}</span>
                    </div>
                  </div>

                  <div className="pw-user-card-date-col">
                    <span className="pw-user-col-label">Registered</span>
                    <span className="pw-user-col-value">{formatDate(v.created_at)}</span>
                  </div>

                  <div>
                    <span className={`pw-veh-status-pill ${isParked ? "parked" : "checkedout"}`}>
                      <span className="pw-status-dot"></span>
                      {isParked ? `Parked (${v.current_slot || "Bay"})` : "Checked Out"}
                    </span>
                  </div>

                  <div className="pw-user-card-actions-col">
                    <button
                      type="button"
                      className="pw-btn-action-history"
                      onClick={() => fetchVehicleHistory(v)}
                      title="View Parking Sessions History"
                    >
                      <History size={13} />
                      <span>History</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-edit"
                      onClick={() => openEditVehicleModal(v)}
                      title="Edit Vehicle Details"
                    >
                      <Edit3 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-delete"
                      onClick={() => setVehicleToDelete(v)}
                      title="Delete Vehicle Record"
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
                <h4>No vehicles match your search or filter</h4>
                <p>Try searching another license plate number or clearing filters.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pw-users-table-footer">
        <span>Showing {filteredVehicles.length} of {vehiclesList.length} total registered vehicles</span>
      </div>

      {vehicleForHistory && (
        <div className="pw-modal-backdrop" onClick={() => setVehicleForHistory(null)}>
          <div className="pw-user-detail-modal" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Vehicle Parking History: {vehicleForHistory.vehicle_number}</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setVehicleForHistory(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-detail-user-profile-header">
                <span className="pw-veh-plate-badge" style={{ fontSize: "0.95rem", padding: "6px 14px" }}>
                  <Car size={16} />
                  <span>{vehicleForHistory.vehicle_number}</span>
                </span>
                <div className="pw-detail-user-meta">
                  <h4 className="pw-detail-user-name">{vehicleForHistory.model} ({vehicleForHistory.vehicle_type})</h4>
                  <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
                    Owner: <strong>{vehicleForHistory.owner_name}</strong> ({vehicleForHistory.owner_email})
                  </span>
                </div>
              </div>

              {isLoadingHistory ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                  Loading parking session history...
                </div>
              ) : vehicleHistoryList.length > 0 ? (
                <div className="pw-table-scroll">
                  <table className="pw-custom-table">
                    <thead>
                      <tr>
                        <th>Slot</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Duration</th>
                        <th>Fee</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicleHistoryList.map((h) => (
                        <tr key={h.id}>
                          <td><strong>Bay {h.slot_number}</strong></td>
                          <td>{formatDate(h.entry_time)}</td>
                          <td>{h.exit_time ? formatDate(h.exit_time) : "Active Now"}</td>
                          <td>{h.duration || "2h 00m"}</td>
                          <td><strong>{h.fee || "₹100.00"}</strong></td>
                          <td>
                            <span className={`pw-status-pill ${(h.status || "Completed").toLowerCase() === "parked" ? "active" : "completed"}`}>
                              {h.status || "Completed"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                  No past parking history records found for this vehicle.
                </div>
              )}
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-modal-close"
                onClick={() => setVehicleForHistory(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddVehicleModalOpen && (
        <div className="pw-modal-backdrop" onClick={() => setIsAddVehicleModalOpen(false)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Register New Vehicle</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleAddVehicle}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-number">Vehicle Number (Plate)</label>
                    <input
                      id="add-veh-number"
                      type="text"
                      className="pw-form-input"
                      placeholder="e.g. KA05 MN 9999"
                      value={addVehicleFormData.vehicle_number}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, vehicle_number: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-type">Vehicle Type</label>
                    <select
                      id="add-veh-type"
                      className="pw-form-input"
                      value={addVehicleFormData.vehicle_type}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, vehicle_type: e.target.value })}
                    >
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                      <option value="Bike">Bike</option>
                      <option value="EV">EV</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-model">Vehicle Model</label>
                    <input
                      id="add-veh-model"
                      type="text"
                      className="pw-form-input"
                      placeholder="e.g. Honda City"
                      value={addVehicleFormData.model}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, model: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-owner">Owner Name</label>
                    <input
                      id="add-veh-owner"
                      type="text"
                      className="pw-form-input"
                      value={addVehicleFormData.owner_name}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, owner_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-email">Owner Email</label>
                    <input
                      id="add-veh-email"
                      type="email"
                      className="pw-form-input"
                      value={addVehicleFormData.owner_email}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, owner_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-phone">Owner Phone</label>
                    <input
                      id="add-veh-phone"
                      type="text"
                      className="pw-form-input"
                      value={addVehicleFormData.owner_phone}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, owner_phone: e.target.value })}
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-status">Current Status</label>
                    <select
                      id="add-veh-status"
                      className="pw-form-input"
                      value={addVehicleFormData.status}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, status: e.target.value })}
                    >
                      <option value="Parked">Parked</option>
                      <option value="Checked Out">Checked Out</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="add-veh-slot">Assigned Slot</label>
                    <select
                      id="add-veh-slot"
                      className="pw-form-input"
                      value={addVehicleFormData.current_slot}
                      onChange={(e) => setAddVehicleFormData({ ...addVehicleFormData, current_slot: e.target.value })}
                    >
                      {slots.map((s) => (
                        <option key={s.id} value={s.slot_number}>Bay {s.slot_number} ({s.zone})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setIsAddVehicleModalOpen(false)}
                  disabled={isAddingVehicle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isAddingVehicle}
                >
                  <Plus size={15} />
                  <span>{isAddingVehicle ? "Registering..." : "Register Vehicle"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVehicle && (
        <div className="pw-modal-backdrop" onClick={() => setEditingVehicle(null)}>
          <div className="pw-user-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Edit Vehicle: {editingVehicle.vehicle_number}</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setEditingVehicle(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveVehicleEdit}>
              <div className="pw-modal-body">
                <div className="pw-detail-fields-grid">
                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-number">Vehicle Number</label>
                    <input
                      id="edit-veh-number"
                      type="text"
                      className="pw-form-input"
                      value={editVehicleFormData.vehicle_number}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, vehicle_number: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-type">Vehicle Type</label>
                    <select
                      id="edit-veh-type"
                      className="pw-form-input"
                      value={editVehicleFormData.vehicle_type}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, vehicle_type: e.target.value })}
                    >
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                      <option value="Bike">Bike</option>
                      <option value="EV">EV</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-model">Vehicle Model</label>
                    <input
                      id="edit-veh-model"
                      type="text"
                      className="pw-form-input"
                      value={editVehicleFormData.model}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, model: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-owner">Owner Name</label>
                    <input
                      id="edit-veh-owner"
                      type="text"
                      className="pw-form-input"
                      value={editVehicleFormData.owner_name}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, owner_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-email">Owner Email</label>
                    <input
                      id="edit-veh-email"
                      type="email"
                      className="pw-form-input"
                      value={editVehicleFormData.owner_email}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, owner_email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-phone">Owner Phone</label>
                    <input
                      id="edit-veh-phone"
                      type="text"
                      className="pw-form-input"
                      value={editVehicleFormData.owner_phone}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, owner_phone: e.target.value })}
                    />
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-status">Status</label>
                    <select
                      id="edit-veh-status"
                      className="pw-form-input"
                      value={editVehicleFormData.status}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, status: e.target.value })}
                    >
                      <option value="Parked">Parked</option>
                      <option value="Checked Out">Checked Out</option>
                    </select>
                  </div>

                  <div className="pw-detail-field-card">
                    <label className="pw-detail-label" htmlFor="edit-veh-slot">Current Slot</label>
                    <select
                      id="edit-veh-slot"
                      className="pw-form-input"
                      value={editVehicleFormData.current_slot}
                      onChange={(e) => setEditVehicleFormData({ ...editVehicleFormData, current_slot: e.target.value })}
                    >
                      {slots.map((s) => (
                        <option key={s.id} value={s.slot_number}>Bay {s.slot_number} ({s.zone})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pw-modal-footer">
                <button
                  type="button"
                  className="pw-btn-cancel-delete"
                  onClick={() => setEditingVehicle(null)}
                  disabled={isSavingVehicle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="pw-btn-modal-save"
                  disabled={isSavingVehicle}
                >
                  <CheckCircle size={15} />
                  <span>{isSavingVehicle ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vehicleToDelete && (
        <div className="pw-modal-backdrop" onClick={() => setVehicleToDelete(null)}>
          <div className="pw-confirm-delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pw-delete-modal-head">
              <div className="pw-delete-icon-circle">
                <AlertTriangle size={26} />
              </div>
              <h3 className="pw-delete-modal-title">Delete Vehicle Record</h3>
              <p className="pw-delete-modal-desc">
                Are you sure you want to delete Vehicle <strong>{vehicleToDelete.vehicle_number}</strong> ({vehicleToDelete.model}, Owner: {vehicleToDelete.owner_name})? This action is permanent.
              </p>
            </div>

            <div className="pw-delete-modal-actions">
              <button
                type="button"
                className="pw-btn-cancel-delete"
                onClick={() => setVehicleToDelete(null)}
                disabled={isDeletingVehicle}
              >
                Cancel
              </button>

              <button
                type="button"
                className="pw-btn-confirm-delete"
                onClick={handleConfirmDeleteVehicle}
                disabled={isDeletingVehicle}
              >
                <Trash2 size={14} />
                <span>{isDeletingVehicle ? "Deleting..." : "Yes, Delete Vehicle"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

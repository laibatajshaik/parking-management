import { useState, useEffect } from "react";
import { Car, Bike, LogIn, Search, CheckCircle2, X, Printer, Download, Layers, RefreshCw, Phone, ShieldCheck, CheckCircle } from "lucide-react";

export default function VehicleEntry({ setStatusActionMessage }) {
  const [entries, setEntries] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCurrentFormattedTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState({
    vehicle_number: "",
    vehicle_type: "Car",
    model: "Hyundai Creta",
    owner_name: "Laiba",
    owner_phone: "+91 98765 43210",
    owner_email: "customer@shnoor.com",
    entry_time: getCurrentFormattedTime(),
    slot_number: ""
  });

  const [entryStatusState, setEntryStatusState] = useState("Ready for Check-in");
  const [selectedPassModal, setSelectedPassModal] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchSlotsAndEntries = async () => {
    setIsLoading(true);
    try {
      const [slotsRes, entriesRes] = await Promise.all([
        fetch("http://localhost:5000/api/parking-slots"),
        fetch("http://localhost:5000/api/staff/vehicle-entries")
      ]);

      const slotsData = await slotsRes.json();
      const entriesData = await entriesRes.json();

      if (slotsData.success && slotsData.slots) {
        setAllSlots(slotsData.slots);
        const free = slotsData.slots.filter(
          (s) => s.status === "available" || (s.is_available && s.status !== "reserved")
        );
        setAvailableSlots(free);

        if (free.length > 0 && !formData.slot_number) {
          setFormData((prev) => ({ ...prev, slot_number: free[0].slot_number }));
        }
      }

      if (entriesData.success && entriesData.entries) {
        setEntries(entriesData.entries);
      }
    } catch (err) { void err; } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlotsAndEntries();
  }, []);

  const handleTypeChange = (newType) => {
    let defaultModel = "Hyundai Creta";
    if (newType === "SUV") defaultModel = "Tata Harrier";
    if (newType === "EV") defaultModel = "Tata Nexon EV";
    if (newType === "Bike") defaultModel = "Royal Enfield Hunter 350";

    let suggestedSlot = formData.slot_number;
    const matchingFree = availableSlots.filter((s) => {
      if (newType === "Bike") return s.zone === "Zone D" || (s.slot_type || "").toLowerCase().includes("bike");
      if (newType === "EV") return s.zone === "Zone C" || (s.slot_type || "").toLowerCase().includes("vip");
      return s.zone !== "Zone D";
    });

    if (matchingFree.length > 0) {
      suggestedSlot = matchingFree[0].slot_number;
    } else if (availableSlots.length > 0) {
      suggestedSlot = availableSlots[0].slot_number;
    }

    setFormData((prev) => ({
      ...prev,
      vehicle_type: newType,
      model: defaultModel,
      slot_number: suggestedSlot
    }));
  };

  const handleAutoAssignSlot = () => {
    const matchingFree = availableSlots.filter((s) => {
      if (formData.vehicle_type === "Bike") return s.zone === "Zone D" || (s.slot_type || "").toLowerCase().includes("bike");
      if (formData.vehicle_type === "EV") return s.zone === "Zone C" || (s.slot_type || "").toLowerCase().includes("vip");
      return s.zone !== "Zone D";
    });

    if (matchingFree.length > 0) {
      setFormData((prev) => ({ ...prev, slot_number: matchingFree[0].slot_number }));
      if (setStatusActionMessage) {
        setStatusActionMessage(`Optimal Slot Bay ${matchingFree[0].slot_number} assigned`);
        setTimeout(() => setStatusActionMessage(""), 3000);
      }
    } else if (availableSlots.length > 0) {
      setFormData((prev) => ({ ...prev, slot_number: availableSlots[0].slot_number }));
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle_number || !formData.slot_number || !formData.owner_name) {
      if (setStatusActionMessage) setStatusActionMessage("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    setEntryStatusState("Processing Check-in...");

    try {
      const res = await fetch("http://localhost:5000/api/staff/vehicle-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (res.ok && data.success) {
        setEntryStatusState("Entry Recorded Successfully");
        if (setStatusActionMessage) {
          setStatusActionMessage(data.message || `Vehicle ${formData.vehicle_number} checked in at Bay ${formData.slot_number}`);
          setTimeout(() => setStatusActionMessage(""), 4000);
        }

        const passData = {
          id: data.entry?.id || `#ENT-${Math.floor(1000 + Math.random() * 9000)}`,
          vehicle_number: formData.vehicle_number,
          vehicle_type: formData.vehicle_type,
          model: formData.model,
          owner_name: formData.owner_name,
          owner_phone: formData.owner_phone,
          slot_number: formData.slot_number,
          entry_time: formData.entry_time,
          rate: (allSlots.find((s) => s.slot_number === formData.slot_number)?.hourly_rate) || 50
        };

        setSelectedPassModal(passData);

        setFormData((prev) => ({
          ...prev,
          vehicle_number: "",
          entry_time: getCurrentFormattedTime()
        }));

        fetchSlotsAndEntries();
        setTimeout(() => setEntryStatusState("Ready for Check-in"), 4500);
      } else {
        setEntryStatusState("Check-in Failed");
        if (setStatusActionMessage) {
          setStatusActionMessage(data.error || "Failed to record vehicle entry");
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
      }
    } catch {
      setIsSubmitting(false);
      setEntryStatusState("Error Connecting to Gate Terminal");
      if (setStatusActionMessage) {
        setStatusActionMessage("Network error connecting to backend");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const filteredEntries = entries.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.vehicle_number.toLowerCase().includes(q) ||
      (item.owner_name && item.owner_name.toLowerCase().includes(q)) ||
      (item.owner_phone && item.owner_phone.includes(q)) ||
      (item.slot_number && item.slot_number.toLowerCase().includes(q));

    const matchesType =
      typeFilter === "ALL" ||
      (item.vehicle_type || "").toLowerCase() === typeFilter.toLowerCase();

    return matchesSearch && matchesType;
  });

  const formatDateString = (dStr) => {
    if (!dStr) return "Just Now";
    try {
      const d = new Date(dStr);
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dStr;
    }
  };

  const handleDownloadSlip = (pass) => {
    const targetPass = pass || selectedPassModal;
    if (!targetPass) return;

    const formattedTime = formatDateString(targetPass.entry_time);
    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParkSafe Gate Pass - ${targetPass.vehicle_number}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
    }
    .ticket {
      width: 360px;
      background: #ffffff;
      border: 2px dashed #0f3b43;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #0f3b43;
      letter-spacing: 0.5px;
    }
    .ticket-id {
      font-size: 13px;
      font-weight: 700;
      color: #0d9488;
      margin-top: 4px;
    }
    .terminal {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .item {
      display: flex;
      flex-direction: column;
    }
    .item.full {
      grid-column: 1 / -1;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .val {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .val.bay {
      font-size: 18px;
      color: #0f766e;
      font-weight: 800;
    }
    .barcode-box {
      text-align: center;
      padding: 12px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .barcode {
      font-family: "Courier New", monospace;
      font-size: 22px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .barcode-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 1px;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <div class="ticket-id">${targetPass.id}</div>
      <div class="terminal">Gate: North Terminal 01 • Operator: Laiba Taj</div>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Vehicle Number</span>
        <span class="val">${targetPass.vehicle_number}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Type</span>
        <span class="val">${targetPass.model || targetPass.vehicle_type}</span>
      </div>
      <div class="item">
        <span class="label">Customer Name</span>
        <span class="val">${targetPass.owner_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact Number</span>
        <span class="val">${targetPass.owner_phone || "+91 98765 43210"}</span>
      </div>
      <div class="item">
        <span class="label">Assigned Bay</span>
        <span class="val bay">Bay ${targetPass.slot_number}</span>
      </div>
      <div class="item">
        <span class="label">Tariff Rate</span>
        <span class="val">₹${targetPass.rate || 50} / hour</span>
      </div>
      <div class="item full">
        <span class="label">Entry Date & Time</span>
        <span class="val">${formattedTime}</span>
      </div>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${targetPass.vehicle_number} - ${targetPass.slot_number}</div>
    </div>
    <div class="footer">
      Please keep this slip safely. Present at the payment counter during vehicle exit.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (targetPass.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Gate_Slip_${cleanPlate}_${targetPass.slot_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const selectedSlotObj = allSlots.find((s) => s.slot_number === formData.slot_number);
  const activeEntriesCount = entries.filter((e) => (e.status || "").toLowerCase() === "parked").length;

  return (
    <div className="pw-users-module-card">
      <div className="pw-metrics-four-grid" style={{ marginBottom: "16px" }}>
        <div className="pw-metric-card">
          <span className="pw-metric-label">Available Slots</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{availableSlots.length}</span>
          <span className="pw-metric-trend positive" style={{ color: "#16a34a" }}>
            <CheckCircle2 size={12} />
            <span>Ready for allocation</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Parked Vehicles</span>
          <span className="pw-metric-value">{activeEntriesCount}</span>
          <span className="pw-metric-trend positive">
            <span>Inside facility</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Entries Recorded</span>
          <span className="pw-metric-value">{entries.length}</span>
          <span className="pw-metric-trend positive">
            <span>Live shift log</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Gate Terminal</span>
          <span className="pw-metric-value" style={{ fontSize: "1.2rem", color: "#0f3b43" }}>North Gate 01</span>
          <span className="pw-metric-trend positive">
            <ShieldCheck size={12} />
            <span>Operator: Laiba Taj</span>
          </span>
        </div>
      </div>

      <div className="pw-entry-form-card">
        <div className="pw-entry-form-header">
          <h2 className="pw-entry-form-title">
            <LogIn size={20} className="pw-teal-icon" />
            <span>Gate Check-In / Vehicle Entry</span>
          </h2>
          <div className="pw-entry-terminal-badge">
            <span className="pw-status-dot"></span>
            <span>Live Gate Active</span>
          </div>
        </div>

        <form onSubmit={handleCheckInSubmit}>
          <div className="pw-entry-fields-grid">
            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="veh-number-input">
                Vehicle Number (License Plate) *
              </label>
              <div className="pw-entry-input-wrap">
                <input
                  id="veh-number-input"
                  type="text"
                  placeholder="e.g. KA01 AB 1234"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                  className="pw-entry-input plate-format"
                  required
                />
              </div>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="veh-type-select">
                Vehicle Type *
              </label>
              <select
                id="veh-type-select"
                value={formData.vehicle_type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="pw-entry-input"
              >
                <option value="Car">Car (Standard Bay)</option>
                <option value="SUV">SUV (Large Bay)</option>
                <option value="Bike">Bike (Zone D - Two Wheeler)</option>
                <option value="EV">EV / Electric Vehicle (Zone C)</option>
              </select>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="veh-model-input">
                Vehicle Model
              </label>
              <input
                id="veh-model-input"
                type="text"
                placeholder="e.g. Hyundai Creta"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="pw-entry-input"
              />
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="cust-name-input">
                Customer / Owner Name *
              </label>
              <div className="pw-entry-input-wrap">
                <input
                  id="cust-name-input"
                  type="text"
                  placeholder="e.g. Laiba"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  className="pw-entry-input"
                  required
                />
              </div>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="cust-phone-input">
                Customer Contact Number *
              </label>
              <div className="pw-entry-input-wrap">
                <input
                  id="cust-phone-input"
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({ ...formData, owner_phone: e.target.value })}
                  className="pw-entry-input"
                  required
                />
              </div>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="entry-time-input">
                Entry Date & Time *
              </label>
              <div className="pw-entry-input-wrap" style={{ gap: "6px" }}>
                <input
                  id="entry-time-input"
                  type="datetime-local"
                  value={formData.entry_time}
                  onChange={(e) => setFormData({ ...formData, entry_time: e.target.value })}
                  className="pw-entry-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, entry_time: getCurrentFormattedTime() })}
                  className="pw-btn-action-view"
                  style={{ height: "42px", padding: "0 12px" }}
                  title="Refresh to Current Time"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label" htmlFor="available-slot-select">
                Available Parking Slot *
              </label>
              <select
                id="available-slot-select"
                value={formData.slot_number}
                onChange={(e) => setFormData({ ...formData, slot_number: e.target.value })}
                className="pw-entry-input"
                required
              >
                {availableSlots.length > 0 ? (
                  availableSlots.map((s) => (
                    <option key={s.id} value={s.slot_number}>
                      Bay {s.slot_number} ({s.zone} - {s.slot_type || "Standard"} - ₹{s.hourly_rate || "50"}/hr)
                    </option>
                  ))
                ) : (
                  <option value="">No Available Slots</option>
                )}
              </select>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label">
                Assign Slot
              </label>
              <div className="pw-assigned-slot-preview">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={16} className="pw-teal-icon" />
                  <span className="pw-assigned-slot-num">
                    {formData.slot_number ? `Bay ${formData.slot_number}` : "None Selected"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="pw-assigned-slot-meta">
                    {selectedSlotObj ? `${selectedSlotObj.zone} • ₹${selectedSlotObj.hourly_rate || 50}/hr` : "Standard"}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoAssignSlot}
                    style={{
                      border: "none",
                      background: "#0f3b43",
                      color: "#ffffff",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                    title="Auto Assign Next Best Slot"
                  >
                    Auto Assign
                  </button>
                </div>
              </div>
            </div>

            <div className="pw-entry-field-group">
              <label className="pw-entry-label">
                Entry Status
              </label>
              <div
                style={{
                  height: "42px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0 14px",
                  borderRadius: "9px",
                  background: entryStatusState.includes("Success") ? "#dcfce7" : "#f0fdf4",
                  border: "1.5px solid #bbf7d0",
                  color: "#15803d",
                  fontWeight: "700",
                  fontSize: "0.84rem"
                }}
              >
                <CheckCircle size={16} />
                <span>{entryStatusState}</span>
              </div>
            </div>
          </div>

          <div className="pw-entry-form-actions">
            <div className="pw-entry-status-display">
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                Active Bays Available: <strong>{availableSlots.length}</strong> / {allSlots.length}
              </span>
            </div>

            <button
              type="submit"
              className="pw-btn-check-in-submit"
              disabled={isSubmitting || availableSlots.length === 0}
            >
              <LogIn size={16} />
              <span>{isSubmitting ? "Processing Check-In..." : "Check In / Vehicle Entry"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="pw-users-toolbar">
        <div className="pw-user-search-wrapper">
          <Search size={14} className="pw-search-icon" />
          <input
            type="text"
            placeholder="Search checked-in plate, owner name, phone, or bay..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pw-user-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="pw-clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pw-user-filters-group">
          <div className="pw-filter-select-wrap">
            <span className="pw-filter-icon">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pw-custom-select"
            >
              <option value="ALL">All Vehicle Types</option>
              <option value="Car">Car</option>
              <option value="SUV">SUV</option>
              <option value="Bike">Bike</option>
              <option value="EV">EV</option>
            </select>
          </div>

          <button
            type="button"
            className="pw-btn-action-view"
            style={{ height: "38px", padding: "0 14px", fontWeight: "700" }}
            onClick={fetchSlotsAndEntries}
            disabled={isLoading}
          >
            <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
            <span>Refresh Log</span>
          </button>
        </div>
      </div>

      <div className="pw-users-table-scroll-container">
        <div className="pw-users-header-row pw-mgmt-grid-row pw-veh-entry-grid">
          <span>Vehicle Plate & Model</span>
          <span>Type</span>
          <span>Customer / Contact</span>
          <span>Entry Date & Time</span>
          <span style={{ textAlign: "center" }}>Slot Bay</span>
          <span>Entry Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="pw-user-cards-stack">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((item) => {
              const isParked = (item.status || "").toLowerCase() === "parked";
              const typeKey = (item.vehicle_type || "Car").toLowerCase();

              return (
                <div key={item.id} className="pw-user-card-box pw-mgmt-grid-row pw-veh-entry-grid">
                  <div className="pw-veh-plate-col">
                    <div>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                        {typeKey === "bike" ? <Bike size={13} /> : <Car size={13} />}
                        <span>{item.vehicle_number}</span>
                      </span>
                    </div>
                    <div className="pw-veh-model-sub">
                      {item.model || "Vehicle"}
                    </div>
                  </div>

                  <div>
                    <span className={`pw-veh-type-badge ${typeKey}`}>
                      {item.vehicle_type || "Car"}
                    </span>
                  </div>

                  <div className="pw-user-card-contact-col">
                    <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                      {item.owner_name}
                    </div>
                    <div className="pw-contact-cell">
                      <Phone size={11} className="pw-cell-icon" />
                      <span>{item.owner_phone || "+91 98765 43210"}</span>
                    </div>
                  </div>

                  <div className="pw-user-card-date-col">
                    <span className="pw-user-col-label">Checked In</span>
                    <span className="pw-user-col-value" style={{ fontSize: "0.76rem" }}>{formatDateString(item.entry_time)}</span>
                  </div>

                  <div style={{ textAlign: "center" }}>
                    <span className="pw-tag-slot" style={{ fontWeight: "800", fontSize: "0.8rem", padding: "3px 8px" }}>
                      Bay {item.slot_number}
                    </span>
                  </div>

                  <div>
                    <span className={`pw-veh-status-pill ${isParked ? "parked" : "checkedout"}`} style={{ fontSize: "0.72rem", padding: "3px 8px" }}>
                      <span className="pw-status-dot"></span>
                      {isParked ? "Parked" : "Checked Out"}
                    </span>
                  </div>

                  <div className="pw-user-card-actions-col" style={{ gap: "5px" }}>
                    <button
                      type="button"
                      className="pw-btn-action-view"
                      style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                      onClick={() =>
                        setSelectedPassModal({
                          id: `#ENT-${item.id + 1040}`,
                          vehicle_number: item.vehicle_number,
                          vehicle_type: item.vehicle_type,
                          model: item.model,
                          owner_name: item.owner_name,
                          owner_phone: item.owner_phone,
                          slot_number: item.slot_number,
                          entry_time: item.entry_time,
                          rate: 50
                        })
                      }
                      title="View Gate Pass / Entry Slip"
                    >
                      <Printer size={12} />
                      <span>Slip</span>
                    </button>

                    <button
                      type="button"
                      className="pw-btn-action-history"
                      style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                      onClick={() =>
                        handleDownloadSlip({
                          id: `#ENT-${item.id + 1040}`,
                          vehicle_number: item.vehicle_number,
                          vehicle_type: item.vehicle_type,
                          model: item.model,
                          owner_name: item.owner_name,
                          owner_phone: item.owner_phone,
                          slot_number: item.slot_number,
                          entry_time: item.entry_time,
                          rate: 50
                        })
                      }
                      title="Download Slip File"
                    >
                      <Download size={12} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="pw-empty-users-card">
              <div className="pw-empty-state">
                <Car size={32} className="pw-empty-icon" />
                <h4>No vehicle entry records found</h4>
                <p>Check in vehicles at the gate above to view active parking logs.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pw-users-table-footer">
        <span>Showing {filteredEntries.length} of {entries.length} total recorded entries</span>
      </div>

      {selectedPassModal && (
        <div className="pw-modal-backdrop" onClick={() => setSelectedPassModal(null)}>
          <div className="pw-user-detail-modal" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header">
              <div className="pw-modal-title-row">
                <h3 className="pw-modal-title">Vehicle Entry Gate Pass</h3>
                <button
                  type="button"
                  className="pw-modal-close-btn"
                  onClick={() => setSelectedPassModal(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="pw-modal-body">
              <div className="pw-gate-pass-ticket">
                <div className="pw-gate-pass-header">
                  <div className="pw-gate-pass-brand">PARKSAFE PARKING SYSTEM</div>
                  <div className="pw-gate-pass-id">{selectedPassModal.id}</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "2px" }}>
                    Gate: North Terminal 01 • Operator: Laiba Taj
                  </div>
                </div>

                <div className="pw-gate-pass-grid">
                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Vehicle Number</span>
                    <span className="pw-gate-pass-val">{selectedPassModal.vehicle_number}</span>
                  </div>

                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Vehicle Type / Model</span>
                    <span className="pw-gate-pass-val">{selectedPassModal.model || selectedPassModal.vehicle_type}</span>
                  </div>

                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Customer Name</span>
                    <span className="pw-gate-pass-val">{selectedPassModal.owner_name}</span>
                  </div>

                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Contact Number</span>
                    <span className="pw-gate-pass-val">{selectedPassModal.owner_phone || "+91 98765 43210"}</span>
                  </div>

                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Assigned Bay</span>
                    <span className="pw-gate-pass-val" style={{ color: "#0f766e", fontSize: "1.05rem" }}>
                      Bay {selectedPassModal.slot_number}
                    </span>
                  </div>

                  <div className="pw-gate-pass-item">
                    <span className="pw-gate-pass-label">Tariff Rate</span>
                    <span className="pw-gate-pass-val">₹{selectedPassModal.rate || 50} / hour</span>
                  </div>

                  <div className="pw-gate-pass-item" style={{ gridColumn: "span 2" }}>
                    <span className="pw-gate-pass-label">Entry Date & Time</span>
                    <span className="pw-gate-pass-val">{formatDateString(selectedPassModal.entry_time)}</span>
                  </div>
                </div>

                <div className="pw-gate-pass-barcode">
                  <div className="pw-barcode-lines">||| | | |||| | || | |||</div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b", letterSpacing: "1px" }}>
                    {selectedPassModal.vehicle_number} - {selectedPassModal.slot_number}
                  </div>
                </div>

                <div className="pw-gate-pass-footer">
                  Please keep this ticket with you. Present at payment counter before exit.
                </div>
              </div>
            </div>

            <div className="pw-modal-footer">
              <button
                type="button"
                className="pw-btn-modal-save"
                onClick={() => handleDownloadSlip(selectedPassModal)}
                style={{ height: "36px", padding: "0 16px", background: "#0d9488" }}
              >
                <Download size={14} />
                <span>Download Slip</span>
              </button>

              <button
                type="button"
                className="pw-btn-action-history"
                onClick={() => {
                  handleDownloadSlip(selectedPassModal);
                  window.print();
                }}
                style={{ height: "36px", padding: "0 16px" }}
              >
                <Printer size={14} />
                <span>Print & Download</span>
              </button>

              <button
                type="button"
                className="pw-btn-modal-close"
                onClick={() => setSelectedPassModal(null)}
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

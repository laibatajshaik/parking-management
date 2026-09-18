import { useState, useEffect } from "react";
import { Car, Search, LogOut, CheckCircle2, Printer, Download, RotateCcw, ArrowRight } from "lucide-react";

export default function VehicleExit({ onProceedToPayment, setStatusActionMessage }) {
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProcessingExit, setIsProcessingExit] = useState(false);
  const [completedExitRecord, setCompletedExitRecord] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const fetchActiveVehicles = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/parking/active-sessions");
      const data = await res.json();
      if (data.success && data.sessions) {
        setActiveVehicles(data.sessions);
        if (!selectedPlate && data.sessions.length > 0) {
          setSelectedPlate(data.sessions[0].vehicle_number);
          setSelectedVehicle(data.sessions[0]);
        }
      }
    } catch (err) { void err; }
  };

  useEffect(() => {
    fetchActiveVehicles();
  }, []);

  const handleSelectPlate = (plate) => {
    setSelectedPlate(plate);
    const found = activeVehicles.find((v) => v.vehicle_number === plate);
    if (found) {
      setSelectedVehicle(found);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
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

  const handleCompleteExit = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setIsProcessingExit(true);
    if (setStatusActionMessage) setStatusActionMessage("");

    const payload = {
      vehicle_number: selectedVehicle.vehicle_number,
      slot_number: selectedVehicle.current_slot,
      exit_time: new Date().toISOString(),
      duration: selectedVehicle.duration || "1h 00m",
      fee: selectedVehicle.calculated_fee || "₹50.00",
      payment_method: paymentMethod,
      customer_name: selectedVehicle.owner_name,
      customer_email: selectedVehicle.owner_email || "customer@shnoor.com",
      customer_phone: selectedVehicle.owner_phone || "+91 98765 43210"
    };

    try {
      const res = await fetch("http://localhost:5000/api/staff/vehicle-exit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setIsProcessingExit(false);

      if (res.ok && data.success) {
        setCompletedExitRecord(data.exitRecord || data.receipt);
        if (setStatusActionMessage) {
          setStatusActionMessage(`Vehicle ${selectedVehicle.vehicle_number} checked out successfully. Bay ${selectedVehicle.current_slot} is now available.`);
          setTimeout(() => setStatusActionMessage(""), 4500);
        }
      } else {
        if (setStatusActionMessage) {
          setStatusActionMessage(data.error || "Failed to complete exit");
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
      }
    } catch {
      setIsProcessingExit(false);
      if (setStatusActionMessage) {
        setStatusActionMessage("Error connecting to server for vehicle exit");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const handleDownloadSlip = (rec) => {
    const target = rec || completedExitRecord;
    if (!target) return;

    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ParkSafe Exit Pass - ${target.vehicle_number}</title>
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
      width: 380px;
      background: #ffffff;
      border: 2px solid #0f3b43;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #0f3b43;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: #dcfce7;
      color: #15803d;
      font-size: 11px;
      font-weight: 700;
    }
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
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
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .total-banner {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">EXIT COMPLETED • SLOT FREED</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Gate: South Exit Terminal • Cashier: Staff Duty</div>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span>Bay ${target.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer Name</span>
        <span class="val">${target.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Total Duration</span>
        <span class="val">${target.duration}</span>
      </div>
      <div class="item">
        <span class="label">Entry Time</span>
        <span class="val">${formatDate(target.entry_time)}</span>
      </div>
      <div class="item">
        <span class="label">Exit Time</span>
        <span class="val">${formatDate(target.exit_time)}</span>
      </div>
    </div>
    <div class="total-banner">
      <span style="font-size: 12px; font-weight: 700; color: #0f766e;">Total Fee Settled</span>
      <span class="total-val">${target.fee || "₹50.00"}</span>
    </div>
    <div class="footer">
      Thank you for visiting ParkSafe. Drive safely!
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Exit_Slip_${cleanPlate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const resetForm = () => {
    setCompletedExitRecord(null);
    setSelectedPlate("");
    setSelectedVehicle(null);
    fetchActiveVehicles();
  };

  const filteredVehicles = activeVehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      v.vehicle_number.toLowerCase().includes(q) ||
      v.owner_name.toLowerCase().includes(q) ||
      v.current_slot.toLowerCase().includes(q)
    );
  });

  return (
    <div className="pw-staff-exit-module">
      {completedExitRecord ? (
        <div className="pw-receipt-card-wrapper">
          <div className="pw-receipt-card">
            <div className="pw-receipt-header">
              <div className="pw-receipt-success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="pw-receipt-title">Vehicle Exit Completed</h3>
              <p className="pw-receipt-subtitle">
                Bay <strong>{completedExitRecord.slot_number}</strong> is now vacant and ready for new check-ins
              </p>
            </div>

            <div className="pw-receipt-body">
              <div className="pw-receipt-plate-banner">
                <span className="pw-receipt-plate">{completedExitRecord.vehicle_number}</span>
                <span className="pw-receipt-slot">Bay {completedExitRecord.slot_number}</span>
              </div>

              <div className="pw-receipt-details-table">
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Name</span>
                  <span className="pw-receipt-value">{completedExitRecord.customer_name}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Check-in Time</span>
                  <span className="pw-receipt-value">{formatDate(completedExitRecord.entry_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Check-out Time</span>
                  <span className="pw-receipt-value">{formatDate(completedExitRecord.exit_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Total Duration</span>
                  <span className="pw-receipt-value">{completedExitRecord.duration}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Mode</span>
                  <span className="pw-receipt-value">{completedExitRecord.payment_method}</span>
                </div>
                <div className="pw-receipt-row pw-receipt-total-row">
                  <span className="pw-receipt-label">Total Fee Collected</span>
                  <span className="pw-receipt-total-value">{completedExitRecord.fee}</span>
                </div>
              </div>
            </div>

            <div className="pw-receipt-actions">
              <button
                type="button"
                className="pw-btn-download-slip"
                onClick={() => handleDownloadSlip(completedExitRecord)}
              >
                <Download size={15} />
                <span>Download Exit Slip</span>
              </button>

              <button
                type="button"
                className="pw-btn-print"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Gate Pass</span>
              </button>

              <button
                type="button"
                className="pw-btn-next-payment"
                onClick={resetForm}
              >
                <RotateCcw size={15} />
                <span>Process Next Exit</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pw-payment-two-col-grid">
          <div className="pw-payment-session-selection-col">
            <div className="pw-payment-box-card">
              <h3 className="pw-box-card-title">1. Find & Select Parked Vehicle</h3>
              <p className="pw-box-card-sub">Choose a vehicle currently parked inside the bays to record its exit</p>

              <div className="pw-search-box-pill" style={{ marginTop: "14px", width: "100%", maxWidth: "100%" }}>
                <Search size={14} className="pw-search-icon" />
                <input
                  type="text"
                  placeholder="Filter active plates, customer names, bays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pw-pill-input"
                />
              </div>

              <div className="pw-form-field" style={{ marginTop: "14px" }}>
                <label className="pw-detail-label" htmlFor="exit-vehicle-select">Active Parked Vehicles Queue ({filteredVehicles.length})</label>
                <select
                  id="exit-vehicle-select"
                  className="pw-form-input"
                  value={selectedPlate}
                  onChange={(e) => handleSelectPlate(e.target.value)}
                >
                  <option value="">-- Choose Parked Vehicle --</option>
                  {filteredVehicles.map((v) => (
                    <option key={v.id} value={v.vehicle_number}>
                      {v.vehicle_number} • Bay {v.current_slot} ({v.owner_name} - {v.duration})
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className="pw-session-preview-box">
                  <div className="pw-detail-user-profile-header">
                    <span className="pw-veh-plate-badge" style={{ fontSize: "0.95rem", padding: "6px 14px" }}>
                      <Car size={16} />
                      <span>{selectedVehicle.vehicle_number}</span>
                    </span>
                    <div className="pw-detail-user-meta">
                      <h4 className="pw-detail-user-name">{selectedVehicle.model} ({selectedVehicle.vehicle_type})</h4>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                        Assigned Bay: <strong>{selectedVehicle.current_slot}</strong> ({selectedVehicle.zone})
                      </span>
                    </div>
                  </div>

                  <div className="pw-detail-fields-grid" style={{ marginTop: "14px" }}>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Customer Name</span>
                      <div className="pw-detail-val">{selectedVehicle.owner_name}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Customer Phone</span>
                      <div className="pw-detail-val">{selectedVehicle.owner_phone || "+91 98765 43210"}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Entry Timestamp</span>
                      <div className="pw-detail-val">{formatDate(selectedVehicle.entry_time)}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Calculated Duration</span>
                      <div className="pw-detail-val">{selectedVehicle.duration}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Slot Tariff</span>
                      <div className="pw-detail-val">₹{selectedVehicle.hourly_rate}.00 / hr</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Status</span>
                      <div className="pw-detail-val" style={{ color: "#0f766e", fontWeight: 700 }}>Ready for Exit</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pw-payment-processing-col">
            <div className="pw-payment-box-card">
              <h3 className="pw-box-card-title">2. Complete Vehicle Exit & Free Slot</h3>
              <p className="pw-box-card-sub">Record final departure timestamp and release parking bay</p>

              {selectedVehicle ? (
                <div style={{ marginTop: "16px" }}>
                  <div className="pw-payment-amount-hero">
                    <span className="pw-amount-hero-label">Final Payable Fee</span>
                    <div className="pw-amount-hero-val">{selectedVehicle.calculated_fee}</div>
                    <span className="pw-amount-hero-sub">Duration: {selectedVehicle.duration} ({selectedVehicle.billed_hours} billed hrs)</span>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <label className="pw-detail-label">Payment Mode Collected</label>
                    <div className="pw-payment-methods-grid" style={{ marginTop: "6px" }}>
                      {["UPI", "Cash", "Credit Card", "Net Banking"].map((m) => (
                        <div
                          key={m}
                          className={`pw-method-tile ${paymentMethod === m ? "selected" : ""}`}
                          onClick={() => setPaymentMethod(m)}
                        >
                          <span className="pw-method-title">{m}</span>
                          <span className="pw-method-desc">Instant confirmation</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="pw-btn-complete-payment"
                    style={{ marginTop: "20px" }}
                    disabled={isProcessingExit}
                    onClick={handleCompleteExit}
                  >
                    <LogOut size={16} />
                    <span>{isProcessingExit ? "Processing Exit & Freeing Slot..." : "Complete Exit & Free Bay"}</span>
                  </button>

                  <div style={{ marginTop: "12px", textAlign: "center" }}>
                    <button
                      type="button"
                      className="pw-switch-link"
                      onClick={() => {
                        if (onProceedToPayment) {
                          onProceedToPayment(selectedVehicle);
                        }
                      }}
                      style={{ fontSize: "0.82rem" }}
                    >
                      <span>Need detailed invoice? Open in Payment Module</span>
                      <ArrowRight size={12} style={{ display: "inline", verticalAlign: "middle", marginLeft: "4px" }} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pw-empty-selection-placeholder">
                  <Car size={36} />
                  <p>Select a vehicle from the parked list on the left to review exit details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

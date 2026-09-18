import { useState, useEffect } from "react";
import { CreditCard, Smartphone, Banknote, Globe, CheckCircle2, Car, Printer, Download, RotateCcw, CheckCircle } from "lucide-react";

export default function Payment({ preselectedVehicle, onPaymentCompleted, setStatusActionMessage }) {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState("");
  const [currentSession, setCurrentSession] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState(null);
  const [customAmount, setCustomAmount] = useState("");

  const fetchActiveSessions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/parking/active-sessions");
      const data = await res.json();
      if (data.success && data.sessions) {
        setActiveSessions(data.sessions);
        if (preselectedVehicle && preselectedVehicle.vehicle_number) {
          setSelectedVehicleNumber(preselectedVehicle.vehicle_number);
          const found = data.sessions.find((s) => s.vehicle_number === preselectedVehicle.vehicle_number);
          if (found) {
            setCurrentSession(found);
            setCustomAmount(String(found.fee_numeric || 50));
          } else {
            setCurrentSession(preselectedVehicle);
            setCustomAmount(String(preselectedVehicle.fee_numeric || 50));
          }
        } else if (data.sessions.length > 0 && !selectedVehicleNumber) {
          setSelectedVehicleNumber(data.sessions[0].vehicle_number);
          setCurrentSession(data.sessions[0]);
          setCustomAmount(String(data.sessions[0].fee_numeric || 50));
        }
      }
    } catch (err) { void err; }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, [preselectedVehicle]);

  const handleVehicleSelect = (plate) => {
    setSelectedVehicleNumber(plate);
    const found = activeSessions.find((s) => s.vehicle_number === plate);
    if (found) {
      setCurrentSession(found);
      setCustomAmount(String(found.fee_numeric || 50));
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!currentSession) return;

    setIsProcessing(true);
    if (setStatusActionMessage) setStatusActionMessage("");

    const payload = {
      vehicle_number: currentSession.vehicle_number,
      slot_number: currentSession.current_slot,
      customer_name: currentSession.owner_name,
      customer_email: currentSession.owner_email || "customer@shnoor.com",
      customer_phone: currentSession.owner_phone || "+91 98765 43210",
      entry_time: currentSession.entry_time,
      exit_time: new Date().toISOString(),
      duration: currentSession.duration || "1h 00m",
      amount: parseFloat(customAmount) || currentSession.fee_numeric || 50.00,
      payment_method: paymentMethod
    };

    try {
      const res = await fetch("http://localhost:5000/api/staff/process-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setIsProcessing(false);

      if (res.ok && data.success) {
        setCompletedReceipt(data.receipt);
        if (setStatusActionMessage) {
          setStatusActionMessage(data.message || `Payment recorded for ${currentSession.vehicle_number}`);
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
        if (onPaymentCompleted) {
          onPaymentCompleted(data.receipt);
        }
      } else {
        if (setStatusActionMessage) {
          setStatusActionMessage(data.error || "Failed to process payment");
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
      }
    } catch {
      setIsProcessing(false);
      if (setStatusActionMessage) {
        setStatusActionMessage("Error connecting to payment server");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const resetFormForNext = () => {
    setCompletedReceipt(null);
    setSelectedVehicleNumber("");
    setCurrentSession(null);
    setCustomAmount("");
    fetchActiveSessions();
  };

  const formatDate = (isoStr) => {
    if (!isoStr) {
      const now = new Date();
      return now.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) {
        return new Date().toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      }
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

  const handleDownloadSlip = (receipt) => {
    const target = receipt || completedReceipt;
    if (!target) return;

    const formattedAmount = parseFloat(target.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const slipHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ParkSafe Payment Receipt - ${target.transaction_id}</title>
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
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 18px;
      font-weight: 800;
      color: #0f3b43;
      letter-spacing: 0.5px;
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
      letter-spacing: 0.5px;
    }
    .ticket-id {
      font-size: 13px;
      font-weight: 700;
      color: #0d9488;
      margin-top: 6px;
    }
    .terminal {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
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
    .slot-pill {
      background: rgba(45, 212, 191, 0.2);
      color: #2dd4bf;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
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
    .total-label {
      font-size: 12px;
      font-weight: 700;
      color: #0f766e;
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
    }
    .barcode-box {
      text-align: center;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .barcode {
      font-family: "Courier New", monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .barcode-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 1px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">PAYMENT COMPLETED</span>
      <div class="ticket-id">${target.transaction_id}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: 600;">
        Payment Date: ${formatDate(target.created_at || target.exit_time || new Date())}
      </div>
      <div class="terminal">Cashier: Staff Duty • Gate: North Terminal 01</div>
    </div>
    <div class="plate-banner">
      <span>${target.vehicle_number}</span>
      <span class="slot-pill">Bay ${target.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer Name</span>
        <span class="val">${target.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact</span>
        <span class="val">${target.customer_phone || "+91 98765 43210"}</span>
      </div>
      <div class="item">
        <span class="label">Check-in</span>
        <span class="val">${formatDate(target.entry_time)}</span>
      </div>
      <div class="item">
        <span class="label">Check-out</span>
        <span class="val">${formatDate(target.exit_time)}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${target.duration}</span>
      </div>
      <div class="item">
        <span class="label">Payment Mode</span>
        <span class="val">${target.payment_method}</span>
      </div>
      <div class="item">
        <span class="label">Payment Date</span>
        <span class="val">${formatDate(target.created_at || target.exit_time || new Date())}</span>
      </div>
      <div class="item">
        <span class="label">Status</span>
        <span class="val">Completed</span>
      </div>
    </div>
    <div class="total-banner">
      <span class="total-label">Total Amount Paid</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${target.transaction_id} • ${target.vehicle_number}</div>
    </div>
    <div class="footer">
      Official verified payment pass. Thank you for parking with ParkSafe.
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([slipHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const cleanPlate = (target.vehicle_number || "VEHICLE").replace(/\s+/g, "_");
    link.download = `ParkSafe_Payment_Slip_${cleanPlate}_${target.transaction_id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="pw-staff-payment-module">
      {completedReceipt ? (
        <div className="pw-receipt-card-wrapper">
          <div className="pw-receipt-card">
            <div className="pw-receipt-header">
              <div className="pw-receipt-success-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="pw-receipt-title">Payment Collected Successfully</h3>
              <p className="pw-receipt-subtitle">Transaction reference: {completedReceipt.transaction_id}</p>
            </div>

            <div className="pw-receipt-body">
              <div className="pw-receipt-plate-banner">
                <span className="pw-receipt-plate">{completedReceipt.vehicle_number}</span>
                <span className="pw-receipt-slot">Bay {completedReceipt.slot_number}</span>
              </div>

              <div className="pw-receipt-details-table">
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Name</span>
                  <span className="pw-receipt-value">{completedReceipt.customer_name}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Contact</span>
                  <span className="pw-receipt-value">{completedReceipt.customer_phone || "+91 98765 43210"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Check-in Time</span>
                  <span className="pw-receipt-value">{formatDate(completedReceipt.entry_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Check-out Time</span>
                  <span className="pw-receipt-value">{formatDate(completedReceipt.exit_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Total Duration</span>
                  <span className="pw-receipt-value">{completedReceipt.duration}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Method</span>
                  <span className="pw-receipt-value">{completedReceipt.payment_method}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Date & Time</span>
                  <span className="pw-receipt-value">{formatDate(completedReceipt.created_at || completedReceipt.exit_time || new Date())}</span>
                </div>
                <div className="pw-receipt-row pw-receipt-total-row">
                  <span className="pw-receipt-label">Total Amount Paid</span>
                  <span className="pw-receipt-total-value">
                    ₹{parseFloat(completedReceipt.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="pw-receipt-actions">
              <button
                type="button"
                className="pw-btn-download-slip"
                onClick={() => handleDownloadSlip(completedReceipt)}
              >
                <Download size={15} />
                <span>Download Slip</span>
              </button>

              <button
                type="button"
                className="pw-btn-print"
                onClick={() => window.print()}
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                className="pw-btn-next-payment"
                onClick={resetFormForNext}
              >
                <RotateCcw size={15} />
                <span>Process Next Payment</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pw-payment-two-col-grid">
          <div className="pw-payment-session-selection-col">
            <div className="pw-payment-box-card">
              <h3 className="pw-box-card-title">1. Select Parked Vehicle</h3>
              <p className="pw-box-card-sub">Choose a vehicle currently parked inside the facility to calculate final fee</p>

              <div className="pw-form-field" style={{ marginTop: "16px" }}>
                <label className="pw-detail-label" htmlFor="select-vehicle-payment">Parked Vehicles Queue</label>
                <select
                  id="select-vehicle-payment"
                  className="pw-form-input"
                  value={selectedVehicleNumber}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                >
                  <option value="">-- Select Active Vehicle --</option>
                  {activeSessions.map((s) => (
                    <option key={s.id} value={s.vehicle_number}>
                      {s.vehicle_number} • Bay {s.current_slot} ({s.owner_name} - {s.duration})
                    </option>
                  ))}
                </select>
              </div>

              {currentSession ? (
                <div className="pw-session-preview-box">
                  <div className="pw-detail-user-profile-header">
                    <span className="pw-veh-plate-badge" style={{ fontSize: "1rem", padding: "6px 14px" }}>
                      <Car size={16} />
                      <span>{currentSession.vehicle_number}</span>
                    </span>
                    <div className="pw-detail-user-meta">
                      <h4 className="pw-detail-user-name">{currentSession.model} ({currentSession.vehicle_type})</h4>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
                        Assigned: <strong>Bay {currentSession.current_slot}</strong> ({currentSession.zone})
                      </span>
                    </div>
                  </div>

                  <div className="pw-detail-fields-grid" style={{ marginTop: "16px" }}>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Customer Name</span>
                      <div className="pw-detail-val">{currentSession.owner_name}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Customer Contact</span>
                      <div className="pw-detail-val">{currentSession.owner_phone || "+91 98765 43210"}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Entry Time</span>
                      <div className="pw-detail-val">{formatDate(currentSession.entry_time)}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Total Duration</span>
                      <div className="pw-detail-val">{currentSession.duration}</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Slot Tariff</span>
                      <div className="pw-detail-val">₹{currentSession.hourly_rate}.00 / hr</div>
                    </div>
                    <div className="pw-detail-field-card">
                      <span className="pw-detail-label">Status</span>
                      <div className="pw-detail-val" style={{ color: "#0d9488" }}>Ready for Checkout</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pw-empty-selection-placeholder">
                  <Car size={32} className="pw-empty-icon" />
                  <p>Please select an active vehicle from the dropdown above to view checkout details.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pw-payment-processing-col">
            <div className="pw-payment-box-card">
              <h3 className="pw-box-card-title">2. Payment Collection</h3>
              <p className="pw-box-card-sub">Select payment method and collect parking tariff</p>

              <form onSubmit={handleProcessPayment} style={{ marginTop: "16px" }}>
                <div className="pw-payment-amount-hero">
                  <span className="pw-amount-hero-label">Total Amount Due</span>
                  <div className="pw-amount-hero-val">
                    ₹{parseFloat(customAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <span className="pw-amount-hero-sub">Calculated for {currentSession ? currentSession.duration : "0m"} duration</span>
                </div>

                <div className="pw-form-field" style={{ marginTop: "16px" }}>
                  <label className="pw-detail-label">Adjust Amount (₹) if required</label>
                  <input
                    type="number"
                    step="0.5"
                    className="pw-form-input"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    required
                    disabled={!currentSession}
                  />
                </div>

                <div className="pw-form-field" style={{ marginTop: "16px" }}>
                  <label className="pw-detail-label">Select Payment Method</label>
                  <div className="pw-payment-methods-grid">
                    <button
                      type="button"
                      className={`pw-method-tile ${paymentMethod === "UPI" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("UPI")}
                    >
                      <Smartphone size={20} className="pw-method-icon upi" />
                      <span className="pw-method-title">UPI / QR</span>
                      <span className="pw-method-desc">GPay, PhonePe, Paytm</span>
                    </button>

                    <button
                      type="button"
                      className={`pw-method-tile ${paymentMethod === "Cash" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("Cash")}
                    >
                      <Banknote size={20} className="pw-method-icon cash" />
                      <span className="pw-method-title">Cash</span>
                      <span className="pw-method-desc">Counter Collection</span>
                    </button>

                    <button
                      type="button"
                      className={`pw-method-tile ${paymentMethod === "Credit Card" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("Credit Card")}
                    >
                      <CreditCard size={20} className="pw-method-icon card" />
                      <span className="pw-method-title">Card POS</span>
                      <span className="pw-method-desc">Credit / Debit Card</span>
                    </button>

                    <button
                      type="button"
                      className={`pw-method-tile ${paymentMethod === "Net Banking" ? "selected" : ""}`}
                      onClick={() => setPaymentMethod("Net Banking")}
                    >
                      <Globe size={20} className="pw-method-icon netbanking" />
                      <span className="pw-method-title">Fastag / Net</span>
                      <span className="pw-method-desc">Online Settle</span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="pw-btn-complete-payment"
                  disabled={!currentSession || isProcessing}
                >
                  <CheckCircle size={17} />
                  <span>{isProcessing ? "Recording Payment..." : `Collect ₹${parseFloat(customAmount || 0).toFixed(2)} & Complete Checkout`}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

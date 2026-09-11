import { useState } from "react";
import { Calculator, Car, Clock, RotateCcw, Search, CreditCard, Printer, FileText, Calendar, MoreHorizontal } from "lucide-react";

export default function FeeCalculation({ onProceedToPayment, setStatusActionMessage }) {
  const [vehicleNumber, setVehicleNumber] = useState("KA01AB1234");
  const [vehicleType, setVehicleType] = useState("Car");
  const [selectedPlan, setSelectedPlan] = useState("Hourly Plan (₹50/hour)");
  const [entryDateTime, setEntryDateTime] = useState("02-09-2025 09:30 AM");
  const [exitDateTime, setExitDateTime] = useState("02-09-2025 01:30 PM");
  const [parkingDuration, setParkingDuration] = useState("4 hours");
  const [calculatedAmount, setCalculatedAmount] = useState(200);

  const [recentCalculations] = useState([
    { id: 1, vehicleNumber: "KA01AB1234", vehicleType: "Car", plan: "Hourly Plan", duration: "4 hours", amount: 200, status: "Paid", time: "02 Sep 2025, 01:30 PM" },
    { id: 2, vehicleNumber: "TS09CD5678", vehicleType: "Bike", plan: "Hourly Plan", duration: "2 hours", amount: 40, status: "Paid", time: "02 Sep 2025, 12:15 PM" },
    { id: 3, vehicleNumber: "AP28EF9012", vehicleType: "SUV", plan: "Daily Plan", duration: "1 day", amount: 300, status: "Pending", time: "02 Sep 2025, 11:40 AM" },
    { id: 4, vehicleNumber: "KA05GH3456", vehicleType: "Car", plan: "Hourly Plan", duration: "3 hours", amount: 150, status: "Paid", time: "02 Sep 2025, 10:20 AM" },
  ]);

  const handleCalculate = () => {
    let rate = 50;
    if (selectedPlan.includes("₹20")) rate = 20;
    else if (selectedPlan.includes("₹300")) rate = 300;
    else if (selectedPlan.includes("₹60")) rate = 60;
    else if (selectedPlan.includes("₹80")) rate = 80;

    let hours = 4;
    if (parkingDuration.includes("hour")) {
      const match = parkingDuration.match(/\d+/);
      if (match) hours = parseInt(match[0], 10);
    }
    const total = selectedPlan.includes("Daily") ? rate : hours * rate;
    setCalculatedAmount(total);

    if (setStatusActionMessage) {
      setStatusActionMessage(`Parking fee calculated: ₹${total} for ${vehicleNumber}`);
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const handleReset = () => {
    setVehicleNumber("KA01AB1234");
    setVehicleType("Car");
    setSelectedPlan("Hourly Plan (₹50/hour)");
    setEntryDateTime("02-09-2025 09:30 AM");
    setExitDateTime("02-09-2025 01:30 PM");
    setParkingDuration("4 hours");
    setCalculatedAmount(200);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCollectPayment = () => {
    if (onProceedToPayment) {
      onProceedToPayment({
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        slot_number: "A-04",
        owner_name: "Customer",
        owner_email: "customer@shnoor.com",
        duration: parkingDuration,
        calculatedAmount: calculatedAmount,
        plan_name: selectedPlan
      });
    }
  };

  return (
    <div className="pw-image-fee-calc-wrapper" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-calc-top-metrics-grid">
        <div className="pw-calc-stat-card">
          <div className="pw-calc-stat-icon-circle bg-teal-soft">
            <Car size={22} className="icon-teal" />
          </div>
          <div className="pw-calc-stat-meta">
            <span className="pw-calc-stat-number">12</span>
            <span className="pw-calc-stat-label">Vehicles Today</span>
          </div>
        </div>

        <div className="pw-calc-stat-card">
          <div className="pw-calc-stat-icon-circle bg-blue-soft">
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0284c7" }}>₹</span>
          </div>
          <div className="pw-calc-stat-meta">
            <span className="pw-calc-stat-number">8</span>
            <span className="pw-calc-stat-label">Fees Collected</span>
          </div>
        </div>

        <div className="pw-calc-stat-card">
          <div className="pw-calc-stat-icon-circle" style={{ background: "#fef3c7", color: "#d97706" }}>
            <Clock size={22} />
          </div>
          <div className="pw-calc-stat-meta">
            <span className="pw-calc-stat-number">2</span>
            <span className="pw-calc-stat-label">Pending Payment</span>
          </div>
        </div>

        <div className="pw-calc-stat-card">
          <div className="pw-calc-stat-icon-circle bg-teal-soft">
            <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0d9488", border: "2px solid #0d9488", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center" }}>P</span>
          </div>
          <div className="pw-calc-stat-meta">
            <span className="pw-calc-stat-number">4</span>
            <span className="pw-calc-stat-label">Active Parkings</span>
          </div>
        </div>
      </div>

      <div className="pw-calc-two-col-layout">
        <div className="pw-calc-box-card">
          <div className="pw-calc-box-header">
            <div className="pw-calc-header-icon-box">
              <Calculator size={18} />
            </div>
            <div>
              <h3 className="pw-calc-card-title">Vehicle & Plan Details</h3>
            </div>
          </div>

          <div className="pw-calc-form-grid" style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Vehicle Number <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pw-calc-search-input-wrap">
                <input
                  type="text"
                  className="pw-calc-input"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="KA01AB1234"
                />
                <button type="button" className="pw-calc-search-btn" onClick={handleCalculate} title="Search vehicle">
                  <Search size={15} />
                </button>
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Vehicle Type <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                className="pw-calc-input pw-calc-select"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
                <option value="SUV">SUV</option>
                <option value="EV">EV</option>
              </select>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Select Parking Plan <span style={{ color: "#ef4444" }}>*</span></label>
              <select
                className="pw-calc-input pw-calc-select"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="Hourly Plan (₹50/hour)">Hourly Plan (₹50/hour)</option>
                <option value="Daily Plan (₹300/day)">Daily Plan (₹300/day)</option>
                <option value="Bike Hourly Plan (₹20/hour)">Bike Hourly Plan (₹20/hour)</option>
                <option value="SUV Hourly Plan (₹60/hour)">SUV Hourly Plan (₹60/hour)</option>
                <option value="EV Fast Charge (₹80/hour)">EV Fast Charge (₹80/hour)</option>
              </select>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Entry Date & Time <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pw-calc-icon-input-wrap">
                <Calendar size={15} className="pw-calc-input-icon" />
                <input
                  type="text"
                  className="pw-calc-input with-icon"
                  value={entryDateTime}
                  onChange={(e) => setEntryDateTime(e.target.value)}
                />
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Exit Date & Time</label>
              <div className="pw-calc-icon-input-wrap">
                <Calendar size={15} className="pw-calc-input-icon" />
                <input
                  type="text"
                  className="pw-calc-input with-icon"
                  value={exitDateTime}
                  onChange={(e) => setExitDateTime(e.target.value)}
                />
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Parking Duration</label>
              <input
                type="text"
                className="pw-calc-input disabled-input"
                value={parkingDuration}
                readOnly
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
            <button
              type="button"
              className="pw-calc-btn-reset"
              onClick={handleReset}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className="pw-calc-btn-submit"
              onClick={handleCalculate}
            >
              <Calculator size={15} />
              <span>Calculate Fee</span>
            </button>
          </div>
        </div>

        <div className="pw-calc-box-card">
          <div className="pw-calc-box-header">
            <div className="pw-calc-header-icon-box">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="pw-calc-card-title">Fee Details</h3>
              <p className="pw-calc-card-sub">Calculated amount based on selected plan.</p>
            </div>
          </div>

          <div className="pw-calc-details-list" style={{ marginTop: "20px" }}>
            <div className="pw-calc-detail-row">
              <span className="pw-calc-detail-key">Vehicle Number</span>
              <span className="pw-calc-detail-colon">:</span>
              <span className="pw-calc-detail-val" style={{ fontWeight: 800, color: "#0f172a" }}>{vehicleNumber}</span>
            </div>

            <div className="pw-calc-detail-row">
              <span className="pw-calc-detail-key">Vehicle Type</span>
              <span className="pw-calc-detail-colon">:</span>
              <span className="pw-calc-detail-val">{vehicleType}</span>
            </div>

            <div className="pw-calc-detail-row">
              <span className="pw-calc-detail-key">Parking Plan</span>
              <span className="pw-calc-detail-colon">:</span>
              <span className="pw-calc-detail-val">{selectedPlan.split(" (")[0]}</span>
            </div>

            <div className="pw-calc-detail-row">
              <span className="pw-calc-detail-key">Rate</span>
              <span className="pw-calc-detail-colon">:</span>
              <span className="pw-calc-detail-val">{selectedPlan.includes("₹") ? selectedPlan.match(/₹[^)]+/)[0].replace("₹", "₹ ").replace("/hour", " / hour").replace("/day", " / day") : "₹ 50 / hour"}</span>
            </div>

            <div className="pw-calc-detail-row">
              <span className="pw-calc-detail-key">Duration</span>
              <span className="pw-calc-detail-colon">:</span>
              <span className="pw-calc-detail-val">{parkingDuration}</span>
            </div>
          </div>

          <div className="pw-calc-total-banner" style={{ marginTop: "24px" }}>
            <span className="pw-calc-total-label">Total Amount</span>
            <span className="pw-calc-total-val">₹ {calculatedAmount}</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "20px" }}>
            <button
              type="button"
              className="pw-calc-btn-outline"
              onClick={handlePrintReceipt}
            >
              <Printer size={15} />
              <span>Print Receipt</span>
            </button>

            <button
              type="button"
              className="pw-calc-btn-submit"
              onClick={handleCollectPayment}
            >
              <CreditCard size={15} />
              <span>Collect Payment</span>
            </button>
          </div>
        </div>
      </div>

      <div className="pw-calc-box-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#f0fdfa", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Recent Fee Calculations</h3>
          </div>
          <button type="button" className="pw-view-all-link" style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0d9488", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            View All
          </button>
        </div>

        <div className="pw-calc-table-container">
          <table className="pw-calc-data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th>Vehicle Number</th>
                <th>Vehicle Type</th>
                <th>Plan</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Time</th>
                <th style={{ textAlign: "center", width: "50px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentCalculations.map((item) => (
                <tr key={item.id}>
                  <td style={{ color: "#64748b" }}>{item.id}</td>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>{item.vehicleNumber}</td>
                  <td style={{ color: "#334155" }}>{item.vehicleType}</td>
                  <td style={{ color: "#334155" }}>{item.plan}</td>
                  <td style={{ color: "#334155" }}>{item.duration}</td>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>₹ {item.amount}</td>
                  <td>
                    <span className={`pw-calc-status-pill ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.time}</td>
                  <td style={{ textAlign: "center" }}>
                    <button type="button" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }} title="More options">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

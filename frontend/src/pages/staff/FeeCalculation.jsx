import { useState, useEffect } from "react";
import { Calculator, Car, Clock, RotateCcw, Search, CreditCard, Printer, FileText, Calendar, MoreHorizontal, AlertCircle } from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";

export default function FeeCalculation({ onProceedToPayment, setStatusActionMessage }) {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [dbPlans, setDbPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("Hourly Plan (₹50/hour)");

  const toDateTimeLocal = (date) => {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [entryDateTime, setEntryDateTime] = useState(() => {
    return toDateTimeLocal(Date.now() - 3600000);
  });
  const [exitDateTime, setExitDateTime] = useState(() => {
    return toDateTimeLocal(Date.now());
  });

  const [parkingDuration, setParkingDuration] = useState("1 hour");
  const [calculatedAmount, setCalculatedAmount] = useState(50);
  const [recentCalculations, setRecentCalculations] = useState([]);
  const [isWindowValid, setIsWindowValid] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/pricing-plans?active=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
          setDbPlans(data.plans);
          const first = data.plans[0];
          setSelectedPlan(`${first.plan_name} (₹${parseFloat(first.rate).toFixed(0)}/${first.billing_type === "Daily" ? "day" : "hour"})`);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/parking-records`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.records) {
          setRecentCalculations(
            data.records.slice(0, 5).map((r, idx) => ({
              id: r.id || idx + 1,
              vehicleNumber: r.vehicle_number,
              vehicleType: r.vehicle_type || (r.slot_number?.startsWith("D") ? "Bike" : r.slot_number?.startsWith("C") ? "EV" : "Car"),
              plan: "Hourly Plan",
              duration: r.duration || "1 hour",
              amount: parseFloat(String(r.fee || 50).replace(/[^0-9.]/g, "")) || 50,
              status: r.status === "Parked" ? "Pending" : "Paid",
              time: r.exit_time
                ? new Date(r.exit_time).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })
                : "Active Now"
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const parseDateTime = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const computeDurationAndFee = (startVal, endVal, planStr, plansList) => {
    const sDate = parseDateTime(startVal);
    const eDate = parseDateTime(endVal);
    if (!sDate || !eDate) return { text: "1 hour", hours: 1, fee: 50, isValid: true };
    const diffMs = eDate.getTime() - sDate.getTime();
    if (diffMs <= 0) {
      return { text: "Invalid: Exit must be after entry", hours: 0, fee: 0, isValid: false };
    }
    const totalMinutes = Math.round(diffMs / 60000);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const billedHours = Math.max(1, Math.ceil(totalMinutes / 60));

    let text = "";
    if (h > 0 && m > 0) text = `${h} hr ${m} min`;
    else if (h > 0) text = `${h} ${h === 1 ? "hour" : "hours"}`;
    else text = `${m} min`;

    let matchedPlan = plansList.find((p) => planStr.includes(p.plan_name) || p.plan_name === planStr);
    let rate = matchedPlan ? parseFloat(matchedPlan.rate) : 50;
    let isDaily = matchedPlan ? matchedPlan.billing_type === "Daily" : planStr.includes("Daily");

    if (!matchedPlan) {
      if (planStr.includes("₹20") || planStr.includes("₹25")) rate = 25;
      else if (planStr.includes("₹300") || planStr.includes("₹350")) rate = 350;
      else if (planStr.includes("₹60")) rate = 60;
      else if (planStr.includes("₹80")) rate = 80;
    }

    let fee = 0;
    if (isDaily) {
      const days = Math.max(1, Math.ceil(billedHours / 24));
      fee = days * rate;
    } else {
      fee = billedHours * rate;
    }
    return { text, hours: billedHours, fee, isValid: true };
  };

  useEffect(() => {
    const result = computeDurationAndFee(entryDateTime, exitDateTime, selectedPlan, dbPlans);
    setParkingDuration(result.text);
    setIsWindowValid(result.isValid);
    if (result.isValid) {
      setCalculatedAmount(result.fee);
    } else {
      setCalculatedAmount(0);
    }
  }, [entryDateTime, exitDateTime, selectedPlan, dbPlans]);

  const handleCalculate = () => {
    const result = computeDurationAndFee(entryDateTime, exitDateTime, selectedPlan, dbPlans);
    setParkingDuration(result.text);
    setIsWindowValid(result.isValid);
    if (result.isValid) {
      setCalculatedAmount(result.fee);
      if (setStatusActionMessage) {
        setStatusActionMessage(`Parking fee calculated: ₹${result.fee} for ${vehicleNumber || "Vehicle"} (${result.text})`);
        setTimeout(() => setStatusActionMessage(""), 3500);
      }
    } else {
      setCalculatedAmount(0);
      if (setStatusActionMessage) {
        setStatusActionMessage("Invalid booking timing: Exit date/time must be strictly after entry date/time.");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
    }
  };

  const handleReset = () => {
    setVehicleNumber("");
    setVehicleType("Car");
    const eTime = toDateTimeLocal(Date.now() - 3600000);
    const xTime = toDateTimeLocal(Date.now());
    setEntryDateTime(eTime);
    setExitDateTime(xTime);
    if (dbPlans.length > 0) {
      const first = dbPlans[0];
      setSelectedPlan(`${first.plan_name} (₹${parseFloat(first.rate).toFixed(0)}/${first.billing_type === "Daily" ? "day" : "hour"})`);
    } else {
      setSelectedPlan("Hourly Plan (₹50/hour)");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleCollectPayment = () => {
    if (!isWindowValid) {
      if (setStatusActionMessage) {
        setStatusActionMessage("Cannot collect payment: Exit date/time must be after entry date/time.");
        setTimeout(() => setStatusActionMessage(""), 4000);
      }
      return;
    }
    if (onProceedToPayment) {
      onProceedToPayment({
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        slot_number: "A-04",
        owner_name: "Walk-in Customer",
        owner_email: "",
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
          <div className="pw-calc-stat-icon-circle" style={{ background: "var(--bg-sub, #fef3c7)", color: "#d97706" }}>
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

          <div className="pw-calc-form-grid">
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
                {dbPlans.length > 0 ? (
                  dbPlans.map((p) => (
                    <option key={p.id} value={`${p.plan_name} (₹${parseFloat(p.rate).toFixed(0)}/${p.billing_type === "Daily" ? "day" : "hour"})`}>
                      {p.plan_name} (₹{parseFloat(p.rate).toFixed(0)}/{p.billing_type === "Daily" ? "day" : "hour"})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Hourly Plan (₹50/hour)">Hourly Plan (₹50/hour)</option>
                    <option value="Daily Plan (₹300/day)">Daily Plan (₹300/day)</option>
                    <option value="Bike Hourly Plan (₹20/hour)">Bike Hourly Plan (₹20/hour)</option>
                    <option value="SUV Hourly Plan (₹60/hour)">SUV Hourly Plan (₹60/hour)</option>
                    <option value="EV Fast Charge (₹80/hour)">EV Fast Charge (₹80/hour)</option>
                  </>
                )}
              </select>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Entry Date & Time <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pw-calc-icon-input-wrap">
                <Calendar size={15} className="pw-calc-input-icon" />
                <input
                  type="datetime-local"
                  className="pw-calc-input with-icon"
                  value={entryDateTime}
                  onChange={(e) => setEntryDateTime(e.target.value)}
                />
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Exit Date & Time <span style={{ color: "#ef4444" }}>*</span></label>
              <div className="pw-calc-icon-input-wrap">
                <Calendar size={15} className="pw-calc-input-icon" />
                <input
                  type="datetime-local"
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
                className={`pw-calc-input disabled-input ${!isWindowValid ? "pw-input-error" : ""}`}
                value={parkingDuration}
                readOnly
                style={!isWindowValid ? { borderColor: "#ef4444", color: "#ef4444", fontWeight: 700 } : {}}
              />
            </div>
          </div>

          {!isWindowValid && (
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#ef4444", fontSize: "0.82rem", fontWeight: 600 }}>
              <AlertCircle size={15} />
              <span>Exit time must be later than entry time. Please adjust the exit date/time.</span>
            </div>
          )}

          <div className="pw-calc-btn-row">
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
              disabled={!isWindowValid}
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
              <span className="pw-calc-detail-val" style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{vehicleNumber || "—"}</span>
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

          <div className="pw-calc-actions-grid">
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
              disabled={!isWindowValid}
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
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={15} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Recent Fee Calculations</h3>
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
                  <td style={{ color: "var(--text-secondary, #94a3b8)" }}>{item.id}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{item.vehicleNumber}</td>
                  <td style={{ color: "var(--text-secondary, #334155)" }}>{item.vehicleType}</td>
                  <td style={{ color: "var(--text-secondary, #334155)" }}>{item.plan}</td>
                  <td style={{ color: "var(--text-secondary, #334155)" }}>{item.duration}</td>
                  <td style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>₹ {item.amount}</td>
                  <td>
                    <span className={`pw-calc-status-pill ${item.status.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)" }}>{item.time}</td>
                  <td style={{ textAlign: "center" }}>
                    <button type="button" style={{ background: "none", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", padding: "4px" }} title="More options">
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

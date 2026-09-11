import { useState, useEffect } from "react";
import { Search, RefreshCw, Car, Bike, Zap, Crown, CheckCircle2, ArrowRight, Sparkles, Award } from "lucide-react";

export default function CustomerParkingPlans({ onSelectPlanAndReserve }) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");

  const defaultPlansFallback = [
    {
      id: 1,
      plan_code: "PLAN-CAR-HR",
      plan_name: "Standard Car Hourly",
      vehicle_type: "Car",
      billing_type: "Hourly",
      rate: "50.00",
      description: "Standard hourly parking rate for sedan and hatchback cars in Zone A & B.",
      features: ["Zone A / B Covered Parking", "CCTV 24/7 Monitoring", "Automated Boom Barrier Access"],
      is_active: true
    },
    {
      id: 2,
      plan_code: "PLAN-SUV-HR",
      plan_name: "SUV / Large Vehicle Hourly",
      vehicle_type: "SUV",
      billing_type: "Hourly",
      rate: "60.00",
      description: "Spacious high-clearance parking bay designed for large SUVs in Zone B.",
      features: ["Extra Wide Bay Spacing", "High Clearance Zone B", "Dedicated Security Warden"],
      is_active: true
    },
    {
      id: 3,
      plan_code: "PLAN-EV-HR",
      plan_name: "EV Fast Charging Hourly",
      vehicle_type: "EV",
      billing_type: "Hourly",
      rate: "80.00",
      description: "Premium EV parking bay with 60kW DC fast charging included in Zone C.",
      features: ["Zone C VIP Electric Bay", "60kW Fast DC Charging", "Priority Gate Entry / Exit"],
      is_active: true
    },
    {
      id: 4,
      plan_code: "PLAN-BIKE-HR",
      plan_name: "Two-Wheeler Hourly",
      vehicle_type: "Bike",
      billing_type: "Hourly",
      rate: "25.00",
      description: "Dedicated compact parking bay for motorcycles and scooters in Zone D.",
      features: ["Zone D Dedicated Bike Bay", "Helmet Storage Facility", "Quick Exit Lane Access"],
      is_active: true
    },
    {
      id: 5,
      plan_code: "PLAN-CAR-DAY",
      plan_name: "Full Day Car Pass",
      vehicle_type: "Car",
      billing_type: "Daily",
      rate: "350.00",
      description: "Unlimited 24-hour in-and-out parking privileges for cars.",
      features: ["24-Hour Multi-Entry Access", "Guaranteed Reserved Bay", "Complimentary Car Wash Token"],
      is_active: true
    },
    {
      id: 6,
      plan_code: "PLAN-BIKE-DAY",
      plan_name: "Two-Wheeler Daily Pass",
      vehicle_type: "Bike",
      billing_type: "Daily",
      rate: "150.00",
      description: "24-hour daily parking pass for two-wheelers in Zone D.",
      features: ["24-Hour Secure Parking", "Zone D Reserved Bay", "Zero Surcharge on Re-entry"],
      is_active: true
    },
    {
      id: 7,
      plan_code: "PLAN-EV-DAY",
      plan_name: "EV Full Day & Supercharge Pass",
      vehicle_type: "EV",
      billing_type: "Daily",
      rate: "550.00",
      description: "Full day premium parking with unlimited EV fast charging.",
      features: ["Full Day Zone C VIP Bay", "Unlimited EV Fast Charging", "Valet Assistance on Request"],
      is_active: true
    },
    {
      id: 8,
      plan_code: "PLAN-MONTHLY",
      plan_name: "Monthly VIP Priority Pass (Best Value)",
      vehicle_type: "All",
      billing_type: "Monthly",
      rate: "2500.00",
      description: "The ultimate all-inclusive parking experience. Enjoy guaranteed dedicated bays, unlimited 24/7 multi-entry, fastag RFID express lanes, and VIP concierge privileges with up to 75% savings.",
      features: [
        "100% Guaranteed Reserved VIP Bay (Zone A Ground Floor)",
        "Unlimited 24/7 Multi-Entry & In-Out Access",
        "Fastag RFID Automated Express Boom Barrier",
        "Complimentary Monthly Car Wash & EV Fast Boost",
        "24/7 Dedicated Concierge & VIP Bay Warden",
        "Zero Cancellation & 100% Free Date Rescheduling",
        "Priority Gate Express Lane (Zero Queue Waiting)",
        "Exclusive Gold VIP Dashboard Experience"
      ],
      is_active: true
    }
  ];

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/pricing-plans?active=true");
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.plans && data.plans.length > 0) {
        setPlans(data.plans);
      } else {
        setPlans(defaultPlansFallback);
      }
    } catch {
      setIsLoading(false);
      setPlans(defaultPlansFallback);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const getVehicleIcon = (type, isMonthly) => {
    if (isMonthly) return <Crown size={22} style={{ color: "#9A6B18" }} />;
    const t = (type || "").toLowerCase();
    if (t === "bike") return <Bike size={20} style={{ color: "#0d9488" }} />;
    if (t === "ev") return <Zap size={20} style={{ color: "#0284c7" }} />;
    if (t === "suv") return <Car size={20} style={{ color: "#7c3aed" }} />;
    return <Car size={20} style={{ color: "#0d9488" }} />;
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      (p.plan_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.plan_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const vType = (p.vehicle_type || "").toLowerCase();
    const matchesVehicle =
      vehicleFilter === "All" ||
      vType === vehicleFilter.toLowerCase() ||
      vType === "all";

    return matchesSearch && matchesVehicle;
  });

  const getFormattedRate = (plan) => {
    const val = parseFloat(plan.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const bType = (plan.billing_type || "").toLowerCase();
    if (bType === "monthly") return `₹ ${val} / month`;
    if (bType === "daily") return `₹ ${val} / day`;
    if (bType === "flat") return `₹ ${val} / flat pass`;
    return `₹ ${val} / hour`;
  };

  const premiumPlanItem = plans.find(
    (p) =>
      (p.billing_type || "").toLowerCase() === "monthly" ||
      (p.plan_code || "") === "PLAN-MONTHLY" ||
      (p.plan_name || "").toLowerCase().includes("vip")
  ) || defaultPlansFallback[7];

  const comparisonRows = [
    {
      feature: "Guaranteed Reserved Dedicated Bay",
      desc: "Fixed parking slot assigned exclusively to your vehicle",
      hourly: { val: "❌ Subject to Availability", type: "no" },
      daily: { val: "⚠️ Single-Day Lock", type: "limited" },
      vip: { val: "✓ 100% Reserved Zone A VIP Bay", type: "vip" }
    },
    {
      feature: "24/7 Unlimited Multi-Entry Access",
      desc: "In-and-out access as many times as you need",
      hourly: { val: "❌ Single Entry / Exit", type: "no" },
      daily: { val: "⚠️ 24-Hour Period Only", type: "limited" },
      vip: { val: "✓ Unlimited 24/7 Multi-Entry (30 Days)", type: "vip" }
    },
    {
      feature: "Fastag RFID Express Boom Barrier",
      desc: "Instant automated boom gate lift without scanning",
      hourly: { val: "❌ Manual Ticket Scan", type: "no" },
      daily: { val: "❌ Barcode Ticket Scan", type: "no" },
      vip: { val: "✓ Hands-Free Instant RFID Gate", type: "vip" }
    },
    {
      feature: "Priority Gate Express Lane",
      desc: "Skip peak-hour vehicle queues with dedicated lane",
      hourly: { val: "❌ Standard Queue", type: "no" },
      daily: { val: "❌ Standard Queue", type: "no" },
      vip: { val: "✓ Priority Zero-Wait VIP Lane", type: "vip" }
    },
    {
      feature: "Complimentary Monthly Car Wash & Detailing",
      desc: "Full exterior foaming and interior vacuum token",
      hourly: { val: "❌ Not Included", type: "no" },
      daily: { val: "⚠️ Discount Token Only", type: "limited" },
      vip: { val: "✓ Included Free Every Month", type: "vip" }
    },
    {
      feature: "EV Fast Charging & Power Boost",
      desc: "60kW DC Rapid charging capability",
      hourly: { val: "❌ Standard Rate (₹80/hr)", type: "limited" },
      daily: { val: "⚠️ EV Pass Only (₹550)", type: "limited" },
      vip: { val: "✓ Priority Charger Access Included", type: "vip" }
    },
    {
      feature: "24/7 Dedicated Concierge & Personal Warden",
      desc: "On-demand valet assistance and personal security",
      hourly: { val: "❌ CCTV Only", type: "no" },
      daily: { val: "❌ CCTV Only", type: "no" },
      vip: { val: "✓ Dedicated VIP Concierge & Guard", type: "vip" }
    },
    {
      feature: "Free Cancellation & Unlimited Date Changes",
      desc: "100% flexibility if your schedule changes",
      hourly: { val: "❌ Standard Policy", type: "no" },
      daily: { val: "❌ Non-Refundable", type: "no" },
      vip: { val: "✓ 100% Free Rescheduling & Zero Fees", type: "vip" }
    },
    {
      feature: "Luxury Gold VIP Theme & Status Badge",
      desc: "Gold executive interface and VIP customer badge",
      hourly: { val: "❌ Standard Theme", type: "no" },
      daily: { val: "❌ Standard Theme", type: "no" },
      vip: { val: "✓ Exclusive Gold VIP Theme & Card", type: "vip" }
    }
  ];

  return (
    <div className="pw-customer-plans-catalog-module" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div className="pw-vip-savings-highlight-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(154, 107, 24, 0.35)", flexShrink: 0 }}>
            <Crown size={26} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "#12233F", margin: 0 }}>
                Monthly VIP Premium Membership
              </h3>
              <span style={{ background: "#713F12", color: "#FEF08A", fontSize: "0.7rem", fontWeight: 800, padding: "2px 10px", borderRadius: "999px", letterSpacing: "0.5px" }}>
                BEST VALUE • SAVE 76%
              </span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#78350F", margin: "4px 0 0 0", fontWeight: 600 }}>
              Enjoy guaranteed Zone A reserved bays, hands-free Fastag RFID gate access, unlimited 24/7 multi-entry, and free monthly car wash for just ₹2,500/month.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="pw-btn-gold"
          style={{ padding: "10px 22px", borderRadius: "8px", fontSize: "0.88rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
          onClick={() => onSelectPlanAndReserve && onSelectPlanAndReserve(premiumPlanItem)}
        >
          <Sparkles size={16} />
          <span>Unlock VIP Premium</span>
          <ArrowRight size={16} />
        </button>
      </div>

      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Available Plans</span>
          <span className="pw-metric-value">{plans.length}</span>
          <span className="pw-metric-trend positive">
            <span>Configured by Management</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Hourly Tiers</span>
          <span className="pw-metric-value">{plans.filter(p => p.billing_type === "Hourly").length}</span>
          <span className="pw-metric-trend positive">
            <span>Flexible short visits</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Day Passes</span>
          <span className="pw-metric-value">{plans.filter(p => p.billing_type === "Daily").length}</span>
          <span className="pw-metric-trend positive">
            <span>24-Hour full day savings</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ background: "linear-gradient(180deg, #FFFCF5 0%, #FFFFFF 100%)", border: "1.5px solid #EAB308" }}>
          <span className="pw-metric-label" style={{ color: "#854D0E" }}>VIP Premium Plan</span>
          <span className="pw-metric-value" style={{ color: "#713F12" }}>Best Value</span>
          <span className="pw-metric-trend positive">
            <span style={{ color: "#854D0E", fontWeight: 700 }}>Save ₹7,500+ / mo</span>
          </span>
        </div>
      </div>

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "12px 18px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div className="pw-plans-search-group" style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, flexWrap: "wrap" }}>
          <div className="pw-search-box-pill" style={{ width: "300px" }}>
            <Search size={15} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search plan name, vehicle, feature..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-filter-pills-row" style={{ display: "flex", gap: "6px" }}>
            {["All", "Car", "SUV", "EV", "Bike"].map((v) => (
              <button
                key={v}
                type="button"
                className={`pw-filter-pill ${vehicleFilter === v ? "active" : ""}`}
                onClick={() => setVehicleFilter(v)}
                style={{
                  background: vehicleFilter === v ? "#0d9488" : "#f1f5f9",
                  color: vehicleFilter === v ? "#ffffff" : "#475569",
                  border: vehicleFilter === v ? "1px solid #0d9488" : "1px solid #cbd5e1",
                  borderRadius: "20px",
                  padding: "5px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {v === "All" ? "All Vehicle Types" : v}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="pw-btn-action-refresh"
          onClick={fetchPlans}
          title="Refresh Plans"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="pw-plans-cards-trio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(295px, 1fr))", gap: "20px" }}>
        {filteredPlans.map((p) => {
          const isMonthly = (p.billing_type || "").toLowerCase() === "monthly" || (p.plan_name || "").toLowerCase().includes("monthly") || (p.plan_name || "").toLowerCase().includes("vip");

          return (
            <div
              key={p.id || p.plan_code}
              className={`pw-customer-pricing-card ${isMonthly ? "pw-premium-highlight-card selected-monthly-plan" : ""}`}
              style={{
                borderRadius: "14px",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "14px",
                background: isMonthly ? "linear-gradient(180deg, #FFFDF7 0%, #FFFFFF 100%)" : "#ffffff",
                border: isMonthly ? "2px solid #D4AF37" : "1.5px solid #e2e8f0",
                boxShadow: isMonthly ? "0 8px 24px rgba(212, 175, 55, 0.18)" : "0 2px 8px rgba(15,23,42,0.04)",
                position: "relative"
              }}
            >
              {isMonthly && (
                <div className="pw-plan-ribbon-best-value">
                  <Crown size={11} />
                  <span>BEST VALUE • VIP EXCLUSIVE</span>
                </div>
              )}

              <div>
                <div className="pw-plan-card-top-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div
                    className="pw-plan-card-icon-circle"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "10px",
                      background: isMonthly ? "#FDF0CD" : "#f0fdfa",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {getVehicleIcon(p.vehicle_type, isMonthly)}
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" }}>
                      {p.vehicle_type}
                    </span>
                    {isMonthly ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#F5E7C3", color: "#9A6B18", border: "1px solid #C99A2E", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>
                        <Crown size={11} />
                        <span>VIP PASS</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "6px", background: "#f0fdfa", color: "#0f766e", border: "1px solid #ccfbf1" }}>
                        {p.billing_type}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: isMonthly ? "#9A6B18" : "#12233F", margin: "0 0 4px 0" }}>
                    {p.plan_name}
                  </h3>
                  <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0, minHeight: "38px", lineHeight: 1.45 }}>
                    {p.description || "Official parking plan configured with reserved bay access and security monitoring."}
                  </p>
                </div>

                <div
                  className="pw-customer-plan-rate-banner"
                  style={{
                    margin: "14px 0",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    background: isMonthly ? "linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)" : "#f0fdfa",
                    border: isMonthly ? "1px solid #EAB308" : "1px solid #ccfbf1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}
                >
                  <span style={{ fontSize: "1.18rem", fontWeight: 900, color: isMonthly ? "#713F12" : "#0d9488" }}>
                    {getFormattedRate(p)}
                  </span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: isMonthly ? "#854D0E" : "#0f766e" }}>
                    {p.plan_code}
                  </span>
                </div>

                <div className="pw-customer-plan-features-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(Array.isArray(p.features) ? p.features : ["Standard Bay Access", "24/7 Security"]).map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.82rem", color: "#334155" }}>
                      <CheckCircle2 size={15} style={{ color: isMonthly ? "#B45309" : "#10b981", flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontWeight: isMonthly ? 600 : 400, color: isMonthly ? "#1E293B" : "#334155" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "10px", paddingTop: "14px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <button
                  type="button"
                  className={`pw-calc-btn-submit ${isMonthly ? "pw-btn-gold" : ""}`}
                  style={{ width: "100%", padding: "11px 16px", fontSize: "0.88rem", fontWeight: 800, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                  onClick={() => onSelectPlanAndReserve && onSelectPlanAndReserve(p)}
                >
                  {isMonthly ? (
                    <>
                      <Crown size={15} />
                      <span>Choose Premium VIP Plan</span>
                      <ArrowRight size={15} />
                    </>
                  ) : (
                    <>
                      <span>Choose Plan & Reserve</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pw-comparison-matrix-wrapper">
        <div className="pw-comparison-matrix-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Award size={20} style={{ color: "#FACC15" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: 0 }}>
                Comprehensive Plan Comparison Matrix
              </h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#94A3B8", margin: "4px 0 0 0" }}>
              Compare features and privileges across Hourly, Daily, and Premium VIP tiers.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", background: "rgba(250, 204, 21, 0.15)", color: "#FACC15", border: "1px solid rgba(250, 204, 21, 0.4)", padding: "4px 12px", borderRadius: "999px", fontWeight: 700 }}>
              👑 Premium VIP includes ALL privileges
            </span>
          </div>
        </div>

        <div className="pw-comparison-matrix-table-wrap">
          <table className="pw-comparison-table">
            <thead>
              <tr>
                <th style={{ width: "34%" }}>Feature / Privilege</th>
                <th style={{ width: "22%", textAlign: "center" }}>Hourly Tier (₹25 - ₹80)</th>
                <th style={{ width: "22%", textAlign: "center" }}>Full Day Pass (₹150 - ₹550)</th>
                <th className="vip-col-header" style={{ width: "22%" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.88rem" }}>
                    <Crown size={15} />
                    <span>Monthly VIP Pass (₹2,500)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="feature-title-col">
                    <div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1E293B" }}>{row.feature}</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748B", fontWeight: 400, marginTop: "2px" }}>{row.desc}</div>
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`pw-val-pill-${row.hourly.type}`}>
                      {row.hourly.val}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`pw-val-pill-${row.daily.type}`}>
                      {row.daily.val}
                    </span>
                  </td>
                  <td className="vip-col-cell">
                    <span className="pw-val-pill-vip">
                      {row.vip.val}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#F8FAFC" }}>
                <td style={{ padding: "16px 18px", fontWeight: 800, color: "#1E293B" }}>
                  Selected Plan Recommendation
                </td>
                <td style={{ textAlign: "center", padding: "16px 18px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>Best for short errands</span>
                </td>
                <td style={{ textAlign: "center", padding: "16px 18px" }}>
                  <span style={{ fontSize: "0.78rem", color: "#64748B", fontWeight: 600 }}>Best for single day trips</span>
                </td>
                <td className="vip-col-cell" style={{ padding: "16px 18px", textAlign: "center" }}>
                  <button
                    type="button"
                    className="pw-btn-gold"
                    style={{ width: "100%", padding: "8px 14px", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer" }}
                    onClick={() => onSelectPlanAndReserve && onSelectPlanAndReserve(premiumPlanItem)}
                  >
                    <Crown size={14} />
                    <span>Get Premium VIP</span>
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

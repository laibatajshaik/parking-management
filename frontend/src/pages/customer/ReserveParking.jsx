import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import { Car, Bike, Zap, Calendar, Check, ChevronDown, Crown, Sparkles, CreditCard, Smartphone, Layers, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw } from "lucide-react";

export default function ReserveParking({ loggedInUser, onNavigate, isPremiumActive, onActivatePremium, preselectedPlan }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState("All Vehicle Types");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [entryDateTime, setEntryDateTime] = useState("02-09-2025 10:00 AM");
  const [exitDateTime, setExitDateTime] = useState("02-09-2025 02:00 PM");
  const [duration] = useState("4 hours");
  const [selectedZone, setSelectedZone] = useState("Zone A");
  const [selectedSlot, setSelectedSlot] = useState("A-04");
  const [vehiclePlate, setVehiclePlate] = useState("KA01 AB 1234");
  const [vehicleModel, setVehicleModel] = useState("Hyundai Creta");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Fastag");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const defaultPlans = [
    {
      id: 11,
      plan_code: "PLAN-CAR-HR",
      plan_name: "Standard Car Hourly",
      vehicle_type: "Car",
      billing_type: "Hourly",
      rate: "50.00",
      duration_hours: 1.0,
      description: "Standard hourly parking rate for sedan and hatchback cars in Zone A & B.",
      features: ["Zone A / B Covered Parking", "CCTV 24/7 Monitoring", "Automated Boom Barrier Access"],
      is_active: true,
      isPopular: true
    },
    {
      id: 2,
      plan_code: "PLAN-SUV-HR",
      plan_name: "SUV / Large Vehicle Hourly",
      vehicle_type: "SUV",
      billing_type: "Hourly",
      rate: "60.00",
      duration_hours: 1.0,
      description: "Spacious high-clearance parking bay designed for large SUVs in Zone B.",
      features: ["Extra Wide Bay Spacing", "High Clearance Zone B", "Dedicated Security Warden"],
      is_active: true,
      isPopular: false
    },
    {
      id: 3,
      plan_code: "PLAN-EV-HR",
      plan_name: "EV Fast Charging Hourly",
      vehicle_type: "EV",
      billing_type: "Hourly",
      rate: "80.00",
      duration_hours: 1.0,
      description: "Premium EV parking bay with 60kW DC fast charging included in Zone C.",
      features: ["Zone C VIP Electric Bay", "60kW Fast DC Charging", "Priority Gate Entry / Exit"],
      is_active: true,
      isPopular: false
    },
    {
      id: 4,
      plan_code: "PLAN-BIKE-HR",
      plan_name: "Two-Wheeler Hourly",
      vehicle_type: "Bike",
      billing_type: "Hourly",
      rate: "25.00",
      duration_hours: 1.0,
      description: "Dedicated compact parking bay for motorcycles and scooters in Zone D.",
      features: ["Zone D Dedicated Bike Bay", "Helmet Storage Facility", "Quick Exit Lane Access"],
      is_active: true,
      isPopular: false
    },
    {
      id: 5,
      plan_code: "PLAN-CAR-DAY",
      plan_name: "Full Day Car Pass",
      vehicle_type: "Car",
      billing_type: "Daily",
      rate: "350.00",
      duration_hours: 24.0,
      description: "Unlimited 24-hour in-and-out parking privileges for cars.",
      features: ["24-Hour Multi-Entry Access", "Guaranteed Reserved Bay", "Complimentary Car Wash Token"],
      is_active: true,
      isPopular: false
    },
    {
      id: 6,
      plan_code: "PLAN-BIKE-DAY",
      plan_name: "Two-Wheeler Daily Pass",
      vehicle_type: "Bike",
      billing_type: "Daily",
      rate: "150.00",
      duration_hours: 24.0,
      description: "24-hour daily parking pass for two-wheelers in Zone D.",
      features: ["24-Hour Secure Parking", "Zone D Reserved Bay", "Zero Surcharge on Re-entry"],
      is_active: true,
      isPopular: false
    },
    {
      id: 7,
      plan_code: "PLAN-EV-DAY",
      plan_name: "EV Full Day & Supercharge Pass",
      vehicle_type: "EV",
      billing_type: "Daily",
      rate: "550.00",
      duration_hours: 24.0,
      description: "Full day premium parking with unlimited EV fast charging.",
      features: ["Full Day Zone C VIP Bay", "Unlimited EV Fast Charging", "Valet Assistance on Request"],
      is_active: true,
      isPopular: false
    },
    {
      id: 18,
      plan_code: "PLAN-MONTHLY",
      plan_name: "Monthly VIP Priority Pass (Best Value)",
      vehicle_type: "All",
      billing_type: "Monthly",
      rate: "2500.00",
      duration_hours: 720.0,
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
      is_active: true,
      isPopular: false
    }
  ];

  const [plansList, setPlansList] = useState(defaultPlans);
  const [selectedPlanObject, setSelectedPlanObject] = useState(preselectedPlan || defaultPlans[0]);

  const fetchActivePlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing-plans?active=true`);
      const data = await res.json();
      setIsLoadingPlans(false);
      if (data.success && data.plans && data.plans.length > 0) {
        setPlansList(data.plans);
        if (!selectedPlanObject) {
          setSelectedPlanObject(data.plans[0]);
        }
      }
    } catch {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchActivePlans();
  }, []);

  useEffect(() => {
    if (preselectedPlan) {
      setSelectedPlanObject(preselectedPlan);
    }
  }, [preselectedPlan]);

  const isCurrentPlanMonthly = () => {
    if (!selectedPlanObject) return false;
    const bType = (selectedPlanObject.billing_type || "").toLowerCase();
    const pName = (selectedPlanObject.plan_name || "").toLowerCase();
    const pCode = (selectedPlanObject.plan_code || "").toLowerCase();
    return bType === "monthly" || pName.includes("monthly") || pName.includes("vip") || pCode === "plan-monthly";
  };

  const getPlanCost = () => {
    if (!selectedPlanObject) return 200;
    const rate = parseFloat(selectedPlanObject.rate) || 50;
    const bType = (selectedPlanObject.billing_type || "").toLowerCase();
    if (bType === "monthly") return rate;
    if (bType === "daily") return rate;
    if (bType === "flat") return rate;
    return rate * 4;
  };

  const getPlanRateBannerText = (plan) => {
    const val = parseFloat(plan.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const bType = (plan.billing_type || "").toLowerCase();
    if (bType === "monthly") return `₹ ${val} / month`;
    if (bType === "daily") return `₹ ${val} / day`;
    if (bType === "flat") return `₹ ${val} / flat pass`;
    return `₹ ${val} / hour`;
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlanObject(plan);
  };

  const handleProceedToSlot = () => {
    setCurrentStep(2);
  };

  const handleProceedToConfirm = () => {
    setCurrentStep(3);
  };

  const handleProceedToPayment = () => {
    setCurrentStep(4);
  };

  const handleCompletePayment = async () => {
    const isMonthly = isCurrentPlanMonthly();
    const custEmail = loggedInUser?.email || "customer@shnoor.com";
    const custName = loggedInUser?.name || "Customer";

    try {
      await fetch(`${API_BASE_URL}/api/customer/reserve-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: custName,
          customer_email: custEmail,
          customer_phone: loggedInUser?.phone || "+91 98765 43210",
          vehicle_number: vehiclePlate,
          vehicle_type: selectedPlanObject?.vehicle_type || "Car",
          model: vehicleModel,
          slot_number: selectedSlot,
          zone: selectedZone,
          duration_hours: selectedPlanObject?.duration_hours || 2,
          total_amount: getPlanCost(),
          plan_code: selectedPlanObject?.plan_code || "PLAN-STD",
          plan_name: selectedPlanObject?.plan_name || "Standard Parking"
        })
      });
    } catch (err) {
      void err;
    }

    if (isMonthly) {
      if (onActivatePremium) {
        onActivatePremium({
          active: true,
          plan: selectedPlanObject?.plan_name || "Monthly VIP Plan",
          planName: selectedPlanObject?.plan_name || "Monthly VIP Plan",
          amount: getPlanCost(),
          validFrom: "02 Sep 2025",
          validUntil: "02 Oct 2025",
          remainingDays: 30,
          slot: `${selectedSlot} (${selectedZone})`,
          vehicle: vehiclePlate
        });
      }
      try {
        await fetch(`${API_BASE_URL}/api/customer/activate-premium`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: custEmail,
            customer_name: custName,
            plan_name: selectedPlanObject?.plan_name || "Monthly VIP Plan",
            amount: getPlanCost(),
            slot: `${selectedSlot} (${selectedZone})`,
            vehicle: vehiclePlate
          })
        });
      } catch (err) {
        void err;
      }
    }
    setIsSuccessModalOpen(true);
  };

  const handleFinish = () => {
    setIsSuccessModalOpen(false);
    if (onNavigate) {
      if (isCurrentPlanMonthly()) {
        onNavigate("dashboard");
      } else {
        onNavigate("parking-history");
      }
    }
  };

  const getVehicleIcon = (type, isMonthly) => {
    if (isMonthly) return <Crown size={22} style={{ color: "#9A6B18" }} />;
    const t = (type || "").toLowerCase();
    if (t === "bike") return <Bike size={20} className="icon-teal" />;
    if (t === "ev") return <Zap size={20} className="icon-teal" />;
    if (t === "suv") return <Car size={20} className="icon-teal" />;
    return <Car size={20} className="icon-teal" />;
  };

  const filteredPlans = plansList.filter((p) => {
    if (vehicleFilter === "All Vehicle Types" || vehicleFilter === "All") return true;
    const vType = (p.vehicle_type || "").toLowerCase();
    const filter = vehicleFilter.toLowerCase();
    return vType === filter || vType === "all";
  });

  return (
    <div className="pw-reserve-screen-wrapper" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {isPremiumActive && (
        <div className="pw-premium-active-banner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #F5E7C3 0%, #FBF7EE 100%)", border: "1.5px solid #C99A2E", borderRadius: "12px", padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Crown size={20} />
            </div>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>👑 Active Premium Membership</div>
              <div style={{ fontSize: "0.78rem", color: "#9A6B18", fontWeight: 600 }}>Your Monthly VIP Plan is active with unlimited priority parking & reserved bays.</div>
            </div>
          </div>
          <span style={{ fontSize: "0.74rem", fontWeight: 800, background: "#C99A2E", color: "#ffffff", padding: "4px 12px", borderRadius: "999px" }}>
            VIP ACTIVE
          </span>
        </div>
      )}

      <div className="pw-customer-stepper-row">
        <div className={`pw-stepper-item ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`} onClick={() => setCurrentStep(1)} style={{ cursor: "pointer" }}>
          <span className="pw-stepper-number">1</span>
          <span className="pw-stepper-label">Select Plan</span>
        </div>
        <div className={`pw-stepper-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`} onClick={() => setCurrentStep(2)} style={{ cursor: "pointer" }}>
          <span className="pw-stepper-number">2</span>
          <span className="pw-stepper-label">Choose Slot</span>
        </div>
        <div className={`pw-stepper-item ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`} onClick={() => setCurrentStep(3)} style={{ cursor: "pointer" }}>
          <span className="pw-stepper-number">3</span>
          <span className="pw-stepper-label">Confirm Details</span>
        </div>
        <div className={`pw-stepper-item ${currentStep === 4 ? "active" : ""}`}>
          <span className="pw-stepper-number">4</span>
          <span className="pw-stepper-label">Make Payment</span>
        </div>
      </div>

      {currentStep === 1 && (
        <>
          <div className="pw-plans-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Available Parking Plans</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", margin: "3px 0 0 0" }}>Choose a plan configured for your vehicle type and parking duration.</p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  className="pw-vehicle-filter-pill"
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-card, #ffffff)", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary, #1e293b)", cursor: "pointer" }}
                >
                  <span>{vehicleFilter}</span>
                  <ChevronDown size={14} style={{ color: "var(--text-secondary, #94a3b8)" }} />
                </button>

                {isFilterDropdownOpen && (
                  <div style={{ position: "absolute", right: 0, top: "110%", background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 100, minWidth: "180px", padding: "6px 0" }}>
                    {["All Vehicle Types", "Car", "SUV", "EV", "Bike"].map((item) => (
                      <button
                        key={item}
                        type="button"
                        style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 14px", border: "none", background: vehicleFilter === item ? "var(--bg-teal-sub, #f0fdfa)" : "transparent", color: vehicleFilter === item ? "#0f766e" : "#334155", fontWeight: vehicleFilter === item ? 700 : 500, fontSize: "0.82rem", cursor: "pointer" }}
                        onClick={() => {
                          setVehicleFilter(item);
                          setIsFilterDropdownOpen(false);
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={fetchActivePlans}
                title="Refresh Available Plans"
                style={{ padding: "8px 12px" }}
              >
                <RefreshCw size={14} className={isLoadingPlans ? "pw-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="pw-plans-cards-trio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(295px, 1fr))", gap: "18px", alignItems: "start" }}>
            {filteredPlans.map((p) => {
              const isSelected = selectedPlanObject && (selectedPlanObject.id === p.id || selectedPlanObject.plan_code === p.plan_code);
              const isMonthly = (p.billing_type || "").toLowerCase() === "monthly" || (p.plan_name || "").toLowerCase().includes("monthly") || (p.plan_name || "").toLowerCase().includes("vip");

              return (
                <div
                  key={p.id || p.plan_code}
                  className={`pw-customer-pricing-card ${isMonthly ? "pw-premium-highlight-card" : ""} ${isSelected ? (isMonthly ? "selected-monthly-plan" : "selected") : ""}`}
                  onClick={() => handleSelectPlan(p)}
                  style={{ position: "relative", height: "fit-content", alignSelf: "start" }}
                >
                  {isMonthly && (
                    <div className="pw-plan-ribbon-best-value">
                      <Crown size={11} />
                      <span>BEST VALUE • 76% OFF</span>
                    </div>
                  )}

                  <div className="pw-plan-card-top-row">
                    <div className="pw-plan-card-icon-circle" style={{ background: isMonthly ? "var(--bg-sub, #FDF0CD)" : isSelected ? "var(--bg-teal-sub, #e6fffa)" : "var(--bg-teal-sub, #f0fdfa)" }}>
                      {getVehicleIcon(p.vehicle_type, isMonthly)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 7px", borderRadius: "6px", background: "var(--bg-sub, #f8fafc)", color: "var(--text-secondary, #94a3b8)", border: "1px solid var(--border-color, #cbd5e1)" }}>
                        {p.vehicle_type}
                      </span>
                      {isMonthly ? (
                        <span className="pw-plan-premium-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#F5E7C3", color: "#9A6B18", border: "1px solid #C99A2E", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 800 }}>
                          <Crown size={11} />
                          <span>VIP PASS</span>
                        </span>
                      ) : p.billing_type === "Daily" ? (
                        <span style={{ background: "var(--bg-teal-sub, #f0fdf4)", color: "#16a34a", border: "1px solid var(--border-color, #bbf7d0)", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700 }}>
                          Full Day
                        </span>
                      ) : (
                        <span style={{ background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", border: "1px solid #ccfbf1", padding: "2px 8px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700 }}>
                          Hourly
                        </span>
                      )}
                    </div>

                    <div className={`pw-plan-radio-circle ${isSelected ? (isMonthly ? "checked-gold" : "checked") : ""}`}>
                      {isSelected && <Check size={12} style={{ color: "#ffffff", strokeWidth: 3 }} />}
                    </div>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <h3 className="pw-customer-plan-title" style={{ color: isMonthly ? "#facc15" : "var(--text-primary, #12233F)", fontSize: "1.05rem", fontWeight: 800 }}>
                      {p.plan_name}
                    </h3>
                    <p className="pw-customer-plan-sub" style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)", margin: "4px 0 0 0", lineHeight: 1.45 }}>
                      {p.description || "Standard vehicle parking bay coverage with automated clearance."}
                    </p>
                  </div>

                  <div className={`pw-customer-plan-rate-banner ${isMonthly ? "selected-gold-rate" : isSelected ? "selected-rate" : ""}`} style={{ background: isMonthly ? "linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)" : undefined, border: isMonthly ? "1px solid #EAB308" : undefined, display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap", margin: "12px 0", padding: "10px 14px", borderRadius: "8px" }}>
                    <span className="pw-customer-plan-rate-text" style={{ color: isMonthly ? "#713F12" : undefined, fontSize: "1.1rem", fontWeight: 800 }}>{getPlanRateBannerText(p)}</span>
                    <span style={{ fontSize: "0.72rem", opacity: 0.95, fontWeight: 800, color: isMonthly ? "#854D0E" : "var(--brand-primary, #0d9488)", padding: "2px 7px", borderRadius: "6px", background: isMonthly ? "rgba(234, 179, 8, 0.2)" : "rgba(13, 148, 136, 0.12)" }}>{p.plan_code}</span>
                  </div>

                  <div className="pw-customer-plan-features-list" style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    {(Array.isArray(p.features) ? p.features : ["Covered Bay Access", "24/7 Security"]).map((feat, idx) => (
                      <div key={idx} className="pw-plan-feat-item" style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.82rem" }}>
                        <Check size={14} className={isMonthly ? "pw-feat-check-gold" : "pw-feat-check-icon"} style={{ color: isMonthly ? "#B45309" : "#10b981", flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ fontWeight: isMonthly ? 600 : 400, color: isMonthly ? "var(--text-primary, #1E293B)" : "var(--text-secondary, #334155)", lineHeight: 1.35 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pw-calc-box-card" style={{ padding: "20px" }}>
            <div className="pw-calc-box-header" style={{ marginBottom: "16px" }}>
              <div className="pw-calc-header-icon-box">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="pw-calc-card-title">Select Date & Time</h3>
              </div>
            </div>

            <div className="pw-date-time-fields-grid">
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Entry Date & Time</label>
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
                  value={
                    selectedPlanObject?.billing_type === "Monthly"
                      ? "30 Days (1 Month)"
                      : selectedPlanObject?.billing_type === "Daily"
                      ? "24 Hours (1 Day)"
                      : duration
                  }
                  readOnly
                />
              </div>
            </div>

            <div className={`pw-reserve-cost-summary-box ${isCurrentPlanMonthly() ? "gold-cost-box" : ""}`} style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: isCurrentPlanMonthly() ? "linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)" : "#f0fdfa", border: isCurrentPlanMonthly() ? "1.5px solid #EAB308" : "1px solid #ccfbf1", borderRadius: "10px", padding: "14px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isCurrentPlanMonthly() ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                  {isCurrentPlanMonthly() ? <Crown size={20} /> : "P"}
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isCurrentPlanMonthly() ? "#facc15" : "var(--text-primary, #12233F)" }}>
                    {isCurrentPlanMonthly() ? "👑 Monthly VIP Premium Pass (Best Value)" : `Estimated Cost: ${selectedPlanObject?.plan_name || "Parking Plan"}`}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: isCurrentPlanMonthly() ? "#854D0E" : "#64748b", fontWeight: isCurrentPlanMonthly() ? 600 : 400 }}>
                    {isCurrentPlanMonthly() ? "Includes 100% guaranteed VIP bay, unlimited 24/7 in-out, Fastag RFID & free monthly car wash" : `Calculated based on ${selectedPlanObject?.billing_type || "Hourly"} tariff`}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: isCurrentPlanMonthly() ? "#713F12" : "#0d9488" }}>
                ₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
                style={{ padding: "12px 34px", fontSize: "0.92rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
                onClick={handleProceedToSlot}
              >
                <span>Proceed to Choose Slot</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {currentStep === 2 && (
        <div className="pw-calc-box-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h3 className="pw-calc-card-title">Step 2: Choose Parking Slot & Zone</h3>
              <p className="pw-calc-card-sub">Select your desired parking bay location</p>
            </div>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isCurrentPlanMonthly() ? "#9A6B18" : "#0d9488" }}>
              Selected Plan: {selectedPlanObject?.plan_name || "Parking Plan"}
            </span>
          </div>

          <div className="pw-zone-selector-grid">
            {["Zone A (Ground - VIP)", "Zone B (Basement)", "Zone C (EV Fast)", "Zone D (Bikes)"].map((z) => {
              const isZ = selectedZone.includes(z.slice(0, 6));
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => setSelectedZone(z)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: isZ ? (isCurrentPlanMonthly() ? "2px solid #C99A2E" : "2px solid #0d9488") : "1px solid #cbd5e1",
                    background: isZ ? (isCurrentPlanMonthly() ? "#FDF0CD" : "#f0fdfa") : "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: isZ ? (isCurrentPlanMonthly() ? "#713F12" : "#0f766e") : "#334155",
                    cursor: "pointer"
                  }}
                >
                  {z}
                </button>
              );
            })}
          </div>

          <label className="pw-calc-label" style={{ marginBottom: "8px", display: "block" }}>Available Bays in {selectedZone}</label>
          <div className="pw-bay-selection-grid">
            {["A-01", "A-02", "A-03", "A-04", "A-05", "A-06"].map((slot) => {
              const isSel = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  style={{
                    padding: "14px 8px",
                    borderRadius: "8px",
                    border: isSel ? (isCurrentPlanMonthly() ? "2px solid #C99A2E" : "2px solid #0d9488") : "1px solid #e2e8f0",
                    background: isSel ? (isCurrentPlanMonthly() ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488") : "#ffffff",
                    color: isSel ? "#ffffff" : "#0f172a",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  <div>Bay {slot}</div>
                  <div style={{ fontSize: "0.68rem", opacity: 0.8, marginTop: "2px" }}>{isSel ? "Selected" : "Available"}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="pw-calc-btn-reset"
              onClick={() => setCurrentStep(1)}
            >
              <ArrowLeft size={15} />
              <span>Back to Plans</span>
            </button>

            <button
              type="button"
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              onClick={handleProceedToConfirm}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
              <span>Confirm Details</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="pw-calc-box-card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "18px" }}>
            <h3 className="pw-calc-card-title">Step 3: Confirm Reservation Details</h3>
            <p className="pw-calc-card-sub">Verify your vehicle and schedule summary before completing payment</p>
          </div>

          <div className="pw-calc-form-grid" style={{ marginBottom: "20px" }}>
            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Vehicle License Plate</label>
              <input
                type="text"
                className="pw-calc-input"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
              />
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Vehicle Model</label>
              <input
                type="text"
                className="pw-calc-input"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
              />
            </div>
          </div>

          {isCurrentPlanMonthly() && (
            <div style={{ background: "linear-gradient(135deg, #1c1809 0%, #2a200a 100%)", border: "1.5px solid #EAB308", borderRadius: "10px", padding: "14px 18px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "var(--text-gold, #facc15)", fontSize: "0.92rem", marginBottom: "6px" }}>
                <Crown size={16} />
                <span>Premium VIP Privileges Activated for this Booking:</span>
              </div>
              <div className="pw-vip-perks-grid">
                <div>✓ 100% Guaranteed Reserved Bay (Zone A)</div>
                <div>✓ 24/7 Unlimited In-and-Out Access (30 Days)</div>
                <div>✓ Automated Fastag RFID Express Boom Barrier</div>
                <div>✓ Free Monthly Car Wash & EV Fast Charging Boost</div>
              </div>
            </div>
          )}

          <div className="pw-calc-details-list" style={{ background: "var(--bg-sub, #f8fafc)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "20px" }}>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Customer Name</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val">{loggedInUser?.name || "Customer"}</span></div>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Selected Plan</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val">{selectedPlanObject?.plan_name || "Parking Plan"} ({selectedPlanObject?.plan_code || "PLAN"})</span></div>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Vehicle Type</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val">{selectedPlanObject?.vehicle_type || "Car"}</span></div>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Assigned Bay</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val">Bay {selectedSlot} ({selectedZone})</span></div>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Start Date & Time</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val">{entryDateTime}</span></div>
            <div className="pw-calc-detail-row"><span className="pw-calc-detail-key">Total Tariff</span><span className="pw-calc-detail-colon">:</span><span className="pw-calc-detail-val" style={{ color: isCurrentPlanMonthly() ? "#9A6B18" : "#0d9488", fontSize: "1.1rem" }}>₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="pw-calc-btn-reset"
              onClick={() => setCurrentStep(2)}
            >
              <ArrowLeft size={15} />
              <span>Back to Slots</span>
            </button>

            <button
              type="button"
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              onClick={handleProceedToPayment}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            >
              <span>Proceed to Payment (₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="pw-calc-box-card" style={{ padding: "24px" }}>
          <div style={{ marginBottom: "18px" }}>
            <h3 className="pw-calc-card-title">Step 4: Select Payment Method & Finalize</h3>
            <p className="pw-calc-card-sub">Choose your secure payment mode to confirm instant reservation</p>
          </div>

          <div className="pw-payment-method-selector-grid">
            {[
              { id: "UPI / Fastag", label: "Fastag / UPI Express", icon: Smartphone },
              { id: "Card", label: "Credit / Debit Card", icon: CreditCard },
              { id: "NetBanking", label: "Corporate NetBanking", icon: Layers }
            ].map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: "16px",
                    borderRadius: "10px",
                    border: isSelected ? (isCurrentPlanMonthly() ? "2px solid #C99A2E" : "2px solid #0d9488") : "1px solid #cbd5e1",
                    background: isSelected ? (isCurrentPlanMonthly() ? "var(--bg-sub, #FDF0CD)" : "var(--bg-teal-sub, #f0fdfa)") : "var(--bg-card, #ffffff)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Icon size={24} style={{ color: isSelected ? (isCurrentPlanMonthly() ? "#713F12" : "#0d9488") : "#64748b" }} />
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isSelected ? (isCurrentPlanMonthly() ? "#713F12" : "#0f766e") : "#334155" }}>
                    {method.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pw-reserve-cost-summary-box" style={{ background: isCurrentPlanMonthly() ? "linear-gradient(135deg, #1c1809 0%, #2a200a 100%)" : "var(--bg-sub, #f8fafc)", border: isCurrentPlanMonthly() ? "1.5px solid #EAB308" : "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
            <div>
              <div style={{ fontSize: "0.82rem", color: isCurrentPlanMonthly() ? "#713F12" : "#64748b", fontWeight: 600 }}>Amount Due</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: isCurrentPlanMonthly() ? "#713F12" : "#0f766e" }}>
                ₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            {isCurrentPlanMonthly() && (
              <span style={{ background: "#713F12", color: "#FEF08A", fontSize: "0.74rem", fontWeight: 800, padding: "4px 12px", borderRadius: "999px" }}>
                👑 UNLOCKS GOLD VIP THEME
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              className="pw-calc-btn-reset"
              onClick={() => setCurrentStep(3)}
            >
              <ArrowLeft size={15} />
              <span>Back to Summary</span>
            </button>

            <button
              type="button"
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              onClick={handleCompletePayment}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 34px", fontSize: "0.95rem", fontWeight: 800, cursor: "pointer" }}
            >
              <Sparkles size={16} />
              <span>Pay ₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })} & Complete</span>
            </button>
          </div>
        </div>
      )}

      {isSuccessModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "16px", padding: "32px", maxWidth: "440px", width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.25)", border: isCurrentPlanMonthly() ? "2px solid #C99A2E" : "1px solid #e2e8f0" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: isCurrentPlanMonthly() ? "linear-gradient(135deg, #F5E7C3 0%, #FBF7EE 100%)" : "#ccfbf1", border: isCurrentPlanMonthly() ? "2px solid #C99A2E" : "none", color: isCurrentPlanMonthly() ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
              {isCurrentPlanMonthly() ? <Crown size={36} /> : <CheckCircle2 size={36} />}
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary, #0f172a)", margin: "0 0 6px 0" }}>
              {isCurrentPlanMonthly() ? "👑 VIP Membership Activated!" : "Reservation Confirmed!"}
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary, #94a3b8)", margin: "0 0 20px 0" }}>
              {isCurrentPlanMonthly()
                ? "Congratulations! You have unlocked the Gold VIP Experience with guaranteed bay parking, Fastag RFID entry, and full premium privileges."
                : `Your parking reservation at Bay ${selectedSlot} (${selectedZone}) has been successfully confirmed.`}
            </p>

            <div style={{ background: isCurrentPlanMonthly() ? "var(--bg-sub, #FDF0CD)" : "var(--bg-sub, #f8fafc)", border: isCurrentPlanMonthly() ? "1px solid #EAB308" : "1px solid #e2e8f0", borderRadius: "10px", padding: "14px", marginBottom: "24px", textAlign: "left", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Pass / Plan:</span>
                <span style={{ fontWeight: 800, color: isCurrentPlanMonthly() ? "#facc15" : "var(--text-primary, #12233F)" }}>{selectedPlanObject?.plan_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Assigned Slot:</span>
                <span style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>Bay {selectedSlot} ({selectedZone})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Amount Paid:</span>
                <span style={{ fontWeight: 800, color: isCurrentPlanMonthly() ? "#713F12" : "#0d9488" }}>₹ {getPlanCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <button
              type="button"
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              style={{ width: "100%", padding: "12px", fontSize: "0.92rem", fontWeight: 800, justifyContent: "center", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
              onClick={handleFinish}
            >
              <span>{isCurrentPlanMonthly() ? "Enter Gold VIP Dashboard" : "View Booking History"}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

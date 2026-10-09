import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import { Car, Bike, Zap, Calendar, Check, ChevronDown, Crown, Sparkles, CreditCard, Smartphone, Layers, ArrowRight, ArrowLeft, CheckCircle2, RefreshCw, Ticket, Tag } from "lucide-react";

export default function ReserveParking({ loggedInUser, onNavigate, isPremiumActive, onActivatePremium, preselectedPlan }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [vehicleFilter, setVehicleFilter] = useState("All Vehicle Types");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const formatDateTime = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    let hours = date.getHours();
    const mins = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${d}-${m}-${y} ${String(hours).padStart(2, "0")}:${mins} ${ampm}`;
  };

  const isSlotAvailable = (s) => {
    if (!s) return false;
    const st = (s.status || "").toLowerCase().trim();
    if (st !== "available") return false;
    if (s.is_available === false || s.is_available === "false" || s.is_available === 0) return false;
    return true;
  };

  const parseDateString = (str) => {
    if (!str) return null;
    const s = String(str).trim();
    const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
    if (dmyMatch) {
      const [, d, m, y, h, min, ampm] = dmyMatch;
      let hour = h ? parseInt(h, 10) : 0;
      const minute = min ? parseInt(min, 10) : 0;
      if (ampm) {
        if (ampm.toUpperCase() === "PM" && hour < 12) hour += 12;
        if (ampm.toUpperCase() === "AM" && hour === 12) hour = 0;
      }
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), hour, minute);
    }
    const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/);
    if (isoMatch) {
      const [, y, m, d, h, min] = isoMatch;
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10), h ? parseInt(h, 10) : 0, min ? parseInt(min, 10) : 0);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const calculateBookedDuration = (entryStr, exitStr) => {
    const start = parseDateString(entryStr);
    const end = parseDateString(exitStr);
    if (!start || !end) return { hours: 0, minutes: 0, totalHours: 0, text: "Invalid date", isValid: false, diffMs: 0 };
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return { hours: 0, minutes: 0, totalHours: 0, text: "Exit must be after entry", isValid: false, diffMs };
    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.round((diffMs / 3600000) * 100) / 100;
    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
    if (parts.length === 0) parts.push("0 mins");
    return {
      days,
      hours,
      minutes,
      totalHours,
      text: parts.join(" "),
      isValid: true,
      diffMs
    };
  };

  const [entryDateTime, setEntryDateTime] = useState(() => formatDateTime(new Date()));
  const [exitDateTime, setExitDateTime] = useState(() => formatDateTime(new Date(Date.now() + 2 * 3600000)));

  const durationInfo = calculateBookedDuration(entryDateTime, exitDateTime);

  const applyQuickDuration = (hoursToAdd) => {
    const start = parseDateString(entryDateTime) || new Date();
    const newEnd = new Date(start.getTime() + hoursToAdd * 3600000);
    setExitDateTime(formatDateTime(newEnd));
  };
  const [selectedZone, setSelectedZone] = useState("Zone A (Ground - VIP)");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI / Fastag");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [slotsList, setSlotsList] = useState([]);
  const [plansList, setPlansList] = useState([]);
  const [selectedPlanObject, setSelectedPlanObject] = useState(preselectedPlan || null);
  const [bookingError, setBookingError] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCouponsList, setAvailableCouponsList] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const fetchCouponsList = useCallback(async () => {
    setIsLoadingCoupons(true);
    try {
      let res = await fetch(`${API_BASE_URL}/api/coupons`);
      let data = null;
      if (res.ok) {
        data = await res.json();
      } else {
        const fbRes = await fetch(`${API_BASE_URL}/api/admin/coupons?limit=100`);
        if (fbRes.ok) data = await fbRes.json();
      }
      setIsLoadingCoupons(false);
      if (data && data.success && Array.isArray(data.coupons)) {
        setAvailableCouponsList(data.coupons);
      }
    } catch (err) {
      console.warn("Retrying coupon list with fallback...", err);
      try {
        const fbRes = await fetch(`${API_BASE_URL}/api/admin/coupons?limit=100`);
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          if (fbData && fbData.success && Array.isArray(fbData.coupons)) {
            setAvailableCouponsList(fbData.coupons);
          }
        }
      } catch (fbErr) {
        console.error("Fallback coupon fetch failed:", fbErr);
      }
      setIsLoadingCoupons(false);
    }
  }, []);

  useEffect(() => {
    fetchCouponsList();
  }, [fetchCouponsList]);

  useEffect(() => {
    if (currentStep === 4) {
      fetchCouponsList();
    }
  }, [currentStep, fetchCouponsList]);

  const fetchActivePlans = async () => {
    setIsLoadingPlans(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing-plans?active=true`);
      const data = await res.json();
      setIsLoadingPlans(false);
      if (data.success && Array.isArray(data.plans) && data.plans.length > 0) {
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
    const custEmail = loggedInUser?.email;
    if (custEmail) {
      fetch(`${API_BASE_URL}/api/customer/vehicles?email=${encodeURIComponent(custEmail)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.vehicles) && d.vehicles.length > 0) {
            const defVeh = d.vehicles.find((v) => v.isDefault) || d.vehicles[0];
            setVehiclePlate(defVeh.plate || "");
            setVehicleModel(defVeh.model || "");
          }
        })
        .catch(() => {});
    }
  }, [loggedInUser]);

  const fetchSlotsList = useCallback(async () => {
    try {
      const [d, evD] = await Promise.all([
        fetch(`${API_BASE_URL}/api/parking-slots`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/ev-charging-slots?all=true`).then((r) => r.json()).catch(() => ({}))
      ]);
      let combined = [];
      if (d && d.success && Array.isArray(d.slots)) {
        combined = [...d.slots];
      }
      if (evD && evD.success && Array.isArray(evD.slots)) {
        const evMapped = evD.slots.map((s) => ({
          id: `ev-${s.id}`,
          slot_number: s.slot_number,
          zone: "Zone C (EV Fast)",
          status: s.status,
          is_available: (s.status || "").toLowerCase().trim() === "available",
          isEv: true
        }));
        combined = [...combined, ...evMapped];
      }
      if (combined.length > 0) {
        setSlotsList(combined);
        const firstInZone = combined.find((s) => s.zone && s.zone.includes("Zone A") && isSlotAvailable(s));
        if (firstInZone) {
          setSelectedSlot(firstInZone.slot_number);
        } else {
          const anyAvail = combined.find(isSlotAvailable);
          if (anyAvail) {
            setSelectedSlot(anyAvail.slot_number);
            const matchingZoneBtn = ["Zone A (Ground - VIP)", "Zone B (Basement)", "Zone C (EV Fast)", "Zone D (Bikes)"].find(
              (z) => anyAvail.zone && anyAvail.zone.includes(z.slice(0, 6))
            );
            if (matchingZoneBtn) setSelectedZone(matchingZoneBtn);
          } else {
            setSelectedSlot("");
          }
        }
      }
    } catch {
    }
  }, []);

  useEffect(() => {
    fetchSlotsList();
  }, [fetchSlotsList]);

  const updateTimesForPlan = (plan) => {
    const now = new Date();
    const durHours = (plan?.billing_type || "").toLowerCase() === "monthly"
      ? 30 * 24
      : (plan?.billing_type || "").toLowerCase() === "daily"
      ? 24
      : (parseFloat(plan?.duration_hours) || 1);
    setEntryDateTime(formatDateTime(now));
    setExitDateTime(formatDateTime(new Date(now.getTime() + durHours * 3600000)));
  };

  useEffect(() => {
    if (preselectedPlan) {
      setSelectedPlanObject(preselectedPlan);
      updateTimesForPlan(preselectedPlan);
    }
  }, [preselectedPlan]);

  const isCurrentPlanMonthly = () => {
    if (!selectedPlanObject) return false;
    const bType = (selectedPlanObject.billing_type || "").toLowerCase();
    const pName = (selectedPlanObject.plan_name || "").toLowerCase();
    const pCode = (selectedPlanObject.plan_code || "").toLowerCase();
    return bType === "monthly" || pName.includes("monthly") || pName.includes("vip") || pCode === "plan-monthly";
  };

  const getOriginalCost = () => {
    if (!selectedPlanObject) return 50;
    const rate = parseFloat(selectedPlanObject.rate) || 50;
    const bType = (selectedPlanObject.billing_type || "").toLowerCase();
    if (bType === "monthly") return rate;
    if (bType === "flat") return rate;
    if (bType === "daily") {
      const days = Math.max(1, Math.ceil(durationInfo.totalHours / 24));
      return days * rate;
    }
    const billedHours = Math.max(1, Math.ceil(durationInfo.totalHours || 1));
    return billedHours * rate;
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const discAmt = parseFloat(appliedCoupon.discount_amount);
    if (!isNaN(discAmt) && discAmt > 0) return discAmt;

    const orig = getOriginalCost();
    const val = parseFloat(appliedCoupon.discount_value) || 0;
    if (appliedCoupon.discount_type === "percentage") {
      let calc = (orig * val) / 100;
      if (appliedCoupon.maximum_discount) {
        calc = Math.min(calc, parseFloat(appliedCoupon.maximum_discount));
      }
      return Math.max(0, calc);
    }
    return Math.max(0, Math.min(orig, val));
  };

  const getFinalPayableCost = () => {
    const orig = getOriginalCost();
    const disc = getDiscountAmount();
    return Math.max(0, orig - disc);
  };

  const getPlanCost = () => {
    return getFinalPayableCost();
  };

  const handleApplyCoupon = async (e, codeOverride) => {
    if (e && e.preventDefault) e.preventDefault();
    const targetCode = (codeOverride !== undefined ? codeOverride : couponCodeInput) || "";
    const trimmed = targetCode.trim().toUpperCase();
    if (!trimmed) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    setIsApplyingCoupon(true);
    setCouponError("");

    try {
      const orderAmt = getOriginalCost();
      const res = await fetch(`${API_BASE_URL}/api/coupons/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: trimmed,
          customer_email: loggedInUser?.email || "",
          order_amount: orderAmt,
          service_type: "Normal Parking"
        })
      });
      const data = await res.json();
      setIsApplyingCoupon(false);

      if (!res.ok || !data.success) {
        setCouponError(data.error || "Invalid or ineligible coupon code.");
        setAppliedCoupon(null);
      } else {
        const couponPayload = data.coupon || (data.valid ? data : null);
        setAppliedCoupon(couponPayload);
        setCouponCodeInput(trimmed);
        setCouponError("");
      }
    } catch {
      setIsApplyingCoupon(false);
      setCouponError("Network error while validating coupon.");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError("");
  };

  const handleSelectCouponFromDropdown = (couponCode) => {
    setCouponCodeInput(couponCode);
    setCouponError("");
    if (!couponCode) {
      if (appliedCoupon) setAppliedCoupon(null);
      return;
    }
    const found = availableCouponsList.find((c) => c.code.toUpperCase() === couponCode.toUpperCase());
    if (found) {
      const st = (found.computed_status || found.status || "").toLowerCase();
      if (st !== "active") {
        setCouponError(`Notice: Coupon "${found.code}" is disabled and cannot be selected.`);
        return;
      }
      handleApplyCoupon(null, found.code);
    }
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
    updateTimesForPlan(plan);
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponError("");
    }
  };

  const handleProceedToSlot = () => {
    const dur = calculateBookedDuration(entryDateTime, exitDateTime);
    if (!dur.isValid || dur.diffMs <= 0) {
      setBookingError("Exit date and time must be later than entry date and time.");
      return;
    }
    setBookingError("");
    setCurrentStep(2);
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

  const currentZoneCode = selectedZone.slice(0, 6);
  const zoneSlots = slotsList.filter((s) => s.zone && s.zone.includes(currentZoneCode));
  const displayedSlots = zoneSlots.length > 0 ? zoneSlots : [
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-01`, status: "Available" },
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-02`, status: "Available" },
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-03`, status: "Available" },
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-04`, status: "Available" },
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-05`, status: "Available" },
    { slot_number: `${currentZoneCode.replace("Zone ", "").trim()}-06`, status: "Available" }
  ];

  const hasAnyAvailableInZone = displayedSlots.some(isSlotAvailable);
  const isCurrentSlotValidAndAvailable = Boolean(
    selectedSlot && displayedSlots.some((s) => s.slot_number === selectedSlot && isSlotAvailable(s))
  );

  const handleZoneSelect = (z) => {
    setSelectedZone(z);
    const zCode = z.slice(0, 6);
    const firstInNewZone = slotsList.find((s) => s.zone && s.zone.includes(zCode) && isSlotAvailable(s));
    if (firstInNewZone) {
      setSelectedSlot(firstInNewZone.slot_number);
    } else {
      setSelectedSlot("");
    }
  };

  const handleProceedToConfirm = () => {
    if (!isCurrentSlotValidAndAvailable) {
      return;
    }
    setCurrentStep(3);
  };

  const handleProceedToPayment = () => {
    if (!isCurrentSlotValidAndAvailable) {
      setCurrentStep(2);
      return;
    }
    setCurrentStep(4);
  };

  const handleCompletePayment = async () => {
    if (!selectedSlot || !isCurrentSlotValidAndAvailable) {
      setBookingError("Please select an available parking bay first.");
      return;
    }
    const isMonthly = isCurrentPlanMonthly();
    const custEmail = loggedInUser?.email || "";
    const custName = loggedInUser?.name || "Customer";

    const origAmt = getOriginalCost();
    const discAmt = getDiscountAmount();
    const finalAmt = getFinalPayableCost();

    setIsSubmittingBooking(true);
    setBookingError("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/reserve-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: custName,
          customer_email: custEmail,
          customer_phone: loggedInUser?.phone || "",
          vehicle_number: vehiclePlate || "DL01 AB 1234",
          vehicle_type: selectedPlanObject?.vehicle_type || "Car",
          model: vehicleModel || "Standard",
          slot_number: selectedSlot,
          zone: selectedZone,
          start_time: entryDateTime,
          end_time: exitDateTime,
          duration_hours: (selectedPlanObject?.billing_type || "").toLowerCase() === "monthly"
            ? 720
            : (selectedPlanObject?.billing_type || "").toLowerCase() === "daily"
            ? (durationInfo.totalHours || 24)
            : (durationInfo.totalHours || 1),
          original_amount: origAmt,
          discount_amount: discAmt,
          total_amount: finalAmt,
          coupon_code: appliedCoupon ? appliedCoupon.code : null,
          plan_code: selectedPlanObject?.plan_code || "PLAN-STD",
          plan_name: selectedPlanObject?.plan_name || "Standard Parking",
          payment_method: paymentMethod || "UPI"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setBookingError(data.error || "Failed to book slot. This bay is currently reserved or unavailable.");
        setIsSubmittingBooking(false);
        fetchSlotsList();
        return;
      }
    } catch {
      setBookingError("Network error while connecting to server. Please try again.");
      setIsSubmittingBooking(false);
      return;
    }

    if (isMonthly) {
      const validFromStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const validUntilStr = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      if (onActivatePremium) {
        onActivatePremium({
          active: true,
          plan: selectedPlanObject?.plan_name || "Monthly VIP Plan",
          planName: selectedPlanObject?.plan_name || "Monthly VIP Plan",
          amount: getPlanCost(),
          validFrom: validFromStr,
          validUntil: validUntilStr,
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
    setIsSubmittingBooking(false);
    setIsSuccessModalOpen(true);
  };

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
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Available Plans</h2>
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

          <div className="pw-plans-cards-trio-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "18px", alignItems: "start", width: "100%", minWidth: 0, boxSizing: "border-box" }}>
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
                      ? `${Math.max(1, Math.ceil(durationInfo.totalHours / 24))} Day(s) (${durationInfo.text})`
                      : durationInfo.text
                  }
                  readOnly
                />
              </div>
            </div>

            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Quick Duration:</span>
              {[
                { label: "1 Hour", hours: 1 },
                { label: "2 Hours", hours: 2 },
                { label: "4 Hours", hours: 4 },
                { label: "8 Hours", hours: 8 },
                { label: "24 Hours (1 Day)", hours: 24 }
              ].map((btn) => (
                <button
                  key={btn.hours}
                  type="button"
                  onClick={() => applyQuickDuration(btn.hours)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    border: "1px solid var(--border-color, #cbd5e1)",
                    background: Math.round(durationInfo.totalHours) === btn.hours ? "var(--accent-teal, #0d9488)" : "var(--bg-card, #ffffff)",
                    color: Math.round(durationInfo.totalHours) === btn.hours ? "#ffffff" : "var(--text-primary, #0f172a)",
                    cursor: "pointer"
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
            {!durationInfo.isValid && (
              <div style={{ marginTop: "8px", color: "#ef4444", fontSize: "0.78rem", fontWeight: 700 }}>
                {durationInfo.text}
              </div>
            )}

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
                  onClick={() => handleZoneSelect(z)}
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

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", marginTop: "16px", flexWrap: "wrap", gap: "8px" }}>
            <label className="pw-calc-label" style={{ margin: 0, display: "block" }}>
              Bays in {selectedZone}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.74rem", fontWeight: 700 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#0d9488" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#0d9488" }}></span>
                Available
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#dc2626" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#dc2626" }}></span>
                Reserved (Cannot Book)
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#64748b" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#64748b" }}></span>
                Occupied
              </span>
            </div>
          </div>

          <div className="pw-bay-selection-grid">
            {displayedSlots.map((slotObj) => {
              const slot = slotObj.slot_number;
              const isAvail = isSlotAvailable(slotObj);
              const rawStatus = (slotObj.status || "").toLowerCase().trim();
              const isReserved = rawStatus === "reserved";
              const isOccupied = rawStatus === "occupied";
              const isMaintenance = rawStatus === "maintenance";
              const isSel = selectedSlot === slot && isAvail;

              return (
                <button
                  key={slot}
                  type="button"
                  disabled={!isAvail}
                  onClick={() => {
                    if (!isAvail) return;
                    setSelectedSlot(slot);
                  }}
                  title={
                    !isAvail
                      ? `Bay ${slot} is currently ${rawStatus.toUpperCase()} and cannot be booked.`
                      : `Click to select Bay ${slot}`
                  }
                  style={{
                    padding: "14px 8px",
                    borderRadius: "8px",
                    border: isSel
                      ? (isCurrentPlanMonthly() ? "2px solid #C99A2E" : "2px solid #0d9488")
                      : isReserved
                      ? "1.5px dashed #f87171"
                      : isOccupied
                      ? "1px solid #cbd5e1"
                      : isMaintenance
                      ? "1px solid #fcd34d"
                      : "1px solid #e2e8f0",
                    background: isSel
                      ? (isCurrentPlanMonthly() ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488")
                      : isReserved
                      ? "var(--bg-sub, #fff1f2)"
                      : isOccupied
                      ? "var(--bg-sub, #f1f5f9)"
                      : isMaintenance
                      ? "var(--bg-sub, #fffbeb)"
                      : "#ffffff",
                    color: isSel
                      ? "#ffffff"
                      : isReserved
                      ? "#b91c1c"
                      : isOccupied
                      ? "#64748b"
                      : isMaintenance
                      ? "#b45309"
                      : "#0f172a",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    cursor: isAvail ? "pointer" : "not-allowed",
                    pointerEvents: isAvail ? "auto" : "none",
                    opacity: isAvail ? 1 : 0.65,
                    textAlign: "center",
                    position: "relative",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                    <span>Bay {slot}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      marginTop: "3px",
                      fontWeight: 700,
                      color: isSel
                        ? "#ffffff"
                        : isReserved
                        ? "#dc2626"
                        : isOccupied
                        ? "#64748b"
                        : isMaintenance
                        ? "#b45309"
                        : "#0d9488"
                    }}
                  >
                    {isSel
                      ? "✓ Selected"
                      : isReserved
                      ? "🚫 Reserved"
                      : isOccupied
                      ? "⛔ Occupied"
                      : isMaintenance
                      ? "⚠️ Maintenance"
                      : "🟢 Available"}
                  </div>
                </button>
              );
            })}
          </div>

          {!hasAnyAvailableInZone && (
            <div style={{ background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", marginTop: "14px", color: "#b91c1c", fontSize: "0.82rem", fontWeight: 600 }}>
              ⚠️ All bays in {selectedZone} are currently reserved or occupied. Please select another parking zone above.
            </div>
          )}

          {hasAnyAvailableInZone && !isCurrentSlotValidAndAvailable && (
            <div style={{ background: "var(--bg-sub, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", padding: "8px 12px", marginTop: "14px", color: "var(--text-secondary, #64748b)", fontSize: "0.78rem" }}>
              💡 Please click on an available bay (green) to select your parking spot before continuing.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
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
              disabled={!isCurrentSlotValidAndAvailable}
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              onClick={handleProceedToConfirm}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                cursor: isCurrentSlotValidAndAvailable ? "pointer" : "not-allowed",
                opacity: isCurrentSlotValidAndAvailable ? 1 : 0.5
              }}
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

          {bookingError && (
            <div style={{ background: "#fff1f2", border: "1.5px solid #fca5a5", color: "#b91c1c", padding: "12px 16px", borderRadius: "10px", marginBottom: "18px", fontWeight: 700, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>⚠️ {bookingError}</span>
            </div>
          )}

          <div style={{
            background: "var(--bg-sub, #f8fafc)",
            border: "1px dashed var(--border-color, #cbd5e1)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "18px"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                <Ticket size={16} style={{ color: "#0d9488" }} />
                <span>Have a Promo or Discount Coupon?</span>
              </div>
              {appliedCoupon && (
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: "6px" }}>
                  ✓ {appliedCoupon.code} Applied
                </span>
              )}
            </div>

            {!appliedCoupon ? (
              <div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary, #64748b)", marginBottom: "5px" }}>
                    <span>Browse Coupons (Select from List):</span>
                    {isLoadingCoupons && (
                      <span style={{ fontSize: "0.72rem", color: "#0d9488", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <RefreshCw size={11} className="pw-spin" /> Loading...
                      </span>
                    )}
                  </label>
                  <select
                    value={couponCodeInput}
                    onChange={(e) => handleSelectCouponFromDropdown(e.target.value)}
                    onFocus={() => { if (availableCouponsList.length === 0) fetchCouponsList(); }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1.5px solid var(--border-color, #cbd5e1)",
                      fontSize: "0.86rem",
                      fontWeight: 600,
                      background: "var(--bg-card, #ffffff)",
                      color: "var(--text-primary, #0f172a)",
                      outline: "none",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">-- Select a Coupon --</option>
                    {availableCouponsList.map((c) => {
                      const st = (c.computed_status || c.status || "Active").toLowerCase();
                      const isAct = st === "active";
                      const discLabel = c.discount_type === "percentage" ? `${parseFloat(c.discount_value)}% OFF` : `₹${parseFloat(c.discount_value)} OFF`;
                      const desc = c.description || (c.applicable_to && c.applicable_to !== "All" ? c.applicable_to : "All Services");
                      return (
                        <option
                          key={c.id}
                          value={c.code}
                          disabled={!isAct}
                          style={{ color: isAct ? "#0f172a" : "#94a3b8" }}
                        >
                          {isAct ? `${c.code} — ${discLabel} (${desc})` : `${c.code} — ${discLabel} (Disabled)`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {couponCodeInput && availableCouponsList.find((c) => c.code.toUpperCase() === couponCodeInput.toUpperCase()) && (
                  (() => {
                    const selC = availableCouponsList.find((c) => c.code.toUpperCase() === couponCodeInput.toUpperCase());
                    const discLabel = selC.discount_type === "percentage" ? `${parseFloat(selC.discount_value)}% OFF` : `₹${parseFloat(selC.discount_value)} OFF`;
                    return (
                      <div style={{
                        marginBottom: "12px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "var(--bg-card, #ffffff)",
                        border: "1px solid var(--border-color, #cbd5e1)",
                        fontSize: "0.78rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "6px"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: 800, color: "#0d9488" }}>{selC.code}</span>
                          <span style={{ fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                            • {selC.description || `${discLabel} discount`}
                          </span>
                        </div>
                        <span style={{ color: "var(--text-secondary, #64748b)", fontWeight: 600 }}>
                          Min order: ₹{parseFloat(selC.minimum_amount || 0).toFixed(0)} • {selC.usage_type}
                        </span>
                      </div>
                    );
                  })()
                )}

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Or type promo code manually..."
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1.5px solid var(--border-color, #cbd5e1)",
                      fontSize: "0.88rem",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      outline: "none",
                      background: "var(--bg-card, #ffffff)",
                      color: "var(--text-primary, #0f172a)"
                    }}
                  />
                  <button
                    type="button"
                    disabled={isApplyingCoupon || !couponCodeInput.trim()}
                    onClick={handleApplyCoupon}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      background: isApplyingCoupon || !couponCodeInput.trim() ? "#94a3b8" : "#0d9488",
                      color: "#ffffff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      cursor: isApplyingCoupon || !couponCodeInput.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {isApplyingCoupon ? (
                      <>
                        <RefreshCw size={14} className="pw-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <Tag size={14} />
                        <span>Apply</span>
                      </>
                    )}
                  </button>
                </div>
                {couponError && (
                  <div style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 700, marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>⚠️ {couponError}</span>
                  </div>
                )}
                <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #64748b)", marginTop: "6px" }}>
                  💡 Select a coupon from the dropdown above or type any promo code to apply instant discounts.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "8px", padding: "10px 14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 800, color: "#15803d", fontSize: "0.88rem" }}>{appliedCoupon.code}</span>
                    <span style={{ fontSize: "0.75rem", color: "#166534" }}>({appliedCoupon.description || (appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`)})</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 700, marginTop: "2px" }}>
                    🎉 You saved ₹{getDiscountAmount().toLocaleString("en-IN", { minimumFractionDigits: 2 })}!
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline"
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="pw-reserve-cost-summary-box" style={{ background: isCurrentPlanMonthly() ? "linear-gradient(135deg, #1c1809 0%, #2a200a 100%)" : "var(--bg-sub, #f8fafc)", border: isCurrentPlanMonthly() ? "1.5px solid #EAB308" : "1px solid #e2e8f0", borderRadius: "10px", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: isCurrentPlanMonthly() ? "#d4d4d8" : "var(--text-secondary, #64748b)" }}>
              <span>Original Amount</span>
              <span style={{ fontWeight: 700, textDecoration: appliedCoupon ? "line-through" : "none" }}>₹ {getOriginalCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>

            {appliedCoupon && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "#16a34a", fontWeight: 700 }}>
                <span>Coupon Discount ({appliedCoupon.code})</span>
                <span>- ₹ {getDiscountAmount().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div style={{ height: "1px", background: "var(--border-color, #e2e8f0)", margin: "4px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.82rem", color: isCurrentPlanMonthly() ? "#713F12" : "#64748b", fontWeight: 600 }}>Final Amount Due</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 900, color: isCurrentPlanMonthly() ? "#713F12" : "#0f766e" }}>
                  ₹ {getFinalPayableCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
              {isCurrentPlanMonthly() && (
                <span style={{ background: "#713F12", color: "#FEF08A", fontSize: "0.74rem", fontWeight: 800, padding: "4px 12px", borderRadius: "999px" }}>
                  👑 UNLOCKS GOLD VIP THEME
                </span>
              )}
            </div>
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
              disabled={isSubmittingBooking}
              className={`pw-calc-btn-submit ${isCurrentPlanMonthly() ? "pw-btn-gold" : ""}`}
              onClick={handleCompletePayment}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 34px", fontSize: "0.95rem", fontWeight: 800, cursor: isSubmittingBooking ? "not-allowed" : "pointer", opacity: isSubmittingBooking ? 0.7 : 1 }}
            >
              {isSubmittingBooking ? (
                <>
                  <RefreshCw size={16} className="pw-spin" />
                  <span>Processing Reservation...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Pay ₹ {getFinalPayableCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })} & Complete</span>
                </>
              )}
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
              {appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", color: "#16a34a" }}>
                  <span>Coupon Applied:</span>
                  <span style={{ fontWeight: 700 }}>{appliedCoupon.code} (-₹{getDiscountAmount().toLocaleString("en-IN", { minimumFractionDigits: 2 })})</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary, #94a3b8)" }}>Net Amount Paid:</span>
                <span style={{ fontWeight: 800, color: isCurrentPlanMonthly() ? "#713F12" : "#0d9488" }}>₹ {getFinalPayableCost().toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
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

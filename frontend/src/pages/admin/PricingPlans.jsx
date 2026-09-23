import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Edit3,
  Trash2,
  Car,
  Bike,
  Zap,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Tag
} from "lucide-react";

export default function PricingPlans({ setStatusActionMessage }) {
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("All");
  const [billingFilter, setBillingFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const [planCode, setPlanCode] = useState("");
  const [planName, setPlanName] = useState("");
  const [vehicleType, setVehicleType] = useState("Car");
  const [billingType, setBillingType] = useState("Hourly");
  const [rate, setRate] = useState("50.00");
  const [durationHours, setDurationHours] = useState("1.00");
  const [description, setDescription] = useState("");
  const [featuresList, setFeaturesList] = useState(["Covered Parking", "CCTV Surveillance", "Automated Gate Access"]);
  const [featureInput, setFeatureInput] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing-plans`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.plans) {
        setPlans(data.plans);
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    if (setStatusActionMessage) setStatusActionMessage(msg);
    setTimeout(() => {
      setActionSuccess("");
      if (setStatusActionMessage) setStatusActionMessage("");
    }, 4000);
  };

  const resetForm = () => {
    setPlanCode("");
    setPlanName("");
    setVehicleType("Car");
    setBillingType("Hourly");
    setRate("50.00");
    setDurationHours("1.00");
    setDescription("");
    setFeaturesList(["Covered Parking", "CCTV Surveillance", "Automated Gate Access"]);
    setFeatureInput("");
    setIsActive(true);
    setIsEditing(false);
    setCurrentPlanId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormError("");
    const randomCode = `PLAN-${vehicleType.toUpperCase()}-${Date.now().toString().slice(-4)}`;
    setPlanCode(randomCode);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setCurrentPlanId(Number(p.id));
    setPlanCode(p.plan_code || "");
    setPlanName(p.plan_name || "");
    setVehicleType(p.vehicle_type || "Car");
    setBillingType(p.billing_type || "Hourly");
    setRate(String(p.rate || "50.00"));
    setDurationHours(String(p.duration_hours || "1.00"));
    setDescription(p.description || "");
    setFeaturesList(Array.isArray(p.features) ? p.features : ["Covered Bay", "CCTV Surveillance"]);
    setFeatureInput("");
    setIsActive(p.is_active !== false);
    setIsEditing(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !featuresList.includes(featureInput.trim())) {
      setFeaturesList([...featuresList, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (idx) => {
    setFeaturesList(featuresList.filter((_, i) => i !== idx));
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planName.trim() || !rate) return;
    setFormError("");
    setIsSaving(true);

    const payload = {
      plan_code: planCode.trim() || `PLAN-${Math.floor(1000 + Math.random() * 9000)}`,
      plan_name: planName.trim(),
      vehicle_type: vehicleType,
      billing_type: billingType,
      rate: parseFloat(rate) || 50.00,
      duration_hours: parseFloat(durationHours) || (billingType === "Daily" ? 24.00 : 1.00),
      description: description.trim(),
      features: featuresList,
      is_active: isActive
    };

    try {
      if (isEditing && currentPlanId) {
        const res = await fetch(`${API_BASE_URL}/api/pricing-plans/${currentPlanId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setIsSaving(false);
        if (res.ok && data.success) {
          showNotification(`Pricing plan "${payload.plan_name}" updated successfully.`);
          setIsModalOpen(false);
          window.dispatchEvent(new Event("shnoor_plan_updated"));
          window.dispatchEvent(new Event("shnoor_notification_updated"));
          await fetchPlans();
        } else {
          setFormError(data.error || "Failed to update pricing plan.");
        }
      } else {
        const res = await fetch(`${API_BASE_URL}/api/pricing-plans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        setIsSaving(false);
        if (res.ok && data.success) {
          showNotification(`New pricing plan "${payload.plan_name}" created successfully.`);
          setIsModalOpen(false);
          window.dispatchEvent(new Event("shnoor_plan_updated"));
          window.dispatchEvent(new Event("shnoor_notification_updated"));
          await fetchPlans();
        } else {
          setFormError(data.error || "Failed to create pricing plan.");
        }
      }
    } catch {
      setIsSaving(false);
      setFormError("A network or server error occurred. Please check your connection.");
    }
  };

  const handleToggleStatus = async (plan) => {
    const newStatus = !plan.is_active;
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing-plans/${plan.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`Plan "${plan.plan_name}" is now ${newStatus ? "Active" : "Inactive"}.`);
        window.dispatchEvent(new Event("shnoor_plan_updated"));
        window.dispatchEvent(new Event("shnoor_notification_updated"));
        await fetchPlans();
      }
    } catch (err) { void err; }
  };

  const handleDeletePlan = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pricing-plans/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification("Pricing plan deleted successfully.");
        setDeleteConfirmId(null);
        window.dispatchEvent(new Event("shnoor_plan_updated"));
        window.dispatchEvent(new Event("shnoor_notification_updated"));
        await fetchPlans();
      }
    } catch (err) { void err; }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      (p.plan_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.plan_code || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVehicle =
      vehicleFilter === "All" || (p.vehicle_type || "").toLowerCase() === vehicleFilter.toLowerCase();

    const matchesBilling =
      billingFilter === "All" || (p.billing_type || "").toLowerCase() === billingFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && p.is_active) ||
      (statusFilter === "Inactive" && !p.is_active);

    return matchesSearch && matchesVehicle && matchesBilling && matchesStatus;
  });

  const totalPlans = plans.length;
  const activePlans = plans.filter((p) => p.is_active).length;
  const hourlyPlans = plans.filter((p) => p.billing_type === "Hourly").length;
  const dailyPlans = plans.filter((p) => p.billing_type === "Daily").length;

  const getVehicleIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "bike") return <Bike size={20} style={{ color: "#34d399" }} />;
    if (t === "ev") return <Zap size={20} style={{ color: "#38bdf8" }} />;
    if (t === "suv") return <Car size={20} style={{ color: "#c084fc" }} />;
    return <Car size={20} style={{ color: "#38bdf8" }} />;
  };

  return (
    <div className="pw-pricing-plans-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Pricing Plans</span>
          <span className="pw-metric-value">{totalPlans}</span>
          <span className="pw-metric-trend positive">
            <span>Configured across all vehicle types</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active & Live Plans</span>
          <span className="pw-metric-value">{activePlans}</span>
          <span className="pw-metric-trend positive">
            <span>Ready for booking & fee calculation</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Hourly Tariff Plans</span>
          <span className="pw-metric-value">{hourlyPlans}</span>
          <span className="pw-metric-trend positive">
            <span>Standard duration tiers</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Daily / Flat Passes</span>
          <span className="pw-metric-value">{dailyPlans}</span>
          <span className="pw-metric-trend positive">
            <span>24h passes & bundled packages</span>
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="pw-user-action-alert" style={{ marginTop: "16px" }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="pw-plans-action-bar" style={{ marginTop: "20px" }}>
        <div className="pw-plans-search-group">
          <div className="pw-search-input-wrap">
            <Search size={16} className="pw-search-icon" />
            <input
              type="text"
              className="pw-search-input"
              placeholder="Search plan name, code, vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="pw-filter-pills-row">
            {["All", "Car", "SUV", "EV", "Bike"].map((v) => (
              <button
                key={v}
                type="button"
                className={`pw-filter-pill ${vehicleFilter === v ? "active" : ""}`}
                onClick={() => setVehicleFilter(v)}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="pw-filter-pills-row">
            {["All", "Hourly", "Daily", "Flat"].map((b) => (
              <button
                key={b}
                type="button"
                className={`pw-filter-pill ${billingFilter === b ? "active" : ""}`}
                onClick={() => setBillingFilter(b)}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="pw-filter-pills-row">
            {["All", "Active", "Inactive"].map((s) => (
              <button
                key={s}
                type="button"
                className={`pw-filter-pill ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pw-plans-right-actions">
          <button type="button" className="pw-btn-secondary" onClick={fetchPlans} title="Refresh Plans">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button type="button" className="pw-btn-primary" onClick={handleOpenCreateModal}>
            <Plus size={16} />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="pw-loading-state" style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={24} className="pw-spin-icon" style={{ margin: "0 auto 12px auto" }} />
          <p>Loading pricing plans from database...</p>
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="pw-empty-table-state" style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
          <Tag size={36} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
          <h3>No pricing plans found</h3>
          <p>Try adjusting your search filters or click "Create New Plan" to add one.</p>
        </div>
      ) : (
        <div className="pw-pricing-plans-grid" style={{ marginTop: "20px" }}>
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className={`pw-pricing-card ${plan.is_active ? "active-plan" : "inactive-plan"}`}
            >
              <div className="pw-pricing-card-header">
                <div className="pw-pricing-card-icon-box">
                  {getVehicleIcon(plan.vehicle_type)}
                </div>
                <div className="pw-pricing-card-title-wrap">
                  <div className="pw-pricing-code-badge">{plan.plan_code}</div>
                  <h3 className="pw-pricing-card-name">{plan.plan_name}</h3>
                </div>
                <div className="pw-pricing-status-wrap">
                  <button
                    type="button"
                    className={`pw-status-toggle-pill ${plan.is_active ? "status-active" : "status-inactive"}`}
                    onClick={() => handleToggleStatus(plan)}
                    title="Click to toggle plan status"
                  >
                    {plan.is_active ? (
                      <>
                        <Check size={12} />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <X size={12} />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pw-pricing-card-rate-section">
                <div className="pw-pricing-rate-amount">
                  <span className="pw-currency-symbol">₹</span>
                  <span className="pw-rate-number">{parseFloat(plan.rate).toFixed(2)}</span>
                  <span className="pw-rate-unit">
                    / {plan.billing_type === "Daily" ? "day (24h)" : plan.billing_type === "Flat" ? "flat pass" : "hour"}
                  </span>
                </div>
                <div className="pw-pricing-badges-row">
                  <span className="pw-badge-vehicle">{plan.vehicle_type}</span>
                  <span className="pw-badge-billing">{plan.billing_type}</span>
                </div>
              </div>

              <p className="pw-pricing-card-desc">
                {plan.description || "Comprehensive parking coverage with automated gate clearance and security surveillance."}
              </p>

              <div className="pw-pricing-features-list">
                {(Array.isArray(plan.features) ? plan.features : ["Standard Bay Access", "24/7 Security"]).map((f, i) => (
                  <div key={i} className="pw-pricing-feature-item">
                    <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className="pw-pricing-card-footer">
                <button
                  type="button"
                  className="pw-plan-card-btn edit-btn"
                  onClick={() => handleOpenEditModal(plan)}
                >
                  <Edit3 size={14} />
                  <span>Edit Plan</span>
                </button>
                <button
                  type="button"
                  className="pw-plan-card-btn delete-btn"
                  onClick={() => setDeleteConfirmId(Number(plan.id))}
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="pw-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="pw-modal-card" style={{ maxWidth: "580px" }} onClick={(e) => e.stopPropagation()}>
            <div className="pw-modal-header-clean">
              <div className="pw-modal-title-wrap">
                <CreditCard size={20} className="text-cyan-400" />
                <h3 style={{ color: "#ffffff", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
                  {isEditing ? "Edit Pricing Plan" : "Create New Pricing Plan"}
                </h3>
              </div>
              <button
                type="button"
                className="pw-modal-close-btn-clean"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="pw-modal-form" style={{ marginTop: "16px" }}>
              {formError && (
                <div
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    color: "#fca5a5",
                    fontSize: "0.85rem",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{formError}</span>
                </div>
              )}
              <div className="pw-form-two-col-grid">
                <div>
                  <label className="pw-clean-label">Plan Code *</label>
                  <input
                    type="text"
                    className="pw-dark-form-input"
                    value={planCode}
                    onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PLAN-CAR-01"
                    required
                  />
                </div>

                <div>
                  <label className="pw-clean-label">Vehicle Type *</label>
                  <select
                    className="pw-dark-form-input"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    <option value="Car">Car (Standard)</option>
                    <option value="SUV">SUV (Large)</option>
                    <option value="EV">EV (Electric Charging)</option>
                    <option value="Bike">Bike (Two-Wheeler)</option>
                    <option value="All">All Vehicle Types</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label className="pw-clean-label">Plan Name *</label>
                <input
                  type="text"
                  className="pw-dark-form-input"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Executive Car Pass"
                  required
                />
              </div>

              <div className="pw-form-two-col-grid" style={{ marginTop: "12px" }}>
                <div>
                  <label className="pw-clean-label">Billing Type *</label>
                  <select
                    className="pw-dark-form-input"
                    value={billingType}
                    onChange={(e) => {
                      setBillingType(e.target.value);
                      if (e.target.value === "Daily") setDurationHours("24.00");
                      else if (e.target.value === "Hourly") setDurationHours("1.00");
                    }}
                  >
                    <option value="Hourly">Hourly Rate</option>
                    <option value="Daily">Daily Pass (24 Hours)</option>
                    <option value="Flat">Flat / Event Rate</option>
                  </select>
                </div>

                <div>
                  <label className="pw-clean-label">Rate (₹) *</label>
                  <input
                    type="number"
                    step="0.50"
                    min="1"
                    className="pw-dark-form-input"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="50.00"
                    required
                  />
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label className="pw-clean-label">Plan Description</label>
                <textarea
                  className="pw-dark-form-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the parking perks, zone clearance, and privileges..."
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <label className="pw-clean-label">Key Features & Inclusions</label>
                <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    className="pw-dark-form-input"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="e.g. 60kW DC Fast Charger"
                  />
                  <button
                    type="button"
                    className="pw-btn-secondary"
                    onClick={handleAddFeature}
                  >
                    Add
                  </button>
                </div>
                <div className="pw-features-tags-wrap">
                  {featuresList.map((f, i) => (
                    <span key={i} className="pw-feature-tag-chip">
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(i)}
                        className="pw-tag-remove-btn"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#e2e8f0", fontSize: "0.88rem" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ accentColor: "#0284c7" }}
                  />
                  <span>Activate this plan immediately for Staff & Customer booking</span>
                </label>
              </div>

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="pw-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="pw-btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : isEditing ? "Save Plan Changes" : "Create Pricing Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="pw-modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="pw-modal-card" style={{ maxWidth: "420px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <AlertTriangle size={40} className="text-amber-400" style={{ margin: "0 auto 12px auto" }} />
            <h3 style={{ color: "#ffffff", fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>Delete Pricing Plan?</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
              Are you sure you want to permanently delete this plan? This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
              <button
                type="button"
                className="pw-btn-secondary"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pw-btn-danger"
                onClick={() => handleDeletePlan(deleteConfirmId)}
              >
                Yes, Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

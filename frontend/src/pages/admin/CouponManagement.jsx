import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  Tag,
  Ticket,
  Plus,
  Search,
  CheckCircle2,
  Edit3,
  Trash2,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Eye,
  Calendar,
  Layers,
  IndianRupee,
  Users,
  ShieldCheck,
  Zap,
  Car
} from "lucide-react";

export default function CouponManagement({ setStatusActionMessage }) {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [usageTypeFilter, setUsageTypeFilter] = useState("all");
  const [applicableFilter, setApplicableFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);

  
  const [stats, setStats] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountGiven: 0
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCouponId, setCurrentCouponId] = useState(null);

  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDiscountType, setFormDiscountType] = useState("percentage");
  const [formDiscountValue, setFormDiscountValue] = useState("20");
  const [formMinAmount, setFormMinAmount] = useState("100");
  const [formMaxDiscount, setFormMaxDiscount] = useState("50");
  const [formUsageType, setFormUsageType] = useState("Limited");
  const [formTotalLimit, setFormTotalLimit] = useState("100");
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState("1");
  const [formStartDate, setFormStartDate] = useState("");
  const [formExpiryDate, setFormExpiryDate] = useState("");
  const [formApplicableTo, setFormApplicableTo] = useState("All");
  const [formStatus, setFormStatus] = useState("Active");

  
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [selectedCouponForUsage, setSelectedCouponForUsage] = useState(null);
  const [couponUsageList, setCouponUsageList] = useState([]);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const showNotification = (msg) => {
    setActionSuccess(msg);
    if (typeof setStatusActionMessage === "function") {
      setStatusActionMessage(msg);
    }
    setTimeout(() => {
      setActionSuccess("");
      if (typeof setStatusActionMessage === "function") {
        setStatusActionMessage("");
      }
    }, 4000);
  };

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        status: statusFilter,
        usage_type: usageTypeFilter,
        applicable_to: applicableFilter
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/coupons?${params}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
        setTotalCount(data.total !== undefined ? data.total : data.coupons.length);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, usageTypeFilter, applicableFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCoupons();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const toInputDatetime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentCouponId(null);
    setFormCode("");
    setFormDescription("");
    setFormDiscountType("percentage");
    setFormDiscountValue("20");
    setFormMinAmount("100");
    setFormMaxDiscount("50");
    setFormUsageType("Limited");
    setFormTotalLimit("100");
    setFormPerCustomerLimit("1");

    const now = new Date();
    const future = new Date(Date.now() + 30 * 86400000);
    setFormStartDate(toInputDatetime(now));
    setFormExpiryDate(toInputDatetime(future));
    setFormApplicableTo("All");
    setFormStatus("Active");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setIsEditing(true);
    setCurrentCouponId(coupon.id);
    setFormCode(coupon.code || "");
    setFormDescription(coupon.description || "");
    setFormDiscountType(coupon.discount_type || "percentage");
    setFormDiscountValue(String(coupon.discount_value || ""));
    setFormMinAmount(String(coupon.minimum_amount || "0"));
    setFormMaxDiscount(coupon.maximum_discount ? String(coupon.maximum_discount) : "");
    setFormUsageType(coupon.usage_type || "Limited");
    setFormTotalLimit(coupon.total_usage_limit ? String(coupon.total_usage_limit) : "");
    setFormPerCustomerLimit(String(coupon.per_customer_limit || "1"));
    setFormStartDate(toInputDatetime(coupon.start_date));
    setFormExpiryDate(toInputDatetime(coupon.expiry_date));
    setFormApplicableTo(coupon.applicable_to || "All");
    setFormStatus(coupon.status || "Active");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formCode || !formCode.trim()) {
      setFormError("Coupon code is required.");
      return;
    }
    const cleanCode = formCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (cleanCode.length < 3) {
      setFormError("Coupon code must be at least 3 characters.");
      return;
    }

    const dVal = parseFloat(formDiscountValue);
    if (isNaN(dVal) || dVal <= 0) {
      setFormError("Discount value must be greater than 0.");
      return;
    }
    if (formDiscountType === "percentage" && dVal > 100) {
      setFormError("Percentage discount cannot exceed 100%.");
      return;
    }

    const minAmt = parseFloat(formMinAmount) || 0;
    if (minAmt < 0) {
      setFormError("Minimum amount cannot be negative.");
      return;
    }

    let maxDisc = null;
    if (formDiscountType === "percentage" && formMaxDiscount && formMaxDiscount.trim()) {
      maxDisc = parseFloat(formMaxDiscount);
      if (isNaN(maxDisc) || maxDisc <= 0) {
        setFormError("Maximum discount cap must be a positive number.");
        return;
      }
    }

    if (!formStartDate || !formExpiryDate) {
      setFormError("Start date and expiry date are required.");
      return;
    }

    const sDate = new Date(formStartDate);
    const eDate = new Date(formExpiryDate);
    if (sDate > eDate) {
      setFormError("Start date cannot be after expiry date.");
      return;
    }

    const payload = {
      code: cleanCode,
      description: formDescription.trim(),
      discount_type: formDiscountType,
      discount_value: dVal,
      minimum_amount: minAmt,
      maximum_discount: maxDisc,
      usage_type: formUsageType,
      total_usage_limit: formUsageType === "Limited" ? (formTotalLimit ? parseInt(formTotalLimit, 10) : 100) : null,
      per_customer_limit: formUsageType === "One-Time" ? 1 : (formPerCustomerLimit ? parseInt(formPerCustomerLimit, 10) : 1),
      start_date: sDate.toISOString(),
      expiry_date: eDate.toISOString(),
      applicable_to: formApplicableTo,
      status: formStatus
    };

    setIsSaving(true);
    try {
      const url = isEditing
        ? `${API_BASE_URL}/api/admin/coupons/${currentCouponId}`
        : `${API_BASE_URL}/api/admin/coupons`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setIsSaving(false);

      if (!res.ok || !data.success) {
        setFormError(data.error || "Failed to save coupon.");
        return;
      }

      setIsModalOpen(false);
      showNotification(isEditing ? `Coupon "${cleanCode}" updated successfully.` : `Coupon "${cleanCode}" created successfully.`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
      setIsSaving(false);
      setFormError("Network error saving coupon.");
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = coupon.status === "Active" ? "Inactive" : "Active";
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${coupon.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Coupon "${coupon.code}" is now ${newStatus}.`);
        fetchCoupons();
      }
    } catch {
      showNotification("Failed to update coupon status.");
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      setDeleteConfirmId(null);
      if (data.success) {
        showNotification(`Coupon "${code}" deleted successfully.`);
        fetchCoupons();
      } else {
        showNotification(data.error || "Could not delete coupon.");
      }
    } catch {
      setDeleteConfirmId(null);
      showNotification("Failed to delete coupon.");
    }
  };

  const openUsageModal = async (coupon) => {
    setSelectedCouponForUsage(coupon);
    setIsUsageModalOpen(true);
    setIsLoadingUsage(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/coupons/${coupon.id}/usage`);
      const data = await res.json();
      setIsLoadingUsage(false);
      if (data.success && Array.isArray(data.usage)) {
        setCouponUsageList(data.usage);
      } else {
        setCouponUsageList([]);
      }
    } catch {
      setIsLoadingUsage(false);
      setCouponUsageList([]);
    }
  };

  const isExpired = (expiryDate) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="pw-pricing-plans-module" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Coupons</span>
          <span className="pw-metric-value">{stats.totalCoupons}</span>
          <span className="pw-metric-trend positive">
            <Ticket size={13} />
            <span>Configured in database</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active & Live</span>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{stats.activeCoupons}</span>
          <span className="pw-metric-trend positive" style={{ color: "#0d9488" }}>
            <CheckCircle2 size={13} />
            <span>Eligible for customer discounts</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Redemptions</span>
          <span className="pw-metric-value" style={{ color: "#2563eb" }}>{stats.totalRedemptions}</span>
          <span className="pw-metric-trend positive" style={{ color: "#2563eb" }}>
            <Users size={13} />
            <span>Successful checkout uses</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Discounts Given</span>
          <span className="pw-metric-value" style={{ color: "#7c3aed" }}>
            ₹{stats.totalDiscountGiven.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="pw-metric-trend positive" style={{ color: "#7c3aed" }}>
            <IndianRupee size={13} />
            <span>Total customer savings</span>
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="pw-user-action-alert" style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div className="pw-user-search-wrapper" style={{ minWidth: "260px", maxWidth: "420px", flex: "1 1 300px", position: "relative" }}>
            <Search size={15} className="pw-search-icon" />
            <input
              type="text"
              className="pw-user-search-input"
              placeholder="Search coupon code, description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{ width: "100%", paddingRight: searchQuery ? "32px" : "12px" }}
            />
            {searchQuery && (
              <button
                type="button"
                className="pw-clear-search-btn"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                title="Clear search"
                style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="pw-btn-secondary"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh coupons from database"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: (isRefreshing || isLoading) ? "not-allowed" : "pointer", fontSize: "0.86rem", fontWeight: 600 }}
            >
              <RefreshCw size={15} className={(isRefreshing || isLoading) ? "pw-spin-icon" : ""} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              className="pw-calc-btn-submit"
              onClick={openCreateModal}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "0.86rem", cursor: "pointer" }}
            >
              <Plus size={16} />
              <span>Create Coupon</span>
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", background: "var(--bg-card, #ffffff)", padding: "10px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Status:</span>
            {["all", "active", "inactive", "expired"].map((s) => (
              <button
                key={s}
                type="button"
                className={`pw-filter-pill ${statusFilter === s ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                style={{
                  textTransform: "capitalize",
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: statusFilter === s ? "1px solid #0d9488" : "1px solid var(--border-color, #e2e8f0)",
                  background: statusFilter === s ? "#0d9488" : "var(--bg-sub, #f8fafc)",
                  color: statusFilter === s ? "#ffffff" : "var(--text-secondary, #475569)",
                  fontWeight: 600
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <div style={{ width: "1px", height: "18px", background: "var(--border-color, #cbd5e1)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Type:</span>
            {["all", "Limited", "One-Time"].map((t) => (
              <button
                key={t}
                type="button"
                className={`pw-filter-pill ${usageTypeFilter === t ? "active" : ""}`}
                onClick={() => {
                  setUsageTypeFilter(t);
                  setPage(1);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: usageTypeFilter === t ? "1px solid #2563eb" : "1px solid var(--border-color, #e2e8f0)",
                  background: usageTypeFilter === t ? "#2563eb" : "var(--bg-sub, #f8fafc)",
                  color: usageTypeFilter === t ? "#ffffff" : "var(--text-secondary, #475569)",
                  fontWeight: 600
                }}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>

          <div style={{ width: "1px", height: "18px", background: "var(--border-color, #cbd5e1)" }} />

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Service:</span>
            {[
              { id: "all", label: "All Services" },
              { id: "Normal Parking", label: "Parking" },
              { id: "EV Charging", label: "EV Charging" }
            ].map((srv) => (
              <button
                key={srv.id}
                type="button"
                className={`pw-filter-pill ${applicableFilter === srv.id ? "active" : ""}`}
                onClick={() => {
                  setApplicableFilter(srv.id);
                  setPage(1);
                }}
                style={{
                  padding: "4px 10px",
                  fontSize: "0.76rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  border: applicableFilter === srv.id ? "1px solid #7c3aed" : "1px solid var(--border-color, #e2e8f0)",
                  background: applicableFilter === srv.id ? "#7c3aed" : "var(--bg-sub, #f8fafc)",
                  color: applicableFilter === srv.id ? "#ffffff" : "var(--text-secondary, #475569)",
                  fontWeight: 600
                }}
              >
                {srv.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pw-table-responsive" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", overflow: "hidden" }}>
        <table className="pw-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.78rem", textTransform: "uppercase", color: "var(--text-secondary, #64748b)", fontWeight: 700 }}>
              <th style={{ padding: "12px 16px" }}>Coupon Code</th>
              <th style={{ padding: "12px 16px" }}>Discount</th>
              <th style={{ padding: "12px 16px" }}>Type & Redemptions</th>
              <th style={{ padding: "12px 16px" }}>Min / Max Cap</th>
              <th style={{ padding: "12px 16px" }}>Applicable To</th>
              <th style={{ padding: "12px 16px" }}>Validity Period</th>
              <th style={{ padding: "12px 16px" }}>Status</th>
              <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary, #64748b)" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw size={18} className="pw-spin-icon" />
                    <span>Loading coupons from Neon PostgreSQL...</span>
                  </div>
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary, #64748b)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <Tag size={32} style={{ color: "#94a3b8" }} />
                    <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary, #0f172a)" }}>No coupons found</span>
                    <span style={{ fontSize: "0.82rem" }}>Try adjusting your search criteria or create a new promotional coupon.</span>
                  </div>
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const expired = isExpired(coupon.expiry_date);
                const isActive = (coupon.status || "").toLowerCase() === "active" && !expired;
                const isLimited = (coupon.usage_type || "").toLowerCase() === "limited";
                const used = parseInt(coupon.used_count, 10) || 0;
                const totalLimit = coupon.total_usage_limit !== null ? parseInt(coupon.total_usage_limit, 10) : null;
                const isLimitReached = isLimited && totalLimit !== null && used >= totalLimit;

                return (
                  <tr key={coupon.id} style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)", fontSize: "0.85rem" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ background: "var(--bg-teal-sub, #f0fdfa)", border: "1px dashed #0d9488", color: "#0f766e", padding: "4px 10px", borderRadius: "6px", fontWeight: 800, letterSpacing: "0.5px", fontSize: "0.86rem", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <Ticket size={13} />
                          <span>{coupon.code}</span>
                        </div>
                      </div>
                      {coupon.description && (
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", marginTop: "4px", maxWidth: "200px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={coupon.description}>
                          {coupon.description}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)", fontSize: "0.92rem" }}>
                        {coupon.discount_type === "percentage" ? `${parseFloat(coupon.discount_value)}% OFF` : `₹${parseFloat(coupon.discount_value).toFixed(2)} OFF`}
                      </div>
                      {coupon.discount_type === "percentage" && coupon.maximum_discount && (
                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>
                          Max: ₹{parseFloat(coupon.maximum_discount).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: isLimited ? "#eff6ff" : "#fdf4ff",
                          color: isLimited ? "#2563eb" : "#c026d3",
                          border: isLimited ? "1px solid #bfdbfe" : "1px solid #f5d0fe"
                        }}>
                          {coupon.usage_type}
                        </span>
                        {isLimitReached && (
                          <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 700 }}>
                            (Limit Reached)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #64748b)", marginTop: "4px" }}>
                        {isLimited ? (
                          <span>Used: <strong>{used}</strong> {totalLimit !== null ? `/ ${totalLimit}` : ""} (max {coupon.per_customer_limit}/user)</span>
                        ) : (
                          <span>Used: <strong>{used}</strong> customers (1/user)</span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>
                        Min: ₹{parseFloat(coupon.minimum_amount || 0).toFixed(2)}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: "6px",
                        background: coupon.applicable_to === "EV Charging" ? "#ecfdf5" : coupon.applicable_to === "Normal Parking" ? "#f0fdfa" : "var(--bg-sub, #f1f5f9)",
                        color: coupon.applicable_to === "EV Charging" ? "#059669" : coupon.applicable_to === "Normal Parking" ? "#0d9488" : "var(--text-secondary, #475569)"
                      }}>
                        {coupon.applicable_to === "EV Charging" ? <Zap size={12} /> : <Car size={12} />}
                        <span>{coupon.applicable_to || "All"}</span>
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.76rem" }}>
                        <span style={{ color: "var(--text-secondary, #64748b)" }}>
                          {formatDateDisplay(coupon.start_date)} - {formatDateDisplay(coupon.expiry_date)}
                        </span>
                        {expired ? (
                          <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "0.72rem" }}>
                            Expired
                          </span>
                        ) : (
                          <span style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.72rem" }}>
                            Valid
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon)}
                        title={`Click to ${coupon.status === "Active" ? "deactivate" : "activate"}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          padding: "3px 8px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "none",
                          background: isActive ? "#dcfce7" : "#f1f5f9",
                          color: isActive ? "#15803d" : "#64748b",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: isActive ? "#16a34a" : "#94a3b8" }} />
                        <span>{expired ? "Expired" : coupon.status}</span>
                      </button>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          className="pw-btn-action-icon"
                          onClick={() => openUsageModal(coupon)}
                          title="View Usage History"
                          style={{ padding: "5px", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "#2563eb" }}
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          className="pw-btn-action-icon"
                          onClick={() => openEditModal(coupon)}
                          title="Edit Coupon"
                          style={{ padding: "5px", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "var(--text-primary, #0f172a)" }}
                        >
                          <Edit3 size={14} />
                        </button>

                        {deleteConfirmId === coupon.id ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                              title="Confirm Delete"
                              style={{ padding: "4px 8px", borderRadius: "6px", background: "#dc2626", color: "#ffffff", border: "none", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700 }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              title="Cancel"
                              style={{ padding: "4px", borderRadius: "6px", background: "none", border: "1px solid #cbd5e1", cursor: "pointer", color: "#64748b" }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="pw-btn-action-icon"
                            onClick={() => setDeleteConfirmId(coupon.id)}
                            title="Delete Coupon"
                            style={{ padding: "5px", borderRadius: "6px", border: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "#ef4444" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalCount > 0 && (
        <Pagination
          currentPage={page}
          totalItems={totalCount}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
          pageSizeOptions={[5, 10, 25, 50]}
        />
      )}

      {isModalOpen && (
        <div className="pw-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="pw-modal-content" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", padding: "24px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Ticket size={20} style={{ color: "#0d9488" }} />
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary, #0f172a)" }}>
                  {isEditing ? `Edit Coupon "${formCode}"` : "Create Promotional Coupon"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div style={{ background: "#fff1f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={15} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCoupon} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PARK20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.88rem", fontWeight: 700, textTransform: "uppercase" }}
                  />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)" }}>Alphanumeric, e.g. FESTIVE50</span>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Applicable Service *
                  </label>
                  <select
                    value={formApplicableTo}
                    onChange={(e) => setFormApplicableTo(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", background: "var(--bg-card, #ffffff)" }}
                  >
                    <option value="All">All Services</option>
                    <option value="Normal Parking">Normal Parking</option>
                    <option value="EV Charging">EV Charging</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                  Description / Marketing Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% discount on advance parking reservations"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Discount Type *
                  </label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", background: "var(--bg-card, #ffffff)" }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Value {formDiscountType === "percentage" ? "(%)" : "(₹)"} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={formDiscountType === "percentage" ? "100" : undefined}
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Max Discount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional cap"
                    disabled={formDiscountType !== "percentage"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", background: formDiscountType !== "percentage" ? "#f1f5f9" : "var(--bg-card, #ffffff)" }}
                  />
                </div>
              </div>

              <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "12px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                      Usage Type *
                    </label>
                    <select
                      value={formUsageType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormUsageType(val);
                        if (val === "One-Time") {
                          setFormPerCustomerLimit("1");
                        }
                      }}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", background: "var(--bg-card, #ffffff)" }}
                    >
                      <option value="Limited">Limited (Configurable Usage Limit)</option>
                      <option value="One-Time">One-Time (1 use per customer)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                      Min Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formMinAmount}
                      onChange={(e) => setFormMinAmount(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {formUsageType === "Limited" ? (
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                        Total Usage Limit (All Customers)
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 100"
                        value={formTotalLimit}
                        onChange={(e) => setFormTotalLimit(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                      />
                    </div>
                  ) : (
                    <div>
                      <span style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#9333ea", marginBottom: "4px" }}>
                        One-Time Rule Enforced
                      </span>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>
                        Each customer can successfully redeem this coupon exactly once.
                      </p>
                    </div>
                  )}

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                      Per Customer Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      disabled={formUsageType === "One-Time"}
                      value={formUsageType === "One-Time" ? "1" : formPerCustomerLimit}
                      onChange={(e) => setFormPerCustomerLimit(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem", background: formUsageType === "One-Time" ? "#f1f5f9" : "var(--bg-card, #ffffff)" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    Expiry Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", fontSize: "0.85rem" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                  Status
                </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="couponStatus"
                      value="Active"
                      checked={formStatus === "Active"}
                      onChange={() => setFormStatus("Active")}
                    />
                    <span>Active</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="couponStatus"
                      value="Inactive"
                      checked={formStatus === "Inactive"}
                      onChange={() => setFormStatus("Inactive")}
                    />
                    <span>Inactive</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: "8px",
                    border: "1.5px solid #94a3b8",
                    background: "#ffffff",
                    color: "#0f172a",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.borderColor = "#64748b";
                    e.currentTarget.style.color = "#000000";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.borderColor = "#94a3b8";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="pw-calc-btn-submit"
                  style={{ padding: "8px 20px", fontSize: "0.86rem", cursor: isSaving ? "not-allowed" : "pointer" }}
                >
                  {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUsageModalOpen && selectedCouponForUsage && (
        <div className="pw-modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div className="pw-modal-content" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", width: "100%", maxWidth: "780px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)", padding: "24px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color, #e2e8f0)", paddingBottom: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Ticket size={20} style={{ color: "#0d9488" }} />
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0, color: "var(--text-primary, #0f172a)" }}>
                    Redemption History: {selectedCouponForUsage.code}
                  </h2>
                </div>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                  Verified customer redemptions recorded in Neon PostgreSQL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUsageModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {isLoadingUsage ? (
              <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary, #64748b)" }}>
                <RefreshCw size={20} className="pw-spin-icon" />
                <div style={{ marginTop: "8px" }}>Loading redemptions...</div>
              </div>
            ) : couponUsageList.length === 0 ? (
              <div style={{ padding: "36px", textAlign: "center", color: "var(--text-secondary, #64748b)" }}>
                <Users size={32} style={{ color: "#94a3b8", marginBottom: "8px" }} />
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary, #0f172a)" }}>No redemptions yet</div>
                <div style={{ fontSize: "0.82rem" }}>This coupon has not been used by any customer yet.</div>
              </div>
            ) : (
              <div className="pw-table-responsive" style={{ border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", overflow: "hidden" }}>
                <table className="pw-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", textTransform: "uppercase", fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", fontWeight: 700 }}>
                      <th style={{ padding: "10px 14px" }}>Customer</th>
                      <th style={{ padding: "10px 14px" }}>Service</th>
                      <th style={{ padding: "10px 14px" }}>Original</th>
                      <th style={{ padding: "10px 14px" }}>Discount</th>
                      <th style={{ padding: "10px 14px" }}>Final Paid</th>
                      <th style={{ padding: "10px 14px" }}>Used At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponUsageList.map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{u.customer_name || "Customer"}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>{u.customer_email}</div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{u.service_type || "Normal Parking"}</span>
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary, #64748b)" }}>
                          ₹{parseFloat(u.original_amount).toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 14px", color: "#16a34a", fontWeight: 700 }}>
                          -₹{parseFloat(u.discount_amount).toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                          ₹{parseFloat(u.final_amount).toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--text-secondary, #64748b)", fontSize: "0.74rem" }}>
                          {formatDateDisplay(u.used_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => setIsUsageModalOpen(false)}
                style={{
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "1.5px solid #94a3b8",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.borderColor = "#64748b";
                  e.currentTarget.style.color = "#000000";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#94a3b8";
                  e.currentTarget.style.color = "#0f172a";
                }}
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

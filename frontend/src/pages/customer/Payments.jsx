import { API_BASE_URL, apiFetch } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import { CreditCard, Smartphone, Banknote, Globe, Receipt, Search, RefreshCw, CheckCircle2, Calendar, Clock, Layers, ArrowUpRight, Download } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";
import PaymentButton from "../../components/PaymentButton.jsx";

export default function Payments({ loggedInUser, onViewReceipt }) {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalSpentAmount, setTotalSpentAmount] = useState(0);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionError, setSessionError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    setPaymentsError("");
    try {
      let user = loggedInUser;
      if (!user) {
        try {
          const saved = localStorage.getItem("shnoor_current_user");
          user = saved ? JSON.parse(saved) : null;
        } catch {
          user = null;
        }
      }
      if (!user || (!user.email && !user.name)) {
        setPayments([]);
        setTotal(0);
        setTotalCompleted(0);
        setTotalSpentAmount(0);
        return;
      }
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        method: methodFilter,
        status: statusFilter,
        dateFrom,
        dateTo
      });
      const res = await apiFetch(`${API_BASE_URL}/api/customer/payments?${params}`);
      const data = await res.json();
      if (!res.ok || !data.success || !Array.isArray(data.payments)) {
        throw new Error(data.error || "Unable to load payment history.");
      }
      setPayments(data.payments);
      setTotal(data.total !== undefined ? data.total : data.payments.length);
      setTotalCompleted(data.totalCompleted || 0);
      if (data.totalAmount !== undefined) {
        setTotalSpentAmount(data.totalAmount);
      }
    } catch (error) {
      setPaymentsError(error.message || "Unable to load payment history.");
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser, page, limit, searchQuery, methodFilter, statusFilter, dateFrom, dateTo]);

  const fetchActiveSessions = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/api/customer/my-parking`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to load active parking sessions.");
      }
      const sessions = Array.isArray(data.sessions) && data.sessions.length > 0
        ? data.sessions
        : (data.session ? [data.session] : []);
      setActiveSessions(sessions.filter((session) => session.parking_session_id));
      setSessionError("");
    } catch (error) {
      setActiveSessions([]);
      setSessionError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);

  const refreshPayments = async () => {
    await Promise.all([fetchPayments(), fetchActiveSessions()]);
  };

  const handleExportCsv = () => {
    const headers = ["Transaction ID", "Vehicle Plate", "Bay Slot", "Payment Method", "UPI VPA", "Razorpay Payment ID", "Date", "Time", "Amount (INR)", "Status", "Refund Status"];
    const rows = payments.map((p) => [
      p.transaction_id || `TXN-${p.id}`,
      p.vehicle_number,
      p.slot_number,
      p.payment_method,
      p.upi_vpa || "",
      p.razorpay_payment_id || "",
      formatDateOnly(p.paid_at || p.created_at || p.exit_time),
      formatTimeOnly(p.paid_at || p.created_at || p.exit_time),
      p.amount,
      p.payment_status || "Pending",
      p.refund_status || ""
    ]);
    exportToCsv("customer_payments.csv", headers, rows);
  };

  
  const formatDateOnly = (isoStr) => {
    if (!isoStr) {
      return new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  const formatTimeOnly = (isoStr) => {
    if (!isoStr) {
      return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return isoStr;
    }
  };

  const getMethodIcon = (method) => {
    const m = (method || "").toLowerCase();
    if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe")) {
      return <Smartphone size={13} className="pw-method-icon upi" />;
    }
    if (m.includes("card")) {
      return <CreditCard size={13} className="pw-method-icon card" />;
    }
    if (m.includes("cash")) {
      return <Banknote size={13} className="pw-method-icon cash" />;
    }
    return <Globe size={13} className="pw-method-icon netbanking" />;
  };

  const validPayments = payments;
  const filteredPayments = payments;

  const totalSpent = totalSpentAmount;
  const isCompleted = (payment) => ["completed", "successful", "paid", "success", "refunded"].includes(String(payment.payment_status || "").toLowerCase());

  return (
    <div className="pw-customer-payments-module">
      <div className="pw-users-panel-card" style={{ marginBottom: "24px", padding: "20px" }}>
        <div className="pw-section-header-row">
          <div>
            <h3 className="pw-section-title">Pay for Active Parking</h3>
            <p className="pw-section-sub">Checkout uses the current parking fee calculated for each active session.</p>
          </div>
          <button type="button" className="pw-btn-action-refresh" onClick={refreshPayments} title="Refresh payment status">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
        {sessionError && <p role="alert" style={{ color: "#b91c1c", marginTop: "12px" }}>{sessionError}</p>}
        {paymentsError && <p role="alert" style={{ color: "#b91c1c", marginTop: "12px" }}>{paymentsError}</p>}
        {activeSessions.length > 0 ? (
          <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
            {activeSessions.map((session) => (
              <div key={session.parking_session_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", padding: "14px", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "10px" }}>
                <div>
                  <strong>{session.vehicle_number}</strong>
                  <div style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.85rem", marginTop: "4px" }}>
                    Bay {session.current_slot} · Current balance ₹{Number(session.total_estimated_amount || 0).toFixed(2)}
                  </div>
                </div>
                <PaymentButton session={session} onPaymentComplete={refreshPayments} />
              </div>
            ))}
          </div>
        ) : !sessionError ? (
          <p style={{ color: "var(--text-secondary, #64748b)", marginTop: "14px" }}>No active parking session currently needs payment.</p>
        ) : null}
      </div>

      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Parking Spend</span>
          <span className="pw-metric-value">₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          <span className="pw-metric-trend positive">
            <span>Verified payment history</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Completed Transactions</span>
          <span className="pw-metric-value">{totalCompleted}</span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={12} />
            <span>Receipts available</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Latest Transaction</span>
          <span className="pw-metric-value" style={{ fontSize: "1.1rem", marginTop: "4px" }}>
            {validPayments[0] ? `₹${parseFloat(validPayments[0].amount).toFixed(2)}` : "₹0.00"}
          </span>
          <span className="pw-metric-trend positive">
            <Calendar size={11} />
            <span>{validPayments[0] ? formatDateOnly(validPayments[0].paid_at || validPayments[0].created_at || validPayments[0].exit_time) : "No history"}</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Payment Security</span>
          <span className="pw-metric-value" style={{ fontSize: "1.1rem", color: "#0d9488", marginTop: "4px" }}>
            100% Secure
          </span>
          <span className="pw-metric-trend positive">
            <span>PCI DSS compliant</span>
          </span>
        </div>
      </div>

      <div className="pw-users-panel-card" style={{ marginTop: "24px" }}>
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search reference, vehicle plate, bay..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-users-filter-group">
            <div className="pw-filter-dropdown-wrap">
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setPage(1);
                }}
                className="pw-custom-select"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="card">Razorpay Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
                <option value="netbanking">Razorpay Net Banking</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Wallet">Wallet</option>
              </select>
            </div>

            <div className="pw-filter-dropdown-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="pw-custom-select"
                aria-label="Filter by payment status"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <label className="pw-date-filter">
              <span>From</span>
              <input aria-label="Start date" type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </label>
            <label className="pw-date-filter">
              <span>To</span>
              <input aria-label="End date" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </label>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchPayments}
              title="Refresh payments"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              className="pw-export-btn"
              onClick={handleExportCsv}
              title="Export Payments CSV"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-customer-payments-grid">
            <span>Transaction Ref</span>
            <span>Vehicle Plate</span>
            <span>Bay & Duration</span>
            <span>Payment Method</span>
            <span>Date & Time</span>
            <span>Amount</span>
            <span style={{ textAlign: "right" }}>Receipt</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const amt = parseFloat(p.amount) || 0;

                return (
                  <div key={p.id || p.transaction_id} className="pw-user-card-box pw-mgmt-grid-row pw-customer-payments-grid">
                    <div>
                      <div className="pw-txn-badge">
                        <Receipt size={12} />
                        <span>{p.transaction_id}</span>
                      </div>
                      <span style={{ display: "inline-flex", marginTop: "5px", padding: "2px 7px", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 700, background: isCompleted(p) ? "#dcfce7" : String(p.payment_status).toLowerCase() === "failed" ? "#fee2e2" : String(p.payment_status).toLowerCase() === "cancelled" ? "#e2e8f0" : "#fef3c7", color: isCompleted(p) ? "#166534" : String(p.payment_status).toLowerCase() === "failed" ? "#991b1b" : String(p.payment_status).toLowerCase() === "cancelled" ? "#334155" : "#92400e" }}>
                        {p.payment_status || "Completed"}
                      </span>
                    </div>

                    <div>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                        <span>{p.vehicle_number}</span>
                      </span>
                    </div>

                    <div>
                      <div className="pw-badge-slot-cell" style={{ marginBottom: "3px" }}>
                        <Layers size={11} />
                        <span>Bay {p.slot_number}</span>
                      </div>
                      <div className="pw-duration-chip" style={{ fontSize: "0.72rem", padding: "2px 6px" }}>
                        <Clock size={10} />
                        <span>{p.duration}</span>
                      </div>
                    </div>

                    <div>
                      <span className="pw-payment-method-badge">
                        {getMethodIcon(p.payment_method)}
                        <span>{p.payment_method || "Razorpay"}</span>
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-primary, #1e293b)", fontWeight: 600, fontSize: "0.82rem" }}>
                        <Calendar size={13} style={{ color: "#0d9488" }} />
                        <span>{formatDateOnly(p.paid_at || p.created_at || p.exit_time)}</span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary, #94a3b8)", fontSize: "0.74rem", marginTop: "2px" }}>
                        <Clock size={11} />
                        <span>{formatTimeOnly(p.paid_at || p.created_at || p.exit_time)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="pw-fee-amount" style={{ fontSize: "0.95rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                      {p.coupon_code && (
                        <div style={{ fontSize: "0.68rem", color: "#16a34a", fontWeight: 700, marginTop: "2px" }}>
                          🏷️ {p.coupon_code} (-₹{parseFloat(p.discount_amount || 0).toFixed(2)})
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      {isCompleted(p) ? <button
                        type="button"
                        className="pw-btn-action-view-receipt"
                        onClick={() => onViewReceipt?.(p)}
                      >
                        <span>Receipt</span>
                        <ArrowUpRight size={12} />
                      </button> : <span style={{ color: "var(--text-secondary, #64748b)", fontSize: "0.78rem" }}>Not available</span>}
                      <button
                        type="button"
                        className="pw-btn-action-refresh"
                        style={{ marginTop: "6px", fontSize: "0.74rem" }}
                        onClick={() => setExpandedPaymentId(expandedPaymentId === p.id ? null : p.id)}
                        aria-expanded={expandedPaymentId === p.id}
                      >
                        {expandedPaymentId === p.id ? "Hide details" : "Details"}
                      </button>
                      {String(p.payment_status).toLowerCase() === "failed" && (p.parking_session_id || p.booking_id) && (
                        <div style={{ marginTop: "6px" }}>
                          <PaymentButton
                            session={p}
                            onPrepareOrder={p.booking_id ? () => ({ booking_id: p.booking_id }) : undefined}
                            onPaymentComplete={refreshPayments}
                          />
                        </div>
                      )}
                    </div>
                    {expandedPaymentId === p.id && (
                      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px", padding: "12px", borderRadius: "8px", background: "var(--bg-subtle, #f8fafc)", fontSize: "0.78rem" }}>
                        <span>Parking Record: {p.parking_session_id || "—"}</span>
                        <span>Razorpay Payment: {p.razorpay_payment_id || "—"}</span>
                        <span>Razorpay Order: {p.razorpay_order_id || "—"}</span>
                        <span>UPI ID: {p.upi_vpa || "—"}</span>
                        <span>Refund: {p.refund_status || "—"}{p.refund_amount ? ` · ₹${Number(p.refund_amount).toFixed(2)}` : ""}</span>
                        {p.failure_reason && <span>Failure: {p.failure_reason}</span>}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <Receipt size={32} className="pw-empty-icon" />
                  <h4>No payment records found</h4>
                  <p>You haven't completed any parking payments matching this filter yet.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Pagination
          currentPage={page}
          totalItems={total}
          pageSize={limit}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

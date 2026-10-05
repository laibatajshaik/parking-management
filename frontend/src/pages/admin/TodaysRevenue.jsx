import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import { TrendingUp, Search, RefreshCw, CreditCard, Smartphone, Banknote, Globe, Receipt, CheckCircle2, Calendar, Clock, Layers, Download } from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function TodaysRevenue() {
  const [revenueData, setRevenueData] = useState({
    summary: {
      totalRevenue: "₹0.00",
      totalRevenueNumeric: 0,
      completedCount: 0,
      avgTicket: "₹0.00",
      methodsBreakdown: {
        UPI: 0,
        "Credit Card": 0,
        "Debit Card": 0,
        Cash: 0,
        "Net Banking": 0
      }
    },
    payments: []
  });
  const [paymentsList, setPaymentsList] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const fetchRevenueSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/today`);
      const data = await res.json();
      if (data.success && data.summary) {
        setRevenueData(data);
      }
    } catch {
      void 0;
    }
  };

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery || "",
        method: methodFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/payments?${params}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && Array.isArray(data.payments)) {
        setPaymentsList(data.payments);
        setTotalPayments(data.total !== undefined ? data.total : data.payments.length);
      }
    } catch {
      setIsLoading(false);
    }
  }, [page, limit, searchQuery, methodFilter]);

  const refreshAll = () => {
    fetchRevenueSummary();
    fetchPayments();
  };

  useEffect(() => {
    fetchRevenueSummary();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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

  const filteredPayments = paymentsList;

  const handleExportCsv = () => {
    const headers = ["Transaction ID", "Vehicle Plate", "Customer Name", "Bay Slot", "Duration", "Payment Method", "Amount", "Status", "Date"];
    const rows = (filteredPayments || []).map((p) => [
      p.transaction_id || `TXN-${p.id}`,
      p.vehicle_number || "",
      p.customer_name || "",
      p.slot_number || "",
      p.duration || "",
      p.payment_method || "UPI",
      `₹${parseFloat(p.amount || 0).toFixed(2)}`,
      p.payment_status || "Completed",
      formatDate(p.created_at)
    ]);
    exportToCsv("Revenue_Payments_Report", headers, rows);
  };
  const summary = revenueData.summary || {};
  const totalRevFormatted = summary.totalRevenue || "₹0.00";
  const completedCountVal = summary.completedCount || 0;
  const avgTicketVal = summary.avgTicket || "₹0.00";
  const methods = summary.methodsBreakdown || {
    UPI: 0,
    "Credit Card": 0,
    "Debit Card": 0,
    Cash: 0,
    "Net Banking": 0
  };

  return (
    <div className="pw-todays-revenue-module">
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Today's Total Revenue</span>
          <span className="pw-metric-value">{totalRevFormatted}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Verified collections</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Completed Payments</span>
          <span className="pw-metric-value">{completedCountVal}</span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={12} />
            <span>100% Settled</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Average Ticket Size</span>
          <span className="pw-metric-value">{avgTicketVal}</span>
          <span className="pw-metric-trend positive">
            <span>Per vehicle session</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Primary Method</span>
          <span className="pw-metric-value">UPI & Digital</span>
          <span className="pw-metric-trend positive">
            <span>Fast & contactless</span>
          </span>
        </div>
      </div>

      <div className="pw-revenue-breakdown-strip">
        <div className="pw-rev-method-card">
          <div className="pw-rev-method-header">
            <Smartphone size={16} className="pw-method-icon upi" />
            <span>UPI Payments</span>
          </div>
          <div className="pw-rev-method-val">₹{(methods.UPI || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="pw-rev-method-card">
          <div className="pw-rev-method-header">
            <CreditCard size={16} className="pw-method-icon card" />
            <span>Cards (Credit / Debit)</span>
          </div>
          <div className="pw-rev-method-val">
            ₹{((methods["Credit Card"] || 0) + (methods["Debit Card"] || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="pw-rev-method-card">
          <div className="pw-rev-method-header">
            <Banknote size={16} className="pw-method-icon cash" />
            <span>Cash Collections</span>
          </div>
          <div className="pw-rev-method-val">₹{(methods.Cash || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="pw-rev-method-card">
          <div className="pw-rev-method-header">
            <Globe size={16} className="pw-method-icon netbanking" />
            <span>Net Banking / Fastag</span>
          </div>
          <div className="pw-rev-method-val">₹{(methods["Net Banking"] || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="pw-users-panel-card" style={{ marginTop: "24px" }}>
        <div className="pw-users-toolbar-row">
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search reference, plate, customer..."
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
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={refreshAll}
              disabled={isLoading}
              title="Refresh revenue data"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: isLoading ? "not-allowed" : "pointer", fontSize: "0.84rem", fontWeight: 600 }}
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin-icon" : ""} />
              <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
            </button>

            <button
              type="button"
              className="pw-btn-action-download"
              onClick={handleExportCsv}
              title="Download revenue payments as CSV"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", color: "var(--text-primary, #0f172a)", cursor: "pointer", fontSize: "0.84rem", fontWeight: 600 }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="pw-users-table-scroll-container">
          <div className="pw-users-header-row pw-mgmt-grid-row pw-revenue-grid">
            <span>Transaction Ref</span>
            <span>Vehicle Plate</span>
            <span>Customer</span>
            <span>Bay & Duration</span>
            <span>Payment Method</span>
            <span>Amount</span>
            <span style={{ textAlign: "right" }}>Status</span>
          </div>

          <div className="pw-user-cards-stack">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((p) => {
                const amt = parseFloat(p.amount) || 0;
                return (
                  <div key={p.id || p.transaction_id} className="pw-user-card-box pw-mgmt-grid-row pw-revenue-grid">
                    <div>
                      <div className="pw-txn-badge">
                        <Receipt size={12} />
                        <span>{p.transaction_id}</span>
                      </div>
                      <div className="pw-veh-model-sub" style={{ marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={11} style={{ color: "#0d9488" }} />
                        <span>{formatDate(p.created_at || p.exit_time)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="pw-veh-plate-badge" style={{ display: "inline-flex" }}>
                        <span>{p.vehicle_number}</span>
                      </span>
                    </div>

                    <div className="pw-user-card-contact-col">
                      <div className="pw-user-name-bold" style={{ fontSize: "0.82rem" }}>
                        {p.customer_name}
                      </div>
                      <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>
                        {p.customer_email || "—"}
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
                        <span>{p.payment_method}</span>
                      </span>
                    </div>

                    <div>
                      <span className="pw-fee-amount" style={{ fontSize: "0.95rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <span className="pw-status-pill completed">
                        <CheckCircle2 size={11} />
                        <span>Completed</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="pw-empty-users-card">
                <div className="pw-empty-state">
                  <Receipt size={32} className="pw-empty-icon" />
                  <h4>No payment records found</h4>
                  <p>No transactions match your current search or payment method filter.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <Pagination
          currentPage={page}
          totalItems={totalPayments}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemLabel="transactions"
        />
      </div>
    </div>
  );
}

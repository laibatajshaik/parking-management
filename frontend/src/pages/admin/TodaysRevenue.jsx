import { useState, useEffect } from "react";
import { TrendingUp, Search, RefreshCw, CreditCard, Smartphone, Banknote, Globe, Receipt, CheckCircle2, Calendar, Clock, Layers } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const fetchRevenue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/payments/today");
      const data = await res.json();
      setIsLoading(false);
      if (data.success) {
        setRevenueData(data);
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

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

  const validPayments = (revenueData.payments || []).filter(
    (p) =>
      p.vehicle_number &&
      p.vehicle_number.trim() !== "" &&
      p.vehicle_number !== "—" &&
      p.slot_number &&
      p.slot_number.trim() !== "" &&
      p.slot_number !== "—" &&
      p.transaction_id &&
      p.transaction_id.trim() !== "" &&
      p.transaction_id !== "—"
  );

  const filteredPayments = validPayments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (p.transaction_id || "").toLowerCase().includes(q) ||
      (p.vehicle_number || "").toLowerCase().includes(q) ||
      (p.customer_name || "").toLowerCase().includes(q) ||
      (p.slot_number || "").toLowerCase().includes(q);

    const matchesMethod =
      methodFilter === "ALL" ||
      (p.payment_method || "").toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesMethod;
  });

  const totalRevNumeric = validPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
  const totalRevFormatted = `₹${totalRevNumeric.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const completedCountVal = validPayments.length;
  const avgTicketVal = completedCountVal > 0 ? `₹${(totalRevNumeric / completedCountVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "₹0.00";

  const methods = {
    UPI: validPayments.filter(p => (p.payment_method || "").toLowerCase().includes("upi") || (p.payment_method || "").toLowerCase().includes("gpay")).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    "Credit Card": validPayments.filter(p => (p.payment_method || "").toLowerCase().includes("credit")).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    "Debit Card": validPayments.filter(p => (p.payment_method || "").toLowerCase().includes("debit")).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    Cash: validPayments.filter(p => (p.payment_method || "").toLowerCase().includes("cash")).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    "Net Banking": validPayments.filter(p => (p.payment_method || "").toLowerCase().includes("net") || (p.payment_method || "").toLowerCase().includes("bank")).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div className="pw-users-filter-group">
            <div className="pw-filter-dropdown-wrap">
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
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
              onClick={fetchRevenue}
              title="Refresh revenue data"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
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
                        {p.customer_email || "customer@shnoor.com"}
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

        <div className="pw-users-table-footer">
          <span>Showing {filteredPayments.length} of {validPayments.length} completed transactions</span>
        </div>
      </div>
    </div>
  );
}

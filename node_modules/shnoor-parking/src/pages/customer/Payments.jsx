import { useState, useEffect } from "react";
import { CreditCard, Smartphone, Banknote, Globe, Receipt, Search, RefreshCw, CheckCircle2, Calendar, Clock, Layers, ArrowUpRight } from "lucide-react";

export default function Payments({ loggedInUser, onViewReceipt }) {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const user = loggedInUser || { name: "Laiba", email: "customer@shnoor.com" };
      const queryParam = user.email ? `email=${encodeURIComponent(user.email)}` : `name=${encodeURIComponent(user.name || "Laiba")}`;
      const res = await fetch(`http://localhost:5000/api/customer/payments?${queryParam}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.payments) {
        if (data.payments.length > 0) {
          setPayments(data.payments);
        } else {
          const allRes = await fetch("http://localhost:5000/api/payments");
          const allData = await allRes.json();
          if (allData.success && allData.payments) {
            setPayments(allData.payments);
          }
        }
      }
    } catch {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [loggedInUser]);

  
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

  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (p.transaction_id || "").toLowerCase().includes(q) ||
      (p.vehicle_number || "").toLowerCase().includes(q) ||
      (p.slot_number || "").toLowerCase().includes(q);

    const matchesMethod =
      methodFilter === "ALL" ||
      (p.payment_method || "").toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesMethod;
  });

  const totalSpent = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div className="pw-customer-payments-module">
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
          <span className="pw-metric-value">{payments.length}</span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={12} />
            <span>Digital Receipts available</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Latest Transaction</span>
          <span className="pw-metric-value" style={{ fontSize: "1.1rem", marginTop: "4px" }}>
            {payments[0] ? `₹${parseFloat(payments[0].amount).toFixed(2)}` : "₹0.00"}
          </span>
          <span className="pw-metric-trend positive">
            <Calendar size={11} />
            <span>{payments[0] ? formatDateOnly(payments[0].created_at || payments[0].exit_time) : "No history"}</span>
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
              onClick={fetchPayments}
              title="Refresh payments"
            >
              <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
              <span>Refresh</span>
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
                        <span>{p.payment_method}</span>
                      </span>
                    </div>

                    <div className="pw-user-card-date-col">
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#1e293b", fontWeight: 600, fontSize: "0.82rem" }}>
                        <Calendar size={13} style={{ color: "#0d9488" }} />
                        <span>{formatDateOnly(p.created_at || p.exit_time)}</span>
                      </div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#64748b", fontSize: "0.74rem", marginTop: "2px" }}>
                        <Clock size={11} />
                        <span>{formatTimeOnly(p.created_at || p.exit_time)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="pw-fee-amount" style={{ fontSize: "0.95rem" }}>
                        ₹{amt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="pw-btn-action-view-receipt"
                        onClick={() => {
                          if (onViewReceipt) {
                            onViewReceipt(p);
                          }
                        }}
                      >
                        <span>Receipt</span>
                        <ArrowUpRight size={12} />
                      </button>
                    </div>
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

        <div className="pw-users-table-footer">
          <span>Showing {filteredPayments.length} of {payments.length} transactions</span>
        </div>
      </div>
    </div>
  );
}

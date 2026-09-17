import { useState, useEffect } from "react";
import { Printer, Download, Receipt, ShieldCheck, Calendar, Search, RefreshCw } from "lucide-react";

export default function DigitalReceipt({ selectedPayment, loggedInUser }) {
  const [paymentsList, setPaymentsList] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(selectedPayment || null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    if (selectedPayment) {
      setActiveReceipt(selectedPayment);
    }
  }, [selectedPayment]);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const user = loggedInUser || { name: "Laiba", email: "customer@shnoor.com" };
      const queryParam = user.email ? `email=${encodeURIComponent(user.email)}` : `name=${encodeURIComponent(user.name || "Laiba")}`;
      const res = await fetch(`http://localhost:5000/api/customer/payments?${queryParam}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.payments && data.payments.length > 0) {
        setPaymentsList(data.payments);
        if (!activeReceipt) {
          setActiveReceipt(data.payments[0]);
        }
      } else {
        const allRes = await fetch("http://localhost:5000/api/payments");
        const allData = await allRes.json();
        if (allData.success && allData.payments && allData.payments.length > 0) {
          setPaymentsList(allData.payments);
          if (!activeReceipt) {
            setActiveReceipt(allData.payments[0]);
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

  const handleDownloadSlip = () => {
    if (!activeReceipt) return;
    const formattedAmount = parseFloat(activeReceipt.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Official Parking Slip - ${activeReceipt.transaction_id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 30px;
      background-color: #f8fafc;
      color: #0f172a;
      display: flex;
      justify-content: center;
    }
    .ticket {
      width: 420px;
      background: #ffffff;
      border: 2px solid #0f3b43;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
    }
    .header {
      text-align: center;
      border-bottom: 2px dashed #cbd5e1;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #0f3b43;
    }
    .status-badge {
      display: inline-block;
      margin-top: 6px;
      background: #f0fdf4;
      color: #166534;
      border: 1px solid #bbf7d0;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .ticket-id {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      font-family: monospace;
      font-weight: 600;
    }
    .plate-banner {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 14px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-family: monospace;
      font-size: 16px;
      font-weight: bold;
    }
    .slot-pill {
      background: #0d9488;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .item {
      display: flex;
      flex-direction: column;
    }
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }
    .val {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }
    .total-banner {
      background: #f0fdfa;
      border: 1px solid #ccfbf1;
      padding: 12px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .total-label {
      font-size: 12px;
      font-weight: 700;
      color: #0f766e;
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: #0f766e;
    }
    .barcode-box {
      text-align: center;
      padding: 10px;
      background: #f1f5f9;
      border-radius: 8px;
      margin-bottom: 14px;
    }
    .barcode {
      font-family: "Courier New", monospace;
      font-size: 20px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #0f172a;
    }
    .barcode-sub {
      font-size: 10px;
      color: #64748b;
      margin-top: 4px;
      letter-spacing: 1px;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="brand">PARKSAFE PARKING SYSTEM</div>
      <span class="status-badge">PAID • VERIFIED</span>
      <div class="ticket-id">${activeReceipt.transaction_id}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 6px; font-weight: 600;">
        Receipt Date: ${formatDate(activeReceipt.created_at || activeReceipt.exit_time)}
      </div>
    </div>
    <div class="plate-banner">
      <span>${activeReceipt.vehicle_number}</span>
      <span class="slot-pill">Bay ${activeReceipt.slot_number}</span>
    </div>
    <div class="grid">
      <div class="item">
        <span class="label">Customer</span>
        <span class="val">${activeReceipt.customer_name}</span>
      </div>
      <div class="item">
        <span class="label">Contact</span>
        <span class="val">${activeReceipt.customer_phone || "+91 98765 43210"}</span>
      </div>
      <div class="item">
        <span class="label">Entry Time</span>
        <span class="val">${formatDate(activeReceipt.entry_time)}</span>
      </div>
      <div class="item">
        <span class="label">Exit Time</span>
        <span class="val">${formatDate(activeReceipt.exit_time)}</span>
      </div>
      <div class="item">
        <span class="label">Duration</span>
        <span class="val">${activeReceipt.duration}</span>
      </div>
      <div class="item">
        <span class="label">Payment</span>
        <span class="val">${activeReceipt.payment_method}</span>
      </div>
      <div class="item">
        <span class="label">Payment Date</span>
        <span class="val">${formatDate(activeReceipt.created_at || activeReceipt.exit_time)}</span>
      </div>
      <div class="item">
        <span class="label">Status</span>
        <span class="val">Completed</span>
      </div>
    </div>
    <div class="total-banner">
      <span class="total-label">Total Tariff Paid</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>
    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${activeReceipt.transaction_id} • ${activeReceipt.vehicle_number}</div>
    </div>
    <div class="footer">
      <p>Official Computer Generated Tax Invoice</p>
      <p>Thank you for choosing Shnoor ParkSafe Parking Facility.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Parking-Receipt-${activeReceipt.transaction_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredList = paymentsList.filter((p) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.transaction_id || "").toLowerCase().includes(q) ||
      (p.vehicle_number || "").toLowerCase().includes(q) ||
      (p.slot_number || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="pw-customer-receipt-split">
      <div className="pw-receipt-list-col">
        <div className="pw-receipt-list-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", margin: 0 }}>My Invoices & Slips</h3>
            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchPayments}
              title="Refresh receipts"
            >
              <RefreshCw size={13} className={isLoading ? "pw-spin" : ""} />
            </button>
          </div>

          <div className="pw-search-box-pill" style={{ width: "100%", boxSizing: "border-box" }}>
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search receipt ID or vehicle..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "560px", overflowY: "auto" }}>
            {filteredList.length > 0 ? (
              filteredList.map((p) => {
                const isSelected = activeReceipt && (activeReceipt.id === p.id || activeReceipt.transaction_id === p.transaction_id);
                return (
                  <div
                    key={p.id || p.transaction_id}
                    className={`pw-receipt-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setActiveReceipt(p)}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Receipt size={13} style={{ color: "#0d9488" }} />
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary, #0f172a)" }}>{p.transaction_id}</span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        {p.vehicle_number} • Bay {p.slot_number}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "1px" }}>
                        {formatDate(p.created_at || p.exit_time)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f766e" }}>
                        ₹{parseFloat(p.amount).toFixed(2)}
                      </div>
                      <span className="pw-status-pill completed" style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                        Paid
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
                <Receipt size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "0.85rem" }}>No receipts found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pw-receipt-preview-col">
        {activeReceipt ? (
          <div className="pw-official-receipt-card" id="printable-receipt">
            <div className="pw-official-receipt-header">
              <div className="pw-receipt-brand-row">
                <div className="pw-brand-logo-box" style={{ width: "32px", height: "32px" }}>
                  <span className="pw-p-logo" style={{ fontSize: "16px" }}>P</span>
                </div>
                <div>
                  <h3 className="pw-receipt-company-title">PARKSAFE</h3>
                  <span className="pw-receipt-company-sub">Smart Parking Management Systems</span>
                </div>
              </div>

              <div className="pw-receipt-meta-right">
                <span className="pw-receipt-badge-status">PAID • VERIFIED</span>
                <span className="pw-receipt-number-tag">{activeReceipt.transaction_id}</span>
                <div className="pw-receipt-issue-date" style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "5px", justifyContent: "flex-end" }}>
                  <Calendar size={12} style={{ color: "#0d9488" }} />
                  <span>{formatDate(activeReceipt.created_at || activeReceipt.exit_time)}</span>
                </div>
              </div>
            </div>

            <div className="pw-official-receipt-body">
              <div className="pw-receipt-plate-banner">
                <span className="pw-receipt-plate">{activeReceipt.vehicle_number}</span>
                <span className="pw-receipt-slot">Bay {activeReceipt.slot_number}</span>
              </div>

              <div className="pw-receipt-details-table" style={{ marginTop: "20px" }}>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer / Owner</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_name}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Email</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_email || "customer@shnoor.com"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Contact Phone</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_phone || "+91 98765 43210"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Assigned Parking Bay</span>
                  <span className="pw-receipt-value">Bay {activeReceipt.slot_number}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Entry Date & Time</span>
                  <span className="pw-receipt-value">{formatDate(activeReceipt.entry_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Exit Date & Time</span>
                  <span className="pw-receipt-value">{formatDate(activeReceipt.exit_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Total Parking Duration</span>
                  <span className="pw-receipt-value">{activeReceipt.duration}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Method</span>
                  <span className="pw-receipt-value">{activeReceipt.payment_method}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Date & Time</span>
                  <span className="pw-receipt-value">{formatDate(activeReceipt.created_at || activeReceipt.exit_time)}</span>
                </div>
                <div className="pw-receipt-row pw-receipt-total-row">
                  <span className="pw-receipt-label">Total Tariff Paid</span>
                  <span className="pw-receipt-total-value">
                    ₹{parseFloat(activeReceipt.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pw-receipt-footer-stamp">
                <ShieldCheck size={16} />
                <span>This is a computer-generated tax invoice & electronic parking pass issued by ParkSafe Systems.</span>
              </div>
            </div>

            <div className="pw-receipt-action-buttons">
              <button
                type="button"
                className="pw-btn-download-slip"
                onClick={handleDownloadSlip}
              >
                <Download size={15} />
                <span>Download Slip</span>
              </button>

              <button
                type="button"
                className="pw-btn-print"
                onClick={handlePrint}
              >
                <Printer size={15} />
                <span>Print Digital Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pw-empty-users-card">
            <div className="pw-empty-state">
              <Receipt size={36} className="pw-empty-icon" />
              <h4>No Receipt Selected</h4>
              <p>Select an invoice from the left panel to inspect official tax invoice and pass.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

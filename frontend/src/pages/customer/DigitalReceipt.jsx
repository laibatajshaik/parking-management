import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import { Printer, Download, Receipt, ShieldCheck, Calendar, Search, RefreshCw, BookmarkPlus, Zap } from "lucide-react";
import Pagination from "../../components/Pagination.jsx";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function DigitalReceipt({ receiptData, selectedPayment, currentUser, loggedInUser, onNavigate }) {
  const initialData = receiptData || selectedPayment || null;
  const [paymentsList, setPaymentsList] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  const isEv = (item) => {
    if (!item) return false;
    const txn = String(item.transaction_id || "");
    const slot = String(item.slot_number || "");
    const plan = String(item.plan_name || "");
    return txn.startsWith("TXN-EV-") || slot.toUpperCase().startsWith("EV-") || plan.toLowerCase().includes("ev");
  };

  const resolveEmail = useCallback(() => {
    const user = currentUser || loggedInUser;
    if (user && user.email) return user.email;
    try {
      const saved = localStorage.getItem("shnoor_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed.email;
      }
    } catch {
      return "";
    }
    return "";
  }, [currentUser, loggedInUser]);

  useEffect(() => {
    if (receiptData) {
      setActiveReceipt(receiptData);
    } else if (selectedPayment) {
      setActiveReceipt(selectedPayment);
    }
  }, [receiptData, selectedPayment]);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    const email = resolveEmail();
    if (!email) {
      setIsLoading(false);
      setPaymentsList([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/payments?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setIsLoading(false);
      if (data && data.success && Array.isArray(data.payments)) {
        setPaymentsList(data.payments);
        if (data.payments.length > 0 && !activeReceipt) {
          setActiveReceipt(data.payments[0]);
        }
      } else {
        setPaymentsList([]);
      }
    } catch {
      setIsLoading(false);
      setPaymentsList([]);
    }
  }, [resolveEmail, activeReceipt]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const str = String(isoStr).trim();
      const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+(\d{1,2}):(\d{2})(?:\s*(AM|PM))?)?/i);
      if (dmyMatch) {
        const [, d, m, y, h, min, ampm] = dmyMatch;
        let hourNum = h ? parseInt(h, 10) : 0;
        let p = ampm ? ampm.toLowerCase() : (hourNum >= 12 ? "pm" : "am");
        if (!ampm) hourNum = hourNum % 12 || 12;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const monthStr = monthNames[parseInt(m, 10) - 1] || m;
        return `${parseInt(d, 10)} ${monthStr} ${y}, ${String(hourNum).padStart(2, "0")}:${min || "00"} ${p}`;
      }
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
      if (match) {
        const [, y, m, d, h, min] = match;
        const hourNum = parseInt(h, 10);
        const ampm = hourNum >= 12 ? "pm" : "am";
        const h12 = hourNum % 12 || 12;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const monthStr = monthNames[parseInt(m, 10) - 1] || m;
        return `${parseInt(d, 10)} ${monthStr} ${y}, ${String(h12).padStart(2, "0")}:${min} ${ampm}`;
      }
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return String(isoStr);
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return String(isoStr);
    }
  };

  const handleDownloadSlip = () => {
    if (!activeReceipt) return;
    const isEvReceipt = isEv(activeReceipt);
    const formattedAmount = parseFloat(activeReceipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const formattedFee = parseFloat(activeReceipt.fee || activeReceipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const receiptHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${isEvReceipt ? "Official EV Supercharging Receipt" : "Official Parking Slip"} - ${activeReceipt.transaction_id || "Receipt"}</title>
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
      width: 440px;
      background: #ffffff;
      border: 2px solid ${isEvReceipt ? "#059669" : "#0f3b43"};
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
      color: ${isEvReceipt ? "#059669" : "#0f3b43"};
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
      background: ${isEvReceipt ? "#059669" : "#0d9488"};
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
      color: ${isEvReceipt ? "#059669" : "#0f766e"};
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: ${isEvReceipt ? "#059669" : "#0f766e"};
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
      <div class="brand">${isEvReceipt ? "PARKSAFE EV SUPERCHARGING NETWORK" : "PARKSAFE PARKING SYSTEM"}</div>
      <span class="status-badge">${isEvReceipt ? "⚡ CHARGING COMPLETED • VERIFIED" : (activeReceipt.payment_status || "PAID • VERIFIED")}</span>
      <div class="ticket-id">TXN: ${activeReceipt.transaction_id || "—"}</div>
      <div style="font-size: 11px; color: #475569; margin-top: 4px; font-weight: 600;">
        ${isEvReceipt ? "Session Type: High-Speed Electric Vehicle Charging" : `Booking ID: ${activeReceipt.booking_id || "—"}`}
      </div>
      <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
        Receipt Date: ${formatDate(activeReceipt.receipt_date || activeReceipt.created_at || activeReceipt.exit_time)}
      </div>
    </div>

    <div class="plate-banner">
      <span>${activeReceipt.vehicle_number || "—"}</span>
      <span class="slot-pill">${isEvReceipt ? "⚡ EV Bay " : "Bay "}${activeReceipt.slot_number || "—"}</span>
    </div>

    <div class="grid">
      <div class="item">
        <span class="label">Customer Name</span>
        <span class="val">${activeReceipt.customer_name || "—"}</span>
      </div>
      <div class="item">
        <span class="label">Customer Email</span>
        <span class="val">${activeReceipt.customer_email || "—"}</span>
      </div>
      <div class="item">
        <span class="label">Customer Phone</span>
        <span class="val">${activeReceipt.customer_phone || "—"}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Type</span>
        <span class="val">${isEvReceipt ? "Electric Vehicle (EV)" : (activeReceipt.vehicle_type || "Car")}</span>
      </div>
      <div class="item">
        <span class="label">Vehicle Model</span>
        <span class="val">${activeReceipt.model || "—"}</span>
      </div>
      <div class="item">
        <span class="label">${isEvReceipt ? "Service Type" : "Parking Plan"}</span>
        <span class="val">${isEvReceipt ? "⚡ EV Supercharging" : (activeReceipt.plan_name || "Hourly Rate")}</span>
      </div>
      <div class="item">
        <span class="label">${isEvReceipt ? "Session Start" : "Entry Time"}</span>
        <span class="val">${formatDate(activeReceipt.entry_time)}</span>
      </div>
      <div class="item">
        <span class="label">${isEvReceipt ? "Session End" : "Exit Time"}</span>
        <span class="val">${formatDate(activeReceipt.exit_time)}</span>
      </div>
      <div class="item">
        <span class="label">${isEvReceipt ? "Charging Duration" : "Parking Duration"}</span>
        <span class="val">${activeReceipt.duration || "—"}</span>
      </div>
      <div class="item">
        <span class="label">Payment Method</span>
        <span class="val">${activeReceipt.payment_method || "UPI / Card"}</span>
      </div>
      <div class="item">
        <span class="label">${isEvReceipt ? "Tariff Rate" : "Base Fee"}</span>
        <span class="val">${isEvReceipt ? "₹18.00 / kWh" : `₹${formattedFee}`}</span>
      </div>
      <div class="item">
        <span class="label">Payment Status</span>
        <span class="val">${activeReceipt.payment_status || "Completed"}</span>
      </div>
    </div>

    <div class="total-banner">
      <span class="total-label">${isEvReceipt ? "Total Energy & Service Paid" : "Total Tariff Paid"}</span>
      <span class="total-val">₹${formattedAmount}</span>
    </div>

    <div class="barcode-box">
      <div class="barcode">||| | | |||| | || | |||</div>
      <div class="barcode-sub">${activeReceipt.transaction_id || "PARKSAFE"} • ${activeReceipt.vehicle_number || ""}</div>
    </div>

    <div class="footer">
      <p>Official Computer Generated ${isEvReceipt ? "EV Charging Tax Invoice & Energy Meter Slip" : "Tax Invoice & Parking Permit"}</p>
      <p>Thank you for choosing Shnoor ParkSafe Parking Facility.</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([receiptHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Parking-Receipt-${activeReceipt.transaction_id || "slip"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    if (!filteredList.length) return;
    const exportData = filteredList.map((p) => {
      const isEvItem = isEv(p);
      return {
        "Receipt / Transaction ID": p.transaction_id || p.booking_id || p.id || "",
        "Vehicle": p.vehicle_number || "",
        "Bay / Slot": p.slot_number || "",
        "Plan / Type": isEvItem ? "⚡ EV Supercharging" : (p.plan_name || "Standard"),
        "Amount (₹)": parseFloat(p.amount || 0).toFixed(2),
        "Payment Method": p.payment_method || "Online",
        "Status": p.payment_status || "Paid",
        "Date": formatDate(p.receipt_date || p.created_at || p.exit_time)
      };
    });
    exportToCsv("customer_receipts.csv", exportData);
  };

  const filteredList = paymentsList.filter((p) => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (
      (p.transaction_id || "").toLowerCase().includes(q) ||
      (p.booking_id || "").toLowerCase().includes(q) ||
      (p.vehicle_number || "").toLowerCase().includes(q) ||
      (p.slot_number || "").toLowerCase().includes(q) ||
      (p.plan_name || "").toLowerCase().includes(q)
    );
  });

  const paginatedList = filteredList.slice((page - 1) * limit, page * limit);

  return (
    <div className="pw-customer-receipt-split">
      <div className="pw-receipt-list-col">
        <div className="pw-receipt-list-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", margin: 0 }}>
              My Receipts & Invoices
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={fetchPayments}
                title="Refresh receipts"
              >
                <RefreshCw size={13} className={isLoading ? "pw-spin" : ""} />
              </button>
              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleExportCsv}
                disabled={filteredList.length === 0}
                title="Export Receipts CSV"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="pw-search-box-pill" style={{ width: "100%", boxSizing: "border-box" }}>
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search receipt ID, vehicle, or bay..."
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setPage(1);
              }}
              className="pw-pill-input"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "560px", overflowY: "auto" }}>
            {paginatedList.length > 0 ? (
              paginatedList.map((p) => {
                const isSelected = activeReceipt && (activeReceipt.id === p.id || activeReceipt.transaction_id === p.transaction_id);
                const itemIsEv = isEv(p);
                return (
                  <div
                    key={p.id || p.transaction_id}
                    className={`pw-receipt-list-item ${isSelected ? "selected" : ""}`}
                    onClick={() => setActiveReceipt(p)}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {itemIsEv ? (
                          <Zap size={13} style={{ color: "#059669" }} />
                        ) : (
                          <Receipt size={13} style={{ color: "#0d9488" }} />
                        )}
                        <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--text-primary, #0f172a)" }}>
                          {p.transaction_id || "Receipt"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                        {p.vehicle_number} • {itemIsEv ? "⚡ EV Bay " : "Bay "}{p.slot_number}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "1px" }}>
                        {formatDate(p.receipt_date || p.created_at || p.exit_time)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: itemIsEv ? "#059669" : "#0f766e" }}>
                        ₹{parseFloat(p.amount || 0).toFixed(2)}
                      </div>
                      <span className="pw-status-pill completed" style={{ fontSize: "0.68rem", padding: "1px 6px", background: itemIsEv ? "rgba(16, 185, 129, 0.15)" : undefined, color: itemIsEv ? "#059669" : undefined }}>
                        {itemIsEv ? "⚡ EV Paid" : (p.payment_status || "Paid")}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "#94a3b8" }}>
                <Receipt size={32} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>
                  No receipts found
                </p>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.76rem" }}>
                  Receipts generated upon vehicle checkout will be shown here.
                </p>
              </div>
            )}
          </div>
          {filteredList.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <Pagination
                currentPage={page}
                totalItems={filteredList.length}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setLimit(newSize);
                  setPage(1);
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="pw-receipt-preview-col">
        {activeReceipt ? (
          <div className="pw-official-receipt-card" id="printable-receipt" style={isEv(activeReceipt) ? { borderColor: "#059669" } : undefined}>
            <div className="pw-official-receipt-header">
              <div className="pw-receipt-brand-row">
                <div className="pw-brand-logo-box" style={{ width: "32px", height: "32px", background: isEv(activeReceipt) ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : undefined }}>
                  {isEv(activeReceipt) ? (
                    <Zap size={18} style={{ color: "#ffffff" }} />
                  ) : (
                    <span className="pw-p-logo" style={{ fontSize: "16px" }}>P</span>
                  )}
                </div>
                <div>
                  <h3 className="pw-receipt-company-title">{isEv(activeReceipt) ? "PARKSAFE EV" : "PARKSAFE"}</h3>
                  <span className="pw-receipt-company-sub">{isEv(activeReceipt) ? "Smart High-Speed EV Supercharging Network" : "Smart Parking Management Systems"}</span>
                </div>
              </div>

              <div className="pw-receipt-meta-right">
                <span className="pw-receipt-badge-status" style={isEv(activeReceipt) ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" } : undefined}>
                  {isEv(activeReceipt) ? "⚡ EV CHARGED • PAID" : (activeReceipt.payment_status || "PAID • VERIFIED")}
                </span>
                <span className="pw-receipt-number-tag">{activeReceipt.transaction_id || "TXN-XXXX"}</span>
                <div className="pw-receipt-issue-date" style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)", marginTop: "4px", display: "inline-flex", alignItems: "center", gap: "5px", justifyContent: "flex-end" }}>
                  <Calendar size={12} style={{ color: isEv(activeReceipt) ? "#059669" : "#0d9488" }} />
                  <span>{formatDate(activeReceipt.receipt_date || activeReceipt.created_at || activeReceipt.exit_time)}</span>
                </div>
              </div>
            </div>

            <div className="pw-official-receipt-body">
              <div className="pw-receipt-plate-banner">
                <span className="pw-receipt-plate">{activeReceipt.vehicle_number || "—"}</span>
                <span className="pw-receipt-slot" style={isEv(activeReceipt) ? { background: "#059669" } : undefined}>
                  {isEv(activeReceipt) ? "⚡ EV Bay " : "Bay "}{activeReceipt.slot_number || "—"}
                </span>
              </div>

              <div className="pw-receipt-details-table" style={{ marginTop: "16px" }}>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Transaction ID</span>
                  <span className="pw-receipt-value" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {activeReceipt.transaction_id || "—"}
                  </span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Booking ID</span>
                  <span className="pw-receipt-value" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {activeReceipt.booking_id || "—"}
                  </span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Name</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_name || "—"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Email</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_email || "—"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Customer Phone</span>
                  <span className="pw-receipt-value">{activeReceipt.customer_phone || "—"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Vehicle & Model</span>
                  <span className="pw-receipt-value">
                    {activeReceipt.vehicle_number || "—"} ({activeReceipt.vehicle_type || (isEv(activeReceipt) ? "EV" : "Car")} {activeReceipt.model ? `• ${activeReceipt.model}` : ""})
                  </span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Assigned EV Bay" : "Assigned Parking Bay"}</span>
                  <span className="pw-receipt-value">{isEv(activeReceipt) ? "⚡ EV Bay " : "Bay "}{activeReceipt.slot_number || "—"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Service / Tariff Model" : "Tariff / Plan Name"}</span>
                  <span className="pw-receipt-value">{isEv(activeReceipt) ? "⚡ EV Supercharging (₹18.00 / kWh)" : (activeReceipt.plan_name || "Standard Tariff")}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Charging Start Time" : "Entry Date & Time"}</span>
                  <span className="pw-receipt-value">{formatDate(activeReceipt.entry_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Charging End Time" : "Exit Date & Time"}</span>
                  <span className="pw-receipt-value">{formatDate(activeReceipt.exit_time)}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Total Charging Duration" : "Total Parking Duration"}</span>
                  <span className="pw-receipt-value">{activeReceipt.duration || "—"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Payment Method</span>
                  <span className="pw-receipt-value">{activeReceipt.payment_method || "Cash / Digital"}</span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Tariff Rate" : "Base Fee"}</span>
                  <span className="pw-receipt-value">
                    {isEv(activeReceipt) ? "₹18.00 / kWh" : `₹${parseFloat(activeReceipt.fee || activeReceipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="pw-receipt-row">
                  <span className="pw-receipt-label">Receipt & Payment Date</span>
                  <span className="pw-receipt-value">
                    {formatDate(activeReceipt.receipt_date || activeReceipt.created_at || activeReceipt.exit_time)}
                  </span>
                </div>
                <div className="pw-receipt-row pw-receipt-total-row">
                  <span className="pw-receipt-label">{isEv(activeReceipt) ? "Total EV Amount Paid" : "Total Amount Paid"}</span>
                  <span className="pw-receipt-total-value" style={isEv(activeReceipt) ? { color: "#059669" } : undefined}>
                    ₹{parseFloat(activeReceipt.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pw-receipt-footer-stamp">
                <ShieldCheck size={16} />
                <span>Official computer-generated tax invoice & electronic parking pass issued by ParkSafe Systems.</span>
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
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="pw-empty-users-card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <div className="pw-empty-state">
              <Receipt size={42} className="pw-empty-icon" style={{ margin: "0 auto 12px", color: "#0d9488" }} />
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0", color: "var(--text-primary, #0f172a)" }}>
                No Receipts Yet
              </h4>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary, #64748b)", margin: "0 0 16px 0", maxWidth: "340px", marginLeft: "auto", marginRight: "auto" }}>
                You don't have any parking receipts yet. Once you complete a parking session or make a reservation, your official tax invoices will appear here.
              </p>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("reserve-parking")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#0d9488",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <BookmarkPlus size={16} />
                  <span>Reserve a Parking Bay</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

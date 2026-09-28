import { useState, useEffect } from "react";
import { Printer, CheckCircle2, CreditCard, Smartphone, Layers } from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";

export default function StaffShiftReports() {
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [closureSuccess, setClosureSuccess] = useState(false);
  const [shiftInfo, setShiftInfo] = useState({
    operator: "Laiba Taj",
    staffId: "STF-204",
    terminal: "Terminal #01 (Gate 1 & 2)",
    shiftDate: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
    shiftTime: "07:00 AM - Current Duty",
    totalEntries: 0,
    totalExits: 0,
    totalRevenue: "₹ 0.00",
    cashCollected: "₹ 0.00",
    upiFastag: "₹ 0.00",
    cardSwipes: "₹ 0.00",
    openingDrawerBalance: "₹ 2,000.00",
    closingDrawerCash: "₹ 2,000.00",
    rawTotal: 0
  });

  const fetchShiftReport = () => {
    fetch(`${API_BASE_URL}/api/staff/shift-report`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.shiftData) {
          const s = data.shiftData;
          const cashVal = s.cashCollected || 0;
          setShiftInfo({
            operator: s.staffName || "Laiba Taj",
            staffId: "STF-204",
            terminal: s.assignedGates || "Terminal #01 (Gate 1 & 2)",
            shiftDate: new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" }),
            shiftTime: `${s.startTime || "07:00 AM"} - Current Duty`,
            totalEntries: s.vehiclesEntered || 0,
            totalExits: s.vehiclesExited || 0,
            totalRevenue: `₹ ${(s.totalCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            cashCollected: `₹ ${cashVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            upiFastag: `₹ ${(s.upiCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            cardSwipes: `₹ ${(s.cardCollected || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            openingDrawerBalance: "₹ 2,000.00",
            closingDrawerCash: `₹ ${(cashVal + 2000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            rawTotal: s.totalCollected || 0
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchShiftReport();
  }, []);

  const handleCloseShift = () => {
    setIsClosingShift(true);
    fetch(`${API_BASE_URL}/api/staff/close-shift`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shiftId: `SFT-${Date.now().toString().slice(-4)}`,
        staffName: shiftInfo.operator,
        totalCollected: shiftInfo.rawTotal,
        notes: "Shift handover completed and reconciliation recorded"
      })
    })
      .then(() => {
        setIsClosingShift(false);
        setClosureSuccess(true);
        setTimeout(() => setClosureSuccess(false), 5000);
      })
      .catch(() => {
        setIsClosingShift(false);
      });
  };

  const shiftData = shiftInfo;

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Shift Revenue Total</span>
          <span className="pw-metric-value">{shiftData.totalRevenue}</span>
          <span className="pw-metric-trend positive">
            <span>Settled across all modes</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Cash in Drawer</span>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{shiftData.closingDrawerCash}</span>
          <span className="pw-metric-trend positive">
            <span>₹14,250 net + ₹2k float</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Digital / Fastag UPI</span>
          <span className="pw-metric-value" style={{ color: "#0284c7" }}>{shiftData.upiFastag}</span>
          <span className="pw-metric-trend positive">
            <span>Direct Bank Settlement</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Gate Vehicle Traffic</span>
          <span className="pw-metric-value">{shiftData.totalEntries + shiftData.totalExits}</span>
          <span className="pw-metric-trend positive">
            <span>{shiftData.totalEntries} in / {shiftData.totalExits} out</span>
          </span>
        </div>
      </div>

      {closureSuccess && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>Shift reconciliation slip generated and cash drawer handover recorded successfully!</span>
        </div>
      )}

      <div className="pw-shift-two-col-grid">
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Active Duty Shift Information</h4>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "999px", background: "var(--bg-teal-sub, #f0fdf4)", color: "#16a34a", border: "1px solid var(--border-color, #bbf7d0)" }}>
              ON DUTY ACTIVE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.82rem" }}>
            <div className="pw-shift-info-row">
              <span>Staff Operator:</span>
              <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{shiftData.operator} ({shiftData.staffId})</span>
            </div>
            <div className="pw-shift-info-row">
              <span>Terminal Gate:</span>
              <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{shiftData.terminal}</span>
            </div>
            <div className="pw-shift-info-row">
              <span>Shift Date & Slot:</span>
              <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{shiftData.shiftDate} ({shiftData.shiftTime})</span>
            </div>
            <div className="pw-shift-info-row">
              <span>Opening Float Balance:</span>
              <span style={{ fontWeight: 700, color: "#0f766e" }}>{shiftData.openingDrawerBalance}</span>
            </div>
            <div className="pw-shift-info-row" style={{ borderTop: "1px solid var(--border-color, #f1f5f9)", paddingTop: "10px" }}>
              <span>Total Inbound Entries Processed:</span>
              <span style={{ fontWeight: 800, color: "#16a34a" }}>{shiftData.totalEntries} Vehicles</span>
            </div>
            <div className="pw-shift-info-row">
              <span>Total Outbound Exits Cleared:</span>
              <span style={{ fontWeight: 800, color: "#dc2626" }}>{shiftData.totalExits} Vehicles</span>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 16px 0" }}>Payment Channels Reconciliation</h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Smartphone size={16} style={{ color: "#0284c7" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Fastag & UPI Digital</span>
                </div>
                <span style={{ fontWeight: 900, color: "#0284c7", fontSize: "0.95rem" }}>{shiftData.upiFastag}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={16} style={{ color: "#7c3aed" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Credit / Debit Cards</span>
                </div>
                <span style={{ fontWeight: 900, color: "#7c3aed", fontSize: "0.95rem" }}>{shiftData.cardSwipes}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={16} style={{ color: "#0d9488" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Cash Counter Collected</span>
                </div>
                <span style={{ fontWeight: 900, color: "#0d9488", fontSize: "0.95rem" }}>{shiftData.cashCollected}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="pw-calc-btn-reset"
              onClick={() => window.print()}
              style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Printer size={14} />
              <span>Print Slip</span>
            </button>

            <button
              type="button"
              className="pw-calc-btn-submit"
              onClick={handleCloseShift}
              disabled={isClosingShift}
              style={{ flex: 1.5, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <CheckCircle2 size={14} />
              <span>{isClosingShift ? "Closing..." : "Close Shift Handover"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

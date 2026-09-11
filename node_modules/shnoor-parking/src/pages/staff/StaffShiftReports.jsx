import { useState } from "react";
import { Printer, CheckCircle2, CreditCard, Smartphone, Layers } from "lucide-react";

export default function StaffShiftReports() {
  const [isClosingShift, setIsClosingShift] = useState(false);
  const [closureSuccess, setClosureSuccess] = useState(false);

  const shiftData = {
    operator: "Laiba Taj",
    staffId: "STF-204",
    terminal: "Terminal #01 (North Gate Entrance/Exit)",
    shiftDate: "Tuesday, 2 Sep 2025",
    shiftTime: "08:00 AM - 04:00 PM (Morning Duty)",
    totalEntries: 42,
    totalExits: 28,
    totalRevenue: "₹ 84,000.00",
    cashCollected: "₹ 14,250.00",
    upiFastag: "₹ 48,600.00",
    cardSwipes: "₹ 21,150.00",
    openingDrawerBalance: "₹ 2,000.00",
    closingDrawerCash: "₹ 16,250.00"
  };

  const handleCloseShift = () => {
    setIsClosingShift(true);
    setTimeout(() => {
      setIsClosingShift(false);
      setClosureSuccess(true);
      setTimeout(() => setClosureSuccess(false), 5000);
    }, 1200);
  };

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
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>Shift reconciliation slip generated and cash drawer handover recorded successfully!</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Active Duty Shift Information</h4>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "999px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              ON DUTY ACTIVE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Staff Operator:</span>
              <span style={{ fontWeight: 800, color: "#0f172a" }}>{shiftData.operator} ({shiftData.staffId})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Terminal Gate:</span>
              <span style={{ fontWeight: 700, color: "#1e293b" }}>{shiftData.terminal}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Shift Date & Slot:</span>
              <span style={{ fontWeight: 700, color: "#1e293b" }}>{shiftData.shiftDate} ({shiftData.shiftTime})</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Opening Float Balance:</span>
              <span style={{ fontWeight: 700, color: "#0f766e" }}>{shiftData.openingDrawerBalance}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
              <span style={{ color: "#64748b" }}>Total Inbound Entries Processed:</span>
              <span style={{ fontWeight: 800, color: "#16a34a" }}>{shiftData.totalEntries} Vehicles</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Total Outbound Exits Cleared:</span>
              <span style={{ fontWeight: 800, color: "#dc2626" }}>{shiftData.totalExits} Vehicles</span>
            </div>
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0" }}>Payment Channels Reconciliation</h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Smartphone size={16} style={{ color: "#0284c7" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Fastag & UPI Digital</span>
                </div>
                <span style={{ fontWeight: 900, color: "#0284c7", fontSize: "0.95rem" }}>{shiftData.upiFastag}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CreditCard size={16} style={{ color: "#7c3aed" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Credit / Debit Cards</span>
                </div>
                <span style={{ fontWeight: 900, color: "#7c3aed", fontSize: "0.95rem" }}>{shiftData.cardSwipes}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Layers size={16} style={{ color: "#0d9488" }} />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>Cash Counter Collected</span>
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

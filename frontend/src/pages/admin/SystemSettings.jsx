import { useState } from "react";
import { Settings, Save, Sliders, HardDrive, Cpu, Receipt, CheckCircle2, Database } from "lucide-react";

export default function SystemSettings() {
  const [settings, setSettings] = useState({
    facilityName: "Shnoor Smart Parking Central",
    supportEmail: "support@shnoorparking.com",
    supportPhone: "+91 80 2345 6789",
    gracePeriodMins: 15,
    maxDailyCap: 500,
    reservationHoldMins: 30,
    gstRatePct: 18,
    gstinNumber: "29AABCS1429B1Z8",
    fastagRfidEnabled: true,
    anprCameraEnabled: true,
    overstayAlertSms: true,
    emailReceiptsAuto: true,
    maintenanceMode: false,
    auditRetentionDays: 90
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  const handleTriggerBackup = () => {
    setIsBackingUp(true);
    setBackupMsg("Initiating automated database snapshot...");
    setTimeout(() => {
      setIsBackingUp(false);
      setBackupMsg("Database backup completed successfully (pg_dump_parking_db_2026.sql)");
      setTimeout(() => setBackupMsg(""), 4000);
    }, 1500);
  };

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Settings size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>System Configuration & Operations</h3>
            <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Manage parking tariffs, IoT barrier controls, taxes, and system policies</span>
          </div>
        </div>

        <button
          type="button"
          className="pw-calc-btn-submit"
          onClick={handleSave}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 20px", fontSize: "0.84rem" }}
        >
          <Save size={15} />
          <span>Save All Settings</span>
        </button>
      </div>

      {isSaved && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>System configuration updated and broadcasted to all gate terminals successfully.</span>
        </div>
      )}

      {backupMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdfa)", border: "1px solid #ccfbf1", color: "#0f766e", padding: "12px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 }}>
          <Database size={18} />
          <span>{backupMsg}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <Sliders size={18} style={{ color: "#0f766e" }} />
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Operational Parameters</h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Facility Display Name</label>
              <input
                type="text"
                className="pw-calc-input"
                value={settings.facilityName}
                onChange={(e) => setSettings({ ...settings, facilityName: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Grace Period (Minutes)</label>
                <input
                  type="number"
                  className="pw-calc-input"
                  value={settings.gracePeriodMins}
                  onChange={(e) => setSettings({ ...settings, gracePeriodMins: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Max Daily Cap (₹)</label>
                <input
                  type="number"
                  className="pw-calc-input"
                  value={settings.maxDailyCap}
                  onChange={(e) => setSettings({ ...settings, maxDailyCap: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Advance Booking Hold Duration (Minutes)</label>
              <input
                type="number"
                className="pw-calc-input"
                value={settings.reservationHoldMins}
                onChange={(e) => setSettings({ ...settings, reservationHoldMins: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <Receipt size={18} style={{ color: "#0f766e" }} />
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Tax & Billing Compliance</h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Standard GST Rate (%)</label>
                <input
                  type="number"
                  className="pw-calc-input"
                  value={settings.gstRatePct}
                  onChange={(e) => setSettings({ ...settings, gstRatePct: parseInt(e.target.value, 10) || 0 })}
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">SAC Classification Code</label>
                <input
                  type="text"
                  className="pw-calc-input"
                  value="996729"
                  disabled
                />
              </div>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">GSTIN / Tax ID Number</label>
              <input
                type="text"
                className="pw-calc-input"
                value={settings.gstinNumber}
                onChange={(e) => setSettings({ ...settings, gstinNumber: e.target.value })}
              />
            </div>

            <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.78rem", color: "#64748b" }}>
              Tax invoices are generated automatically with QR-code verification on all customer payments.
            </div>
          </div>
        </div>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <Cpu size={18} style={{ color: "#0f766e" }} />
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Hardware & IoT Gate Barriers</h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", cursor: "pointer", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <div>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>Fastag RFID Express Automated Gate</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Instant barrier lift on registered VIP vehicle detection</div>
              </div>
              <input
                type="checkbox"
                checked={settings.fastagRfidEnabled}
                onChange={(e) => setSettings({ ...settings, fastagRfidEnabled: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "#0f766e" }}
              />
            </label>

            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", cursor: "pointer", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <div>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>ANPR License Plate OCR Recognition</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Automatic vehicle plate detection at entry kiosk camera</div>
              </div>
              <input
                type="checkbox"
                checked={settings.anprCameraEnabled}
                onChange={(e) => setSettings({ ...settings, anprCameraEnabled: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "#0f766e" }}
              />
            </label>
          </div>
        </div>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <HardDrive size={18} style={{ color: "#0f766e" }} />
            <h4 style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>System Maintenance & Database</h4>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
              <div>
                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>PostgreSQL Database Backup</div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Last snapshot: Today 04:00 AM (Automated)</div>
              </div>
              <button
                type="button"
                className="pw-calc-btn-submit"
                onClick={handleTriggerBackup}
                disabled={isBackingUp}
                style={{ padding: "6px 14px", fontSize: "0.78rem" }}
              >
                {isBackingUp ? "Backing up..." : "Backup Now"}
              </button>
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Audit Log Retention (Days)</label>
              <input
                type="number"
                className="pw-calc-input"
                value={settings.auditRetentionDays}
                onChange={(e) => setSettings({ ...settings, auditRetentionDays: parseInt(e.target.value, 10) || 90 })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

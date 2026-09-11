import { useState } from "react";
import { ShieldAlert, PhoneCall, CheckCircle2, Lock, Unlock, Plus, X } from "lucide-react";

export default function StaffSupport() {
  const [barrierState, setBarrierState] = useState({
    gate1: "Normal Automated",
    gate2: "Normal Automated",
    gate3: "Normal Automated"
  });
  const [actionAlert, setActionAlert] = useState("");
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);

  const [incidents, setIncidents] = useState([
    {
      id: "INC-302",
      type: "Scanner Misread",
      location: "Gate #01 (North Entry)",
      plate: "KA05 XY 9911",
      reportedAt: "Today, 09:40 AM",
      status: "Resolved",
      severity: "Low"
    },
    {
      id: "INC-301",
      type: "Unauthorized Overstay",
      location: "Bay B-04",
      plate: "KA04 GH 3456",
      reportedAt: "Today, 08:15 AM",
      status: "Warden Dispatched",
      severity: "Medium"
    }
  ]);

  const [incidentForm, setIncidentForm] = useState({
    type: "Scanner Misread",
    location: "Gate #01 (North Entry)",
    plate: "",
    notes: "",
    severity: "Medium"
  });

  const handleToggleBarrier = (gateKey, gateName) => {
    const current = barrierState[gateKey];
    const newState = current === "Normal Automated" ? "EMERGENCY MANUAL LIFT (OPEN)" : "Normal Automated";
    setBarrierState({ ...barrierState, [gateKey]: newState });
    setActionAlert(`${gateName} status changed to ${newState}`);
    setTimeout(() => setActionAlert(""), 4000);
  };

  const handleReportIncident = (e) => {
    e.preventDefault();
    const newInc = {
      id: `INC-${Math.floor(303 + Math.random() * 50)}`,
      type: incidentForm.type,
      location: incidentForm.location,
      plate: incidentForm.plate || "N/A",
      reportedAt: "Just Now",
      status: "Logged & Transmitted",
      severity: incidentForm.severity
    };
    setIncidents([newInc, ...incidents]);
    setIsIncidentModalOpen(false);
    setActionAlert("Incident ticket submitted to Central Control Room.");
    setTimeout(() => setActionAlert(""), 4000);
  };

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Emergency Gate Barriers</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>3 Active</span>
          <span className="pw-metric-trend positive">
            <span>All Gates Connected</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Incident Reports Today</span>
          <span className="pw-metric-value">{incidents.length}</span>
          <span className="pw-metric-trend positive">
            <span>Tracked</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Control Room Comms</span>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>ONLINE</span>
          <span className="pw-metric-trend positive">
            <span>Direct Radio Channel</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Support Helpline</span>
          <span className="pw-metric-value">Ext. 101</span>
          <span className="pw-metric-trend positive">
            <span>24/7 Rapid Response</span>
          </span>
        </div>
      </div>

      {actionAlert && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 700 }}>
          <CheckCircle2 size={18} />
          <span>{actionAlert}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldAlert size={18} style={{ color: "#dc2626" }} />
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Emergency Manual Barrier Controls</h4>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700 }}>AUTHORIZED OPERATOR ONLY</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { key: "gate1", label: "Gate #01 (North Inbound Entrance)", tag: "Inbound" },
              { key: "gate2", label: "Gate #02 (South Outbound Exit)", tag: "Outbound" },
              { key: "gate3", label: "Gate #03 (EV VIP Express Lane)", tag: "Express" }
            ].map((g) => {
              const isOpen = barrierState[g.key].includes("LIFT");
              return (
                <div
                  key={g.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: isOpen ? "#fef2f2" : "#f8fafc",
                    border: isOpen ? "1.5px solid #fecaca" : "1px solid #e2e8f0",
                    borderRadius: "10px"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 800, color: isOpen ? "#dc2626" : "#0f172a" }}>
                      {g.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: isOpen ? "#b91c1c" : "#64748b", fontWeight: 700, marginTop: "2px" }}>
                      Status: {barrierState[g.key]}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleBarrier(g.key, g.label)}
                    style={{
                      background: isOpen ? "#dc2626" : "#0f766e",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    {isOpen ? <Lock size={14} /> : <Unlock size={14} />}
                    <span>{isOpen ? "Restore Auto" : "Manual Lift"}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
              <PhoneCall size={18} style={{ color: "#0d9488" }} />
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Emergency Contacts & Intercom</h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>Facility Security Control Room</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>Ext. 101 / +91 80 2345 6701</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>Hardware & Gate IT Engineer</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>Ext. 104 / +91 80 2345 6704</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>Shift Duty Manager (On Site)</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>+91 98765 11223</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>Emergency Police / Medical</span>
                <span style={{ fontWeight: 800, color: "#dc2626" }}>112</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="pw-calc-btn-submit"
            onClick={() => setIsIncidentModalOpen(true)}
            style={{ width: "100%", marginTop: "16px", padding: "10px", fontSize: "0.85rem", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
          >
            <Plus size={15} />
            <span>Log New Gate Incident / Issue</span>
          </button>
        </div>
      </div>

      <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
        <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "#0f172a", margin: "0 0 14px 0" }}>Logged Gate Incidents & Operational Tickets</h4>
        <div style={{ overflowX: "auto" }}>
          <table className="pw-records-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Type / Issue</th>
                <th>Location / Gate</th>
                <th>Vehicle Plate</th>
                <th>Reported Time</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td style={{ fontWeight: 800, color: "#0d9488" }}>{inc.id}</td>
                  <td style={{ fontWeight: 700, color: "#0f172a" }}>{inc.type}</td>
                  <td style={{ color: "#475569" }}>{inc.location}</td>
                  <td style={{ fontWeight: 700, color: "#1e293b" }}>{inc.plate}</td>
                  <td style={{ fontSize: "0.78rem", color: "#64748b" }}>{inc.reportedAt}</td>
                  <td>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: inc.severity === "High" ? "#fef2f2" : "#fffbeb", color: inc.severity === "High" ? "#dc2626" : "#b45309" }}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: "#f0fdf4", color: "#16a34a" }}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isIncidentModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>Report Gate Incident</h3>
              <button
                type="button"
                onClick={() => setIsIncidentModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleReportIncident} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Incident Type</label>
                <select
                  className="pw-calc-input"
                  value={incidentForm.type}
                  onChange={(e) => setIncidentForm({ ...incidentForm, type: e.target.value })}
                >
                  <option value="Scanner Misread">Scanner / Fastag Misread</option>
                  <option value="Unauthorized Overstay">Unauthorized Overstay</option>
                  <option value="Barrier Obstruction">Physical Barrier Obstruction</option>
                  <option value="Vehicle Scratch / Damage">Vehicle Scratch / Damage</option>
                  <option value="Payment Discrepancy">Counter Payment Discrepancy</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Location / Gate</label>
                  <input
                    type="text"
                    className="pw-calc-input"
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  />
                </div>

                <div className="pw-calc-field-group">
                  <label className="pw-calc-label">Vehicle Plate</label>
                  <input
                    type="text"
                    className="pw-calc-input"
                    placeholder="e.g. KA01 AB 1234"
                    value={incidentForm.plate}
                    onChange={(e) => setIncidentForm({ ...incidentForm, plate: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Incident Notes & Details</label>
                <textarea
                  className="pw-calc-input"
                  rows="3"
                  placeholder="Describe the incident details..."
                  value={incidentForm.notes}
                  onChange={(e) => setIncidentForm({ ...incidentForm, notes: e.target.value })}
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="pw-calc-btn-reset"
                  onClick={() => setIsIncidentModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pw-calc-btn-submit"
                >
                  Submit Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

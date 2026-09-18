import { useState } from "react";
import { User, Car, Bike, Zap, Crown, Plus, Trash2, CheckCircle2, X, Sparkles, ArrowRight } from "lucide-react";

export default function CustomerProfile({ currentUser, isPremiumActive, premiumPlanInfo, onNavigateToPlans }) {
  const [profile, setProfile] = useState({
    name: currentUser?.name || "Laiba Customer",
    email: currentUser?.email || "customer@shnoor.com",
    phone: "+91 98765 43210",
    fastagId: "NETC-FTG-8821940",
    notifications: {
      smsEntryExit: true,
      emailInvoices: true,
      overstayAlerts: true
    }
  });

  const [savedVehicles, setSavedVehicles] = useState([
    { id: 1, plate: "KA01 AB 1234", model: "Hyundai Creta", type: "Car", fastagLinked: true, isDefault: true },
    { id: 2, plate: "KA05 EV 8899", model: "Tata Nexon EV", type: "EV", fastagLinked: true, isDefault: false }
  ]);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    plate: "",
    model: "",
    type: "Car",
    fastagLinked: true
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!newVehicle.plate) return;
    const vehicleObj = {
      id: Date.now(),
      plate: newVehicle.plate.toUpperCase(),
      model: newVehicle.model || "Standard Model",
      type: newVehicle.type,
      fastagLinked: newVehicle.fastagLinked,
      isDefault: savedVehicles.length === 0
    };
    setSavedVehicles([...savedVehicles, vehicleObj]);
    setIsAddVehicleOpen(false);
    setNewVehicle({ plate: "", model: "", type: "Car", fastagLinked: true });
    setSaveSuccessMsg("Vehicle successfully added to your garage.");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const handleDeleteVehicle = (id) => {
    setSavedVehicles(savedVehicles.filter((v) => v.id !== id));
  };

  const handleSetDefaultVehicle = (id) => {
    setSavedVehicles(savedVehicles.map((v) => ({ ...v, isDefault: v.id === id })));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSaveSuccessMsg("Profile information updated successfully.");
    setTimeout(() => setSaveSuccessMsg(""), 3500);
  };

  const getVehicleIcon = (type) => {
    const t = (type || "").toLowerCase();
    if (t === "bike") return <Bike size={18} style={{ color: "#0d9488" }} />;
    if (t === "ev") return <Zap size={18} style={{ color: "#0284c7" }} />;
    return <Car size={18} style={{ color: "#0d9488" }} />;
  };

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      {isPremiumActive ? (
        <div style={{ background: isPremiumActive ? "linear-gradient(135deg, #1c1809 0%, #2a200a 100%)" : "var(--bg-teal-sub, #f0fdfa)", border: "1.5px solid #EAB308", borderRadius: "14px", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(154, 107, 24, 0.3)" }}>
              <Crown size={26} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-gold, #facc15)", margin: 0 }}>Active Gold VIP Membership</h3>
                <span style={{ background: "#713F12", color: "#FEF08A", fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px" }}>
                  EXCLUSIVE
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-gold, #fde047)", margin: "2px 0 0 0", fontWeight: 600 }}>
                {premiumPlanInfo?.planName || "Monthly VIP Priority Pass"} • Valid until {premiumPlanInfo?.validUntil || "02 Oct 2025"} (30 Days Unlimited Access)
              </p>
            </div>
          </div>

          <span style={{ fontSize: "0.82rem", fontWeight: 800, background: "#713F12", color: "#FEF08A", padding: "6px 16px", borderRadius: "999px" }}>
            👑 VIP VERIFIED
          </span>
        </div>
      ) : (
        <div style={{ background: "var(--bg-teal-sub, #f0fdfa)", border: "1.5px solid #ccfbf1", borderRadius: "14px", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#0d9488", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Unlock Gold VIP Priority Membership</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", margin: "2px 0 0 0" }}>
                Get 100% guaranteed reserved bay parking, hands-free Fastag RFID boom barrier entry, and free monthly car wash.
              </p>
            </div>
          </div>

          {onNavigateToPlans && (
            <button
              type="button"
              className="pw-calc-btn-submit"
              onClick={onNavigateToPlans}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "0.84rem" }}
            >
              <span>Explore VIP Plans</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      )}

      {saveSuccessMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="pw-profile-two-col-grid">
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
            <User size={18} style={{ color: isPremiumActive ? "#9A6B18" : "#0d9488" }} />
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Account Information</h4>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Full Name</label>
              <input
                type="text"
                className="pw-calc-input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Email Address</label>
              <input
                type="email"
                className="pw-calc-input disabled-input"
                value={profile.email}
                disabled
              />
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Phone Number</label>
              <input
                type="text"
                className="pw-calc-input"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className="pw-calc-field-group">
              <label className="pw-calc-label">Fastag RFID Tag Number</label>
              <input
                type="text"
                className="pw-calc-input"
                value={profile.fastagId}
                onChange={(e) => setProfile({ ...profile, fastagId: e.target.value })}
              />
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginTop: "4px" }}>
              <label className="pw-calc-label" style={{ marginBottom: "10px", display: "block" }}>Notification Alerts</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "var(--text-secondary, #cbd5e1)" }}>
                  <span>SMS alerts upon gate check-in & exit</span>
                  <input
                    type="checkbox"
                    checked={profile.notifications.smsEntryExit}
                    onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, smsEntryExit: e.target.checked } })}
                    style={{ accentColor: isPremiumActive ? "#C99A2E" : "#0d9488" }}
                  />
                </label>
                <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", color: "var(--text-secondary, #cbd5e1)" }}>
                  <span>Email verified tax receipts & invoices</span>
                  <input
                    type="checkbox"
                    checked={profile.notifications.emailInvoices}
                    onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, emailInvoices: e.target.checked } })}
                    style={{ accentColor: isPremiumActive ? "#C99A2E" : "#0d9488" }}
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={`pw-calc-btn-submit ${isPremiumActive ? "pw-btn-gold" : ""}`}
              style={{ marginTop: "10px", padding: "10px", fontSize: "0.86rem", fontWeight: 800 }}
            >
              Save Profile Changes
            </button>
          </form>
        </div>

        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Car size={18} style={{ color: isPremiumActive ? "#9A6B18" : "#0d9488" }} />
                <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Saved Vehicle Garage</h4>
              </div>

              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                style={{ background: isPremiumActive ? "var(--bg-sub, #FDF0CD)" : "var(--bg-teal-sub, #f0fdfa)", border: isPremiumActive ? "1px solid #C99A2E" : "1px solid #ccfbf1", color: isPremiumActive ? "#713F12" : "#0d9488", padding: "6px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={14} />
                <span>Add Vehicle</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedVehicles.map((veh) => (
                <div
                  key={veh.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: veh.isDefault ? (isPremiumActive ? "#FFFDF5" : "#f0fdfa") : "#f8fafc",
                    border: veh.isDefault ? (isPremiumActive ? "1.5px solid #EAB308" : "1.5px solid #ccfbf1") : "1px solid #e2e8f0",
                    borderRadius: "10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: isPremiumActive ? "var(--bg-sub, #FDF0CD)" : "var(--bg-teal-sub, #f0fdfa)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {getVehicleIcon(veh.type)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-primary, #0f172a)" }}>{veh.plate}</span>
                        {veh.isDefault && (
                          <span style={{ fontSize: "0.68rem", fontWeight: 800, background: isPremiumActive ? "#713F12" : "#0d9488", color: "#ffffff", padding: "2px 6px", borderRadius: "4px" }}>
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)", marginTop: "2px" }}>
                        {veh.model} • {veh.type} {veh.fastagLinked && "• Fastag RFID Active"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {!veh.isDefault && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultVehicle(veh.id)}
                        style={{ background: "transparent", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "6px", padding: "4px 8px", fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", cursor: "pointer", fontWeight: 600 }}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteVehicle(veh.id)}
                      style={{ background: "var(--bg-sub, #fef2f2)", border: "1px solid var(--border-color, #fecaca)", borderRadius: "6px", padding: "6px", color: "#ef4444", cursor: "pointer" }}
                      title="Remove vehicle"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>
            Registered vehicles are recognized instantly at entrance cameras and automated Fastag RFID boom gates.
          </div>
        </div>
      </div>

      {isAddVehicleOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "420px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Add Vehicle to Garage</h3>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddVehicle} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">License Plate Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA01 AB 1234"
                  className="pw-calc-input"
                  value={newVehicle.plate}
                  onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Vehicle Model & Make</label>
                <input
                  type="text"
                  placeholder="e.g. Hyundai Creta / Honda City"
                  className="pw-calc-input"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Vehicle Type</label>
                <select
                  className="pw-calc-input"
                  value={newVehicle.type}
                  onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                >
                  <option value="Car">Car (Sedan / Hatchback)</option>
                  <option value="SUV">SUV / Large Vehicle</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="Bike">Two-Wheeler (Motorcycle / Scooter)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="pw-calc-btn-reset"
                  onClick={() => setIsAddVehicleOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`pw-calc-btn-submit ${isPremiumActive ? "pw-btn-gold" : ""}`}
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

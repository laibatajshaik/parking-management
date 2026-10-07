import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import { Car, Clock, ShieldCheck, RefreshCw, Compass, BookmarkCheck, Zap } from "lucide-react";

export default function MyParking({ loggedInUser, onNavigate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [activeEvSession, setActiveEvSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyParking = async () => {
    setIsLoading(true);
    try {
      let user = loggedInUser;
      if (!user) {
        try {
          const saved = localStorage.getItem("shnoor_current_user");
          user = saved ? JSON.parse(saved) : null;
        } catch {
          user = null;
        }
      }
      if (!user || (!user.email && !user.name)) {
        setIsLoading(false);
        setActiveSession(null);
        setActiveSessions([]);
        setActiveEvSession(null);
        return;
      }
      const queryParam = user.email ? `email=${encodeURIComponent(user.email)}` : `name=${encodeURIComponent(user.name)}`;
      const res = await fetch(`${API_BASE_URL}/api/customer/my-parking?${queryParam}`);
      const data = await res.json();

      if (user.email) {
        try {
          const evRes = await fetch(`${API_BASE_URL}/api/customer/charging/active?email=${encodeURIComponent(user.email)}`);
          const evData = await evRes.json();
          if (evData.success && evData.session) {
            setActiveEvSession(evData.session);
          } else {
            setActiveEvSession(null);
          }
        } catch {
          setActiveEvSession(null);
        }
      }

      setIsLoading(false);
      if (data.success && (data.session || (Array.isArray(data.sessions) && data.sessions.length > 0))) {
        const sessList = Array.isArray(data.sessions) && data.sessions.length > 0
          ? data.sessions
          : (data.session ? [data.session] : []);
        setActiveSessions(sessList);
        setActiveSession(sessList[0] || null);
      } else {
        setActiveSession(null);
        setActiveSessions([]);
      }
    } catch {
      setIsLoading(false);
      setActiveSession(null);
      setActiveSessions([]);
    }
  };

  useEffect(() => {
    fetchMyParking();
    const interval = setInterval(fetchMyParking, 20000);
    return () => clearInterval(interval);
  }, [loggedInUser]);

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
    try {
      const str = String(isoStr).trim();
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

  return (
    <div className="pw-customer-my-parking-module">
      <div className="pw-section-header-row">
        <div>
          <h3 className="pw-section-title">My Active Parking Session</h3>
          <p className="pw-section-sub">Real-time tracking of your parked vehicle and accumulated parking charges</p>
        </div>
        <button
          type="button"
          className="pw-btn-action-refresh"
          onClick={fetchMyParking}
          title="Refresh parking status"
        >
          <RefreshCw size={14} className={isLoading ? "pw-spin" : ""} />
          <span>Refresh Status</span>
        </button>
      </div>

      {activeEvSession && (
        <div className="pw-customer-parking-grid" style={{ marginTop: "20px" }}>
          <div className="pw-active-parking-hero-card" style={{ border: "1.5px solid #10b981", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(6, 78, 59, 0.02) 100%)" }}>
            <div className="pw-hero-card-top">
              <div className="pw-hero-plate-badge" style={{ borderColor: "#10b981", background: "rgba(16, 185, 129, 0.12)" }}>
                <Zap size={20} style={{ color: "#10b981" }} />
                <span className="pw-plate-hero-text">{activeEvSession.vehicle_number}</span>
              </div>
              <span className="pw-veh-status-pill parked" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669", borderColor: "rgba(16, 185, 129, 0.3)" }}>
                <span className="pw-status-dot" style={{ background: "#10b981" }}></span>
                <span>Active EV Supercharging</span>
              </span>
            </div>

            <div className="pw-hero-details-grid">
              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Assigned EV Bay</span>
                <span className="pw-hero-item-val" style={{ color: "#059669", fontWeight: 800 }}>
                  Bay {activeEvSession.slot_number} ({activeEvSession.charger_type || "DC Fast"} • {activeEvSession.charging_power || "60 kW"})
                </span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Connector Port</span>
                <span className="pw-hero-item-val">{activeEvSession.connector_type || "CCS2"}</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Start Timestamp</span>
                <span className="pw-hero-item-val">{formatDate(activeEvSession.start_time)}</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Charging Tariff</span>
                <span className="pw-hero-item-val">₹{activeEvSession.charging_rate || 18}.00 / kWh</span>
              </div>
            </div>

            <div className="pw-hero-duration-banner" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}>
              <div className="pw-duration-counter-box">
                <div className="pw-counter-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span className="pw-counter-label">Elapsed Session Time</span>
                  <div className="pw-counter-value">{activeEvSession.liveDuration || activeEvSession.duration || "Active"}</div>
                </div>
              </div>

              <div className="pw-duration-counter-box">
                <div className="pw-counter-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#059669" }}>
                  <Zap size={22} />
                </div>
                <div>
                  <span className="pw-counter-label">Energy Delivered</span>
                  <div className="pw-counter-value" style={{ color: "#059669" }}>{activeEvSession.estimatedEnergy || activeEvSession.energy_consumed || 0} kWh</div>
                </div>
              </div>

              <div className="pw-duration-fee-box">
                <span className="pw-counter-label">Current Meter Fee</span>
                <div className="pw-fee-counter-value" style={{ color: "#059669" }}>₹{activeEvSession.estimatedFee || activeEvSession.total_amount || 0}</div>
              </div>
            </div>

            {onNavigate && (
              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="pw-btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#059669", borderColor: "#059669" }}
                  onClick={() => onNavigate("ev-charging")}
                >
                  <Zap size={16} />
                  <span>Manage EV Charging Live</span>
                </button>
              </div>
            )}
          </div>

          <div className="pw-parking-guidance-card">
            <div className="pw-guidance-header">
              <Zap size={18} className="pw-guide-icon" style={{ color: "#10b981" }} />
              <h4>EV Charging Safety & Protocol</h4>
            </div>

            <div className="pw-guidance-steps">
              <div className="pw-guide-step">
                <div className="pw-step-num" style={{ background: "#059669" }}>1</div>
                <div className="pw-step-content">
                  <h5>Bay Connection</h5>
                  <p>Vehicle is actively connected at <strong>Bay {activeEvSession.slot_number}</strong>. Keep cable unobstructed during DC charging.</p>
                </div>
              </div>

              <div className="pw-guide-step">
                <div className="pw-step-num" style={{ background: "#059669" }}>2</div>
                <div className="pw-step-content">
                  <h5>Automatic Auto-Cut</h5>
                  <p>Charger stops automatically upon reaching vehicle target battery limit (80% or 100%) or via manual stop command.</p>
                </div>
              </div>

              <div className="pw-guide-step">
                <div className="pw-step-num" style={{ background: "#059669" }}>3</div>
                <div className="pw-step-content">
                  <h5>Instant Receipt</h5>
                  <p>Upon session completion, your digital energy meter tax invoice will generate immediately in your account.</p>
                </div>
              </div>
            </div>

            <div className="pw-security-badge-box">
              <ShieldCheck size={16} />
              <span>Surge protection, emergency stop interlock & temperature sensors engaged</span>
            </div>
          </div>
        </div>
      )}

      {activeSessions.length > 0 && activeSessions.map((sessionItem, sIdx) => (
        <div key={sessionItem.id || sIdx} className="pw-customer-parking-grid" style={{ marginTop: "20px" }}>
          <div className="pw-active-parking-hero-card">
            <div className="pw-hero-card-top">
              <div className="pw-hero-plate-badge">
                <Car size={20} />
                <span className="pw-plate-hero-text">{sessionItem.vehicle_number}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {activeSessions.length > 1 && (
                  <span style={{ fontSize: "0.74rem", fontWeight: 800, background: "var(--bg-teal-sub, #f0fdfa)", color: "#0d9488", padding: "3px 8px", borderRadius: "6px", border: "1px solid #ccfbf1" }}>
                    Vehicle #{sIdx + 1}
                  </span>
                )}
                <span className="pw-veh-status-pill parked">
                  <span className="pw-status-dot"></span>
                  <span>Currently Parked</span>
                </span>
              </div>
            </div>

            <div className="pw-hero-details-grid">
              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Vehicle Model</span>
                <span className="pw-hero-item-val">{sessionItem.model} ({sessionItem.vehicle_type})</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Assigned Bay</span>
                <span className="pw-hero-item-val" style={{ color: "#0d9488", fontWeight: 800 }}>
                  Bay {sessionItem.current_slot} ({sessionItem.zone})
                </span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Entry Timestamp</span>
                <span className="pw-hero-item-val">{formatDate(sessionItem.entry_time)}</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Hourly Tariff</span>
                <span className="pw-hero-item-val">₹{sessionItem.hourly_rate}.00 / hr</span>
              </div>
            </div>

            <div className="pw-hero-duration-banner">
              <div className="pw-duration-counter-box">
                <div className="pw-counter-icon">
                  <Clock size={22} />
                </div>
                <div>
                  <span className="pw-counter-label">Elapsed Parking Time</span>
                  <div className="pw-counter-value">{sessionItem.duration}</div>
                </div>
              </div>

              <div className="pw-duration-fee-box">
                <span className="pw-counter-label">Current Fee Accumulation</span>
                <div className="pw-fee-counter-value">{sessionItem.calculated_fee}</div>
              </div>
            </div>
          </div>

          <div className="pw-parking-guidance-card">
            <div className="pw-guidance-header">
              <Compass size={18} className="pw-guide-icon" />
              <h4>Parking Facility Guidelines</h4>
            </div>

            <div className="pw-guidance-steps">
              <div className="pw-guide-step">
                <div className="pw-step-num">1</div>
                <div className="pw-step-content">
                  <h5>Locating Your Bay</h5>
                  <p>Your vehicle is parked at <strong>Bay {sessionItem.current_slot}</strong> in <strong>{sessionItem.zone}</strong>. Follow the overhead aisle signs.</p>
                </div>
              </div>

              <div className="pw-guide-step">
                <div className="pw-step-num">2</div>
                <div className="pw-step-content">
                  <h5>Checkout Procedure</h5>
                  <p>When exiting, present your plate number at the automated gate or staff terminal. Payment is accepted via UPI, Card, or Fastag.</p>
                </div>
              </div>

              <div className="pw-guide-step">
                <div className="pw-step-num">3</div>
                <div className="pw-step-content">
                  <h5>Receipts</h5>
                  <p>A digital receipt and tax invoice will automatically appear in your <strong>Payments</strong> tab upon completion.</p>
                </div>
              </div>
            </div>

            <div className="pw-security-badge-box">
              <ShieldCheck size={16} />
              <span>24/7 CCTV surveillance & automated RFID entry monitoring active</span>
            </div>
          </div>
        </div>
      ))}

      {!activeSession && !activeEvSession && (
        <div className="pw-empty-users-card" style={{ marginTop: "24px" }}>
          <div className="pw-empty-state">
            <Car size={36} className="pw-empty-icon" />
            <h4>No Active Parking or EV Session</h4>
            <p>You currently do not have any vehicle checked in at the parking facility or EV charging station.</p>
            {onNavigate && (
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="pw-btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => onNavigate("reserve-parking")}
                >
                  <BookmarkCheck size={15} />
                  <span>Reserve a Parking Spot</span>
                </button>
                <button
                  type="button"
                  className="pw-btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#059669", borderColor: "#059669" }}
                  onClick={() => onNavigate("ev-charging")}
                >
                  <Zap size={15} />
                  <span>Find EV Charging Bay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

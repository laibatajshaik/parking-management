import { useState, useEffect } from "react";
import { Car, Clock, ShieldCheck, RefreshCw, Compass, BookmarkCheck } from "lucide-react";

export default function MyParking({ loggedInUser, onNavigate }) {
  const [activeSession, setActiveSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyParking = async () => {
    setIsLoading(true);
    try {
      const user = loggedInUser || { name: "Laiba", email: "customer@shnoor.com" };
      const queryParam = user.email ? `email=${encodeURIComponent(user.email)}` : `name=${encodeURIComponent(user.name || "Laiba")}`;
      const res = await fetch(`http://localhost:5000/api/customer/my-parking?${queryParam}`);
      const data = await res.json();
      setIsLoading(false);
      if (data.success && data.session) {
        setActiveSession(data.session);
      } else {
        const fallbackRes = await fetch("http://localhost:5000/api/customer/my-parking?name=Laiba");
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success && fallbackData.session) {
          setActiveSession(fallbackData.session);
        } else {
          setActiveSession(null);
        }
      }
    } catch {
      setIsLoading(false);
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
      const d = new Date(isoStr);
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

      {activeSession ? (
        <div className="pw-customer-parking-grid" style={{ marginTop: "20px" }}>
          <div className="pw-active-parking-hero-card">
            <div className="pw-hero-card-top">
              <div className="pw-hero-plate-badge">
                <Car size={20} />
                <span className="pw-plate-hero-text">{activeSession.vehicle_number}</span>
              </div>
              <span className="pw-veh-status-pill parked">
                <span className="pw-status-dot"></span>
                <span>Currently Parked</span>
              </span>
            </div>

            <div className="pw-hero-details-grid">
              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Vehicle Model</span>
                <span className="pw-hero-item-val">{activeSession.model} ({activeSession.vehicle_type})</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Assigned Bay</span>
                <span className="pw-hero-item-val" style={{ color: "#0d9488", fontWeight: 800 }}>
                  Bay {activeSession.current_slot} ({activeSession.zone})
                </span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Entry Timestamp</span>
                <span className="pw-hero-item-val">{formatDate(activeSession.entry_time)}</span>
              </div>

              <div className="pw-hero-detail-item">
                <span className="pw-hero-item-label">Hourly Tariff</span>
                <span className="pw-hero-item-val">₹{activeSession.hourly_rate}.00 / hr</span>
              </div>
            </div>

            <div className="pw-hero-duration-banner">
              <div className="pw-duration-counter-box">
                <div className="pw-counter-icon">
                  <Clock size={22} />
                </div>
                <div>
                  <span className="pw-counter-label">Elapsed Parking Time</span>
                  <div className="pw-counter-value">{activeSession.duration}</div>
                </div>
              </div>

              <div className="pw-duration-fee-box">
                <span className="pw-counter-label">Current Fee Accumulation</span>
                <div className="pw-fee-counter-value">{activeSession.calculated_fee}</div>
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
                  <p>Your vehicle is parked at <strong>Bay {activeSession.current_slot}</strong> in <strong>{activeSession.zone}</strong>. Follow the overhead aisle signs.</p>
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
                  <h5>Digital Receipts</h5>
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
      ) : (
        <div className="pw-empty-users-card" style={{ marginTop: "24px" }}>
          <div className="pw-empty-state">
            <Car size={36} className="pw-empty-icon" />
            <h4>No Active Parking Session</h4>
            <p>You currently do not have any vehicle checked in at the parking facility.</p>
            {onNavigate && (
              <button
                type="button"
                className="pw-btn-primary"
                style={{ marginTop: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={() => onNavigate("reserve-parking")}
              >
                <BookmarkCheck size={15} />
                <span>Reserve a Parking Spot Now</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

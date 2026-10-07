import { useState, useEffect } from "react";
import { BookmarkCheck, Car, Clock, MapPin, ChevronRight, ShieldCheck, CreditCard, Zap, QrCode, Crown, Sparkles, Award, KeyRound, RefreshCw } from "lucide-react";
import DashboardNotifications from "../../components/DashboardNotifications.jsx";
import { API_BASE_URL } from "../../config/api.js";

export default function CustomerOverview({ recentParkings = [], activeSession = null, activeSessions = [], onNavigate, setActiveTab, onViewReceipt, isPremiumActive, premiumPlanInfo, loggedInUser, currentUser, totalVisits, totalSpent, onRefresh, isRefreshing }) {
  const navigateTab = onNavigate || setActiveTab;
  const user = currentUser || loggedInUser;
  const userEmail = user?.email || "";
  const [vehicles, setVehicles] = useState([]);
  const [selectedActiveIdx, setSelectedActiveIdx] = useState(0);

  const allActive = (Array.isArray(activeSessions) && activeSessions.length > 0)
    ? activeSessions
    : (activeSession ? [activeSession] : []);
  const activeCount = allActive.length;
  const currentDisplayedSession = allActive[selectedActiveIdx] || allActive[0] || null;

  useEffect(() => {
    if (!userEmail) return;
    fetch(`${API_BASE_URL}/api/customer/vehicles?email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.vehicles)) {
          setVehicles(d.vehicles);
        }
      })
      .catch(() => {});
  }, [userEmail]);

  const [dates] = useState(() => ({
    todayStr: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    thirtyDaysStr: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  }));

  const formatTime = (isoStr) => {
    if (!isoStr) return "Today";
    try {
      const str = String(isoStr).trim();
      const match = str.match(/[T ](\d{2}):(\d{2})/);
      if (match) {
        const hourNum = parseInt(match[1], 10);
        const ampm = hourNum >= 12 ? "pm" : "am";
        const h12 = hourNum % 12 || 12;
        return `${String(h12).padStart(2, "0")}:${match[2]} ${ampm}`;
      }
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? "Today" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return "Today";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {isPremiumActive && (
        <div className="pw-premium-active-card" style={{ background: "var(--bg-card, #ffffff)", border: "1.5px solid #C99A2E", borderRadius: "14px", padding: "20px", boxShadow: "0 4px 16px rgba(201, 154, 46, 0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "10px", background: "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(201, 154, 46, 0.3)" }}>
                <Crown size={24} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Your Premium Plan is Active</h2>
                  <span style={{ background: "#F5E7C3", color: "#9A6B18", border: "1px solid #C99A2E", fontSize: "0.72rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px" }}>
                    MONTHLY VIP
                  </span>
                </div>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", margin: "3px 0 0 0" }}>Unlimited priority parking, dedicated bays, and express fastag automated entry.</p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="pw-calc-btn-submit pw-btn-gold"
                style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                onClick={() => navigateTab && navigateTab("reserve-parking")}
              >
                <span>Reserve VIP Slot</span>
              </button>
            </div>
          </div>

          <div className="pw-vip-summary-grid" style={{ marginTop: "18px", background: "var(--bg-card, #ffffff)", padding: "14px 16px", borderRadius: "10px", border: "1px solid var(--border-color, #F5E7C3)" }}>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Plan Type</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>Monthly VIP</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Amount Paid</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#9A6B18", marginTop: "2px" }}>₹ 2,500.00</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Valid From</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>{premiumPlanInfo?.validFrom || dates.todayStr}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Valid Until</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>{premiumPlanInfo?.validUntil || dates.thirtyDaysStr}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Remaining</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>{premiumPlanInfo?.remainingDays || 30} Days Left</div>
            </div>
          </div>
        </div>
      )}

      {isPremiumActive && (
        <div className="pw-calc-box-card" style={{ padding: "18px 20px", background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #F5E7C3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Award size={18} style={{ color: "#C99A2E" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Exclusive Premium VIP Benefits</h3>
          </div>

          <div className="pw-vip-benefits-grid">
            <div style={{ background: "var(--bg-sub, #FBF7EE)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #F5E7C3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9A6B18", fontWeight: 700, fontSize: "0.82rem" }}>
                <KeyRound size={15} />
                <span>Priority Access</span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", marginTop: "3px" }}>Instant boom barrier lift via RFID tag</div>
            </div>

            <div style={{ background: "var(--bg-sub, #FBF7EE)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #F5E7C3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9A6B18", fontWeight: 700, fontSize: "0.82rem" }}>
                <ShieldCheck size={15} />
                <span>Dedicated Slot</span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", marginTop: "3px" }}>Guaranteed VIP parking in Zone C</div>
            </div>

            <div style={{ background: "var(--bg-sub, #FBF7EE)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #F5E7C3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9A6B18", fontWeight: 700, fontSize: "0.82rem" }}>
                <Zap size={15} />
                <span>Faster In & Out</span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", marginTop: "3px" }}>Zero waiting & automated monthly billing</div>
            </div>

            <div style={{ background: "var(--bg-sub, #FBF7EE)", padding: "12px 14px", borderRadius: "10px", border: "1px solid var(--border-color, #F5E7C3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#9A6B18", fontWeight: 700, fontSize: "0.82rem" }}>
                <Sparkles size={15} />
                <span>Premium Support</span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", marginTop: "3px" }}>24/7 dedicated concierge assistance</div>
            </div>
          </div>
        </div>
      )}

      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card" onClick={() => navigateTab && navigateTab("my-parking")} style={{ cursor: "pointer" }} title="View active parking passes">
          <span className="pw-metric-label">Active Parking Pass</span>
          <span className="pw-metric-value">
            {activeCount > 0
              ? (isPremiumActive ? `VIP Active (${activeCount})` : `${activeCount} Active`)
              : (isPremiumActive ? "VIP Ready" : "0 Active")}
          </span>
          <span className="pw-metric-trend positive">
            <span>
              {activeCount > 0
                ? (activeCount === 1
                    ? `Bay ${allActive[0].current_slot} (${allActive[0].zone || "Zone A"})`
                    : `Bays: ${allActive.map((s) => s.current_slot).join(", ")}`)
                : "No parked vehicle"}
            </span>
          </span>
        </div>

        <div className="pw-metric-card" onClick={() => navigateTab && navigateTab("profile")} style={{ cursor: "pointer" }} title="Manage registered vehicles">
          <span className="pw-metric-label">Registered Vehicles</span>
          <span className="pw-metric-value">{vehicles.length}</span>
          <span className="pw-metric-trend positive">
            <span>{vehicles.length > 0 ? "Fastag RFID Linked" : "No vehicles registered"}</span>
          </span>
        </div>

        <div className="pw-metric-card" onClick={() => navigateTab && navigateTab("payments")} style={{ cursor: "pointer" }} title="View payment receipts">
          <span className="pw-metric-label">Total Spent</span>
          <span className="pw-metric-value">₹{(totalSpent ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="pw-metric-trend positive">
            <span>All-time expenditure</span>
          </span>
        </div>

        <div className="pw-metric-card" onClick={() => navigateTab && navigateTab("parking-history")} style={{ cursor: "pointer" }} title="View parking history">
          <span className="pw-metric-label">Total Visits</span>
          <span className="pw-metric-value">{totalVisits !== undefined ? totalVisits : recentParkings.length}</span>
          <span className="pw-metric-trend positive">
            <span>{(totalVisits !== undefined ? totalVisits : recentParkings.length) > 0 ? "Lifetime recorded visits" : "No visits recorded"}</span>
          </span>
        </div>
      </div>

      <div className="pw-find-parking-section" style={{ marginTop: "4px" }}>
        <h2 className="pw-section-title" style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "8px" }}>Quick Customer Services</h2>
        <div className="pw-quick-actions-grid">
          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => navigateTab && navigateTab("reserve-parking")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)" }}>
              <BookmarkCheck size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#0d9488" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Reserve Spot</span>
              <span className="pw-action-sub">Book bay in advance</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => navigateTab && navigateTab("my-parking")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdf4)" }}>
              <Car size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#16a34a" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">My Parking</span>
              <span className="pw-action-sub">Live parking meter</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => navigateTab && navigateTab("digital-receipts")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "#F5E7C3" : "#faf5ff" }}>
              <CreditCard size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#9333ea" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Receipts</span>
              <span className="pw-action-sub">Official tax invoices</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => navigateTab && navigateTab("parking-history")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #eff6ff)" }}>
              <Clock size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#2563eb" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Trip History</span>
              <span className="pw-action-sub">All past sessions</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => navigateTab && navigateTab("ev-charging")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "#ecfdf5" }}>
              <Zap size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#059669" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">EV Charging</span>
              <span className="pw-action-sub">Find charger & charge</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pw-customer-overview-twocol">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", color: isPremiumActive ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isPremiumActive ? <Crown size={16} /> : <Car size={16} />}
              </div>
              <h2 className="pw-chart-title">Current Active Parking Pass</h2>
            </div>
            {activeCount > 0 ? (
              <span className="pw-status-pill confirmed">{activeCount} Active Now</span>
            ) : (
              <span className="pw-status-pill" style={{ background: "var(--bg-sub, #f1f5f9)", color: "var(--text-secondary, #64748b)" }}>Inactive</span>
            )}
          </div>

          {currentDisplayedSession ? (
            <div className="pw-upcoming-body">
              {allActive.length > 1 && (
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                  {allActive.map((s, idx) => {
                    const isCur = idx === selectedActiveIdx;
                    return (
                      <button
                        key={s.id || idx}
                        type="button"
                        onClick={() => setSelectedActiveIdx(idx)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          border: isCur
                            ? (isPremiumActive ? "1.5px solid #C99A2E" : "1.5px solid #0d9488")
                            : "1px solid var(--border-color, #e2e8f0)",
                          background: isCur
                            ? (isPremiumActive ? "var(--bg-sub, #FDF0CD)" : "var(--bg-teal-sub, #f0fdfa)")
                            : "var(--bg-card, #ffffff)",
                          color: isCur
                            ? (isPremiumActive ? "#713F12" : "#0f766e")
                            : "var(--text-secondary, #64748b)",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        <Car size={13} />
                        <span>Bay {s.current_slot} ({s.vehicle_number})</span>
                        {isCur && <span style={{ fontSize: "0.68rem", fontWeight: 800 }}>● Active</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="pw-upcoming-location-row" style={{ background: isPremiumActive ? "var(--bg-sub, #FBF7EE)" : "var(--bg-sub, #f8fafc)", padding: "12px", borderRadius: "10px", border: isPremiumActive ? "1px solid #ca8a04" : "1px solid var(--border-color, #e2e8f0)" }}>
                <div className="pw-location-icon-box" style={{ background: isPremiumActive ? "#9A6B18" : "#0d9488", color: "#ffffff" }}>
                  <MapPin size={18} />
                </div>
                <div className="pw-location-meta" style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="pw-location-name">{currentDisplayedSession.zone || "Zone A"} Parking Bay</span>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0d9488", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", padding: "2px 8px", borderRadius: "6px", border: isPremiumActive ? "1px solid #C99A2E" : "1px solid #ccfbf1" }}>Bay {currentDisplayedSession.current_slot}</span>
                  </div>
                  <span className="pw-location-time">{currentDisplayedSession.zone || "Zone A"} • Automated RFID Security Gate</span>
                </div>
              </div>

              <div className="pw-upcoming-two-col">
                <div className="pw-upcoming-vehicle-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                  <span className="pw-veh-label">Parked Vehicle</span>
                  <span className="pw-veh-val" style={{ fontWeight: 700 }}>{currentDisplayedSession.vehicle_number}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>{currentDisplayedSession.model} ({currentDisplayedSession.vehicle_type})</span>
                </div>

                <div className="pw-upcoming-vehicle-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                  <span className="pw-veh-label">Entry Timestamp</span>
                  <span className="pw-veh-val" style={{ fontWeight: 700 }}>{formatTime(currentDisplayedSession.entry_time)}</span>
                  <span style={{ fontSize: "0.72rem", color: isPremiumActive ? "#9A6B18" : "#0d9488", fontWeight: 600 }}>{currentDisplayedSession.duration} elapsed</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: isPremiumActive ? "var(--bg-sub, #FBF7EE)" : "var(--bg-teal-sub, #f0fdfa)", borderRadius: "8px", border: isPremiumActive ? "1px solid #F5E7C3" : "1px solid #ccfbf1" }}>
                <span style={{ fontSize: "0.82rem", color: isPremiumActive ? "#9A6B18" : "#0f766e", fontWeight: 600 }}>
                  {isPremiumActive ? "VIP Pass Status" : "Accumulated Parking Tariff"}
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0f766e" }}>
                  {isPremiumActive ? "Unlimited Included" : `${currentDisplayedSession.calculated_fee} (₹${currentDisplayedSession.hourly_rate}/hr)`}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className={`pw-btn-view-details ${isPremiumActive ? "pw-btn-gold" : ""}`}
                  style={{ flex: 1 }}
                  onClick={() => navigateTab && navigateTab("my-parking")}
                >
                  <QrCode size={15} />
                  <span>View Live Session Pass</span>
                </button>
                <button
                  type="button"
                  className="pw-btn-secondary"
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                  onClick={() => navigateTab && navigateTab("reserve-parking")}
                >
                  <span>Reserve Bay</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="pw-upcoming-body" style={{ textAlign: "center", padding: "36px 20px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "var(--bg-sub, #f8fafc)", color: "var(--text-secondary, #94a3b8)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px auto" }}>
                <Car size={24} />
              </div>
              <h3 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 6px 0" }}>No Active Parking Session</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", margin: "0 0 18px 0" }}>You currently do not have a vehicle parked in our facility.</p>
              <button
                type="button"
                className={`pw-calc-btn-submit ${isPremiumActive ? "pw-btn-gold" : ""}`}
                style={{ padding: "9px 22px", fontSize: "0.84rem", margin: "0 auto", display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
                onClick={() => navigateTab && navigateTab("reserve-parking")}
              >
                <BookmarkCheck size={15} />
                <span>Book Parking Bay</span>
              </button>
            </div>
          )}
        </div>

        <div className="pw-recent-table-card">
          <div className="pw-chart-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", color: isPremiumActive ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} />
              </div>
              <h2 className="pw-table-title">Recent History</h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {onRefresh && (
                <button
                  type="button"
                  className="pw-btn-action-refresh"
                  onClick={onRefresh}
                  title="Refresh Dashboard History"
                >
                  <RefreshCw size={13} className={isRefreshing ? "pw-spin" : ""} />
                </button>
              )}
              <button
                type="button"
                className="pw-view-all-link"
                onClick={() => navigateTab && navigateTab("parking-history")}
              >
                <span>View all</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="pw-user-recent-list">
            {recentParkings && recentParkings.length > 0 ? (
              recentParkings.map((p) => (
                <div key={p.id} className="pw-recent-item-row" style={{ cursor: "pointer" }} onClick={() => onViewReceipt && onViewReceipt({ transaction_id: `TXN-890${p.id}`, vehicle_number: p.plate || "—", slot_number: p.slot, amount: (p.amount || "").replace("₹", ""), duration: p.duration, payment_method: "UPI / Fastag", customer_name: user?.name || "Customer" })}>
                  <div className="pw-recent-item-icon" style={{ color: isPremiumActive ? "#C99A2E" : "#64748b" }}>
                    <Clock size={16} />
                  </div>
                  <div className="pw-recent-item-meta" style={{ flex: 1 }}>
                    <span className="pw-recent-item-title">{p.location}</span>
                    <span className="pw-recent-item-time">{p.date} • {p.duration} • Bay {p.slot}</span>
                  </div>
                  <div className="pw-recent-item-right" style={{ textAlign: "right" }}>
                    <span className="pw-recent-amount" style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{p.amount}</span>
                    <span className="pw-status-pill completed" style={{ fontSize: "0.7rem", padding: "1px 6px", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdf4)", color: isPremiumActive ? "#9A6B18" : "#16a34a", border: isPremiumActive ? "1px solid #C99A2E" : "1px solid #bbf7d0" }}>Paid</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)", fontSize: "0.85rem" }}>
                No past parking sessions recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <DashboardNotifications userEmail={userEmail} />
    </div>
  );
}

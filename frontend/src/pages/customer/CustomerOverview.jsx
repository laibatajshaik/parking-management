import { BookmarkCheck, Car, Clock, MapPin, ChevronRight, ShieldCheck, CreditCard, Zap, QrCode, Crown, Sparkles, Award, KeyRound } from "lucide-react";
import DashboardNotifications from "../../components/DashboardNotifications.jsx";

export default function CustomerOverview({ recentParkings, onNavigate, onViewReceipt, isPremiumActive, premiumPlanInfo, loggedInUser, currentUser }) {
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
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Your Premium Plan is Active</h3>
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
                onClick={() => onNavigate && onNavigate("reserve-parking")}
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
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>{premiumPlanInfo?.validFrom || "02 Sep 2025"}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Valid Until</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>{premiumPlanInfo?.validUntil || "02 Oct 2025"}</div>
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", textTransform: "uppercase", fontWeight: 700 }}>Remaining</span>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>30 Days Left</div>
            </div>
          </div>
        </div>
      )}

      {isPremiumActive && (
        <div className="pw-calc-box-card" style={{ padding: "18px 20px", background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #F5E7C3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            <Award size={18} style={{ color: "#C99A2E" }} />
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Exclusive Premium VIP Benefits</h4>
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
        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Parking Pass</span>
          <span className="pw-metric-value">{isPremiumActive ? "VIP Active" : "1 Active"}</span>
          <span className="pw-metric-trend positive">
            <span>Downtown Plaza (A-04)</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Registered Vehicles</span>
          <span className="pw-metric-value">2</span>
          <span className="pw-metric-trend positive">
            <span>KA01 AB 1234, KA04 GH 3456</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Wallet Balance</span>
          <span className="pw-metric-value">₹850.00</span>
          <span className="pw-metric-trend positive">
            <span>Auto-pay active</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Visits</span>
          <span className="pw-metric-value">18</span>
          <span className="pw-metric-trend positive">
            <span>This month</span>
          </span>
        </div>
      </div>

      <div className="pw-customer-overview-twocol">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", color: isPremiumActive ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {isPremiumActive ? <Crown size={16} /> : <Car size={16} />}
              </div>
              <h3 className="pw-chart-title">Current Active Parking Pass</h3>
            </div>
            <span className="pw-status-pill confirmed">Active Now</span>
          </div>

          <div className="pw-upcoming-body">
            <div className="pw-upcoming-location-row" style={{ background: isPremiumActive ? "var(--bg-sub, #FBF7EE)" : "var(--bg-sub, #f8fafc)", padding: "12px", borderRadius: "10px", border: isPremiumActive ? "1px solid #ca8a04" : "1px solid var(--border-color, #e2e8f0)" }}>
              <div className="pw-location-icon-box" style={{ background: isPremiumActive ? "#9A6B18" : "#0d9488", color: "#ffffff" }}>
                <MapPin size={18} />
              </div>
              <div className="pw-location-meta" style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="pw-location-name">Downtown Plaza Parking Bay</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0d9488", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", padding: "2px 8px", borderRadius: "6px", border: isPremiumActive ? "1px solid #C99A2E" : "1px solid #ccfbf1" }}>Bay A-04</span>
                </div>
                <span className="pw-location-time">Floor 1, Zone A • Security Gate North</span>
              </div>
            </div>

            <div className="pw-upcoming-two-col">
              <div className="pw-upcoming-vehicle-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <span className="pw-veh-label">Parked Vehicle</span>
                <span className="pw-veh-val" style={{ fontWeight: 700 }}>KA01 AB 1234</span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>Hyundai Creta (Car)</span>
              </div>

              <div className="pw-upcoming-vehicle-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
                <span className="pw-veh-label">Entry Timestamp</span>
                <span className="pw-veh-val" style={{ fontWeight: 700 }}>10:30 AM Today</span>
                <span style={{ fontSize: "0.72rem", color: isPremiumActive ? "#9A6B18" : "#0d9488", fontWeight: 600 }}>2 hrs 15 mins elapsed</span>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: isPremiumActive ? "var(--bg-sub, #FBF7EE)" : "var(--bg-teal-sub, #f0fdfa)", borderRadius: "8px", border: isPremiumActive ? "1px solid #F5E7C3" : "1px solid #ccfbf1" }}>
              <span style={{ fontSize: "0.82rem", color: isPremiumActive ? "#9A6B18" : "#0f766e", fontWeight: 600 }}>
                {isPremiumActive ? "VIP Pass Status" : "Accumulated Parking Tariff"}
              </span>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0f766e" }}>
                {isPremiumActive ? "Unlimited Included" : "₹100.00 (₹50/hr)"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className={`pw-btn-view-details ${isPremiumActive ? "pw-btn-gold" : ""}`}
                style={{ flex: 1 }}
                onClick={() => onNavigate && onNavigate("my-parking")}
              >
                <QrCode size={15} />
                <span>View Live Session Pass</span>
              </button>
              <button
                type="button"
                className="pw-btn-secondary"
                style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                onClick={() => onNavigate && onNavigate("reserve-parking")}
              >
                <span>Reserve Bay</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pw-recent-table-card">
          <div className="pw-chart-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)", color: isPremiumActive ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Clock size={16} />
              </div>
              <h3 className="pw-table-title">Recent Parking History</h3>
            </div>
            <button
              type="button"
              className="pw-view-all-link"
              onClick={() => onNavigate && onNavigate("parking-history")}
            >
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="pw-user-recent-list">
            {recentParkings.map((p) => (
              <div key={p.id} className="pw-recent-item-row" style={{ cursor: "pointer" }} onClick={() => onViewReceipt && onViewReceipt({ transaction_id: `TXN-890${p.id}`, vehicle_number: p.plate || "KA01 AB 1234", slot_number: p.slot, amount: p.amount.replace("₹", ""), duration: p.duration, payment_method: "UPI / Fastag", customer_name: loggedInUser?.name || "Customer" })}>
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
            ))}
          </div>
        </div>
      </div>

      <DashboardNotifications userEmail={currentUser?.email || loggedInUser?.email} />

      <div className="pw-find-parking-section" style={{ marginTop: "6px" }}>
        <h3 className="pw-section-title" style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: "8px" }}>Quick Customer Services</h3>
        <div className="pw-quick-actions-grid">
          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate("reserve-parking")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdfa)" }}>
              <BookmarkCheck size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#0d9488" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Reserve Spot</span>
              <span className="pw-action-sub">Book bay in advance</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate("my-parking")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #f0fdf4)" }}>
              <Car size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#16a34a" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">My Parking</span>
              <span className="pw-action-sub">Live parking meter</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate("digital-receipts")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "#F5E7C3" : "#faf5ff" }}>
              <CreditCard size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#9333ea" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Digital Receipts</span>
              <span className="pw-action-sub">Official tax invoices</span>
            </div>
          </div>

          <div className="pw-action-card" style={{ cursor: "pointer" }} onClick={() => onNavigate && onNavigate("parking-history")}>
            <div className="pw-action-icon-circle" style={{ background: isPremiumActive ? "var(--bg-sub, #F5E7C3)" : "var(--bg-teal-sub, #eff6ff)" }}>
              <Clock size={20} style={{ color: isPremiumActive ? "#9A6B18" : "#2563eb" }} />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Trip History</span>
              <span className="pw-action-sub">All past sessions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  Search,
  BookmarkCheck,
  Car,
  Clock,
  MapPin,
  ChevronRight
} from "lucide-react";

export default function CustomerOverview({ recentParkings }) {
  return (
    <>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Parking Pass</span>
          <span className="pw-metric-value">1 Active</span>
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

      <div className="pw-user-two-col">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <h3 className="pw-chart-title">Current Active Reservation</h3>
            <span className="pw-status-pill confirmed">Active Now</span>
          </div>

          <div className="pw-upcoming-body">
            <div className="pw-upcoming-location-row">
              <div className="pw-location-icon-box">
                <MapPin size={18} />
              </div>
              <div className="pw-location-meta">
                <span className="pw-location-name">Downtown Plaza Parking Bay</span>
                <span className="pw-location-time">Floor 1, Zone A - Slot A-04</span>
              </div>
            </div>

            <div className="pw-upcoming-vehicle-row">
              <span className="pw-veh-label">Vehicle:</span>
              <span className="pw-veh-val">KA01 AB 1234 (Hyundai Creta)</span>
            </div>

            <div className="pw-upcoming-vehicle-row">
              <span className="pw-veh-label">Entry Time:</span>
              <span className="pw-veh-val">Today, 10:30 AM (2 hrs elapsed)</span>
            </div>

            <div className="pw-upcoming-vehicle-row">
              <span className="pw-veh-label">Est. Amount:</span>
              <span className="pw-veh-val" style={{ color: "#0d9488" }}>₹100.00 (₹50/hr)</span>
            </div>

            <button type="button" className="pw-btn-view-details">
              View Digital Pass / QR Code
            </button>
          </div>
        </div>

        <div className="pw-recent-table-card">
          <div className="pw-chart-header">
            <h3 className="pw-table-title">Recent Parking History</h3>
            <button type="button" className="pw-view-all-link">
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="pw-user-recent-list">
            {recentParkings.map((p) => (
              <div key={p.id} className="pw-recent-item-row">
                <div className="pw-recent-item-icon">
                  <Clock size={16} />
                </div>
                <div className="pw-recent-item-meta">
                  <span className="pw-recent-item-title">{p.location}</span>
                  <span className="pw-recent-item-time">{p.date} • {p.duration} • Bay {p.slot}</span>
                </div>
                <div className="pw-recent-item-right">
                  <span className="pw-recent-amount">{p.amount}</span>
                  <span className="pw-status-pill completed">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pw-find-parking-section">
        <h3 className="pw-section-title">Quick Customer Actions</h3>
        <div className="pw-quick-actions-grid">
          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-teal-soft">
              <Search size={20} className="icon-teal" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Find Parking</span>
              <span className="pw-action-sub">Nearby available spots</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-green-soft">
              <BookmarkCheck size={20} className="icon-green" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Reserve Spot</span>
              <span className="pw-action-sub">Book advance bay</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-blue-soft">
              <Car size={20} className="icon-blue" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">My Vehicles</span>
              <span className="pw-action-sub">Manage 2 registered</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-purple-soft">
              <Clock size={20} className="icon-purple" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Digital Passes</span>
              <span className="pw-action-sub">View active RFID QR</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

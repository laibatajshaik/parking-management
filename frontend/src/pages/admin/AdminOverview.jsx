import { TrendingUp, ChevronRight } from "lucide-react";
import DashboardNotifications from "../../components/DashboardNotifications.jsx";

export default function AdminOverview({ metrics, recentBookings, setActiveTab, userEmail }) {
  return (
    <>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Bookings</span>
          <span className="pw-metric-value">{metrics.totalBookings}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>+12.8% vs last week</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Revenue</span>
          <span className="pw-metric-value">{metrics.totalRevenue}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>+15.2% vs last week</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("parking-occupancy")}>
          <span className="pw-metric-label">Active Parkings</span>
          <span className="pw-metric-value">{metrics.activeParkings}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>View Occupancy &gt;</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("user-management")}>
          <span className="pw-metric-label">Registered Users</span>
          <span className="pw-metric-value">{metrics.totalUsers}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Manage Users &gt;</span>
          </span>
        </div>
      </div>

      <div className="pw-two-charts-grid">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <h3 className="pw-chart-title">Weekly Bookings Trend</h3>
            <div className="pw-chart-legend">
              <span className="legend-item">
                <span className="legend-line teal"></span> This Week
              </span>
              <span className="legend-item">
                <span className="legend-line gray"></span> Last Week
              </span>
            </div>
          </div>

          <div className="pw-spline-chart-box">
            <svg className="pw-spline-svg" viewBox="0 0 500 160">
              <defs>
                <linearGradient id="modernTealSplineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 20 130 C 80 120, 120 140, 180 90 C 240 40, 300 110, 360 60 C 420 20, 460 70, 480 40 L 480 160 L 20 160 Z"
                fill="url(#modernTealSplineGrad)"
              />
              <path
                d="M 20 140 C 80 130, 120 120, 180 110 C 240 100, 300 90, 360 85 C 420 80, 460 75, 480 70"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 20 130 C 80 120, 120 140, 180 90 C 240 40, 300 110, 360 60 C 420 20, 460 70, 480 40"
                fill="none"
                stroke="#0d9488"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="180" cy="90" r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
              <circle cx="360" cy="60" r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
              <circle cx="480" cy="40" r="4" fill="#0d9488" stroke="#ffffff" strokeWidth="2" />
            </svg>

            <div className="pw-chart-x-axis">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </div>

        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <h3 className="pw-chart-title">Parking Type Distribution</h3>
          </div>

          <div className="pw-donut-chart-row">
            <div className="pw-donut-container">
              <svg className="pw-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="var(--border-color, #f1f5f9)" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="12"
                  strokeDasharray="130 240"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="12"
                  strokeDasharray="60 240"
                  strokeDashoffset="-130"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="12"
                  strokeDasharray="30 240"
                  strokeDashoffset="-190"
                />
              </svg>
              <div className="pw-donut-center-label">
                <span className="pw-donut-big">86%</span>
                <span className="pw-donut-sub">Occupied</span>
              </div>
            </div>

            <div className="pw-donut-legend-col">
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-teal"></span>
                <span className="pw-legend-name">Standard</span>
                <span className="pw-legend-val">58%</span>
              </div>
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-amber"></span>
                <span className="pw-legend-name">VIP / EV</span>
                <span className="pw-legend-val">26%</span>
              </div>
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-red"></span>
                <span className="pw-legend-name">Bikes</span>
                <span className="pw-legend-val">16%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pw-recent-table-card">
        <div className="pw-chart-header">
          <h3 className="pw-table-title">Recent Bookings</h3>
          <button type="button" className="pw-view-all-link">
            <span>View all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="pw-table-scroll">
          <table className="pw-custom-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Location</th>
                <th>Vehicle Number</th>
                <th>Date</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.id}</strong></td>
                  <td>{b.user}</td>
                  <td>{b.location}</td>
                  <td>{b.vehicle}</td>
                  <td>{b.date}</td>
                  <td>
                    <span className={`pw-status-pill ${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                  <td><strong>{b.amount}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <DashboardNotifications userEmail={userEmail || "admin@shnoor.com"} title="Admin Activity Stream & System Alerts" />
      </div>
    </>
  );
}

import { TrendingUp, ChevronRight, LogIn, Layers, Activity, CreditCard } from "lucide-react";

export default function StaffOverview({ metrics, recentEntries }) {
  return (
    <>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Today's Bookings</span>
          <span className="pw-metric-value">{metrics.todayBookings}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Live activity</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Available Slots</span>
          <span className="pw-metric-value">{metrics.availableSlots}</span>
          <span className="pw-metric-trend positive">
            <span>Free bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Today's Revenue</span>
          <span className="pw-metric-value">{metrics.todayRevenue}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>+8.4% vs avg</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Active Vehicles</span>
          <span className="pw-metric-value">{metrics.activeVehicles}</span>
          <span className="pw-metric-trend positive">
            <span>Inside facility</span>
          </span>
        </div>
      </div>

      <div className="pw-operator-two-col">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <h3 className="pw-chart-title">Current Facility Occupancy</h3>
          </div>

          <div className="pw-occupancy-donut-wrap">
            <div className="pw-donut-container">
              <svg className="pw-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0f3b43"
                  strokeWidth="12"
                  strokeDasharray="148 240"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="12"
                  strokeDasharray="50 240"
                  strokeDashoffset="-148"
                />
              </svg>
              <div className="pw-donut-center-label">
                <span className="pw-donut-big">{metrics.occupiedPercent}%</span>
                <span className="pw-donut-sub">Capacity</span>
              </div>
            </div>

            <div className="pw-occupancy-legend">
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-darkteal"></span>
                <span className="pw-legend-name">Occupied</span>
                <span className="pw-legend-val">{metrics.activeVehicles} slots</span>
              </div>
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-amber"></span>
                <span className="pw-legend-name">Available</span>
                <span className="pw-legend-val">{metrics.availableSlots} slots</span>
              </div>
              <div className="pw-total-slots-note">
                Total Capacity: 24 active bays (Zones A - D)
              </div>
            </div>
          </div>
        </div>

        <div className="pw-recent-table-card">
          <div className="pw-chart-header">
            <h3 className="pw-table-title">Recent Gate Check-ins</h3>
            <button type="button" className="pw-view-all-link">
              <span>View all</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="pw-table-scroll">
            <table className="pw-custom-table">
              <thead>
                <tr>
                  <th>Entry ID</th>
                  <th>Vehicle Number</th>
                  <th>Bay</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.id}</strong></td>
                    <td>{e.plate}</td>
                    <td><span className="pw-tag-slot">{e.slot}</span></td>
                    <td>{e.time}</td>
                    <td><span className="pw-status-pill active">{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="pw-quick-actions-section">
        <h3 className="pw-section-title">Quick Operations</h3>
        <div className="pw-quick-actions-grid">
          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-teal-soft">
              <LogIn size={20} className="icon-teal" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Vehicle Entry</span>
              <span className="pw-action-sub">Scan plate / RFID ticket</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-green-soft">
              <Layers size={20} className="icon-green" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Assign Slot</span>
              <span className="pw-action-sub">Manual bay override</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-blue-soft">
              <Activity size={20} className="icon-blue" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Active Sessions</span>
              <span className="pw-action-sub">Live parked vehicles</span>
            </div>
          </div>

          <div className="pw-action-card">
            <div className="pw-action-icon-circle bg-purple-soft">
              <CreditCard size={20} className="icon-purple" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Validate Payment</span>
              <span className="pw-action-sub">Cash / UPI / FASTag</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

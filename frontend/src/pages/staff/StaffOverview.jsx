import { TrendingUp, ChevronRight, LogIn, Layers, Activity, CreditCard, Car, Zap } from "lucide-react";
import DashboardNotifications from "../../components/DashboardNotifications.jsx";

export default function StaffOverview({ metrics, recentEntries = [], userEmail, setActiveTab }) {
  const occupiedPct = metrics.occupiedPercent || 0;
  const dashOccupied = Math.round((occupiedPct / 100) * 240);
  const dashAvailable = Math.max(0, 240 - dashOccupied);

  return (
    <>
      <div className="pw-metrics-five-grid">
        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("reservation-validation")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab && setActiveTab("reservation-validation");
            }
          }}
          title="View & validate today's bookings"
        >
          <span className="pw-metric-label">Today's Bookings</span>
          <span className="pw-metric-value">{metrics.todayBookings}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Live activity</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("slot-assignment")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab && setActiveTab("slot-assignment");
            }
          }}
          title="View & manage available parking slots"
        >
          <span className="pw-metric-label">Available Slots</span>
          <span className="pw-metric-value">{metrics.availableSlots}</span>
          <span className="pw-metric-trend positive">
            <span>Free bays</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("active-parking")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab && setActiveTab("active-parking");
            }
          }}
          title="View occupied parking slots"
        >
          <span className="pw-metric-label">Occupied Slots</span>
          <span className="pw-metric-value">{metrics.occupiedSlots !== undefined ? metrics.occupiedSlots : (metrics.activeVehicles ?? 0)}</span>
          <span className="pw-metric-trend positive">
            <Car size={12} />
            <span>In use</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("payment")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab && setActiveTab("payment");
            }
          }}
          title="Collect & validate payments"
        >
          <span className="pw-metric-label">Today's Revenue</span>
          <span className="pw-metric-value">{metrics.todayRevenue}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={12} />
            <span>Database payments</span>
          </span>
        </div>

        <div
          className="pw-metric-card"
          style={{ cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease" }}
          onClick={() => setActiveTab && setActiveTab("active-parking")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setActiveTab && setActiveTab("active-parking");
            }
          }}
          title="View active parked vehicles"
        >
          <span className="pw-metric-label">Active Vehicles</span>
          <span className="pw-metric-value">{metrics.activeVehicles}</span>
          <span className="pw-metric-trend positive">
            <span>Inside facility</span>
          </span>
        </div>
      </div>

      <div className="pw-quick-actions-section" style={{ marginTop: "18px", marginBottom: "18px" }}>
        <h2 className="pw-section-title">Quick Operations</h2>
        <div className="pw-quick-actions-grid">
          <div
            className="pw-action-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab && setActiveTab("vehicle-entry")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab && setActiveTab("vehicle-entry");
              }
            }}
            title="Scan plate / RFID ticket for vehicle entry"
            style={{ cursor: "pointer" }}
          >
            <div className="pw-action-icon-circle bg-teal-soft">
              <LogIn size={20} className="icon-teal" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Entry</span>
              <span className="pw-action-sub">Scan plate / RFID ticket</span>
            </div>
          </div>

          <div
            className="pw-action-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab && setActiveTab("slot-assignment")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab && setActiveTab("slot-assignment");
              }
            }}
            title="Manual bay override & slot allocation"
            style={{ cursor: "pointer" }}
          >
            <div className="pw-action-icon-circle bg-green-soft">
              <Layers size={20} className="icon-green" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Assign Slot</span>
              <span className="pw-action-sub">Manual bay override</span>
            </div>
          </div>

          <div
            className="pw-action-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab && setActiveTab("active-parking")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab && setActiveTab("active-parking");
              }
            }}
            title="Live parked vehicles & active sessions"
            style={{ cursor: "pointer" }}
          >
            <div className="pw-action-icon-circle bg-blue-soft">
              <Activity size={20} className="icon-blue" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Active Sessions</span>
              <span className="pw-action-sub">Live parked vehicles</span>
            </div>
          </div>

          <div
            className="pw-action-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab && setActiveTab("payment")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab && setActiveTab("payment");
              }
            }}
            title="Cash / UPI / FASTag payment collection & validation"
            style={{ cursor: "pointer" }}
          >
            <div className="pw-action-icon-circle bg-purple-soft">
              <CreditCard size={20} className="icon-purple" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">Validate Payment</span>
              <span className="pw-action-sub">Cash / UPI / FASTag</span>
            </div>
          </div>

          <div
            className="pw-action-card"
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab && setActiveTab("ev-charging")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveTab && setActiveTab("ev-charging");
              }
            }}
            title="EV charging stations and active sessions"
            style={{ cursor: "pointer" }}
          >
            <div className="pw-action-icon-circle bg-teal-soft">
              <Zap size={20} className="icon-teal" />
            </div>
            <div className="pw-action-meta">
              <span className="pw-action-title">EV Charging</span>
              <span className="pw-action-sub">Sessions & Bays</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pw-operator-two-col">
        <div className="pw-chart-card">
          <div className="pw-chart-header">
            <h2 className="pw-chart-title">Current Facility Occupancy</h2>
          </div>

          <div className="pw-occupancy-donut-wrap">
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
                  strokeDasharray={`${dashOccupied} 240`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="12"
                  strokeDasharray={`${dashAvailable} 240`}
                  strokeDashoffset={-dashOccupied}
                />
              </svg>
              <div className="pw-donut-center-label">
                <span className="pw-donut-big">{metrics.occupiedPercent}%</span>
                <span className="pw-donut-sub">Capacity</span>
              </div>
            </div>

            <div className="pw-occupancy-legend">
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-teal"></span>
                <span className="pw-legend-name">Occupied</span>
                <span className="pw-legend-val">{metrics.occupiedSlots !== undefined ? metrics.occupiedSlots : metrics.activeVehicles} slots</span>
              </div>
              <div className="pw-legend-row">
                <span className="pw-bullet-chip dot-amber"></span>
                <span className="pw-legend-name">Available</span>
                <span className="pw-legend-val">{metrics.availableSlots} slots</span>
              </div>
              <div className="pw-total-slots-note">
                Total Capacity: {metrics.totalSlots || 30} active bays
              </div>
            </div>
          </div>
        </div>

        <div className="pw-recent-table-card">
          <div className="pw-chart-header">
            <h2 className="pw-table-title">Recent Gate Check-ins</h2>
            <button type="button" className="pw-view-all-link" onClick={() => setActiveTab && setActiveTab("parking-records")}>
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
                {recentEntries && recentEntries.length > 0 ? (
                  recentEntries.map((e) => (
                    <tr key={e.id}>
                      <td><strong>{e.id}</strong></td>
                      <td>{e.plate}</td>
                      <td><span className="pw-tag-slot">{e.slot}</span></td>
                      <td>{e.time}</td>
                      <td><span className="pw-status-pill active">{e.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "28px", color: "var(--text-secondary, #94a3b8)" }}>
                      No vehicle check-ins recorded yet today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "18px" }}>
        <DashboardNotifications userEmail={userEmail} title="Staff Alerts & Live System Updates" />
      </div>
    </>
  );
}

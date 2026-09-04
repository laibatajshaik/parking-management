import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogIn,
  Layers,
  Activity,
  LogOut as LogOutIcon,
  Calculator,
  CreditCard,
  FileText,
  HelpCircle,
  Bell,
  Search,
  Menu
} from "lucide-react";
import StaffOverview from "./StaffOverview.jsx";

const STAFF_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, isWorking: true },
  { id: "vehicle-entry", label: "Vehicle Entry", icon: LogIn, isWorking: false },
  { id: "slot-assignment", label: "Slot Assignment", icon: Layers, isWorking: false },
  { id: "active-parking", label: "Active Parking", icon: Activity, isWorking: false },
  { id: "vehicle-exit", label: "Vehicle Exit", icon: LogOutIcon, isWorking: false },
  { id: "fee-calculation", label: "Fee Calculation", icon: Calculator, isWorking: false },
  { id: "payment", label: "Payment", icon: CreditCard, isWorking: false },
  { id: "parking-records", label: "Parking Records", icon: FileText, isWorking: false },
  { id: "support", label: "Support / Help", icon: HelpCircle, isWorking: false },
];

export default function StaffDashboard({ setView }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [metrics, setMetrics] = useState({
    todayBookings: "42",
    availableSlots: "58",
    todayRevenue: "₹84,000",
    activeVehicles: "36",
    occupiedPercent: 62,
  });

  const [recentEntries] = useState([
    { id: "#ENT-1042", plate: "KA01 AB 1234", slot: "A-04", type: "Car", time: "10:45 AM", status: "Active" },
    { id: "#ENT-1041", plate: "KA02 CD 5678", slot: "B-12", type: "Car", time: "10:30 AM", status: "Active" },
    { id: "#ENT-1040", plate: "KA03 EF 9012", slot: "A-08", type: "SUV", time: "10:15 AM", status: "Active" },
  ]);

  useEffect(() => {
    fetch("http://localhost:5000/api/admin/dashboard-overview")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setMetrics({
            todayBookings: String(data.stats.totalSlots ? data.stats.totalSlots * 2 : 42),
            availableSlots: String(data.stats.availableSlots || 58),
            todayRevenue: `₹${((data.stats.todayRevenue || 840) * 100).toLocaleString("en-IN")}`,
            activeVehicles: String(data.stats.occupiedSlots || 36),
            occupiedPercent: data.stats.occupancyRate || 62,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    if (setView) {
      setView("landing");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="pw-dashboard-app">
      <aside className="pw-dashboard-sidebar">
        <div className="pw-sidebar-brand" onClick={() => setView("landing")}>
          <div className="pw-brand-logo-box">
            <span className="pw-p-logo">P</span>
          </div>
          <span className="pw-brand-word text-white">ParkSafe</span>
        </div>

        <div className="pw-sidebar-menu">
          {STAFF_SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`pw-sidebar-item ${isActive ? "active" : item.isWorking ? "" : "disabled"}`}
                onClick={() => {
                  if (item.isWorking) setActiveTab(item.id);
                }}
                title={item.isWorking ? "" : `${item.label} (Module disabled)`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pw-sidebar-footer">
          <button type="button" className="pw-sidebar-logout-btn" onClick={handleSignOut}>
            <LogOutIcon size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="pw-dashboard-main">
        <header className="pw-dashboard-topbar">
          <div className="pw-topbar-left">
            <button type="button" className="pw-topbar-menu-icon" aria-label="Menu">
              <Menu size={18} />
            </button>
            <div className="pw-topbar-search">
              <Search size={14} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search ticket / plate number..."
                className="pw-search-input"
              />
            </div>
          </div>

          <div className="pw-topbar-right">
            <div className="pw-topbar-bell">
              <Bell size={18} />
              <span className="pw-bell-dot"></span>
            </div>

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials">LT</div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">Laiba Taj</span>
                <span className="pw-user-profile-role">Staff Operator</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row">
            <div>
              <h1 className="pw-page-title">Operator Console</h1>
              <p className="pw-page-subtitle">Operator: Laiba Taj | Shift: Morning Duty | Gate: North Entry</p>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <StaffOverview
              metrics={metrics}
              recentEntries={recentEntries}
            />
          )}
        </div>
      </div>
    </div>
  );
}

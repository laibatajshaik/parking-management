import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  BookmarkCheck,
  Car,
  History,
  CreditCard,
  FileText,
  HelpCircle,
  Bell,
  LogOut,
  Menu
} from "lucide-react";
import CustomerOverview from "./CustomerOverview.jsx";

const CUSTOMER_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, isWorking: true },
  { id: "find-parking", label: "Find Parking", icon: Search, isWorking: false },
  { id: "reserve-parking", label: "Reserve Parking", icon: BookmarkCheck, isWorking: false },
  { id: "my-parking", label: "My Parking", icon: Car, isWorking: false },
  { id: "parking-history", label: "Parking History", icon: History, isWorking: false },
  { id: "payments", label: "Payments", icon: CreditCard, isWorking: false },
  { id: "digital-receipts", label: "Digital Receipts", icon: FileText, isWorking: false },
  { id: "support", label: "Support / Help", icon: HelpCircle, isWorking: false },
];

export default function CustomerDashboard({ setView }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [recentParkings] = useState([
    { id: 1, location: "Downtown Plaza", slot: "A-04", date: "May 27, 2026", duration: "2 hrs 15 mins", amount: "₹150.00" },
    { id: 2, location: "City Mall Parking", slot: "B-12", date: "May 22, 2026", duration: "1 hr 30 mins", amount: "₹100.00" },
    { id: 3, location: "Airport Parking Lot 2", slot: "A-01", date: "May 15, 2026", duration: "4 hrs 00 mins", amount: "₹300.00" },
  ]);

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
          {CUSTOMER_SIDEBAR_ITEMS.map((item) => {
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
            <LogOut size={16} />
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
                placeholder="Search nearby parking..."
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
              <div className="pw-avatar-initials">L</div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">Laiba</span>
                <span className="pw-user-profile-role">Customer Member</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row">
            <div>
              <h1 className="pw-page-title">Customer Portal</h1>
              <p className="pw-page-subtitle">Welcome, Laiba. Manage your vehicle passes and parking spots.</p>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <CustomerOverview
              recentParkings={recentParkings}
            />
          )}
        </div>
      </div>
    </div>
  );
}

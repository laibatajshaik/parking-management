import { LayoutGrid } from "lucide-react";
import LogoutButton from "./LogoutButton.jsx";

export default function Sidebar({ brandName, menuItems, activeTab, setActiveTab, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">
          <LayoutGrid size={22} />
        </span>
        <div className="brand-info">
          <span className="brand-name">{brandName}</span>
          <span className="brand-badge">Control Hub</span>
        </div>
      </div>

      <div className="sidebar-section-title">MAIN NAVIGATION</div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.label}
              type="button"
              className={`menu-item ${isActive ? "active" : "is-placeholder"}`}
              onClick={() => {
                if (item.id === "dashboard") {
                  setActiveTab(item.id);
                }
              }}
            >
              <div className="menu-item-left">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="active-indicator-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="system-health-card">
          <div className="health-header">
            <span className="health-dot"></span>
            <span>Gateway Online</span>
          </div>
          <span className="health-sub">Port 5000 • Connected</span>
        </div>
        <LogoutButton onLogout={onLogout} />
      </div>
    </aside>
  );
}

import { LogOut, X, Crown } from "lucide-react";

export default function Sidebar({
  role = "customer",
  menuItems = [],
  activeTab,
  onTabChange,
  onLogout,
  isCollapsed = false,
  isMobileNavOpen = false,
  onCloseMobile,
  isPremiumActive = false,
  onBrandClick
}) {
  return (
    <aside
      className={`pw-dashboard-sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileNavOpen ? "open" : ""}`}
      aria-label="Sidebar Navigation"
    >
      <div className="pw-sidebar-brand-row">
        <div
          className="pw-sidebar-brand"
          onClick={onBrandClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (onBrandClick) onBrandClick();
            }
          }}
          title="ParkSafe Home"
        >
          <div
            className="pw-brand-logo-box"
            style={{
              background: isPremiumActive ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488",
              borderRadius: "10px"
            }}
          >
            <span className="pw-p-logo" style={{ color: "#ffffff", fontWeight: 800 }}>P</span>
          </div>
          {!isCollapsed && (
            <div className="pw-brand-info">
              <span className="pw-brand-word text-white" style={{ fontSize: "1.1rem" }}>ParkSafe</span>
              <div className="pw-brand-tagline" style={{ fontSize: "0.64rem", color: "#94a3b8", marginTop: "-2px" }}>
                Smart Parking. Smarter You.
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="pw-sidebar-close-btn"
          aria-label="Close sidebar"
          onClick={onCloseMobile}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="pw-sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`pw-sidebar-item ${isActive ? "active" : item.isWorking ? "" : "disabled"}`}
              onClick={() => {
                if (item.isWorking) {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }
              }}
              title={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              <span className="pw-sidebar-item-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {role === "customer" && isPremiumActive && (
        <div
          className="pw-sidebar-premium-pill"
          style={{
            margin: "10px 0",
            background: "rgba(201, 154, 46, 0.12)",
            border: "1px solid rgba(201, 154, 46, 0.35)",
            borderRadius: "10px",
            padding: isCollapsed ? "8px 0" : "10px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "8px"
          }}
          title="Active Premium Membership (VIP Priority Pass)"
        >
          <Crown size={16} className="pw-premium-crown-icon" style={{ color: "#C99A2E", flexShrink: 0 }} />
          {!isCollapsed && (
            <div className="pw-premium-pill-text">
              <div className="pw-premium-pill-title" style={{ fontSize: "0.78rem", fontWeight: 800, color: "#F5E7C3" }}>
                PREMIUM ACTIVE
              </div>
              <div className="pw-premium-pill-sub" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}>
                VIP Priority Pass
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pw-sidebar-footer" style={{ marginTop: "auto" }}>
        <button
          type="button"
          className="pw-sidebar-logout-btn"
          onClick={() => {
            if (onCloseMobile) onCloseMobile();
            onLogout();
          }}
          title="Logout"
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="pw-sidebar-item-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

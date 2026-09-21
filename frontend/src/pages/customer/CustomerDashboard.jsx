import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LayoutDashboard, BookmarkCheck, FileText, CreditCard, Car, Tag, User, HelpCircle, Bell, LogOut, Menu, Search, MapPin, ChevronDown, Crown } from "lucide-react";
import CustomerOverview from "./CustomerOverview.jsx";
import MyParking from "./MyParking.jsx";
import Payments from "./Payments.jsx";
import DigitalReceipt from "./DigitalReceipt.jsx";
import ParkingHistory from "./ParkingHistory.jsx";
import ReserveParking from "./ReserveParking.jsx";
import CustomerParkingPlans from "./CustomerParkingPlans.jsx";
import CustomerProfile from "./CustomerProfile.jsx";
import CustomerSupport from "./CustomerSupport.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";

const CUSTOMER_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, isWorking: true },
  { id: "reserve-parking", label: "Reserve Parking", icon: BookmarkCheck, isWorking: true },
  { id: "parking-plans", label: "Parking Plans", icon: Tag, isWorking: true },
  { id: "parking-history", label: "My Bookings", icon: FileText, isWorking: true },
  { id: "payments", label: "Payment History", icon: CreditCard, isWorking: true },
  { id: "my-parking", label: "My Vehicles", icon: Car, isWorking: true },
  { id: "profile", label: "Profile", icon: User, isWorking: true },
  { id: "support", label: "Support / Help", icon: HelpCircle, isWorking: true },
];

export default function CustomerDashboard({ setView }) {
  const navigate = useNavigate();
  const { tab } = useParams();
  const [activeTab, setActiveTab] = useState(() => {
    if (!tab || tab === "dashboard" || tab === "overview") return "dashboard";
    return tab;
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState(null);
  const [selectedPlanForReserve, setSelectedPlanForReserve] = useState(null);

  useEffect(() => {
    if (tab) {
      if (tab === "dashboard" || tab === "overview") {
        if (activeTab !== "dashboard") {
          setActiveTab("dashboard");
        }
      } else {
        const match = CUSTOMER_SIDEBAR_ITEMS.find((item) => item.id === tab);
        if (match && activeTab !== tab) {
          setActiveTab(tab);
        }
      }
    } else {
      navigate("/customer/dashboard/overview", { replace: true });
    }
  }, [tab, activeTab, navigate]);

  useEffect(() => {
    const current = CUSTOMER_SIDEBAR_ITEMS.find((item) => item.id === activeTab);
    const label = current ? current.label : "Dashboard";
    document.title = `Customer Dashboard - ${label} | ParkSafe`;
  }, [activeTab]);

  const handleTabChange = (itemId) => {
    setActiveTab(itemId);
    setIsMobileNavOpen(false);
    if (itemId === "dashboard" || itemId === "overview") {
      navigate("/customer/dashboard/overview");
    } else {
      navigate(`/customer/dashboard/${itemId}`);
    }
  };

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("shnoor_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [premiumPlanInfo, setPremiumPlanInfo] = useState(() => {
    try {
      localStorage.removeItem("shnoor_customer_premium");
      const savedUser = localStorage.getItem("shnoor_current_user");
      const user = savedUser ? JSON.parse(savedUser) : null;
      const email = user?.email || "";
      const saved = email ? localStorage.getItem(`shnoor_premium_${email}`) : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("shnoor_current_user");
      if (!savedUser) {
        if (setView) {
          setView("login");
        } else {
          navigate("/login");
        }
        return;
      }
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      const email = parsed.email || "";
      const savedPremium = email ? localStorage.getItem(`shnoor_premium_${email}`) : null;
      setPremiumPlanInfo(savedPremium ? JSON.parse(savedPremium) : null);
    } catch {
      if (setView) {
        setView("login");
      } else {
        navigate("/login");
      }
    }
  }, [navigate, setView]);

  const isPremiumActive = Boolean(premiumPlanInfo && premiumPlanInfo.active);

  const handleActivatePremium = (planDetails) => {
    const info = planDetails || {
      active: true,
      plan: "Monthly Plan",
      planName: "Monthly VIP Plan",
      amount: 2500,
      validFrom: "02 Sep 2025",
      validUntil: "02 Oct 2025",
      remainingDays: 30,
      slot: "A-01 (VIP Zone)",
      vehicle: "KA01 AB 1234"
    };
    setPremiumPlanInfo(info);
    try {
      const email = currentUser?.email || "customer@shnoor.com";
      localStorage.setItem(`shnoor_premium_${email}`, JSON.stringify(info));
    } catch (err) { void err; }
  };

  
  const [recentParkings] = useState([
    { id: 1, location: "Downtown Plaza", slot: "A-04", date: "May 27, 2026", duration: "2 hrs 15 mins", amount: "₹150.00", status: "Completed", plate: "KA01 AB 1234" },
    { id: 2, location: "City Mall Parking", slot: "B-12", date: "May 22, 2026", duration: "1 hr 30 mins", amount: "₹100.00", status: "Completed", plate: "KA01 AB 1234" },
    { id: 3, location: "Airport Parking Lot 2", slot: "A-01", date: "May 15, 2026", duration: "4 hrs 00 mins", amount: "₹300.00", status: "Completed", plate: "KA04 GH 3456" },
  ]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("shnoor_current_user");
    } catch (err) { void err; }
    if (setView) {
      setView("landing");
    } else {
      navigate("/");
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "CU";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleViewReceipt = (payment) => {
    setSelectedReceiptForView(payment);
    handleTabChange("digital-receipts");
  };

  const handleSelectPlanAndReserve = (plan) => {
    setSelectedPlanForReserve(plan);
    handleTabChange("reserve-parking");
  };

  const getPageTitle = () => {
    if (activeTab === "reserve-parking") return "Find & Reserve Parking";
    if (activeTab === "parking-plans") return "Parking Plans & Pricing";
    if (activeTab === "my-parking") return "My Active Parking";
    if (activeTab === "parking-history") return "My Bookings & History";
    if (activeTab === "payments") return "Payment History";
    if (activeTab === "digital-receipts") return "Digital Receipts";
    if (activeTab === "profile") return "Customer Profile & Garage";
    if (activeTab === "support") return "Customer Support & FAQ";
    return "Customer Portal";
  };

  const getPageSubtitle = () => {
    if (activeTab === "reserve-parking") return "Choose any configured parking plan, select date & time, and book your parking slot.";
    if (activeTab === "parking-plans") return "Explore all official vehicle parking tariffs, hourly rates, daily passes, and VIP tiers configured by management.";
    if (activeTab === "my-parking") return "Live session duration, bay location, and tariff accumulator";
    if (activeTab === "parking-history") return "Review all your past and active parking visits and download travel receipts";
    if (activeTab === "payments") return "Complete record of all parking payments and transactions";
    if (activeTab === "digital-receipts") return "Official verified digital passes and tax invoices";
    if (activeTab === "profile") return "Manage account credentials, registered vehicles, Fastag RFID tags, and notification settings";
    if (activeTab === "support") return "24/7 dedicated customer assistance, searchable help guide, and ticket dispatch";
    return isPremiumActive ? `Welcome, ${currentUser.name || "Customer"}. Enjoy your active Premium VIP privileges.` : `Welcome, ${currentUser.name || "Customer"}. Manage your vehicle passes and parking spots.`;
  };

  return (
    <div className={`pw-dashboard-app ${isPremiumActive ? "pw-theme-premium" : ""}`}>
      <div
        className={`pw-sidebar-backdrop ${isMobileNavOpen ? "open" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <aside className={`pw-dashboard-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        <div className="pw-sidebar-brand" onClick={() => setView("landing")}>
          <div className="pw-brand-logo-box" style={{ background: isPremiumActive ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488", borderRadius: "10px" }}>
            <span className="pw-p-logo" style={{ color: "#ffffff", fontWeight: 800 }}>P</span>
          </div>
          <div>
            <span className="pw-brand-word text-white" style={{ fontSize: "1.1rem" }}>ParkSafe</span>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8", marginTop: "-2px" }}>Smart Parking. Smarter You.</div>
          </div>
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
                  if (item.isWorking) {
                    handleTabChange(item.id);
                  }
                }}
                title={item.isWorking ? "" : `${item.label} (Module disabled)`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {isPremiumActive && (
          <div className="pw-sidebar-premium-pill" style={{ margin: "10px 0", background: "rgba(201, 154, 46, 0.12)", border: "1px solid rgba(201, 154, 46, 0.35)", borderRadius: "10px", padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Crown size={16} style={{ color: "#C99A2E" }} />
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#F5E7C3" }}>PREMIUM ACTIVE</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.7)" }}>VIP Priority Pass</div>
              </div>
            </div>
          </div>
        )}

        <div className="pw-sidebar-footer" style={{ marginTop: "auto" }}>
          <button
            type="button"
            className="pw-sidebar-logout-btn"
            onClick={() => {
              setIsMobileNavOpen(false);
              handleSignOut();
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="pw-dashboard-main">
        <header className="pw-dashboard-topbar">
          <div className="pw-topbar-left">
            <button
              type="button"
              className="pw-topbar-menu-icon"
              aria-label="Menu"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
            >
              <Menu size={18} />
            </button>
            <div className="pw-topbar-search">
              <Search size={14} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search location, parking area..."
                className="pw-search-input"
              />
            </div>
          </div>

          <div className="pw-topbar-right">
            <ThemeToggle />
            <div className="pw-topbar-bell">
              <Bell size={18} />
              <span className="pw-bell-dot" style={{ width: "8px", height: "8px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: isPremiumActive ? "#C99A2E" : "#ef4444" }}>1</span>
            </div>

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials" style={{ background: isPremiumActive ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488", color: "#ffffff" }}>
                {isPremiumActive ? <Crown size={15} /> : getUserInitials(currentUser.name)}
              </div>
              <div className="pw-user-profile-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="pw-user-profile-name">{currentUser.name || "Customer"}</span>
                  {isPremiumActive && (
                    <span className="pw-badge-crown" style={{ background: "#F5E7C3", color: "#9A6B18", border: "1px solid #C99A2E", fontSize: "0.62rem", fontWeight: 800, padding: "1px 5px", borderRadius: "4px" }}>
                      VIP
                    </span>
                  )}
                </div>
                <span className="pw-user-profile-role" style={{ color: isPremiumActive ? "#9A6B18" : "#64748b", fontWeight: isPremiumActive ? 700 : 500 }}>
                  {isPremiumActive ? "Premium Member" : "Customer"}
                </span>
              </div>
              <ChevronDown size={14} style={{ color: "#94a3b8", marginLeft: "2px" }} />
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="pw-page-title" style={{ fontSize: "1.45rem", fontWeight: 800, color: isPremiumActive ? "#facc15" : "var(--text-primary, #0f172a)" }}>{getPageTitle()}</h1>
              {getPageSubtitle() && <p className="pw-page-subtitle" style={{ color: "var(--text-secondary, #94a3b8)", marginTop: "2px", fontSize: "0.85rem" }}>{getPageSubtitle()}</p>}
            </div>

            {activeTab === "reserve-parking" && (
              <div className="pw-top-location-badge" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card, #ffffff)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <MapPin size={16} style={{ color: isPremiumActive ? "#C99A2E" : "#0d9488" }} />
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>Downtown Plaza Garage</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #94a3b8)" }}>24 Available Bays</div>
                </div>
              </div>
            )}
          </div>

          {activeTab === "dashboard" && (
            <CustomerOverview
              currentUser={currentUser}
              recentParkings={recentParkings}
              setActiveTab={handleTabChange}
              isPremiumActive={isPremiumActive}
              premiumPlanInfo={premiumPlanInfo}
            />
          )}

          {activeTab === "reserve-parking" && (
            <ReserveParking
              loggedInUser={currentUser}
              onNavigate={(tab) => handleTabChange(tab)}
              isPremiumActive={isPremiumActive}
              premiumPlanInfo={premiumPlanInfo}
              onActivatePremium={handleActivatePremium}
              preselectedPlan={selectedPlanForReserve}
            />
          )}

          {activeTab === "parking-plans" && (
            <CustomerParkingPlans
              loggedInUser={currentUser}
              isPremiumActive={isPremiumActive}
              onSelectPlanAndReserve={handleSelectPlanAndReserve}
            />
          )}

          {activeTab === "my-parking" && (
            <MyParking
              loggedInUser={currentUser}
              onNavigate={(tab) => handleTabChange(tab)}
              isPremiumActive={isPremiumActive}
              premiumPlanInfo={premiumPlanInfo}
            />
          )}

          {activeTab === "parking-history" && (
            <ParkingHistory
              onNavigate={(tab) => handleTabChange(tab)}
              isPremiumActive={isPremiumActive}
            />
          )}

          {activeTab === "payments" && (
            <Payments
              onViewReceipt={handleViewReceipt}
              isPremiumActive={isPremiumActive}
            />
          )}

          {activeTab === "digital-receipts" && (
            <DigitalReceipt
              receiptData={selectedReceiptForView}
              isPremiumActive={isPremiumActive}
            />
          )}

          {activeTab === "profile" && (
            <CustomerProfile
              currentUser={currentUser}
              isPremiumActive={isPremiumActive}
              premiumPlanInfo={premiumPlanInfo}
              onNavigateToPlans={() => handleTabChange("parking-plans")}
            />
          )}

          {activeTab === "support" && (
            <CustomerSupport
              currentUser={currentUser}
              isPremiumActive={isPremiumActive}
            />
          )}
        </div>
      </div>
    </div>
  );
}

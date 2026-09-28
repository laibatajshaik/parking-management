import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  BookmarkCheck,
  FileText,
  CreditCard,
  Receipt,
  Bell,
  Car,
  Tag,
  User,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  ChevronDown,
  Crown
} from "lucide-react";
import CustomerOverview from "./CustomerOverview.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import NotificationBell from "../../components/NotificationBell.jsx";
import { API_BASE_URL } from "../../config/api.js";

const MyParking = lazy(() => import("./MyParking.jsx"));
const Payments = lazy(() => import("./Payments.jsx"));
const DigitalReceipt = lazy(() => import("./DigitalReceipt.jsx"));
const CustomerNotifications = lazy(() => import("./CustomerNotifications.jsx"));
const ParkingHistory = lazy(() => import("./ParkingHistory.jsx"));
const ReserveParking = lazy(() => import("./ReserveParking.jsx"));
const CustomerParkingPlans = lazy(() => import("./CustomerParkingPlans.jsx"));
const CustomerProfile = lazy(() => import("./CustomerProfile.jsx"));
const CustomerSupport = lazy(() => import("./CustomerSupport.jsx"));

const CUSTOMER_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, isWorking: true },
  { id: "find-parking", label: "Find Parking", icon: MapPin, isWorking: true },
  { id: "reserve-parking", label: "Book Parking", icon: BookmarkCheck, isWorking: true },
  { id: "my-parking", label: "My Parking", icon: Car, isWorking: true },
  { id: "parking-history", label: "History", icon: FileText, isWorking: true },
  { id: "payments", label: "Payments", icon: CreditCard, isWorking: true },
  { id: "digital-receipts", label: "Receipts", icon: Receipt, isWorking: true },
  { id: "notifications", label: "Notifications", icon: Bell, isWorking: true },
  { id: "parking-plans", label: "Plans", icon: Tag, isWorking: true },
  { id: "vehicles", label: "Vehicles", icon: Car, isWorking: true },
  { id: "profile", label: "Profile", icon: User, isWorking: true },
  { id: "support", label: "Support", icon: HelpCircle, isWorking: true },
];

export default function CustomerDashboard({ setView }) {
  const navigate = useNavigate();
  const { tab } = useParams();

  const normalizeTab = (rawTab) => {
    if (!rawTab || rawTab === "dashboard" || rawTab === "overview") return "dashboard";
    if (rawTab === "plans") return "parking-plans";
    if (rawTab === "receipts") return "digital-receipts";
    return rawTab;
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(tab));
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState(null);
  const [selectedPlanForReserve, setSelectedPlanForReserve] = useState(null);

  useEffect(() => {
    if (tab) {
      const normalized = normalizeTab(tab);
      const match = CUSTOMER_SIDEBAR_ITEMS.find((item) => item.id === normalized);
      if (match && activeTab !== normalized) {
        setActiveTab(normalized);
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
    const target = normalizeTab(itemId);
    setActiveTab(target);
    setIsMobileNavOpen(false);
    if (target === "dashboard") {
      navigate("/customer/dashboard/overview");
    } else {
      navigate(`/customer/dashboard/${target}`);
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
      if (parsed.role !== "customer") {
        if (parsed.role === "admin") {
          navigate("/admin/dashboard/overview");
        } else if (parsed.role === "staff") {
          navigate("/staff/dashboard/overview");
        } else {
          navigate("/login");
        }
        return;
      }
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
    const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const thirtyDays = new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const info = planDetails || {
      active: true,
      plan: "Monthly Plan",
      planName: "Monthly VIP Plan",
      amount: 2500,
      validFrom: today,
      validUntil: thirtyDays,
      remainingDays: 30,
      slot: "A-01 (VIP Zone)",
      vehicle: "—"
    };
    setPremiumPlanInfo(info);
    try {
      const email = currentUser?.email || "";
      if (email) {
        localStorage.setItem(`shnoor_premium_${email}`, JSON.stringify(info));
        fetch(`${API_BASE_URL}/api/customer/activate-premium`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_email: email,
            customer_name: currentUser?.name || "Customer",
            plan_name: info.planName || info.plan || "Monthly VIP Plan",
            amount: info.amount || 2500,
            slot: info.slot,
            vehicle: info.vehicle
          })
        }).catch(() => {});
      }
    } catch {
      void 0;
    }
  };

  const [recentParkings, setRecentParkings] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [primaryLocation, setPrimaryLocation] = useState({ name: "Central Parking Garage", available: "Available Bays" });

  useEffect(() => {
    if (!currentUser?.email) return;
    const fetchUserData = async () => {
      try {
        const histRes = await fetch(`${API_BASE_URL}/api/customer/parking-history?email=${encodeURIComponent(currentUser.email)}`);
        const histData = await histRes.json();
        if (histData.success && Array.isArray(histData.history)) {
          const mapped = histData.history.slice(0, 5).map((r) => {
            const dateStr = r.exit_time
              ? new Date(r.exit_time).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
              : r.entry_time
              ? new Date(r.entry_time).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
              : "Recent";
            return {
              id: r.id,
              location: r.zone ? `${r.zone} Garage` : "ParkSafe Facility",
              slot: r.slot_number || "—",
              date: dateStr,
              duration: r.duration || "1 hr",
              amount: `₹${parseFloat(r.fee || 50).toFixed(2)}`,
              status: r.status || "Completed",
              plate: r.vehicle_number || "—"
            };
          });
          setRecentParkings(mapped);
        }
      } catch {
        setRecentParkings([]);
      }

      try {
        const sessRes = await fetch(`${API_BASE_URL}/api/customer/my-parking?email=${encodeURIComponent(currentUser.email)}`);
        const sessData = await sessRes.json();
        if (sessData.success && sessData.session) {
          setActiveSession(sessData.session);
        } else {
          setActiveSession(null);
        }
      } catch {
        setActiveSession(null);
      }
    };
    fetchUserData();
  }, [currentUser]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/parking-slots`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.slots)) {
          const avail = d.slots.filter((s) => s.status === "Available").length;
          setPrimaryLocation({
            name: "Central Parking Garage",
            available: `${avail} Available Bays`
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("shnoor_current_user");
    } catch {
      void 0;
    }
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
    if (activeTab === "find-parking") return "Find Parking";
    if (activeTab === "reserve-parking") return "Book Parking";
    if (activeTab === "parking-plans") return "Plans";
    if (activeTab === "my-parking") return "My Parking";
    if (activeTab === "parking-history") return "History";
    if (activeTab === "payments") return "Payments";
    if (activeTab === "digital-receipts") return "Receipts";
    if (activeTab === "notifications") return "Notifications";
    if (activeTab === "vehicles") return "Vehicles";
    if (activeTab === "profile") return "Profile";
    if (activeTab === "support") return "Support";
    return "Dashboard";
  };

  const getPageSubtitle = () => {
    if (activeTab === "find-parking") return "Explore available parking bays, real-time occupancy, and rates across our garages.";
    if (activeTab === "reserve-parking") return "Choose any configured parking plan, select date & time, and book your parking slot.";
    if (activeTab === "parking-plans") return "Explore all official vehicle parking tariffs, hourly rates, daily passes, and VIP tiers configured by management.";
    if (activeTab === "my-parking") return "Live session duration, bay location, and tariff accumulator.";
    if (activeTab === "parking-history") return "Review all your past and active parking visits and download travel receipts.";
    if (activeTab === "payments") return "Complete record of all parking payments and transactions.";
    if (activeTab === "digital-receipts") return "Official verified digital passes and tax invoices.";
    if (activeTab === "notifications") return "Personalized notifications, booking updates, and billing confirmations.";
    if (activeTab === "vehicles") return "Manage your personal vehicles, license plates, Fastag RFID tags, and vehicle categories.";
    if (activeTab === "profile") return "Manage account credentials, registered vehicles, Fastag RFID tags, and notification settings.";
    if (activeTab === "support") return "24/7 dedicated customer assistance, searchable help guide, and ticket dispatch.";
    return isPremiumActive ? `Welcome, ${currentUser?.name || "Customer"}. Enjoy your active Premium VIP privileges.` : `Welcome, ${currentUser?.name || "Customer"}. Manage your vehicle passes and parking spots.`;
  };

  return (
    <div className={`pw-dashboard-app ${isPremiumActive ? "pw-theme-premium" : ""}`}>
      <div
        className={`pw-sidebar-backdrop ${isMobileNavOpen ? "open" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <aside className={`pw-dashboard-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        <div className="pw-sidebar-brand" onClick={() => (setView ? setView("landing") : navigate("/"))}>
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
            <span>Logout</span>
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
            <NotificationBell userEmail={currentUser?.email} />

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials" style={{ background: isPremiumActive ? "linear-gradient(135deg, #C99A2E 0%, #9A6B18 100%)" : "#0d9488", color: "#ffffff" }}>
                {isPremiumActive ? <Crown size={15} /> : getUserInitials(currentUser?.name)}
              </div>
              <div className="pw-user-profile-meta">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="pw-user-profile-name">{currentUser?.name || "Customer"}</span>
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
              <h1 className="pw-page-title" style={{ fontSize: "1.45rem", fontWeight: 800, color: isPremiumActive ? "#facc15" : "var(--text-primary, #0f172a)" }}>
                {getPageTitle()}
              </h1>
              {getPageSubtitle() && (
                <p className="pw-page-subtitle" style={{ color: "var(--text-secondary, #94a3b8)", marginTop: "2px", fontSize: "0.85rem" }}>
                  {getPageSubtitle()}
                </p>
              )}
            </div>

            {(activeTab === "reserve-parking" || activeTab === "find-parking") && (
              <div className="pw-top-location-badge" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card, #ffffff)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <MapPin size={16} style={{ color: isPremiumActive ? "#C99A2E" : "#0d9488" }} />
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{primaryLocation.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #94a3b8)" }}>{primaryLocation.available}</div>
                </div>
              </div>
            )}
          </div>

          <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Loading module...</div>}>
            {activeTab === "dashboard" && (
              <CustomerOverview
                currentUser={currentUser}
                loggedInUser={currentUser}
                recentParkings={recentParkings}
                activeSession={activeSession}
                onNavigate={handleTabChange}
                setActiveTab={handleTabChange}
                onViewReceipt={handleViewReceipt}
                isPremiumActive={isPremiumActive}
                premiumPlanInfo={premiumPlanInfo}
              />
            )}

            {(activeTab === "reserve-parking" || activeTab === "find-parking") && (
              <ReserveParking
                loggedInUser={currentUser}
                onNavigate={(t) => handleTabChange(t)}
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

            {(activeTab === "my-parking" || activeTab === "vehicles") && (
              <MyParking
                loggedInUser={currentUser}
                onNavigate={(t) => handleTabChange(t)}
                isPremiumActive={isPremiumActive}
                premiumPlanInfo={premiumPlanInfo}
              />
            )}

            {activeTab === "parking-history" && (
              <ParkingHistory
                loggedInUser={currentUser}
                onNavigate={(t) => handleTabChange(t)}
                isPremiumActive={isPremiumActive}
              />
            )}

            {activeTab === "payments" && (
              <Payments
                loggedInUser={currentUser}
                onViewReceipt={handleViewReceipt}
                isPremiumActive={isPremiumActive}
              />
            )}

            {activeTab === "digital-receipts" && (
              <DigitalReceipt
                receiptData={selectedReceiptForView}
                currentUser={currentUser}
                loggedInUser={currentUser}
                onNavigate={handleTabChange}
                isPremiumActive={isPremiumActive}
              />
            )}

            {activeTab === "notifications" && (
              <CustomerNotifications
                currentUser={currentUser}
                loggedInUser={currentUser}
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
          </Suspense>
        </div>
      </div>
    </div>
  );
}

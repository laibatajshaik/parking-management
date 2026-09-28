import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  Search,
  LogOut,
  Menu,
  CheckCircle
} from "lucide-react";
import AdminOverview from "./AdminOverview.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import NotificationBell from "../../components/NotificationBell.jsx";

const ParkingOccupancy = lazy(() => import("./ParkingOccupancy.jsx"));
const ParkingSlotManagement = lazy(() => import("./ParkingSlotManagement.jsx"));
const VehicleManagement = lazy(() => import("./VehicleManagement.jsx"));
const UserManagement = lazy(() => import("./UserManagement.jsx"));
const ActiveParkingSessions = lazy(() => import("./ActiveParkingSessions.jsx"));
const TodaysRevenue = lazy(() => import("./TodaysRevenue.jsx"));
const ParkingRecords = lazy(() => import("./ParkingRecords.jsx"));
const BookingsReservations = lazy(() => import("./BookingsReservations.jsx"));
const PricingPlans = lazy(() => import("./PricingPlans.jsx"));
const ParkingLocations = lazy(() => import("./ParkingLocations.jsx"));
const ReportsAnalytics = lazy(() => import("./ReportsAnalytics.jsx"));
const AdminNotifications = lazy(() => import("./AdminNotifications.jsx"));
const SystemSettings = lazy(() => import("./SystemSettings.jsx"));
const SupportAuditLogs = lazy(() => import("./SupportAuditLogs.jsx"));

const ADMIN_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, isWorking: true },
  { id: "bookings-reservations", label: "Bookings & Reservations", icon: CalendarCheck, isWorking: true },
  { id: "pricing-plans", label: "Pricing & Plans", icon: CreditCard, isWorking: true },
  { id: "parking-records", label: "Parking Records", icon: CalendarCheck, isWorking: true },
  { id: "active-parking-sessions", label: "Active Parking Sessions", icon: Car, isWorking: true },
  { id: "payments-revenue", label: "Today's Revenue", icon: CreditCard, isWorking: true },
  { id: "parking-occupancy", label: "Parking Occupancy", icon: Car, isWorking: true },
  { id: "slot-management", label: "Slot Management", icon: Car, isWorking: true },
  { id: "vehicle-management", label: "Vehicle Management", icon: Car, isWorking: true },
  { id: "user-management", label: "User Management", icon: Users, isWorking: true },
  { id: "parking-locations", label: "Parking Locations", icon: MapPin, isWorking: true },
  { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3, isWorking: true },
  { id: "notifications", label: "Notifications & Alerts", icon: Bell, isWorking: true },
  { id: "system-settings", label: "System Settings", icon: Settings, isWorking: true },
  { id: "support-logs", label: "Support & Audit Logs", icon: HelpCircle, isWorking: true },
];

const INITIAL_24_SLOTS = [
  { id: 1, slot_number: "A-01", zone: "Zone A", slot_type: "Standard", status: "available", is_available: true, hourly_rate: "50" },
  { id: 2, slot_number: "A-02", zone: "Zone A", slot_type: "Standard", status: "occupied", is_available: false, hourly_rate: "50" },
  { id: 3, slot_number: "A-03", zone: "Zone A", slot_type: "Standard", status: "reserved", is_available: false, hourly_rate: "50" },
  { id: 4, slot_number: "A-04", zone: "Zone A", slot_type: "Standard", status: "occupied", is_available: false, hourly_rate: "50" },
  { id: 5, slot_number: "A-05", zone: "Zone A", slot_type: "Standard", status: "available", is_available: true, hourly_rate: "50" },
  { id: 6, slot_number: "A-06", zone: "Zone A", slot_type: "Standard", status: "reserved", is_available: false, hourly_rate: "50" },

  { id: 7, slot_number: "B-01", zone: "Zone B", slot_type: "Standard", status: "occupied", is_available: false, hourly_rate: "50" },
  { id: 8, slot_number: "B-02", zone: "Zone B", slot_type: "Standard", status: "available", is_available: true, hourly_rate: "50" },
  { id: 9, slot_number: "B-03", zone: "Zone B", slot_type: "Standard", status: "available", is_available: true, hourly_rate: "50" },
  { id: 10, slot_number: "B-04", zone: "Zone B", slot_type: "Standard", status: "occupied", is_available: false, hourly_rate: "50" },
  { id: 11, slot_number: "B-05", zone: "Zone B", slot_type: "Standard", status: "reserved", is_available: false, hourly_rate: "50" },
  { id: 12, slot_number: "B-06", zone: "Zone B", slot_type: "Standard", status: "available", is_available: true, hourly_rate: "50" },

  { id: 13, slot_number: "C-01", zone: "Zone C", slot_type: "VIP / EV", status: "available", is_available: true, hourly_rate: "80" },
  { id: 14, slot_number: "C-02", zone: "Zone C", slot_type: "VIP / EV", status: "reserved", is_available: false, hourly_rate: "80" },
  { id: 15, slot_number: "C-03", zone: "Zone C", slot_type: "VIP / EV", status: "occupied", is_available: false, hourly_rate: "80" },
  { id: 16, slot_number: "C-04", zone: "Zone C", slot_type: "VIP / EV", status: "available", is_available: true, hourly_rate: "80" },
  { id: 17, slot_number: "C-05", zone: "Zone C", slot_type: "VIP / EV", status: "occupied", is_available: false, hourly_rate: "80" },
  { id: 18, slot_number: "C-06", zone: "Zone C", slot_type: "VIP / EV", status: "available", is_available: true, hourly_rate: "80" },

  { id: 19, slot_number: "D-01", zone: "Zone D", slot_type: "Bike", status: "occupied", is_available: false, hourly_rate: "25" },
  { id: 20, slot_number: "D-02", zone: "Zone D", slot_type: "Bike", status: "available", is_available: true, hourly_rate: "25" },
  { id: 21, slot_number: "D-03", zone: "Zone D", slot_type: "Bike", status: "reserved", is_available: false, hourly_rate: "25" },
  { id: 22, slot_number: "D-04", zone: "Zone D", slot_type: "Bike", status: "occupied", is_available: false, hourly_rate: "25" },
  { id: 23, slot_number: "D-05", zone: "Zone D", slot_type: "Bike", status: "available", is_available: true, hourly_rate: "25" },
  { id: 24, slot_number: "D-06", zone: "Zone D", slot_type: "Bike", status: "available", is_available: true, hourly_rate: "25" },
];

function formatExactDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return dateStr;
  }
}

const INITIAL_RECENT_BOOKINGS = [
  { id: "#BK12345", user: "Laiba", location: "Downtown Plaza", vehicle: "KA01 AB 1234", date: "23 Sep 2026, 09:00 am", status: "Confirmed", amount: "₹150.00" },
  { id: "#BK12344", user: "Laiba Taj", location: "City Mall Parking", vehicle: "KA02 CD 5678", date: "23 Sep 2026, 08:00 am", status: "Pending", amount: "₹100.00" },
  { id: "#BK12343", user: "Taj", location: "Airport Parking", vehicle: "KA03 EF 9012", date: "23 Sep 2026, 06:00 am", status: "Completed", amount: "₹300.00" },
  { id: "#BK12342", user: "Laiba", location: "Grand Center", vehicle: "KA04 GH 3456", date: "23 Sep 2026, 02:00 am", status: "Confirmed", amount: "₹225.00" },
];

export default function AdminDashboard({ setView }) {
  const navigate = useNavigate();
  const { tab } = useParams();

  const normalizeTab = (rawTab) => {
    if (!rawTab || rawTab === "dashboard" || rawTab === "overview") return "dashboard";
    if (rawTab === "bookings") return "bookings-reservations";
    if (rawTab === "plans") return "pricing-plans";
    if (rawTab === "records") return "parking-records";
    if (rawTab === "active-parking") return "active-parking-sessions";
    if (rawTab === "revenue") return "payments-revenue";
    if (rawTab === "occupancy") return "parking-occupancy";
    if (rawTab === "slots") return "slot-management";
    if (rawTab === "vehicles") return "vehicle-management";
    if (rawTab === "users") return "user-management";
    if (rawTab === "locations") return "parking-locations";
    if (rawTab === "reports") return "reports-analytics";
    if (rawTab === "settings") return "system-settings";
    if (rawTab === "logs") return "support-logs";
    return rawTab;
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(tab));
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("shnoor_current_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (tab) {
      const normalized = normalizeTab(tab);
      const match = ADMIN_SIDEBAR_ITEMS.find((item) => item.id === normalized);
      if (match && activeTab !== normalized) {
        setActiveTab(normalized);
      }
    } else {
      navigate("/admin/dashboard/overview", { replace: true });
    }
  }, [tab, activeTab, navigate]);

  useEffect(() => {
    const current = ADMIN_SIDEBAR_ITEMS.find((item) => item.id === activeTab);
    const label = current ? current.label : "Dashboard Overview";
    document.title = `Admin Dashboard - ${label} | ParkSafe`;
  }, [activeTab]);

  const handleTabChange = (itemId) => {
    const target = normalizeTab(itemId);
    setActiveTab(target);
    setIsMobileNavOpen(false);
    if (target === "dashboard") {
      navigate("/admin/dashboard/overview");
    } else {
      navigate(`/admin/dashboard/${target}`);
    }
  };

  const [usersList, setUsersList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [slots, setSlots] = useState(INITIAL_24_SLOTS);

  const [metrics, setMetrics] = useState({
    totalBookings: "1,248",
    totalRevenue: "₹1,34,500",
    activeParkings: "8",
    totalUsers: "12",
  });

  const [recentBookings, setRecentBookings] = useState(INITIAL_RECENT_BOOKINGS);

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.users) {
          const normalized = data.users.map((u) => ({
            ...u,
            status: u.status || "Active",
            phone: u.phone || "+91 98765 43210"
          }));
          setUsersList(normalized);
          setMetrics((prev) => ({
            ...prev,
            totalUsers: String(normalized.length)
          }));
        }
      })
      .catch(() => {});
  };

  const fetchVehicles = () => {
    fetch(`${API_BASE_URL}/api/admin/vehicles`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.vehicles) {
          setVehiclesList(data.vehicles);
        }
      })
      .catch(() => {});
  };

  const fetchDashboardData = () => {
    fetch(`${API_BASE_URL}/api/admin/dashboard-overview`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.slots && data.slots.length > 0) {
            setSlots(data.slots);
          }
          if (data.stats) {
            setMetrics((prev) => ({
              ...prev,
              totalBookings: data.stats.totalSlots ? (data.stats.totalSlots * 52).toLocaleString("en-IN") : "1,248",
              totalRevenue: `₹${(data.stats.todayRevenue ? data.stats.todayRevenue * 100 : 134500).toLocaleString("en-IN")}`,
              activeParkings: String(data.stats.occupiedSlots || 8),
            }));
            if (data.activeSessions && data.activeSessions.length > 0) {
              setRecentBookings(
                data.activeSessions.slice(0, 4).map((s, idx) => ({
                  id: s.booking_id || `#BK${12340 + idx}`,
                  user: s.user_name || (idx === 0 ? "Laiba" : idx === 1 ? "Laiba Taj" : "Taj"),
                  location: "Downtown Plaza",
                  vehicle: s.vehicle_number || "KA01 AB 1234",
                  date: formatExactDateTime(s.created_at || s.entry_time || new Date()),
                  status: s.status === "Active" ? "Confirmed" : (s.status || "Confirmed"),
                  amount: s.amount || (idx === 0 ? "₹150.00" : idx === 1 ? "₹100.00" : idx === 2 ? "₹300.00" : "₹225.00")
                }))
              );
            }
          }
        }
      })
      .catch(() => {});
  };

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
      if (parsed.role !== "admin") {
        if (setView) {
          setView("login");
        } else {
          navigate("/login");
        }
        return;
      }
      setCurrentUser(parsed);
    } catch {
      if (setView) {
        setView("login");
      } else {
        navigate("/login");
      }
      return;
    }

    fetchUsers();
    fetchVehicles();
    fetchDashboardData();
  }, [navigate, setView]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem("shnoor_current_user");
      localStorage.removeItem("shnoor_auth_state");
    } catch {
      void 0;
    }
    if (setView) {
      setView("landing");
    } else {
      navigate("/");
    }
  };

  const getSlotState = (slot) => {
    if (!slot.is_available) {
      if (slot.status === "reserved") return "reserved";
      return "occupied";
    }
    return "available";
  };

  const handleSlotStatusChange = (slotId, newStatus) => {
    const isAvail = newStatus === "available";
    fetch(`${API_BASE_URL}/api/admin/slots/${slotId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        is_available: isAvail
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSlots((prev) =>
            prev.map((s) =>
              s.id === slotId ? { ...s, status: newStatus, is_available: isAvail } : s
            )
          );
          setStatusActionMessage(`Slot ${data.slot?.slot_number || slotId} status updated to ${newStatus}.`);
          setTimeout(() => setStatusActionMessage(""), 4000);
        }
      })
      .catch(() => {});
  };

  const availableCount = slots.filter((s) => getSlotState(s) === "available").length;
  const occupiedCount = slots.filter((s) => getSlotState(s) === "occupied").length;
  const reservedCount = slots.filter((s) => getSlotState(s) === "reserved").length;

  const formatDate = (isoStr) => {
    if (!isoStr) return "Just now";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  const getPageTitle = () => {
    if (activeTab === "bookings-reservations") return "Bookings & Reservations";
    if (activeTab === "pricing-plans") return "Tariff Configuration & Pricing Plans";
    if (activeTab === "parking-records") return "System Parking Records & Audit Ledger";
    if (activeTab === "active-parking-sessions") return "Active Parking Sessions";
    if (activeTab === "payments-revenue") return "Financial Analytics & Daily Revenue";
    if (activeTab === "parking-occupancy") return "Live Parking Occupancy Matrix";
    if (activeTab === "slot-management") return "Spatial Bay & Zone Management";
    if (activeTab === "vehicle-management") return "Registered Vehicle Database";
    if (activeTab === "user-management") return "User & Personnel Management";
    if (activeTab === "parking-locations") return "Multi-Location Parking Garages";
    if (activeTab === "reports-analytics") return "Enterprise Reports & Business Analytics";
    if (activeTab === "notifications") return "Notifications & Alerts";
    if (activeTab === "system-settings") return "Global Platform Configuration";
    if (activeTab === "support-logs") return "System Health & Security Audit Logs";
    return "Management Dashboard";
  };

  const getPageSubtitle = () => {
    if (activeTab === "bookings-reservations") return "Live reservation pipeline, pre-paid passes, and arrival schedules.";
    if (activeTab === "pricing-plans") return "Configure hourly rates, special event tiers, and subscription packages.";
    if (activeTab === "parking-records") return "Historical log of all completed, active, and cancelled vehicle visits.";
    if (activeTab === "active-parking-sessions") return "Live real-time inventory of all currently occupied parking bays.";
    if (activeTab === "payments-revenue") return "Real-time fee collection, UPI/Card settlements, and revenue projections.";
    if (activeTab === "parking-occupancy") return "Bay-by-bay status monitor across all floors, zones, and facilities.";
    if (activeTab === "slot-management") return "Create new parking slots, assign RFID sensors, and update maintenance states.";
    if (activeTab === "vehicle-management") return "Track registered license plates, vehicle classifications, and fast pass tags.";
    if (activeTab === "user-management") return "Manage administrator credentials, operator shift access, and customer accounts.";
    if (activeTab === "parking-locations") return "Oversee multi-site parking facilities, geo-coordinates, and operational hours.";
    if (activeTab === "reports-analytics") return "Data visualisations, peak hour analysis, and exportable financial reports.";
    if (activeTab === "notifications") return "System-wide alert history, revenue milestones, and administrative notifications.";
    if (activeTab === "system-settings") return "Database connectivity, IoT hardware gates, and platform security flags.";
    if (activeTab === "support-logs") return "Immutable operational logs, system diagnostics, and emergency dispatch trails.";
    return "Live operations overview, facility occupancy, and real-time revenue stats.";
  };

  return (
    <div className="pw-dashboard-app">
      <div
        className={`pw-sidebar-backdrop ${isMobileNavOpen ? "open" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <aside className={`pw-dashboard-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        <div className="pw-sidebar-brand" onClick={() => (setView ? setView("landing") : navigate("/"))}>
          <div className="pw-brand-logo-box">
            <span className="pw-p-logo">P</span>
          </div>
          <div>
            <span className="pw-brand-word text-white" style={{ fontSize: "1.1rem" }}>ParkSafe</span>
            <div style={{ fontSize: "0.64rem", color: "#94a3b8", marginTop: "-2px" }}>Smart Parking. Smarter You.</div>
          </div>
        </div>

        <div className="pw-sidebar-menu">
          {ADMIN_SIDEBAR_ITEMS.map((item) => {
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
                placeholder="Search slot, plate number, user..."
                className="pw-search-input"
              />
            </div>
          </div>

          <div className="pw-topbar-right">
            <ThemeToggle />
            <NotificationBell userEmail={currentUser?.email || "admin@shnoor.com"} />

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials">AD</div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">{currentUser?.name || "System Admin"}</span>
                <span className="pw-user-profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="pw-page-title" style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                {getPageTitle()}
              </h1>
              {getPageSubtitle() && (
                <p className="pw-page-subtitle" style={{ color: "var(--text-secondary, #94a3b8)", marginTop: "2px", fontSize: "0.85rem" }}>
                  {getPageSubtitle()}
                </p>
              )}
            </div>
          </div>

          {statusActionMessage && (
            <div className="pw-user-action-alert" style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <CheckCircle size={16} />
              <span>{statusActionMessage}</span>
            </div>
          )}

          <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Loading module...</div>}>
            {activeTab === "dashboard" && (
              <AdminOverview
                metrics={metrics}
                recentBookings={recentBookings}
                slots={slots}
                getSlotState={getSlotState}
                availableCount={availableCount}
                occupiedCount={occupiedCount}
                reservedCount={reservedCount}
                setActiveTab={handleTabChange}
              />
            )}

            {activeTab === "bookings-reservations" && (
              <BookingsReservations
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "pricing-plans" && (
              <PricingPlans
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "parking-records" && (
              <ParkingRecords
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "active-parking-sessions" && (
              <ActiveParkingSessions
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "payments-revenue" && (
              <TodaysRevenue
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "parking-occupancy" && (
              <ParkingOccupancy
                slots={slots}
                getSlotState={getSlotState}
                handleSlotStatusChange={handleSlotStatusChange}
                availableCount={availableCount}
                occupiedCount={occupiedCount}
                reservedCount={reservedCount}
              />
            )}

            {activeTab === "slot-management" && (
              <ParkingSlotManagement
                slots={slots}
                getSlotState={getSlotState}
                fetchDashboardData={fetchDashboardData}
                setStatusActionMessage={setStatusActionMessage}
                handleSlotStatusChange={handleSlotStatusChange}
                availableCount={availableCount}
                occupiedCount={occupiedCount}
                reservedCount={reservedCount}
              />
            )}

            {activeTab === "vehicle-management" && (
              <VehicleManagement
                vehiclesList={vehiclesList}
                slots={slots}
                fetchVehicles={fetchVehicles}
                formatDate={formatDate}
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "user-management" && (
              <UserManagement
                usersList={usersList}
                setUsersList={setUsersList}
                fetchUsers={fetchUsers}
                formatDate={formatDate}
                setStatusActionMessage={setStatusActionMessage}
              />
            )}

            {activeTab === "parking-locations" && (
              <ParkingLocations />
            )}

            {activeTab === "reports-analytics" && (
              <ReportsAnalytics />
            )}

            {activeTab === "notifications" && (
              <AdminNotifications currentUser={currentUser} />
            )}

            {activeTab === "system-settings" && (
              <SystemSettings />
            )}

            {activeTab === "support-logs" && (
              <SupportAuditLogs />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

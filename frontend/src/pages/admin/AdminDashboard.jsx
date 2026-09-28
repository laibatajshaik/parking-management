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
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, isWorking: true },
  { id: "bookings-reservations", label: "Bookings", icon: CalendarCheck, isWorking: true },
  { id: "pricing-plans", label: "Pricing", icon: CreditCard, isWorking: true },
  { id: "parking-records", label: "Records", icon: CalendarCheck, isWorking: true },
  { id: "active-parking-sessions", label: "Active Parking", icon: Car, isWorking: true },
  { id: "payments-revenue", label: "Revenue", icon: CreditCard, isWorking: true },
  { id: "parking-occupancy", label: "Occupancy", icon: Car, isWorking: true },
  { id: "slot-management", label: "Slots", icon: Car, isWorking: true },
  { id: "vehicle-management", label: "Vehicles", icon: Car, isWorking: true },
  { id: "user-management", label: "Users", icon: Users, isWorking: true },
  { id: "parking-locations", label: "Locations", icon: MapPin, isWorking: true },
  { id: "reports-analytics", label: "Reports", icon: BarChart3, isWorking: true },
  { id: "notifications", label: "Notifications", icon: Bell, isWorking: true },
  { id: "system-settings", label: "Settings", icon: Settings, isWorking: true },
  { id: "support-logs", label: "Support & Logs", icon: HelpCircle, isWorking: true },
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
    const label = current ? current.label : "Dashboard";
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
  const [slots, setSlots] = useState([]);

  const [metrics, setMetrics] = useState({
    totalBookings: "0",
    totalRevenue: "₹0",
    activeParkings: "0",
    totalUsers: "0",
  });

  const [recentBookings, setRecentBookings] = useState([]);

  const fetchUsers = () => {
    fetch(`${API_BASE_URL}/api/admin/users`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.users) {
          const normalized = data.users.map((u) => ({
            ...u,
            status: u.status || "Active",
            phone: u.phone || "—"
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
          if (data.slots) {
            setSlots(data.slots);
          }
          if (data.stats) {
            setMetrics((prev) => ({
              ...prev,
              totalBookings: (data.stats.totalBookings || 0).toLocaleString("en-IN"),
              totalRevenue: `₹${(data.stats.totalRevenue || 0).toLocaleString("en-IN")}`,
              activeParkings: String(data.stats.occupiedSlots || 0),
              totalUsers: String(data.stats.totalUsers || prev.totalUsers || 0)
            }));
          }
          if (data.activeSessions) {
            setRecentBookings(
              data.activeSessions.slice(0, 5).map((s, idx) => ({
                id: s.booking_id || `#BK${1000 + idx}`,
                user: s.user_name || "Customer",
                location: s.zone || "Zone A",
                vehicle: s.vehicle_number || "—",
                date: formatExactDateTime(s.created_at || new Date()),
                status: s.status || "Active",
                amount: s.amount || "₹0.00"
              }))
            );
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
    if (activeTab === "bookings-reservations") return "Bookings";
    if (activeTab === "pricing-plans") return "Pricing";
    if (activeTab === "parking-records") return "Records";
    if (activeTab === "active-parking-sessions") return "Active Parking";
    if (activeTab === "payments-revenue") return "Revenue";
    if (activeTab === "parking-occupancy") return "Occupancy";
    if (activeTab === "slot-management") return "Slots";
    if (activeTab === "vehicle-management") return "Vehicles";
    if (activeTab === "user-management") return "Users";
    if (activeTab === "parking-locations") return "Locations";
    if (activeTab === "reports-analytics") return "Reports";
    if (activeTab === "notifications") return "Notifications";
    if (activeTab === "system-settings") return "Settings";
    if (activeTab === "support-logs") return "Support & Logs";
    return "Dashboard";
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

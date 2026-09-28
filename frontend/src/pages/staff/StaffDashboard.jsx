import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LayoutDashboard,
  Calculator,
  Car,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  BarChart3,
  Bell,
  HelpCircle,
  LogOut as LogOutIcon,
  Search,
  Menu,
  CheckCircle,
  ChevronDown
} from "lucide-react";
import StaffOverview from "./StaffOverview.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";
import NotificationBell from "../../components/NotificationBell.jsx";

const VehicleEntry = lazy(() => import("./VehicleEntry.jsx"));
const ActiveParking = lazy(() => import("./ActiveParking.jsx"));
const Payment = lazy(() => import("./Payment.jsx"));
const VehicleExit = lazy(() => import("./VehicleExit.jsx"));
const FeeCalculation = lazy(() => import("./FeeCalculation.jsx"));
const ReservationValidation = lazy(() => import("./ReservationValidation.jsx"));
const StaffSlotAssignment = lazy(() => import("./StaffSlotAssignment.jsx"));
const StaffParkingRecords = lazy(() => import("./StaffParkingRecords.jsx"));
const StaffShiftReports = lazy(() => import("./StaffShiftReports.jsx"));
const StaffNotifications = lazy(() => import("./StaffNotifications.jsx"));
const StaffSupport = lazy(() => import("./StaffSupport.jsx"));

const STAFF_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, isWorking: true },
  { id: "vehicle-entry", label: "Entry", icon: Car, isWorking: true },
  { id: "slot-assignment", label: "Slots", icon: MapPin, isWorking: true },
  { id: "active-parking", label: "Active Parking", icon: Car, isWorking: true },
  { id: "vehicle-exit", label: "Exit", icon: LogOutIcon, isWorking: true },
  { id: "fee-calculation", label: "Fees", icon: Calculator, isWorking: true },
  { id: "payment", label: "Payments", icon: CreditCard, isWorking: true },
  { id: "reservation-validation", label: "Reservations", icon: Calendar, isWorking: true },
  { id: "parking-records", label: "Records", icon: FileText, isWorking: true },
  { id: "reports", label: "Reports", icon: BarChart3, isWorking: true },
  { id: "notifications", label: "Notifications", icon: Bell, isWorking: true },
  { id: "support", label: "Support", icon: HelpCircle, isWorking: true },
];

export default function StaffDashboard({ setView }) {
  const navigate = useNavigate();
  const { tab } = useParams();

  const normalizeTab = (rawTab) => {
    if (!rawTab || rawTab === "dashboard" || rawTab === "overview") return "dashboard";
    if (rawTab === "entry") return "vehicle-entry";
    if (rawTab === "exit") return "vehicle-exit";
    if (rawTab === "slots") return "slot-assignment";
    if (rawTab === "records") return "parking-records";
    return rawTab;
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(tab));
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState(null);
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
      const match = STAFF_SIDEBAR_ITEMS.find((item) => item.id === normalized);
      if (match && activeTab !== normalized) {
        setActiveTab(normalized);
      }
    } else {
      navigate("/staff/dashboard/overview", { replace: true });
    }
  }, [tab, activeTab, navigate]);

  useEffect(() => {
    const current = STAFF_SIDEBAR_ITEMS.find((item) => item.id === activeTab);
    const label = current ? current.label : "Dashboard";
    document.title = `Staff Dashboard - ${label} | ParkSafe`;
  }, [activeTab]);

  const handleTabChange = (itemId) => {
    const target = normalizeTab(itemId);
    setActiveTab(target);
    setIsMobileNavOpen(false);
    if (target === "dashboard") {
      navigate("/staff/dashboard/overview");
    } else {
      navigate(`/staff/dashboard/${target}`);
    }
  };

  const [metrics, setMetrics] = useState({
    todayBookings: "0",
    availableSlots: "0",
    todayRevenue: "₹0",
    activeVehicles: "0",
    occupiedPercent: 0,
  });

  const [recentEntries, setRecentEntries] = useState([]);

  const fetchStaffDashboard = () => {
    fetch(`${API_BASE_URL}/api/staff/dashboard-overview`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.metrics) {
            setMetrics({
              todayBookings: data.metrics.todayBookings || "0",
              availableSlots: data.metrics.availableSlots || "0",
              todayRevenue: data.metrics.todayRevenue || "₹0",
              activeVehicles: data.metrics.activeVehicles || "0",
              occupiedPercent: data.metrics.occupancyRate || 0,
            });
          }
          if (data.recentEntries) {
            setRecentEntries(
              data.recentEntries.map((e, idx) => ({
                id: `#ENT-${1000 + (e.id || idx)}`,
                plate: e.vehicle_number,
                slot: e.slot_number,
                type: e.vehicle_type || (e.slot_number?.startsWith("D") ? "Bike" : e.slot_number?.startsWith("C") ? "EV" : "Car"),
                time: e.entry_time
                  ? new Date(e.entry_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                  : "Recently",
                status: e.status || "Active"
              }))
            );
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStaffDashboard();
  }, []);

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
      if (parsed.role !== "staff" && parsed.role !== "admin") {
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
    fetch(`${API_BASE_URL}/api/admin/dashboard-overview`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setMetrics({
            todayBookings: String(data.stats.totalBookings || 0),
            availableSlots: String(data.stats.availableSlots ?? 0),
            todayRevenue: `₹${(parseFloat(data.stats.todayRevenue) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            activeVehicles: String(data.stats.occupiedSlots || 0),
            occupiedPercent: data.stats.occupancyRate || 0,
          });
        }
      })
      .catch(() => {});
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

  const handleSelectVehicleForPayment = (veh) => {
    setSelectedVehicleForPayment(veh);
    handleTabChange("payment");
  };

  const handleNavigateToEntryWithSlot = () => {
    handleTabChange("vehicle-entry");
  };

  const getPageTitle = () => {
    if (activeTab === "vehicle-entry") return "Entry";
    if (activeTab === "slot-assignment") return "Slots";
    if (activeTab === "active-parking") return "Active Parking";
    if (activeTab === "vehicle-exit") return "Exit";
    if (activeTab === "fee-calculation") return "Fees";
    if (activeTab === "payment") return "Payments";
    if (activeTab === "reservation-validation") return "Reservations";
    if (activeTab === "parking-records") return "Records";
    if (activeTab === "reports") return "Reports";
    if (activeTab === "notifications") return "Notifications";
    if (activeTab === "support") return "Support";
    return "Dashboard";
  };

  const getPageSubtitle = () => {
    if (activeTab === "vehicle-entry") return "Register walk-in vehicles, scan barcodes, and allocate empty parking bays.";
    if (activeTab === "slot-assignment") return "Live spatial bay oversight across all floors, status overrides, and walk-in allocation.";
    if (activeTab === "active-parking") return "Real-time management of parked vehicles and checkout initiation.";
    if (activeTab === "vehicle-exit") return "Process vehicle departures, free up parking bays, and issue exit passes.";
    if (activeTab === "fee-calculation") return "Select vehicle details and plan to calculate the accurate parking fee.";
    if (activeTab === "payment") return "Calculate tariffs, collect payments, and generate digital receipts.";
    if (activeTab === "reservation-validation") return "Scan booking QR codes and validate customer reservation passes.";
    if (activeTab === "parking-records") return "Comprehensive audit ledger of all inbound and outbound vehicles during shift.";
    if (activeTab === "reports") return "Current shift cash drawer balance, digital payments settlement, and handover closure.";
    if (activeTab === "notifications") return "Operational dispatch notices, gate entry alerts, and occupancy alerts.";
    if (activeTab === "support") return "Manual barrier emergency override, security radio channels, and incident reporting.";
    return `Operator: ${currentUser?.name || "Staff Operator"} | Gate: North Entry`;
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
          {STAFF_SIDEBAR_ITEMS.map((item) => {
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
            <LogOutIcon size={16} />
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
                placeholder="Search by Ticket / plate number / customer name..."
                className="pw-search-input"
              />
            </div>
          </div>

          <div className="pw-topbar-right">
            <ThemeToggle />
            <NotificationBell userEmail={currentUser?.email} />

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials" style={{ background: "#0d9488", color: "#ffffff" }}>
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "ST"}
              </div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">{currentUser?.name || "Staff Operator"}</span>
                <span className="pw-user-profile-role">Staff Operator</span>
              </div>
              <ChevronDown size={14} style={{ color: "#94a3b8", marginLeft: "2px" }} />
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

            {activeTab === "fee-calculation" && (
              <div className="pw-date-time-box" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card, #ffffff)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <Calendar size={16} style={{ color: "#0d9488" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                    {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #94a3b8)" }}>
                    {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {statusActionMessage && (
            <div className="pw-user-action-alert" style={{ background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <CheckCircle size={16} />
              <span>{statusActionMessage}</span>
            </div>
          )}

          <Suspense fallback={<div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>Loading module...</div>}>
            {activeTab === "dashboard" && (
              <StaffOverview
                metrics={metrics}
                recentEntries={recentEntries}
                setActiveTab={handleTabChange}
                userEmail={currentUser?.email}
              />
            )}

            {activeTab === "vehicle-entry" && (
              <VehicleEntry
                onEntrySuccess={(entryData) => {
                  setStatusActionMessage(`Vehicle ${entryData.plate} successfully checked into Bay ${entryData.slot}`);
                  setTimeout(() => setStatusActionMessage(""), 4000);
                }}
              />
            )}

            {activeTab === "slot-assignment" && (
              <StaffSlotAssignment
                onNavigateToEntry={handleNavigateToEntryWithSlot}
              />
            )}

            {activeTab === "active-parking" && (
              <ActiveParking
                onCheckout={(vehicle) => {
                  handleSelectVehicleForPayment(vehicle);
                }}
              />
            )}

            {activeTab === "vehicle-exit" && (
              <VehicleExit
                onExitSuccess={(exitData) => {
                  setStatusActionMessage(`Vehicle ${exitData.plate} cleared from Bay ${exitData.slot}`);
                  setTimeout(() => setStatusActionMessage(""), 4000);
                }}
              />
            )}

            {activeTab === "fee-calculation" && (
              <FeeCalculation
                onProceedToPayment={(calcData) => {
                  setSelectedVehicleForPayment(calcData);
                  handleTabChange("payment");
                }}
              />
            )}

            {activeTab === "payment" && (
              <Payment
                selectedVehicle={selectedVehicleForPayment}
                onPaymentSuccess={() => {
                  setSelectedVehicleForPayment(null);
                  setStatusActionMessage("Payment successfully collected and digital pass issued.");
                  setTimeout(() => setStatusActionMessage(""), 4000);
                }}
              />
            )}

            {activeTab === "reservation-validation" && (
              <ReservationValidation
                onProceedToEntry={() => {
                  handleTabChange("vehicle-entry");
                }}
              />
            )}

            {activeTab === "parking-records" && (
              <StaffParkingRecords />
            )}

            {activeTab === "reports" && (
              <StaffShiftReports />
            )}

            {activeTab === "notifications" && (
              <StaffNotifications currentUser={currentUser} />
            )}

            {activeTab === "support" && (
              <StaffSupport />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

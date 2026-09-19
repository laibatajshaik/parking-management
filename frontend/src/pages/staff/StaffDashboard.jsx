import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Calculator, Car, Calendar, MapPin, CreditCard, FileText, BarChart3, HelpCircle, Bell, LogOut as LogOutIcon, Search, Menu, CheckCircle, ChevronDown } from "lucide-react";
import StaffOverview from "./StaffOverview.jsx";
import VehicleEntry from "./VehicleEntry.jsx";
import ActiveParking from "./ActiveParking.jsx";
import Payment from "./Payment.jsx";
import VehicleExit from "./VehicleExit.jsx";
import FeeCalculation from "./FeeCalculation.jsx";
import ReservationValidation from "./ReservationValidation.jsx";
import StaffSlotAssignment from "./StaffSlotAssignment.jsx";
import StaffParkingRecords from "./StaffParkingRecords.jsx";
import StaffShiftReports from "./StaffShiftReports.jsx";
import StaffSupport from "./StaffSupport.jsx";
import ThemeToggle from "../../components/ThemeToggle.jsx";

const STAFF_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, isWorking: true },
  { id: "fee-calculation", label: "Fee Calculation", icon: Calculator, isWorking: true },
  { id: "vehicle-entry", label: "Vehicle Entry/Exit", icon: Car, isWorking: true },
  { id: "reservation-validation", label: "Reservation Validation", icon: Calendar, isWorking: true },
  { id: "slot-assignment", label: "Parking Slots", icon: MapPin, isWorking: true },
  { id: "payment", label: "Payment", icon: CreditCard, isWorking: true },
  { id: "parking-records", label: "Parking Records", icon: FileText, isWorking: true },
  { id: "reports", label: "Reports", icon: BarChart3, isWorking: true },
  { id: "support", label: "Support / Help", icon: HelpCircle, isWorking: true },
];

export default function StaffDashboard({ setView }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("fee-calculation");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [statusActionMessage, setStatusActionMessage] = useState("");
  const [selectedVehicleForPayment, setSelectedVehicleForPayment] = useState(null);

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
            todayBookings: String(data.stats.totalSlots ? data.stats.totalSlots * 2 : 42),
            availableSlots: String(data.stats.availableSlots || 58),
            todayRevenue: `₹${((data.stats.todayRevenue || 840) * 100).toLocaleString("en-IN")}`,
            activeVehicles: String(data.stats.occupiedSlots || 36),
            occupiedPercent: data.stats.occupancyRate || 62,
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
    setActiveTab("payment");
  };

  const handleNavigateToEntryWithSlot = () => {
    setActiveTab("vehicle-entry");
  };

  const getPageTitle = () => {
    if (activeTab === "fee-calculation") return "Calculate Parking Fee";
    if (activeTab === "reservation-validation") return "Reservation Validation";
    if (activeTab === "vehicle-entry") return "Vehicle Entry/Exit";
    if (activeTab === "active-parking") return "Active Parking Operations";
    if (activeTab === "payment") return "Process Parking Payment";
    if (activeTab === "vehicle-exit") return "Vehicle Departure & Exit";
    if (activeTab === "slot-assignment") return "Live Parking Slots & Bay Assignment";
    if (activeTab === "parking-records") return "Staff Parking Records & Check-in Ledger";
    if (activeTab === "reports") return "Duty Shift Reports & Cash Reconciliation";
    if (activeTab === "support") return "Emergency Controls & Gate Support";
    return "Operator Console";
  };

  const getPageSubtitle = () => {
    if (activeTab === "fee-calculation") return "Select vehicle details and plan to calculate the parking fee.";
    if (activeTab === "reservation-validation") return "";
    if (activeTab === "vehicle-entry") return "";
    if (activeTab === "active-parking") return "Real-time management of parked vehicles and checkout initiation";
    if (activeTab === "payment") return "Calculate tariffs, collect payments, and generate digital receipts";
    if (activeTab === "vehicle-exit") return "Process vehicle departures, free up parking bays, and issue exit receipts";
    if (activeTab === "slot-assignment") return "Live spatial bay oversight across all floors, status overrides, and walk-in allocation";
    if (activeTab === "parking-records") return "Comprehensive audit ledger of all inbound and outbound vehicles during shift";
    if (activeTab === "reports") return "Current shift cash drawer balance, digital payments settlement, and handover closure";
    if (activeTab === "support") return "Manual barrier emergency override, security radio channels, and incident reporting";
    return "Operator: Laiba Taj | Shift: Morning Duty | Gate: North Entry";
  };

  return (
    <div className="pw-dashboard-app">
      <div
        className={`pw-sidebar-backdrop ${isMobileNavOpen ? "open" : ""}`}
        onClick={() => setIsMobileNavOpen(false)}
      />
      <aside className={`pw-dashboard-sidebar ${isMobileNavOpen ? "open" : ""}`}>
        <div className="pw-sidebar-brand" onClick={() => setView("landing")}>
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
                    setActiveTab(item.id);
                    setIsMobileNavOpen(false);
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
                placeholder="Search by Ticket / plate number / customer name..."
                className="pw-search-input"
              />
            </div>
          </div>

          <div className="pw-topbar-right">
            <ThemeToggle />
            <div className="pw-topbar-bell">
              <Bell size={18} />
              <span className="pw-bell-dot" style={{ width: "8px", height: "8px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", background: "#ef4444" }}>1</span>
            </div>

            <div className="pw-user-profile-pill">
              <div className="pw-avatar-initials" style={{ background: "#0d9488", color: "#ffffff" }}>LT</div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">Laiba Taj</span>
                <span className="pw-user-profile-role">Staff Operator</span>
              </div>
              <ChevronDown size={14} style={{ color: "#94a3b8", marginLeft: "2px" }} />
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 className="pw-page-title" style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{getPageTitle()}</h1>
              {getPageSubtitle() && <p className="pw-page-subtitle" style={{ color: "var(--text-secondary, #94a3b8)", marginTop: "2px", fontSize: "0.85rem" }}>{getPageSubtitle()}</p>}
            </div>

            {activeTab === "fee-calculation" && (
              <div className="pw-date-time-box" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card, #ffffff)", padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <Calendar size={16} style={{ color: "#0d9488" }} />
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>Tuesday, 2 Sep 2025</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-secondary, #94a3b8)" }}>10:24 AM</div>
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

          {activeTab === "dashboard" && (
            <StaffOverview
              metrics={metrics}
              recentEntries={recentEntries}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === "fee-calculation" && (
            <FeeCalculation
              onProceedToPayment={(calcData) => {
                setSelectedVehicleForPayment(calcData);
                setActiveTab("payment");
              }}
            />
          )}

          {activeTab === "reservation-validation" && (
            <ReservationValidation
              onProceedToEntry={() => {
                setActiveTab("vehicle-entry");
              }}
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

          {activeTab === "active-parking" && (
            <ActiveParking
              onCheckout={(vehicle) => {
                handleSelectVehicleForPayment(vehicle);
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

          {activeTab === "vehicle-exit" && (
            <VehicleExit
              onExitSuccess={(exitData) => {
                setStatusActionMessage(`Vehicle ${exitData.plate} cleared from Bay ${exitData.slot}`);
                setTimeout(() => setStatusActionMessage(""), 4000);
              }}
            />
          )}

          {activeTab === "slot-assignment" && (
            <StaffSlotAssignment
              onNavigateToEntry={handleNavigateToEntryWithSlot}
            />
          )}

          {activeTab === "parking-records" && (
            <StaffParkingRecords />
          )}

          {activeTab === "reports" && (
            <StaffShiftReports />
          )}

          {activeTab === "support" && (
            <StaffSupport />
          )}
        </div>
      </div>
    </div>
  );
}

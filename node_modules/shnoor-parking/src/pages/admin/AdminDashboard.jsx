import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  MapPin,
  CalendarCheck,
  CreditCard,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  Search,
  LogOut,
  Menu,
  CheckCircle
} from "lucide-react";
import AdminOverview from "./AdminOverview.jsx";
import ParkingOccupancy from "./ParkingOccupancy.jsx";
import ParkingSlotManagement from "./ParkingSlotManagement.jsx";
import VehicleManagement from "./VehicleManagement.jsx";
import UserManagement from "./UserManagement.jsx";

const ADMIN_SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard, isWorking: true },
  { id: "parking-occupancy", label: "Parking Occupancy", icon: Car, isWorking: true },
  { id: "slot-management", label: "Slot Management", icon: Car, isWorking: true },
  { id: "vehicle-management", label: "Vehicle Management", icon: Car, isWorking: true },
  { id: "user-management", label: "User Management", icon: Users, isWorking: true },
  { id: "parking-locations", label: "Parking Locations", icon: MapPin, isWorking: false },
  { id: "bookings-reservations", label: "Bookings & Reservations", icon: CalendarCheck, isWorking: false },
  { id: "pricing-plans", label: "Pricing & Plans", icon: CreditCard, isWorking: false },
  { id: "payments-revenue", label: "Payments & Revenue", icon: CreditCard, isWorking: false },
  { id: "reports-analytics", label: "Reports & Analytics", icon: BarChart3, isWorking: false },
  { id: "system-settings", label: "System Settings", icon: Settings, isWorking: false },
  { id: "support-logs", label: "Support & Audit Logs", icon: HelpCircle, isWorking: false },
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

export default function AdminDashboard({ setView }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [statusActionMessage, setStatusActionMessage] = useState("");

  const [usersList, setUsersList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [slots, setSlots] = useState(INITIAL_24_SLOTS);

  const [metrics, setMetrics] = useState({
    totalBookings: "1,248",
    totalRevenue: "₹1,34,500",
    activeParkings: "8",
    totalUsers: "12",
  });

  const [recentBookings, setRecentBookings] = useState([
    { id: "#BK12345", user: "Laiba", location: "Downtown Plaza", vehicle: "KA01 AB 1234", date: "May 27, 2026", status: "Confirmed", amount: "₹150.00" },
    { id: "#BK12344", user: "Laiba Taj", location: "City Mall Parking", vehicle: "KA02 CD 5678", date: "May 27, 2026", status: "Pending", amount: "₹100.00" },
    { id: "#BK12343", user: "Taj", location: "Airport Parking", vehicle: "KA03 EF 9012", date: "May 26, 2026", status: "Completed", amount: "₹300.00" },
    { id: "#BK12342", user: "Laiba", location: "Grand Center", vehicle: "KA04 GH 3456", date: "May 26, 2026", status: "Confirmed", amount: "₹225.00" },
  ]);

  const fetchUsers = () => {
    fetch("http://localhost:5000/api/admin/users")
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
    fetch("http://localhost:5000/api/admin/vehicles")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.vehicles) {
          setVehiclesList(data.vehicles);
        }
      })
      .catch(() => {});
  };

  const fetchDashboardData = () => {
    fetch("http://localhost:5000/api/admin/dashboard-overview")
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
                  id: `#BK${12340 + idx}`,
                  user: s.user_name || (idx === 0 ? "Laiba" : idx === 1 ? "Laiba Taj" : "Taj"),
                  location: "Downtown Plaza",
                  vehicle: s.vehicle_number || "KA01 AB 1234",
                  date: "May 27, 2026",
                  status: s.status === "Active" ? "Confirmed" : "Completed",
                  amount: idx === 0 ? "₹150.00" : idx === 1 ? "₹100.00" : idx === 2 ? "₹300.00" : "₹225.00"
                }))
              );
            }
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUsers();
    fetchVehicles();
  }, []);

  const handleSignOut = () => {
    if (setView) {
      setView("landing");
    } else {
      navigate("/");
    }
  };

  const handleSlotStatusChange = async (slotNumber, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/parking-slots/${slotNumber}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      setSlots((prev) =>
        prev.map((s) => (s.slot_number === slotNumber ? { ...s, status: newStatus, is_available: newStatus === "available" } : s))
      );
      setStatusActionMessage(`Slot ${slotNumber} status set to ${newStatus.toUpperCase()}`);
      setTimeout(() => setStatusActionMessage(""), 3500);
    } catch {
      setSlots((prev) =>
        prev.map((s) => (s.slot_number === slotNumber ? { ...s, status: newStatus, is_available: newStatus === "available" } : s))
      );
      setStatusActionMessage(`Slot ${slotNumber} status set to ${newStatus.toUpperCase()}`);
      setTimeout(() => setStatusActionMessage(""), 3500);
    }
  };

  const getSlotState = (bay) => {
    const raw = (bay.status || "").toLowerCase();
    if (raw === "reserved") return "reserved";
    if (raw === "occupied" || bay.is_available === false) return "occupied";
    return "available";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "May 10, 2026";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const getPageTitle = () => {
    if (activeTab === "parking-occupancy") return "Parking Occupancy";
    if (activeTab === "slot-management") return "Slot Management";
    if (activeTab === "vehicle-management") return "Vehicle Management";
    if (activeTab === "user-management") return "User Management";
    return "Dashboard Overview";
  };

  const getPageSubtitle = () => {
    if (activeTab === "parking-occupancy") return "Live spatial slot management: Available (Green), Occupied (Red), Reserved (Blue)";
    if (activeTab === "slot-management") return "";
    if (activeTab === "vehicle-management") return "";
    if (activeTab === "user-management") return "";
    return "Welcome back, Taj. Here is what's happening today.";
  };

  const availableCount = slots.filter((s) => getSlotState(s) === "available").length;
  const occupiedCount = slots.filter((s) => getSlotState(s) === "occupied").length;
  const reservedCount = slots.filter((s) => getSlotState(s) === "reserved").length;

  return (
    <div className="pw-dashboard-app">
      <aside className="pw-dashboard-sidebar">
        <div className="pw-sidebar-brand" onClick={() => setView("landing")}>
          <div className="pw-brand-logo-box">
            <span className="pw-p-logo">P</span>
          </div>
          <span className="pw-brand-word text-white">
            Park<span>Safe</span>
          </span>
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
                placeholder="Search anything..."
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
              <div className="pw-avatar-initials">T</div>
              <div className="pw-user-profile-meta">
                <span className="pw-user-profile-name">Taj</span>
                <span className="pw-user-profile-role">Super Admin</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pw-dashboard-body">
          <div className="pw-dashboard-title-row">
            <div>
              <h1 className="pw-page-title">{getPageTitle()}</h1>
              {getPageSubtitle() && <p className="pw-page-subtitle">{getPageSubtitle()}</p>}
            </div>
          </div>

          {statusActionMessage && (
            <div className="pw-user-action-alert">
              <CheckCircle size={16} />
              <span>{statusActionMessage}</span>
            </div>
          )}

          {activeTab === "dashboard" && (
            <AdminOverview
              metrics={metrics}
              recentBookings={recentBookings}
              setActiveTab={setActiveTab}
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
        </div>
      </div>
    </div>
  );
}

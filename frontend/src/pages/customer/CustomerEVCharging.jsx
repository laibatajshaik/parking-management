import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  Zap,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BatteryCharging,
  DollarSign,
  Car,
  CreditCard,
  Layers,
  ArrowRight,
  ShieldCheck,
  Receipt,
  X
} from "lucide-react";
import { exportToCsv } from "../../utils/exportCsv.js";

export default function CustomerEVCharging({ currentUser, loggedInUser, onNavigate, onViewReceipt }) {
  const user = currentUser || loggedInUser;
  const userEmail = user?.email || (() => {
    try {
      const saved = localStorage.getItem("shnoor_current_user");
      return saved ? JSON.parse(saved).email : "";
    } catch {
      return "";
    }
  })();

  const [activeTab, setActiveTab] = useState("find");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotSearch, setSlotSearch] = useState("");
  const [chargerTypeFilter, setChargerTypeFilter] = useState("ALL");

  const [userVehicles, setUserVehicles] = useState([]);
  const [selectedSlotForStart, setSelectedSlotForStart] = useState(null);
  const [selectedPlate, setSelectedPlate] = useState("");
  const [customPlate, setCustomPlate] = useState("");
  const [customModel, setCustomModel] = useState("Electric Vehicle");
  const [isStartingSession, setIsStartingSession] = useState(false);

  const [activeSession, setActiveSession] = useState(null);
  const [isLoadingActive, setIsLoadingActive] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);

  const [historySessions, setHistorySessions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(5);
  const [totalHistory, setTotalHistory] = useState(0);

  const [actionAlert, setActionAlert] = useState("");

  const triggerAlert = (msg) => {
    setActionAlert(msg);
    setTimeout(() => setActionAlert(""), 4500);
  };

  const fetchVehicles = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/vehicles?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.vehicles)) {
        setUserVehicles(data.vehicles);
        if (data.vehicles.length > 0 && !selectedPlate) {
          setSelectedPlate(data.vehicles[0].plate || data.vehicles[0].vehicle_number);
        }
      }
    } catch {
      void 0;
    }
  }, [userEmail, selectedPlate]);

  const fetchSlots = useCallback(async () => {
    setIsLoadingSlots(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging-slots?all=true`);
      const data = await res.json();
      setIsLoadingSlots(false);
      if (data.success && Array.isArray(data.slots)) {
        setAvailableSlots(data.slots);
      }
    } catch {
      setIsLoadingSlots(false);
    }
  }, []);

  const fetchActiveSession = useCallback(async () => {
    if (!userEmail) return;
    setIsLoadingActive(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customer/charging/active?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setIsLoadingActive(false);
      if (data.success) {
        setActiveSession(data.session);
      }
    } catch {
      setIsLoadingActive(false);
    }
  }, [userEmail]);

  const fetchHistory = useCallback(async () => {
    if (!userEmail) return;
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({
        email: userEmail,
        page: String(historyPage),
        limit: String(historyLimit),
        search: historySearch || ""
      });
      const res = await fetch(`${API_BASE_URL}/api/customer/charging-sessions?${params}`);
      const data = await res.json();
      setIsLoadingHistory(false);
      if (data.success && Array.isArray(data.sessions)) {
        setHistorySessions(data.sessions);
        setTotalHistory(data.pagination ? data.pagination.total : data.sessions.length);
      }
    } catch {
      setIsLoadingHistory(false);
    }
  }, [userEmail, historyPage, historyLimit, historySearch]);

  useEffect(() => {
    fetchVehicles();
    fetchSlots();
    fetchActiveSession();
  }, [fetchVehicles, fetchSlots, fetchActiveSession]);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  useEffect(() => {
    let interval = null;
    if (activeTab === "active" && activeSession) {
      interval = setInterval(fetchActiveSession, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, activeSession, fetchActiveSession]);

  const handleStartCharging = async (e) => {
    e.preventDefault();
    if (!selectedSlotForStart) return;

    const plate = selectedPlate === "__CUSTOM__" || !selectedPlate ? customPlate.trim().toUpperCase() : selectedPlate.trim().toUpperCase();
    if (!plate) {
      triggerAlert("Please enter or select a vehicle plate number");
      return;
    }

    setIsStartingSession(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging/sessions/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_email: userEmail,
          customer_name: user?.name || "Customer",
          customer_phone: user?.phone || "",
          vehicle_number: plate,
          vehicle_model: customModel,
          slot_id: selectedSlotForStart.id,
          slot_number: selectedSlotForStart.slot_number
        })
      });
      const data = await res.json();
      setIsStartingSession(false);
      if (res.ok && data.success) {
        setSelectedSlotForStart(null);
        triggerAlert(`Charging session started at Bay ${selectedSlotForStart.slot_number}`);
        fetchSlots();
        fetchActiveSession();
        setActiveTab("active");
      } else {
        triggerAlert(data.error || "Failed to start charging session");
      }
    } catch {
      setIsStartingSession(false);
      triggerAlert("Server communication error");
    }
  };

  const handleStopCharging = async (e) => {
    e.preventDefault();
    if (!activeSession) return;
    setIsStoppingSession(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ev-charging/sessions/${activeSession.id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method: paymentMethod,
          requester_email: userEmail,
          actor_role: "customer"
        })
      });
      const data = await res.json();
      setIsStoppingSession(false);
      if (res.ok && data.success) {
        setIsPaymentModalOpen(false);
        setCompletedSummary({
          session: data.session,
          payment: data.payment
        });
        setActiveSession(null);
        fetchSlots();
        fetchActiveSession();
        triggerAlert("Charging completed and payment processed successfully!");
      } else {
        triggerAlert(data.error || "Could not complete charging session");
      }
    } catch {
      setIsStoppingSession(false);
      triggerAlert("Server communication error");
    }
  };

  const handleExportHistoryCsv = () => {
    const headers = [
      "Session Code",
      "Vehicle Plate",
      "Bay Slot",
      "Start Time",
      "Duration",
      "Energy Consumed",
      "Rate (₹/kWh)",
      "Total Amount",
      "Payment Method",
      "Status"
    ];
    const rows = historySessions.map((s) => [
      s.session_code,
      s.vehicle_number,
      s.slot_number,
      s.start_time ? new Date(s.start_time).toLocaleString("en-IN") : "",
      s.duration || "—",
      s.energy_consumed ? `${s.energy_consumed} kWh` : "0 kWh",
      `₹${parseFloat(s.charging_rate || 0).toFixed(2)}`,
      `₹${parseFloat(s.total_amount || 0).toFixed(2)}`,
      s.payment_method || "UPI",
      s.session_status || "Completed"
    ]);
    exportToCsv("My_EV_Charging_History.csv", headers, rows);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  const filteredSlots = availableSlots.filter((s) => {
    const q = slotSearch.toLowerCase();
    const matchesSearch =
      !q ||
      (s.slot_number || "").toLowerCase().includes(q) ||
      (s.charger_type || "").toLowerCase().includes(q) ||
      (s.connector_type || "").toLowerCase().includes(q);
    const matchesType = chargerTypeFilter === "ALL" || s.charger_type === chargerTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="pw-customer-ev-module" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {actionAlert && (
        <div style={{
          padding: "12px 18px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          color: "#166534",
          fontWeight: 700,
          fontSize: "0.86rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <CheckCircle2 size={16} />
          <span>{actionAlert}</span>
        </div>
      )}

      <div style={{
        display: "flex",
        borderBottom: "2px solid var(--border-color, #e2e8f0)",
        gap: "12px"
      }}>
        <button
          type="button"
          onClick={() => setActiveTab("find")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            fontWeight: 800,
            fontSize: "0.94rem",
            cursor: "pointer",
            borderBottom: activeTab === "find" ? "3px solid #0d9488" : "3px solid transparent",
            color: activeTab === "find" ? "#0d9488" : "var(--text-secondary, #64748b)",
            marginBottom: "-2px"
          }}
        >
          Find EV Charging
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("active")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            fontWeight: 800,
            fontSize: "0.94rem",
            cursor: "pointer",
            borderBottom: activeTab === "active" ? "3px solid #0d9488" : "3px solid transparent",
            color: activeTab === "active" ? "#0d9488" : "var(--text-secondary, #64748b)",
            marginBottom: "-2px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>My Active Session</span>
          {activeSession && (
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            fontWeight: 800,
            fontSize: "0.94rem",
            cursor: "pointer",
            borderBottom: activeTab === "history" ? "3px solid #0d9488" : "3px solid transparent",
            color: activeTab === "history" ? "#0d9488" : "var(--text-secondary, #64748b)",
            marginBottom: "-2px"
          }}
        >
          Charging History
        </button>
      </div>

      {activeTab === "find" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="pw-table-controls-row" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", flex: 1 }}>
              <div className="pw-search-box-pill" style={{ minWidth: "240px" }}>
                <Search size={14} className="pw-search-icon" />
                <input
                  type="text"
                  placeholder="Search charging bay, connector..."
                  value={slotSearch}
                  onChange={(e) => setSlotSearch(e.target.value)}
                  className="pw-pill-input"
                />
              </div>

              <select
                className="pw-calc-select"
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "0.82rem" }}
                value={chargerTypeFilter}
                onChange={(e) => setChargerTypeFilter(e.target.value)}
              >
                <option value="ALL">All Chargers</option>
                <option value="DC Fast Charger">DC Fast Charger</option>
                <option value="AC Level 2">AC Level 2</option>
                <option value="Ultra-Fast DC">Ultra-Fast DC</option>
              </select>
            </div>

            <button
              type="button"
              className="pw-btn-action-refresh"
              onClick={fetchSlots}
              title="Refresh EV Chargers"
            >
              <RefreshCw size={13} className={isLoadingSlots ? "pw-spin" : ""} />
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
            gap: "18px"
          }}>
            {filteredSlots.length > 0 ? (
              filteredSlots.map((s) => {
                const isAvail = (s.status || "").toLowerCase() === "available";
                const isChg = (s.status || "").toLowerCase() === "charging";
                return (
                  <div
                    key={s.id}
                    style={{
                      background: "var(--bg-card, #ffffff)",
                      borderRadius: "14px",
                      border: isAvail ? "1.5px solid #0d9488" : "1px solid var(--border-color, #e2e8f0)",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      boxShadow: "0 2px 8px rgba(15,23,42,0.04)"
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: isAvail ? "var(--bg-teal-sub, #f0fdfa)" : "var(--bg-sub, #f1f5f9)",
                            color: isAvail ? "#0d9488" : "#64748b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            <Zap size={20} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                              Bay {s.slot_number}
                            </h4>
                            <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #64748b)" }}>
                              {s.location_name || "Central Parking Garage"}
                            </span>
                          </div>
                        </div>

                        <span className={`pw-status-pill ${isAvail ? "completed" : isChg ? "active" : "pending"}`} style={{ fontSize: "0.72rem" }}>
                          {s.status}
                        </span>
                      </div>

                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "8px",
                        padding: "10px",
                        background: "var(--bg-sub, #f8fafc)",
                        borderRadius: "8px",
                        fontSize: "0.78rem",
                        marginTop: "12px"
                      }}>
                        <div>
                          <span style={{ color: "var(--text-secondary, #64748b)", display: "block" }}>Type</span>
                          <span style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{s.charger_type}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary, #64748b)", display: "block" }}>Connector</span>
                          <span style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{s.connector_type}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary, #64748b)", display: "block" }}>Power</span>
                          <span style={{ fontWeight: 800, color: "#0d9488" }}>{s.charging_power}</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-secondary, #64748b)", display: "block" }}>Tariff Rate</span>
                          <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>₹{parseFloat(s.charging_rate || 0).toFixed(2)} / kWh</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!isAvail}
                      onClick={() => setSelectedSlotForStart(s)}
                      className={isAvail ? "pw-btn-primary" : ""}
                      style={{
                        padding: "10px",
                        borderRadius: "8px",
                        fontWeight: 800,
                        fontSize: "0.86rem",
                        cursor: isAvail ? "pointer" : "not-allowed",
                        background: isAvail ? undefined : "var(--bg-sub, #f1f5f9)",
                        color: isAvail ? undefined : "var(--text-secondary, #94a3b8)",
                        border: isAvail ? undefined : "1px solid var(--border-color, #e2e8f0)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <Zap size={15} />
                      <span>{isAvail ? "Plug In & Start Charging" : s.status}</span>
                    </button>
                  </div>
                );
              })
            ) : (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--text-secondary, #94a3b8)", background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <Zap size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <h4 style={{ margin: 0, fontWeight: 700 }}>No EV Charging Bays Available</h4>
                <p style={{ margin: "4px 0 0 0", fontSize: "0.82rem" }}>All charging bays are currently occupied or under maintenance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "active" && (
        <div>
          {activeSession ? (
            <div style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: "16px",
              border: "2px solid #0d9488",
              padding: "24px",
              boxShadow: "0 8px 24px rgba(13,148,136,0.12)",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(13,148,136,0.3)"
                  }}>
                    <Zap size={26} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "var(--text-primary, #0f172a)" }}>
                        EV Charging in Progress
                      </h3>
                      <span className="pw-status-pill active" style={{ fontSize: "0.72rem" }}>
                        LIVE CHARGING
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #64748b)" }}>
                      Session ID: {activeSession.session_code} • {activeSession.location_name}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="pw-btn-action-refresh"
                  onClick={fetchActiveSession}
                  title="Refresh live meter"
                >
                  <RefreshCw size={14} className={isLoadingActive ? "pw-spin" : ""} />
                  <span style={{ fontSize: "0.78rem", marginLeft: "4px" }}>Refresh Meter</span>
                </button>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
                gap: "14px",
                background: "var(--bg-sub, #f8fafc)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--border-color, #e2e8f0)"
              }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", fontWeight: 700 }}>Vehicle Plate</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>
                    {activeSession.vehicle_number}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>{activeSession.vehicle_model}</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", fontWeight: 700 }}>Assigned Bay</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0d9488", marginTop: "2px" }}>
                    Bay {activeSession.slot_number}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>{activeSession.charger_type || "DC Fast Charger"}</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", fontWeight: 700 }}>Elapsed Duration</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-primary, #0f172a)", marginTop: "2px" }}>
                    {activeSession.liveDuration || "Just started"}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>Since {formatDate(activeSession.start_time)}</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", fontWeight: 700 }}>Estimated Energy</span>
                  <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#0d9488", marginTop: "2px" }}>
                    {activeSession.estimatedEnergy || 0} kWh
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)" }}>Rate: ₹{parseFloat(activeSession.charging_rate || 18).toFixed(2)}/kWh</span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", textTransform: "uppercase", fontWeight: 700 }}>Estimated Amount</span>
                  <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f766e", marginTop: "2px" }}>
                    ₹{activeSession.estimatedFee ? activeSession.estimatedFee.toFixed(2) : "0.00"}
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "#16a34a", fontWeight: 700 }}>Auto-calculated</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--text-secondary, #64748b)" }}>
                  <ShieldCheck size={16} style={{ color: "#0d9488" }} />
                  <span>Smart BMS power monitoring active. Barrier auto-releases upon completion.</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  style={{
                    background: "#dc2626",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "10px 22px",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(220,38,38,0.25)"
                  }}
                >
                  <BatteryCharging size={18} />
                  <span>Stop Charging & Pay</span>
                </button>
              </div>
            </div>
          ) : completedSummary ? (
            <div style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: "16px",
              border: "1.5px solid #bbf7d0",
              padding: "26px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxShadow: "0 4px 16px rgba(16,185,129,0.1)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#166534" }}>
                    Charging Session Finished & Paid
                  </h3>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary, #64748b)" }}>
                    Transaction: {completedSummary.payment?.transaction_id}
                  </span>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 160px), 1fr))",
                gap: "12px",
                background: "var(--bg-sub, #f8fafc)",
                padding: "14px",
                borderRadius: "10px"
              }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>Vehicle</span>
                  <div style={{ fontWeight: 800 }}>{completedSummary.session.vehicle_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>Charging Bay</span>
                  <div style={{ fontWeight: 800 }}>Bay {completedSummary.session.slot_number}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>Energy Consumed</span>
                  <div style={{ fontWeight: 800, color: "#0d9488" }}>{completedSummary.session.energy_consumed} kWh</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>Duration</span>
                  <div style={{ fontWeight: 800 }}>{completedSummary.session.duration}</div>
                </div>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)" }}>Total Paid</span>
                  <div style={{ fontWeight: 900, color: "#16a34a", fontSize: "1.1rem" }}>
                    ₹{parseFloat(completedSummary.session.total_amount || 0).toFixed(2)}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="pw-btn-primary"
                  onClick={() => {
                    if (onViewReceipt && completedSummary.payment) {
                      onViewReceipt(completedSummary.payment);
                    } else if (onNavigate) {
                      onNavigate("digital-receipts");
                    }
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <Receipt size={15} />
                  <span>View Official Digital Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedSummary(null);
                    setActiveTab("find");
                  }}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer"
                  }}
                >
                  Start Another Session
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: "14px",
              border: "1px solid var(--border-color, #e2e8f0)",
              padding: "48px 20px",
              textAlign: "center"
            }}>
              <BatteryCharging size={40} style={{ margin: "0 auto 12px", color: "#94a3b8" }} />
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                No Active EV Charging Session
              </h3>
              <p style={{ margin: "6px 0 18px 0", fontSize: "0.85rem", color: "var(--text-secondary, #64748b)" }}>
                You do not currently have a vehicle plugged in at our charging bays.
              </p>
              <button
                type="button"
                className="pw-btn-primary"
                onClick={() => setActiveTab("find")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "0 auto" }}
              >
                <Zap size={15} />
                <span>Find an Available Charging Bay</span>
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="pw-table-controls-row" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div className="pw-search-box-pill" style={{ minWidth: "240px" }}>
              <Search size={14} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search session ID, vehicle, bay..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryPage(1);
                }}
                className="pw-pill-input"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={fetchHistory}
                title="Refresh history"
              >
                <RefreshCw size={13} className={isLoadingHistory ? "pw-spin" : ""} />
              </button>

              <button
                type="button"
                className="pw-btn-action-refresh"
                onClick={handleExportHistoryCsv}
                disabled={historySessions.length === 0}
                title="Export History CSV"
              >
                <Download size={13} />
              </button>
            </div>
          </div>

          <div className="pw-table-card" style={{ background: "var(--bg-card, #ffffff)", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", overflowX: "auto" }}>
            <table className="pw-admin-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px" }}>
              <thead>
                <tr style={{ background: "var(--bg-sub, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                  <th style={{ padding: "12px 16px" }}>SESSION</th>
                  <th style={{ padding: "12px 16px" }}>VEHICLE</th>
                  <th style={{ padding: "12px 16px" }}>BAY</th>
                  <th style={{ padding: "12px 16px" }}>DATE</th>
                  <th style={{ padding: "12px 16px" }}>DURATION</th>
                  <th style={{ padding: "12px 16px" }}>ENERGY</th>
                  <th style={{ padding: "12px 16px" }}>AMOUNT</th>
                  <th style={{ padding: "12px 16px" }}>METHOD</th>
                  <th style={{ padding: "12px 16px" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>RECEIPT</th>
                </tr>
              </thead>
              <tbody>
                {historySessions.length > 0 ? (
                  historySessions.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid var(--border-color, #f1f5f9)", fontSize: "0.84rem" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 800, color: "#0d9488" }}>
                        {s.session_code}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700 }}>
                        {s.vehicle_number}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 600 }}>
                        Bay {s.slot_number}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary, #64748b)", fontSize: "0.78rem" }}>
                        {formatDate(s.start_time)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {s.duration || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0d9488" }}>
                        {s.energy_consumed ? `${s.energy_consumed} kWh` : "0 kWh"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 900, color: "var(--text-primary, #0f172a)" }}>
                        ₹{parseFloat(s.total_amount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {s.payment_method || "UPI"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className="pw-status-pill completed" style={{ fontSize: "0.72rem" }}>
                          {s.session_status || "Completed"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          className="pw-btn-action-view"
                          onClick={() => {
                            if (onViewReceipt) {
                              onViewReceipt({
                                transaction_id: s.transaction_id || `TXN-EV-${s.id}`,
                                vehicle_number: s.vehicle_number,
                                slot_number: s.slot_number,
                                amount: String(s.total_amount || 0),
                                duration: s.duration,
                                payment_method: s.payment_method || "UPI",
                                customer_name: s.customer_name || user?.name || "Customer"
                              });
                            } else if (onNavigate) {
                              onNavigate("digital-receipts");
                            }
                          }}
                          title="View Digital Receipt"
                        >
                          <Receipt size={13} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} style={{ padding: "40px 16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)" }}>
                      <BatteryCharging size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ margin: 0, fontWeight: 700 }}>No Past Charging Sessions</p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem" }}>Completed charging sessions and verified invoices will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={historyPage}
            totalItems={totalHistory}
            pageSize={historyLimit}
            pageSizeOptions={[5, 10, 25, 50]}
            onPageChange={setHistoryPage}
            onPageSizeChange={(newSize) => {
              setHistoryLimit(newSize);
              setHistoryPage(1);
            }}
          />
        </div>
      )}

      {selectedSlotForStart && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={22} style={{ color: "#0d9488" }} />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
                  Start EV Charging Session
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedSlotForStart(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "12px 14px", background: "var(--bg-teal-sub, #f0fdfa)", borderRadius: "10px", border: "1px solid #ccfbf1", marginBottom: "16px", fontSize: "0.84rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#0f766e", fontWeight: 700 }}>Assigned Bay:</span>
                <span style={{ fontWeight: 800, color: "#0f766e" }}>Bay {selectedSlotForStart.slot_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "#0f766e" }}>Charger Spec:</span>
                <span style={{ fontWeight: 700 }}>{selectedSlotForStart.charger_type} ({selectedSlotForStart.charging_power})</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#0f766e" }}>Tariff Rate:</span>
                <span style={{ fontWeight: 800 }}>₹{parseFloat(selectedSlotForStart.charging_rate || 18).toFixed(2)} / kWh</span>
              </div>
            </div>

            <form onSubmit={handleStartCharging} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Select Registered Vehicle</label>
                {userVehicles.length > 0 ? (
                  <select
                    className="pw-calc-select"
                    value={selectedPlate}
                    onChange={(e) => setSelectedPlate(e.target.value)}
                  >
                    {userVehicles.map((v) => (
                      <option key={v.id || v.plate} value={v.plate || v.vehicle_number}>
                        {v.plate || v.vehicle_number} — {v.model || "Vehicle"} ({v.vehicle_type || "Car"})
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Enter Another Plate Number</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Vehicle Plate (e.g. KA-05-EV-1234)"
                    required
                    value={customPlate}
                    onChange={(e) => setCustomPlate(e.target.value)}
                    className="pw-calc-input"
                  />
                )}
              </div>

              {(selectedPlate === "__CUSTOM__" || userVehicles.length === 0) && (
                <>
                  <div className="pw-calc-field-group">
                    <label className="pw-calc-label">Vehicle License Plate *</label>
                    <input
                      type="text"
                      placeholder="e.g. KA-04-EV-9900"
                      required
                      value={customPlate}
                      onChange={(e) => setCustomPlate(e.target.value)}
                      className="pw-calc-input"
                    />
                  </div>

                  <div className="pw-calc-field-group">
                    <label className="pw-calc-label">Vehicle Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Tata Nexon EV"
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="pw-calc-input"
                    />
                  </div>
                </>
              )}

              <div style={{ padding: "10px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", fontSize: "0.78rem", color: "var(--text-secondary, #64748b)" }}>
                By starting the session, the charging bay status will change to <strong>Charging</strong>. Fees accumulate based on real delivered kWh until you stop the session.
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedSlotForStart(null)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStartingSession}
                  className="pw-btn-primary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  {isStartingSession ? "Connecting..." : "Confirm & Start Charging"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && activeSession && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <CreditCard size={22} style={{ color: "#0d9488" }} />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
                  Checkout & Payment
                </h3>
              </div>
              <button type="button" onClick={() => setIsPaymentModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "14px", background: "var(--bg-sub, #f8fafc)", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "16px", fontSize: "0.84rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Vehicle Plate:</span>
                <span style={{ fontWeight: 800 }}>{activeSession.vehicle_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Bay:</span>
                <span style={{ fontWeight: 800 }}>Bay {activeSession.slot_number}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Duration:</span>
                <span style={{ fontWeight: 700 }}>{activeSession.liveDuration || "15 mins"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "var(--text-secondary, #64748b)" }}>Energy Delivered:</span>
                <span style={{ fontWeight: 800, color: "#0d9488" }}>{activeSession.estimatedEnergy || 1.8} kWh</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-color, #e2e8f0)", paddingTop: "8px" }}>
                <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>Total Amount Due:</span>
                <span style={{ fontWeight: 900, color: "#0f766e", fontSize: "1.2rem" }}>
                  ₹{(activeSession.estimatedFee || 32.4).toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleStopCharging} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Choose Payment Option</label>
                <select
                  className="pw-calc-select"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Fastag">Automated Fastag RFID Wallet</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: 700, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStoppingSession}
                  className="pw-btn-primary"
                  style={{ flex: 1, padding: "10px", justifyContent: "center" }}
                >
                  {isStoppingSession ? "Processing..." : "Pay & Complete Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

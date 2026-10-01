import { useState, useEffect, useCallback } from "react";
import { Search, Printer, X } from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";
import Pagination from "../../components/Pagination.jsx";

export default function StaffParkingRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [records, setRecords] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    amount: 0
  });

  const formatTime = (isoStr, fallback) => {
    if (!isoStr || isoStr === "Ongoing") return fallback;
    try {
      const str = String(isoStr).trim();
      const match = str.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
      if (match) {
        const [, , m, d, h, min] = match;
        const hourNum = parseInt(h, 10);
        const ampm = hourNum >= 12 ? "pm" : "am";
        const h12 = hourNum % 12 || 12;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
        const monthStr = monthNames[parseInt(m, 10) - 1] || m;
        return `${parseInt(d, 10)} ${monthStr}, ${String(h12).padStart(2, "0")}:${min} ${ampm}`;
      }
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch {
      return fallback;
    }
  };

  const normalizeRecord = (r, idx) => ({
    id: r.record_id || `REC-${9000 + (r.id || idx)}`,
    ticketNumber: r.ticket_number || `TKT-${88400 + (r.id || idx)}`,
    plateNumber: r.vehicle_number || "—",
    vehicleType: r.vehicle_type || (r.slot_number?.startsWith("D") ? "Bike" : r.slot_number?.startsWith("C") ? "EV" : "Car"),
    slot: r.slot_number || "A-01",
    zone: r.zone || (r.slot_number ? `Zone ${r.slot_number.charAt(0)}` : "Zone A"),
    entryTime: formatTime(r.entry_time, "Earlier today"),
    exitTime: formatTime(r.exit_time, "Parked Now"),
    duration: r.duration || "Ongoing",
    ratePlan: r.rate_plan || `${r.vehicle_type || "Vehicle"} Tariff Plan`,
    amount: r.fee || "₹ 150.00",
    status: r.status === "Parked" ? "Active" : (r.status || "Completed"),
    paymentMethod: r.payment_method || (r.status === "Parked" ? "Pending Exit" : "Fastag / UPI"),
    operator: r.operator || "Laiba Taj"
  });

  const fetchRecords = useCallback(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: searchQuery || "",
      status: statusFilter
    });
    fetch(`${API_BASE_URL}/api/admin/parking-records?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.records) {
          setRecords(data.records.map(normalizeRecord));
          setTotalCount(data.total !== undefined ? data.total : data.records.length);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      })
      .catch(() => {});
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchRecords();
    const handleUpdate = () => fetchRecords();
    window.addEventListener("shnoor_activity_updated", handleUpdate);
    const interval = setInterval(fetchRecords, 15000);
    return () => {
      window.removeEventListener("shnoor_activity_updated", handleUpdate);
      clearInterval(interval);
    };
  }, [fetchRecords]);

  const filteredRecords = records;

  const handlePrintReceipt = (rec) => {
    setSelectedRecord(rec);
    setIsReceiptModalOpen(true);
  };

  const totalPaidAmount = records.reduce((sum, r) => sum + (parseFloat(String(r.amount).replace(/[^0-9.]/g, "")) || 0), 0);

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Sessions Logged</span>
          <span className="pw-metric-value">{stats.total || totalCount || records.length}</span>
          <span className="pw-metric-trend positive">
            <span>Shift Records</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Currently Parked</span>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{stats.active !== undefined ? stats.active : records.filter(r => r.status === "Active").length}</span>
          <span className="pw-metric-trend positive">
            <span>Active Bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Completed & Paid</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{stats.completed !== undefined ? stats.completed : records.filter(r => r.status === "Completed").length}</span>
          <span className="pw-metric-trend positive">
            <span>Settled Receipts</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Shift Receipts Amount</span>
          <span className="pw-metric-value">₹ {(stats.amount !== undefined ? stats.amount : totalPaidAmount).toFixed(2)}</span>
          <span className="pw-metric-trend positive">
            <span>Counter Log</span>
          </span>
        </div>
      </div>

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, flexWrap: "wrap" }}>
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search plate, ticket, slot..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pw-pill-input"
            />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["All", "Active", "Completed"].map((st) => (
              <button
                key={st}
                type="button"
                className={`pw-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                style={{
                  background: statusFilter === st ? "#0d9488" : "var(--bg-sub, #f1f5f9)",
                  color: statusFilter === st ? "#ffffff" : "var(--text-secondary, #475569)",
                  border: statusFilter === st ? "1px solid #0d9488" : "1px solid var(--border-color, #cbd5e1)",
                  borderRadius: "20px",
                  padding: "5px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {st === "All" ? "All Sessions" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
        <div className="pw-table-scroll">
          <table className="pw-records-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>License Plate & Type</th>
                <th>Bay Slot</th>
                <th>Entry Time</th>
                <th>Exit Time</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "center" }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 800, color: "#0d9488" }}>{r.ticketNumber}</td>
                    <td>
                      <div style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{r.plateNumber}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>{r.vehicleType}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "var(--text-primary, #1e293b)", background: "var(--bg-sub, #f8fafc)", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem" }}>
                        Bay {r.slot}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)" }}>{r.entryTime}</td>
                    <td style={{ fontSize: "0.78rem", color: r.status === "Active" ? "#0d9488" : "#475569", fontWeight: r.status === "Active" ? 700 : 400 }}>{r.exitTime}</td>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>{r.duration}</td>
                    <td style={{ fontWeight: 900, color: "#0d9488" }}>{r.amount}</td>
                    <td>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: "999px", background: r.status === "Completed" ? "var(--bg-teal-sub, #f0fdf4)" : "var(--bg-teal-sub, #f0fdfa)", color: r.status === "Completed" ? "#16a34a" : "#0d9488", border: r.status === "Completed" ? "1px solid #bbf7d0" : "1px solid #ccfbf1" }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handlePrintReceipt(r)}
                        style={{ background: "var(--bg-teal-sub, #f0fdfa)", border: "1px solid #ccfbf1", color: "#0d9488", padding: "5px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Printer size={13} />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary, #94a3b8)" }}>
                    No parking records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalItems={totalCount}
          itemsPerPage={limit}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
          itemLabel="parking records"
        />
      </div>

      {isReceiptModalOpen && selectedRecord && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "28px", maxWidth: "380px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid var(--border-color, #e2e8f0)", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#0d9488" }}>OFFICIAL PARKING RECEIPT</span>
              <button
                type="button"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ borderBottom: "2px dashed #cbd5e1", paddingBottom: "14px", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 900, color: "var(--text-primary, #0f172a)", margin: 0 }}>ParkSafe Smart Facility</h3>
              <p style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", margin: "2px 0 0 0" }}>Downtown Central Plaza • GSTIN: 29AABCS1429B1Z8</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", fontSize: "0.8rem", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Ticket ID:</span><span style={{ fontWeight: 800 }}>{selectedRecord.ticketNumber}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Vehicle Plate:</span><span style={{ fontWeight: 800 }}>{selectedRecord.plateNumber}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Assigned Slot:</span><span style={{ fontWeight: 700 }}>Bay {selectedRecord.slot} ({selectedRecord.zone})</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Entry Time:</span><span>{selectedRecord.entryTime}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Exit Time:</span><span>{selectedRecord.exitTime}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-secondary, #94a3b8)" }}>Duration:</span><span style={{ fontWeight: 700 }}>{selectedRecord.duration}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #e2e8f0", paddingTop: "8px" }}><span style={{ fontWeight: 800 }}>Total Paid:</span><span style={{ fontWeight: 900, fontSize: "1.1rem", color: "#0d9488" }}>{selectedRecord.amount}</span></div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="pw-calc-btn-reset"
                onClick={() => setIsReceiptModalOpen(false)}
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                type="button"
                className="pw-calc-btn-submit"
                onClick={() => {
                  window.print();
                  setIsReceiptModalOpen(false);
                }}
                style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

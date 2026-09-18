import { useState } from "react";
import { Search, Printer, X } from "lucide-react";

export default function StaffParkingRecords() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const [records] = useState([
    {
      id: "REC-9041",
      ticketNumber: "TKT-88412",
      plateNumber: "KA01 AB 1234",
      vehicleType: "Car",
      slot: "A-04",
      zone: "Zone A",
      entryTime: "Today, 08:30 AM",
      exitTime: "Today, 10:45 AM",
      duration: "2 hrs 15 mins",
      ratePlan: "Standard Car Hourly (₹50/hr)",
      amount: "₹ 150.00",
      status: "Completed",
      paymentMethod: "UPI / Fastag",
      operator: "Laiba Taj"
    },
    {
      id: "REC-9040",
      ticketNumber: "TKT-88411",
      plateNumber: "KA02 CD 5678",
      vehicleType: "SUV",
      slot: "B-12",
      zone: "Zone B",
      entryTime: "Today, 09:15 AM",
      exitTime: "Parked Now",
      duration: "1 hr 30 mins",
      ratePlan: "SUV Hourly (₹60/hr)",
      amount: "₹ 120.00",
      status: "Active",
      paymentMethod: "Pending Exit",
      operator: "Laiba Taj"
    },
    {
      id: "REC-9039",
      ticketNumber: "TKT-88410",
      plateNumber: "KA03 EF 9012",
      vehicleType: "Car",
      slot: "A-08",
      zone: "Zone A",
      entryTime: "Today, 07:00 AM",
      exitTime: "Today, 09:30 AM",
      duration: "2 hrs 30 mins",
      ratePlan: "Standard Car Hourly (₹50/hr)",
      amount: "₹ 150.00",
      status: "Completed",
      paymentMethod: "Credit Card",
      operator: "Ramesh K"
    },
    {
      id: "REC-9038",
      ticketNumber: "TKT-88409",
      plateNumber: "KA51 EV 2024",
      vehicleType: "EV",
      slot: "C-01",
      zone: "Zone C",
      entryTime: "Today, 08:00 AM",
      exitTime: "Parked Now",
      duration: "2 hrs 45 mins",
      ratePlan: "EV Fast Charging Hourly (₹80/hr)",
      amount: "₹ 240.00",
      status: "Active",
      paymentMethod: "Pending Exit",
      operator: "Laiba Taj"
    },
    {
      id: "REC-9037",
      ticketNumber: "TKT-88408",
      plateNumber: "KA04 TR 9876",
      vehicleType: "Bike",
      slot: "D-04",
      zone: "Zone D",
      entryTime: "Today, 06:30 AM",
      exitTime: "Today, 08:30 AM",
      duration: "2 hrs 00 mins",
      ratePlan: "Two-Wheeler Hourly (₹25/hr)",
      amount: "₹ 50.00",
      status: "Completed",
      paymentMethod: "Cash Counter",
      operator: "Ramesh K"
    }
  ]);

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slot.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePrintReceipt = (rec) => {
    setSelectedRecord(rec);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Sessions Logged</span>
          <span className="pw-metric-value">{records.length}</span>
          <span className="pw-metric-trend positive">
            <span>Shift Records</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Currently Parked</span>
          <span className="pw-metric-value" style={{ color: "#0d9488" }}>{records.filter(r => r.status === "Active").length}</span>
          <span className="pw-metric-trend positive">
            <span>Active Bays</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Completed & Paid</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{records.filter(r => r.status === "Completed").length}</span>
          <span className="pw-metric-trend positive">
            <span>Settled Receipts</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Shift Receipts Amount</span>
          <span className="pw-metric-value">₹ 710.00</span>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <div style={{ display: "flex", gap: "6px" }}>
            {["All", "Active", "Completed"].map((st) => (
              <button
                key={st}
                type="button"
                className={`pw-filter-pill ${statusFilter === st ? "active" : ""}`}
                onClick={() => setStatusFilter(st)}
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
              {filteredRecords.map((r) => (
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
              ))}
            </tbody>
          </table>
        </div>
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

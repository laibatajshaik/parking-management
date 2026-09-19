import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Download,
  Check,
  X,
  Send,
  HelpCircle,
  RefreshCw,
  MessageSquare,
  Trash2
} from "lucide-react";

export default function SupportAuditLogs() {
  const [activeSubTab, setActiveSubTab] = useState("tickets");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [statusActionMsg, setStatusActionMsg] = useState("");

  const [tickets, setTickets] = useState([]);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets`);
      const data = await res.json();
      setIsLoadingTickets(false);
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const [auditLogs] = useState([
    {
      id: "AUD-9941",
      timestamp: "Today, 11:02 AM",
      actor: "Staff Warden (Ramesh K)",
      action: "Emergency Manual Gate Lift",
      target: "Gate Barrier #02 (Exit)",
      severity: "Warning",
      ip: "192.168.1.104"
    },
    {
      id: "AUD-9940",
      timestamp: "Today, 10:30 AM",
      actor: "Admin (admin@shnoor.com)",
      action: "Updated Pricing Plan",
      target: "PLAN-MONTHLY Tariff",
      severity: "Info",
      ip: "192.168.1.50"
    },
    {
      id: "AUD-9939",
      timestamp: "Today, 09:15 AM",
      actor: "System Scheduler",
      action: "Auto-Released Expired Hold",
      target: "Bay B-08 (Hold Expired)",
      severity: "Info",
      ip: "System Internal"
    },
    {
      id: "AUD-9938",
      timestamp: "Today, 08:00 AM",
      actor: "Staff Warden (Suresh V)",
      action: "Shift Start & Drawer Login",
      target: "Terminal Desk #01",
      severity: "Info",
      ip: "192.168.1.101"
    },
    {
      id: "AUD-9937",
      timestamp: "Yesterday, 11:45 PM",
      actor: "System Automated Cron",
      action: "Daily Revenue Reconciliation",
      target: "PostgreSQL Database",
      severity: "Info",
      ip: "System Internal"
    }
  ]);

  const handleUpdatePriority = async (ticketId, newPriority) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}/priority`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id || t.ticket_code === data.ticket.ticket_code ? data.ticket : t))
        );
        if (selectedTicket && (selectedTicket.id === data.ticket.id || selectedTicket.ticket_code === data.ticket.ticket_code)) {
          setSelectedTicket(data.ticket);
        }
      } else {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId || t.ticket_code === ticketId ? { ...t, priority: newPriority } : t))
        );
        if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
          setSelectedTicket({ ...selectedTicket, priority: newPriority });
        }
      }
      setStatusActionMsg(`Ticket ${ticketId} priority set to ${newPriority}.`);
      setTimeout(() => setStatusActionMsg(""), 3500);
    } catch {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticket_code === ticketId ? { ...t, priority: newPriority } : t))
      );
      if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority });
      }
      setStatusActionMsg(`Ticket ${ticketId} priority set to ${newPriority}.`);
      setTimeout(() => setStatusActionMsg(""), 3500);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id || t.ticket_code === data.ticket.ticket_code ? data.ticket : t))
        );
        if (selectedTicket && (selectedTicket.id === data.ticket.id || selectedTicket.ticket_code === data.ticket.ticket_code)) {
          setSelectedTicket(data.ticket);
        }
      } else {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId || t.ticket_code === ticketId ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
          setSelectedTicket({ ...selectedTicket, status: newStatus });
        }
      }
      setStatusActionMsg(`Ticket ${ticketId} status set to ${newStatus}.`);
      setTimeout(() => setStatusActionMsg(""), 3500);
    } catch {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId || t.ticket_code === ticketId ? { ...t, status: newStatus } : t))
      );
      if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      setStatusActionMsg(`Ticket ${ticketId} status set to ${newStatus}.`);
      setTimeout(() => setStatusActionMsg(""), 3500);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticket_code !== ticketId));
        if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
          setSelectedTicket(null);
        }
        setStatusActionMsg(`Ticket ${ticketId} removed successfully.`);
        setTimeout(() => setStatusActionMsg(""), 3500);
      }
    } catch {
      setTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticket_code !== ticketId));
      if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
        setSelectedTicket(null);
      }
      setStatusActionMsg(`Ticket ${ticketId} removed successfully.`);
      setTimeout(() => setStatusActionMsg(""), 3500);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const targetId = selectedTicket.id || selectedTicket.ticket_code;
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${targetId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: "Admin Support",
          text: replyText
        })
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === data.ticket.id || t.ticket_code === data.ticket.ticket_code ? data.ticket : t))
        );
        setSelectedTicket(data.ticket);
      }
      setReplyText("");
      setStatusActionMsg("Reply dispatched to customer.");
      setTimeout(() => setStatusActionMsg(""), 4000);
    } catch {
      const msgs = Array.isArray(selectedTicket.messages)
        ? selectedTicket.messages
        : (typeof selectedTicket.messages === "string" ? JSON.parse(selectedTicket.messages) : []);
      const updatedMessages = [
        ...msgs,
        { sender: "Admin Support", text: replyText, time: "Just now" }
      ];
      const updated = { ...selectedTicket, messages: updatedMessages, status: "In Progress" };
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id || t.ticket_code === selectedTicket.ticket_code ? updated : t))
      );
      setSelectedTicket(updated);
      setReplyText("");
      setStatusActionMsg("Reply dispatched to customer.");
      setTimeout(() => setStatusActionMsg(""), 4000);
    }
  };

  const handleExportCSV = () => {
    try {
      const isTicketsTab = activeSubTab === "tickets";
      const csvRows = [];

      if (isTicketsTab) {
        csvRows.push(["SHNOOR SMART PARKING - CUSTOMER SUPPORT TICKETS REPORT"]);
        csvRows.push([`Generated At: ${new Date().toLocaleString("en-IN")}`]);
        csvRows.push([]);
        csvRows.push(["Ticket ID", "Customer Name", "Customer Email", "Subject", "Category", "Priority", "Status", "Created Date"]);
        tickets.forEach((t) => {
          csvRows.push([
            t.ticket_code || t.id,
            t.customer_name || t.customer,
            t.customer_email || t.email,
            t.subject,
            t.category,
            t.priority,
            t.status,
            t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : t.createdAt
          ]);
        });
      } else {
        csvRows.push(["SHNOOR SMART PARKING - SYSTEM & SECURITY AUDIT TRAIL"]);
        csvRows.push([`Generated At: ${new Date().toLocaleString("en-IN")}`]);
        csvRows.push([]);
        csvRows.push(["Log ID", "Timestamp", "Actor / Role", "Action Performed", "Target Resource", "Severity", "IP / Terminal"]);
        auditLogs.forEach((l) => {
          csvRows.push([l.id, l.timestamp, l.actor, l.action, l.target, l.severity, l.ip]);
        });
      }

      const csvString = csvRows
        .map((row) =>
          row
            .map((cell) => {
              if (cell === undefined || cell === null) return '""';
              const sanitized = String(cell).replace(/"/g, '""');
              return `"${sanitized}"`;
            })
            .join(",")
        )
        .join("\r\n");

      const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `ParkSafe_${isTicketsTab ? "Support_Tickets" : "Audit_Logs"}_${new Date().toISOString().slice(0, 10)}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusActionMsg(`File "${filename}" downloaded to Downloads.`);
      setTimeout(() => setStatusActionMsg(""), 4000);
    } catch {
      setStatusActionMsg("Export failed. Please try again.");
      setTimeout(() => setStatusActionMsg(""), 4000);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const tCode = t.ticket_code || String(t.id);
    const cName = t.customer_name || t.customer || "";
    const subj = t.subject || "";
    const matchesSearch =
      subj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openTicketsCount = tickets.filter((t) => t.status !== "Resolved").length;
  const resolvedTicketsCount = tickets.filter((t) => t.status === "Resolved").length;

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Open Support Tickets</span>
          <span className="pw-metric-value" style={{ color: openTicketsCount > 0 ? "#dc2626" : "#16a34a" }}>{openTicketsCount}</span>
          <span className="pw-metric-trend positive">
            <span>Live Customer Inquiries</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Resolved Tickets</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{resolvedTicketsCount}</span>
          <span className="pw-metric-trend positive">
            <span>100% SLA Resolution</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Avg Response Time</span>
          <span className="pw-metric-value">8 mins</span>
          <span className="pw-metric-trend positive">
            <span>Dedicated Helpdesk</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Security Audit Logs</span>
          <span className="pw-metric-value">{auditLogs.length} Events</span>
          <span className="pw-metric-trend positive">
            <span>Real-time tracking</span>
          </span>
        </div>
      </div>

      {statusActionMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{statusActionMsg}</span>
        </div>
      )}

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className={`pw-filter-pill ${activeSubTab === "tickets" ? "active" : ""}`}
            onClick={() => setActiveSubTab("tickets")}
            style={{
              background: activeSubTab === "tickets" ? "#0f766e" : "var(--bg-sub, #f1f5f9)",
              color: activeSubTab === "tickets" ? "#ffffff" : "var(--text-secondary, #475569)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <HelpCircle size={15} />
            <span>Support Tickets ({openTicketsCount})</span>
          </button>

          <button
            type="button"
            className={`pw-filter-pill ${activeSubTab === "audit" ? "active" : ""}`}
            onClick={() => setActiveSubTab("audit")}
            style={{
              background: activeSubTab === "audit" ? "#0f766e" : "var(--bg-sub, #f1f5f9)",
              color: activeSubTab === "audit" ? "#ffffff" : "var(--text-secondary, #475569)",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ShieldAlert size={15} />
            <span>Security & System Audit Trail</span>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="pw-search-box-pill">
            <Search size={14} className="pw-search-icon" />
            <input
              type="text"
              placeholder="Search tickets or audit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pw-pill-input"
            />
          </div>

          <button
            type="button"
            className="pw-btn-action-refresh"
            onClick={fetchTickets}
            title="Refresh Live Tickets"
          >
            <RefreshCw size={14} className={isLoadingTickets ? "pw-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="pw-calc-btn-submit"
            onClick={handleExportCSV}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.82rem", cursor: "pointer" }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {activeSubTab === "tickets" && (
        <div className={`pw-admin-support-grid ${selectedTicket ? "has-thread" : ""}`}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div className="pw-card-header-flex">
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Customer Support Inquiries (Live Synced)</h4>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["All", "Open", "In Progress", "Resolved"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    style={{
                      background: statusFilter === st ? "#0f766e" : "var(--bg-sub, #f1f5f9)",
                      color: statusFilter === st ? "#ffffff" : "var(--text-secondary, #475569)",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 10px",
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="pw-table-scroll">
              <table className="pw-records-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Customer</th>
                    <th>Subject & Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #94a3b8)" }}>
                        No support tickets found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const isSel = selectedTicket && (selectedTicket.id === t.id || selectedTicket.ticket_code === t.ticket_code);
                      const tCode = t.ticket_code || t.id;
                      const cName = t.customer_name || t.customer || "Customer";
                      const cEmail = t.customer_email || t.email || "";
                      const dateText = t.created_at ? new Date(t.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : (t.createdAt || "Recent");
                      const curPriority = t.priority || "Normal";
                      const curStatus = t.status || "Open";

                      return (
                        <tr
                          key={tCode}
                          style={{ background: isSel ? "var(--bg-teal-sub, #f0fdfa)" : undefined }}
                        >
                          <td style={{ fontWeight: 800, color: "#0f766e" }}>{tCode}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{cName}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>{cEmail} • {dateText}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{t.subject}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>{t.category}</div>
                          </td>
                          <td>
                            <select
                              value={curPriority}
                              onChange={(e) => handleUpdatePriority(tCode, e.target.value)}
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: curPriority === "Urgent" ? "1px solid #fecaca" : curPriority === "High" ? "1px solid #fed7aa" : curPriority === "Low" ? "1px solid #cbd5e1" : "1px solid #ccfbf1",
                                background: curPriority === "Urgent" ? "#fef2f2" : curPriority === "High" ? "#fff7ed" : curPriority === "Low" ? "#f8fafc" : "#f0fdfa",
                                color: curPriority === "Urgent" ? "#dc2626" : curPriority === "High" ? "#ea580c" : curPriority === "Low" ? "#475569" : "#0f766e",
                                cursor: "pointer",
                                outline: "none"
                              }}
                            >
                              <option value="Low">Low</option>
                              <option value="Normal">Normal</option>
                              <option value="High">High</option>
                              <option value="Urgent">Urgent</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={curStatus}
                              onChange={(e) => handleUpdateStatus(tCode, e.target.value)}
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: curStatus === "Resolved" ? "1px solid #bbf7d0" : curStatus === "In Progress" ? "1px solid #fde68a" : "1px solid #fecaca",
                                background: curStatus === "Resolved" ? "#f0fdf4" : curStatus === "In Progress" ? "#fffbeb" : "#fef2f2",
                                color: curStatus === "Resolved" ? "#16a34a" : curStatus === "In Progress" ? "#b45309" : "#dc2626",
                                cursor: "pointer",
                                outline: "none"
                              }}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTicket(t)}
                                title="View conversation thread and reply"
                                style={{
                                  background: "var(--bg-teal-sub, #f0fdfa)",
                                  border: "1px solid #ccfbf1",
                                  color: "#0f766e",
                                  padding: "4px 9px",
                                  borderRadius: "6px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px"
                                }}
                              >
                                <MessageSquare size={13} />
                                <span>Thread</span>
                              </button>

                              {curStatus !== "Resolved" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(tCode, "Resolved")}
                                  title="Mark Resolved"
                                  style={{
                                    background: "var(--bg-teal-sub, #f0fdf4)",
                                    border: "1px solid var(--border-color, #bbf7d0)",
                                    color: "#16a34a",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}
                                >
                                  <Check size={13} />
                                  <span>Resolve</span>
                                </button>
                              ) : (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    padding: "4px 8px",
                                    background: "var(--bg-teal-sub, #f0fdf4)",
                                    color: "#16a34a",
                                    borderRadius: "6px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700
                                  }}
                                >
                                  <CheckCircle2 size={13} />
                                  <span>Done</span>
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteTicket(tCode)}
                                title="Delete Ticket"
                                style={{
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  color: "#dc2626",
                                  padding: "4px 7px",
                                  borderRadius: "6px",
                                  fontSize: "0.74rem",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedTicket && (
            <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f766e" }}>{selectedTicket.ticket_code || selectedTicket.id}</span>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "2px 0 0 0" }}>{selectedTicket.subject}</h4>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)" }}>From: {selectedTicket.customer_name || selectedTicket.customer} ({selectedTicket.customer_email || selectedTicket.email})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "3px" }}>Priority</label>
                    <select
                      value={selectedTicket.priority || "Normal"}
                      onChange={(e) => handleUpdatePriority(selectedTicket.ticket_code || selectedTicket.id, e.target.value)}
                      className="pw-calc-input"
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary, #94a3b8)", display: "block", marginBottom: "3px" }}>Status</label>
                    <select
                      value={selectedTicket.status || "Open"}
                      onChange={(e) => handleUpdateStatus(selectedTicket.ticket_code || selectedTicket.id, e.target.value)}
                      className="pw-calc-input"
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "230px", overflowY: "auto", padding: "10px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "14px" }}>
                  {(Array.isArray(selectedTicket.messages) ? selectedTicket.messages : (typeof selectedTicket.messages === "string" ? JSON.parse(selectedTicket.messages) : [{ sender: selectedTicket.customer_name || "Customer", text: selectedTicket.description || selectedTicket.subject, time: "Recent" }])).map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        alignSelf: msg.sender === "Admin Support" ? "flex-end" : "flex-start",
                        background: msg.sender === "Admin Support" ? "#0f766e" : "#ffffff",
                        color: msg.sender === "Admin Support" ? "#ffffff" : "#1e293b",
                        border: msg.sender === "Admin Support" ? "none" : "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        maxWidth: "85%",
                        fontSize: "0.8rem"
                      }}
                    >
                      <div style={{ fontSize: "0.68rem", opacity: 0.8, marginBottom: "2px" }}>{msg.sender} • {msg.time}</div>
                      <div>{msg.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <form onSubmit={handleSendReply} style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Type official response..."
                    className="pw-calc-input"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ flex: 1, fontSize: "0.82rem" }}
                  />
                  <button
                    type="submit"
                    className="pw-calc-btn-submit"
                    style={{ padding: "8px 14px", cursor: "pointer" }}
                  >
                    <Send size={14} />
                  </button>
                </form>

                {selectedTicket.status !== "Resolved" && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTicket.ticket_code || selectedTicket.id, "Resolved")}
                    style={{ width: "100%", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "8px", borderRadius: "8px", fontSize: "0.8rem", fontWeight: 800, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                  >
                    <CheckCircle2 size={15} />
                    <span>Mark Ticket as Resolved</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "audit" && (
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 14px 0" }}>Administrative & Security Audit Events</h4>
          <div className="pw-table-scroll">
            <table className="pw-records-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor / Role</th>
                  <th>Action Performed</th>
                  <th>Target Resource</th>
                  <th>Severity</th>
                  <th>IP / Terminal</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: "0.78rem", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>{log.timestamp}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{log.actor}</td>
                    <td style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{log.action}</td>
                    <td style={{ color: "var(--text-secondary, #94a3b8)" }}>{log.target}</td>
                    <td>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", background: log.severity === "Warning" ? "var(--bg-sub, #fffbeb)" : "var(--bg-teal-sub, #f0fdfa)", color: log.severity === "Warning" ? "#b45309" : "#0f766e" }}>
                        {log.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: "0.74rem", color: "var(--text-secondary, #94a3b8)", fontFamily: "monospace" }}>{log.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

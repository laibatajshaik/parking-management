import { API_BASE_URL } from "../../config/api.js";
import { useState, useEffect, useCallback } from "react";
import Pagination from "../../components/Pagination.jsx";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  Download,
  X,
  Send,
  HelpCircle,
  RefreshCw,
  Trash2,
  Eye,
  Check,
  AlertTriangle,
  Clock,
  ShieldCheck,
  XCircle,
  Server
} from "lucide-react";

export default function SupportAuditLogs() {
  const [currentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("shnoor_current_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeSubTab, setActiveSubTab] = useState("audit");
  const [statusActionMsg, setStatusActionMsg] = useState("");

  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(5);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditRole, setAuditRole] = useState("ALL");
  const [auditModule, setAuditModule] = useState("ALL");
  const [auditAction, setAuditAction] = useState("ALL");
  const [auditStatus, setAuditStatus] = useState("ALL");
  const [auditDateRange, setAuditDateRange] = useState("ALL");
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  const [summaryMetrics, setSummaryMetrics] = useState({
    totalLogs: 0,
    todayLogs: 0,
    successfulActions: 0,
    failedActions: 0,
    adminActions: 0
  });

  const [tickets, setTickets] = useState([]);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketLimit, setTicketLimit] = useState(5);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("All");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const getAuthHeaders = useCallback(() => {
    const email = currentUser?.email || "admin@shnoor.com";
    return {
      "Content-Type": "application/json",
      "x-admin-email": email,
      "Authorization": `Bearer ${email}`
    };
  }, [currentUser]);

  const fetchAuditSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs/summary`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setSummaryMetrics(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch audit summary:", err);
    }
  }, [getAuthHeaders]);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoadingAudit(true);
    try {
      const params = new URLSearchParams({
        page: String(auditPage),
        limit: String(auditLimit),
        search: auditSearch || "",
        role: auditRole,
        module: auditModule,
        action: auditAction,
        status: auditStatus,
        dateRange: auditDateRange
      });

      const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setIsLoadingAudit(false);
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
        setAuditTotal(data.pagination?.total !== undefined ? data.pagination.total : data.total || data.logs.length);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setIsLoadingAudit(false);
    }
  }, [auditPage, auditLimit, auditSearch, auditRole, auditModule, auditAction, auditStatus, auditDateRange, getAuthHeaders]);

  const fetchTickets = useCallback(async () => {
    setIsLoadingTickets(true);
    try {
      const params = new URLSearchParams({
        page: String(ticketPage),
        limit: String(ticketLimit),
        search: ticketSearch || "",
        status: ticketStatusFilter
      });
      const res = await fetch(`${API_BASE_URL}/api/support-tickets?${params}`);
      const data = await res.json();
      setIsLoadingTickets(false);
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        setTicketTotal(data.total !== undefined ? data.total : data.tickets.length);
      }
    } catch {
      setIsLoadingTickets(false);
    }
  }, [ticketPage, ticketLimit, ticketSearch, ticketStatusFilter]);

  useEffect(() => {
    fetchAuditSummary();
  }, [fetchAuditSummary]);

  useEffect(() => {
    if (activeSubTab === "audit") {
      fetchAuditLogs();
    } else {
      fetchTickets();
    }
  }, [activeSubTab, fetchAuditLogs, fetchTickets]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditRole, auditModule, auditAction, auditStatus, auditDateRange]);

  useEffect(() => {
    setTicketPage(1);
  }, [ticketSearch, ticketStatusFilter]);

  const handleRefresh = () => {
    if (activeSubTab === "audit") {
      fetchAuditSummary();
      fetchAuditLogs();
      setStatusActionMsg("Audit logs updated from database.");
    } else {
      fetchTickets();
      setStatusActionMsg("Support tickets refreshed.");
    }
    setTimeout(() => setStatusActionMsg(""), 3000);
  };

  const handleExportCSV = async () => {
    try {
      if (activeSubTab === "audit") {
        const exportParams = new URLSearchParams({
          page: "1",
          limit: "1000",
          search: auditSearch || "",
          role: auditRole,
          module: auditModule,
          action: auditAction,
          status: auditStatus,
          dateRange: auditDateRange
        });

        const res = await fetch(`${API_BASE_URL}/api/admin/audit-logs?${exportParams}`, {
          headers: getAuthHeaders()
        });
        const data = await res.json();
        const exportRecords = data.success && Array.isArray(data.logs) ? data.logs : auditLogs;

        const csvRows = [];
        csvRows.push(["PARKSAFE SMART PARKING - AUDIT & ACTIVITY TRAIL"]);
        csvRows.push([`Exported: ${new Date().toLocaleString("en-IN")}`]);
        csvRows.push([`Filters: Role=${auditRole}, Module=${auditModule}, Action=${auditAction}, Status=${auditStatus}, Range=${auditDateRange}`]);
        csvRows.push([]);
        csvRows.push(["Log ID", "Date & Time", "User", "Role", "Email", "Action", "Module", "Description", "Entity ID", "Status", "IP Address"]);

        exportRecords.forEach((l) => {
          const dateStr = l.created_at ? new Date(l.created_at).toLocaleString("en-IN") : "";
          csvRows.push([
            l.log_code || `LOG-${l.id}`,
            dateStr,
            l.user_name || l.actor || "System",
            l.user_role || l.role || "Staff",
            l.user_email || "N/A",
            l.action || "System Event",
            l.module || "System",
            l.description || l.target || "",
            l.entity_id || "N/A",
            l.status || "Success",
            l.ip_address || l.ip || "127.0.0.1"
          ]);
        });

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
        const filename = `ParkSafe_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;

        link.href = url;
        link.setAttribute("download", filename);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatusActionMsg(`Exported ${exportRecords.length} audit logs to ${filename}`);
      } else {
        const csvRows = [];
        csvRows.push(["PARKSAFE - SUPPORT TICKETS REPORT"]);
        csvRows.push([`Exported: ${new Date().toLocaleString("en-IN")}`]);
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
        const filename = `ParkSafe_Support_Tickets_${new Date().toISOString().slice(0, 10)}.csv`;

        link.href = url;
        link.setAttribute("download", filename);
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setStatusActionMsg(`Exported ${tickets.length} tickets to ${filename}`);
      }
      setTimeout(() => setStatusActionMsg(""), 3500);
    } catch (e) {
      console.error(e);
      setStatusActionMsg("Export failed. Please try again.");
      setTimeout(() => setStatusActionMsg(""), 3500);
    }
  };

  const handleUpdateTicketPriority = async (ticketId, newPriority) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}/priority`, {
        method: "PUT",
        headers: getAuthHeaders(),
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
      }
      setStatusActionMsg(`Ticket priority updated to ${newPriority}.`);
      setTimeout(() => setStatusActionMsg(""), 3000);
    } catch {
      setStatusActionMsg("Failed to update ticket priority.");
    }
  };

  const handleUpdateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
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
      }
      setStatusActionMsg(`Ticket status updated to ${newStatus}.`);
      setTimeout(() => setStatusActionMsg(""), 3000);
    } catch {
      setStatusActionMsg("Failed to update ticket status.");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${ticketId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setTickets((prev) => prev.filter((t) => t.id !== ticketId && t.ticket_code !== ticketId));
        if (selectedTicket && (selectedTicket.id === ticketId || selectedTicket.ticket_code === ticketId)) {
          setSelectedTicket(null);
        }
        setStatusActionMsg(`Ticket removed successfully.`);
        setTimeout(() => setStatusActionMsg(""), 3000);
      }
    } catch {
      setStatusActionMsg("Failed to delete ticket.");
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    try {
      const targetId = selectedTicket.id || selectedTicket.ticket_code;
      const res = await fetch(`${API_BASE_URL}/api/support-tickets/${targetId}/reply`, {
        method: "POST",
        headers: getAuthHeaders(),
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
      setStatusActionMsg("Official reply sent to customer.");
      setTimeout(() => setStatusActionMsg(""), 3500);
    } catch {
      setStatusActionMsg("Failed to send reply.");
    }
  };

  const openTicketsCount = tickets.filter((t) => t.status !== "Resolved").length;

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          className="pw-btn-action-refresh"
          onClick={handleRefresh}
          title="Refresh from PostgreSQL"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}
        >
          <RefreshCw size={14} className={isLoadingAudit || isLoadingTickets ? "pw-spin" : ""} />
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Logs</span>
          <span className="pw-metric-value">{summaryMetrics.totalLogs}</span>
          <span className="pw-metric-trend positive">
            <Server size={13} />
            <span>PostgreSQL Records</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Today's Logs</span>
          <span className="pw-metric-value" style={{ color: "#0f766e" }}>{summaryMetrics.todayLogs}</span>
          <span className="pw-metric-trend positive">
            <Clock size={13} />
            <span>Recorded Today</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Successful Actions</span>
          <span className="pw-metric-value" style={{ color: "#16a34a" }}>{summaryMetrics.successfulActions}</span>
          <span className="pw-metric-trend positive">
            <CheckCircle2 size={13} />
            <span>Clean Operations</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Failed Actions</span>
          <span className="pw-metric-value" style={{ color: summaryMetrics.failedActions > 0 ? "#dc2626" : "#64748b" }}>
            {summaryMetrics.failedActions}
          </span>
          <span className="pw-metric-trend" style={{ color: summaryMetrics.failedActions > 0 ? "#dc2626" : "#64748b" }}>
            <AlertTriangle size={13} />
            <span>Exceptions / Failures</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Admin Actions</span>
          <span className="pw-metric-value" style={{ color: "#7c3aed" }}>{summaryMetrics.adminActions}</span>
          <span className="pw-metric-trend positive">
            <ShieldCheck size={13} />
            <span>Privileged Operations</span>
          </span>
        </div>
      </div>

      {statusActionMsg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{statusActionMsg}</span>
        </div>
      )}

      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "10px 16px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", gap: "8px" }}>
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
            <span>System & Security Audit Logs</span>
          </button>

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
        </div>
      </div>

      {activeSubTab === "audit" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <div className="pw-search-box-pill" style={{ flex: "1 1 240px", minWidth: "220px" }}>
                <Search size={14} className="pw-search-icon" />
                <input
                  type="text"
                  placeholder="Search user, action, module, entity, description..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="pw-pill-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Role:</span>
                <select
                  value={auditRole}
                  onChange={(e) => setAuditRole(e.target.value)}
                  className="pw-calc-select"
                  style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "8px" }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Staff">Staff</option>
                  <option value="Customer">Customer</option>
                  <option value="System">System</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Module:</span>
                <select
                  value={auditModule}
                  onChange={(e) => setAuditModule(e.target.value)}
                  className="pw-calc-select"
                  style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "8px" }}
                >
                  <option value="ALL">All Modules</option>
                  <option value="Authentication">Authentication</option>
                  <option value="Parking Slots">Parking Slots</option>
                  <option value="EV Charging">EV Charging</option>
                  <option value="Bookings">Bookings</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Payments">Payments</option>
                  <option value="Pricing">Pricing</option>
                  <option value="Reports">Reports</option>
                  <option value="Notifications">Notifications</option>
                  <option value="Settings">Settings</option>
                  <option value="Support">Support</option>
                  <option value="Users">Users</option>
                  <option value="System">System</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Action:</span>
                <select
                  value={auditAction}
                  onChange={(e) => setAuditAction(e.target.value)}
                  className="pw-calc-select"
                  style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "8px" }}
                >
                  <option value="ALL">All Actions</option>
                  <option value="Created">Created</option>
                  <option value="Updated">Updated</option>
                  <option value="Deleted">Deleted</option>
                  <option value="Status Changed">Status Changed</option>
                  <option value="Login">Login</option>
                  <option value="Logout">Logout</option>
                  <option value="Payment">Payment</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Status:</span>
                <select
                  value={auditStatus}
                  onChange={(e) => setAuditStatus(e.target.value)}
                  className="pw-calc-select"
                  style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "8px" }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Success">Success</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Date:</span>
                <select
                  value={auditDateRange}
                  onChange={(e) => setAuditDateRange(e.target.value)}
                  className="pw-calc-select"
                  style={{ padding: "6px 10px", fontSize: "0.78rem", borderRadius: "8px" }}
                >
                  <option value="ALL">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "18px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
                System Activity & Security Events ({auditTotal})
              </h4>
              <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #64748b)" }}>
                Showing page {auditPage} of {Math.ceil(auditTotal / auditLimit) || 1}
              </span>
            </div>

            <div className="pw-table-scroll">
              <table className="pw-records-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Description</th>
                    <th>Entity</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingAudit ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary, #64748b)" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                          <RefreshCw size={16} className="pw-spin" />
                          <span>Loading database audit logs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "var(--text-secondary, #94a3b8)" }}>
                        No audit logs found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => {
                      const logId = log.log_code || `LOG-${log.id}`;
                      const dateObj = log.created_at ? new Date(log.created_at) : null;
                      const dateText = dateObj
                        ? dateObj.toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true
                          })
                        : "Recent";

                      const roleLower = (log.user_role || log.role || "staff").toLowerCase();
                      const statusLower = (log.status || "success").toLowerCase();
                      const isSuccess = statusLower === "success";

                      const roleBadgeBg =
                        roleLower === "admin"
                          ? "#f3e8ff"
                          : roleLower === "staff"
                          ? "#e0f2fe"
                          : roleLower === "customer"
                          ? "#f0fdf4"
                          : "#f1f5f9";
                      const roleBadgeColor =
                        roleLower === "admin"
                          ? "#7c3aed"
                          : roleLower === "staff"
                          ? "#0284c7"
                          : roleLower === "customer"
                          ? "#16a34a"
                          : "#475569";

                      const modLower = (log.module || "").toLowerCase();
                      const modBg = modLower.includes("ev")
                        ? "#ccfbf1"
                        : modLower.includes("slot") || modLower.includes("parking")
                        ? "#e0e7ff"
                        : modLower.includes("booking")
                        ? "#fef3c7"
                        : modLower.includes("payment")
                        ? "#dcfce7"
                        : "#f1f5f9";
                      const modColor = modLower.includes("ev")
                        ? "#0f766e"
                        : modLower.includes("slot") || modLower.includes("parking")
                        ? "#4338ca"
                        : modLower.includes("booking")
                        ? "#b45309"
                        : modLower.includes("payment")
                        ? "#15803d"
                        : "#334155";

                      return (
                        <tr key={log.id} style={{ cursor: "pointer" }} onClick={() => setSelectedAuditLog(log)}>
                          <td style={{ fontSize: "0.78rem", color: "var(--text-secondary, #64748b)", whiteSpace: "nowrap" }}>
                            {dateText}
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                            <div>{log.user_name || log.actor || "System"}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #64748b)", fontWeight: 500 }}>{logId}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: "6px",
                                background: roleBadgeBg,
                                color: roleBadgeColor
                              }}
                            >
                              {log.user_role || log.role || "Staff"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>
                            {log.action}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: modBg,
                                color: modColor
                              }}
                            >
                              {log.module || "System"}
                            </span>
                          </td>
                          <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary, #64748b)", fontSize: "0.8rem" }} title={log.description || log.target}>
                            {log.description || log.target || "—"}
                          </td>
                          <td style={{ fontWeight: 700, fontSize: "0.78rem", color: "#0f766e" }}>
                            {log.entity_id || log.target?.split(" ")?.[0] || "—"}
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                padding: "2px 8px",
                                borderRadius: "999px",
                                background: isSuccess ? "#f0fdf4" : "#fef2f2",
                                color: isSuccess ? "#16a34a" : "#dc2626",
                                border: isSuccess ? "1px solid #bbf7d0" : "1px solid #fecaca"
                              }}
                            >
                              {isSuccess ? <Check size={12} /> : <XCircle size={12} />}
                              <span>{log.status || "Success"}</span>
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAuditLog(log);
                              }}
                              style={{
                                background: "var(--bg-sub, #f1f5f9)",
                                border: "1px solid var(--border-color, #cbd5e1)",
                                borderRadius: "6px",
                                padding: "4px 8px",
                                cursor: "pointer",
                                color: "var(--text-primary, #0f172a)",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "0.74rem",
                                fontWeight: 700
                              }}
                            >
                              <Eye size={13} />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={auditPage}
              totalItems={auditTotal}
              itemsPerPage={auditLimit}
              onPageChange={setAuditPage}
              onLimitChange={(newLimit) => {
                setAuditLimit(newLimit);
                setAuditPage(1);
              }}
              itemLabel="audit records"
            />
          </div>
        </div>
      )}

      {activeSubTab === "tickets" && (
        <div className={`pw-admin-support-grid ${selectedTicket ? "has-thread" : ""}`}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div className="pw-card-header-flex">
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>
                Customer Support Inquiries (Live Synced)
              </h4>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary, #94a3b8)" }} />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    style={{
                      padding: "5px 10px 5px 28px",
                      fontSize: "0.76rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color, #cbd5e1)",
                      background: "var(--bg-input, #ffffff)",
                      color: "var(--text-primary, #0f172a)"
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["All", "Open", "In Progress", "Resolved"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setTicketStatusFilter(st)}
                    style={{
                      background: ticketStatusFilter === st ? "#0f766e" : "var(--bg-sub, #f1f5f9)",
                      color: ticketStatusFilter === st ? "#ffffff" : "var(--text-secondary, #475569)",
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
                  {isLoadingTickets ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #64748b)" }}>
                        Loading support inquiries...
                      </td>
                    </tr>
                  ) : tickets.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary, #94a3b8)" }}>
                        No support tickets found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => {
                      const isSel = selectedTicket && (selectedTicket.id === t.id || selectedTicket.ticket_code === t.ticket_code);
                      const tCode = t.ticket_code || t.id;
                      const cName = t.customer_name || t.customer || "Customer";
                      const cEmail = t.customer_email || t.email || "";
                      const dateText = t.created_at ? new Date(t.created_at).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : (t.createdAt || "Recent");
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
                              onChange={(e) => handleUpdateTicketPriority(tCode, e.target.value)}
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
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
                              onChange={(e) => handleUpdateTicketStatus(tCode, e.target.value)}
                              style={{
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
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
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedTicket(t)}
                                style={{
                                  background: "#0f766e",
                                  border: "none",
                                  color: "#ffffff",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer"
                                }}
                              >
                                Reply
                              </button>
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
                                  cursor: "pointer"
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

            <Pagination
              currentPage={ticketPage}
              totalItems={ticketTotal}
              itemsPerPage={ticketLimit}
              onPageChange={setTicketPage}
              onLimitChange={(newLimit) => {
                setTicketLimit(newLimit);
                setTicketPage(1);
              }}
              itemLabel="support tickets"
            />
          </div>

          {selectedTicket && (
            <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0f766e" }}>{selectedTicket.ticket_code || selectedTicket.id}</span>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "2px 0 0 0" }}>{selectedTicket.subject}</h4>
                    <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)" }}>
                      From: {selectedTicket.customer_name || selectedTicket.customer} ({selectedTicket.customer_email || selectedTicket.email})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTicket(null)}
                    style={{ background: "transparent", border: "none", color: "var(--text-secondary, #94a3b8)", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "250px", overflowY: "auto", padding: "10px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)", marginBottom: "14px" }}>
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
                    onClick={() => handleUpdateTicketStatus(selectedTicket.ticket_code || selectedTicket.id, "Resolved")}
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

      {selectedAuditLog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
          onClick={() => setSelectedAuditLog(null)}
        >
          <div
            style={{
              background: "var(--bg-card, #ffffff)",
              borderRadius: "16px",
              maxWidth: "560px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid var(--border-color, #e2e8f0)",
              overflow: "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border-color, #e2e8f0)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#f0fdfa", color: "#0f766e", padding: "8px", borderRadius: "10px" }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                    Audit Log Details
                  </h3>
                  <span style={{ fontSize: "0.78rem", color: "#0f766e", fontWeight: 800 }}>
                    {selectedAuditLog.log_code || `LOG-${selectedAuditLog.id}`}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.85rem", maxHeight: "75vh", overflowY: "auto" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: (selectedAuditLog.status || "success").toLowerCase() === "success" ? "#f0fdf4" : "#fef2f2",
                  border: (selectedAuditLog.status || "success").toLowerCase() === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca"
                }}
              >
                <span style={{ fontWeight: 700, color: (selectedAuditLog.status || "success").toLowerCase() === "success" ? "#16a34a" : "#dc2626" }}>
                  Execution Result
                </span>
                <span style={{ fontWeight: 800, color: (selectedAuditLog.status || "success").toLowerCase() === "success" ? "#16a34a" : "#dc2626" }}>
                  {selectedAuditLog.status || "Success"}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-sub, #f8fafc)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>User</span>
                  <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                    {selectedAuditLog.user_name || selectedAuditLog.actor || "System"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Role</span>
                  <span style={{ fontWeight: 800, color: "#7c3aed" }}>
                    {selectedAuditLog.user_role || selectedAuditLog.role || "Staff"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>User Email</span>
                  <span style={{ fontWeight: 700, color: "var(--text-secondary, #475569)" }}>
                    {selectedAuditLog.user_email || "N/A"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Date & Time</span>
                  <span style={{ fontWeight: 700, color: "var(--text-secondary, #475569)" }}>
                    {selectedAuditLog.created_at ? new Date(selectedAuditLog.created_at).toLocaleString("en-IN") : "Recent"}
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-sub, #f8fafc)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Action</span>
                  <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>
                    {selectedAuditLog.action}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Module</span>
                  <span style={{ fontWeight: 800, color: "#0f766e" }}>
                    {selectedAuditLog.module || "System"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Entity Type</span>
                  <span style={{ fontWeight: 700, color: "var(--text-secondary, #475569)" }}>
                    {selectedAuditLog.entity_type || "N/A"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Entity ID</span>
                  <span style={{ fontWeight: 800, color: "#0f766e" }}>
                    {selectedAuditLog.entity_id || selectedAuditLog.target?.split(" ")?.[0] || "N/A"}
                  </span>
                </div>
              </div>

              <div style={{ background: "var(--bg-sub, #f8fafc)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "4px" }}>
                  Detailed Description
                </span>
                <p style={{ margin: 0, fontWeight: 700, color: "var(--text-primary, #0f172a)", lineHeight: 1.5 }}>
                  {selectedAuditLog.description || selectedAuditLog.target || "No extra technical description recorded."}
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--bg-sub, #f8fafc)", padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>IP Address</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-secondary, #475569)" }}>
                    {selectedAuditLog.ip_address || selectedAuditLog.ip || "127.0.0.1"}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>Severity</span>
                  <span style={{ fontWeight: 800, color: "#0f766e" }}>
                    {selectedAuditLog.severity || "Low"}
                  </span>
                </div>

                {selectedAuditLog.user_agent && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #64748b)", display: "block", marginBottom: "2px" }}>User Agent</span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-secondary, #64748b)", wordBreak: "break-all" }}>
                      {selectedAuditLog.user_agent}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-color, #e2e8f0)", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                className="pw-calc-btn-submit"
                style={{ padding: "8px 20px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

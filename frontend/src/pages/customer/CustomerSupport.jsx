import { useState, useEffect } from "react";
import {
  HelpCircle,
  PhoneCall,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  CheckCircle2,
  RefreshCw
} from "lucide-react";

export default function CustomerSupport({ currentUser, isPremiumActive }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  const [faqs] = useState([
    {
      q: "How does the Fastag RFID automated boom barrier work?",
      a: "Once you register your vehicle plate number in your profile or have an active Monthly VIP Pass, our high-speed overhead RFID sensors detect your tag as you approach the gate. The boom barrier lifts automatically in under 1.5 seconds without needing a paper ticket."
    },
    {
      q: "What exclusive benefits are included in the Monthly VIP Priority Pass?",
      a: "The Monthly VIP Pass (₹2,500/month) gives you a 100% guaranteed dedicated bay in Zone A (Ground Floor), unlimited 24/7 multi-entry access for 30 days, free monthly car wash tokens, complimentary EV fast charging boost, zero cancellation fees, and the exclusive Gold VIP theme."
    },
    {
      q: "How do I choose between Hourly, Daily, and Monthly passes?",
      a: "Hourly passes are ideal for short shopping or dining trips (1–4 hours). Full Day passes provide unlimited 24-hour access at significant savings for full-day parking. Monthly VIP passes offer up to 76% cost savings and guaranteed bays for daily commuters."
    },
    {
      q: "Can I modify or cancel my advance slot reservation?",
      a: "Yes! Advance reservations can be rescheduled or cancelled up to 15 minutes before your scheduled arrival time directly from 'My Bookings'. VIP members enjoy zero cancellation penalties and free date changes."
    },
    {
      q: "Where are the EV fast charging bays located?",
      a: "All 60kW DC fast charging bays are located on Ground Floor Zone C (Bays C-01 through C-06). Both CCS2 and Type-2 connectors are supported."
    },
    {
      q: "What should I do if the exit barrier does not lift automatically?",
      a: "Simply show your Digital Pass QR code from your phone to the scanner on the driver's side terminal, or press the 'Intercom Help' button on the kiosk to connect directly with on-duty staff."
    }
  ]);

  const [myTickets, setMyTickets] = useState([]);

  const userEmail = currentUser?.email || "customer@shnoor.com";

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const res = await fetch(`http://localhost:5000/api/support-tickets?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setIsLoadingTickets(false);
      if (data.success && data.tickets) {
        setMyTickets(data.tickets);
      }
    } catch {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchMyTickets();
  }, [userEmail]);

  const [ticketForm, setTicketForm] = useState({
    category: "Reservation Query",
    subject: "",
    description: "",
    priority: "Normal"
  });

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:5000/api/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: currentUser?.name || "Customer",
          customer_email: userEmail,
          subject: ticketForm.subject,
          category: ticketForm.category,
          description: ticketForm.description,
          priority: ticketForm.priority
        })
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.ticket) {
        setMyTickets([data.ticket, ...myTickets]);
        setIsNewTicketOpen(false);
        setTicketForm({ category: "Reservation Query", subject: "", description: "", priority: "Normal" });
        setStatusMessage(`Ticket ${data.ticket.ticket_code} created successfully! Our team will assist you.`);
        setTimeout(() => setStatusMessage(""), 5000);
      } else {
        setIsNewTicketOpen(false);
        setStatusMessage("Ticket submitted successfully!");
        setTimeout(() => setStatusMessage(""), 4000);
        fetchMyTickets();
      }
    } catch {
      setIsSubmitting(false);
      setIsNewTicketOpen(false);
      setStatusMessage("Ticket submitted successfully!");
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: isPremiumActive ? "var(--bg-sub, #FDF0CD)" : "var(--bg-teal-sub, #f0fdfa)", color: isPremiumActive ? "#9A6B18" : "#0d9488", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Customer Helpdesk & 24/7 Support</h3>
            <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)" }}>Instant answers and support inquiries</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="pw-btn-action-refresh"
            onClick={fetchMyTickets}
            title="Refresh Inquiries"
          >
            <RefreshCw size={14} className={isLoadingTickets ? "pw-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className={`pw-calc-btn-submit ${isPremiumActive ? "pw-btn-gold" : ""}`}
            onClick={() => setIsNewTicketOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", fontSize: "0.84rem", fontWeight: 800, cursor: "pointer" }}
          >
            <Plus size={15} />
            <span>Submit Support Ticket</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "12px 18px", borderRadius: "10px", fontSize: "0.86rem", fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CheckCircle2 size={18} />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage("")} style={{ background: "transparent", border: "none", color: "#16a34a", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="pw-support-two-col-grid">
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "22px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Frequently Asked Questions</h4>
            <div className="pw-search-box-pill">
              <Search size={13} className="pw-search-icon" />
              <input
                type="text"
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pw-pill-input"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: isOpen ? (isPremiumActive ? "1.5px solid #EAB308" : "1.5px solid #0d9488") : "1px solid #e2e8f0",
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: isOpen ? (isPremiumActive ? "#FFFDF5" : "#f0fdfa") : "#ffffff"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 16px",
                      background: "transparent",
                      border: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, color: isOpen ? (isPremiumActive ? "#facc15" : "#2dd4bf") : "var(--text-primary, #1e293b)" }}>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp size={16} style={{ color: isPremiumActive ? "#713F12" : "#0f766e", flexShrink: 0 }} />
                    ) : (
                      <ChevronDown size={16} style={{ color: "var(--text-secondary, #94a3b8)", flexShrink: 0 }} />
                    )}
                  </button>

                  {isOpen && (
                    <div style={{ padding: "0 16px 14px 16px", fontSize: "0.82rem", color: "var(--text-secondary, #94a3b8)", lineHeight: 1.55 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #f1f5f9)" }}>
              <PhoneCall size={18} style={{ color: isPremiumActive ? "#9A6B18" : "#0d9488" }} />
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Direct Support Helplines</h4>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
              <div style={{ padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.72rem" }}>24/7 Customer Care Desk</div>
                <div style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)", fontSize: "0.95rem" }}>+91 80 2345 6789</div>
              </div>

              <div style={{ padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.72rem" }}>VIP Concierge & Valet Priority</div>
                <div style={{ fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0d9488", fontSize: "0.95rem" }}>+91 80 2345 6799 (Toll Free)</div>
              </div>

              <div style={{ padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                <div style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.72rem" }}>Email Assistance</div>
                <div style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>support@shnoorparking.com</div>
              </div>
            </div>
          </div>

          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>My Active Inquiries ({myTickets.length})</h4>
              <span style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)" }}>Status Overview</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto" }}>
              {myTickets.length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-secondary, #94a3b8)", fontSize: "0.82rem", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px" }}>
                  No active support inquiries. Click "Submit Support Ticket" above to reach our team.
                </div>
              ) : (
                myTickets.map((t) => {
                  const tCode = t.ticket_code || t.id;
                  const dateStr = t.created_at ? new Date(t.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent";
                  return (
                    <div
                      key={tCode}
                      style={{
                        padding: "12px",
                        background: "var(--bg-sub, #f8fafc)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #e2e8f0)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.74rem", fontWeight: 800, color: isPremiumActive ? "#9A6B18" : "#0d9488" }}>
                          {tCode}
                        </span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "2px 8px", borderRadius: "999px", background: "var(--bg-sub, #f0fdf4)", color: t.status === "Resolved" ? "#16a34a" : t.status === "In Progress" ? "#b45309" : "#0f766e" }}>
                          {t.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{t.subject}</div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-secondary, #94a3b8)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{t.category}</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {isNewTicketOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)", padding: "16px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", padding: "24px", maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Create Support Request</h3>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-secondary, #94a3b8)" }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Inquiry Category</label>
                <select
                  className="pw-calc-input"
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                >
                  <option value="Reservation Query">Reservation / Slot Modification</option>
                  <option value="Hardware / RFID">Fastag RFID / Barrier Gate Issue</option>
                  <option value="Billing & Invoices">Billing & GST Tax Invoices</option>
                  <option value="VIP Perks">VIP Membership Perks</option>
                  <option value="EV Charging">EV Fast Charging Station</option>
                </select>
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your query..."
                  className="pw-calc-input"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                />
              </div>

              <div className="pw-calc-field-group">
                <label className="pw-calc-label">Detailed Description</label>
                <textarea
                  className="pw-calc-input"
                  rows="3"
                  placeholder="Please describe how we can assist you..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  className="pw-calc-btn-reset"
                  onClick={() => setIsNewTicketOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`pw-calc-btn-submit ${isPremiumActive ? "pw-btn-gold" : ""}`}
                >
                  {isSubmitting ? "Submitting..." : "Send Ticket to Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

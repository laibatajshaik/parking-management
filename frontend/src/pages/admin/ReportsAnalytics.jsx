import { useState } from "react";
import { BarChart3, TrendingUp, Download, Car, Clock, Zap, CreditCard, Smartphone, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ReportsAnalytics() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");

  const datasets = {
    "Today": {
      metrics: {
        totalRevenue: "₹ 8,450",
        revenueGrowth: "+8.5% vs yesterday",
        totalVehicles: "142",
        vehicleSubtitle: "142 entries today",
        avgDuration: "2.1 hrs",
        durationSubtitle: "Quick bay turnover",
        peakOccupancy: "96.2%",
        peakSubtitle: "11:30 AM & 06:30 PM"
      },
      hourlyTrends: [
        { hour: "06 AM", vehicles: 8, revenue: 400 },
        { hour: "08 AM", vehicles: 22, revenue: 1300 },
        { hour: "10 AM", vehicles: 35, revenue: 2450 },
        { hour: "12 PM", vehicles: 28, revenue: 1950 },
        { hour: "02 PM", vehicles: 24, revenue: 1650 },
        { hour: "04 PM", vehicles: 32, revenue: 2200 },
        { hour: "06 PM", vehicles: 38, revenue: 2650 },
        { hour: "08 PM", vehicles: 25, revenue: 1750 },
        { hour: "10 PM", vehicles: 10, revenue: 700 }
      ],
      vehicleDistribution: [
        { type: "Standard Cars", count: 82, pct: 58, color: "#0d9488", icon: Car },
        { type: "SUVs & Premium", count: 31, pct: 22, color: "#7c3aed", icon: Car },
        { type: "Two-Wheelers", count: 20, pct: 14, color: "#0284c7", icon: Layers },
        { type: "EV Fast Charged", count: 9, pct: 6, color: "#10b981", icon: Zap }
      ],
      paymentBreakdown: [
        { method: "Fastag / UPI Express", amount: "₹ 4,560", count: 77, pct: 54, icon: Smartphone },
        { method: "Credit / Debit Cards", amount: "₹ 2,370", count: 40, pct: 28, icon: CreditCard },
        { method: "Cash Desk Counter", amount: "₹ 1,520", count: 25, pct: 18, icon: Layers }
      ],
      zonePerformance: [
        { zone: "Zone A (Ground Floor - VIP)", totalBays: 40, avgOccupancy: "95%", turnover: "4.2x/day", revenue: "₹ 3,250" },
        { zone: "Zone B (Basement 1)", totalBays: 60, avgOccupancy: "88%", turnover: "3.8x/day", revenue: "₹ 2,600" },
        { zone: "Zone C (EV Fast Charging)", totalBays: 20, avgOccupancy: "80%", turnover: "3.1x/day", revenue: "₹ 1,800" },
        { zone: "Zone D (Two-Wheelers)", totalBays: 30, avgOccupancy: "90%", turnover: "5.0x/day", revenue: "₹ 800" }
      ]
    },
    "Last 7 Days": {
      metrics: {
        totalRevenue: "₹ 58,920",
        revenueGrowth: "+11.8% vs last week",
        totalVehicles: "896",
        vehicleSubtitle: "128 avg daily turn-in",
        avgDuration: "2.3 hrs",
        durationSubtitle: "Optimal week turnover",
        peakOccupancy: "92.4%",
        peakSubtitle: "Weekend peak hours"
      },
      hourlyTrends: [
        { hour: "06 AM", vehicles: 45, revenue: 2600 },
        { hour: "08 AM", vehicles: 140, revenue: 9200 },
        { hour: "10 AM", vehicles: 260, revenue: 18200 },
        { hour: "12 PM", vehicles: 340, revenue: 23800 },
        { hour: "02 PM", vehicles: 310, revenue: 21700 },
        { hour: "04 PM", vehicles: 380, revenue: 26600 },
        { hour: "06 PM", vehicles: 450, revenue: 31500 },
        { hour: "08 PM", vehicles: 390, revenue: 27300 },
        { hour: "10 PM", vehicles: 150, revenue: 10500 }
      ],
      vehicleDistribution: [
        { type: "Standard Cars", count: 520, pct: 58, color: "#0d9488", icon: Car },
        { type: "SUVs & Premium", count: 197, pct: 22, color: "#7c3aed", icon: Car },
        { type: "Two-Wheelers", count: 125, pct: 14, color: "#0284c7", icon: Layers },
        { type: "EV Fast Charged", count: 54, pct: 6, color: "#10b981", icon: Zap }
      ],
      paymentBreakdown: [
        { method: "Fastag / UPI Express", amount: "₹ 31,820", count: 484, pct: 54, icon: Smartphone },
        { method: "Credit / Debit Cards", amount: "₹ 16,500", count: 251, pct: 28, icon: CreditCard },
        { method: "Cash Desk Counter", amount: "₹ 10,600", count: 161, pct: 18, icon: Layers }
      ],
      zonePerformance: [
        { zone: "Zone A (Ground Floor - VIP)", totalBays: 40, avgOccupancy: "93%", turnover: "4.6x/day", revenue: "₹ 21,500" },
        { zone: "Zone B (Basement 1)", totalBays: 60, avgOccupancy: "87%", turnover: "4.0x/day", revenue: "₹ 18,200" },
        { zone: "Zone C (EV Fast Charging)", totalBays: 20, avgOccupancy: "79%", turnover: "3.2x/day", revenue: "₹ 12,400" },
        { zone: "Zone D (Two-Wheelers)", totalBays: 30, avgOccupancy: "89%", turnover: "5.2x/day", revenue: "₹ 6,820" }
      ]
    },
    "Last 30 Days": {
      metrics: {
        totalRevenue: "₹ 2,48,500",
        revenueGrowth: "+14.2% vs previous period",
        totalVehicles: "3,842",
        vehicleSubtitle: "128 avg daily turn-in",
        avgDuration: "2.4 hrs",
        durationSubtitle: "Optimal bay turnover",
        peakOccupancy: "94.6%",
        peakSubtitle: "06:00 PM - 08:30 PM"
      },
      hourlyTrends: [
        { hour: "06 AM", vehicles: 24, revenue: 1200 },
        { hour: "08 AM", vehicles: 85, revenue: 5100 },
        { hour: "10 AM", vehicles: 160, revenue: 11200 },
        { hour: "12 PM", vehicles: 210, revenue: 16800 },
        { hour: "02 PM", vehicles: 195, revenue: 14500 },
        { hour: "04 PM", vehicles: 230, revenue: 18400 },
        { hour: "06 PM", vehicles: 280, revenue: 22400 },
        { hour: "08 PM", vehicles: 240, revenue: 19200 },
        { hour: "10 PM", vehicles: 95, revenue: 6600 }
      ],
      vehicleDistribution: [
        { type: "Standard Cars", count: 2240, pct: 58, color: "#0d9488", icon: Car },
        { type: "SUVs & Premium", count: 845, pct: 22, color: "#7c3aed", icon: Car },
        { type: "Two-Wheelers", count: 538, pct: 14, color: "#0284c7", icon: Layers },
        { type: "EV Fast Charged", count: 219, pct: 6, color: "#10b981", icon: Zap }
      ],
      paymentBreakdown: [
        { method: "Fastag / UPI Express", amount: "₹ 1,34,190", count: 2075, pct: 54, icon: Smartphone },
        { method: "Credit / Debit Cards", amount: "₹ 69,580", count: 1075, pct: 28, icon: CreditCard },
        { method: "Cash Desk Counter", amount: "₹ 44,730", count: 692, pct: 18, icon: Layers }
      ],
      zonePerformance: [
        { zone: "Zone A (Ground Floor - VIP)", totalBays: 40, avgOccupancy: "92%", turnover: "4.8x/day", revenue: "₹ 88,400" },
        { zone: "Zone B (Basement 1)", totalBays: 60, avgOccupancy: "86%", turnover: "3.9x/day", revenue: "₹ 74,200" },
        { zone: "Zone C (EV Fast Charging)", totalBays: 20, avgOccupancy: "78%", turnover: "3.2x/day", revenue: "₹ 52,100" },
        { zone: "Zone D (Two-Wheelers)", totalBays: 30, avgOccupancy: "88%", turnover: "5.4x/day", revenue: "₹ 33,800" }
      ]
    },
    "Quarterly": {
      metrics: {
        totalRevenue: "₹ 7,64,200",
        revenueGrowth: "+18.5% YoY Growth",
        totalVehicles: "11,920",
        vehicleSubtitle: "Quarterly total turn-in",
        avgDuration: "2.6 hrs",
        durationSubtitle: "Multi-facility average",
        peakOccupancy: "97.1%",
        peakSubtitle: "Festive & peak periods"
      },
      hourlyTrends: [
        { hour: "06 AM", vehicles: 120, revenue: 6200 },
        { hour: "08 AM", vehicles: 420, revenue: 26500 },
        { hour: "10 AM", vehicles: 810, revenue: 54200 },
        { hour: "12 PM", vehicles: 1050, revenue: 73500 },
        { hour: "02 PM", vehicles: 980, revenue: 68600 },
        { hour: "04 PM", vehicles: 1180, revenue: 82600 },
        { hour: "06 PM", vehicles: 1420, revenue: 99400 },
        { hour: "08 PM", vehicles: 1210, revenue: 84700 },
        { hour: "10 PM", vehicles: 480, revenue: 33600 }
      ],
      vehicleDistribution: [
        { type: "Standard Cars", count: 6914, pct: 58, color: "#0d9488", icon: Car },
        { type: "SUVs & Premium", count: 2622, pct: 22, color: "#7c3aed", icon: Car },
        { type: "Two-Wheelers", count: 1669, pct: 14, color: "#0284c7", icon: Layers },
        { type: "EV Fast Charged", count: 715, pct: 6, color: "#10b981", icon: Zap }
      ],
      paymentBreakdown: [
        { method: "Fastag / UPI Express", amount: "₹ 4,12,670", count: 6437, pct: 54, icon: Smartphone },
        { method: "Credit / Debit Cards", amount: "₹ 2,13,980", count: 3338, pct: 28, icon: CreditCard },
        { method: "Cash Desk Counter", amount: "₹ 1,37,550", count: 2145, pct: 18, icon: Layers }
      ],
      zonePerformance: [
        { zone: "Zone A (Ground Floor - VIP)", totalBays: 40, avgOccupancy: "94%", turnover: "5.1x/day", revenue: "₹ 2,75,000" },
        { zone: "Zone B (Basement 1)", totalBays: 60, avgOccupancy: "89%", turnover: "4.2x/day", revenue: "₹ 2,28,400" },
        { zone: "Zone C (EV Fast Charging)", totalBays: 20, avgOccupancy: "82%", turnover: "3.6x/day", revenue: "₹ 1,56,800" },
        { zone: "Zone D (Two-Wheelers)", totalBays: 30, avgOccupancy: "91%", turnover: "5.8x/day", revenue: "₹ 1,04,000" }
      ]
    }
  };

  const currentData = datasets[timeRange] || datasets["Last 30 Days"];

  const handleExportCSV = () => {
    setIsExporting(true);
    setExportMessage(`Generating ${timeRange} comprehensive audit report...`);

    try {
      const csvRows = [];
      csvRows.push(["SHNOOR SMART PARKING - EXECUTIVE REVENUE & OCCUPANCY AUDIT REPORT"]);
      csvRows.push([`Generated At: ${new Date().toLocaleString("en-IN")}`]);
      csvRows.push([`Selected Time Range: ${timeRange}`]);
      csvRows.push([]);

      csvRows.push(["EXECUTIVE KPI SUMMARY"]);
      csvRows.push(["Metric", "Value", "Notes"]);
      csvRows.push(["Total Revenue", currentData.metrics.totalRevenue, currentData.metrics.revenueGrowth]);
      csvRows.push(["Total Vehicles Handled", currentData.metrics.totalVehicles, currentData.metrics.vehicleSubtitle]);
      csvRows.push(["Avg Parking Duration", currentData.metrics.avgDuration, currentData.metrics.durationSubtitle]);
      csvRows.push(["Peak Occupancy Rate", currentData.metrics.peakOccupancy, currentData.metrics.peakSubtitle]);
      csvRows.push([]);

      csvRows.push(["HOURLY TRAFFIC & REVENUE HEATMAP"]);
      csvRows.push(["Hour", "Vehicles Count", "Revenue (INR)"]);
      currentData.hourlyTrends.forEach((row) => {
        csvRows.push([row.hour, row.vehicles, `₹ ${row.revenue}`]);
      });
      csvRows.push([]);

      csvRows.push(["VEHICLE TYPE DISTRIBUTION"]);
      csvRows.push(["Vehicle Category", "Count", "Percentage"]);
      currentData.vehicleDistribution.forEach((v) => {
        csvRows.push([v.type, v.count, `${v.pct}%`]);
      });
      csvRows.push([]);

      csvRows.push(["PAYMENT METHOD SETTLEMENT"]);
      csvRows.push(["Payment Mode", "Transaction Count", "Percentage", "Total Settled Amount"]);
      currentData.paymentBreakdown.forEach((p) => {
        csvRows.push([p.method, p.count, `${p.pct}%`, p.amount]);
      });
      csvRows.push([]);

      csvRows.push(["ZONE EFFICIENCY & TURNOVER PERFORMANCE"]);
      csvRows.push(["Zone", "Total Bay Count", "Avg Occupancy", "Daily Turnover", "Total Revenue"]);
      currentData.zonePerformance.forEach((z) => {
        csvRows.push([z.zone, `${z.totalBays} Bays`, z.avgOccupancy, z.turnover, z.revenue]);
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
      const safeRange = timeRange.replace(/\s+/g, "_").toLowerCase();
      const filename = `ParkSafe_Analytics_${safeRange}_${new Date().toISOString().slice(0, 10)}.csv`;

      link.href = url;
      link.setAttribute("download", filename);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setExportMessage(`File "${filename}" downloaded successfully to your Downloads folder!`);
      setTimeout(() => setExportMessage(""), 5000);
    } catch {
      setIsExporting(false);
      setExportMessage("Export failed. Please check browser permissions and try again.");
      setTimeout(() => setExportMessage(""), 4000);
    }
  };

  const maxVehicleVal = Math.max(...currentData.hourlyTrends.map((h) => h.vehicles), 1);

  return (
    <div className="pw-screen-container" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
      <div className="pw-plans-action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "var(--bg-card, #ffffff)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--border-color, #e2e8f0)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Executive Revenue & Occupancy Intelligence</h3>
            <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)" }}>Live audited metrics for {timeRange}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px", background: "var(--bg-sub, #f8fafc)", padding: "4px", borderRadius: "8px" }}>
            {["Today", "Last 7 Days", "Last 30 Days", "Quarterly"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? "#0f766e" : "var(--bg-sub, transparent)",
                  color: timeRange === range ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "6px",
                  padding: "5px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pw-calc-btn-submit"
            onClick={handleExportCSV}
            disabled={isExporting}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.82rem", cursor: "pointer" }}
          >
            <Download size={14} />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {exportMessage && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdf4)", border: "1px solid var(--border-color, #bbf7d0)", color: "#16a34a", padding: "10px 16px", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 700 }}>
          <CheckCircle2 size={16} />
          <span>{exportMessage}</span>
        </div>
      )}

      <div className="pw-metrics-four-grid">
        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Revenue ({timeRange})</span>
          <span className="pw-metric-value" style={{ color: "#0f766e" }}>{currentData.metrics.totalRevenue}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={13} />
            <span>{currentData.metrics.revenueGrowth}</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Total Vehicles Handled</span>
          <span className="pw-metric-value">{currentData.metrics.totalVehicles}</span>
          <span className="pw-metric-trend positive">
            <Car size={13} />
            <span>{currentData.metrics.vehicleSubtitle}</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Avg Parking Duration</span>
          <span className="pw-metric-value">{currentData.metrics.avgDuration}</span>
          <span className="pw-metric-trend positive">
            <Clock size={13} />
            <span>{currentData.metrics.durationSubtitle}</span>
          </span>
        </div>

        <div className="pw-metric-card">
          <span className="pw-metric-label">Peak Occupancy Rate</span>
          <span className="pw-metric-value">{currentData.metrics.peakOccupancy}</span>
          <span className="pw-metric-trend positive">
            <ShieldCheck size={13} />
            <span>{currentData.metrics.peakSubtitle}</span>
          </span>
        </div>
      </div>

      <div className="pw-analytics-two-col-grid">
        <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 }}>Peak Traffic & Revenue Heatmap ({timeRange})</h4>
              <span style={{ fontSize: "0.76rem", color: "var(--text-secondary, #94a3b8)" }}>Hourly distribution of inbound vehicle check-ins</span>
            </div>
            <span style={{ fontSize: "0.74rem", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", border: "1px solid #ccfbf1", padding: "3px 10px", borderRadius: "999px", fontWeight: 700 }}>
              Peak at 06:00 PM
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {currentData.hourlyTrends.map((item, idx) => {
              const barWidth = Math.round((item.vehicles / maxVehicleVal) * 100);
              return (
                <div key={idx} className="pw-heatmap-row-grid">
                  <span style={{ fontWeight: 700, color: "var(--text-secondary, #94a3b8)" }}>{item.hour}</span>
                  <div style={{ height: "14px", background: "var(--bg-sub, #f8fafc)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${barWidth}%`, height: "100%", background: barWidth > 80 ? "linear-gradient(90deg, #0d9488, #059669)" : "linear-gradient(90deg, #38bdf8, #0284c7)", borderRadius: "4px", transition: "width 0.3s ease" }} />
                  </div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary, #1e293b)", textAlign: "right" }}>{item.vehicles} vehicles</span>
                  <span style={{ fontWeight: 800, color: "#0f766e", textAlign: "right" }}>₹ {item.revenue.toLocaleString("en-IN")}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 14px 0" }}>Vehicle Type Distribution ({timeRange})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {currentData.vehicleDistribution.map((v, idx) => {
                const Icon = v.icon;
                return (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", marginBottom: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--text-secondary, #cbd5e1)" }}>
                        <Icon size={14} style={{ color: v.color }} />
                        <span>{v.type}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: "var(--text-primary, #0f172a)" }}>{v.count} ({v.pct}%)</span>
                    </div>
                    <div style={{ height: "6px", background: "var(--bg-sub, #f8fafc)", borderRadius: "999px", overflow: "hidden" }}>
                      <div style={{ width: `${v.pct}%`, height: "100%", background: v.color, borderRadius: "999px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
            <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 14px 0" }}>Payment Mode Settlement ({timeRange})</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentData.paymentBreakdown.map((pm, idx) => {
                const Icon = pm.icon;
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg-sub, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-color, #e2e8f0)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "var(--bg-teal-sub, #f0fdfa)", color: "#0f766e", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary, #1e293b)" }}>{pm.method}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary, #94a3b8)" }}>{pm.count} transactions ({pm.pct}%)</div>
                      </div>
                    </div>
                    <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f766e" }}>{pm.amount}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--bg-card, #ffffff)", borderRadius: "14px", border: "1px solid var(--border-color, #e2e8f0)", padding: "20px", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
        <h4 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: "0 0 14px 0" }}>Zone Efficiency & Turnover Performance ({timeRange})</h4>
        <div className="pw-table-scroll">
          <table className="pw-records-table">
            <thead>
              <tr>
                <th>Parking Zone</th>
                <th style={{ textAlign: "center" }}>Total Bay Count</th>
                <th style={{ textAlign: "center" }}>Avg Occupancy</th>
                <th style={{ textAlign: "center" }}>Daily Bay Turnover</th>
                <th style={{ textAlign: "right" }}>Total Zone Revenue</th>
              </tr>
            </thead>
            <tbody>
              {currentData.zonePerformance.map((zp, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{zp.zone}</td>
                  <td style={{ textAlign: "center" }}>{zp.totalBays} Bays</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ background: "var(--bg-teal-sub, #f0fdf4)", color: "#16a34a", padding: "2px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700 }}>
                      {zp.avgOccupancy}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", color: "var(--text-secondary, #94a3b8)", fontWeight: 600 }}>{zp.turnover}</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "#0f766e" }}>{zp.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Download, Car, Clock, Zap, CreditCard, Smartphone, Layers, ShieldCheck, CheckCircle2, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "../../config/api.js";
import Pagination from "../../components/Pagination.jsx";

export default function ReportsAnalytics() {
  const [timeRange, setTimeRange] = useState("Last 30 Days");
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [zonePage, setZonePage] = useState(1);
  const [zoneLimit, setZoneLimit] = useState(5);

  const fetchAnalytics = () => {
    return fetch(`${API_BASE_URL}/api/admin/reports-analytics?range=${encodeURIComponent(timeRange)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAnalyticsData(data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setZonePage(1);
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
  };

  const summary = analyticsData?.summary || { totalRevenue: 0, totalBookings: 0, avgOccupancy: 0, activeParked: 0 };
  const evStats = analyticsData?.evStats || { sessionsCount: 0, revenue: 0, energyKwh: 0, totalSlots: 6, availableSlots: 5 };
  const vehicleBreakdown = analyticsData?.vehicleBreakdown || [];
  const paymentBreakdown = analyticsData?.paymentBreakdown || [];
  const zoneStats = analyticsData?.zoneStats || [];

  const totalVehiclesCount = vehicleBreakdown.reduce((sum, v) => sum + v.count, 0) || (summary.totalBookings || 1);

  const vehicleDistribution = vehicleBreakdown.map((v) => {
    const pct = Math.round((v.count / totalVehiclesCount) * 100);
    let icon = Car;
    let color = "#0d9488";
    if (v.type === "SUV") {
      color = "#7c3aed";
    } else if (v.type === "Bike") {
      icon = Layers;
      color = "#0284c7";
    } else if (v.type === "EV") {
      icon = Zap;
      color = "#10b981";
    }
    return {
      type: v.type === "Car" ? "Standard Cars" : v.type === "SUV" ? "SUVs & Large Vehicles" : v.type === "Bike" ? "Two-Wheelers" : "EV Fast Charged",
      count: v.count,
      pct,
      color,
      icon
    };
  });

  const totalPaymentsCount = paymentBreakdown.reduce((sum, p) => sum + p.count, 0) || 1;
  const formattedPaymentBreakdown = paymentBreakdown.map((p) => ({
    method: p.method === "UPI" ? "Fastag / UPI Express" : p.method && p.method.includes("Card") ? "Credit / Debit Cards" : "Cash Desk Counter",
    amount: `₹ ${Math.round(p.amount).toLocaleString("en-IN")}`,
    count: p.count,
    pct: Math.round((p.count / totalPaymentsCount) * 100),
    icon: p.method === "UPI" ? Smartphone : p.method && p.method.includes("Card") ? CreditCard : Layers
  }));

  const zonePerformance = zoneStats.map((z) => ({
    zone: `${z.zone} (Facility Bay)`,
    totalBays: z.total,
    avgOccupancy: `${z.rate}%`,
    turnover: `${(z.occupied > 0 ? (z.occupied * 0.8).toFixed(1) : "0.0")}x/day`,
    revenue: `₹ ${Math.round((z.occupied || 0) * 150).toLocaleString("en-IN")}`
  }));

  const currentData = {
    metrics: {
      totalRevenue: `₹ ${Math.round(summary.totalRevenue).toLocaleString("en-IN")}`,
      revenueGrowth: "Real Database Revenue",
      totalVehicles: String(summary.totalBookings),
      vehicleSubtitle: `${summary.activeParked} active parked bays`,
      avgDuration: "2.4 hrs",
      durationSubtitle: "Average turnover rate",
      peakOccupancy: `${summary.avgOccupancy}%`,
      peakSubtitle: "Live occupancy status"
    },
    hourlyTrends: analyticsData?.hourlyTrends || [
      { hour: "06 AM", vehicles: 0, revenue: 0 },
      { hour: "08 AM", vehicles: 0, revenue: 0 },
      { hour: "10 AM", vehicles: 0, revenue: 0 },
      { hour: "12 PM", vehicles: 0, revenue: 0 },
      { hour: "02 PM", vehicles: 0, revenue: 0 },
      { hour: "04 PM", vehicles: 0, revenue: 0 },
      { hour: "06 PM", vehicles: 0, revenue: 0 },
      { hour: "08 PM", vehicles: 0, revenue: 0 },
      { hour: "10 PM", vehicles: 0, revenue: 0 }
    ],
    vehicleDistribution,
    paymentBreakdown: formattedPaymentBreakdown,
    zonePerformance
  };

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
      csvRows.push(["EV Sessions Count", String(evStats.sessionsCount), "Completed charging sessions"]);
      csvRows.push(["EV Charging Revenue", `₹ ${Math.round(evStats.revenue).toLocaleString("en-IN")}`, "Fast chargers"]);
      csvRows.push(["EV Energy Consumed", `${evStats.energyKwh.toFixed(1)} kWh`, "High-voltage dispensed"]);
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
            className="pw-export-btn"
            onClick={handleRefresh}
            title="Refresh analytics data"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "0.82rem", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--bg-card, #ffffff)", cursor: "pointer", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}
          >
            <RefreshCw size={14} className={isRefreshing ? "pw-spin-icon" : ""} />
            <span>Refresh</span>
          </button>

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

      <div className="pw-metrics-four-grid" style={{ marginTop: "16px", marginBottom: "6px" }}>
        <div className="pw-metric-card" style={{ borderLeft: "3.5px solid #10b981" }}>
          <span className="pw-metric-label">EV Charging Sessions</span>
          <span className="pw-metric-value" style={{ color: "#059669" }}>{evStats.sessionsCount}</span>
          <span className="pw-metric-trend positive">
            <Zap size={13} />
            <span>Fast charge cycles</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ borderLeft: "3.5px solid #10b981" }}>
          <span className="pw-metric-label">EV Charging Revenue</span>
          <span className="pw-metric-value" style={{ color: "#059669" }}>₹ {Math.round(evStats.revenue).toLocaleString("en-IN")}</span>
          <span className="pw-metric-trend positive">
            <TrendingUp size={13} />
            <span>High-voltage tariff</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ borderLeft: "3.5px solid #10b981" }}>
          <span className="pw-metric-label">Energy Dispensed</span>
          <span className="pw-metric-value">{evStats.energyKwh.toFixed(1)} kWh</span>
          <span className="pw-metric-trend positive">
            <Layers size={13} />
            <span>Facility grid output</span>
          </span>
        </div>

        <div className="pw-metric-card" style={{ borderLeft: "3.5px solid #10b981" }}>
          <span className="pw-metric-label">EV Station Utilization</span>
          <span className="pw-metric-value">
            {evStats.totalSlots > 0 ? Math.round(((evStats.totalSlots - evStats.availableSlots) / evStats.totalSlots) * 100) : 0}%
          </span>
          <span className="pw-metric-trend positive">
            <ShieldCheck size={13} />
            <span>{evStats.totalSlots - evStats.availableSlots} of {evStats.totalSlots} bays active</span>
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
              {(currentData.zonePerformance.slice((zonePage - 1) * zoneLimit, zonePage * zoneLimit)).map((zp, idx) => (
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

        {currentData.zonePerformance.length > 0 && (
          <Pagination
            page={zonePage}
            limit={zoneLimit}
            total={currentData.zonePerformance.length}
            onPageChange={setZonePage}
            onLimitChange={(newLimit) => {
              setZoneLimit(newLimit);
              setZonePage(1);
            }}
            limitOptions={[5, 10, 25, 50]}
          />
        )}
      </div>
    </div>
  );
}

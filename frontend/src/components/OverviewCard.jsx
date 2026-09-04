export default function OverviewCard({ title, value, icon: Icon, themeClass, trend, subtext }) {
  return (
    <div className={`admin-stat-card ${themeClass}`}>
      <div className="stat-card-top">
        <h3>{title}</h3>
        {trend && (
          <span className={`stat-trend-pill ${trend.startsWith('+') || trend === 'Live' ? 'trend-up' : 'trend-neutral'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-icon-wrapper">
          <Icon size={22} />
        </div>
        <p>{value}</p>
      </div>
      {subtext && <span className="stat-subtext">{subtext}</span>}
    </div>
  );
}

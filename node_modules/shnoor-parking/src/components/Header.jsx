import { Car, Sparkles } from "lucide-react";

export default function Header({ title, subtitle, liveBadgeText = "System Operational" }) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <div className="admin-welcome-banner">
      <div className="welcome-text">
        <div className="banner-top-tags">
          <span className="live-status-pill">
            <span className="pulse-dot"></span>
            {liveBadgeText}
          </span>
          <span className="banner-date-pill">{currentDate}</span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="welcome-visual">
        <div className="welcome-glow-circle"></div>
        <div className="welcome-icon-box">
          <Car size={36} />
          <Sparkles size={18} className="sparkle-accent" />
        </div>
      </div>
    </div>
  );
}

export default function CarTopView({ className = "", isSelected = false, color = "silver" }) {
  const getBodyGradient = () => {
    if (color === "blue" || isSelected) {
      return {
        gradId: "carBodyBlue",
        start: "#dbeafe",
        mid: "#bfdbfe",
        end: "#93c5fd",
        stroke: "#3b82f6"
      };
    }
    return {
      gradId: "carBodySilver",
      start: "#f8fafc",
      mid: "#e2e8f0",
      end: "#cbd5e1",
      stroke: "#94a3b8"
    };
  };

  const currentTheme = getBodyGradient();

  return (
    <svg
      viewBox="0 0 64 116"
      className={`car-top-view-svg ${isSelected ? "is-selected-car" : ""} ${className}`}
      width="36"
      height="68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cbd5e1" />
          <stop offset="20%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id="carRoofGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="windshieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <filter id="vehicleShadow" x="-30%" y="-15%" width="160%" height="135%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.32" />
        </filter>
      </defs>

      <g filter="url(#vehicleShadow)">
        <rect x="5" y="20" width="4.5" height="15" rx="2" fill="#0f172a" />
        <rect x="54.5" y="20" width="4.5" height="15" rx="2" fill="#0f172a" />
        <rect x="5" y="80" width="4.5" height="15" rx="2" fill="#0f172a" />
        <rect x="54.5" y="80" width="4.5" height="15" rx="2" fill="#0f172a" />

        <rect x="5.5" y="22" width="3.5" height="11" rx="1.5" fill="#334155" />
        <rect x="55" y="22" width="3.5" height="11" rx="1.5" fill="#334155" />
        <rect x="5.5" y="82" width="3.5" height="11" rx="1.5" fill="#334155" />
        <rect x="55" y="82" width="3.5" height="11" rx="1.5" fill="#334155" />

        <path
          d="M12 24 C12 10, 20 4, 32 4 C44 4, 52 10, 52 24 L53 88 C53 104, 46 112, 32 112 C18 112, 11 104, 11 88 Z"
          fill="url(#carBodyGrad)"
          stroke={currentTheme.stroke}
          strokeWidth="1.2"
        />

        <rect x="6.5" y="30" width="5" height="4" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
        <rect x="52.5" y="30" width="5" height="4" rx="1.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />

        <path d="M16 12 Q32 8 48 12" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M18 16 Q32 12 46 16" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />

        <path
          d="M17 28 Q32 22 47 28 L45 44 Q32 41 19 44 Z"
          fill="url(#windshieldGrad)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />

        <rect x="20" y="46" width="24" height="28" rx="4" fill="url(#carRoofGlass)" />
        <path d="M22 50 L42 50" stroke="rgba(56,189,248,0.25)" strokeWidth="0.8" />

        <path
          d="M18 78 Q32 80 46 78 L45 90 Q32 92 19 90 Z"
          fill="url(#windshieldGrad)"
          stroke="#0f172a"
          strokeWidth="0.8"
        />

        <ellipse cx="17" cy="8" rx="3" ry="2" fill="#93c5fd" />
        <ellipse cx="47" cy="8" rx="3" ry="2" fill="#93c5fd" />

        <rect x="15" y="107" width="7" height="2" rx="1" fill="#ef4444" />
        <rect x="42" y="107" width="7" height="2" rx="1" fill="#ef4444" />
      </g>
    </svg>
  );
}

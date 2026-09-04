export default function BikeTopView({ className = "", isSelected = false }) {
  return (
    <svg
      viewBox="0 0 48 116"
      className={`bike-top-view-svg ${isSelected ? "is-selected-bike" : ""} ${className}`}
      width="30"
      height="68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="bikeBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="35%" stopColor="#2563eb" />
          <stop offset="65%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id="bikeTankGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>

        <filter id="bikeShadow" x="-30%" y="-15%" width="160%" height="135%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#0f172a" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter="url(#bikeShadow)">
        <rect x="21.5" y="6" width="5" height="24" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />
        <rect x="21" y="82" width="6" height="28" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="0.8" />

        <path
          d="M6 30 C12 28, 20 27, 24 27 C28 27, 36 28, 42 30"
          stroke="#334155"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        <rect x="4" y="28.5" width="6" height="3" rx="1.5" fill="#0f172a" />
        <rect x="38" y="28.5" width="6" height="3" rx="1.5" fill="#0f172a" />

        <ellipse cx="6.5" cy="24" rx="2.5" ry="1.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
        <ellipse cx="41.5" cy="24" rx="2.5" ry="1.5" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />

        <path
          d="M20 28 L28 28 L26 40 L22 40 Z"
          fill="#475569"
        />

        <ellipse cx="24" cy="18" rx="3.5" ry="2.5" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.8" />

        <path
          d="M17 38 C17 33, 20 32, 24 32 C28 32, 31 33, 31 38 L33 58 C33 63, 30 66, 24 66 C18 66, 15 63, 15 58 Z"
          fill="url(#bikeTankGrad)"
          stroke="#1d4ed8"
          strokeWidth="1"
        />

        <ellipse cx="24" cy="44" rx="2" ry="2" fill="#0f172a" />

        <path
          d="M17 65 C17 63, 20 62, 24 62 C28 62, 31 63, 31 65 L29 84 C29 87, 27 89, 24 89 C21 89, 19 87, 19 84 Z"
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth="0.8"
        />

        <rect x="29.5" y="68" width="3" height="24" rx="1.5" fill="#94a3b8" stroke="#475569" strokeWidth="0.6" />

        <rect x="22" y="92" width="4" height="2" rx="1" fill="#ef4444" />
      </g>
    </svg>
  );
}

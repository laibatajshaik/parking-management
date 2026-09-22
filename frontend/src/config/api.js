export const API_BASE_URL =
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : (import.meta.env.VITE_API_BASE_URL || "https://parking-management-backend-6enx.onrender.com");

import { auth } from "../components/firebase.js";

export const API_BASE_URL =
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : (import.meta.env.VITE_API_BASE_URL || "https://parking-management-backend-6enx.onrender.com");

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "265505874428-n49qnrsvk6tck6bd1bprrp13k36j8n3e.apps.googleusercontent.com";

export async function apiFetch(input, init = {}) {
  const headers = new Headers(init.headers || {});
  const user = auth.currentUser;

  if (user) {
    headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  }

  return fetch(input, { ...init, headers });
}

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { API_BASE_URL, apiFetch } from "../config/api.js";
import { auth } from "./firebase.js";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [authState, setAuthState] = useState({ loading: true, user: null });

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (active) setAuthState({ loading: false, user: null });
        return;
      }

      try {
        const response = await apiFetch(`${API_BASE_URL}/api/auth/session`);
        const data = await response.json();
        if (!response.ok || !data?.success || !data.user) {
          throw new Error(data?.error || "Could not verify the parking account.");
        }

        if (active) {
          localStorage.setItem("shnoor_current_user", JSON.stringify(data.user));
          localStorage.setItem("shnoor_auth_state", "true");
          setAuthState({ loading: false, user: data.user });
        }
      } catch (error) {
        console.error("Protected route account verification failed:", error);
        try {
          localStorage.removeItem("shnoor_current_user");
          localStorage.removeItem("shnoor_auth_state");
        } catch (storageError) {
          console.error("Could not clear the cached account profile:", storageError);
        }
        if (active) setAuthState({ loading: false, user: null });
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (authState.loading) {
    return null;
  }
  if (!authState.user) {
    return <Navigate to="/login" replace />;
  }

  const role = (authState.user.role || "customer").toLowerCase();
  if (!allowedRoles.includes(role)) {
    if (role === "admin") {
      return <Navigate to="/admin/dashboard/overview" replace />;
    }
    if (role === "staff") {
      return <Navigate to="/staff/dashboard/overview" replace />;
    }
    return <Navigate to="/customer/dashboard/overview" replace />;
  }

  return children;
}

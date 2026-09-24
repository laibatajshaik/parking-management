import { Navigate } from "react-router-dom";

function getAuthState() {
  try {
    const saved = localStorage.getItem("shnoor_current_user");
    const isAuth = localStorage.getItem("shnoor_auth_state") === "true";
    const user = saved ? JSON.parse(saved) : null;
    return { user, isAuth };
  } catch {
    return { user: null, isAuth: false };
  }
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuth } = getAuthState();

  if (!isAuth || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role || "customer";

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

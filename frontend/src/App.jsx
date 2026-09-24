import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import Login from "./Login.jsx";
import SignUp from "./SignUp.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import StaffDashboard from "./StaffDashboard.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const navigate = useNavigate();

  const setView = (path) => {
    if (path === "landing") {
      navigate("/");
    } else {
      navigate(`/${path}`);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<ShnoorParkingLanding setView={setView} />} />
      <Route path="/login" element={<Login setView={setView} />} />
      <Route path="/signup" element={<SignUp setView={setView} />} />
      <Route path="/forgot-password" element={<ForgotPassword setView={setView} />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Navigate to="/admin/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Navigate to="/admin/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard/:tab"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/:tab"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <Navigate to="/staff/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <Navigate to="/staff/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/dashboard/:tab"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/:tab"
        element={
          <ProtectedRoute allowedRoles={["staff"]}>
            <StaffDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Navigate to="/customer/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <Navigate to="/customer/dashboard/overview" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/dashboard/:tab"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customer/:tab"
        element={
          <ProtectedRoute allowedRoles={["customer"]}>
            <CustomerDashboard setView={setView} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

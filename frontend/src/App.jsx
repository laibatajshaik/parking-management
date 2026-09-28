import { lazy, Suspense } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Login = lazy(() => import("./Login.jsx"));
const SignUp = lazy(() => import("./SignUp.jsx"));
const ForgotPassword = lazy(() => import("./ForgotPassword.jsx"));
const AdminDashboard = lazy(() => import("./AdminDashboard.jsx"));
const StaffDashboard = lazy(() => import("./StaffDashboard.jsx"));
const CustomerDashboard = lazy(() => import("./CustomerDashboard.jsx"));

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
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", color: "#0d9488", fontWeight: 700 }}>Loading ParkSafe...</div>}>
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
    </Suspense>
  );
}

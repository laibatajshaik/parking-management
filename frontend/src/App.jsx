import { Routes, Route, useNavigate } from "react-router-dom";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import Login from "./Login.jsx";
import SignUp from "./SignUp.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import StaffDashboard from "./StaffDashboard.jsx";
import CustomerDashboard from "./CustomerDashboard.jsx";

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
      <Route path="/admin" element={<AdminDashboard setView={setView} />} />
      <Route path="/admin/dashboard" element={<AdminDashboard setView={setView} />} />
      <Route path="/admin/dashboard/:tab" element={<AdminDashboard setView={setView} />} />
      <Route path="/admin/:tab" element={<AdminDashboard setView={setView} />} />
      <Route path="/staff" element={<StaffDashboard setView={setView} />} />
      <Route path="/staff/dashboard" element={<StaffDashboard setView={setView} />} />
      <Route path="/staff/dashboard/:tab" element={<StaffDashboard setView={setView} />} />
      <Route path="/staff/:tab" element={<StaffDashboard setView={setView} />} />
      <Route path="/customer" element={<CustomerDashboard setView={setView} />} />
      <Route path="/customer/dashboard" element={<CustomerDashboard setView={setView} />} />
      <Route path="/customer/dashboard/:tab" element={<CustomerDashboard setView={setView} />} />
      <Route path="/customer/:tab" element={<CustomerDashboard setView={setView} />} />
    </Routes>
  );
}

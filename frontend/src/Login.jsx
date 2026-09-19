import { API_BASE_URL } from "./config/api.js";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.jsx";

export default function Login({ setView }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem("shnoor_current_user");
      localStorage.removeItem("shnoor_auth_state");
    } catch {
      void 0;
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    setMessage("");
    setIsError(false);

    if (!email || !email.trim()) {
      setIsError(true);
      setMessage("Email is required");
      return;
    }

    if (!password || !password.trim()) {
      setIsError(true);
      setMessage("Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data && data.success && data.user) {
        localStorage.setItem("shnoor_current_user", JSON.stringify(data.user));
        localStorage.setItem("shnoor_auth_state", "true");
        setMessage("Login successful!");
        setTimeout(() => {
          if (data.user.role === "admin") {
            setView("admin/dashboard");
          } else if (data.user.role === "staff") {
            setView("staff/dashboard");
          } else if (data.user.role === "customer") {
            setView("customer/dashboard");
          } else {
            setView("customer/dashboard");
          }
        }, 800);
      } else {
        try {
          localStorage.removeItem("shnoor_current_user");
          localStorage.removeItem("shnoor_auth_state");
        } catch {
          void 0;
        }
        setIsError(true);
        setMessage("Invalid email or password");
      }
    } catch {
      setIsLoading(false);
      setIsError(true);
      setMessage("Cannot connect to server");
    }
  };

  return (
    <div className="pw-auth-page-wrapper">
      <div className="pw-auth-landing-backdrop" aria-hidden="true">
        <ShnoorParkingLanding setView={() => {}} />
      </div>
      <div className="pw-auth-backdrop-overlay"></div>

      <div className="pw-auth-card">
        <div className="pw-dot-grid-decor"></div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "16px" }}>
          <div className="pw-auth-brand-row" style={{ margin: 0 }} onClick={() => setView("landing")}>
            <div className="pw-brand-logo-box">
              <span className="pw-p-logo">P</span>
            </div>
            <span className="pw-brand-word">ParkSafe</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="pw-auth-header-box">
          <h2 className="pw-auth-title">
            Welcome <span className="pw-teal-text">Back!</span>
          </h2>
          <p className="pw-auth-subtitle">Login to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="pw-auth-form" noValidate>
          <div className="pw-form-field">
            <label htmlFor="auth-email" className="pw-form-label">Email Address</label>
            <input
              id="auth-email"
              type="email"
              className="pw-form-input"
              placeholder="youremail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="pw-form-field">
            <label htmlFor="auth-password" className="pw-form-label">Password</label>
            <div className="pw-password-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="pw-form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="pw-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pw-auth-row">
            <label className="pw-checkbox-wrap" onClick={() => setRememberMe(!rememberMe)}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() => {}}
                className="pw-checkbox-native"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="pw-text-link"
              onClick={() => setView("forgot-password")}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="pw-btn-auth-submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {message && (
            <p className={`pw-auth-msg ${isError ? "error" : "success"}`}>
              {message}
            </p>
          )}

          <div className="pw-auth-switch-footer">
            <span>Don't have an account?</span>
            <button
              type="button"
              className="pw-switch-link"
              onClick={() => setView("signup")}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.jsx";

export default function SignUp({ setView }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "customer" })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setSuccess("Account created successfully!");
        setTimeout(() => {
          setView("login");
        }, 1200);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch {
      setIsLoading(false);
      setError("Cannot connect to server");
    }
  };

  return (
    <div className="pw-auth-page-wrapper">
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
            Create Your <span className="pw-teal-text">Account</span>
          </h2>
          <p className="pw-auth-subtitle">Join ParkSafe and simplify your parking</p>
        </div>

        <form onSubmit={handleSubmit} className="pw-auth-form">
          <div className="pw-form-field">
            <label htmlFor="signup-name" className="pw-form-label">Full Name</label>
            <input
              id="signup-name"
              type="text"
              className="pw-form-input"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="pw-form-field">
            <label htmlFor="signup-email" className="pw-form-label">Email Address</label>
            <input
              id="signup-email"
              type="email"
              className="pw-form-input"
              placeholder="youremail@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="pw-form-field">
            <label htmlFor="signup-password" className="pw-form-label">Password</label>
            <div className="pw-password-wrapper">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="pw-form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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

          <div className="pw-form-field">
            <label htmlFor="signup-confirm" className="pw-form-label">Confirm Password</label>
            <div className="pw-password-wrapper">
              <input
                id="signup-confirm"
                type={showConfirmPassword ? "text" : "password"}
                className="pw-form-input"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="pw-eye-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pw-auth-row">
            <label className="pw-checkbox-wrap" onClick={() => setAgreeTerms(!agreeTerms)}>
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={() => {}}
                className="pw-checkbox-native"
              />
              <span>
                I agree to the <span className="pw-teal-text">Terms & Conditions</span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="pw-btn-auth-submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>

          {error && <p className="pw-auth-msg error">{error}</p>}
          {success && <p className="pw-auth-msg success">{success}</p>}

          <div className="pw-auth-switch-footer">
            <span>Already have an account?</span>
            <button
              type="button"
              className="pw-switch-link"
              onClick={() => setView("login")}
            >
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

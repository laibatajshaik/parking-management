import { API_BASE_URL } from "./config/api.js";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.jsx";

export default function ForgotPassword({ setView }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setStep(2);
        setMessage(`Real-time verification code dispatched to ${email}`);
        setIsError(false);
      } else {
        setIsError(true);
        setMessage(data.error || "No account found with this email");
      }
    } catch {
      setIsLoading(false);
      setIsError(true);
      setMessage("Cannot connect to server. Please try again.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setStep(3);
        setMessage("");
        setIsError(false);
      } else {
        setIsError(true);
        setMessage(data.error || "Invalid or expired verification code");
      }
    } catch {
      setIsLoading(false);
      setIsError(true);
      setMessage("Cannot connect to server. Please try again.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword
        })
      });
      const data = await response.json();
      setIsLoading(false);

      if (response.ok) {
        setStep(4);
        setMessage("Password reset successfully!");
        setIsError(false);
      } else {
        setIsError(true);
        setMessage(data.error || "Failed to reset password");
      }
    } catch {
      setIsLoading(false);
      setIsError(true);
      setMessage("Cannot connect to server. Please try again.");
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

        {step === 1 && (
          <>
            <div className="pw-auth-header-box">
              <h2 className="pw-auth-title">
                Forgot <span className="pw-teal-text">Password?</span>
              </h2>
              <p className="pw-auth-subtitle">
                Enter your registered email address to receive a real-time 6-digit verification code.
              </p>
            </div>

            <form onSubmit={handleRequestOtp} className="pw-auth-form">
              <div className="pw-form-field">
                <label htmlFor="reset-email" className="pw-form-label">Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  className="pw-form-input"
                  placeholder="youremail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="pw-btn-auth-submit"
                disabled={isLoading}
              >
                {isLoading ? "Sending Code to Email..." : "Send Verification Code"}
              </button>

              {message && (
                <p className={`pw-auth-msg ${isError ? "error" : "success"}`}>
                  {message}
                </p>
              )}

              <div className="pw-auth-switch-footer">
                <span>Remember your password?</span>
                <button
                  type="button"
                  className="pw-switch-link"
                  onClick={() => setView("login")}
                >
                  Back to Login
                </button>
              </div>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="pw-auth-header-box">
              <h2 className="pw-auth-title">
                Verify <span className="pw-teal-text">OTP Code</span>
              </h2>
              <p className="pw-auth-subtitle">
                Enter the 6-digit verification code sent to <strong style={{ color: "var(--text-primary, #0f172a)" }}>{email}</strong>
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-teal-sub, #f0fdfa)", border: "1px solid var(--border-color, #ccfbf1)", borderRadius: "8px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.8rem", color: "#2dd4bf" }}>
              <Mail size={16} style={{ flexShrink: 0 }} />
              <span>Please check your email inbox for the real-time 6-digit verification code.</span>
            </div>

            <form onSubmit={handleVerifyOtp} className="pw-auth-form">
              <div className="pw-form-field">
                <label htmlFor="otp-code" className="pw-form-label">6-Digit Code</label>
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  className="pw-form-input"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ letterSpacing: "6px", textAlign: "center", fontSize: "1.2rem", fontWeight: 800 }}
                  required
                />
              </div>

              <button
                type="submit"
                className="pw-btn-auth-submit"
                disabled={isLoading || otp.length < 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setMessage("");
                    setIsError(false);
                  }}
                  style={{ background: "transparent", border: "none", color: "var(--text-secondary, #64748b)", fontSize: "0.82rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <ArrowLeft size={13} />
                  <span>Change Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestOtp}
                  style={{ background: "transparent", border: "none", color: "#2dd4bf", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Resend Code
                </button>
              </div>

              {message && (
                <p className={`pw-auth-msg ${isError ? "error" : "success"}`}>
                  {message}
                </p>
              )}
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="pw-auth-header-box">
              <h2 className="pw-auth-title">
                Set New <span className="pw-teal-text">Password</span>
              </h2>
              <p className="pw-auth-subtitle">
                Create a new, strong password for your account.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="pw-auth-form">
              <div className="pw-form-field">
                <label htmlFor="new-pass" className="pw-form-label">New Password</label>
                <div className="pw-password-wrapper">
                  <input
                    id="new-pass"
                    type={showPassword ? "text" : "password"}
                    className="pw-form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <label htmlFor="confirm-pass" className="pw-form-label">Confirm New Password</label>
                <div className="pw-password-wrapper">
                  <input
                    id="confirm-pass"
                    type={showConfirmPassword ? "text" : "password"}
                    className="pw-form-input"
                    placeholder="Repeat new password"
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

              <button
                type="submit"
                className="pw-btn-auth-submit"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Save & Reset Password"}
              </button>

              {message && (
                <p className={`pw-auth-msg ${isError ? "error" : "success"}`}>
                  {message}
                </p>
              )}
            </form>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: "10px 0 16px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--bg-teal-sub, #f0fdf4)", border: "2px solid #2dd4bf", color: "#2dd4bf", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 className="pw-auth-title" style={{ marginBottom: "8px" }}>
              Password Reset <span className="pw-teal-text">Complete!</span>
            </h2>

            <p className="pw-auth-subtitle" style={{ maxWidth: "340px", margin: "0 auto 24px" }}>
              Your password has been updated securely. You can now log in to your account with your new credentials.
            </p>

            <button
              type="button"
              className="pw-btn-auth-submit"
              onClick={() => setView("login")}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

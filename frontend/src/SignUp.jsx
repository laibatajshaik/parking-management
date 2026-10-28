import { API_BASE_URL, apiFetch } from "./config/api.js";
import ShnoorParkingLanding from "./ShnoorParkingLanding.jsx";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "./components/ThemeToggle.jsx";
import GoogleAuthButton from "./components/GoogleAuthButton.jsx";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "./components/firebase.js";

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
      let firebaseUser = auth.currentUser;
      if (!firebaseUser || firebaseUser.email?.toLowerCase() !== email.trim().toLowerCase()) {
        let credential;
        try {
          credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        } catch (error) {
          if (error?.code !== "auth/email-already-in-use") throw error;
          credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        }
        firebaseUser = credential.user;
      }

      await updateProfile(firebaseUser, { displayName: name.trim() });
      const response = await apiFetch(`${API_BASE_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() })
      });
      const data = await response.json();

      if (response.ok && data?.success) {
        setSuccess("Account created successfully!");
        setTimeout(() => {
          setView("login");
        }, 1200);
      } else {
        if (response.status === 409 && !firebaseUser.emailVerified) {
          try {
            await sendEmailVerification(firebaseUser);
            setError(`${data.error || "This email is already registered."} Verify your email before logging in to link your existing account.`);
          } catch (verificationError) {
            console.error("Could not send Firebase email verification:", verificationError);
            setError(data.error || "This email is already registered. Please log in or contact an administrator.");
          }
        } else {
          setError(data.error || "Signup failed");
        }
      }
    } catch (error) {
      const messages = {
        "auth/email-already-in-use": "An account with this email already exists. Please log in.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/weak-password": "Choose a stronger password (at least 6 characters).",
        "auth/network-request-failed": "Cannot connect to Firebase. Check your internet connection."
      };
      setError(messages[error?.code] || error?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    localStorage.setItem("shnoor_current_user", JSON.stringify(user));
    localStorage.setItem("shnoor_auth_state", "true");
    setSuccess("Account ready! Redirecting to dashboard...");
    setError("");
    setTimeout(() => {
      if (user.role === "admin") {
        setView("admin/dashboard/overview");
      } else if (user.role === "staff") {
        setView("staff/dashboard/overview");
      } else {
        setView("customer/dashboard/overview");
      }
    }, 600);
  };

  const handleGoogleError = (errMsg) => {
    setError(errMsg || "Google signup failed");
    setSuccess("");
  };

  return (
    <div className="pw-auth-page-wrapper">
      <div className="pw-auth-landing-backdrop" aria-hidden="true" inert="true">
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
                aria-label={showPassword ? "Hide password" : "Show password"}
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
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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

          <div className="pw-auth-divider">
            <span>OR</span>
          </div>

          <GoogleAuthButton
            text="signup"
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={isLoading}
          />

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

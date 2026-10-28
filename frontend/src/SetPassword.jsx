
import { useState } from "react";
import {
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";
import { auth } from "./components/firebase.js";

export default function SetPassword({ setView }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    const user = auth.currentUser;

    if (!user || !user.email) {
      setMessage("Please sign in with Google first.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const hasPassword = user.providerData.some(
      (provider) => provider.providerId === "password"
    );

    if (hasPassword) {
      setMessage("This account already has a password. Use Forgot Password if needed.");
      return;
    }

    setLoading(true);

    try {
      const googleProvider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, googleProvider);

      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );

      await linkWithCredential(auth.currentUser, credential);

      setMessage("Password created successfully! You can now use either login method.");

      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Set password error:", error);
      setMessage(
        error.code === "auth/credential-already-in-use"
          ? "This password account is already linked to another Firebase user."
          : error.code === "auth/provider-already-linked"
          ? "This account already has a password."
          : error.code === "auth/popup-closed-by-user"
          ? "Google verification was cancelled. Please try again."
          : error.message || "Could not set password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pw-auth-page-wrapper">
      <div className="pw-auth-card">
        <h2 className="pw-auth-title">Set Your Password</h2>
        <p className="pw-auth-subtitle">
          Signed in as {auth.currentUser?.email || "Google user"}
        </p>

        <form onSubmit={handleSetPassword} className="pw-auth-form">
          <label className="pw-form-label">New Password</label>
          <input
            className="pw-form-input"
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label className="pw-form-label">Confirm Password</label>
          <input
            className="pw-form-input"
            type="password"
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            className="pw-btn-auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Setting password..." : "Set Password"}
          </button>
        </form>

        {message && <p className="pw-auth-msg">{message}</p>}

        <button
          type="button"
          className="pw-switch-link"
          onClick={() => setView("login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

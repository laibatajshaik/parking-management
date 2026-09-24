import { useEffect, useRef, useState } from "react";
import { API_BASE_URL, GOOGLE_CLIENT_ID } from "../config/api.js";

export default function GoogleAuthButton({
  onSuccess,
  onError,
  text = "continue",
  role = "customer",
  disabled = false
}) {
  const containerRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthExchange = async (authPayload) => {
    setIsAuthenticating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...authPayload, role })
      });
      const data = await res.json();
      setIsAuthenticating(false);
      if (res.ok && data && data.success && data.user) {
        if (onSuccess) onSuccess(data.user, data.isNewUser);
      } else {
        if (onError) onError(data?.error || "Google authentication failed");
      }
    } catch {
      setIsAuthenticating(false);
      if (onError) onError("Cannot connect to server for Google authentication");
    }
  };

  useEffect(() => {
    const handleCredentialResponse = (response) => {
      if (response && response.credential) {
        handleAuthExchange({ credential: response.credential });
      } else {
        if (onError) onError("Failed to retrieve Google credentials");
      }
    };

    let checkInterval = null;
    let attempts = 0;

    const initGoogleGsi = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
          });

          if (containerRef.current) {
            containerRef.current.innerHTML = "";
            window.google.accounts.id.renderButton(containerRef.current, {
              type: "standard",
              shape: "rectangular",
              theme: "outline",
              text: text === "signup" ? "signup_with" : text === "signin" ? "signin_with" : "continue_with",
              size: "large",
              logo_alignment: "left",
              width: 340
            });
          }
          setIsGsiLoaded(true);
        } catch {
          setIsGsiLoaded(false);
        }
        return true;
      }
      return false;
    };

    if (!initGoogleGsi()) {
      checkInterval = setInterval(() => {
        attempts += 1;
        if (initGoogleGsi() || attempts >= 20) {
          clearInterval(checkInterval);
        }
      }, 300);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [text, role, GOOGLE_CLIENT_ID]);

  const handleCustomGoogleClick = () => {
    if (disabled || isAuthenticating) return;

    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: "openid email profile",
          callback: (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              handleAuthExchange({ access_token: tokenResponse.access_token });
            } else if (tokenResponse && tokenResponse.error) {
              if (onError) onError(tokenResponse.error_description || "Google authorization was cancelled");
            }
          }
        });
        client.requestAccessToken();
        return;
      } catch {
        void 0;
      }
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch {
        void 0;
      }
    }

    if (onError) {
      onError("Google Services is loading. Please wait a moment and try again.");
    }
  };

  const buttonText =
    text === "signup"
      ? "Sign up with Google"
      : text === "signin"
      ? "Sign in with Google"
      : "Continue with Google";

  return (
    <div className="pw-google-auth-wrapper">
      <div
        ref={containerRef}
        style={{
          display: isGsiLoaded ? "flex" : "none",
          width: "100%",
          justifyContent: "center"
        }}
      />

      {!isGsiLoaded && (
        <button
          type="button"
          className="pw-btn-google-custom"
          onClick={handleCustomGoogleClick}
          disabled={disabled || isAuthenticating}
        >
          <svg className="pw-google-icon" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isAuthenticating ? "Connecting Google..." : buttonText}</span>
        </button>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import config from "../config.json";
import "../auth.css";

const BASE_URL = `http://${config.server_host}:${config.server_port}`;

export default function Login({ setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupFirst, setSignupFirst] = useState("");
  const [signupLast, setSignupLast] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch(`${BASE_URL}/me`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data && data.id) {
          setUser?.(data);
          navigate("/home", { replace: true });
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }

    checkUser();
  }, [navigate, setUser]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");

    if (error) {
      setMode("login");
      setLoginError(error);
      navigate("/login", { replace: true });
    }
  }, [location.search, navigate]);

  function showLogin() {
    setMode("login");
    setLoginError("");
    setSignupError("");
  }

  function showSignup() {
    setMode("signup");
    setLoginError("");
    setSignupError("");
  }

  function googleLogin() {
    window.location.href = `${BASE_URL}/auth/google`;
  }

  function githubLogin() {
    window.location.href = `${BASE_URL}/auth/github`;
  }

  async function manualLogin() {
    const email = loginEmail.trim();
    const password = loginPassword.trim();

    setLoginError("");

    if (!email || !password) {
      setLoginError("Please enter email and password");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${BASE_URL}/manual-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        setLoginError("Server error. Please try again.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        const meRes = await fetch(`${BASE_URL}/me`, {
          credentials: "include",
        });

        if (meRes.ok) {
          const me = await meRes.json();
          setUser?.(me);
        }

        navigate("/home", { replace: true });
      } else {
        setLoginError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login request failed:", err);
      setLoginError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signup() {
    const first = signupFirst.trim();
    const last = signupLast.trim();
    const email = signupEmail.trim();
    const password = signupPassword.trim();

    setSignupError("");

    if (!first || !last || !email || !password) {
      setSignupError("Please fill all fields");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ first, last, email, password }),
        credentials: "include",
      });

      if (!res.ok) {
        setSignupError("Server error. Please try again.");
        return;
      }

      const data = await res.json();

      if (data.success) {
        setLoginEmail(email);
        setLoginPassword("");
        setSignupFirst("");
        setSignupLast("");
        setSignupEmail("");
        setSignupPassword("");
        setSignupError("");
        setLoginError("Account created! Please login.");
        setMode("login");
      } else {
        setSignupError(data.message || "Signup failed");
      }
    } catch (err) {
      console.error("Signup request failed:", err);
      setSignupError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLoginPasswordKeyDown(e) {
    if (e.key === "Enter") {
      manualLogin();
    }
  }

  function handleSignupPasswordKeyDown(e) {
    if (e.key === "Enter") {
      signup();
    }
  }

  return (
    <div id="login-section">
      <div className="auth-shell">
        <div className="auth-card">
          {mode === "login" ? (
            <>
              <h1 className="auth-title">Login</h1>
              <p className="auth-subtitle">Sign in to continue</p>

              <div className="auth-field">
                <label htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    setLoginError("");
                  }}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError("");
                  }}
                  onKeyDown={handleLoginPasswordKeyDown}
                />
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={manualLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>
              
              <div className="auth-actions">
                <button
                  type="button"
                  className="google-btn auth-google"
                  onClick={googleLogin}
                  disabled={isSubmitting}
                >
                  <span className="auth-provider-icon-wrapper">
                    <img
                      className="auth-provider-icon"
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      alt="Google"
                    />
                  </span>
                  <span className="button-text">Continue with Google</span>
                </button>

                <button
                  type="button"
                  className="github-btn auth-github"
                  onClick={githubLogin}
                  disabled={isSubmitting}
                >
                  <span className="auth-provider-icon-wrapper">
                    <img
                      className="auth-provider-icon"
                      src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
                      alt="GitHub"
                    />
                  </span>
                  <span className="button-text">Continue with GitHub</span>
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={showSignup}
                  disabled={isSubmitting}
                >
                  Create an account
                </button>
              </div>

              <div className="auth-error">{loginError}</div>
            </>
          ) : (
            <>
              <h1 className="auth-title">Create Account</h1>
              <p className="auth-subtitle">Sign up to get started</p>

              <div className="auth-grid">
                <div className="auth-field">
                  <label htmlFor="signup-first">First Name</label>
                  <input
                    id="signup-first"
                    type="text"
                    placeholder="First Name"
                    value={signupFirst}
                    onChange={(e) => {
                      setSignupFirst(e.target.value);
                      setSignupError("");
                    }}
                  />
                </div>

                <div className="auth-field">
                  <label htmlFor="signup-last">Last Name</label>
                  <input
                    id="signup-last"
                    type="text"
                    placeholder="Last Name"
                    value={signupLast}
                    onChange={(e) => {
                      setSignupLast(e.target.value);
                      setSignupError("");
                    }}
                  />
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">Email</label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Email"
                  value={signupEmail}
                  onChange={(e) => {
                    setSignupEmail(e.target.value);
                    setSignupError("");
                  }}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Password"
                  value={signupPassword}
                  onChange={(e) => {
                    setSignupPassword(e.target.value);
                    setSignupError("");
                  }}
                  onKeyDown={handleSignupPasswordKeyDown}
                />
              </div>

              <button
                type="button"
                className="primary-btn"
                onClick={signup}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Create Account"}
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={showLogin}
                disabled={isSubmitting}
              >
                Back to login
              </button>

              <div className="auth-error">{signupError}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

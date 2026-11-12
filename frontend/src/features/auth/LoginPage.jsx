import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { extractErrorMessage } from "../../utils/helpers";
import authApi from "../../api/authApi";
import doctorPortalLogo from "../../assets/doctor-portal-logo.png";
import patientLoginBg from "../../assets/patient-login-bg.jpg?v=v2_crystal_clean";

const LoginPage = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { patientLogin, logout, register, clearAuth, isAuthenticated, user } = useAuth();

  // Mode: 'login' (Patient Portal, Ref Image 1) or 'signup' (Create Your Account, Ref Image 2)
  const [mode, setMode] = useState(initialMode);

  // Sync mode with location or props
  useEffect(() => {
    if (location.pathname === "/register") {
      setMode("signup");
    } else {
      setMode(initialMode);
    }
  }, [location.pathname, initialMode]);

  // When visiting the Login page, ensure previous login session is properly cleared so users must log in afresh
  useEffect(() => {
    clearAuth();
  }, []);

  // Form states
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    rememberMe: true,
  });
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotIdentifier, setForgotIdentifier] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [isResetUserAdmin, setIsResetUserAdmin] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleOpenForgotModal = () => {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotError("");
    setForgotCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsResetUserAdmin(false);
    const currentUsername = (loginData.username || "").trim();
    if (currentUsername) {
      setForgotIdentifier(currentUsername);
    } else {
      setForgotIdentifier("");
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotError("");
    setForgotCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsResetUserAdmin(false);
  };

  const handleSendResetCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = (forgotIdentifier || "").trim();
    if (!trimmed) {
      setForgotError("Please enter your registered email address, mobile number, or username.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await authApi.forgotPassword(trimmed, "patient");
      if (res && res.success) {
        setMaskedEmail(res.email || "your registered email");
        if (res.is_admin) {
          setIsResetUserAdmin(true);
        }
        setForgotCode("");
        setNewPassword("");
        setConfirmPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setForgotStep(2);
      } else {
        setForgotError(
          res?.error || "No account found with this username, email, or mobile number.",
        );
      }
    } catch (err) {
      setForgotError(
        extractErrorMessage(err) ||
          "Failed to send reset code. Please try again.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyAndResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = (forgotCode || "").trim();
    if (!cleanCode) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }
    if (cleanCode.length !== 6) {
      setForgotError("Verification code must be exactly 6 digits.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match. Please verify.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await authApi.resetPassword({
        identifier: forgotIdentifier.trim(),
        code: cleanCode,
        newPassword: newPassword,
        portal: "patient",
      });

      if (res && res.success) {
        if (res.is_admin) {
          setIsResetUserAdmin(true);
        }
        setForgotStep(3);
      } else {
        setForgotError(res?.error || "Invalid or expired verification code.");
      }
    } catch (err) {
      setForgotError(
        extractErrorMessage(err) || "Invalid or expired verification code.",
      );
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Patient Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const trimmedUsername = (loginData.username || "").trim();

    // Frontend validation: reject admin usernames immediately on client side
    if (trimmedUsername.toLowerCase() === "admin") {
      setError(
        "Access denied. Administrator accounts cannot log in through the Patient Portal. Please use the Admin Login."
      );
      setIsLoading(false);
      return;
    }

    try {
      const data = await patientLogin({
        username: trimmedUsername,
        password: loginData.password,
        portal: "patient",
      });

      // Frontend safety check: prevent any staff/admin role from proceeding
      if (data?.user?.role !== "PATIENT" || data?.user?.is_staff || data?.user?.is_superuser) {
        await logout();
        setError(
          "Access denied. Administrator accounts cannot log in through the Patient Portal. Please use the Admin Login."
        );
        return;
      }

      const dest = location.state?.from || "/";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(
        extractErrorMessage(err) ||
          "Invalid credentials. Please verify your Name/Email and Password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Patient Sign-Up Submit
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // 1. Name Field Validation: max 35 alphabetic characters, no numbers or special characters
    const rawName = signupData.fullName || "";
    const nameTrimmed = rawName.trim();
    if (!nameTrimmed) {
      setError("Please enter your full name.");
      setIsLoading(false);
      return;
    }
    if (nameTrimmed.length > 35) {
      setError("Name cannot exceed 35 characters.");
      setIsLoading(false);
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      setError(
        "Name can only contain alphabetic characters. Numbers and special characters are not allowed."
      );
      setIsLoading(false);
      return;
    }

    // 2. Email Field Validation: valid email format, no characters after .com
    const emailTrimmed = (signupData.email || "").trim().toLowerCase();
    if (!emailTrimmed) {
      setError("Please enter your email address.");
      setIsLoading(false);
      return;
    }
    if (emailTrimmed.includes(".com")) {
      const comIndex = emailTrimmed.indexOf(".com");
      if (emailTrimmed.length > comIndex + 4) {
        setError(
          "Invalid email address. No additional characters or text are allowed after the .com extension."
        );
        setIsLoading(false);
        return;
      }
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError("Please enter a valid email address (e.g., name@example.com).");
      setIsLoading(false);
      return;
    }

    // 3. Phone Number Field Validation: numeric only, exactly 10 digits, starts with 6, 7, 8, or 9
    const phoneClean = (signupData.phone || "").trim();
    if (!phoneClean) {
      setError("Please enter your phone number.");
      setIsLoading(false);
      return;
    }
    if (!/^\d+$/.test(phoneClean)) {
      setError("Phone number must contain only numeric digits. Letters and special characters are not allowed.");
      setIsLoading(false);
      return;
    }
    if (phoneClean.length !== 10) {
      setError("Phone number must contain exactly 10 digits.");
      setIsLoading(false);
      return;
    }
    if (!/^[6-9]/.test(phoneClean)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
      );
      setIsLoading(false);
      return;
    }

    if (!signupData.password || signupData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    if (!signupData.agreeTerms) {
      setError("You must agree to the Terms & Conditions and Privacy Policy.");
      setIsLoading(false);
      return;
    }

    // Split name into first and last name
    const parts = nameTrimmed.split(/\s+/);
    const firstName = parts[0] || "Patient";
    const lastName = parts.slice(1).join(" ") || "";
    const username =
      emailTrimmed.split("@")[0] +
      "_" +
      Math.random().toString(36).substring(2, 6);

    try {
      const payload = {
        username,
        email: emailTrimmed,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneClean,
        password: signupData.password,
        role: "PATIENT",
      };

      const data = await register(payload);
      if (data?.user?.role === "PATIENT") {
        const dest = location.state?.from || "/";
        navigate(dest, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(
        extractErrorMessage(err) || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="patient-auth-viewport"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        input::-ms-reveal,
        input::-ms-clear {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
        }
        input::-webkit-contacts-auto-fill-button,
        input::-webkit-credentials-auto-fill-button {
          visibility: hidden !important;
          display: none !important;
          pointer-events: none !important;
        }
      `}</style>
      {/* Pinned Fixed Background layer - Matches Reference Design (1280x720) */}
      <div
        className="patient-auth-fixed-bg"
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          backgroundImage: `url(${patientLoginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Main Form Card: Exact Figma Specs (Width: Fixed 490px, Hug: 571px, Radius: 28px, Padding: 40px 44px) */}
      <div
        className="patient-auth-card"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "28px",
          border: "1px solid rgba(0, 0, 0, 0.04)",
          boxShadow:
            "0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)",
          width: "490px",
          maxWidth: "calc(100vw - 32px)",
          minHeight: mode === "signup" ? "571px" : "auto",
          padding: "40px 44px",
          boxSizing: "border-box",
          textAlign: "center",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top Logo Emblem + Brand Title Side-by-Side (Matches Ref Images 1 & 2 exactly) */}
        <div
          onClick={() => navigate("/")}
          title="Homeopathy Clinic"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "26px",
            userSelect: "none",
            cursor: "pointer",
          }}
        >
          <img
            src={doctorPortalLogo}
            alt="Clinic Emblem"
            style={{
              width: "42px",
              height: "42px",
              display: "block",
              objectFit: "contain",
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0f291e",
              letterSpacing: "0.4px",
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            HOMEOPATHY CLINIC
          </span>
        </div>

        {/* =========================================================================
            VIEW 1: PATIENT LOGIN (Matches Ref Image 1 exactly)
            ========================================================================= */}
        {mode === "login" && (
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "#111827",
                margin: "0 0 6px 0",
                letterSpacing: "-0.3px",
              }}
            >
              Patient Portal
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                margin: "0 0 24px 0",
                fontWeight: "400",
              }}
            >
              Login to continue your portal.
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  lineHeight: "1.45",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "15px" }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} style={{ textAlign: "left" }}>
              {/* Field 1: Name or Email with User icon */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    name="username"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData((p) => ({ ...p, username: e.target.value }))
                    }
                    placeholder="Name or Email"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>
              </div>

              {/* Field 2: Password with Lock icon & Eye toggle */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                    transition: "border-color 0.2s",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Password"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#64748b",
                    }}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Row: Remember Me & Forgot Password? */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#111827",
                    fontWeight: "500",
                    userSelect: "none",
                  }}
                >
                  <span
                    onClick={() =>
                      setLoginData((p) => ({ ...p, rememberMe: !p.rememberMe }))
                    }
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      backgroundColor: loginData.rememberMe
                        ? "#144a2b"
                        : "#ffffff",
                      border: loginData.rememberMe
                        ? "1.5px solid #144a2b"
                        : "1.5px solid #cbd5e1",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {loginData.rememberMe && "✓"}
                  </span>
                  <span>Remember Me</span>
                </label>

                <span
                  onClick={handleOpenForgotModal}
                  style={{
                    fontSize: "13px",
                    color: "#144a2b",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Forgot Password?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor: "#144a2b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoading ? "Signing In..." : "Login"}
              </button>
            </form>

            {/* Bottom Switcher: Don't have an account? Sign Up */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "26px 0 0",
                color: "#cbd5e1",
              }}
            >
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
              />
              <span
                style={{
                  padding: "0 12px",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Don't have an account?{" "}
                <span
                  onClick={() => {
                    setMode("signup");
                    setError("");
                  }}
                  style={{
                    color: "#144a2b",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Sign Up
                </span>
              </span>
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
              />
            </div>

            {/* Separate Line: Are you an Admin? Click here */}
            <div
              style={{
                marginTop: "14px",
                fontSize: "13px",
                color: "#64748b",
                textAlign: "center",
              }}
            >
              Are you an Admin?{" "}
              <span
                onClick={() => navigate("/admin-login")}
                style={{
                  color: "#144a2b",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = "none";
                }}
              >
                Click here
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: PATIENT SIGN-UP (Matches Ref Image 2 exactly)
            ========================================================================= */}
        {mode === "signup" && (
          <div>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "#111827",
                margin: "0 0 6px 0",
                letterSpacing: "-0.3px",
              }}
            >
              Create Your Account
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "#6b7280",
                margin: "0 0 24px 0",
                fontWeight: "400",
              }}
            >
              Sign up to book appointments and manage your health records.
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  color: "#b91c1c",
                  border: "1px solid #fecaca",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  fontSize: "13px",
                  lineHeight: "1.45",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "15px" }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSignupSubmit} style={{ textAlign: "left" }}>
              {/* 2x2 Grid for Fields (Full Name, Email, Phone, Password) */}
              <div
                className="signup-fields-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "18px",
                }}
              >
                {/* Field 1: Full Name * */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    maxLength={35}
                    value={signupData.fullName}
                    onChange={(e) => {
                      const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 35);
                      setSignupData((p) => ({ ...p, fullName: cleanVal }));
                    }}
                    placeholder="Full Name *"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>

                {/* Field 2: Email Address * */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="Email Address *"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>

                {/* Field 3: Phone Number * */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={signupData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setSignupData((p) => ({
                        ...p,
                        phone: digits,
                      }));
                    }}
                    placeholder="Phone Number *"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>

                {/* Field 4: Create Password * */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "0 14px",
                    height: "48px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ marginRight: "10px", flexShrink: 0 }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showSignupPassword ? "text" : "password"}
                    value={signupData.password}
                    onChange={(e) =>
                      setSignupData((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Create Password *"
                    required
                    style={{
                      border: "none",
                      outline: "none",
                      width: "100%",
                      fontSize: "14px",
                      color: "#1e293b",
                      backgroundColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      color: "#64748b",
                    }}
                  >
                    {showSignupPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#334155",
                    userSelect: "none",
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    onClick={() =>
                      setSignupData((p) => ({
                        ...p,
                        agreeTerms: !p.agreeTerms,
                      }))
                    }
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "5px",
                      backgroundColor: signupData.agreeTerms
                        ? "#144a2b"
                        : "#ffffff",
                      border: signupData.agreeTerms
                        ? "1.5px solid #144a2b"
                        : "1.5px solid #cbd5e1",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: "700",
                      flexShrink: 0,
                    }}
                  >
                    {signupData.agreeTerms && "✓"}
                  </span>
                  <span>
                    I agree to the{" "}
                    <strong style={{ color: "#144a2b" }}>
                      Terms &amp; Conditions
                    </strong>{" "}
                    and{" "}
                    <strong style={{ color: "#144a2b" }}>Privacy Policy</strong>
                    .
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  height: "48px",
                  backgroundColor: "#144a2b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            {/* Bottom Switcher: Already have an account? Login */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "26px 0 0",
                color: "#cbd5e1",
              }}
            >
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
              />
              <span
                style={{
                  padding: "0 12px",
                  fontSize: "13px",
                  color: "#64748b",
                }}
              >
                Already have an account?{" "}
                <span
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  style={{
                    color: "#144a2b",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  Login
                </span>
              </span>
              <div
                style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              maxWidth: "420px",
              width: "100%",
              padding: "30px 28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              position: "relative",
              textAlign: "center",
            }}
          >
            <button
              onClick={handleCloseForgotModal}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "16px",
              }}
            >
              ✕
            </button>

            {forgotStep === 1 && (
              <div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#1e293b",
                    margin: "0 0 8px 0",
                  }}
                >
                  Patient Password Reset
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "0 0 20px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Enter your registered patient email address, mobile number, or username to receive a 6-digit verification code.
                </p>

                {forgotError && (
                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      color: "#b91c1c",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      marginBottom: "14px",
                      textAlign: "left",
                    }}
                  >
                    <div>{forgotError}</div>
                    {forgotError.includes("Admin Login") && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseForgotModal();
                          navigate("/admin-login");
                        }}
                        style={{
                          marginTop: "8px",
                          padding: "6px 12px",
                          backgroundColor: "#166534",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Go to Admin Login →
                      </button>
                    )}
                  </div>
                )}

                <div style={{ textAlign: "left", marginBottom: "16px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#475569",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Patient Email, Mobile, or Username
                  </label>
                  <input
                    type="text"
                    name="patient_forgot_identifier"
                    autoComplete="off"
                    placeholder="e.g. name@example.com or 10-digit mobile"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    height: "46px",
                    backgroundColor: "#144a2b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: forgotLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {forgotLoading ? "Sending Code..." : "Send Verification Code"}
                </button>
              </div>
            )}

            {forgotStep === 2 && (
              <div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#1e293b",
                    margin: "0 0 8px 0",
                  }}
                >
                  Enter Verification Code
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "0 0 16px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Code sent to{" "}
                  <strong style={{ color: "#144a2b" }}>{maskedEmail}</strong>
                </p>

                {isResetUserAdmin && (
                  <div
                    style={{
                      backgroundColor: "#f0fdf4",
                      color: "#166534",
                      border: "1px solid #bbf7d0",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      marginBottom: "14px",
                      textAlign: "left",
                    }}
                  >
                    🛡️ Administrator Account: After resetting your password, you will be redirected to the Admin Login portal.
                  </div>
                )}

                {forgotError && (
                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      color: "#b91c1c",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      fontSize: "13px",
                      marginBottom: "14px",
                      textAlign: "left",
                    }}
                  >
                    <div>{forgotError}</div>
                    {forgotError.includes("Admin Login") && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCloseForgotModal();
                          navigate("/admin-login");
                        }}
                        style={{
                          marginTop: "8px",
                          padding: "6px 12px",
                          backgroundColor: "#166534",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                          cursor: "pointer",
                        }}
                      >
                        Go to Admin Login →
                      </button>
                    )}
                  </div>
                )}

                <div style={{ textAlign: "left", marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#475569",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    6-Digit Verification Code (OTP)
                  </label>
                  <input
                    type="text"
                    name="patient_verification_otp"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    placeholder="••••••"
                    maxLength={6}
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    style={{
                      width: "100%",
                      height: "46px",
                      padding: "0 14px",
                      borderRadius: "10px",
                      border: "1.5px solid #e2e8f0",
                      fontSize: "18px",
                      letterSpacing: "8px",
                      textAlign: "center",
                      fontWeight: "700",
                      boxSizing: "border-box",
                      outline: "none",
                      backgroundColor: "#ffffff",
                    }}
                  />
                </div>

                <div style={{ textAlign: "left", marginBottom: "12px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#475569",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    New Password
                  </label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="patient_new_password"
                      id="patient_new_password"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "46px",
                        padding: "0 44px 0 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                      }}
                    >
                      {showNewPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "left", marginBottom: "16px" }}>
                  <label
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#475569",
                      display: "block",
                      marginBottom: "6px",
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div style={{ position: "relative", width: "100%" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="patient_confirm_password"
                      id="patient_confirm_password"
                      autoComplete="new-password"
                      data-form-type="other"
                      data-lpignore="true"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        width: "100%",
                        height: "46px",
                        padding: "0 44px 0 14px",
                        borderRadius: "10px",
                        border: "1.5px solid #e2e8f0",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        outline: "none",
                        backgroundColor: "#ffffff",
                      }}
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#64748b",
                      }}
                    >
                      {showConfirmPassword ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyAndResetPassword}
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    height: "46px",
                    backgroundColor: "#144a2b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: forgotLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {forgotLoading ? "Updating Password..." : "Reset Password"}
                </button>
              </div>
            )}

            {forgotStep === 3 && (
              <div>
                <div style={{ fontSize: "42px", marginBottom: "12px" }}>✅</div>
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#166534",
                    margin: "0 0 8px 0",
                  }}
                >
                  Password Reset Successfully!
                </h2>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "0 0 20px 0",
                  }}
                >
                  {isResetUserAdmin
                    ? "Your administrator password has been updated. Please log in through the Admin Portal."
                    : "Your password has been updated. You can now log in with your new credentials."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseForgotModal();
                    if (isResetUserAdmin) {
                      navigate("/admin-login");
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "46px",
                    backgroundColor: "#144a2b",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  {isResetUserAdmin ? "Go to Admin Login" : "Continue to Login"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 540px) {
          .patient-auth-card {
            width: calc(100vw - 32px) !important;
            max-width: 100% !important;
            padding: 30px 22px 26px 22px !important;
            border-radius: 22px !important;
          }
          .signup-fields-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

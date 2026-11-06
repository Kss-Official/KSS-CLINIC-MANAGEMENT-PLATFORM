import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";

import useAuth from "../../hooks/useAuth";

import { extractErrorMessage } from "../../utils/helpers";

import authApi from "../../api/authApi";

import doctorPortalLogo from "../../assets/doctor-portal-logo.png";

import loginBg from "../../assets/doctor-login-clean-bg.jpg?v=v4_pro_clinic_desk";

const AdminLoginPage = () => {
  const navigate = useNavigate();

  const { adminLogin, clearAuth, isAuthenticated, user, logout } = useAuth();

  const [formData, setFormData] = useState({ username: "", password: "" });

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState("");

  // When visiting Admin Login page, clear any previous session so credentials must be entered afresh
  useEffect(() => {
    clearAuth();
  }, []);

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

    if (formData.username && formData.username.trim()) {
      setForgotIdentifier(formData.username.trim());
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
  };

  const handleSendResetCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!forgotIdentifier || !forgotIdentifier.trim()) {
      setForgotError("Please enter your admin username or email address.");

      return;
    }

    setForgotLoading(true);

    setForgotError("");

    try {
      const res = await authApi.forgotPassword(
        forgotIdentifier.trim(),
        "admin",
      );

      if (res && res.success) {
        setMaskedEmail(res.email || "your registered email");
        setForgotCode("");
        setNewPassword("");
        setConfirmPassword("");
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        setForgotStep(2);
      } else {
        setForgotError(
          res?.error ||
            "No administrator account found with this username or email.",
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

    if (!forgotCode || !forgotCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");

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

        code: forgotCode.trim(),

        newPassword: newPassword,
      });

      if (res && res.success) {
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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,

      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsLoading(true);

    setError("");

    try {
      const data = await adminLogin(formData);
      if (data?.user?.role === "PATIENT") {
        await logout();
        setError(
          "Access denied. Patient accounts cannot log in through the Admin Portal. Please use the Patient Login.",
        );
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        extractErrorMessage(err) ||
          "Invalid credentials. Please verify your admin username and password.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="admin-login-viewport"

      style={{
        position: "fixed",

        top: 0,

        left: 0,

        right: 0,

        bottom: 0,

        width: "100vw",

        height: "100vh",

        overflow: "hidden",

        boxSizing: "border-box",

        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Pinned Fixed Background layer - Never moves or scrolls */}

      <div
        className="admin-auth-fixed-bg"

        style={{
          position: "fixed",

          top: 0,

          left: 0,

          right: 0,

          bottom: 0,

          width: "100%",

          height: "100%",

          backgroundImage: `url(${loginBg})`,

          backgroundSize: "cover",

          backgroundPosition: "center center",

          backgroundRepeat: "no-repeat",

          zIndex: 0,

          pointerEvents: "none",
        }}
      />

      {/* Back to Home Button */}

      <button
        type="button"

        onClick={() => navigate("/")}

        aria-label="Back to Home"

        className="back-to-home-btn"

        style={{
          position: "fixed",

          top: "24px",

          left: "28px",

          display: "inline-flex",

          alignItems: "center",

          gap: "8px",

          padding: "10px 20px",

          borderRadius: "9999px",

          backgroundColor: "#ffffff",

          color: "#114633",

          fontSize: "14px",

          fontWeight: "600",

          border: "1px solid rgba(0, 0, 0, 0.08)",

          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",

          cursor: "pointer",

          transition: "all 0.2s ease",

          zIndex: 100,

          textDecoration: "none",
        }}
      >
        <svg
          width="18"

          height="18"

          viewBox="0 0 24 24"

          fill="none"

          stroke="currentColor"

          strokeWidth="2.2"

          strokeLinecap="round"

          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>

        <span>Back to Home</span>
      </button>

      {/* Centered Form Anchor Container */}

      <div
        style={{
          position: "absolute",

          top: "50%",

          left: "50%",

          transform: "translate(-50%, -50%)",

          width: "100%",

          maxWidth: "430px",

          boxSizing: "border-box",

          padding: "0 16px",

          zIndex: 1,

          display: "flex",

          flexDirection: "column",

          alignItems: "center",
        }}
      >
        <div
          className="admin-login-card"

          style={{
            backgroundColor: "#ffffff",

            borderRadius: "24px",

            boxShadow:
              "0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 0 1px 1px rgba(0, 0, 0, 0.04)",

            border: "none",

            outline: "none",

            width: "100%",

            padding: "28px 36px 24px 36px",

            boxSizing: "border-box",

            textAlign: "center",

            position: "relative",
          }}
        >
          {/* Top Logo Emblem */}

          <div
            onClick={() => navigate("/")}

            title="Homeopathy Clinic"

            style={{
              display: "inline-flex",

              flexDirection: "column",

              alignItems: "center",

              marginBottom: "6px",

              userSelect: "none",

              cursor: "pointer",
            }}
          >
            <img
              src={doctorPortalLogo}

              alt="Doctor Clinic Emblem"

              style={{
                width: "44px",

                height: "44px",

                display: "block",

                margin: "0 auto",

                objectFit: "contain",
              }}
            />
          </div>

          {/* Clinic Name */}

          <h3
            style={{
              fontSize: "11px",

              fontWeight: "700",

              color: "#1e293b",

              letterSpacing: "0.5px",

              margin: "0 0 3px 0",

              textTransform: "uppercase",
            }}
          >
            DR. KUMAR TRIPATHI AMPEH (PAT.)
          </h3>

          {/* Clinic Subtitle */}

          <p
            style={{
              fontSize: "9px",

              fontWeight: "600",

              color: "#64748b",

              letterSpacing: "1.4px",

              margin: "0 0 12px 0",

              textTransform: "uppercase",
            }}
          >
            HOMEOPATHY CLINIC
          </p>

          <div
            style={{
              height: "1px",

              backgroundColor: "#e2e8f0",

              margin: "0 auto 14px auto",

              width: "100%",
            }}
          />

          {/* Title */}

          <h1
            style={{
              fontSize: "23px",

              fontWeight: "800",

              color: "#111827",

              margin: "0 0 4px 0",

              letterSpacing: "-0.3px",
            }}
          >
            Admin & Doctor Portal
          </h1>

          <p
            style={{
              fontSize: "13px",

              color: "#6b7280",

              margin: "0 0 16px 0",

              fontWeight: "400",
            }}
          >
            Access the clinic management dashboard.
          </p>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",

                color: "#b91c1c",

                border: "1px solid #fecaca",

                padding: "9px 12px",

                borderRadius: "10px",

                marginBottom: "14px",

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

          <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
            {/* Username / Email Field */}

            <div style={{ marginBottom: "13px" }}>
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  backgroundColor: "#ffffff",

                  border: "1.5px solid #e2e8f0",

                  borderRadius: "12px",

                  padding: "0 14px",

                  height: "46px",

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

                  value={formData.username}

                  onChange={handleChange}

                  placeholder="Admin Username or Email"

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

            {/* Password Field */}

            <div style={{ marginBottom: "13px" }}>
              <div
                style={{
                  display: "flex",

                  alignItems: "center",

                  backgroundColor: "#ffffff",

                  border: "1.5px solid #e2e8f0",

                  borderRadius: "12px",

                  padding: "0 14px",

                  height: "46px",

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

                  value={formData.password}

                  onChange={handleChange}

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

            {/* Forgot Password Link */}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "16px",
              }}
            >
              <span
                onClick={handleOpenForgotModal}

                style={{
                  fontSize: "13px",

                  color: "#166534",

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

                height: "46px",

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
              {isLoading ? "Verifying Admin..." : "Login to Dashboard"}
            </button>
          </form>

          <div
            style={{
              display: "flex",

              alignItems: "center",

              margin: "18px 0 12px",

              color: "#cbd5e1",
            }}
          >
            <div
              style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
            />

            <span
              style={{
                padding: "0 12px",
                fontSize: "12.5px",
                color: "#94a3b8",
              }}
            >
              or
            </span>

            <div
              style={{ flex: 1, height: "1px", backgroundColor: "#e2e8f0" }}
            />
          </div>

          <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
            Are you a Patient?{" "}
            <span
              onClick={() => navigate("/login")}

              style={{ color: "#166534", fontWeight: "700", cursor: "pointer" }}
            >
              Patient Login
            </span>
          </p>
        </div>
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
                  Admin Password Reset
                </h2>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    margin: "0 0 20px 0",
                    lineHeight: 1.5,
                  }}
                >
                  Enter your admin username or email address. We will send a
                  6-digit verification code.
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
                    {forgotError}
                  </div>
                )}

                <input
                  type="text"

                  placeholder="Admin Username or Email"

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
                    marginBottom: "16px",
                    outline: "none",
                  }}
                />

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
                  <strong style={{ color: "#1e293b" }}>{maskedEmail}</strong>
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
                    {forgotError}
                  </div>
                )}

                <input
                  type="text"
                  name="admin_verification_otp"
                  id="admin_verification_otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  data-form-type="other"
                  data-lpignore="true"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  style={{
                    width: "100%",
                    height: "46px",
                    padding: "0 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #e2e8f0",
                    fontSize: "16px",
                    letterSpacing: "4px",
                    textAlign: "center",
                    fontWeight: "700",
                    boxSizing: "border-box",
                    marginBottom: "12px",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                />

                <div style={{ position: "relative", marginBottom: "12px", width: "100%" }}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="admin_new_password"
                    id="admin_new_password"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="New Password (min 6 chars)"
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

                <div style={{ position: "relative", marginBottom: "16px", width: "100%" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="admin_confirm_password"
                    id="admin_confirm_password"
                    autoComplete="new-password"
                    data-form-type="other"
                    data-lpignore="true"
                    placeholder="Confirm New Password"
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
                  Your password has been updated. You can now log in with your
                  new credentials.
                </p>

                <button
                  type="button"

                  onClick={handleCloseForgotModal}

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
                  Continue to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLoginPage;

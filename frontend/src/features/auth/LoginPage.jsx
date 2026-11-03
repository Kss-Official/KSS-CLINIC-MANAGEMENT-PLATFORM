import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { extractErrorMessage } from '../../utils/helpers';
import authApi from '../../api/authApi';
import doctorPortalLogo from '../../assets/doctor-portal-logo.png';
import loginBg from '../../assets/doctor-login-clean-bg.jpg?v=v6_pure_wood_clean';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If user is ALREADY authenticated as doctor/admin, redirect to /dashboard
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'PATIENT') {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // When on the login page (e.g. after logout or direct access),
  // if the user clicks the browser Back button, navigate them cleanly to the Home page ('/')
  useEffect(() => {
    const handlePopState = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigate]);

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Enter email/username, 2: Enter code & new pass, 3: Success
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleOpenForgotModal = () => {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotError('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
    if (formData.username && formData.username.trim()) {
      setForgotIdentifier(formData.username.trim());
    }
  };

  const handleCloseForgotModal = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotError('');
    setForgotCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSendResetCode = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your username or registered email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await authApi.forgotPassword(forgotIdentifier.trim());
      if (res?.success) {
        setMaskedEmail(res.email || forgotIdentifier);
        setForgotStep(2);
      } else {
        setForgotError(res?.error || 'Failed to send reset code. Please try again.');
      }
    } catch (err) {
      setForgotError(extractErrorMessage(err) || 'No account found with this username or email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!forgotCode.trim()) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match. Please re-enter.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await authApi.resetPassword({
        identifier: forgotIdentifier.trim(),
        code: forgotCode.trim(),
        newPassword: newPassword,
      });

      if (res?.success) {
        setForgotStep(3);
        setFormData((prev) => ({ ...prev, username: forgotIdentifier, password: '' }));
      } else {
        setForgotError(res?.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setForgotError(extractErrorMessage(err) || 'Invalid or expired verification code.');
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
    setError('');

    try {
      const data = await login(formData);
      if (data?.user?.role === 'PATIENT') {
        navigate('/profile', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(extractErrorMessage(err) || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="login-viewport"
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        position: 'relative',
      }}
    >
      <style>{`
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus,
        .login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
          -webkit-text-fill-color: #1e293b !important;
          caret-color: #1e293b !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .login-input::placeholder {
          color: #94a3b8 !important;
          opacity: 1;
        }
      `}</style>

      {/* Main Login Card - Exactly matching Reference Design UI */}
      <div
        className="login-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
          border: 'none',
          outline: 'none',
          width: '100%',
          maxWidth: '420px',
          padding: '30px 40px 28px 40px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Top Logo Emblem */}
        <div
          onClick={() => navigate('/')}
          title="Homeopathy Clinic"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '6px',
            userSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <img
            src={doctorPortalLogo}
            alt="Doctor Clinic Emblem"
            style={{
              width: '44px',
              height: '44px',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Clinic Name */}
        <h3
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#1e293b',
            letterSpacing: '0.5px',
            margin: '0 0 3px 0',
            textTransform: 'uppercase',
          }}
        >
          DR. KUMAR TRIPATHI AMPEH (PAT.)
        </h3>

        {/* Clinic Subtitle */}
        <p
          style={{
            fontSize: '9px',
            fontWeight: '600',
            color: '#64748b',
            letterSpacing: '1.4px',
            margin: '0 0 16px 0',
            textTransform: 'uppercase',
          }}
        >
          HOMEOPATHY CLINIC
        </p>

        {/* Divider line matching reference */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#e2e8f0',
            margin: '0 auto 18px auto',
            width: '100%',
          }}
        />

        {/* Doctor Portal Title */}
        <h1
          style={{
            fontSize: '26px',
            fontWeight: '800',
            color: '#111827',
            margin: '0 0 4px 0',
            letterSpacing: '-0.3px',
          }}
        >
          Doctor Portal
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '11.5px',
            color: '#6b7280',
            margin: '0 0 20px 0',
            fontWeight: '400',
          }}
        >
          Login to continue managing your clinic.
        </p>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" cy="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Email / Username Field */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: '#8a99a8',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Email Address"
              required
              className="login-input"
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '40px',
                paddingRight: '14px',
                borderRadius: '8px',
                border: '1px solid #d2dbe6',
                fontSize: '13.5px',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#286241';
                e.target.style.boxShadow = '0 0 0 3px rgba(40, 98, 65, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d2dbe6';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: '#8a99a8',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="login-input"
              style={{
                width: '100%',
                height: '40px',
                paddingLeft: '40px',
                paddingRight: '44px',
                borderRadius: '8px',
                border: '1px solid #d2dbe6',
                fontSize: '13.5px',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#286241';
                e.target.style.boxShadow = '0 0 0 3px rgba(40, 98, 65, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d2dbe6';
                e.target.style.boxShadow = 'none';
              }}
            />
            {/* Password Toggle Visibility */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#8a99a8',
              }}
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                {showPassword && <line x1="2" y1="2" x2="22" y2="22" strokeWidth="1.8" />}
              </svg>
            </button>
          </div>

          {/* Forgot Password Link */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '16px',
            }}
          >
            <span
              onClick={handleOpenForgotModal}
              style={{
                color: '#285a38',
                fontSize: '11.5px',
                fontWeight: '600',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Forgot Password?
            </span>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              height: '40px',
              backgroundColor: '#366a44',
              color: '#ffffff',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2a5335';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#366a44';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            boxSizing: 'border-box',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseForgotModal();
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '460px',
              padding: '32px 32px 28px',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseForgotModal}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                color: '#94a3b8',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1e293b')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Step 1: Request Code */}
            {forgotStep === 1 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#e8f5e9',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1b4332',
                      marginBottom: '12px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>
                    Reset Password
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                    Enter your username or registered email. We will send a 6-digit verification code to your email.
                  </p>
                </div>

                {forgotError && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      marginBottom: '12px',
                      textAlign: 'left',
                    }}
                  >
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleSendResetCode}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                      Username or Email Address
                    </label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. admin or your email"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#1e293b',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#286241')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {forgotLoading ? 'Sending code via Brevo...' : 'Send Verification Code'}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '14px' }}>
                    <span
                      onClick={handleCloseForgotModal}
                      style={{
                        fontSize: '12.5px',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
                    >
                      Cancel & Return to Login
                    </span>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Enter Code & New Password */}
            {forgotStep === 2 && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#e0f2fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7',
                      marginBottom: '8px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>
                    Enter Verification Code
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.4' }}>
                    We sent a 6-digit code to <strong>{maskedEmail}</strong>.
                  </p>
                </div>

                {forgotError && (
                  <div
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      marginBottom: '12px',
                      textAlign: 'left',
                    }}
                  >
                    {forgotError}
                  </div>
                )}

                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      6-Digit Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 767891"
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1b4332',
                        letterSpacing: '4px',
                        textAlign: 'center',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#286241')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      New Password (min 6 characters)
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#1e293b',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#286241')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                      Confirm New Password
                    </label>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      style={{
                        width: '100%',
                        height: '44px',
                        padding: '0 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#1e293b',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#286241')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      width: '100%',
                      height: '44px',
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: '700',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '12.5px' }}>
                    <span
                      onClick={handleSendResetCode}
                      style={{ color: '#2d6a4f', cursor: 'pointer', fontWeight: '600' }}
                    >
                      Resend Code
                    </span>
                    <span
                      onClick={handleCloseForgotModal}
                      style={{ color: '#64748b', cursor: 'pointer' }}
                    >
                      Cancel
                    </span>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Success Screen */}
            {forgotStep === 3 && (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16a34a',
                    marginBottom: '16px',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0' }}>
                  Password Reset Successfully!
                </h3>
                <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                  Your password has been updated. You can now login to your clinic portal with your new password.
                </p>
                <button
                  type="button"
                  onClick={handleCloseForgotModal}
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: '#1b4332',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 580px) {
          .back-to-home-btn {
            top: 14px !important;
            left: 14px !important;
            padding: 8px 14px !important;
            font-size: 12.5px !important;
          }
          .login-card {
            padding: 28px 20px 24px 20px !important;
            border-radius: 20px !important;
            max-width: 92% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

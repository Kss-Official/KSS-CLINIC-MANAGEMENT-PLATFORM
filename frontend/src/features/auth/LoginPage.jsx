import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { extractErrorMessage } from '../../utils/helpers';
import doctorPortalLogo from '../../assets/doctor-portal-logo.png';
import loginBg from '../../assets/doctor-login-clean-bg.jpg?v=figma_frame11';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        navigate('/profile');
      } else {
        navigate('/dashboard');
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
      {/* Back to Home Option on the Left Side */}
      <button
        type="button"
        onClick={() => navigate('/')}
        aria-label="Back to Home"
        className="back-to-home-btn"
        style={{
          position: 'absolute',
          top: '28px',
          left: '32px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          borderRadius: '9999px',
          backgroundColor: '#ffffff',
          color: '#1b4332',
          fontSize: '13.5px',
          fontWeight: '600',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          zIndex: 10,
          textDecoration: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f8fafc';
          e.currentTarget.style.transform = 'translateX(-3px)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#ffffff';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.08)';
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to Home</span>
      </button>

      {/* Main Login Card - Exactly 530px width matching Figma Frame 11 specifications */}
      <div
        className="login-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: 'none',
          border: 'none',
          outline: 'none',
          width: '100%',
          maxWidth: '530px',
          padding: '40px 44px 38px 44px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Top Logo Emblem (clickable to navigate to home) */}
        <div
          onClick={() => navigate('/')}
          title="Back to Home"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '8px',
            userSelect: 'none',
            cursor: 'pointer',
          }}
        >
          <img
            src={doctorPortalLogo}
            alt="Doctor Clinic Emblem"
            style={{
              width: '56px',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Clinic Name */}
        <h3
          style={{
            fontSize: '13px',
            fontWeight: '700',
            color: '#1e293b',
            letterSpacing: '0.4px',
            margin: '6px 0 2px 0',
            textTransform: 'uppercase',
          }}
        >
          DR. KUMAR TRIPATHI AMPEH (PAT.)
        </h3>

        {/* Clinic Subtitle */}
        <p
          style={{
            fontSize: '10px',
            fontWeight: '600',
            color: '#6b7c8d',
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
            margin: '0 auto 20px auto',
            width: '100%',
          }}
        />

        {/* Doctor Portal Title */}
        <h1
          style={{
            fontSize: '30px',
            fontWeight: '800',
            color: '#111827',
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
          }}
        >
          Doctor Portal
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '13.5px',
            color: '#6b7280',
            margin: '0 0 24px 0',
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
              marginBottom: '18px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          {/* Email / Username Field */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
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
              style={{
                width: '100%',
                height: '46px',
                paddingLeft: '44px',
                paddingRight: '14px',
                borderRadius: '10px',
                border: '1px solid #d2dbe6',
                fontSize: '14px',
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
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
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
              style={{
                width: '100%',
                height: '46px',
                paddingLeft: '44px',
                paddingRight: '44px',
                borderRadius: '10px',
                border: '1px solid #d2dbe6',
                fontSize: '14px',
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
              marginBottom: '20px',
            }}
          >
            <span
              onClick={() => alert('Please contact the clinic administrator to reset your password.')}
              style={{
                color: '#2d6a4f',
                fontSize: '12px',
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
              height: '44px',
              backgroundColor: '#366a44',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontSize: '14.5px',
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

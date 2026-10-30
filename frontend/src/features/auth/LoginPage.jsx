import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { extractErrorMessage } from '../../utils/helpers';
import doctorPortalLogo from '../../assets/doctor-portal-logo.png';
import loginBg from '../../assets/doctor-login-bg.jpg';

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
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err) || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
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
        padding: '32px 16px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        className="login-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '30px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.08)',
          width: '100%',
          maxWidth: '520px',
          padding: '44px 48px 40px 48px',
          boxSizing: 'border-box',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Top Logo Emblem */}
        <div
          onClick={() => navigate('/')}
          title="Return to Home"
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '14px',
            userSelect: 'none',
          }}
        >
          <img
            src={doctorPortalLogo}
            alt="Doctor Clinic Emblem"
            style={{
              width: '82px',
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
            fontSize: '15.5px',
            fontWeight: '700',
            color: '#162534',
            letterSpacing: '0.4px',
            margin: '0 0 4px 0',
            textTransform: 'uppercase',
          }}
        >
          DR. KUMAR TRIPATHI AMPEH (PAT.)
        </h3>

        {/* Clinic Subtitle */}
        <p
          style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#627588',
            letterSpacing: '2.5px',
            margin: '0 0 24px 0',
            textTransform: 'uppercase',
          }}
        >
          HOMEOPATHY CLINIC
        </p>

        {/* Thin Divider Line */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#e6ebf1',
            width: '100%',
            margin: '0 0 26px 0',
          }}
        />

        {/* Doctor Portal Title */}
        <h1
          style={{
            fontSize: '34px',
            fontWeight: '800',
            color: '#111827',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px',
          }}
        >
          Doctor Portal
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '15px',
            color: '#596773',
            margin: '0 0 28px 0',
            fontWeight: '400',
          }}
        >
          Login to continue managing your clinic.
        </p>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '11px 16px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '10px',
              fontSize: '13.5px',
              marginBottom: '20px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
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
                height: '52px',
                paddingLeft: '48px',
                paddingRight: '16px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2e623f';
                e.target.style.boxShadow = '0 0 0 3px rgba(46, 98, 63, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <div
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
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
                height: '52px',
                paddingLeft: '48px',
                paddingRight: '48px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                fontSize: '15px',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2e623f';
                e.target.style.boxShadow = '0 0 0 3px rgba(46, 98, 63, 0.12)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
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
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#64748b',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              marginBottom: '24px',
            }}
          >
            <span
              onClick={() => alert('Please contact the clinic administrator to reset your password.')}
              style={{
                color: '#2e623f',
                fontSize: '14.5px',
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
              height: '52px',
              backgroundColor: '#2e623f',
              color: '#ffffff',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#244e32';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2e623f';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isLoading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          .login-card {
            padding: 36px 24px 32px 24px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;

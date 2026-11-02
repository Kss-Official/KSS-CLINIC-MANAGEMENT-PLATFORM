import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { extractErrorMessage } from '../../utils/helpers';
import doctorPortalLogo from '../../assets/doctor-portal-logo.png';

const PatientAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({ username: '', password: '' });

  // Register form state
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await login({
        username: loginData.username.trim(),
        password: loginData.password,
      });
      if (onSuccess) {
        onSuccess(data?.user);
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err) || 'Invalid login credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validations
    const phoneClean = (regData.phoneNumber || '').replace(/\D/g, '');
    if (!phoneClean || phoneClean.length !== 10 || !/^[6-9]/.test(phoneClean)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
      setIsLoading(false);
      return;
    }

    const emailTrimmed = (regData.email || '').trim().toLowerCase();
    if (!emailTrimmed || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(emailTrimmed)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }
    if (/\.com.+$/i.test(emailTrimmed)) {
      setError('No characters are allowed after .com in the email address');
      setIsLoading(false);
      return;
    }

    try {
      const userPayload = {
        username: regData.username.trim() || emailTrimmed.split('@')[0],
        email: emailTrimmed,
        first_name: regData.firstName.trim(),
        last_name: regData.lastName.trim(),
        phone_number: phoneClean,
        password: regData.password,
        role: 'PATIENT',
      };

      const data = await register(userPayload);
      if (onSuccess) {
        onSuccess(data?.user);
      }
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err) || 'Registration failed. Please check your information.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        boxSizing: 'border-box',
        fontFamily: "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '460px',
          padding: '32px 30px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          position: 'relative',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        >
          ✕
        </button>

        {/* Clinic Emblem Header */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <img
            src={doctorPortalLogo}
            alt="Clinic Emblem"
            style={{ width: '48px', height: 'auto', margin: '0 auto 8px auto', display: 'block' }}
          />
          <h3
            style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#64748b',
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              margin: '0 0 4px 0',
            }}
          >
            Homeopathy Clinic
          </h3>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#1e293b',
              margin: '0 0 6px 0',
            }}
          >
            Patient Portal
          </h2>
          <p
            style={{
              fontSize: '13px',
              color: '#64748b',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            Please log in or create an account to book and manage your appointments.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '18px',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'login' ? '#ffffff' : 'transparent',
              color: activeTab === 'login' ? '#1b4332' : '#64748b',
              fontWeight: activeTab === 'login' ? '700' : '600',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: activeTab === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'register' ? '#ffffff' : 'transparent',
              color: activeTab === 'register' ? '#1b4332' : '#64748b',
              fontWeight: activeTab === 'register' ? '700' : '600',
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: activeTab === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            New Patient Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: '8px',
              fontSize: '12.5px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Email or Username
              </label>
              <input
                type="text"
                required
                value={loginData.username}
                onChange={(e) => setLoginData((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="name@example.com or username"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={loginData.password}
                onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '9px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: '#265e38',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                boxShadow: '0 4px 12px rgba(38, 94, 56, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#1e4b2d')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#265e38')}
            >
              {isLoading ? 'Signing In...' : 'Sign In & Continue Booking →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Don't have an account?{' '}
                <strong
                  onClick={() => {
                    setActiveTab('register');
                    setError('');
                  }}
                  style={{ color: '#265e38', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Register here
                </strong>
              </span>
            </div>
          </form>
        )}

        {/* Tab 2: Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={regData.firstName}
                  onChange={(e) => setRegData((prev) => ({ ...prev, firstName: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
                  placeholder="First name"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={regData.lastName}
                  onChange={(e) => setRegData((prev) => ({ ...prev, lastName: e.target.value.replace(/[^a-zA-Z\s]/g, '') }))}
                  placeholder="Last name"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Mobile Number (10 digits) *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={regData.phoneNumber}
                onChange={(e) => setRegData((prev) => ({ ...prev, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="e.g. 9876543210"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={regData.email}
                onChange={(e) => setRegData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#334155', marginBottom: '4px' }}>
                Create Password (min 6 characters) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={regData.password}
                onChange={(e) => setRegData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: '6px',
                padding: '12px',
                borderRadius: '9999px',
                backgroundColor: '#265e38',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: '700',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.75 : 1,
                boxShadow: '0 4px 12px rgba(38, 94, 56, 0.25)',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#1e4b2d')}
              onMouseLeave={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#265e38')}
            >
              {isLoading ? 'Creating Account...' : 'Register & Proceed to Book →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Already registered?{' '}
                <strong
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                  style={{ color: '#265e38', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign In
                </strong>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PatientAuthModal;

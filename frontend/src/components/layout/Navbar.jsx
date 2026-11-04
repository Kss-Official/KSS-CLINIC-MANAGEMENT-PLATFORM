import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import logoImg from '../../assets/logo.png';
import avatarImg from '../../assets/avatar.png';

const Navbar = ({ onOpenBooking }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Services', href: '#services' },
    { label: 'Stories', href: '#stories' },
    { label: 'Contact', href: '#contact' },
  ];

  const handleNavClick = (label, href) => {
    setActiveNav(label);
    setMobileMenuOpen(false);

    if (label === 'About') {
      navigate('/about');
      return;
    }

    if (label === 'Services') {
      navigate('/services');
      return;
    }

    if (label === 'Stories') {
      navigate('/stories');
      return;
    }

    if (label === 'Contact') {
      navigate('/contact');
      return;
    }

    if (label === 'Home') {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (location.pathname !== '/') {
      navigate('/' + href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleBookClick = () => {
    if (onOpenBooking && typeof onOpenBooking === 'function' && location.pathname === '/book-appointment') {
      onOpenBooking();
    } else {
      navigate('/book-appointment');
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        marginTop: 0,
        zIndex: 1000,
        width: '100%',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f0f2f1',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        className="navbar-inner"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 40px',
          height: '70px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Left: Brand Logo */}
        <div
          id="navbar-brand-logo"
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <img
            src={logoImg}
            alt="Homeopathy Clinic"
            style={{
              height: '38px',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </div>

        {/* Center: Navigation Links (Centrally placed across navbar) */}
        <nav
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '34px',
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              (location.pathname === '/about' && link.label === 'About') ||
              (location.pathname === '/services' && link.label === 'Services') ||
              (location.pathname === '/stories' && link.label === 'Stories') ||
              (location.pathname === '/contact' && link.label === 'Contact') ||
              (location.pathname === '/' && activeNav === link.label);
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.label, link.href);
                }}
                style={{
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#346a48' : '#596773',
                  position: 'relative',
                  padding: '8px 2px',
                  transition: 'color 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                      width: '100%',
                      height: '2px',
                      backgroundColor: '#346a48',
                      borderRadius: '1px',
                    }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right: Login Button, Book Appointment Button & Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '16px',
          }}
        >
          {/* Login Button (Hidden when patient is authenticated) */}
          {!isAuthenticated && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                color: '#265e38',
                border: '1.5px solid #265e38',
                padding: '9.5px 22px',
                borderRadius: '9999px',
                fontSize: '14.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Login
            </button>
          )}

          <button
            type="button"
            onClick={handleBookClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#265e38',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '9999px',
              fontSize: '14.5px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1f4e2e';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#265e38';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Appointment
          </button>

          {/* Profile Avatar with Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              onClick={() => {
                if (isAuthenticated) {
                  setDropdownOpen((prev) => !prev);
                } else {
                  navigate('/login');
                }
              }}
              title={isAuthenticated ? 'Account Options' : 'Login'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                boxSizing: 'border-box',
                border: (location.pathname === '/profile' || dropdownOpen) ? '2.5px solid #265e38' : '1px solid #e5e7eb',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: (location.pathname === '/profile' || dropdownOpen) ? '#265e38' : '#ffffff',
                transition: 'all 0.15s ease',
                boxShadow: (location.pathname === '/profile' || dropdownOpen) ? '0 0 0 1px rgba(38, 94, 56, 0.15)' : 'none',
                padding: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src={avatarImg}
                alt="Profile"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  borderRadius: '50%',
                }}
              />
            </div>

            {/* Profile Dropdown Menu for Authenticated Patient */}
            {isAuthenticated && dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '230px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #e2e8f0',
                  padding: '12px',
                  zIndex: 1000,
                  boxSizing: 'border-box',
                  animation: 'fadeIn 0.15s ease-out',
                }}
              >
                {/* User info banner */}
                <div style={{ padding: '4px 8px 10px 8px', borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.first_name || user?.username || 'Patient'}
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email || user?.phone_number || 'Logged In'}
                  </p>
                </div>

                <div style={{ paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8.5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#1e293b',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </button>

                  {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '8.5px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#1e293b',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      Admin Portal
                    </button>
                  )}

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '6px 0' }} />

                  <button
                    type="button"
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                      navigate('/');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '8.5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Toggle */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#265e38',
              padding: '4px',
            }}
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderTop: '1px solid #f0f0f0',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {navLinks.map((link) => {
            const isActive =
              (location.pathname === '/about' && link.label === 'About') ||
              (location.pathname === '/services' && link.label === 'Services') ||
              (location.pathname === '/stories' && link.label === 'Stories') ||
              (location.pathname === '/contact' && link.label === 'Contact') ||
              (location.pathname === '/' && activeNav === link.label);
            return (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.label, link.href);
                }}
                style={{
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: isActive ? '700' : '500',
                  color: isActive ? '#265e38' : '#596773',
                  padding: '8px 0',
                }}
              >
                {link.label}
              </a>
            );
          })}
          {isAuthenticated ? (
            <>
              {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#265e38',
                    border: '1.5px solid #265e38',
                    padding: '10px',
                    borderRadius: '9999px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginTop: '6px',
                  }}
                >
                  Admin Portal
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  setMobileMenuOpen(false);
                  await logout();
                  navigate('/');
                }}
                style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '9999px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#265e38',
                border: '1.5px solid #265e38',
                padding: '10px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '6px',
              }}
            >
              Login
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .navbar-inner {
            padding: 0 24px !important;
            gap: 16px !important;
          }
          .desktop-nav {
            gap: 22px !important;
          }
        }
        @media (min-width: 820px) {
          .desktop-nav {
            display: flex !important;
          }
          .mobile-toggle {
            display: none !important;
          }
        }
        @media (max-width: 819px) {
          .navbar-inner {
            grid-template-columns: auto 1fr !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

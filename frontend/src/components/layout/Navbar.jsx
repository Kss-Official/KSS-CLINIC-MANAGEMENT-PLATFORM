import React, { useState } from 'react';
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
        zIndex: 100,
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
          {/* Login / Portal Button */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {(user?.role === 'ADMIN' || user?.role === 'DOCTOR') ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    color: '#265e38',
                    border: '1.5px solid #265e38',
                    padding: '8.5px 18px',
                    borderRadius: '9999px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Admin Portal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    color: '#265e38',
                    border: '1.5px solid #265e38',
                    padding: '8.5px 18px',
                    borderRadius: '9999px',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  My Portal
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                title="Logout"
                style={{
                  backgroundColor: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '6px 8px',
                }}
              >
                Logout
              </button>
            </div>
          ) : (
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

          {/* Profile Avatar Circle */}
          <div
            onClick={() => navigate('/profile')}
            title="View Patient Profile"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              boxSizing: 'border-box',
              border: location.pathname === '/profile' ? '2.5px solid #265e38' : '1px solid #e5e7eb',
              cursor: 'pointer',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: location.pathname === '/profile' ? '#265e38' : '#ffffff',
              transition: 'all 0.15s ease',
              boxShadow: location.pathname === '/profile' ? '0 0 0 1px rgba(38, 94, 56, 0.15)' : 'none',
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

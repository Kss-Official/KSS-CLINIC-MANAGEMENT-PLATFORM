import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import logoImg from '../../assets/logo.png';
import avatarImg from '../../assets/avatar.png';

const Navbar = ({ onOpenBooking }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, updateUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Helper to get consistent user initials across Navbar and Profile sections
  const getUserInitials = (u) => {
    if (u?.initials) return u.initials.toUpperCase();
    const name = (
      u?.full_name ||
      u?.name ||
      u?.fullName ||
      `${u?.first_name || ''} ${u?.last_name || ''}`.trim() ||
      u?.username ||
      ''
    ).trim();
    if (!name) return 'P';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  // Keep Navbar avatar & initials synchronized with real-time profile updates
  useEffect(() => {
    const handleProfileImageUpdate = (e) => {
      const newUrl = e?.detail?.profile_image_url !== undefined ? e.detail.profile_image_url : null;
      if (user && updateUser) {
        updateUser({
          ...user,
          profile_image_url: newUrl,
        });
      }
    };

    const handleProfileUpdate = (e) => {
      if (e?.detail && user && updateUser) {
        updateUser({
          ...user,
          ...e.detail,
        });
      }
    };

    window.addEventListener('profile-image-updated', handleProfileImageUpdate);
    window.addEventListener('profile-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
      window.removeEventListener('profile-updated', handleProfileUpdate);
    };
  }, [user, updateUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Completely lock background page scrolling when mobile navigation menu is open
  useEffect(() => {
    if (!mobileMenuOpen) return;

    // 1. Capture exact vertical scroll position before locking
    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyTop = document.body.style.top;
    const originalBodyWidth = document.body.style.width;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    // 2. Lock both documentElement and body (prevents iOS Safari momentum bounce and window movement)
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // 3. Restore styles
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.top = originalBodyTop;
      document.body.style.width = originalBodyWidth;

      // 4. Restore scroll position seamlessly without jarring jumps
      window.scrollTo(0, scrollY);
    };
  }, [mobileMenuOpen]);

  // Auto-close mobile navigation menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Auto-close mobile menu if user resizes window to desktop screen size (>= 820px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 820) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 50);
      }
      return;
    }

    if (location.pathname !== '/') {
      navigate('/' + href);
    } else {
      setTimeout(() => {
        const element = document.querySelector(href);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/book-appointment' } });
      return;
    }
    if (onOpenBooking) {
      onOpenBooking();
    }
    if (location.pathname === '/book-appointment') {
      window.dispatchEvent(new CustomEvent('reset-booking-form'));
    } else {
      navigate('/book-appointment');
    }
  };

  return (
    <header
      className={`patient-navbar-header ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}
      style={{
        position: mobileMenuOpen ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        right: 0,
        marginTop: 0,
        zIndex: mobileMenuOpen ? 100000 : 1000,
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
          position: 'relative',
          zIndex: 100003,
          backgroundColor: '#ffffff',
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
            className="navbar-logo-img"
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
          className="navbar-right-controls"
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
              id="nav-login-btn"
              className="nav-login-btn"
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
            id="nav-book-btn"
            className="nav-book-btn"
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
            <span className="nav-book-btn-text">Book Appointment</span>
          </button>

          {/* Profile Avatar with Dropdown - Only displayed for authenticated users */}
          {isAuthenticated && (
            <div className="navbar-avatar-wrap" style={{ position: 'relative' }} ref={dropdownRef}>
              <div
                onClick={() => setDropdownOpen((prev) => !prev)}
                title="Account Options"
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
              {user?.profile_image_url ? (
                <img
                  key={user.profile_image_url}
                  src={user.profile_image_url}
                  alt="Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '50%',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div
                style={{
                  display: user?.profile_image_url ? 'none' : 'flex',
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13.5px',
                  letterSpacing: '0.5px',
                }}
              >
                {getUserInitials(user)}
              </div>
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
                    {user?.full_name || user?.name || user?.first_name || user?.username || 'Patient'}
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
                    id="patient-nav-logout-btn"
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
          )}

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

      {/* Mobile Floating Navigation Menu & Backdrop */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay locking background touch/click while keeping background visible */}
          <div
            className="mobile-nav-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(1.5px)',
              WebkitBackdropFilter: 'blur(1.5px)',
              zIndex: 100001,
              touchAction: 'none',
              cursor: 'pointer',
            }}
          />

          <div
            className="mobile-nav-dropdown"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              width: '100%',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #f0f0f0',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px',
              boxShadow: '0 20px 40px -4px rgba(0, 0, 0, 0.2), 0 8px 16px -2px rgba(0, 0, 0, 0.08)',
              padding: '16px 24px 24px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              maxHeight: 'calc(85vh - 70px)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              boxSizing: 'border-box',
              zIndex: 100002,
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
                      width: '100%',
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
                    width: '100%',
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
                  width: '100%',
                }}
              >
                Login
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes mobileNavDropdownSlide {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes mobileNavBackdropFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .mobile-nav-backdrop {
          animation: mobileNavBackdropFade 0.2s ease-out forwards;
        }
        .mobile-nav-dropdown {
          animation: mobileNavDropdownSlide 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
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
          .patient-navbar-header.mobile-menu-active {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 100000 !important;
          }
          .navbar-inner {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            position: relative !important;
            z-index: 100003 !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: block !important;
          }
        }
        @media (max-width: 640px) {
          .navbar-inner {
            padding: 0 16px !important;
            height: 62px !important;
          }
          .mobile-nav-dropdown {
            padding: 14px 20px 22px 20px !important;
            border-bottom-left-radius: 18px !important;
            border-bottom-right-radius: 18px !important;
          }
          .navbar-logo-img {
            height: 32px !important;
          }
          .nav-login-btn {
            display: inline-flex !important;
            padding: 8px 14px !important;
            font-size: 13px !important;
          }
          .nav-book-btn {
            padding: 8px 14px !important;
            font-size: 13px !important;
          }
          .navbar-right-controls {
            gap: 10px !important;
          }
        }
        @media (max-width: 420px) {
          .navbar-inner {
            padding: 0 12px !important;
          }
          .nav-login-btn {
            padding: 7px 11px !important;
            font-size: 12px !important;
          }
          .nav-book-btn-text {
            display: none !important;
          }
          .nav-book-btn {
            padding: 8px 10px !important;
            gap: 0 !important;
          }
        }
      `}</style>
    </header>
  );
};

export default Navbar;

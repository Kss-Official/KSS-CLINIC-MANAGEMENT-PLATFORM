import React from 'react';
import { Link } from 'react-router-dom';
import logoWhite from '../../assets/logo-white.png';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#0d2214',
        color: '#9ca3af',
        padding: '65px 0 32px',
        borderTop: '1px solid #142f1d',
      }}
    >
      <div
        className="footer-inner-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 38px',
          boxSizing: 'border-box',
        }}
      >
        {/* Top 3 Columns Grid */}
        <div
          className="footer-columns-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '550px 310px 1fr',
            gap: '40px',
            marginBottom: '48px',
          }}
        >
          {/* Column 1: Brand & Description */}
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                textDecoration: 'none',
                marginBottom: '18px',
                cursor: 'pointer',
              }}
            >
              <img
                src={logoWhite}
                alt="Homeopathy Clinic"
                style={{
                  height: '44px',
                  width: 'auto',
                  display: 'block',
                  objectFit: 'contain',
                }}
              />
            </Link>

            <p
              style={{
                fontSize: '14px',
                lineHeight: '1.65',
                color: '#8b978f',
                maxWidth: '380px',
                margin: 0,
              }}
            >
              Providing gentle, holistic, and evidence-informed homeopathic remedies tailored to individual health journeys.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.6px',
                color: '#ffffff',
                marginBottom: '18px',
                marginTop: '4px',
              }}
            >
              QUICK LINKS
            </h4>

            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {[
                { label: 'Home', href: '#home' },
                { label: 'About', href: '#about' },
                { label: 'Services', href: '#services' },
                { label: 'Stories', href: '#stories' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    style={{
                      color: '#8b978f',
                      textDecoration: 'none',
                      fontSize: '14px',
                      transition: 'color 0.2s ease',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#8b978f')}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Information */}
          <div>
            <h4
              style={{
                fontSize: '13px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.6px',
                color: '#ffffff',
                marginBottom: '18px',
                marginTop: '4px',
              }}
            >
              CONTACT INFORMATION
            </h4>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                fontSize: '14px',
                color: '#8b978f',
              }}
            >
              {/* Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>123 Clinic Street, Your City, Your State - 123456</span>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <a
                  href="tel:+919876543210"
                  style={{ color: '#8b978f', textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8b978f')}
                >
                  +91 98765 43210
                </a>
              </div>

              {/* Email */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a
                  href="mailto:info@dtripathiampeh.com"
                  style={{ color: '#8b978f', textDecoration: 'none', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#8b978f')}
                >
                  info@dtripathiampeh.com
                </a>
              </div>

              {/* Hours */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginTop: '2px' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div style={{ lineHeight: '1.5' }}>
                  <span>Mon - Sat: 9:00 AM - 6:00 PM</span>
                  <br />
                  <span style={{ color: '#8b978f', fontSize: '13.5px' }}>(Sunday Closed)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div
          style={{
            borderTop: '1px solid #1c3726',
            marginBottom: '22px',
          }}
        />

        {/* Bottom Copyright & Legal Links Row */}
        <div
          className="footer-bottom-row"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            color: '#6e7a72',
            minHeight: '22px',
          }}
        >
          <p style={{ margin: 0, textAlign: 'center' }}>
            © 2026 Dr. K. Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.
          </p>

          <div
            className="footer-legal-links"
            style={{
              position: 'absolute',
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <a
              href="#privacy"
              style={{ color: '#6e7a72', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6e7a72')}
            >
              Privacy Policy
            </a>
            <span style={{ color: '#3d4d42' }}>|</span>
            <a
              href="#terms"
              style={{ color: '#6e7a72', textDecoration: 'none', transition: 'color 0.2s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#86efac')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6e7a72')}
            >
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .footer-columns-grid {
            grid-template-columns: 1.2fr 0.8fr 1.2fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 820px) {
          .footer-columns-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
          }
          .footer-bottom-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .footer-legal-links {
            position: static !important;
          }
        }
        @media (max-width: 540px) {
          .footer-columns-grid {
            grid-template-columns: 1fr !important;
            gap: 26px !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

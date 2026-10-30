import React from 'react';
import { useNavigate } from 'react-router-dom';
import ctaBg from '../../assets/cta-bg.jpg';

const CtaBannerSection = ({ onOpenBooking }) => {
  const navigate = useNavigate();

  const handleBooking = () => {
    if (onOpenBooking) {
      onOpenBooking();
    } else {
      navigate('/book-appointment');
    }
  };

  return (
    <section
      id="contact"
      style={{
        position: 'relative',
        width: '100%',
        backgroundImage: `url(${ctaBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#1b3b22',
        overflow: 'hidden',
        minHeight: '395px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        className="cta-banner-container"
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '85px 38px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="cta-banner-content"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
          }}
        >
          {/* Left Text Column */}
          <div style={{ maxWidth: '720px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '12.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.8px',
                color: '#74c69d',
                marginBottom: '14px',
              }}
            >
              READY TO START YOUR WELLNESS JOURNEY?
            </span>

            <h2
              className="cta-banner-heading"
              style={{
                fontSize: '48px',
                fontWeight: '800',
                lineHeight: '1.14',
                color: '#ffffff',
                letterSpacing: '-0.8px',
                marginBottom: '16px',
              }}
            >
              Book Your Appointment<br />Today
            </h2>

            <p
              className="cta-banner-subheading"
              style={{
                fontSize: '15.5px',
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              Take the first step towards better health with personalized homeopathic care from Dr. Kumar<br className="cta-sub-break" /> Tripathi Ampeh (Pat.).
            </p>
          </div>

          {/* Right Button Column */}
          <div style={{ flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleBooking}
              className="cta-book-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#ffffff',
                color: '#153e26',
                fontSize: '15.5px',
                fontWeight: '700',
                padding: '15px 34px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.16)',
                transition: 'all 0.25s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.24)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.16)';
              }}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#153e26"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Book Appointment</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .cta-banner-container {
            padding: 70px 28px !important;
          }
          .cta-banner-heading {
            font-size: 38px !important;
          }
        }
        @media (max-width: 768px) {
          .cta-banner-container {
            padding: 55px 20px !important;
          }
          .cta-banner-content {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 26px !important;
          }
          .cta-banner-heading {
            font-size: 32px !important;
          }
          .cta-sub-break {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CtaBannerSection;

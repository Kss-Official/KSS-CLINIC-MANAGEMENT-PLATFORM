import React from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../../assets/hero-bg.jpg';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      style={{
        position: 'relative',
        backgroundImage: `url(${heroBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        minHeight: '520px',
        display: 'flex',
        alignItems: 'center',
        color: '#ffffff',
        overflow: 'hidden',
        backgroundColor: '#0e2312',
      }}
    >
      {/* Dark gradient overlay matching Image 1:
          solid dark green on the left where the text sits,
          gently fading into the amber bottles and mortar on the right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(90deg, rgba(14, 35, 18, 0.98) 0%, rgba(14, 35, 18, 0.95) 35%, rgba(14, 35, 18, 0.70) 52%, rgba(14, 35, 18, 0.20) 75%, rgba(14, 35, 18, 0.05) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '60px 40px 50px',
        }}
        className="hero-inner-container"
      >
        <div style={{ maxWidth: '600px' }}>
          {/* Subtitle / Category Badge */}
          <span
            style={{
              display: 'inline-block',
              fontSize: '12px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: '#72d28f',
              marginBottom: '14px',
            }}
          >
            NATURAL HEALING FOR A HEALTHIER TOMORROW
          </span>

          {/* Main Title (Exact wording & 3-line wrap from Image 1) */}
          <h1
            style={{
              fontSize: '48px',
              fontWeight: '800',
              lineHeight: '1.14',
              letterSpacing: '-0.5px',
              color: '#ffffff',
              marginBottom: '18px',
            }}
            className="hero-title-text"
          >
            Personalized<br />
            Homeopathic Care for<br />
            Your Well-being
          </h1>

          {/* Description Paragraph */}
          <p
            style={{
              fontSize: '15.5px',
              color: '#cbd5e1',
              lineHeight: '1.65',
              marginBottom: '32px',
              maxWidth: '520px',
            }}
          >
            Discover a holistic approach to health with Dr. K. Tripathi Ampeh (Pat.), combining experience, compassion, and natural healing.
          </p>

          {/* CTA Button */}
          <div style={{ marginBottom: '44px' }}>
            <button
              type="button"
              onClick={() => navigate('/book-appointment')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#265e38',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '9999px',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
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
                width="16"
                height="16"
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
              Book an Appointment
            </button>
          </div>

          {/* 3 Bottom Badges (Aligned horizontally) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              flexWrap: 'wrap',
            }}
            className="hero-badges-row"
          >
            {/* Badge 1: Safe & Natural */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#72d28f',
                  fontSize: '17px',
                  flexShrink: 0,
                }}
              >
                🌱
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Safe & Natural
                </h4>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '1px 0 0' }}>
                  Gentle and holistic care
                </p>
              </div>
            </div>

            {/* Badge 2: Personalized Treatment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#72d28f',
                  fontSize: '17px',
                  flexShrink: 0,
                }}
              >
                👤
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Personalized Treatment
                </h4>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '1px 0 0' }}>
                  Tailored to your needs
                </p>
              </div>
            </div>

            {/* Badge 3: Trusted by Patients */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#72d28f',
                  fontSize: '17px',
                  flexShrink: 0,
                }}
              >
                🛡️
              </div>
              <div>
                <h4 style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                  Trusted by Patients
                </h4>
                <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: '1px 0 0' }}>
                  15K+ happy patients
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .hero-inner-container {
            padding: 50px 24px 40px !important;
          }
          .hero-title-text {
            font-size: 38px !important;
          }
        }
        @media (max-width: 640px) {
          .hero-title-text {
            font-size: 32px !important;
          }
          .hero-badges-row {
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;

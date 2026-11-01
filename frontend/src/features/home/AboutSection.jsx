import React from 'react';
import { useNavigate } from 'react-router-dom';
import aboutImg from '../../assets/about-clinic.jpg';

const AboutSection = () => {
  const navigate = useNavigate();
  return (
    <section
      id="about"
      style={{
        backgroundColor: '#ffffff',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="about-inner-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '90px 40px 90px',
        }}
      >
        <div
          className="about-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Text Content */}
          <div className="about-text-col" style={{ maxWidth: '560px' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '12.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.8px',
                color: '#265e38',
                marginBottom: '14px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              ABOUT OUR CLINIC
            </span>

            <h2
              className="about-heading"
              style={{
                fontSize: '44px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.18',
                letterSpacing: '-0.5px',
                marginBottom: '22px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              A Gentle Path to<br />
              Better Health
            </h2>

            <p
              className="about-desc"
              style={{
                fontSize: '15.5px',
                color: '#4b5563',
                lineHeight: '1.7',
                marginBottom: '30px',
                maxWidth: '545px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              At Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic, we believe in treating the person, not just the symptoms. Our approach focuses on understanding your unique health concerns and providing personalized homeopathic care for long-term well-being.
            </p>

            <button
              type="button"
              onClick={() => navigate('/about')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '700',
                color: '#265e38',
                backgroundColor: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1b4332';
                const svg = e.currentTarget.querySelector('svg');
                if (svg) svg.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#265e38';
                const svg = e.currentTarget.querySelector('svg');
                if (svg) svg.style.transform = 'translateX(0)';
              }}
            >
              Our Approach
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'transform 0.2s ease' }}
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          {/* Right Column: Clinic Image */}
          <div className="about-image-col">
            <div
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.10), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#ffffff',
                aspectRatio: '1.38 / 1',
                width: '100%',
              }}
            >
              <img
                src={aboutImg}
                alt="Dr. Kumar Tripathi Ampeh Clinic Reception & Pharmacy"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .about-inner-container {
            padding: 65px 24px 65px !important;
          }
          .about-heading {
            font-size: 38px !important;
          }
          .about-grid {
            gap: 40px !important;
          }
        }
        @media (max-width: 860px) {
          .about-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .about-text-col {
            max-width: 100% !important;
          }
        }
        @media (max-width: 640px) {
          .about-inner-container {
            padding: 50px 20px 50px !important;
          }
          .about-heading {
            font-size: 32px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default AboutSection;

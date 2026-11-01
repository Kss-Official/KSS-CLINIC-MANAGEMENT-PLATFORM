import React from 'react';
import g1 from '../../assets/gallery-1.jpg';
import g2 from '../../assets/gallery-2.jpg';
import g3 from '../../assets/gallery-3.jpg';
import g4 from '../../assets/gallery-4.jpg';

const ClinicGallerySection = () => {
  const images = [
    { src: g1, alt: 'Clinic Reception Desk & Staff' },
    { src: g2, alt: 'Dr. Kumar Tripathi Consultation Chamber' },
    { src: g3, alt: 'Comfortable & Calm Waiting Lounge' },
    { src: g4, alt: 'Natural Herbal Medicines & Mortar' },
  ];

  return (
    <section
      id="clinic"
      style={{
        backgroundColor: '#f5f8f5',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="clinic-inner-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '90px 40px 90px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header Centered */}
        <div style={{ textAlign: 'center', marginBottom: '46px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '12.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1.8px',
              color: '#265e38',
              marginBottom: '10px',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            OUR CLINIC
          </span>

          <h2
            className="clinic-heading"
            style={{
              fontSize: '38px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              marginBottom: '12px',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            A Comfortable Space for Your Care
          </h2>

          <p
            className="clinic-subheading"
            style={{
              fontSize: '15px',
              color: '#4b5563',
              lineHeight: '1.5',
              maxWidth: '900px',
              margin: '0 auto',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Our clinic is designed to provide a calm and welcoming environment for a better consultation experience.
          </p>
        </div>

        {/* 4 Photos Grid Across Width */}
        <div
          className="clinic-gallery-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            boxSizing: 'border-box',
          }}
        >
          {images.map((item, idx) => (
            <div
              key={idx}
              className="clinic-photo-card"
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 28px -4px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)';
              }}
            >
              <img
                src={item.src}
                alt={item.alt}
                style={{
                  width: '100%',
                  height: '100%',
                  aspectRatio: '1.35 / 1',
                  display: 'block',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .clinic-inner-container {
            padding: 65px 24px 65px !important;
          }
          .clinic-subheading {
            white-space: normal !important;
          }
          .clinic-gallery-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
          .clinic-heading {
            font-size: 32px !important;
          }
        }
        @media (max-width: 640px) {
          .clinic-inner-container {
            padding: 50px 20px 50px !important;
          }
          .clinic-gallery-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .clinic-heading {
            font-size: 26px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ClinicGallerySection;

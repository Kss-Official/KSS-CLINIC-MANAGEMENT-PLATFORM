import React from 'react';
import cert1 from '../../assets/cert-1.png';
import cert2 from '../../assets/cert-2.png';
import cert3 from '../../assets/cert-3.png';
import cert4 from '../../assets/cert-4.png';

const CredentialsSection = () => {
  const certs = [
    {
      img: cert1,
      title: 'Certified Homeopathy Practitioner',
    },
    {
      img: cert2,
      title: 'Homeopathy Qualification Certificate',
    },
    {
      img: cert3,
      title: 'Professional Registration',
    },
    {
      img: cert4,
      title: 'Membership Certificate',
    },
  ];

  return (
    <section
      id="credentials"
      style={{
        backgroundColor: '#f5f8f5',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="credentials-inner-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '85px 40px 95px',
        }}
      >
        {/* Header Centered */}
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '12.5px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '1.8px',
              color: '#265e38',
              marginBottom: '12px',
            }}
          >
            OUR CREDENTIALS
          </span>

          <h2
            className="credentials-heading"
            style={{
              fontSize: '40px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              marginBottom: '14px',
            }}
          >
            A Foundation of Trust
          </h2>

          <p
            className="credentials-subheading"
            style={{
              fontSize: '15.5px',
              color: '#4b5563',
              lineHeight: '1.65',
            }}
          >
            Recognized qualifications and professional memberships.
          </p>
        </div>

        {/* 4 Certificate Cards Grid Across Width */}
        <div
          className="credentials-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
        >
          {certs.map((item, idx) => (
            <div
              key={idx}
              className="cert-card-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              {/* Certificate Image without double border / outer box */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
                  marginBottom: '18px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  backgroundColor: '#ffffff',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.03)';
                }}
              >
                <img
                  src={item.img}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    objectFit: 'contain',
                  }}
                />
              </div>

              {/* Title (Single line clean fit matching Image 1) */}
              <h4
                className="cert-title-text"
                style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: '#111827',
                  lineHeight: '1.4',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {item.title}
              </h4>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .cert-title-text {
            white-space: normal !important;
            font-size: 13.5px !important;
          }
        }
        @media (max-width: 1080px) {
          .credentials-inner-container {
            padding: 65px 24px 75px !important;
          }
          .credentials-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .credentials-heading {
            font-size: 34px !important;
          }
        }
        @media (max-width: 640px) {
          .credentials-inner-container {
            padding: 50px 20px 60px !important;
          }
          .credentials-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .credentials-heading {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CredentialsSection;

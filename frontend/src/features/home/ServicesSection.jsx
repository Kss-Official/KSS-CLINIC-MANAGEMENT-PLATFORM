import React from 'react';

const ServicesSection = () => {
  const services = [
    {
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#265e38"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
      title: 'Consultation & Personalized Treatment',
      description: 'Individualized care based on your complete health profile.',
    },
    {
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#265e38"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
      title: 'Natural Remedies',
      description: 'Safe, gentle, and effective homeopathic medicines.',
    },
    {
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#265e38"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      title: 'Holistic Approach',
      description: 'Focus on physical, mental, and emotional well-being.',
    },
    {
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#265e38"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
      title: 'Long-Term Wellness',
      description: 'Support for lasting improvements in your quality of life.',
    },
  ];

  return (
    <section
      id="services"
      style={{
        backgroundColor: '#f3f7f3',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="services-inner-container"
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
              marginBottom: '14px',
            }}
          >
            OUR SERVICE
          </span>

          <h2
            className="services-heading"
            style={{
              fontSize: '40px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              marginBottom: '16px',
            }}
          >
            Homeopathy for a Healthier You
          </h2>

          <p
            className="services-subheading"
            style={{
              fontSize: '15.5px',
              color: '#4b5563',
              lineHeight: '1.65',
              maxWidth: '720px',
              margin: '0 auto',
            }}
          >
            We offer comprehensive homeopathic consultation and treatment for a wide range of health concerns,
            focusing on natural and long-lasting wellness.
          </p>
        </div>

        {/* 4 Cards Grid Across Width */}
        <div
          className="services-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
        >
          {services.map((item, idx) => (
            <div
              key={idx}
              className="service-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                borderRadius: '18px',
                padding: '32px 24px 30px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.02)',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 14px 28px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#bbf7d0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.04)';
              }}
            >
              {/* Icon Container (Mint square with rounded corners) */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '700',
                  color: '#111827',
                  lineHeight: '1.35',
                  marginTop: '4px',
                }}
              >
                {item.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#64748b',
                  lineHeight: '1.55',
                  margin: 0,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .services-inner-container {
            padding: 65px 24px 75px !important;
          }
          .services-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .services-heading {
            font-size: 34px !important;
          }
        }
        @media (max-width: 640px) {
          .services-inner-container {
            padding: 50px 20px 60px !important;
          }
          .services-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .services-heading {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default ServicesSection;

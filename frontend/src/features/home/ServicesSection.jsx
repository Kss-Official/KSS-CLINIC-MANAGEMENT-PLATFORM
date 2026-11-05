import React from 'react';

const ServicesSection = () => {
  const services = [
    {
      num: '01',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
      num: '02',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
      num: '03',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
      num: '04',
      icon: (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
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
          boxSizing: 'border-box',
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
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            OUR SERVICES
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
              fontFamily: "'Manrope', sans-serif",
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
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            We offer comprehensive homeopathic consultation and treatment for a wide range of health concerns,
            focusing on natural and long-lasting wellness.
          </p>
        </div>

        {/* 4 Cards Grid Across Width - strictly identical card sizes */}
        <div
          className="services-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
            alignItems: 'stretch',
          }}
        >
          {services.map((item) => (
            <div
              key={item.num}
              className="service-card"
              style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                background: 'linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%)',
                border: '1.5px solid #e2ece5',
                borderRadius: '22px',
                padding: '32px 24px 28px',
                boxShadow: '0 4px 18px -4px rgba(26, 60, 36, 0.04)',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: 'default',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                height: '100%',
                minHeight: '250px',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 16px 32px -8px rgba(28, 68, 40, 0.12), 0 0 0 1px #86efac';
                e.currentTarget.style.borderColor = '#86efac';

                // Icon elevation & mint background
                const iconWrap = e.currentTarget.querySelector('.service-icon-wrap');
                if (iconWrap) {
                  iconWrap.style.transform = 'translateY(-3px)';
                  iconWrap.style.backgroundColor = '#dcfce7';
                  iconWrap.style.borderColor = '#86efac';
                  iconWrap.style.boxShadow = '0 6px 14px rgba(22, 101, 52, 0.12)';
                  iconWrap.style.color = '#15803d';
                }

                // Number badge invert
                const badge = e.currentTarget.querySelector('.service-num-badge');
                if (badge) {
                  badge.style.backgroundColor = '#204a32';
                  badge.style.color = '#ffffff';
                  badge.style.borderColor = '#204a32';
                }

                // Title color highlight
                const titleEl = e.currentTarget.querySelector('.service-card-title');
                if (titleEl) {
                  titleEl.style.color = '#1a4a2a';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 18px -4px rgba(26, 60, 36, 0.04)';
                e.currentTarget.style.borderColor = '#e2ece5';

                // Icon restore
                const iconWrap = e.currentTarget.querySelector('.service-icon-wrap');
                if (iconWrap) {
                  iconWrap.style.transform = 'translateY(0)';
                  iconWrap.style.backgroundColor = '#ecfdf5';
                  iconWrap.style.borderColor = '#d1fae5';
                  iconWrap.style.boxShadow = '0 2px 8px rgba(22, 101, 52, 0.05)';
                  iconWrap.style.color = '#1c4428';
                }

                // Number badge restore
                const badge = e.currentTarget.querySelector('.service-num-badge');
                if (badge) {
                  badge.style.backgroundColor = '#eef8f2';
                  badge.style.color = '#204a32';
                  badge.style.borderColor = '#d4ebd9';
                }

                // Title restore
                const titleEl = e.currentTarget.querySelector('.service-card-title');
                if (titleEl) {
                  titleEl.style.color = '#111827';
                }
              }}
            >
              {/* Top Row: Icon Container on Left, Number Badge on Right */}
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                {/* Icon Container (Mint rounded square matching 'What Drives Us') */}
                <div
                  className="service-icon-wrap"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #d1fae5',
                    color: '#1c4428',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(22, 101, 52, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {item.icon}
                </div>

                {/* Number Badge (01, 02, 03, 04 matching 'What Drives Us') */}
                <div
                  className="service-num-badge"
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    letterSpacing: '0.8px',
                    color: '#204a32',
                    backgroundColor: '#eef8f2',
                    border: '1px solid #d4ebd9',
                    padding: '3px 9px',
                    borderRadius: '999px',
                    transition: 'all 0.25s ease',
                    fontFamily: "'Manrope', sans-serif",
                    lineHeight: '1',
                  }}
                >
                  {item.num}
                </div>
              </div>

              {/* Title with standardized height so all descriptions align horizontally */}
              <div
                style={{
                  minHeight: '48px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}
              >
                <h3
                  className="service-card-title"
                  style={{
                    fontSize: '16.5px',
                    fontWeight: '700',
                    color: '#111827',
                    lineHeight: '1.35',
                    margin: 0,
                    fontFamily: "'Manrope', sans-serif",
                    transition: 'color 0.25s ease',
                  }}
                >
                  {item.title}
                </h3>
              </div>

              {/* Description (fills remaining space with exact alignment) */}
              <p
                style={{
                  fontSize: '13.8px',
                  color: '#4b5563',
                  lineHeight: '1.6',
                  margin: 0,
                  fontFamily: "'Manrope', sans-serif",
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'flex-start',
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

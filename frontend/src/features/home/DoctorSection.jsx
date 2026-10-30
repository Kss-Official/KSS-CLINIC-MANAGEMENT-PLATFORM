import React from 'react';
import { useNavigate } from 'react-router-dom';
import doctorMortarImg from '../../assets/doctor-mortar.jpg';

const DoctorSection = ({ onOpenBooking }) => {
  const navigate = useNavigate();

  const handleBookClick = () => {
    if (onOpenBooking && typeof onOpenBooking === 'function') {
      onOpenBooking();
    } else {
      navigate('/book-appointment');
    }
  };

  return (
    <section
      id="doctor"
      style={{
        backgroundColor: '#ffffff',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="doctor-inner-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '85px 40px 95px',
        }}
      >
        <div
          className="doctor-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '430px minmax(0, 1fr)',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Mortar & Pestle Photo */}
          <div className="doctor-photo-col" style={{ width: '100%' }}>
            <div
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 12px 35px -8px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#f3f4f6',
                aspectRatio: '1.02 / 1',
              }}
            >
              <img
                src={doctorMortarImg}
                alt="Dr. Kumar Tripathi preparing natural homeopathic remedies"
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

          {/* Right Column: Doctor Info */}
          <div className="doctor-info-col" style={{ maxWidth: '640px' }}>
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
              MEET OUR DOCTOR
            </span>

            <h2
              className="doctor-title"
              style={{
                fontSize: '40px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.2',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
              }}
            >
              Dr. Kumar Tripathi Ampeh (Pat.)
            </h2>

            <p
              style={{
                fontSize: '15.5px',
                fontWeight: '600',
                color: '#265e38',
                marginBottom: '20px',
              }}
            >
              Homeopathy Practitioner
            </p>

            <p
              className="doctor-desc"
              style={{
                fontSize: '15px',
                color: '#4b5563',
                lineHeight: '1.68',
                marginBottom: '32px',
                maxWidth: '600px',
              }}
            >
              With years of experience in homeopathic care, Dr. K. Tripathi Ampeh (Pat.) is dedicated to providing compassionate and personalized treatment. His approach focuses on understanding the root cause of health concerns and supporting each patient's overall well-being.
            </p>

            {/* 3 Points: Row 1 (Points 1 & 2 side by side) and Row 2 (Point 3) */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '36px',
              }}
            >
              {/* Row 1: Points 1 and 2 side by side */}
              <div
                className="doctor-points-row1"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '32px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Point 1: Qualified & Experienced Practitioner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#e8f5ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#265e38',
                      flexShrink: 0,
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
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#111827' }}>
                    Qualified & Experienced Practitioner
                  </span>
                </div>

                {/* Point 2: Trusted by 15K+ Patients */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#e8f5ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#265e38',
                      flexShrink: 0,
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
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#111827' }}>
                    Trusted by 15K+ Patients
                  </span>
                </div>
              </div>

              {/* Row 2: Point 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#e8f5ec',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#265e38',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </div>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#111827' }}>
                  Commitment to Natural Healing
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleBookClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#265e38',
                color: '#ffffff',
                padding: '12px 26px',
                borderRadius: '9999px',
                fontSize: '14.5px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'none',
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
              Book an Appointment
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1081px) {
          .doctor-title {
            white-space: nowrap !important;
          }
        }
        @media (max-width: 1080px) {
          .doctor-inner-container {
            padding: 65px 24px 75px !important;
          }
          .doctor-grid {
            grid-template-columns: 360px minmax(0, 1fr) !important;
            gap: 40px !important;
          }
          .doctor-title {
            font-size: 34px !important;
          }
        }
        @media (max-width: 860px) {
          .doctor-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .doctor-photo-col {
            max-width: 380px !important;
            margin: 0 auto !important;
          }
        }
        @media (max-width: 640px) {
          .doctor-inner-container {
            padding: 50px 20px 60px !important;
          }
          .doctor-title {
            font-size: 28px !important;
          }
          .doctor-points-row1 {
            gap: 16px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default DoctorSection;

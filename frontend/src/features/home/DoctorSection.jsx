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
          padding: '90px 40px 90px',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="doctor-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 500px) minmax(0, 1fr)',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Mortar & Pestle Photo Card */}
          <div className="doctor-photo-col" style={{ width: '100%' }}>
            <div
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 14px 36px -6px rgba(0, 0, 0, 0.10), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
                backgroundColor: '#ffffff',
                aspectRatio: '1 / 1',
                width: '100%',
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
                  objectPosition: 'center',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            </div>
          </div>

          {/* Right Column: Doctor Info */}
          <div className="doctor-info-col" style={{ width: '100%' }}>
            <span
              style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.6px',
                color: '#265e38',
                marginBottom: '12px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              MEET OUR DOCTOR
            </span>

            <h2
              className="doctor-title"
              style={{
                fontSize: '38px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.18',
                letterSpacing: '-0.5px',
                marginBottom: '8px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Dr. Kumar Tripathi Ampeh (Pat.)
            </h2>

            <p
              style={{
                fontSize: '14.5px',
                fontWeight: '600',
                color: '#265e38',
                marginBottom: '20px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Homeopathy Practitioner
            </p>

            <p
              className="doctor-desc"
              style={{
                fontSize: '14.5px',
                color: '#4b5563',
                lineHeight: '1.65',
                marginBottom: '30px',
                width: '100%',
                fontFamily: "'Manrope', sans-serif",
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
                marginBottom: '34px',
              }}
            >
              {/* Row 1: Points 1 and 2 side by side */}
              <div
                className="doctor-points-row1"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '36px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Point 1: Qualified & Experienced Practitioner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f0',
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
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Qualified & Experienced Practitioner
                  </span>
                </div>

                {/* Point 2: Trusted by 15K+ Patients */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f0',
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
                      <circle cx="12" cy="12" r="10" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#111827',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Trusted by 15K+ Patients
                  </span>
                </div>
              </div>

              {/* Row 2: Point 3 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: '#edf7f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#265e38',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#111827',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
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
                fontFamily: "'Manrope', sans-serif",
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
            padding: 80px 32px 80px !important;
          }
          .doctor-grid {
            grid-template-columns: 370px minmax(0, 1fr) !important;
            gap: 48px !important;
          }
          .doctor-title {
            font-size: 34px !important;
            white-space: nowrap !important;
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
          .doctor-title {
            white-space: normal !important;
          }
        }
        @media (max-width: 640px) {
          .doctor-inner-container {
            padding: 50px 20px 50px !important;
          }
          .doctor-title {
            font-size: 26px !important;
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

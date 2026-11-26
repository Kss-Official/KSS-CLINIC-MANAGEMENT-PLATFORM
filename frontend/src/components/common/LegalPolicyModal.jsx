import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * Dedicated Card Modal for Privacy Policy & Terms & Conditions.
 * Displays full official policy content in a responsive, scrollable card
 * without navigating away to separate pages.
 */
const LegalPolicyModal = ({ isOpen, onClose, initialType = 'privacy' }) => {
  const [activeTab, setActiveTab] = useState(initialType);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType]);

  // Reset card scroll to top when opening or switching tabs
  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen, activeTab]);

  // Lock background page scroll (both html and body) while modal is active & support ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="legal-modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 25, 18, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        overscrollBehavior: 'none',
        animation: 'legalFadeIn 0.2s ease-out',
      }}
    >
      {/* Central Modal Card */}
      <div
        className="legal-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '840px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 0, 0, 0.1)',
          border: '1.5px solid #dcece1',
          overflow: 'hidden',
          animation: 'legalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* =========================================================
            1. FIXED MODAL HEADER
            ========================================================= */}
        <div
          style={{
            padding: '24px 28px 18px',
            backgroundColor: '#ffffff',
            borderBottom: '1.5px solid #eef3f0',
            flexShrink: 0,
          }}
        >
          {/* Top Row: Badge, Last Updated & Close Button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#edf7f1',
                  border: '1px solid #c2e2ce',
                  color: '#166534',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <span>{activeTab === 'privacy' ? 'Patient Data Protection' : 'Legal Terms'}</span>
              </span>
              <span
                style={{
                  fontSize: '11.5px',
                  color: '#64748b',
                  fontWeight: '600',
                  backgroundColor: '#f8fafc',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Updated 2026
              </span>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                lineHeight: 1,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fee2e2';
                e.currentTarget.style.borderColor = '#fca5a5';
                e.currentTarget.style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
              }}
            >
              ✕
            </button>
          </div>

          {/* Heading Title & Subtitle */}
          <h2
            style={{
              margin: '0 0 6px 0',
              fontSize: '24px',
              fontWeight: '800',
              color: '#111827',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '-0.3px',
            }}
          >
            {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
          </h2>
          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '13.5px',
              color: '#64748b',
              lineHeight: '1.5',
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            {activeTab === 'privacy'
              ? 'Dr. Kalpana Tripathi Ampeh (Pat.) Homeopathy Clinic — Patient privacy, confidential data collection, and governance guidelines.'
              : 'Dr. Kalpana Tripathi Ampeh (Pat.) Homeopathy Clinic — Rules, responsibilities, consultation policies, and healthcare guidelines.'}
          </p>

          {/* Internal Tab Switcher */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#f1f5f3',
              borderRadius: '12px',
              padding: '4px',
              gap: '4px',
              border: '1px solid #e1ebe4',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('privacy')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'privacy' ? '#166534' : 'transparent',
                color: activeTab === 'privacy' ? '#ffffff' : '#4b5563',
                fontSize: '13px',
                fontWeight: activeTab === 'privacy' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Manrope', sans-serif",
                boxShadow: activeTab === 'privacy' ? '0 2px 6px rgba(22, 101, 52, 0.25)' : 'none',
              }}
            >
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terms')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'terms' ? '#166534' : 'transparent',
                color: activeTab === 'terms' ? '#ffffff' : '#4b5563',
                fontSize: '13px',
                fontWeight: activeTab === 'terms' ? '700' : '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Manrope', sans-serif",
                boxShadow: activeTab === 'terms' ? '0 2px 6px rgba(22, 101, 52, 0.25)' : 'none',
              }}
            >
              <span>Terms & Conditions</span>
            </button>
          </div>
        </div>

        {/* =========================================================
            2. SCROLLABLE INTERNAL CONTENT CONTAINER
            ========================================================= */}
        <div
          ref={scrollContainerRef}
          className="legal-modal-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '24px 28px 28px',
            backgroundColor: '#fafcfa',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {activeTab === 'privacy' ? (
            /* =========================================================
               COMPLETE PRIVACY POLICY SECTIONS
               ========================================================= */
            <>
              {/* Section 1: Governance */}
              <div
                style={{
                  backgroundColor: '#f6fbf8',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  border: '1.5px solid #c8e3d2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#166534',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800', color: '#166534', fontFamily: "'Manrope', sans-serif" }}>
                    Governance &amp; Regulatory Compliance
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Data Protection Compliance:</strong> The clinic will handle patient information according to applicable Indian data protection laws and regulations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Patient Consent Management:</strong> Appropriate patient consent will be obtained before processing personal information wherever required.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Data Access Control:</strong> Only authorized doctors and clinic staff will be allowed to access patient information according to their assigned roles.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Data Retention &amp; Deletion:</strong> Patient records will be stored for the required period and deleted securely when permitted under applicable laws.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Data Breach Management:</strong> The clinic will follow appropriate procedures to identify, investigate, and respond to data breaches and provide required notifications.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Personal Information Collection
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  The clinic collects personal information such as the patient's full name, mobile number, email address, age, gender, and residential address. This information is collected during patient registration and appointment booking. The collected information is used to provide and manage clinic services.
                </p>
              </div>

              {/* Section 3 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Medical Information Privacy
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  The clinic may collect medical information, including medical history, symptoms, allergies, prescriptions, and medical reports. This information is used by authorized doctors and healthcare staff for consultation and treatment purposes. Patient medical records will be kept confidential and protected from unauthorized access.
                </p>
              </div>

              {/* Section 4 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    4
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Data Usage &amp; Sharing
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Patient information is used for appointment management, doctor consultations, prescription preparation, payment processing, and patient communication. Information may be shared with authorized clinic staff and necessary third-party service providers. Patient information will not be shared for unrelated purposes without an appropriate legal basis or consent.
                </p>
              </div>

              {/* Section 5 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    5
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Data Security &amp; Protection
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  The clinic implements appropriate security measures to protect patient information from unauthorized access, misuse, loss, or disclosure. Access to patient records is restricted to authorized users based on their roles and responsibilities. Secure storage, authentication, and regular backups help maintain data protection.
                </p>
              </div>

              {/* Section 6 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    6
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Patient Data Rights
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Patients have the right to request access to their personal information and correct inaccurate details. They may also request data deletion or withdraw their consent, subject to applicable legal requirements. Patients can contact the clinic to raise privacy-related concerns or complaints.
                </p>
              </div>
            </>
          ) : (
            /* =========================================================
               COMPLETE TERMS & CONDITIONS SECTIONS
               ========================================================= */
            <>
              {/* Section 1: Governance */}
              <div
                style={{
                  backgroundColor: '#f6fbf8',
                  borderRadius: '16px',
                  padding: '22px 24px',
                  border: '1.5px solid #c8e3d2',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#166534',
                      color: '#ffffff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: '800', color: '#166534', fontFamily: "'Manrope', sans-serif" }}>
                    Governance &amp; Legal Standards
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Governing Law:</strong> The clinic and its services will operate according to applicable Indian laws and regulations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Medical Compliance:</strong> Doctors must follow applicable professional standards, ethical guidelines, and medical regulations.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Patient Rights &amp; Responsibilities:</strong> The clinic will respect patient rights and clearly communicate patient responsibilities.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Dispute Resolution:</strong> Patient complaints and disputes will be handled through the clinic's defined grievance resolution process.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ color: '#166534', fontWeight: '700', marginTop: '2px' }}>•</span>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', lineHeight: '1.6', fontFamily: "'Manrope', sans-serif" }}>
                      <strong>Policy Updates:</strong> The clinic reserves the right to update its Terms &amp; Conditions and communicate important changes to patients.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Appointment Booking &amp; Cancellation
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Patients can book appointments with available doctors by selecting their preferred date and time. Appointments are subject to slot availability and confirmation by the clinic. Patients must follow the clinic's cancellation and rescheduling rules.
                </p>
              </div>

              {/* Section 3 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    3
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Consultation &amp; Treatment Policy
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Doctors will review the patient's medical history, symptoms, and health conditions before providing consultation. Treatment and prescriptions will be provided according to the doctor's professional judgment. Follow-up consultations will be subject to the clinic's policies.
                </p>
              </div>

              {/* Section 4 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    4
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Patient Rights &amp; Responsibilities
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Patients have the right to access their medical records, prescriptions, and consultation details. They must provide accurate personal information, medical history, and allergy details. Patients should follow clinic guidelines and communicate any changes in their health condition to the doctor.
                </p>
              </div>

              {/* Section 5 */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '20px 22px',
                  border: '1.5px solid #edf2ed',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      backgroundColor: '#edf7f1',
                      color: '#166534',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '800',
                      flexShrink: 0,
                    }}
                  >
                    5
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                    Medical Disclaimer
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#4b5563', lineHeight: '1.65', fontFamily: "'Manrope', sans-serif" }}>
                  Information available on the clinic's website is for general healthcare purposes and does not replace professional medical consultation. Treatment outcomes may vary depending on individual health conditions. Patients should consult qualified medical professionals and seek appropriate emergency care when necessary.
                </p>
              </div>
            </>
          )}
        </div>

        {/* =========================================================
            3. FIXED MODAL FOOTER
            ========================================================= */}
        <div
          style={{
            padding: '16px 28px',
            backgroundColor: '#ffffff',
            borderTop: '1.5px solid #eef3f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12.5px', color: '#64748b', fontFamily: "'Manrope', sans-serif" }}>
              Have questions? Email us at{' '}
              <a
                href="mailto:Drkalpanatripathi38@gmail.com"
                style={{ color: '#166534', fontWeight: '700', textDecoration: 'none' }}
              >
                Drkalpanatripathi38@gmail.com
              </a>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 24px',
              backgroundColor: '#166534',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '13.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              fontFamily: "'Manrope', sans-serif",
              boxShadow: '0 2px 8px rgba(22, 101, 52, 0.25)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#14532d')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#166534')}
          >
            I Understand &amp; Close
          </button>
        </div>
      </div>

      {/* Internal Scrollbar Styling & Animations */}
      <style>{`
        @keyframes legalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes legalSlideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .legal-modal-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .legal-modal-scroll::-webkit-scrollbar-track {
          background: #f1f5f3;
          border-radius: 8px;
        }
        .legal-modal-scroll::-webkit-scrollbar-thumb {
          background: #a7cfb5;
          border-radius: 8px;
        }
        .legal-modal-scroll::-webkit-scrollbar-thumb:hover {
          background: #166534;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default LegalPolicyModal;

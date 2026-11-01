import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AppointmentModal from '../../components/AppointmentModal';
import CtaBannerSection from '../home/CtaBannerSection';

// Hero background image for Contact page
import contactHeroBg from '../../assets/contact-hero-bg.jpg';

const ContactPage = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    purpose: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleInputChange = (field, value) => {
    if (field === 'fullName') {
      // Rule 1: Only alphabetic characters and spaces allowed, max 35 chars
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 35);
      if (/[^a-zA-Z\s]/.test(value)) {
        setFormErrors((prev) => ({
          ...prev,
          fullName: 'Only alphabets and spaces are allowed',
        }));
      } else if (formErrors.fullName) {
        setFormErrors((prev) => ({ ...prev, fullName: '' }));
      }
      setFormData((prev) => ({ ...prev, fullName: cleaned }));
      return;
    }

    if (field === 'phone') {
      // Rule 2: Limit 10 digits, must start with 6, 7, 8, or 9
      let digits = value.replace(/\D/g, '');

      // In case full number with 91 is entered or pasted
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }

      if (/\D/.test(value)) {
        setFormErrors((prev) => ({
          ...prev,
          phone: 'Only numbers are allowed',
        }));
      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {
        setFormErrors((prev) => ({
          ...prev,
          phone: 'Phone number must start with 6, 7, 8, or 9',
        }));
        return;
      } else if (formErrors.phone) {
        setFormErrors((prev) => ({ ...prev, phone: '' }));
      }

      digits = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
      return;
    }

    if (field === 'email') {
      // Rule 3: Valid email format, no words or characters allowed after .com
      let val = value.replace(/\s/g, '');
      const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);
      if (comMatch) {
        val = comMatch[1];
        setFormErrors((prev) => ({
          ...prev,
          email: 'No words or characters allowed after .com',
        }));
      } else if (formErrors.email) {
        setFormErrors((prev) => ({ ...prev, email: '' }));
      }
      setFormData((prev) => ({ ...prev, email: val }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'fullName') {
      const val = (formData.fullName || '').trim();
      if (!val) {
        setFormErrors((prev) => ({ ...prev, fullName: 'Full Name is required' }));
      } else if (!/^[a-zA-Z\s]+$/.test(val)) {
        setFormErrors((prev) => ({ ...prev, fullName: 'Only alphabets and spaces are allowed' }));
      } else {
        setFormErrors((prev) => ({ ...prev, fullName: '' }));
      }
    } else if (field === 'phone') {
      const val = (formData.phone || '').replace(/\D/g, '');
      if (!val) {
        setFormErrors((prev) => ({ ...prev, phone: 'Phone number is required' }));
      } else if (val.length !== 10) {
        setFormErrors((prev) => ({ ...prev, phone: 'Phone number must be exactly 10 digits' }));
      } else if (!/^[6-9]/.test(val)) {
        setFormErrors((prev) => ({ ...prev, phone: 'Phone number must start with 6, 7, 8, or 9' }));
      } else {
        setFormErrors((prev) => ({ ...prev, phone: '' }));
      }
    } else if (field === 'email') {
      const val = (formData.email || '').trim();
      if (val) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(val)) {
          setFormErrors((prev) => ({ ...prev, email: 'Please enter a valid email address (e.g. name@example.com)' }));
        } else if (/@.*\.com.+/i.test(val)) {
          setFormErrors((prev) => ({ ...prev, email: 'No words or characters allowed after .com' }));
        } else {
          setFormErrors((prev) => ({ ...prev, email: '' }));
        }
      } else {
        setFormErrors((prev) => ({ ...prev, email: '' }));
      }
    } else if (field === 'message') {
      const val = (formData.message || '').trim();
      if (!val) {
        setFormErrors((prev) => ({ ...prev, message: 'Please enter your message' }));
      } else {
        setFormErrors((prev) => ({ ...prev, message: '' }));
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Full Name Validation: letters and spaces only, 1-35 chars
    const nameTrimmed = (formData.fullName || '').trim();
    if (!nameTrimmed) {
      errors.fullName = 'Full Name is required';
    } else if (nameTrimmed.length > 35) {
      errors.fullName = 'Full Name cannot exceed 35 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      errors.fullName = 'Only alphabets and spaces are allowed';
    }

    // 2. Phone Number Validation: exactly 10 digits, starts with 6, 7, 8, or 9
    const phoneDigits = (formData.phone || '').replace(/\D/g, '');
    if (!phoneDigits) {
      errors.phone = 'Phone number is required';
    } else if (phoneDigits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(phoneDigits)) {
      errors.phone = 'Phone number must start with 6, 7, 8, or 9';
    }

    // 3. Email Validation: if provided, must be valid format and no chars after .com
    const emailVal = (formData.email || '').trim();
    if (emailVal) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(emailVal)) {
        errors.email = 'Please enter a valid email address (e.g. name@example.com)';
      } else if (/@.*\.com.+/i.test(emailVal)) {
        errors.email = 'No words or characters allowed after .com';
      }
    }

    // 4. Message Validation: required
    const msgTrimmed = (formData.message || '').trim();
    if (!msgTrimmed) {
      errors.message = 'Please enter your message';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSuccess(true);
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        purpose: '',
        message: '',
      });
      setTimeout(() => setFormSuccess(false), 6000);
    }, 700);
  };

  const handleOpenGoogleMaps = () => {
    window.open(
      'https://maps.google.com/?q=12+Green+Park+MG+Road+Bangalore+560001',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="contact-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      <main>
        {/* =========================================================
            1. HERO SECTION: Get In Touch - We're Here to Help You
               (Exact unified background matching user reference)
            ========================================================= */}
        <section
          className="contact-hero-section"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '520px',
            backgroundColor: '#ffffff',
            backgroundImage: `url(${contactHeroBg})`,
            backgroundPosition: 'right 65%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            overflow: 'hidden',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Smooth Linear Gradient Overlay:
              Clean solid white behind text on the left, then smooth soft feathering
              into the photo of clinic desk, plant, and wooden CONTACT US sign on the right */}
                              <div
            className="contact-hero-gradient-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background:
                'linear-gradient(90deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 28%, rgba(255, 255, 255, 0.65) 46%, rgba(255, 255, 255, 0.15) 64%, rgba(255, 255, 255, 0) 78%)',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />

          <div
            className="contact-inner-container contact-hero-container"
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '85px 40px',
              boxSizing: 'border-box',
            }}
          >
            {/* Left Column: Pre-heading, Title & Intro (Exact text from design) */}
            <div style={{ maxWidth: '600px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1.8px',
                  color: '#265e38',
                  marginBottom: '16px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                GET IN TOUCH
              </span>
              <h1
                className="contact-hero-title"
                style={{
                  fontSize: '46px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.18',
                  letterSpacing: '-0.5px',
                  marginBottom: '20px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                We're Here to Help You
              </h1>
              <p
                className="contact-hero-desc"
                style={{
                  fontSize: '15.5px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  maxWidth: '560px',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Have a question, need guidance, or want to book an appointment? Reach out to us — we're happy to assist you on your health and wellness journey.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. DIV 2: CONTACT INFORMATION & WRITE TO US
               (Exact layout, 2-column cards, items & form matching reference)
            ========================================================= */}
        <section
          className="contact-main-section"
          style={{
            backgroundColor: '#f8faf8',
            padding: '85px 0 95px',
            borderBottom: '1px solid #eef2ef',
          }}
        >
          <div
            className="contact-inner-container"
            style={{
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="contact-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(360px, 460px) minmax(0, 1fr)',
                gap: '32px',
                alignItems: 'start',
              }}
            >
              {/* LEFT CARD: Contact Information */}
              <div
                className="contact-info-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  border: '1px solid #eef2ef',
                  padding: '36px 32px 30px',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div>
                  {/* Badge: Direct Reachout */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#eaf6ee',
                      border: '1px solid #c7ebd2',
                      borderRadius: '9999px',
                      padding: '5px 14px',
                      marginBottom: '18px',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#166534',
                        letterSpacing: '0.4px',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Direct Reachout
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '26px',
                      fontWeight: '800',
                      color: '#111827',
                      lineHeight: '1.2',
                      margin: '0 0 8px 0',
                      fontFamily: "'Manrope', sans-serif",
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Contact Information
                  </h2>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      margin: '0 0 20px 0',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    We are here to support your holistic healing and wellness journey.
                  </p>

                  {/* 4 Detail Items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Item 1: Clinic Address */}
                    <div
                      style={{
                        backgroundColor: '#f9fbf9',
                        borderRadius: '16px',
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        border: '1px solid #f1f5f2',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#e8f5ec',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#166534',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                            Clinic Address
                          </span>
                          <span
                            style={{
                              backgroundColor: '#eaf6ee',
                              color: '#166534',
                              borderRadius: '9999px',
                              padding: '2.5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            Central Location
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: '1.5', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                          12, Green Park, MG Road,<br />Bangalore - 560001
                        </p>
                      </div>
                    </div>

                    {/* Item 2: Phone */}
                    <div
                      style={{
                        backgroundColor: '#f9fbf9',
                        borderRadius: '16px',
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        border: '1px solid #f1f5f2',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#e8f5ec',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#166534',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                            Phone
                          </span>
                          <span
                            style={{
                              backgroundColor: '#eaf6ee',
                              color: '#166534',
                              borderRadius: '9999px',
                              padding: '2.5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            Call Directly
                          </span>
                        </div>
                        <a href="tel:+919876543210" style={{ fontSize: '13.5px', color: '#166534', fontWeight: '600', textDecoration: 'none', fontFamily: "'Manrope', sans-serif" }}>
                          +91 98765 43210
                        </a>
                      </div>
                    </div>

                    {/* Item 3: Email */}
                    <div
                      style={{
                        backgroundColor: '#f9fbf9',
                        borderRadius: '16px',
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        border: '1px solid #f1f5f2',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#e8f5ec',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#166534',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                            Email
                          </span>
                          <span
                            style={{
                              backgroundColor: '#eaf6ee',
                              color: '#166534',
                              borderRadius: '9999px',
                              padding: '2.5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            Mail Us
                          </span>
                        </div>
                        <a href="mailto:clinic.tripathi@gmail.com" style={{ fontSize: '13.5px', color: '#166534', fontWeight: '600', textDecoration: 'none', fontFamily: "'Manrope', sans-serif" }}>
                          clinic.tripathi@gmail.com
                        </a>
                      </div>
                    </div>

                    {/* Item 4: Clinic Timings */}
                    <div
                      style={{
                        backgroundColor: '#f9fbf9',
                        borderRadius: '16px',
                        padding: '13px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        border: '1px solid #f1f5f2',
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          backgroundColor: '#e8f5ec',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#166534',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                            Clinic Timings
                          </span>
                          <span
                            style={{
                              backgroundColor: '#eaf6ee',
                              color: '#166534',
                              borderRadius: '9999px',
                              padding: '2.5px 10px',
                              fontSize: '11px',
                              fontWeight: '700',
                              letterSpacing: '0.3px',
                              fontFamily: "'Manrope', sans-serif",
                            }}
                          >
                            Mon - Sat
                          </span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#4b5563', lineHeight: '1.5', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                          Mon – Sat: 9:00 AM – 6:00 PM<br />Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Callout: Prompt Response */}
                <div
                  style={{
                    backgroundColor: '#eaf7ef',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    border: '1px solid #d2eed9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </div>
                  <p style={{ fontSize: '13px', color: '#166534', lineHeight: '1.5', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                    <strong>Prompt Response:</strong> We typically respond to patient inquiries within 2–4 business hours.
                  </p>
                </div>
              </div>

              {/* RIGHT CARD: Write to Us */}
              <div
                className="contact-form-card"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '24px',
                  border: '1px solid #eef2ef',
                  padding: '36px 36px 30px',
                  boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                  {/* Badge: GET IN TOUCH */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#eaf6ee',
                      border: '1px solid #c7ebd2',
                      borderRadius: '9999px',
                      padding: '5px 14px',
                      marginBottom: '18px',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#166534',
                        letterSpacing: '0.4px',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      GET IN TOUCH
                    </span>
                  </div>

                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#111827',
                      lineHeight: '1.2',
                      margin: '0 0 8px 0',
                      fontFamily: "'Manrope', sans-serif",
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Write to Us
                  </h2>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      margin: '0 0 28px 0',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Have a query, request for consultation, or need more information? Send us a message and our team will get back to you shortly.
                  </p>

                  {/* Form */}
                  <form onSubmit={handleFormSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Row 1: Full Name & Phone Number */}
                    <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          onFocus={() => setFocusedField('fullName')}
                          onBlur={() => handleBlur('fullName')}
                          maxLength={35}
                          placeholder="e.g. Rahul Sharma"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: formErrors.fullName ? '1.5px solid #ef4444' : focusedField === 'fullName' ? '1.5px solid #265e38' : '1.5px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#111827',
                            backgroundColor: '#ffffff',
                            fontFamily: "'Manrope', sans-serif",
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                        />
                        {formErrors.fullName && (
                          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>{formErrors.fullName}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', fontFamily: "'Manrope', sans-serif" }}>
                            Phone Number *
                          </label>
                          <span style={{ fontSize: '11px', fontWeight: '600', color: (formData.phone || '').length === 10 ? '#16a34a' : '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>
                            {(formData.phone || '').length}/10 digits
                          </span>
                        </div>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => handleBlur('phone')}
                          maxLength={10}
                          placeholder="e.g. 98765 43210"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: formErrors.phone ? '1.5px solid #ef4444' : focusedField === 'phone' ? '1.5px solid #265e38' : '1.5px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#111827',
                            backgroundColor: '#ffffff',
                            fontFamily: "'Manrope', sans-serif",
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            letterSpacing: '0.3px',
                          }}
                        />
                        {formErrors.phone && (
                          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>{formErrors.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Email Address & Purpose of Contact */}
                    <div className="contact-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => handleBlur('email')}
                          placeholder="name@example.com"
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: formErrors.email ? '1.5px solid #ef4444' : focusedField === 'email' ? '1.5px solid #265e38' : '1.5px solid #e5e7eb',
                            fontSize: '14px',
                            color: '#111827',
                            backgroundColor: '#ffffff',
                            fontFamily: "'Manrope', sans-serif",
                            outline: 'none',
                            transition: 'border-color 0.2s',
                          }}
                        />
                        {formErrors.email && (
                          <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>{formErrors.email}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                          Purpose of Contact
                        </label>
                        <select
                          value={formData.purpose}
                          onChange={(e) => handleInputChange('purpose', e.target.value)}
                          onFocus={() => setFocusedField('purpose')}
                          onBlur={() => setFocusedField(null)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: focusedField === 'purpose' ? '1.5px solid #265e38' : '1.5px solid #e5e7eb',
                            fontSize: '14px',
                            color: formData.purpose ? '#111827' : '#9ca3af',
                            backgroundColor: '#ffffff',
                            fontFamily: "'Manrope', sans-serif",
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">Select Inquiry Type</option>
                          <option value="General Consultation">General Consultation</option>
                          <option value="Pediatric Care">Pediatric Care</option>
                          <option value="Women's Health">Women's Health</option>
                          <option value="Chronic Condition">Chronic Condition</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Row 3: Your Message */}
                    <div>
                      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: "'Manrope', sans-serif" }}>
                        Your Message *
                      </label>
                      <textarea
                        rows="4"
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => handleBlur('message')}
                        placeholder="Please briefly describe your symptoms or inquiry..."
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          border: formErrors.message ? '1.5px solid #ef4444' : focusedField === 'message' ? '1.5px solid #265e38' : '1.5px solid #e5e7eb',
                          fontSize: '14px',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          fontFamily: "'Manrope', sans-serif",
                          outline: 'none',
                          transition: 'border-color 0.2s',
                          resize: 'vertical',
                          minHeight: '120px',
                        }}
                      />
                      {formErrors.message && (
                        <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          <span>{formErrors.message}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        backgroundColor: '#1b4d2e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '15px 24px',
                        fontSize: '15px',
                        fontWeight: '700',
                        fontFamily: "'Manrope', sans-serif",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(27, 77, 46, 0.2)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) e.currentTarget.style.backgroundColor = '#153f25';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) e.currentTarget.style.backgroundColor = '#1b4d2e';
                      }}
                    >
                      {isSubmitting ? (
                        <span>Sending message...</span>
                      ) : (
                        <>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                          <span>Send Message</span>
                        </>
                      )}
                    </button>

                    {/* Privacy Note directly below Send Message button */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '7px',
                        marginTop: '14px',
                        fontSize: '12.5px',
                        color: '#6b7280',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <span>Your medical inquiries and personal information are strictly confidential.</span>
                    </div>

                    {formSuccess && (
                      <div
                        style={{
                          backgroundColor: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          marginTop: '14px',
                          color: '#065f46',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          textAlign: 'center',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        Thank you! Your message has been sent successfully. We will get back to you shortly.
                      </div>
                    )}
                  </form>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. DIV 3: VISIT OUR CLINIC & INTERACTIVE LOCATION MAP
               (Exact layout, custom stylized map & clinic info matching reference)
            ========================================================= */}
        <section
          className="contact-visit-section"
          style={{
            backgroundColor: '#ffffff',
            padding: '90px 0 105px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            className="contact-inner-container"
            style={{
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="visit-columns-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)',
                gap: '48px',
                alignItems: 'center',
              }}
            >
              {/* LEFT COLUMN: Custom Stylized Map */}
              <div
                className="clinic-map-container"
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '490px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  backgroundColor: '#eaf2ec',
                  border: '1.5px solid #d8e6dd',
                  boxShadow: '0 8px 30px -4px rgba(0, 0, 0, 0.05)',
                  userSelect: 'none',
                }}
              >
                {/* Vector Map Background Graphics */}
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 700 490"
                  preserveAspectRatio="xMidYMid slice"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    transform: `scale(${mapZoom})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  {/* Pale mint ground */}
                  <rect width="700" height="490" fill="#eaf2ec" />

                  {/* Organic Green Parks */}
                  {/* Cubbon park top left */}
                  <circle cx="80" cy="120" r="85" fill="#d5e8dc" opacity="0.9" />
                  <ellipse cx="60" cy="180" rx="60" ry="70" fill="#d5e8dc" opacity="0.8" />
                  {/* Secondary green area bottom left */}
                  <circle cx="130" cy="450" r="75" fill="#d5e8dc" opacity="0.75" />
                  {/* East park area bottom right */}
                  <rect x="420" y="380" width="140" height="90" rx="18" fill="#d5e8dc" opacity="0.7" />

                  {/* Organic Lake (Ulsoor Lake, top right) */}
                  <path
                    d="M 390 135 C 410 80, 520 65, 570 100 C 605 125, 600 185, 550 205 C 490 225, 410 195, 390 135 Z"
                    fill="#d8eafb"
                    stroke="#c2dffa"
                    strokeWidth="2.5"
                  />
                  {/* Island inside lake */}
                  <circle cx="485" cy="135" r="16" fill="#d5e8dc" />

                  {/* White Grid Roads */}
                  {/* Main MG Road Horizontal */}
                  <line x1="0" y1="260" x2="700" y2="260" stroke="#ffffff" strokeWidth="16" />
                  {/* Secondary Parallel Roads */}
                  <line x1="0" y1="180" x2="700" y2="180" stroke="#ffffff" strokeWidth="9" />
                  <line x1="0" y1="360" x2="700" y2="360" stroke="#ffffff" strokeWidth="10" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#ffffff" strokeWidth="8" />

                  {/* Vertical Roads */}
                  <line x1="160" y1="0" x2="160" y2="490" stroke="#ffffff" strokeWidth="12" />
                  <line x1="280" y1="0" x2="280" y2="490" stroke="#ffffff" strokeWidth="10" />
                  <line x1="430" y1="0" x2="430" y2="490" stroke="#ffffff" strokeWidth="10" />

                  {/* Brigade Road Diagonal */}
                  <line x1="110" y1="490" x2="210" y2="260" stroke="#ffffff" strokeWidth="12" />

                  {/* Trinity Circle Roundabout */}
                  <circle cx="430" cy="260" r="28" fill="none" stroke="#ffffff" strokeWidth="12" />

                  {/* Dashed Metro Line along MG road */}
                  <line x1="0" y1="250" x2="700" y2="250" stroke="#a4d4b8" strokeWidth="3" strokeDasharray="6,4" />
                </svg>

                {/* Floating Map Labels & Badges */}
                {/* 1. Top-Left Badges: Live Clinic Location & Central Bengaluru */}
                <div
                  style={{
                    position: 'absolute',
                    top: '18px',
                    left: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    zIndex: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #dbe7df',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#166534', fontFamily: "'Manrope', sans-serif" }}>
                      Live Clinic Location
                    </span>
                  </div>

                  <div
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid #dbe7df',
                      borderRadius: '9999px',
                      padding: '5px 12px',
                      fontSize: '11.5px',
                      fontWeight: '600',
                      color: '#4b5563',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Central Bengaluru
                  </div>
                </div>

                {/* 2. Top-Right: Open in Maps Button */}
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  style={{
                    position: 'absolute',
                    top: '18px',
                    right: '18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #dbe7df',
                    borderRadius: '9999px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#111827',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    cursor: 'pointer',
                    zIndex: 10,
                    fontFamily: "'Manrope', sans-serif",
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fbf9';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <span>Open in Maps</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>

                {/* 3. Landmark Label: Cubbon Park (1.2 km) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '95px',
                    left: '26px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #d2e4d8',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    color: '#265e38',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    fontFamily: "'Manrope', sans-serif",
                    zIndex: 5,
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                  <span>Cubbon Park (1.2 km)</span>
                </div>

                {/* 4. Landmark Label: Ulsoor Lake */}
                <div
                  style={{
                    position: 'absolute',
                    top: '115px',
                    right: '72px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #c8e1fa',
                    borderRadius: '9999px',
                    padding: '3px 11px',
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#1d4ed8',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    fontFamily: "'Manrope', sans-serif",
                    zIndex: 5,
                  }}
                >
                  Ulsoor Lake
                </div>

                {/* 5. Metro Label: Trinity Metro (250m) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '188px',
                    left: '375px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d2e4d8',
                    borderRadius: '9999px',
                    padding: '3px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    color: '#111827',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    fontFamily: "'Manrope', sans-serif",
                    zIndex: 15,
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#059669' }} />
                  <span>Trinity Metro (250m)</span>
                </div>

                {/* 6. Road Name: M.G. ROAD */}
                <div
                  style={{
                    position: 'absolute',
                    top: '246px',
                    left: '60px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0eae3',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    color: '#374151',
                    letterSpacing: '0.8px',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
                    fontFamily: "'Manrope', sans-serif",
                    zIndex: 5,
                  }}
                >
                  M.G. ROAD
                </div>

                {/* 7. Diagonal Road Name: Brigade Road */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '120px',
                    left: '105px',
                    transform: 'rotate(-52deg)',
                    backgroundColor: 'rgba(255, 255, 255, 0.92)',
                    border: '1px solid #e0eae3',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '9px',
                    fontWeight: '700',
                    color: '#4b5563',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                    fontFamily: "'Manrope', sans-serif",
                    zIndex: 5,
                  }}
                >
                  Brigade Road
                </div>

                {/* 8. CENTER CLINIC PIN & POPUP CARD */}
                {/* Clinic Pin Beacon */}
                <div
                  style={{
                    position: 'absolute',
                    top: '298px',
                    left: '286px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 20,
                  }}
                >
                  {/* Pin Circle with Location / Shield */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#1b4d2e',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 14px rgba(27, 77, 46, 0.35)',
                      border: '2.5px solid #ffffff',
                      position: 'relative',
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  {/* Soft Pin Base shadow */}
                  <div
                    style={{
                      width: '18px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.18)',
                      marginTop: '2px',
                    }}
                  />
                </div>

                {/* Floating Info Popup Card above the pin */}
                <div
                  style={{
                    position: 'absolute',
                    top: '202px',
                    left: '198px',
                    width: '176px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #dce8e0',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.12)',
                    zIndex: 25,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#111827', fontFamily: "'Manrope', sans-serif", whiteSpace: 'nowrap' }}>
                      Dr. K. Tripathi Homeopathy
                    </span>
                  </div>
                  <p style={{ fontSize: '10.5px', color: '#6b7280', margin: '0 0 5px 0', fontFamily: "'Manrope', sans-serif" }}>
                    Suite 102, 12 Green Park, MG Road
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f2', paddingTop: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Manrope', sans-serif" }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                      Open Today: 9 AM–6 PM
                    </span>
                    <span style={{ fontSize: '9.5px', color: '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>
                      Floor 1
                    </span>
                  </div>
                  {/* Speech Bubble Little Triangle pointing down */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-6px',
                      left: '82px',
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#ffffff',
                      borderRight: '1px solid #dce8e0',
                      borderBottom: '1px solid #dce8e0',
                      transform: 'rotate(45deg)',
                    }}
                  />
                </div>

                {/* 9. Bottom-Left Features Pill Banner */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '18px',
                    left: '18px',
                    backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    border: '1px solid #dbe7df',
                    borderRadius: '9999px',
                    padding: '6px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: '#374151',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
                    zIndex: 10,
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🚇</span> MG Road Metro: 3 min
                  </span>
                  <span style={{ color: '#d1d5db' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#0284c7' }}>🅿️</span> Free Valet Parking
                  </span>
                  <span style={{ color: '#d1d5db' }}>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>♿</span> Elevator Access
                  </span>
                </div>

                {/* 10. Bottom-Right Zoom Controls */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '18px',
                    right: '18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #dbe7df',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                    zIndex: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMapZoom((z) => Math.min(z + 0.15, 1.4))}
                    style={{
                      width: '32px',
                      height: '30px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderBottom: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Zoom in"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapZoom((z) => Math.max(z - 0.15, 0.9))}
                    style={{
                      width: '32px',
                      height: '30px',
                      backgroundColor: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#4b5563',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Zoom out"
                  >
                    −
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: Visit Our Clinic Info & Action Buttons */}
              <div>
                {/* Badge: FIND US */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#eaf6ee',
                    border: '1px solid #c7ebd2',
                    borderRadius: '9999px',
                    padding: '5px 14px',
                    marginBottom: '16px',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981',
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#166534',
                      letterSpacing: '0.4px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    FIND US
                  </span>
                </div>

                <h2
                  className="visit-heading"
                  style={{
                    fontSize: '40px',
                    fontWeight: '800',
                    color: '#111827',
                    lineHeight: '1.2',
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.5px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Visit Our Clinic
                </h2>

                <p
                  className="visit-subheading"
                  style={{
                    fontSize: '15px',
                    color: '#4b5563',
                    lineHeight: '1.65',
                    margin: '0 0 28px 0',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Drop by our clinic for a personal consultation, natural holistic assessment, and compassionate guidance.
                </p>

                {/* 2 White Detail Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                  {/* Card 1: Clinic Address & Landmark */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1.5px solid #e8f0eb',
                      padding: '22px 24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      boxShadow: '0 2px 12px -2px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#eaf6ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#166534',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '15.5px',
                          fontWeight: '800',
                          color: '#111827',
                          margin: '0 0 6px 0',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        Clinic Address & Landmark
                      </h4>
                      <p style={{ fontSize: '14px', color: '#4b5563', lineHeight: '1.5', margin: '0 0 6px 0', fontFamily: "'Manrope', sans-serif" }}>
                        12, Green Park, MG Road, Bangalore – 560001
                      </p>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', fontFamily: "'Manrope', sans-serif" }}>
                        <span style={{ color: '#dc2626' }}>📍</span> Landmark: Opp. 1 MG-Lido Mall, near Trinity Circle
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Consultation & Walk-in Hours */}
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '18px',
                      border: '1.5px solid #e8f0eb',
                      padding: '22px 24px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '16px',
                      boxShadow: '0 2px 12px -2px rgba(0, 0, 0, 0.02)',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: '#eaf6ee',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#166534',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '15.5px',
                          fontWeight: '800',
                          color: '#111827',
                          margin: '0 0 6px 0',
                          fontFamily: "'Manrope', sans-serif",
                        }}
                      >
                        Consultation & Walk-in Hours
                      </h4>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: '#111827', lineHeight: '1.5', margin: '0 0 4px 0', fontFamily: "'Manrope', sans-serif" }}>
                        Monday – Saturday: 9:00 AM – 6:00 PM
                      </p>
                      <p style={{ fontSize: '12.5px', color: '#6b7280', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                        Sunday: Closed &nbsp;•&nbsp; <span style={{ color: '#166534', fontWeight: '600' }}>Prior booking recommended</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2 Action Buttons: Get Directions & Call Clinic */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <button
                    type="button"
                    onClick={handleOpenGoogleMaps}
                    style={{
                      flex: 1.3,
                      backgroundColor: '#164327',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '15px 22px',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(22, 67, 39, 0.22)',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#10331e';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#164327';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    <span>Get Directions &nbsp;→</span>
                  </button>

                  <a
                    href="tel:+919876543210"
                    style={{
                      flex: 1,
                      backgroundColor: '#eaf7ef',
                      color: '#166534',
                      border: '1px solid #c8e8d4',
                      borderRadius: '12px',
                      padding: '14px 20px',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dcf2e4';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#eaf7ef';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span>Call Clinic</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. CALL TO ACTION BANNER: Ready to Start Your Wellness Journey?
            ========================================================= */}
        <CtaBannerSection onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Appointment Booking Modal */}
      <AppointmentModal isOpen={isBookingOpen} onClose={handleCloseBooking} />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .contact-hero-container {
            padding: 70px 24px !important;
          }
          .contact-hero-title {
            font-size: 38px !important;
          }
          .contact-cards-grid,
          .visit-columns-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
          .contact-info-card,
          .contact-form-card {
            padding: 32px 24px !important;
          }
          .visit-heading {
            font-size: 34px !important;
          }
        }
        @media (max-width: 768px) {
          .contact-hero-section {
            min-height: 400px !important;
            background-position: center right !important;
            background-size: cover !important;
          }
          .contact-hero-gradient-overlay {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(255, 255, 255, 0.65) 100%) !important;
          }
          .contact-form-row {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .clinic-map-container {
            height: 420px !important;
          }
        }
        @media (max-width: 640px) {
          .contact-hero-title {
            font-size: 30px !important;
          }
          .contact-hero-container {
            padding: 55px 20px !important;
          }
          .contact-info-card,
          .contact-form-card {
            padding: 26px 18px !important;
          }
          .visit-heading {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ContactPage;

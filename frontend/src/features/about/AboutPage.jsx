import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AppointmentModal from '../../components/AppointmentModal';

// Images specifically prepared for the About page
import heroTableImg from '../../assets/about-hero-table.jpg';
import journeyBooksImg from '../../assets/about-journey-books.jpg';
import rootHerbsImg from '../../assets/about-root-herbs.jpg';
import doctorDropperImg from '../../assets/about-doctor-dropper.jpg';

const AboutPage = () => {
  const navigate = useNavigate();
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  return (
    <div className="about-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      <main>
        {/* =========================================================
            1. HERO SECTION: Compassionate Care Rooted in Natural Healing
               (Exact unified background div matching user reference)
            ========================================================= */}
        <section
          className="about-hero-section"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '520px',
            backgroundColor: '#ffffff',
            backgroundImage: `url(${heroTableImg})`,
            backgroundPosition: 'right 82%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            overflow: 'hidden',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Refined Smooth Gradient Overlay:
              Clean solid white behind text, then a soft gentle taper ending early (55%),
              leaving the mortar, table, plants & amber bottles clear and vibrant without heavy haze */}
                              <div
            className="about-hero-gradient-overlay"
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
            className="about-inner-container about-hero-container"
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
            {/* Left Column: Heading & Intro (Exact text from Image 3) */}
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
                ABOUT US
              </span>

              <h1
                style={{
                  fontSize: '46px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.18',
                  letterSpacing: '-0.5px',
                  marginBottom: '20px',
                  fontFamily: "'Manrope', sans-serif",
                }}
                className="about-hero-title"
              >
                Compassionate Care<br />
                Rooted in Natural Healing
              </h1>

              <p
                style={{
                  fontSize: '15.5px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  maxWidth: '560px',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                At Dr. K. Tripathi Ampeh (Pat.) Homeopathy Clinic, we are dedicated to promoting holistic health through safe, natural and personalized homeopathic treatment.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. SECTION: A Journey of Healing and Trust (OUR STORY)
            ========================================================= */}
        <section
          className="about-story-section"
          style={{
            backgroundColor: '#ffffff',
            padding: '80px 0',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            className="about-inner-container about-story-container"
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 520px) minmax(0, 1fr)',
              gap: '64px',
              alignItems: 'center',
            }}
          >
            {/* Left: Books & Stethoscope Image Card */}
            <div
              style={{
                borderRadius: '22px',
                overflow: 'hidden',
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)',
                aspectRatio: '1.2 / 1',
                width: '100%',
              }}
            >
              <img
                src={journeyBooksImg}
                alt="Medical books, herbs, and medical stethoscope representing healing legacy"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                }}
              />
            </div>

            {/* Right: Story Details & 3-Column Stats Card */}
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1.8px',
                  color: '#265e38',
                  marginBottom: '12px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                OUR STORY
              </span>

              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px',
                  marginBottom: '16px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                A Journey of Healing and Trust
              </h2>

              <p
                style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  marginBottom: '28px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Dr. K. Tripathi Ampeh (Pat.) Homeopathy Clinic was established with a vision to make gentle, effective and long-lasting healthcare accessible to everyone. With years of experience in homeopathic care, we have been supporting individuals and families in their journey towards better health and well-being.
              </p>

              {/* Stats Box (Mint Background) */}
              <div
                className="about-story-stats-card"
                style={{
                  backgroundColor: '#edf7f1',
                  borderRadius: '16px',
                  border: '1px solid #dcece1',
                  padding: '24px 20px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#1c4428',
                      fontFamily: "'Manrope', sans-serif",
                      lineHeight: '1.1',
                    }}
                  >
                    3+
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      fontWeight: '500',
                      marginTop: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Years of Experience
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #dbeae0', borderRight: '1px solid #dbeae0', padding: '0 8px' }}>
                  <div
                    style={{
                      fontSize: '32px',
                      fontWeight: '800',
                      color: '#1c4428',
                      fontFamily: "'Manrope', sans-serif",
                      lineHeight: '1.1',
                    }}
                  >
                    500+
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      fontWeight: '500',
                      marginTop: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Happy Patients
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#1c4428',
                      fontFamily: "'Manrope', sans-serif",
                      lineHeight: '1.1',
                    }}
                  >
                    Natural
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#4b5563',
                      fontWeight: '500',
                      marginTop: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    and Safe Treatment
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. SECTION: Healing the Root Cause (OUR PHILOSOPHY)
            ========================================================= */}
        <section
          className="about-philosophy-section"
          style={{
            backgroundColor: '#f8faf8',
            padding: '85px 0',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            className="about-inner-container about-philosophy-container"
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 480px)',
              gap: '64px',
              alignItems: 'center',
            }}
          >
            {/* Left: Text & 3 Benefit Cards */}
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1.8px',
                  color: '#265e38',
                  marginBottom: '12px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                OUR PHILOSOPHY
              </span>

              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px',
                  marginBottom: '16px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Healing the Root Cause
              </h2>

              <p
                style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  marginBottom: '32px',
                  maxWidth: '660px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                We believe in treating the person as a whole — not just the symptoms. Our homeopathic approach focuses on understanding the root cause of health concerns and supporting the body's natural healing process.
              </p>

              {/* 3 Benefit Cards Row */}
              <div
                className="about-benefit-cards-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                }}
              >
                {/* Card 1: Holistic Care */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2ef',
                    borderRadius: '18px',
                    padding: '24px 20px',
                    boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: '#edf7f1',
                      color: '#1c4428',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    {/* Spark / Sun Radiance Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="4" />
                      <line x1="12" y1="2" x2="12" y2="4" />
                      <line x1="12" y1="20" x2="12" y2="22" />
                      <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                      <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                      <line x1="2" y1="12" x2="4" y2="12" />
                      <line x1="20" y1="12" x2="22" y2="12" />
                      <line x1="6.34" y1="17.66" x2="4.93" y2="19.07" />
                      <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" />
                    </svg>
                  </div>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Holistic Care
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    Mind, body and emotions in balance.
                  </p>
                </div>

                {/* Card 2: Personalized Treatment */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2ef',
                    borderRadius: '18px',
                    padding: '24px 20px',
                    boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: '#edf7f1',
                      color: '#1c4428',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    {/* Person / User Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Personalized Treatment
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    Individual care for every patient.
                  </p>
                </div>

                {/* Card 3: Safe & Natural */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #eef2ef',
                    borderRadius: '18px',
                    padding: '24px 20px',
                    boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: '#edf7f1',
                      color: '#1c4428',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    {/* Checkmark Icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h4
                    style={{
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '6px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    Safe & Natural
                  </h4>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      fontFamily: "'Manrope', sans-serif",
                      margin: 0,
                    }}
                  >
                    No side effects, suitable for all ages.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Organic Shaped Pebble Image Card matching Reference Curve & Frame */}
            <div
              style={{
                width: '100%',
                maxWidth: '436px',
                margin: '0 auto',
                filter:
                  'drop-shadow(0 18px 36px rgba(22, 45, 30, 0.08)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.04))',
              }}
            >
              <svg
                viewBox="0 0 500 396"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  overflow: 'visible',
                }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <clipPath id="about-pebble-clip">
                    <path d="M 251.8,0.9 C 272.6,-1.2 292.3,0.2 316.4,0.0 C 340.4,-0.2 370.0,-6.2 396.2,0.0 C 422.3,6.2 457.1,17.2 473.2,37.1 C 489.2,57.1 490.1,93.0 492.5,119.8 C 495.0,146.6 493.3,173.6 487.9,198.0 C 482.6,222.3 472.1,245.6 460.6,265.8 C 449.1,286.1 434.0,303.6 418.9,319.4 C 403.7,335.1 387.6,349.8 369.7,360.3 C 351.9,370.8 331.4,376.6 311.7,382.4 C 292.1,388.2 272.5,392.9 251.8,395.0 C 231.2,397.2 211.8,395.0 187.8,395.2 C 163.7,395.3 133.7,402.1 107.5,396.0 C 81.3,389.9 48.6,378.0 30.8,358.6 C 13.1,339.2 3.3,306.3 1.0,279.5 C -1.3,252.7 9.5,222.8 16.9,198.0 C 24.3,173.2 34.3,151.3 45.3,130.9 C 56.3,110.4 67.7,90.5 82.9,75.2 C 98.0,59.9 118.1,49.3 136.3,38.9 C 154.4,28.5 172.4,19.1 191.7,12.8 C 211.0,6.5 231.1,3.1 251.8,0.9 Z" />
                  </clipPath>
                </defs>

                {/* Clipped Photograph with high-fidelity preserveAspectRatio */}
                <image
                  href={rootHerbsImg}
                  xlinkHref={rootHerbsImg}
                  x="0"
                  y="0"
                  width="500"
                  height="396"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath="url(#about-pebble-clip)"
                />

                {/* Elegant White Border Frame matching Reference Image Sticker Shape */}
                <path
                  d="M 251.8,0.9 C 272.6,-1.2 292.3,0.2 316.4,0.0 C 340.4,-0.2 370.0,-6.2 396.2,0.0 C 422.3,6.2 457.1,17.2 473.2,37.1 C 489.2,57.1 490.1,93.0 492.5,119.8 C 495.0,146.6 493.3,173.6 487.9,198.0 C 482.6,222.3 472.1,245.6 460.6,265.8 C 449.1,286.1 434.0,303.6 418.9,319.4 C 403.7,335.1 387.6,349.8 369.7,360.3 C 351.9,370.8 331.4,376.6 311.7,382.4 C 292.1,388.2 272.5,392.9 251.8,395.0 C 231.2,397.2 211.8,395.0 187.8,395.2 C 163.7,395.3 133.7,402.1 107.5,396.0 C 81.3,389.9 48.6,378.0 30.8,358.6 C 13.1,339.2 3.3,306.3 1.0,279.5 C -1.3,252.7 9.5,222.8 16.9,198.0 C 24.3,173.2 34.3,151.3 45.3,130.9 C 56.3,110.4 67.7,90.5 82.9,75.2 C 98.0,59.9 118.1,49.3 136.3,38.9 C 154.4,28.5 172.4,19.1 191.7,12.8 C 211.0,6.5 231.1,3.1 251.8,0.9 Z"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="7"
                />
              </svg>
            </div>
          </div>
      </section>

      {/* =========================================================
            4. SECTION: Meet Our Doctor
            ========================================================= */}
      <section
        className="about-doctor-section"
        style={{
          backgroundColor: '#ffffff',
          padding: '85px 0',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div
          className="about-inner-container about-doctor-container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 40px',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 520px) minmax(0, 1fr)',
            gap: '64px',
            alignItems: 'center',
          }}
        >
          {/* Left: Doctor Photo Card */}
          <div
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)',
              aspectRatio: '1.2 / 1',
              width: '100%',
            }}
          >
            <img
              src={doctorDropperImg}
              alt="Dr. Kumar Tripathi preparing homeopathic remedies with dropper bottle"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
          </div>

          {/* Right: Doctor Info */}
          <div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '12.5px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '1.8px',
                color: '#265e38',
                marginBottom: '12px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              MEET OUR DOCTOR
            </span>

            <h2
              style={{
                fontSize: '36px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.2',
                letterSpacing: '-0.5px',
                marginBottom: '6px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Dr. Kumar Tripathi Ampeh (Pat.)
            </h2>

            <p
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#265e38',
                marginBottom: '18px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Homeopathy Practitioner
            </p>

            <p
              style={{
                fontSize: '15px',
                color: '#4b5563',
                lineHeight: '1.68',
                marginBottom: '26px',
                maxWidth: '660px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              With years of experience in homeopathic care, Dr. K. Tripathi Ampeh (Pat.) is dedicated to providing compassionate and personalized treatment. His approach focuses on understanding the complete case and supporting each patient on their path to long-term wellness.
            </p>

            {/* 3 Checkmark Items with filled dark green badges */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginBottom: '32px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#204a32',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                  Patient-Centered Approach
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#204a32',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                  Gentle and Natural Healing
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#204a32',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: '#111827', fontFamily: "'Manrope', sans-serif" }}>
                  Trusted by Families
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              onClick={handleOpenBooking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: '#204a32',
                color: '#ffffff',
                padding: '13px 26px',
                borderRadius: '9999px',
                fontSize: '14.5px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#163623';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#204a32';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <svg
                width="17"
                height="17"
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
      </section>

      {/* =========================================================
            5. SECTION: A Complete and Individualized Care Process (OUR APPROACH)
            ========================================================= */}
      <section
        className="about-approach-section"
        style={{
          backgroundColor: '#f8faf8',
          padding: '90px 0',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div
          className="about-inner-container about-approach-container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 40px',
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
                marginBottom: '10px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              OUR APPROACH
            </span>

            <h2
              style={{
                fontSize: '36px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.22',
                letterSpacing: '-0.5px',
                marginBottom: '14px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              A Complete and Individualized Care<br />
              Process
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: '#4b5563',
                lineHeight: '1.65',
                maxWidth: '720px',
                margin: '0 auto',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              We take time to understand your medical history, lifestyle and overall well-being to provide the most suitable homeopathic treatment.
            </p>
          </div>

          {/* 4 Process Cards Grid */}
          <div
            className="about-process-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}
          >
            {/* Card 1: Detailed Consultation */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '20px',
                padding: '36px 20px 32px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                {/* Document / Consultation Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Detailed Consultation
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Understanding your health concerns
              </p>
            </div>

            {/* Card 2: Root Cause Analysis */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '20px',
                padding: '36px 20px 32px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                {/* Magnifying Glass Search Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Root Cause Analysis
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Indentifying the underlying cause
              </p>
            </div>

            {/* Card 3: Personalized Treatment */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '20px',
                padding: '36px 20px 32px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                {/* Open Book Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Personalized Treatment
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Tailored to your unique needs
              </p>
            </div>

            {/* Card 4: Continuous Support */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '20px',
                padding: '36px 20px 32px 20px',
                textAlign: 'center',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                {/* Analytics Bar Chart Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '15.5px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Continuous Support
              </h3>
              <p
                style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  lineHeight: '1.5',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Guidance for long-term wellness
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
            6. SECTION: What Drives Us (OUR VALUES)
            ========================================================= */}
      <section
        className="about-values-section"
        style={{
          backgroundColor: '#ffffff',
          padding: '90px 0 100px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <div
          className="about-inner-container about-values-container"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 40px',
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
                marginBottom: '10px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              OUR VALUES
            </span>

            <h2
              style={{
                fontSize: '36px',
                fontWeight: '800',
                color: '#111827',
                lineHeight: '1.22',
                letterSpacing: '-0.5px',
                marginBottom: '14px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              What Drives Us
            </h2>

            <p
              style={{
                fontSize: '15px',
                color: '#4b5563',
                lineHeight: '1.65',
                maxWidth: '720px',
                margin: '0 auto',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Our work is guided by a deep commitment to care, integrity and natural healing.
            </p>
          </div>

          {/* 4 Value Cards Grid */}
          <div
            className="about-values-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}
          >
            {/* Value Card 1: Compassion */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'left',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                {/* Heart Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Compassion
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#6b7280',
                  lineHeight: '1.55',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                We listen and care with empathy.
              </p>
            </div>

            {/* Value Card 2: Integrity */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'left',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                {/* Shield with Checkmark Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Integrity
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#6b7280',
                  lineHeight: '1.55',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Honest and ethical practice.
              </p>
            </div>

            {/* Value Card 3: Patient First */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'left',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                {/* People / Patients Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Patient First
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#6b7280',
                  lineHeight: '1.55',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Your well-being is our priority.
              </p>
            </div>

            {/* Value Card 4: Natural Healing */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '18px',
                padding: '32px 24px',
                textAlign: 'left',
                boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.03)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0, 0, 0, 0.06)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.03)';
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#edf7f1',
                  color: '#1c4428',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                {/* Sun / Natural Radiance Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
                  <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                  <line x1="6.34" y1="17.66" x2="4.93" y2="19.07" />
                  <line x1="19.07" y1="4.93" x2="17.66" y2="6.34" />
                </svg>
              </div>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: '#111827',
                  marginBottom: '8px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Natural Healing
              </h3>
              <p
                style={{
                  fontSize: '13.5px',
                  color: '#6b7280',
                  lineHeight: '1.55',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                Safe, gentle and effective solutions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

      {/* Footer */ }
  <Footer />

  {/* Interactive Booking Modal */ }
  <AppointmentModal isOpen={isBookingOpen} onClose={handleCloseBooking} />

  {/* Responsive Styles */ }
  <style>{`
        @media (max-width: 1024px) {
          .about-hero-title {
            font-size: 36px !important;
          }
          .about-inner-container {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 0 24px !important;
          }
          .about-process-cards-grid,
          .about-values-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 20px !important;
          }
          .about-benefit-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 768px) {
          .about-hero-section {
            min-height: 400px !important;
            background-position: center right !important;
            background-size: cover !important;
          }
          .about-hero-gradient-overlay {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(255, 255, 255, 0.65) 100%) !important;
          }
        }
        @media (max-width: 640px) {
          .about-hero-title {
            font-size: 28px !important;
          }
          .about-hero-container {
            padding: 60px 20px !important;
          }
          .about-process-cards-grid,
          .about-values-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 520px) {
          .about-story-stats-card {
            padding: 18px 10px !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div >
  );
};

export default AboutPage;

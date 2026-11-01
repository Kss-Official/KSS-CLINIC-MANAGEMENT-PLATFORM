import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AppointmentModal from '../../components/AppointmentModal';
import CtaBannerSection from '../home/CtaBannerSection';

// Images specifically prepared for the Services page
import heroBottlesImg from '../../assets/services-hero-bottles.jpg';
import childImg from '../../assets/services-child.jpg';
import womanImg from '../../assets/services-woman.jpg';

const ServicesPage = () => {
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
    <div className="services-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      <main>
        {/* =========================================================
            1. HERO SECTION: Complete Homeopathic Care for Every Stage of Life
               (Exact unified background div matching user reference)
            ========================================================= */}
        <section
          className="services-hero-section"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '520px',
            backgroundColor: '#ffffff',
            backgroundImage: `url(${heroBottlesImg})`,
            backgroundPosition: 'right 84%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            overflow: 'hidden',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {/* Refined Smooth Gradient Overlay:
              Clean solid white behind text, then a soft gentle taper ending by 56%,
              leaving the mortar, table, plants & amber bottles clear and vibrant without heavy haze */}
                              <div
            className="services-hero-gradient-overlay"
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
            className="services-inner-container services-hero-container"
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
                OUR SERVICES
              </span>

              <h1
                style={{
                  fontSize: '44px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.18',
                  letterSpacing: '-0.5px',
                  marginBottom: '20px',
                  fontFamily: "'Manrope', sans-serif",
                }}
                className="services-hero-title"
              >
                Complete Homeopathic<br />
                Care for Every Stage of<br />
                Life
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
                At Dr. K. Tripathi Ampeh (Pat.) Homeopathy Clinic, we provide safe, natural and personalized care for individuals and families with a special focus on children and women.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. SECTION: Care for the Whole Family (4 Features)
            ========================================================= */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '70px 0 75px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
            }}
          >
            {/* Centered Header */}
            <div style={{ textAlign: 'center', marginBottom: '52px' }}>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '12px',
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
                  fontSize: '32px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.25',
                  letterSpacing: '-0.5px',
                  marginBottom: '14px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Care for the Whole Family
              </h2>

              <p
                style={{
                  fontSize: '15px',
                  color: '#4b5563',
                  lineHeight: '1.65',
                  maxWidth: '710px',
                  margin: '0 auto',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                We believe in treating the person as a whole — considering physical, emotional and lifestyle factors to support long-term well-being, at every stage of life.
              </p>
            </div>

            {/* 4 Feature Columns Row */}
            <div
              className="services-family-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                textAlign: 'center',
                alignItems: 'start',
              }}
            >
              {/* Feature 1 */}
              <div
                className="services-family-item"
                style={{
                  padding: '8px 24px',
                  borderRight: '1px solid #eef2ef',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ebf6ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="#265e38">
                    <path d="M20.6 3.4c-9.2.4-15.4 5.8-16.1 14.1l-1.5 3.5 3.5-1.5c8.3-.7 13.7-6.9 14.1-16.1zM15 13.5c-2.4 1-4.8 1.2-7.2.7 2.4-2.1 4.8-2.3 7.2-.7z" />
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
                  Natural & Safe
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    fontFamily: "'Manrope', sans-serif",
                    margin: 0,
                    maxWidth: '220px',
                  }}
                >
                  Gentle and side-effect free care.
                </p>
              </div>

              {/* Feature 2 */}
              <div
                className="services-family-item"
                style={{
                  padding: '8px 24px',
                  borderRight: '1px solid #eef2ef',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ebf6ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#265e38">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 21v-1.5C4 16 7.5 13 12 13s8 3 8 6.5V21H4z" />
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
                  Personalized Care
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    fontFamily: "'Manrope', sans-serif",
                    margin: 0,
                    maxWidth: '220px',
                  }}
                >
                  Individual attention for every patient.
                </p>
              </div>

              {/* Feature 3 */}
              <div
                className="services-family-item"
                style={{
                  padding: '8px 24px',
                  borderRight: '1px solid #eef2ef',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ebf6ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#265e38">
                    <circle cx="9" cy="7.5" r="3.5" />
                    <path d="M2 20.5v-1.2c0-3.1 3.1-5.3 7-5.3s7 2.2 7 5.3v1.2H2z" />
                    <circle cx="17" cy="8" r="3" />
                    <path d="M15.5 14.5c.8-.4 1.7-.5 2.5-.5 2.8 0 4.8 1.8 4.8 4.2v1.8h-4.8v-.8c0-1.7-.8-3.2-2.5-4.7z" />
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
                  For All Age Groups
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    fontFamily: "'Manrope', sans-serif",
                    margin: 0,
                    maxWidth: '220px',
                  }}
                >
                  Support from childhood to adulthood.
                </p>
              </div>

              {/* Feature 4 */}
              <div
                className="services-family-item"
                style={{
                  padding: '8px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#ebf6ee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                  Long-Term Wellness
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#6b7280',
                    lineHeight: '1.5',
                    fontFamily: "'Manrope', sans-serif",
                    margin: 0,
                    maxWidth: '220px',
                  }}
                >
                  Focus on overall and lasting health.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            3. SECTION: Supporting Your Child's Natural Growth (Pediatric)
            ========================================================= */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '50px 0 65px',
          }}
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
            }}
          >
            {/* Outer Rounded Container Card */}
            <div
              className="services-pediatric-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '26px',
                padding: '40px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 480px) minmax(0, 1fr)',
                gap: '54px',
                alignItems: 'center',
              }}
            >
              {/* Left: Child with Teddy Bear Photo Card */}
              <div
                style={{
                  borderRadius: '22px',
                  overflow: 'hidden',
                  height: '380px',
                  width: '100%',
                }}
              >
                <img
                  src={childImg}
                  alt="Smiling child hugging teddy bear representing pediatric homeopathic care"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </div>

              {/* Right: Pediatric Care Details & 3 Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1.8px',
                    color: '#265e38',
                    marginBottom: '10px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  FOR CHILDREN
                </span>

                <h2
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#111827',
                    lineHeight: '1.2',
                    letterSpacing: '-0.5px',
                    marginBottom: '14px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Supporting Your Child’s Natural Growth
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    color: '#4b5563',
                    lineHeight: '1.65',
                    marginBottom: '28px',
                    maxWidth: '620px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  We provide gentle and holistic homeopathic care to support children’s physical, emotional and overall development in a natural and safe way.
                </p>

                {/* 3 Mint Cards in a row */}
                <div
                  className="services-pill-cards-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '18px',
                  }}
                >
                  {/* Card 1 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#265e38">
                      <path d="M20.6 3.4c-9.2.4-15.4 5.8-16.1 14.1l-1.5 3.5 3.5-1.5c8.3-.7 13.7-6.9 14.1-16.1zM15 13.5c-2.4 1-4.8 1.2-7.2.7 2.4-2.1 4.8-2.3 7.2-.7z" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Supports<br />Healthy Growth
                    </h4>
                  </div>

                  {/* Card 2 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2.2 2.2 4.8-4.8" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Builds<br />Natural Immunity
                    </h4>
                  </div>

                  {/* Card 3 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#265e38">
                      <circle cx="9" cy="7.5" r="3.5" />
                      <circle cx="17.5" cy="7.5" r="3.5" />
                      <path d="M3 20.5v-.5c0-3.3 2.7-6 6-6s6 2.7 6 6v.5H3z" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Gentle Care<br />for Young Minds
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            4. SECTION: Care Through Every Phase of Life (Women's Care)
            ========================================================= */}
        <section
          style={{
            backgroundColor: '#ffffff',
            padding: '50px 0 65px',
          }}
        >
          <div
            style={{
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
            }}
          >
            {/* Outer Rounded Container Card */}
            <div
              className="services-women-card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #eef2ef',
                borderRadius: '26px',
                padding: '40px',
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 480px)',
                gap: '54px',
                alignItems: 'center',
              }}
            >
              {/* Left: Women's Care Details & 3 Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '12px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    letterSpacing: '1.8px',
                    color: '#265e38',
                    marginBottom: '10px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  FOR WOMEN
                </span>

                <h2
                  style={{
                    fontSize: '36px',
                    fontWeight: '800',
                    color: '#111827',
                    lineHeight: '1.2',
                    letterSpacing: '-0.5px',
                    marginBottom: '14px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  Care Through Every Phase of Life
                </h2>

                <p
                  style={{
                    fontSize: '15px',
                    color: '#4b5563',
                    lineHeight: '1.65',
                    marginBottom: '28px',
                    maxWidth: '620px',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  We understand the unique health needs of women and provide compassionate, personalized homeopathic care to support their overall well-being at every stage of life.
                </p>

                {/* 3 Mint Cards in a row */}
                <div
                  className="services-pill-cards-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '18px',
                  }}
                >
                  {/* Card 1 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="7.5" r="3.5" />
                      <path d="M4 20v-.5c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5v.5" />
                      <circle cx="16" cy="8" r="2.2" />
                      <path d="M16.5 5.8c.8-.8 1.8-.8 2.5-.2" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Supports<br />Overall Well-being
                    </h4>
                  </div>

                  {/* Card 2 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Natural & Gentle<br />Approach
                    </h4>
                  </div>

                  {/* Card 3 */}
                  <div
                    style={{
                      backgroundColor: '#f0f7f2',
                      borderRadius: '16px',
                      padding: '24px 12px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#265e38">
                      <circle cx="12" cy="7" r="4" />
                      <path d="M4 21v-1.5C4 16 7.5 13 12 13s8 3 8 6.5V21H4z" />
                    </svg>
                    <h4
                      style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#111827',
                        marginTop: '12px',
                        marginBottom: 0,
                        lineHeight: '1.35',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      Care for<br />Every Stage
                    </h4>
                  </div>
                </div>
              </div>

              {/* Right: Smiling Woman Photo Card */}
              <div
                style={{
                  borderRadius: '22px',
                  overflow: 'hidden',
                  height: '380px',
                  width: '100%',
                }}
              >
                <img
                  src={womanImg}
                  alt="Woman surrounded by green plants representing women's homeopathic care"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            5. SECTION: Book Your Appointment Today (Home Page CTA Banner)
            ========================================================= */}
        <CtaBannerSection onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Booking Modal */}
      <AppointmentModal isOpen={isBookingOpen} onClose={handleCloseBooking} />

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .services-hero-title {
            font-size: 36px !important;
          }
          .services-inner-container {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 0 24px !important;
          }
          .services-family-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 24px !important;
          }
          .services-family-item {
            border-right: none !important;
          }
          .services-pill-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .services-pediatric-card,
          .services-women-card {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .services-hero-section {
            min-height: 400px !important;
            background-position: center right !important;
            background-size: cover !important;
          }
          .services-hero-gradient-overlay {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(255, 255, 255, 0.65) 100%) !important;
          }
        }
        @media (max-width: 640px) {
          .services-hero-title {
            font-size: 28px !important;
          }
          .services-hero-container {
            padding: 60px 20px !important;
          }
          .services-family-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ServicesPage;


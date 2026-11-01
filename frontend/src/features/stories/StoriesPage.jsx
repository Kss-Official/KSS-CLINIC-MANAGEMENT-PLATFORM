import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import AppointmentModal from '../../components/AppointmentModal';
import CtaBannerSection from '../home/CtaBannerSection';

// Hero background image for Stories page
import storiesHeroBg from '../../assets/stories-hero-bg.jpg';

// Patient Avatars cropped directly from user design for 100% exact match
import priyaAvatar from '../../assets/story-avatar-priya.png';
import raviAvatar from '../../assets/story-avatar-ravi.png';
import anitaAvatar from '../../assets/story-avatar-anita.png';

// Glimpses from Our Clinic card images for Div 3
import glimpseWelcomeImg from '../../assets/stories-glimpse-welcome.jpg';
import glimpseConsultationImg from '../../assets/stories-glimpse-consultation.jpg';
import glimpseSpaceImg from '../../assets/stories-glimpse-space.jpg';

const patientExperiences = [
  {
    id: 'priya',
    name: 'Priya',
    role: 'VERIFIED PATIENT',
    avatar: priyaAvatar,
    quote:
      'I felt truly listened to. The doctor spent time understanding my concerns and explained everything in a very simple and clear way. The whole experience was comforting and reassuring.',
  },
  {
    id: 'ravi',
    name: 'Ravi',
    role: 'VERIFIED PATIENT',
    avatar: raviAvatar,
    quote:
      'The consultation was very detailed and thoughtful. I appreciated how patiently the doctor answered all my questions and suggested a plan that suited my lifestyle. The care here feels genuine.',
  },
  {
    id: 'anita',
    name: 'Anita',
    role: 'VERIFIED PATIENT',
    avatar: anitaAvatar,
    quote:
      'The clinic has a very calm and welcoming environment. From the reception to the consultation, everything was well-organized and smooth. I felt comfortable and well taken care of.',
  },
];

const clinicGlimpses = [
  {
    id: 'welcome',
    image: glimpseWelcomeImg,
    title: 'A Warm Welcome',
    desc: 'Friendly support right from your first visit.',
  },
  {
    id: 'consultations',
    image: glimpseConsultationImg,
    title: 'Personalized Consultations',
    desc: 'Understanding your concerns with care and attention.',
  },
  {
    id: 'space',
    image: glimpseSpaceImg,
    title: 'A Comfortable Space',
    desc: 'A calm and peaceful environment for your well-being.',
  },
];

const StoriesPage = () => {
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
    <div className="stories-page-wrapper" style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* Top Navbar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      <main>
        {/* =========================================================
            1. HERO SECTION: Patient Stories - Every Journey Has a Story
               (Exact unified background matching user reference)
            ========================================================= */}
        <section
          className="stories-hero-section"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '520px',
            backgroundColor: '#ffffff',
            backgroundImage: `url(${storiesHeroBg})`,
            backgroundPosition: 'right center',
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
              into the photo of doctor and patient on the right */}
                              <div
            className="stories-hero-gradient-overlay"
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
            className="stories-inner-container stories-hero-container"
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
                PATIENT STORIES
              </span>
              <h1
                className="stories-hero-title"
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
                Every Journey<br />Has a Story
              </h1>
              <p
                className="stories-hero-desc"
                style={{
                  fontSize: '15.5px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  maxWidth: '560px',
                  fontFamily: "'Manrope', sans-serif",
                  margin: 0,
                }}
              >
                We listen to every individual, understand their concerns, and provide personalized care. Here are some experiences shared by our patients and families.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            2. DIV 2: PATIENT EXPERIENCES - Experiences That Matter
               (Exact layout, typography & 3 cards matching user reference)
            ========================================================= */}
        <section
          className="stories-experiences-section"
          style={{
            backgroundColor: '#ffffff',
            padding: '90px 0 105px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            className="stories-inner-container"
            style={{
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            {/* Header: Centered tag, title & subtitle */}
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
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
                PATIENT EXPERIENCES
              </span>

              <h2
                className="experiences-title"
                style={{
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px',
                  marginBottom: '16px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Experiences That Matter
              </h2>

              <p
                className="experiences-desc"
                style={{
                  fontSize: '15.5px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  maxWidth: '700px',
                  margin: '0 auto',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Real stories from individuals and families who have trusted us for their health and well-being. Each story reflects a unique journey and our commitment to compassionate, personalized care.
              </p>
            </div>

            {/* 3 Patient Experience Cards Grid */}
            <div
              className="experiences-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '28px',
                alignItems: 'stretch',
              }}
            >
              {patientExperiences.map((patient) => (
                <div
                  key={patient.id}
                  className="experience-card"
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '24px',
                    border: '1.5px solid #edf2ee',
                    padding: '36px 30px 34px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 16px 36px -8px rgba(0, 0, 0, 0.08)';
                    e.currentTarget.style.borderColor = '#d2e7d8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px -2px rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.borderColor = '#edf2ee';
                  }}
                >
                  {/* Top Row: Mint Quote Icon Badge (Left) & Avatar with soft mint ring (Right) */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '26px',
                      }}
                    >
                      {/* Quote Mark Mint Circle Badge */}
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '50%',
                          backgroundColor: '#eaf6ee',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#265e38">
                          <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
                        </svg>
                      </div>

                      {/* Patient Avatar Circle with Mint Border Ring */}
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          padding: '2.5px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 0 0 2px #b6e2ca',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={patient.avatar}
                          alt={patient.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                    </div>

                    {/* Patient Name */}
                    <h3
                      style={{
                        fontSize: '22px',
                        fontWeight: '800',
                        color: '#111827',
                        margin: '0 0 4px 0',
                        fontFamily: "'Manrope', sans-serif",
                        letterSpacing: '-0.3px',
                      }}
                    >
                      {patient.name}
                    </h3>

                    {/* Verified Patient Badge */}
                    <span
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#265e38',
                        textTransform: 'uppercase',
                        letterSpacing: '1.2px',
                        marginBottom: '20px',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {patient.role}
                    </span>

                    {/* Quote Text */}
                    <p
                      style={{
                        fontSize: '14.5px',
                        color: '#4b5563',
                        lineHeight: '1.68',
                        margin: '0 0 32px 0',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {patient.quote}
                    </p>
                  </div>

                  {/* Bottom Accent Green Bar */}
                  <div
                    style={{
                      width: '38px',
                      height: '4px',
                      backgroundColor: '#265e38',
                      borderRadius: '2px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================
            3. DIV 3: GLIMPSES FROM OUR CLINIC - Moments of Care
               (Exact layout, typography & 3 cards matching user reference)
            ========================================================= */}
        <section
          className="stories-glimpses-section"
          style={{
            backgroundColor: '#ffffff',
            padding: '90px 0 105px',
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <div
            className="stories-inner-container"
            style={{
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            {/* Header: Centered tag, title & subtitle */}
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 56px' }}>
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
                GLIMPSES FROM OUR CLINIC
              </span>

              <h2
                className="glimpses-title"
                style={{
                  fontSize: '42px',
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: '1.2',
                  letterSpacing: '-0.5px',
                  marginBottom: '16px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Moments of Care
              </h2>

              <p
                className="glimpses-desc"
                style={{
                  fontSize: '15.5px',
                  color: '#4b5563',
                  lineHeight: '1.68',
                  maxWidth: '700px',
                  margin: '0 auto',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                A warm, welcoming space where individuals and families receive personalized attention and compassionate care.
              </p>
            </div>

            {/* 3 Clinic Glimpse Cards Grid */}
            <div
              className="glimpses-cards-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '32px',
                alignItems: 'start',
              }}
            >
              {clinicGlimpses.map((glimpse) => (
                <div
                  key={glimpse.id}
                  className="glimpse-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  {/* Card Image Container with rounded corners */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4 / 3',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 18px -2px rgba(0, 0, 0, 0.06)',
                      marginBottom: '22px',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      backgroundColor: '#f3f4f6',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 18px -2px rgba(0, 0, 0, 0.06)';
                    }}
                  >
                    <img
                      src={glimpse.image}
                      alt={glimpse.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        display: 'block',
                      }}
                    />
                  </div>

                  {/* Card Title */}
                  <h3
                    style={{
                      fontSize: '20px',
                      fontWeight: '800',
                      color: '#111827',
                      margin: '0 0 8px 0',
                      fontFamily: "'Manrope', sans-serif",
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {glimpse.title}
                  </h3>

                  {/* Card Subtitle */}
                  <p
                    style={{
                      fontSize: '14.5px',
                      color: '#6b7280',
                      lineHeight: '1.55',
                      margin: 0,
                      fontFamily: "'Manrope', sans-serif",
                      maxWidth: '320px',
                    }}
                  >
                    {glimpse.desc}
                  </p>
                </div>
              ))}
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
          .stories-hero-container {
            padding: 70px 24px !important;
          }
          .stories-hero-title {
            font-size: 38px !important;
          }
          .experiences-title,
          .glimpses-title {
            font-size: 34px !important;
          }
          .experiences-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .glimpses-cards-grid {
            gap: 24px !important;
          }
        }
        @media (max-width: 768px) {
          .stories-hero-section {
            min-height: 400px !important;
            background-position: center right !important;
            background-size: cover !important;
          }
          .stories-hero-gradient-overlay {
            background: linear-gradient(90deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 55%, rgba(255, 255, 255, 0.65) 100%) !important;
          }
          .experiences-cards-grid,
          .glimpses-cards-grid {
            grid-template-columns: 1fr !important;
          }
          .experience-card {
            padding: 28px 24px 28px !important;
          }
          .glimpses-cards-grid {
            gap: 36px !important;
          }
        }
        @media (max-width: 640px) {
          .stories-hero-title {
            font-size: 30px !important;
          }
          .stories-hero-container {
            padding: 55px 20px !important;
          }
          .experiences-title,
          .glimpses-title {
            font-size: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StoriesPage;

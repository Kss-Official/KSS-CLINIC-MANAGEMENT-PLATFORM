import React, { useState } from 'react';
import p1 from '../../assets/patient-1.png';
import p2 from '../../assets/patient-2.png';
import p3 from '../../assets/patient-3.png';
import thumb1 from '../../assets/story-thumb-1.png';
import thumb2 from '../../assets/story-thumb-2.png';
import thumb3 from '../../assets/story-thumb-3.png';

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(1); // Default to middle card (Priya Sharma) like in the reference image

  const testimonials = [
    {
      quote:
        'Very good consultation and supportive treatment. I have seen real improvements in my health. Highly recommended!',
      author: 'Rahul Mehta',
      role: 'Patient',
      avatar: p1,
      thumb: thumb1,
    },
    {
      quote:
        'Dr. K. Tripathi Ampeh (Pat.) is very patient and listens carefully. The treatment has been very helpful for my family.',
      author: 'Priya Sharma',
      role: 'Patient',
      avatar: p2,
      thumb: thumb2,
    },
    {
      quote:
        'A safe and natural approach with genuine care. I am thankful for the guidance and support.',
      author: 'Anil Kumar',
      role: 'Patient',
      avatar: p3,
      thumb: thumb3,
    },
  ];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <section
      id="stories"
      style={{
        backgroundColor: '#ffffff',
        width: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        className="stories-inner-container"
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
            PATIENT STORIES
          </span>

          <h2
            className="stories-heading"
            style={{
              fontSize: '40px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: '1.2',
              letterSpacing: '-0.5px',
              marginBottom: '14px',
            }}
          >
            What Our Patients Say
          </h2>

          <p
            className="stories-subheading"
            style={{
              fontSize: '15.5px',
              color: '#4b5563',
              lineHeight: '1.65',
              maxWidth: '680px',
              margin: '0 auto',
            }}
          >
            Real experiences from people who have found better health and well-being with our care.
          </p>
        </div>

        {/* Carousel Container with Arrows and 3 Cards */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous Testimonial"
            style={{
              position: 'absolute',
              left: '-20px',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4b5563',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* 3 Cards Grid */}
          <div
            className="stories-cards-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '24px',
              width: '100%',
            }}
          >
            {testimonials.map((item, idx) => {
              const isCenter = idx === activeIndex;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className="story-card"
                  style={{
                    backgroundColor: '#ffffff',
                    border: isCenter ? '2px solid #a7f3d0' : '1px solid #e5e7eb',
                    borderRadius: '20px',
                    padding: '30px 26px 26px',
                    boxShadow: isCenter
                      ? '0 8px 26px -4px rgba(38, 94, 56, 0.08)'
                      : '0 4px 18px rgba(0, 0, 0, 0.02)',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '260px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isCenter) {
                      e.currentTarget.style.borderColor = '#d1d5db';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCenter) {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.02)';
                    }
                  }}
                >
                  {/* Top Row: Thumbnail on Left + Green Quote Icon on Right */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '20px',
                    }}
                  >
                    {/* Top Round Thumbnail */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '1.5px solid #e8f5ec',
                        backgroundColor: '#ffffff',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={item.thumb}
                        alt="Testimonial thumbnail"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>

                    {/* Green Quotation Mark */}
                    <span
                      style={{
                        fontSize: '24px',
                        fontWeight: '700',
                        color: '#265e38',
                        fontFamily: 'Georgia, serif',
                        lineHeight: 1,
                        userSelect: 'none',
                        letterSpacing: '-1px',
                      }}
                    >
                      “
                    </span>
                  </div>

                  {/* Body Quote */}
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.68',
                      marginBottom: '24px',
                      flexGrow: 1,
                    }}
                  >
                    "{item.quote}"
                  </p>

                  {/* Divider line before author */}
                  <div
                    style={{
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    {/* Bottom Author Avatar */}
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <img
                        src={item.avatar}
                        alt={item.author}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    </div>

                    <div>
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#111827',
                          margin: 0,
                          lineHeight: '1.3',
                        }}
                      >
                        {item.author}
                      </h4>
                      <p
                        style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          margin: '2px 0 0 0',
                        }}
                      >
                        {item.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Testimonial"
            style={{
              position: 'absolute',
              right: '-20px',
              zIndex: 10,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4b5563',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Pagination Dots (Active is elongated dark green pill) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginTop: '34px',
          }}
        >
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: activeIndex === idx ? '22px' : '7px',
                height: '7px',
                borderRadius: '4px',
                backgroundColor: activeIndex === idx ? '#265e38' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .stories-inner-container {
            padding: 65px 24px 75px !important;
          }
          .stories-heading {
            font-size: 34px !important;
          }
        }
        @media (max-width: 860px) {
          .stories-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 640px) {
          .stories-inner-container {
            padding: 50px 20px 60px !important;
          }
          .stories-heading {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;

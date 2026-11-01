import React, { useState, useEffect, useRef, useCallback } from 'react';
import p1 from '../../assets/patient-1.png';
import p2 from '../../assets/patient-2.png';
import p3 from '../../assets/patient-3.png';
import thumb1 from '../../assets/story-thumb-1.png';
import thumb2 from '../../assets/story-thumb-2.png';
import thumb3 from '../../assets/story-thumb-3.png';

const TestimonialsSection = () => {
  const baseTestimonials = [
    {
      id: 'rahul',
      quote:
        'Very good consultation and supportive treatment. I have seen real improvements in my health. Highly recommended!',
      author: 'Rahul Mehta',
      role: 'Patient',
      avatar: p1,
      thumb: thumb1,
    },
    {
      id: 'priya',
      quote:
        'Dr. K. Tripathi Ampeh (Pat.) is very patient and listens carefully. The treatment has been very helpful for my family.',
      author: 'Priya Sharma',
      role: 'Patient',
      avatar: p2,
      thumb: thumb2,
    },
    {
      id: 'anil',
      quote:
        'A safe and natural approach with genuine care. I am thankful for the guidance and support.',
      author: 'Anil Kumar',
      role: 'Patient',
      avatar: p3,
      thumb: thumb3,
    },
  ];

  // 5 sets of testimonials (15 items) for a truly unbreakable infinite loop
  const extendedTestimonials = [
    ...baseTestimonials,
    ...baseTestimonials,
    ...baseTestimonials,
    ...baseTestimonials,
    ...baseTestimonials,
  ];

  // Start with Priya Sharma (index 7 = middle of the center set [6, 7, 8])
  const [currentIndex, setCurrentIndex] = useState(7);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 860 : false);

  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);
  const isPointerDown = useRef(false);
  const isAnimating = useRef(false);
  const resetTimerRef = useRef(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 860);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Slide controls with animation lock to prevent race conditions
  const handleNext = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);

    setTimeout(() => {
      isAnimating.current = false;
    }, 460);
  }, []);

  const handlePrev = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);

    setTimeout(() => {
      isAnimating.current = false;
    }, 460);
  }, []);

  // Deterministic silent wrap-around (fires via setTimeout so it NEVER fails even if transitionend is missed)
  useEffect(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    if (currentIndex >= 9 || currentIndex <= 5) {
      resetTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex((curr) => {
          if (curr >= 9) return curr - 3;
          if (curr <= 5) return curr + 3;
          return curr;
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsTransitioning(true);
          });
        });
      }, 460);
    }

    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [currentIndex]);

  // Absolute fallback guard: if index ever escapes safe bounds, instantly snap back
  useEffect(() => {
    if (currentIndex > 11 || currentIndex < 3) {
      setIsTransitioning(false);
      setCurrentIndex(6 + ((((currentIndex - 6) % 3) + 3) % 3));
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
        });
      });
    }
  }, [currentIndex]);

  // Page visibility: Pause autoplay when tab is hidden to prevent background queue buildup
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Autoplay (every 4.5 seconds, safely paused on hover, drag, or hidden tab)
  useEffect(() => {
    if (isPaused || isDragging) return;
    const interval = setInterval(() => {
      if (!document.hidden && !isAnimating.current) {
        handleNext();
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused, isDragging, handleNext]);

  // Unified Pointer Drag Handlers (works smoothly for both mouse and touch)
  const handlePointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    isPointerDown.current = true;
    dragStartX.current = e.clientX;
    dragCurrentX.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
    setIsPaused(true);
  };

  const handlePointerMove = (e) => {
    if (!isPointerDown.current) return;
    dragCurrentX.current = e.clientX;
    const delta = dragCurrentX.current - dragStartX.current;
    // Dampen drag distance so cards never slide out of view during gesture
    const clampedDelta = Math.max(-140, Math.min(140, delta));
    setDragOffset(clampedDelta);
  };

  const handlePointerUp = (e) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const delta = dragCurrentX.current - dragStartX.current;
    setIsDragging(false);
    setDragOffset(0);
    setIsPaused(false);

    if (delta < -40) {
      handleNext();
    } else if (delta > 40) {
      handlePrev();
    }
  };

  const handlePointerCancel = (e) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
    setDragOffset(0);
    setIsPaused(false);
  };

  // Dot Click: maps target 0, 1, 2 to sliding offset
  const activeDot = (((currentIndex - 6) % 3) + 3) % 3;
  const handleDotClick = (targetDot) => {
    if (isAnimating.current) return;
    const diff = targetDot - activeDot;
    if (diff !== 0) {
      isAnimating.current = true;
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + diff);
      setTimeout(() => {
        isAnimating.current = false;
      }, 460);
    }
  };

  // Transform calculation: strictly bounds viewport
  const transformStyle = isMobile
    ? `translateX(calc(-${currentIndex} * (100% + 16px) + ${dragOffset}px))`
    : `translateX(calc((1 - ${currentIndex}) * ((100% + 24px) / 3) + ${dragOffset}px))`;

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

        {/* Carousel Container with Arrows and Sliding Cards */}
        <div
          style={{
            position: 'relative',
            width: '100%',
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            if (!isPointerDown.current) setIsPaused(false);
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
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
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
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
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

          {/* Cards Viewport Window (overflow hidden clips sliding cards) */}
          <div
            style={{
              overflow: 'hidden',
              width: '100%',
              padding: '16px 0',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              touchAction: 'pan-y',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            {/* Smooth Sliding Track */}
            <div
              style={{
                display: 'flex',
                gap: isMobile ? '16px' : '24px',
                transform: transformStyle,
                transition:
                  isDragging || !isTransitioning
                    ? 'none'
                    : 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                willChange: 'transform',
              }}
            >
              {extendedTestimonials.map((item, idx) => {
                const isCenter = idx === currentIndex;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (!isDragging && idx !== currentIndex) {
                        setIsTransitioning(true);
                        setCurrentIndex(idx);
                      }
                    }}
                    className="story-card"
                    style={{
                      flex: isMobile ? '0 0 100%' : '0 0 calc((100% - 48px) / 3)',
                      maxWidth: isMobile ? '100%' : 'calc((100% - 48px) / 3)',
                      boxSizing: 'border-box',
                      backgroundColor: '#ffffff',
                      border: isCenter ? '2px solid #a7f3d0' : '1px solid #e5e7eb',
                      borderRadius: '20px',
                      padding: '30px 26px 26px',
                      boxShadow: isCenter
                        ? '0 12px 30px -4px rgba(38, 94, 56, 0.12)'
                        : '0 4px 18px rgba(0, 0, 0, 0.03)',
                      transform: isCenter ? 'scale(1.02)' : 'scale(0.98)',
                      transition:
                        'border 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '270px',
                      cursor: isCenter ? 'default' : 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCenter) {
                        e.currentTarget.style.borderColor = '#d1d5db';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.06)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCenter) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.03)';
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
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            userSelect: 'none',
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
                        userSelect: 'none',
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
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                            userSelect: 'none',
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
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next Testimonial"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
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
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
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
          {baseTestimonials.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleDotClick(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              style={{
                width: activeDot === idx ? '22px' : '7px',
                height: '7px',
                borderRadius: '4px',
                backgroundColor: activeDot === idx ? '#265e38' : '#cbd5e1',
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
          .story-card {
            min-height: 250px !important;
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

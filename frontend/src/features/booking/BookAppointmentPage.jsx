import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import bookingBannerClean from '../../assets/booking-banner-clean.jpg';
import confirmedIllustration from '../../assets/confirmed-illustration.png';
import appointmentApi from '../../api/appointmentApi';

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state initialized matching reference design (empty inputs with clean placeholders)
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    age: '',
    gender: '',
    city: '',
    reasonForVisit: '',
    selectedDay: 16,
    selectedMonth: 9, // 0-indexed: 9 = October
    selectedYear: 2026,
    selectedTimeSlot: '09:30 AM',
    appointmentId: 'APT-20261016-001',
  });

  const [errors, setErrors] = useState({});

  // Calendar view month & year state
  const [calendarMonth, setCalendarMonth] = useState(9); // October
  const [calendarYear, setCalendarYear] = useState(2026);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Time Slots list
  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '09:30 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: true },
    { time: '12:00 PM', available: true },
    { time: '12:30 PM', available: false }, // unavailable in design
    { time: '01:00 PM', available: true },
    { time: '04:00 PM', available: true },
    { time: '04:30 PM', available: true },
    { time: '05:00 PM', available: true },
    { time: '05:30 PM', available: true },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fullName') {
      // Rule 1: Limit 25 characters, only alphabetic characters and spaces
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
      if (/[^a-zA-Z\s]/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          fullName: 'Only alphabets and spaces are allowed',
        }));
      } else if (errors.fullName) {
        setErrors((prev) => ({ ...prev, fullName: '' }));
      }
      setFormData((prev) => ({ ...prev, fullName: cleaned }));
      return;
    }

    if (name === 'mobileNumber') {
      // Rule 2: Limit 10 digits, must start with 6, 7, 8, or 9
      let digits = value.replace(/\D/g, '');

      // In case full number with 91 is entered or pasted
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }

      if (/\D/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          mobileNumber: 'Only numbers are allowed',
        }));
      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {
        setErrors((prev) => ({
          ...prev,
          mobileNumber: 'Mobile number must start with 6, 7, 8, or 9',
        }));
        return;
      } else if (errors.mobileNumber) {
        setErrors((prev) => ({ ...prev, mobileNumber: '' }));
      }

      digits = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, mobileNumber: digits }));
      return;
    }

    if (name === 'email') {
      // Rule 3: Email format; no words or characters allowed after .com
      let val = value.replace(/\s/g, '');
      const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);
      if (comMatch) {
        val = comMatch[1];
        setErrors((prev) => ({
          ...prev,
          email: 'No words or characters allowed after .com',
        }));
      } else if (errors.email) {
        setErrors((prev) => ({ ...prev, email: '' }));
      }
      setFormData((prev) => ({ ...prev, email: val }));
      return;
    }

    if (name === 'reasonForVisit' && value.length > 500) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    // 1. Full Name Validation: non-empty, letters & spaces only, max 25 chars
    const nameTrimmed = (formData.fullName || '').trim();
    if (!nameTrimmed) {
      newErrors.fullName = 'Full Name is required';
    } else if (nameTrimmed.length > 25) {
      newErrors.fullName = 'Full Name cannot exceed 25 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      newErrors.fullName = 'Only alphabets and spaces are allowed';
    }

    // 2. Mobile Number Validation: exactly 10 digits, starts with 6, 7, 8, or 9
    const mobileDigits = (formData.mobileNumber || '').replace(/\D/g, '');
    if (!mobileDigits) {
      newErrors.mobileNumber = 'Whatsapp Mobile Number is required';
    } else if (mobileDigits.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(mobileDigits)) {
      newErrors.mobileNumber = 'Mobile number must start with 6, 7, 8, or 9';
    }

    // 3. Email Validation (if provided): proper email format ending in valid domain, no extra chars after .com
    const emailVal = (formData.email || '').trim();
    if (emailVal) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(emailVal)) {
        newErrors.email = 'Please enter a valid email address (e.g. name@example.com)';
      } else if (/\.com.+$/i.test(emailVal)) {
        newErrors.email = 'No words or characters allowed after .com';
      }
    }

    // 4. Age Validation
    if (!formData.age.toString().trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      newErrors.age = 'Enter a valid age (1 - 120)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e) => {
    if (e) e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        window.scrollTo({ top: 260, behavior: 'smooth' });
      }
    } else if (currentStep === 2) {
      // Book real appointment in backend to trigger notification
      const formattedDate = `${formData.selectedDay} ${months[formData.selectedMonth]} ${formData.selectedYear}`;
      appointmentApi.bookAppointment({
        patient_name: formData.fullName,
        patient_phone: formData.mobileNumber,
        patient_email: formData.email,
        appointment_date: formattedDate,
        time_slot: formData.selectedTimeSlot,
        reason_for_visit: formData.reasonForVisit || 'Homeopathic Consultation',
        consultation_type: 'In clinic Visit',
        status: 'Confirmed',
      }).catch((err) => console.error('Booking failed:', err));

      // Step 2 leads directly to the Confirmed Appointment UI
      setCurrentStep(3);
      window.scrollTo({ top: 260, behavior: 'smooth' });
    }
  };

  // Calendar Helpers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleSelectDate = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return;
    setFormData((prev) => ({
      ...prev,
      selectedDay: day,
      selectedMonth: calendarMonth,
      selectedYear: calendarYear,
    }));
  };

  // Generate calendar days for month view
  const generateCalendarDays = () => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        hasDot: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      // Days with availability dot like in design: 18-23, 26-30
      const hasDot = [18, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30].includes(i);
      days.push({
        day: i,
        isCurrentMonth: true,
        hasDot,
      });
    }

    // Next month filler days to complete grid (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        hasDot: false,
      });
    }

    return days;
  };

  const formatSelectedFullDate = () => {
    const d = new Date(formData.selectedYear, formData.selectedMonth, formData.selectedDay);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = months[formData.selectedMonth];
    return `${dayName}, ${formData.selectedDay} ${monthName} ${formData.selectedYear}`;
  };

  // Handle PDF Download / Print
  const handleDownloadPdf = () => {
    window.print();
  };

  // Handle WhatsApp action
  const handleWhatsappSend = () => {
    const text = encodeURIComponent(
      `Hello Dr. Kumar Tripathi Ampeh Clinic, my appointment is confirmed with ID: ${formData.appointmentId} for ${formatSelectedFullDate()} at ${formData.selectedTimeSlot}.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  return (
    <div style={{ backgroundColor: '#f8faf9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        onOpenBooking={() => {
          const formEl = document.getElementById('booking-form-section');
          if (formEl) {
            formEl.scrollIntoView({ behavior: 'smooth' });
          } else {
            window.scrollTo({ top: 280, behavior: 'smooth' });
          }
        }}
      />

      {/* Div 1: Hero Header Banner with Sleek Compact Height matching Reference Image */}
      <section
        aria-label="Book Your Appointment"
        className="booking-hero-banner"
        style={{
          position: 'relative',
          width: '100%',
          height: 'clamp(220px, 18vw, 275px)',
          backgroundColor: '#143420',
          overflow: 'hidden',
          display: 'block',
          margin: 0,
          padding: 0,
        }}
      >
        {/* Banner Background Image with exact framing matching reference */}
        <img
          src={bookingBannerClean}
          alt=""
          aria-hidden="true"
          className="booking-hero-banner-image"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'right center',
            display: 'block',
            margin: 0,
            padding: 0,
          }}
        />

        {/* Soft, light gradient overlay: luminous and natural without heavy dark shadow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(90deg, rgba(16, 46, 26, 0.52) 0%, rgba(16, 46, 26, 0.28) 26%, rgba(16, 46, 26, 0.06) 40%, rgba(16, 46, 26, 0) 52%)',
            pointerEvents: 'none',
          }}
        />

        {/* Real HTML Text Layer placed over the soft green bokeh area */}
        <div
          className="booking-banner-content-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            lineHeight: '1.2',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '0 40px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                maxWidth: '650px',
                pointerEvents: 'auto',
              }}
            >
              <h1
                className="booking-banner-title"
                style={{
                  fontSize: 'clamp(22px, 2.4vw, 36px)',
                  fontWeight: '800',
                  color: '#ffffff',
                  lineHeight: '1.18',
                  letterSpacing: '-0.3px',
                  margin: '0 0 8px 0',
                  fontFamily: "'Manrope', sans-serif",
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
                }}
              >
                Book Your Appointment
              </h1>
              <p
                className="booking-banner-subtitle"
                style={{
                  fontSize: 'clamp(12px, 1.05vw, 15px)',
                  color: '#e2fbe8',
                  fontWeight: '500',
                  lineHeight: '1.45',
                  margin: 0,
                  fontFamily: "'Manrope', sans-serif",
                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                Schedule your consultation with Dr. K. Tripathi Ampeh (Pat.).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Expanded layout covering LHS & RHS nicely */}
      <div
        id="booking-form-section"
        className="booking-main-content"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '44px 36px 80px',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.95fr) minmax(340px, 1.05fr)',
            gap: '32px',
            alignItems: 'start',
          }}
          className="booking-grid"
        >
          {/* Left Column: Multi-Step Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              padding: currentStep === 3 ? '40px 36px 36px' : '38px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
              border: '1px solid #edf2ee',
            }}
          >
            {/* Step Indicators (shown on Step 1 & 2) */}
            {currentStep < 3 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '36px',
                  paddingBottom: '24px',
                  borderBottom: '1px solid #f1f5f2',
                }}
              >
                {/* Step 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                    }}
                  >
                    1
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: currentStep === 1 ? '700' : '600',
                      color: currentStep === 1 ? '#111827' : '#374151',
                    }}
                  >
                    Patient Details
                  </span>
                </div>

                {/* Line 1 */}
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep >= 2 ? '#1b4332' : '#e5e7eb',
                    margin: '0 16px',
                  }}
                />

                {/* Step 2 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: currentStep >= 2 ? '#1b4332' : '#ffffff',
                      color: currentStep >= 2 ? '#ffffff' : '#6b7280',
                      border: currentStep >= 2 ? 'none' : '1.5px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                    }}
                  >
                    2
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: currentStep === 2 ? '700' : '500',
                      color: currentStep === 2 ? '#111827' : '#6b7280',
                    }}
                  >
                    Select Date & Time
                  </span>
                </div>

                {/* Line 2 */}
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    backgroundColor: currentStep >= 3 ? '#1b4332' : '#e5e7eb',
                    margin: '0 16px',
                  }}
                />

                {/* Step 3 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: currentStep >= 3 ? '#1b4332' : '#ffffff',
                      color: currentStep >= 3 ? '#ffffff' : '#6b7280',
                      border: currentStep >= 3 ? 'none' : '1.5px solid #d1d5db',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: '700',
                    }}
                  >
                    3
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: currentStep === 3 ? '700' : '500',
                      color: currentStep === 3 ? '#111827' : '#6b7280',
                    }}
                  >
                    Confirm Appointment
                  </span>
                </div>
              </div>
            )}

            {/* ================= STEP 1: Patient Information ================= */}
            {currentStep === 1 && (
              <form onSubmit={handleNextStep}>
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>
                    Patient Information
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    Please enter your basic details to book an appointment.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Full Name */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <span style={{ fontSize: '12px', color: (formData.fullName || '').length >= 25 ? '#ef4444' : '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>
                        {(formData.fullName || '').length}/25
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        maxLength={25}
                        placeholder="Enter your full name"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: errors.fullName ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = errors.fullName ? '#ef4444' : '#e2e8f0')}
                      />
                    </div>
                    {errors.fullName && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.fullName}</p>}
                  </div>

                  {/* Whatsapp Mobile Number */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Whatsapp Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <span style={{ fontSize: '12px', color: (formData.mobileNumber || '').length === 10 ? '#16a34a' : '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>
                        {(formData.mobileNumber || '').length}/10 digits
                      </span>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      </span>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        maxLength={10}
                        placeholder="Starts with 6, 7, 8 or 9"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: errors.mobileNumber ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = errors.mobileNumber ? '#ef4444' : '#e2e8f0')}
                      />
                    </div>
                    {errors.mobileNumber && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.mobileNumber}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Email Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Email Address <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: errors.email ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0')}
                      />
                    </div>
                    {errors.email && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.email}</p>}
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Age <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </span>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Enter your age"
                        min="1"
                        max="120"
                        style={{
                          width: '100%',
                          padding: '11px 64px 11px 40px',
                          borderRadius: '10px',
                          border: errors.age ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = errors.age ? '#ef4444' : '#e2e8f0')}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '16px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '13px',
                          color: '#9ca3af',
                          pointerEvents: 'none',
                        }}
                      >
                        years
                      </span>
                    </div>
                    {errors.age && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.age}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  {/* Gender */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Gender <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                        </svg>
                      </span>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 36px 11px 40px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: formData.gender ? '#111827' : '#9ca3af',
                          backgroundColor: '#ffffff',
                          appearance: 'none',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      City <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </span>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Enter your city"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.2s',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Reason for Visit <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    <textarea
                      name="reasonForVisit"
                      value={formData.reasonForVisit}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Briefly mention your health concern (optional)"
                      style={{
                        width: '100%',
                        padding: '12px 14px 28px 40px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        outline: 'none',
                        color: '#111827',
                        backgroundColor: '#ffffff',
                        resize: 'none',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#265e38')}
                      onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '14px',
                        bottom: '10px',
                        fontSize: '12px',
                        color: '#9ca3af',
                      }}
                    >
                      {formData.reasonForVisit.length}/500
                    </span>
                  </div>
                </div>

                {/* Bottom Bar: Security & Next Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f2',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      borderRadius: '12px',
                      padding: '10px 18px',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#16a34a"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <h5 style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        Your information is secure
                      </h5>
                      <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0 0 0' }}>
                        We keep your personal information private and secure.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#265e38',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '13px 32px',
                      fontSize: '14.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(38, 94, 56, 0.25)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f4e2e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#265e38')}
                  >
                    Next Step <span>→</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 2: Select Date & Time ================= */}
            {currentStep === 2 && (
              <div>
                <div style={{ marginBottom: '28px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>
                    Select Date & Time
                  </h2>
                  <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                    Choose a convenient date and time for your consultation.
                  </p>
                </div>

                {/* Two Panels: Calendar on Left, Time Slots on Right */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.25fr)',
                    gap: '24px',
                    marginBottom: '32px',
                  }}
                  className="step2-split-grid"
                >
                  {/* Left Box: Calendar Widget */}
                  <div
                    style={{
                      border: '1px solid #eef2ef',
                      borderRadius: '16px',
                      padding: '20px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {/* Month Navigator Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '18px',
                        padding: '0 4px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#6b7280',
                          padding: '4px 8px',
                        }}
                        aria-label="Previous Month"
                      >
                        ‹
                      </button>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        {months[calendarMonth]} {calendarYear}
                      </h3>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '18px',
                          color: '#6b7280',
                          padding: '4px 8px',
                        }}
                        aria-label="Next Month"
                      >
                        ›
                      </button>
                    </div>

                    {/* Weekday Names */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '12px',
                      }}
                    >
                      {daysOfWeek.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    {/* Calendar Days Matrix */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                      }}
                    >
                      {generateCalendarDays().map((item, idx) => {
                        const isSelected =
                          item.isCurrentMonth &&
                          item.day === formData.selectedDay &&
                          calendarMonth === formData.selectedMonth &&
                          calendarYear === formData.selectedYear;

                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectDate(item.day, item.isCurrentMonth)}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '38px',
                              cursor: item.isCurrentMonth ? 'pointer' : 'default',
                              userSelect: 'none',
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: isSelected ? '700' : '500',
                                backgroundColor: isSelected ? '#1b4332' : 'transparent',
                                color: isSelected
                                  ? '#ffffff'
                                  : item.isCurrentMonth
                                  ? '#111827'
                                  : '#cbd5e1',
                                transition: 'all 0.15s',
                              }}
                            >
                              {item.day}
                            </div>
                            {item.hasDot && !isSelected && (
                              <span
                                style={{
                                  width: '3.5px',
                                  height: '3.5px',
                                  borderRadius: '50%',
                                  backgroundColor: '#1b4332',
                                  marginTop: '2px',
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend: Available / Not Available */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        marginTop: '22px',
                        paddingTop: '16px',
                        borderTop: '1px solid #f1f5f2',
                        fontSize: '12px',
                        color: '#6b7280',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b4332' }} />
                        <span>Available</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                        <span>Not Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Available Time Slots */}
                  <div
                    style={{
                      border: '1px solid #eef2ef',
                      borderRadius: '16px',
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Slots Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '18px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >
                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                          Available Time Slots
                        </h3>
                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                          {formatSelectedFullDate()}
                        </span>
                      </div>

                      {/* 3 Columns Time Slots Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '10px',
                          marginBottom: '20px',
                        }}
                      >
                        {timeSlots.map((slot, index) => {
                          const isSelected = formData.selectedTimeSlot === slot.time && slot.available;
                          const isUnavailable = !slot.available;

                          return (
                            <button
                              key={index}
                              type="button"
                              disabled={isUnavailable}
                              onClick={() => setFormData((p) => ({ ...p, selectedTimeSlot: slot.time }))}
                              style={{
                                padding: '10px 6px',
                                borderRadius: '8px',
                                border: isSelected
                                  ? '1.5px solid #1b4332'
                                  : isUnavailable
                                  ? '1px solid #f1f5f9'
                                  : '1px solid #e2e8f0',
                                backgroundColor: isSelected
                                  ? '#1b4332'
                                  : isUnavailable
                                  ? '#f8fafc'
                                  : '#ffffff',
                                color: isSelected
                                  ? '#ffffff'
                                  : isUnavailable
                                  ? '#94a3b8'
                                  : '#374151',
                                fontSize: '13px',
                                fontWeight: isSelected ? '700' : '500',
                                cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                              }}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Selected Slot Information Pill */}
                    <div
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #dcfce7',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                        }}
                      >
                        ℹ
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534', display: 'block' }}>
                          Selected Slot
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#14532d' }}>
                          {formatSelectedFullDate()} at {formData.selectedTimeSlot}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Back & Next Step Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '20px',
                    borderTop: '1px solid #f1f5f2',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '10px 22px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(27, 67, 50, 0.25)',
                    }}
                  >
                    Next Step <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: YOUR APPOINTMENT IS CONFIRMED! (EXACT MATCHING UI) ================= */}
            {currentStep === 3 && (
              <div>
                {/* Top 3D Calendar & Remedies Illustration */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <img
                    src={confirmedIllustration}
                    alt="Appointment Confirmed"
                    style={{
                      maxWidth: '240px',
                      height: 'auto',
                      display: 'inline-block',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                {/* Heading & Subtitle */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <h2
                    style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#111827',
                      margin: '0 0 10px 0',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    Your Appointment is Confirmed!
                  </h2>
                  <p
                    style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      margin: 0,
                    }}
                  >
                    Thank you for choosing Dr. Kumar Tripathi Ampeh (Pat.).<br />
                    We look forward to seeing you at the clinic.
                  </p>
                </div>

                {/* Appointment Details Card */}
                <div
                  style={{
                    backgroundColor: '#f8faf9',
                    border: '1px solid #edf2ee',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    marginBottom: '20px',
                  }}
                >
                  {/* Header Row: Title & Confirmed Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#e8f5e9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#2e7d32',
                          fontSize: '16px',
                        }}
                      >
                        📅
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        Appointment Details
                      </h3>
                    </div>

                    <span
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      Confirmed
                    </span>
                  </div>

                  {/* 2-Columns Details Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.15fr 1fr',
                      rowGap: '16px',
                      columnGap: '24px',
                      fontSize: '14px',
                    }}
                  >
                    {/* Row 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>🪪</span>
                      <span style={{ color: '#6b7280', minWidth: '115px' }}>Appointment ID</span>
                      <strong style={{ color: '#111827' }}>{formData.appointmentId}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>👨‍⚕️</span>
                      <span style={{ color: '#6b7280', minWidth: '70px' }}>Doctor</span>
                      <strong style={{ color: '#111827' }}>Dr. K. Tripathi Ampeh (Pat.)</strong>
                    </div>

                    {/* Row 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>👤</span>
                      <span style={{ color: '#6b7280', minWidth: '115px' }}>Patient Name</span>
                      <strong style={{ color: '#111827' }}>{formData.fullName}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>⚙️</span>
                      <span style={{ color: '#6b7280', minWidth: '70px' }}>Service</span>
                      <strong style={{ color: '#111827' }}>Homeopathy Consultation</strong>
                    </div>

                    {/* Row 3 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>📞</span>
                      <span style={{ color: '#6b7280', minWidth: '115px' }}>Mobile Number</span>
                      <strong style={{ color: '#111827' }}>{formData.mobileNumber}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>📅</span>
                      <span style={{ color: '#6b7280', minWidth: '70px' }}>Date</span>
                      <strong style={{ color: '#111827' }}>{formatSelectedFullDate()}</strong>
                    </div>

                    {/* Row 4 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>✉️</span>
                      <span style={{ color: '#6b7280', minWidth: '115px' }}>Email</span>
                      <strong style={{ color: '#111827' }}>{formData.email}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px' }}>🕒</span>
                      <span style={{ color: '#6b7280', minWidth: '70px' }}>Time</span>
                      <strong style={{ color: '#111827' }}>{formData.selectedTimeSlot}</strong>
                    </div>

                    {/* Row 5: Clinic Address */}
                    <div style={{ display: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <span style={{ color: '#9ca3af', fontSize: '15px', marginTop: '2px' }}>📍</span>
                      <span style={{ color: '#6b7280', minWidth: '95px' }}>Clinic Address</span>
                      <strong style={{ color: '#111827', lineHeight: '1.4' }}>
                        123 Clinic Street, Your City,<br />
                        Your State - 123456
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Important Note Box */}
                <div
                  style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#dcfce7',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  >
                    ℹ
                  </div>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: '0 0 2px 0' }}>
                      Important Note
                    </h5>
                    <p style={{ fontSize: '12px', color: '#15803d', margin: 0, lineHeight: '1.5' }}>
                      Please arrive 5-10 minutes before your appointment time. If you need to reschedule or cancel, please contact us in advance.
                    </p>
                  </div>
                </div>

                {/* Bottom 3 Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Button 1: Download Confirmation (PDF) */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <span>📥</span>
                    Download Confirmation (PDF)
                  </button>

                  {/* Button 2: Send Prescription through Whatsapp */}
                  <button
                    type="button"
                    onClick={handleWhatsappSend}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <span>💬</span>
                    Send Prescription through Whatsapp
                  </button>

                  {/* Button 3: Back to Home */}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 22px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginLeft: 'auto',
                      boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#143527')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
                  >
                    <span>🏠</span>
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: 4 Information Cards (Exact match to reference design) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Card 1: Homeopathy Consultation */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '26px 24px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#265e38',
                    flexShrink: 0,
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Homeopathy Consultation
                  </h3>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '3px 0 0' }}>
                    DR. KUMAR TRIPATHI AMPEH (PAT.)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  'Personalized consultation',
                  'Natural and holistic approach',
                  'Detailed discussion of your health concerns',
                  'Customized homeopathic treatment',
                  'Follow-up guidance',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#4b5563' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#ecfdf5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Clinic Timings */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#265e38',
                    flexShrink: 0,
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Clinic Timings
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '10px' }}>
                <span style={{ color: '#4b5563' }}>Monday – Saturday</span>
                <strong style={{ color: '#111827', fontWeight: '700' }}>9:00 AM – 6:00 PM</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#4b5563' }}>Sunday</span>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>Closed</span>
              </div>
            </div>

            {/* Card 3: Clinic Address */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#265e38',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Clinic Address
                  </h4>
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#265e38',
                    backgroundColor: '#ecfdf5',
                    padding: '5px 12px',
                    borderRadius: '9999px',
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d1fae5')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                >
                  View on Map
                </a>
              </div>

              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
                123 Clinic Street, Your City,<br />
                Your State – 123456
              </p>
            </div>

            {/* Card 4: Need Help? */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '12px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#265e38',
                    flexShrink: 0,
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Need Help?
                </h4>
              </div>

              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0' }}>
                Feel free to contact us for any assistance.
              </p>

              <a
                href="tel:+919876543210"
                style={{
                  fontSize: '16.5px',
                  fontWeight: '800',
                  color: '#265e38',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                +91 98765 43210
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Div 3: Bottom Footer Bar (Exact match to reference design) */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          padding: '28px 0',
          marginTop: 'auto',
          width: '100%',
        }}
      >
        <div
          className="booking-footer-inner"
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Left: Copyright Notice */}
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              color: '#6b7280',
              fontFamily: "'Manrope', sans-serif",
              lineHeight: '1.5',
            }}
          >
            © 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.
          </p>

          {/* Right: Policy & Support Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >
            <a
              href="#privacy"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              Terms of Consultation
            </a>
            <a
              href="#support"
              style={{
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '13.5px',
                fontFamily: "'Manrope', sans-serif",
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              Contact Support
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 1024px) {
          .booking-main-content {
            padding: 36px 24px 60px !important;
          }
        }
        @media (max-width: 900px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
          }
          .step2-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .booking-main-content {
            padding: 24px 16px 50px !important;
          }
          .booking-hero-banner-image {
            min-height: 160px !important;
            object-fit: cover !important;
            object-position: 70% center !important;
          }
          .booking-banner-title {
            font-size: 24px !important;
          }
          .booking-banner-subtitle {
            font-size: 13px !important;
          }
          .booking-footer-inner {
            padding: 0 20px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookAppointmentPage;

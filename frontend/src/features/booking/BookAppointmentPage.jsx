import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import bookingBannerBg from '../../assets/booking-banner-bg.jpg';
import confirmedIllustration from '../../assets/confirmed-illustration.png';

const BookAppointmentPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form state initialized with realistic clinic appointment defaults
  const [formData, setFormData] = useState({
    fullName: 'Rahul Sharma',
    mobileNumber: '+91 98765 43210',
    email: 'rahul.sharma@gmail.com',
    age: '28',
    gender: 'Male',
    city: 'Your City',
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
    if (name === 'reasonForVisit' && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.mobileNumber.trim())) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }
    if (!formData.age.toString().trim()) {
      newErrors.age = 'Age is required';
    } else if (isNaN(formData.age) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      newErrors.age = 'Enter a valid age';
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
      <Navbar onOpenBooking={() => window.scrollTo({ top: 260, behavior: 'smooth' })} />

      {/* Hero Header Banner */}
      <div
        style={{
          position: 'relative',
          backgroundImage: `url(${bookingBannerBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '220px',
          display: 'flex',
          alignItems: 'center',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Dark Emerald Overlay for Readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(90deg, rgba(14, 38, 24, 0.96) 0%, rgba(14, 38, 24, 0.88) 45%, rgba(14, 38, 24, 0.3) 80%, rgba(14, 38, 24, 0.1) 100%)',
            zIndex: 1,
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2, padding: '36px 24px' }}>
          <h1
            style={{
              fontSize: '44px',
              fontWeight: '800',
              lineHeight: '1.2',
              color: '#ffffff',
              letterSpacing: '-0.5px',
              marginBottom: '8px',
            }}
          >
            Book Your Appointment
          </h1>
          <p style={{ fontSize: '16px', color: '#e2e8f0', margin: 0 }}>
            Schedule your consultation with Dr. K. Tripathi Ampeh (Pat.).
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ padding: '48px 24px 80px', flex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.9fr) minmax(300px, 1fr)',
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
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        👤
                      </span>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
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
                        }}
                      />
                    </div>
                    {errors.fullName && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.fullName}</p>}
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        📞
                      </span>
                      <input
                        type="tel"
                        name="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        placeholder="Enter your mobile number"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: errors.mobileNumber ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                        }}
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
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        ✉️
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: '#111827',
                          backgroundColor: '#ffffff',
                        }}
                      />
                    </div>
                  </div>

                  {/* Age */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      Age <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        📅
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
                        }}
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
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        👥
                      </span>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '11px 14px 11px 40px',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          outline: 'none',
                          color: formData.gender ? '#111827' : '#9ca3af',
                          backgroundColor: '#ffffff',
                          appearance: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af', fontSize: '11px' }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                      City <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '15px' }}>
                        📍
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
                        }}
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
                    <span style={{ position: 'absolute', left: '14px', top: '14px', color: '#9ca3af', fontSize: '15px' }}>
                      📝
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
                      }}
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
                    <span
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#16a34a',
                      }}
                    >
                      🔒
                    </span>
                    <div>
                      <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#166534', margin: 0 }}>
                        Your information is secure
                      </h5>
                      <p style={{ fontSize: '12px', color: '#15803d', margin: '2px 0 0 0' }}>
                        We keep your personal information private and secure.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '13px 32px',
                      fontSize: '15px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(27, 67, 50, 0.25)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#143527')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
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

          {/* Right Column: 4 Information Cards (Exact as in image) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Card 1: Homeopathy Consultation */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    fontSize: '18px',
                  }}
                >
                  📅
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Homeopathy Consultation
                  </h3>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '2px 0 0' }}>
                    DR. KUMAR TRIPATHI AMPEH (PAT.)
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  'Personalized consultation',
                  'Natural and holistic approach',
                  'Detailed discussion of your health concerns',
                  'Customized homeopathic treatment',
                  'Follow-up guidance',
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#4b5563' }}>
                    <span style={{ color: '#16a34a', fontWeight: '700' }}>✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 2: Clinic Timings */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    fontSize: '15px',
                  }}
                >
                  🕒
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Clinic Timings
                </h4>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', marginBottom: '10px' }}>
                <span style={{ color: '#4b5563' }}>Monday - Saturday</span>
                <strong style={{ color: '#111827' }}>9:00 AM - 6:00 PM</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#4b5563' }}>Sunday</span>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>Closed</span>
              </div>
            </div>

            {/* Card 3: Clinic Address */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '15px',
                    }}
                  >
                    📍
                  </div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Clinic Address
                  </h4>
                </div>
                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#2e7d32',
                    textDecoration: 'none',
                  }}
                >
                  View on Map
                </a>
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                123 Clinic Street, Your City,<br />
                Your State - 123456
              </p>
            </div>

            {/* Card 4: Need Help? */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
                border: '1px solid #edf2ee',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    fontSize: '15px',
                  }}
                >
                  💬
                </div>
                <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Need Help?
                </h4>
              </div>

              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0' }}>
                Feel free to contact us for any assistance.
              </p>

              <a
                href="tel:+919876543210"
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: '#111827',
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

      {/* Booking Page Specific Light Footer (as shown in image) */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #edf2ee',
          padding: '24px 0',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p style={{ margin: 0 }}>
            © 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Consultation</a>
            <a href="#support" style={{ color: '#6b7280', textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
          }
          .step2-split-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookAppointmentPage;

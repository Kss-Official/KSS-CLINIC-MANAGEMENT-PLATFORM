import React, { useState, useEffect } from 'react';
import appointmentApi from '../../api/appointmentApi';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';

// Validation and formatting helper utilities for Settings form
const extract10Digits = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

const formatWithCountryCode = (digits) => {
  if (!digits) return '';
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+91 ${digits}`;
};

const validateClinicName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return 'Clinic Name is required.';
  }
  if (name.length > 35) {
    return 'Clinic Name must not exceed 35 characters.';
  }
  return '';
};

const validateDoctorName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return 'Doctor Name is required.';
  }
  if (!/^[A-Za-z\s.()]+$/.test(name)) {
    return 'Doctor Name can only contain letters, spaces, dots (.), and parentheses ( ).';
  }
  if (name.length > 35) {
    return 'Doctor Name must not exceed 35 characters.';
  }
  return '';
};

const validateEmail = (email) => {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return 'Email address is required.';
  }
  // Once the user enters .com, no additional characters should be allowed.
  const comIndex = trimmed.indexOf('.com');
  if (comIndex !== -1 && comIndex + 4 < trimmed.length) {
    return 'No characters are allowed after .com in the email address.';
  }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return '';
};

const validateMobileNumber = (digits, isRequired = true) => {
  if (!digits) {
    return isRequired ? 'Contact number is required.' : '';
  }
  if (!/^\d+$/.test(digits)) {
    return 'Mobile number must contain only digits.';
  }
  if (!['6', '7', '8', '9'].includes(digits[0])) {
    return 'Mobile number must start with 6, 7, 8, or 9.';
  }
  if (digits.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  return '';
};

const SettingsPage = () => {
    // 1. Clinic Information State (Initializes from saved localStorage or default)
  const [clinicInfo, setClinicInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_info_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clinicName: 'HOMEOPATHY CLINIC',
      doctorName: 'Dr. Kumar Tripathi Ampeh (Pat.)',
      contactNumber: '+91 98765 43210',
      alternateNumber: '+91 99887 66554',
      email: 'clinic.tripathi@gmail.com',
      address: '12, Green Park, MG Road, Bangalore, Karnataka - 560001',
    };
  });

  // Fetch clinic settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await appointmentApi.getClinicSettings();
        if (data && (data.clinicName || data.doctorName)) {
          setClinicInfo(data);
          try {
            localStorage.setItem('clinic_info_settings', JSON.stringify(data));
          } catch {}
        }
      } catch (err) {
        // Fall back gracefully to localStorage or defaults
        console.log('Loading local clinic settings...');
      }
    };
    fetchSettings();
  }, []);

  // 2. Appointment Settings State
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [consultationHours, setConsultationHours] = useState('09:00 AM - 06:00 PM');
  const [slotDuration, setSlotDuration] = useState('30 Minutes');

  // 3. Notification Settings State
  const [notifications, setNotifications] = useState({
    newAppointment: true,
    appointmentReminder: true,
    prescriptionUpdates: true,
    followUpReminder: true,
  });
  const [notificationChannels, setNotificationChannels] = useState({
    whatsapp: true,
    email: true,
    sms: false,
  });

  // Modal Open States
  const [editClinicModalOpen, setEditClinicModalOpen] = useState(false);
  const [editAppointmentModalOpen, setEditAppointmentModalOpen] = useState(false);
  const [editNotificationModalOpen, setEditNotificationModalOpen] = useState(false);

  // Draft States for editing
  const [draftClinicInfo, setDraftClinicInfo] = useState({ ...clinicInfo });
  const [draftContactDigits, setDraftContactDigits] = useState('9876543210');
  const [draftAlternateDigits, setDraftAlternateDigits] = useState('9988766554');
  const [formErrors, setFormErrors] = useState({});
  const [draftWorkingDays, setDraftWorkingDays] = useState([...workingDays]);
  const [draftStartHour, setDraftStartHour] = useState('09:00 AM');
  const [draftEndHour, setDraftEndHour] = useState('06:00 PM');
  const [draftSlotDuration, setDraftSlotDuration] = useState(slotDuration);
  const [draftNotifications, setDraftNotifications] = useState({ ...notifications });
  const [draftChannels, setDraftChannels] = useState({ ...notificationChannels });

  // Success Toast Banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const isAnySettingsModalOpen =
    editClinicModalOpen || editAppointmentModalOpen || editNotificationModalOpen;

  // Background Scroll Lock & ESC listener
  useEffect(() => {
    if (isAnySettingsModalOpen) {
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

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setEditClinicModalOpen(false);
          setEditAppointmentModalOpen(false);
          setEditNotificationModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      };
    }
  }, [isAnySettingsModalOpen]);

  // Handlers for Clinic Info
  const handleOpenClinicModal = () => {
    setDraftClinicInfo({ ...clinicInfo });
    setDraftContactDigits(extract10Digits(clinicInfo.contactNumber));
    setDraftAlternateDigits(extract10Digits(clinicInfo.alternateNumber));
    setFormErrors({});
    setEditClinicModalOpen(true);
  };

    const handleClinicNameChange = (e) => {
    const raw = e.target.value;
    // Maximum length 35 characters
    const filtered = raw.slice(0, 35);
    setDraftClinicInfo((prev) => ({ ...prev, clinicName: filtered }));
    if (formErrors.clinicName) {
      setFormErrors((prev) => ({ ...prev, clinicName: validateClinicName(filtered) }));
    }
  };

  const handleDoctorNameChange = (e) => {
    const raw = e.target.value;
    // Allow letters, spaces, dots (.), and parentheses ( ), max 35 characters
    const filtered = raw.replace(/[^a-zA-Z\s.()]/g, '').slice(0, 35);
    setDraftClinicInfo((prev) => ({ ...prev, doctorName: filtered }));
    if (formErrors.doctorName) {
      setFormErrors((prev) => ({ ...prev, doctorName: validateDoctorName(filtered) }));
    }
  };

  const handleEmailChange = (e) => {
    let val = e.target.value.toLowerCase();
    // Once the user enters .com, no additional characters should be allowed.
    // Prevent typing or pasting anything after .com
    const comIndex = val.indexOf('.com');
    if (comIndex !== -1) {
      val = val.slice(0, comIndex + 4);
    }
    setDraftClinicInfo((prev) => ({ ...prev, email: val }));
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handleEmailKeyDown = (e) => {
    // Allow navigation/control keys: Backspace, Delete, Tab, Arrow keys, Enter, Ctrl/Cmd shortcuts
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }

    const currentVal = (draftClinicInfo.email || '').toLowerCase();
    const comIndex = currentVal.indexOf('.com');
    if (comIndex !== -1) {
      const selStart = e.target.selectionStart;
      // If typing at or after .com, prevent typing any additional characters
      if (selStart >= comIndex + 4) {
        e.preventDefault();
      }
    }
  };

  const handleContactNumberChange = (e) => {
    // Only numbers, max 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDraftContactDigits(digits);
    if (formErrors.contactNumber) {
      setFormErrors((prev) => ({ ...prev, contactNumber: validateMobileNumber(digits, true) }));
    }
  };

  const handleAlternateNumberChange = (e) => {
    // Only numbers, max 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDraftAlternateDigits(digits);
    if (formErrors.alternateNumber) {
      setFormErrors((prev) => ({ ...prev, alternateNumber: validateMobileNumber(digits, false) }));
    }
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setDraftClinicInfo((prev) => ({ ...prev, address: val }));
    if (formErrors.address && val.trim()) {
      setFormErrors((prev) => ({ ...prev, address: '' }));
    }
  };

  const handleSaveClinicInfo = (e) => {
    e.preventDefault();

    const errors = {
      clinicName: validateClinicName(draftClinicInfo.clinicName),
      doctorName: validateDoctorName(draftClinicInfo.doctorName),
      email: validateEmail(draftClinicInfo.email),
      contactNumber: validateMobileNumber(draftContactDigits, true),
      alternateNumber: validateMobileNumber(draftAlternateDigits, false),
      address: draftClinicInfo.address?.trim() ? '' : 'Address is required.',
    };

    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    const updated = {
      clinicName: draftClinicInfo.clinicName.trim(),
      doctorName: draftClinicInfo.doctorName.trim(),
      contactNumber: formatWithCountryCode(draftContactDigits),
      alternateNumber: draftAlternateDigits ? formatWithCountryCode(draftAlternateDigits) : '',
      email: draftClinicInfo.email.trim(),
      address: draftClinicInfo.address.trim(),
    };

    setClinicInfo(updated);
    try {
      localStorage.setItem('clinic_info_settings', JSON.stringify(updated));
    } catch {}

    // Persist to backend API with validation feedback
    appointmentApi.updateClinicSettings(updated).catch((err) => {
      console.warn('Backend settings sync notice:', err);
    });

    setEditClinicModalOpen(false);
    showToast('Clinic Information updated successfully!');
  };

  // Handlers for Appointment Settings
  const handleOpenAppointmentModal = () => {
    setDraftWorkingDays([...workingDays]);
    const parts = consultationHours.split(' - ');
    setDraftStartHour(parts[0] || '09:00 AM');
    setDraftEndHour(parts[1] || '06:00 PM');
    setDraftSlotDuration(slotDuration);
    setEditAppointmentModalOpen(true);
  };

  const toggleDraftDay = (day) => {
    if (draftWorkingDays.includes(day)) {
      setDraftWorkingDays(draftWorkingDays.filter((d) => d !== day));
    } else {
      setDraftWorkingDays([...draftWorkingDays, day]);
    }
  };

  const handleSaveAppointmentSettings = (e) => {
    e.preventDefault();
    setWorkingDays([...draftWorkingDays]);
    setConsultationHours(`${draftStartHour} - ${draftEndHour}`);
    setSlotDuration(draftSlotDuration);
    setEditAppointmentModalOpen(false);
    showToast('Appointment settings saved successfully!');
  };

  // Handlers for Notification Settings
  const handleOpenNotificationModal = () => {
    setDraftNotifications({ ...notifications });
    setDraftChannels({ ...notificationChannels });
    setEditNotificationModalOpen(true);
  };

  const handleSaveNotificationSettings = (e) => {
    e.preventDefault();
    setNotifications({ ...draftNotifications });
    setNotificationChannels({ ...draftChannels });
    setEditNotificationModalOpen(false);
    showToast('Notification settings saved successfully!');
  };

  const toggleDay = (day) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#1e4620',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Settings Banner */}
      <div
        style={{
          backgroundColor: '#eaf5ed',
          borderRadius: '20px',
          padding: '0 40px',
          height: '148px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#0a1c2a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            Settings
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            Manage your clinic details, appointments, notification, account and security in one place.
          </p>
        </div>

        {/* Herbal Mortar Illustration */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <img
            src={bannerHerbsImg}
            alt="Herbal Medicine"
            style={{
              height: '148px',
              maxHeight: '100%',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
              objectPosition: 'bottom right',
            }}
          />
        </div>
      </div>

      {/* Card 1: Clinic Information */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '26px 28px', border: '1px solid #f1f5f9', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e8f5ec', color: '#265e38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="9" y1="22" x2="9" y2="22.01" />
                <line x1="15" y1="22" x2="15" y2="22.01" />
                <line x1="9" y1="6" x2="9" y2="6.01" />
                <line x1="15" y1="6" x2="15" y2="6.01" />
                <line x1="9" y1="10" x2="9" y2="10.01" />
                <line x1="15" y1="10" x2="15" y2="10.01" />
                <line x1="9" y1="14" x2="9" y2="14.01" />
                <line x1="15" y1="14" x2="15" y2="14.01" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Clinic Information</h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Update your clinic details and contact information.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenClinicModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ✏️ Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>CLINIC NAME</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.clinicName}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>DOCTOR NAME</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.doctorName}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>CONTACT NUMBER</div>
            <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.contactNumber}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ALTERNATE NUMBER</div>
            <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.alternateNumber}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>EMAIL ADDRESS</div>
            <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>ADDRESS</div>
            <div style={{ fontSize: '14px', color: '#0f172a', marginTop: '4px' }}>{clinicInfo.address}</div>
          </div>
        </div>
      </div>

      {/* Card 2: Appointment Settings */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '26px 28px', border: '1px solid #f1f5f9', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e8f5ec', color: '#265e38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Appointment Settings</h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Configure your working hours, consultation days and appointment preferences.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAppointmentModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ✏️ Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>WORKING DAYS</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                const active = workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: active ? '#e8f5ec' : '#f1f5f9',
                      color: active ? '#1e7e34' : '#64748b',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>CONSULTATION HOURS</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>🕒 {consultationHours}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px' }}>SLOT DURATION</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>⏱️ {slotDuration}</div>
          </div>
        </div>
      </div>

      {/* Card 3: Notification Settings */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '26px 28px', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e8f5ec', color: '#265e38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Notification Settings</h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Choose what notifications you want to receive.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenNotificationModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            ✏️ Edit
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { key: 'newAppointment', title: 'New Appointment', desc: 'Get notified when a new appointment is booked.' },
            { key: 'appointmentReminder', title: 'Appointment Reminder', desc: 'Receive reminders for upcoming appointments.' },
            { key: 'prescriptionUpdates', title: 'Prescription Updates', desc: 'Get notified when a prescription is issued.' },
            { key: 'followUpReminder', title: 'Follow-up Reminder', desc: 'Receive follow-up alerts for patients.' },
          ].map((item) => {
            const enabled = notifications[item.key];
            return (
              <div key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  onClick={() => toggleNotification(item.key)}
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '9999px',
                    backgroundColor: enabled ? '#1e7e34' : '#cbd5e1',
                    position: 'relative',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'background-color 0.2s',
                    marginTop: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: enabled ? '19px' : '3px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL 1: Edit Clinic Information ================= */}
      {editClinicModalOpen && (
        <div
          onClick={() => setEditClinicModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Clinic Information
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Update your clinic and doctor contact details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditClinicModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClinicInfo} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                        Clinic Name *
                      </label>
                      <span style={{ fontSize: '11px', color: (draftClinicInfo.clinicName?.length || 0) === 35 ? '#ea580c' : '#94a3b8' }}>
                        {draftClinicInfo.clinicName?.length || 0}/35
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={35}
                      value={draftClinicInfo.clinicName || ''}
                      onChange={handleClinicNameChange}
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          clinicName: validateClinicName(draftClinicInfo.clinicName),
                        }))
                      }
                      placeholder="e.g. HOMEOPATHY CLINIC"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formErrors.clinicName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                    {formErrors.clinicName && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.clinicName}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                        Doctor Name *
                      </label>
                      <span style={{ fontSize: '11px', color: (draftClinicInfo.doctorName?.length || 0) === 35 ? '#ea580c' : '#94a3b8' }}>
                        {draftClinicInfo.doctorName?.length || 0}/35
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={35}
                      value={draftClinicInfo.doctorName || ''}
                      onChange={handleDoctorNameChange}
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          doctorName: validateDoctorName(draftClinicInfo.doctorName),
                        }))
                      }
                      placeholder="e.g. Dr Kumar Tripathi"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formErrors.doctorName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                    {formErrors.doctorName && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.doctorName}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Contact Number *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: formErrors.contactNumber ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          userSelect: 'none',
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={draftContactDigits}
                        onChange={handleContactNumberChange}
                        onBlur={() =>
                          setFormErrors((prev) => ({
                            ...prev,
                            contactNumber: validateMobileNumber(draftContactDigits, true),
                          }))
                        }
                        placeholder="9876543210"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {formErrors.contactNumber && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.contactNumber}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Alternate Number
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: formErrors.alternateNumber ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          userSelect: 'none',
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={draftAlternateDigits}
                        onChange={handleAlternateNumberChange}
                        onBlur={() =>
                          setFormErrors((prev) => ({
                            ...prev,
                            alternateNumber: validateMobileNumber(draftAlternateDigits, false),
                          }))
                        }
                        placeholder="9988766554"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {formErrors.alternateNumber && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.alternateNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={draftClinicInfo.email || ''}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={() =>
                      setFormErrors((prev) => ({
                        ...prev,
                        email: validateEmail(draftClinicInfo.email),
                      }))
                    }
                    placeholder="clinic.tripathi@gmail.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: formErrors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Address *
                  </label>
                  <textarea
                    rows={3}
                    value={draftClinicInfo.address || ''}
                    onChange={handleAddressChange}
                    onBlur={() =>
                      setFormErrors((prev) => ({
                        ...prev,
                        address: draftClinicInfo.address?.trim() ? '' : 'Address is required.',
                      }))
                    }
                    placeholder="Clinic address..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: formErrors.address ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: 1.4,
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  {formErrors.address && (
                    <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {formErrors.address}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setEditClinicModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: Edit Appointment Settings ================= */}
      {editAppointmentModalOpen && (
        <div
          onClick={() => setEditAppointmentModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Appointment Settings
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Configure working days, hours and slot duration.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAppointmentModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAppointmentSettings}>
                {/* Working Days */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Working Days (Click to toggle)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                      const isSelected = draftWorkingDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDraftDay(d)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '1px solid #1e7e34' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#e8f5ec' : '#f8fafc',
                            color: isSelected ? '#1e7e34' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Consultation Hours */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Start Time
                    </label>
                    <select
                      value={draftStartHour}
                      onChange={(e) => setDraftStartHour(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="08:00 AM">08:00 AM</option>
                      <option value="08:30 AM">08:30 AM</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      End Time
                    </label>
                    <select
                      value={draftEndHour}
                      onChange={(e) => setDraftEndHour(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="04:00 PM">04:00 PM</option>
                      <option value="05:00 PM">05:00 PM</option>
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="07:00 PM">07:00 PM</option>
                      <option value="08:00 PM">08:00 PM</option>
                    </select>
                  </div>
                </div>

                {/* Slot Duration */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Slot Duration
                  </label>
                  <select
                    value={draftSlotDuration}
                    onChange={(e) => setDraftSlotDuration(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="20 Minutes">20 Minutes</option>
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="45 Minutes">45 Minutes</option>
                    <option value="60 Minutes">60 Minutes</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setEditAppointmentModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: Edit Notification Settings ================= */}
      {editNotificationModalOpen && (
        <div
          onClick={() => setEditNotificationModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Notification Settings
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Choose which notifications you and your patients receive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditNotificationModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNotificationSettings}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { key: 'newAppointment', title: 'New Appointment Alerts', desc: 'Notify immediately when an appointment is scheduled.' },
                    { key: 'appointmentReminder', title: 'Appointment Reminders', desc: 'Send automated reminders 2 hours before the session.' },
                    { key: 'prescriptionUpdates', title: 'Prescription Updates', desc: 'Send notification when a prescription is issued or dispatched.' },
                    { key: 'followUpReminder', title: 'Follow-up Reminders', desc: 'Notify patient when next consultation date arrives.' },
                  ].map((item) => {
                    const isChecked = draftNotifications[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setDraftNotifications({
                            ...draftNotifications,
                            [item.key]: !isChecked,
                          })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          backgroundColor: isChecked ? '#fbfdfb' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                        <div
                          style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '9999px',
                            backgroundColor: isChecked ? '#1e7e34' : '#cbd5e1',
                            position: 'relative',
                            flexShrink: 0,
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: isChecked ? '19px' : '3px',
                              transition: 'left 0.2s',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setEditNotificationModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

import React, { useState, useEffect, useRef } from 'react';
import appointmentApi from '../../api/appointmentApi';
import AdminCalendarPopover from './AdminCalendarPopover';

// Mobile Custom Dropdown Component (Active only in mobile responsive view <= 640px)
const AdminMobileSelect = ({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 230px space below trigger, open upwards to stay fully in viewport
      setOpenUpwards(spaceBelow < 230);
    }
    setIsOpen((prev) => !prev);
  };

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

  return (
    <div
      ref={containerRef}
      className="admin-mobile-select-container"
      style={{
        position: 'relative',
        width: '100%',
        zIndex: isOpen ? 60 : 1,
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={handleToggle}
        style={{
          width: '100%',
          height: '44px',
          padding: '0 14px',
          borderRadius: '10px',
          border: isOpen ? '1.5px solid #1e4620' : '1px solid #cbd5e1',
          fontSize: '13.5px',
          color: value ? '#1e293b' : '#94a3b8',
          backgroundColor: '#ffffff',
          outline: 'none',
          boxSizing: 'border-box',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textAlign: 'left',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            paddingRight: '8px',
          }}
        >
          {displayLabel}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#64748b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Hidden native select for standard form accessibility & state fallback */}
      <select
        value={value}
        onChange={onChange}
        required={required}
        style={{ display: 'none' }}
        aria-hidden="true"
        tabIndex={-1}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>

      {isOpen && (
        <div
          className="admin-mobile-select-dropdown"
          role="listbox"
          style={{
            position: 'absolute',
            [openUpwards ? 'bottom' : 'top']: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)',
            maxHeight: '210px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            zIndex: 1000,
            padding: '4px 0',
            boxSizing: 'border-box',
            animation: 'adminDropdownFadeIn 0.15s ease',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isOptDisabled = opt.disabled;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (!isOptDisabled) {
                    onChange({ target: { value: opt.value } });
                    setIsOpen(false);
                  }
                }}
                style={{
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  color: isOptDisabled ? '#94a3b8' : (isSelected ? '#166534' : '#1e293b'),
                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                  fontWeight: isSelected ? '600' : '400',
                  cursor: isOptDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isOptDisabled && !isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  if (!isOptDisabled && !isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <span style={{ color: '#166534', fontSize: '13px', fontWeight: '700' }}>✓</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const formatDateForDisplay = (isoStr) => {
  if (!isoStr) return '28 Oct 2026';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[month]} ${year}`;
  }
  return isoStr;
};

const NewAppointmentModal = ({ isOpen, onClose, onSave }) => {
  const [patientType, setPatientType] = useState('existing'); // 'existing' | 'new'
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePatients, setAvailablePatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    email: '',
    ageGender: '28 Years / Male',
  });
  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [appointmentDate, setAppointmentDate] = useState(getTodayISO);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [slotDuration, setSlotDuration] = useState('30 Minutes');
  const [consultationHours, setConsultationHours] = useState('09:00 AM - 06:00 PM');
  const [workingDays, setWorkingDays] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const days = parsed.workingDays || parsed.working_days;
        if (Array.isArray(days) && days.length > 0) return days;
      }
    } catch {}
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  });
  const [dateRestrictions, setDateRestrictions] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const restrs = parsed.dateRestrictions || parsed.date_restrictions;
        if (Array.isArray(restrs)) return restrs;
      }
    } catch {}
    return [];
  });
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 09:30 AM');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [consultationType, setConsultationType] = useState('In-clinic Visit');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAdminBookedSlots = async (dateStr) => {
    if (!dateStr) return;
    try {
      const data = await appointmentApi.getBookedSlots(dateStr);
      if (data?.booked_slots && Array.isArray(data.booked_slots)) {
        setBookedSlots(data.booked_slots);
      } else {
        setBookedSlots([]);
      }
    } catch {
      setBookedSlots([]);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchAdminBookedSlots(appointmentDate);

    const handleSync = () => {
      fetchAdminBookedSlots(appointmentDate);
    };
    const handleStorage = (e) => {
      if (e.key === 'kss_appointment_sync') {
        fetchAdminBookedSlots(appointmentDate);
      }
    };

    window.addEventListener('appointment-booked', handleSync);
    window.addEventListener('appointment-updated', handleSync);
    window.addEventListener('appointment-deleted', handleSync);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('appointment-booked', handleSync);
      window.removeEventListener('appointment-updated', handleSync);
      window.removeEventListener('appointment-deleted', handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isOpen, appointmentDate]);

  useEffect(() => {
    if (!isOpen) return;
    appointmentApi.getAppointmentSettings().then((data) => {
      if (data) {
        if (data.slotDuration || data.slot_duration) setSlotDuration(data.slotDuration || data.slot_duration);
        if (data.consultationHours || data.consultation_hours) setConsultationHours(data.consultationHours || data.consultation_hours);
        const days = data.workingDays || data.working_days;
        if (Array.isArray(days) && days.length > 0) setWorkingDays(days);
        const restrs = data.dateRestrictions || data.date_restrictions;
        if (Array.isArray(restrs)) setDateRestrictions(restrs);
      }
    }).catch(() => {});
  }, [isOpen]);

  const checkDateClosedStatus = (isoDateStr) => {
    if (!isoDateStr) return { isClosed: false, reason: '' };
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return { isClosed: false, reason: '' };
    const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dObj.getDay()];
    if (workingDays && workingDays.length > 0 && !workingDays.includes(dayName)) {
      return { isClosed: true, reason: `Clinic is closed on ${dayName}s (Non-working day)` };
    }
    if (dateRestrictions && dateRestrictions.length > 0) {
      for (const r of dateRestrictions) {
        if (!r || typeof r !== 'object') continue;
        const start = r.startDate || r.start_date || r.date;
        const end = r.endDate || r.end_date || start;
        if (start && end && isoDateStr >= start && isoDateStr <= end) {
          return { isClosed: true, reason: `Clinic is closed on this date (${r.reason || 'Restricted'})` };
        }
      }
    }
    return { isClosed: false, reason: '' };
  };

  const generateAdminSlots = () => {
    const durMatch = String(slotDuration || '').match(/\d+/);
    const durMins = durMatch ? parseInt(durMatch[0], 10) : 30;

    const parts = (consultationHours || '09:00 AM - 06:00 PM').split('-');
    const parseMins = (t) => {
      if (!t) return null;
      const match = t.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const p = match[3].toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };
    const sMins = parseMins(parts[0]) ?? (9 * 60);
    const eMins = parseMins(parts[1]) ?? (18 * 60);

    const generated = [];
    for (let cur = sMins; cur < eMins; cur += durMins) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const dispH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const startLabel = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;

      const endCur = cur + durMins;
      const endH = Math.floor(endCur / 60);
      const endM = endCur % 60;
      const endPeriod = endH >= 12 ? 'PM' : 'AM';
      const endDispH = endH === 0 ? 12 : (endH > 12 ? endH - 12 : endH);
      const endLabel = `${String(endDispH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;

      generated.push(`${startLabel} - ${endLabel}`);
    }
    return generated.length > 0 ? generated : ['09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM'];
  };

  // Fetch real patients from Neon PostgreSQL
  useEffect(() => {
    if (!isOpen) {
      setSelectedPatient(null);
      setSearchQuery('');
      setErrors({});
      setReasonForVisit('');
      setNewPatient({
        name: '',
        phone: '',
        email: '',
        ageGender: '28 Years / Male',
      });
      return;
    }
    // Reset state on open: Patient Name field should initially be empty
    setSelectedPatient(null);
    setSearchQuery('');
    setErrors({});
    setReasonForVisit('');
    setNewPatient({
      name: '',
      phone: '',
      email: '',
      ageGender: '28 Years / Male',
    });

    const fetchPatients = async () => {
      try {
        const data = await appointmentApi.getPatients();
        if (Array.isArray(data) && data.length > 0) {
          setAvailablePatients(data);
        }
      } catch (err) {
        console.error('Failed to load patients for new appointment:', err);
      }
    };
    fetchPatients();
  }, [isOpen]);

  // Lock background screen scroll and handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

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
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};

    if (patientType === 'existing') {
      if (!selectedPatient) {
        newErrors.patient = 'Please search and select a patient first.';
      }
    } else {
      // 1. Name: Allow a maximum of 35 alphabetic characters only. Do not allow numbers or special characters.
      const trimmedName = (newPatient.name || '').trim();
      if (!trimmedName) {
        newErrors.name = 'Patient full name is required.';
      } else if (trimmedName.length > 35) {
        newErrors.name = 'Patient name must not exceed 35 characters.';
      } else if (!/^[a-zA-Z\s]+$/.test(trimmedName)) {
        newErrors.name = 'Name must contain only alphabets and spaces. Numbers and special characters are not allowed.';
      }

      // 2. Mobile Number: Use a numeric input field and accept only valid 10-digit Indian mobile numbers starting with 6, 7, 8, or 9.
      const trimmedPhone = (newPatient.phone || '').trim();
      if (!trimmedPhone) {
        newErrors.phone = 'Mobile number is required.';
      } else if (!/^\d+$/.test(trimmedPhone)) {
        newErrors.phone = 'Mobile number must contain only numeric digits.';
      } else if (trimmedPhone.length !== 10) {
        newErrors.phone = 'Mobile number must be exactly 10 digits.';
      } else if (!/^[6-9]/.test(trimmedPhone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
      }

      // 3. Email: Apply proper email validation and prevent users from typing anything after .com.
      const trimmedEmail = (newPatient.email || '').trim();
      if (trimmedEmail) {
        if (/\.com.+$/i.test(trimmedEmail)) {
          newErrors.email = 'Invalid email address. No characters or text allowed after .com.';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(trimmedEmail)) {
          newErrors.email = 'Please enter a valid email address (e.g. name@example.com).';
        }
      }
    }

    // 4. Reason for Visit: Provide a text input field where users can type the reason for the visit.
    const trimmedReason = (reasonForVisit || '').trim();
    if (!trimmedReason) {
      newErrors.reasonForVisit = 'Reason for visit is required.';
    }

    // 5. Clinic Closed / Restricted Date check
    const dateCheck = checkDateClosedStatus(appointmentDate);
    if (dateCheck.isClosed) {
      newErrors.appointmentDate = dateCheck.reason;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const patientName = patientType === 'new' ? (newPatient.name.trim() || 'Patient') : (selectedPatient?.name || 'Patient');
      const patientPhone = patientType === 'new' ? newPatient.phone.trim() : (selectedPatient?.phone || '');
      const patientEmail = patientType === 'new' ? newPatient.email.trim() : (selectedPatient?.email || '');

      const res = await appointmentApi.bookAppointment({
        patient_name: patientName,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        appointment_date: formatDateForDisplay(appointmentDate),
        time_slot: timeSlot,
        reason_for_visit: reasonForVisit.trim(),
        consultation_type: consultationType,
        status: 'Confirmed',
      });

      if (onSave) {
        onSave({
          appointment: res?.appointment || res,
          patient: selectedPatient || newPatient,
          date: appointmentDate,
          timeSlot,
          reasonForVisit: reasonForVisit.trim(),
          consultationType,
          notes,
        });
      }
      onClose();
    } catch (err) {
      console.error('Booking failed:', err);
      const serverMsg = err.response?.data?.error || err.response?.data?.detail || 'Failed to save appointment. Please verify details.';
      alert(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      onWheel={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) e.preventDefault();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="admin-modal-card new-appointment-modal-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '640px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
          boxSizing: 'border-box',
          position: 'relative',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          className="admin-modal-scroll"
          style={{
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '32px 36px',
            flex: 1,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
              New Appointment
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Schedule a new appointment for a patient.
            </p>
          </div>
          {/* Close X Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Patient Details */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Patient Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 14px 0' }}>
              Search for an existing appointment or add a new patient.
            </p>

            {/* Radio Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '14px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: patientType === 'existing' ? '#1e4620' : '#475569',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="patientType"
                  value="existing"
                  checked={patientType === 'existing'}
                  onChange={() => setPatientType('existing')}
                  style={{ accentColor: '#1e4620', cursor: 'pointer' }}
                />
                Existing Patient
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  color: patientType === 'new' ? '#1e4620' : '#475569',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="patientType"
                  value="new"
                  checked={patientType === 'new'}
                  onChange={() => setPatientType('new')}
                  style={{ accentColor: '#1e4620', cursor: 'pointer' }}
                />
                New Patient
              </label>
            </div>

            {patientType === 'existing' ? (
              <>
                {/* Search Patient Input */}
                <div style={{ position: 'relative', zIndex: 60, marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Search Patient
                  </label>
                  <div style={{ position: 'relative', zIndex: 61 }}>
                    <div
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        pointerEvents: 'none',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by patient name, mobile number or patient ID..."
                      style={{
                        width: '100%',
                        height: '44px',
                        paddingLeft: '40px',
                        paddingRight: '14px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        color: '#1e293b',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                      onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                    />

                    {/* Search results dropdown */}
                    {searchQuery.trim() && (
                      <div
                        className="patient-search-dropdown"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          marginTop: '4px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          maxHeight: '180px',
                          overflowY: 'auto',
                          zIndex: 100,
                        }}
                      >
                        {(() => {
                          const matches = availablePatients.filter(
                            (p) =>
                              (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (p.mobile && p.mobile.includes(searchQuery)) ||
                              (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()))
                          );
                          if (matches.length === 0) {
                            return (
                              <div style={{ padding: '10px 14px', fontSize: '13px', color: '#64748b' }}>
                                No matching patients found
                              </div>
                            );
                          }
                          return matches.map((p) => (
                            <div
                              key={p.id}
                              className="patient-suggestion-item"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedPatient({
                                  id: p.id,
                                  name: p.name,
                                  phone: p.mobile,
                                  email: p.email || '',
                                  age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
                                  gender: p.ageGender?.split('/')[1]?.trim() || 'Male',
                                  initials: p.initials || (p.name ? p.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'PT'),
                                });
                                if (errors.patient) setErrors((prev) => ({ ...prev, patient: '' }));
                                setSearchQuery('');
                              }}
                              style={{
                                padding: '10px 14px',
                                borderBottom: '1px solid #f1f5f9',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#1e293b',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                            >
                              <strong>{p.name}</strong> ({p.id}) - {p.mobile}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                    {errors.patient && !selectedPatient && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        {errors.patient}
                      </span>
                    )}
                  </div>
                </div>

                {/* Selected Patient Card */}
                {selectedPatient && (
                  <div
                    style={{
                      backgroundColor: '#edf7ed',
                      border: '1px solid #c7e6c9',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#bbf7d0',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {selectedPatient.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                          {selectedPatient.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#52606d', marginTop: '2px' }}>
                          {selectedPatient.id} &nbsp;|&nbsp; {selectedPatient.phone} &nbsp;|&nbsp; {selectedPatient.age} &nbsp;|&nbsp; {selectedPatient.gender}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPatient(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#16a34a',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove patient selection"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* New Patient Form Fields */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Patient Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={35}
                      value={newPatient.name}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 35);
                        setNewPatient((prev) => ({ ...prev, name: cleanVal }));
                        if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                      }}
                      placeholder="e.g. John Doe"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: errors.name ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.name && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        {errors.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      maxLength={10}
                      value={newPatient.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setNewPatient((prev) => ({ ...prev, phone: digits }));
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                      }}
                      placeholder="10-digit Indian mobile number"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: errors.phone ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.phone && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        {errors.phone}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\s/g, '');
                        // Prevent users from typing anything after .com
                        const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);
                        if (comMatch) {
                          val = comMatch[1];
                          setErrors((prev) => ({ ...prev, email: 'No words or characters allowed after .com' }));
                        } else if (errors.email) {
                          setErrors((prev) => ({ ...prev, email: '' }));
                        }
                        setNewPatient((prev) => ({ ...prev, email: val }));
                      }}
                      placeholder="e.g. patient@gmail.com"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: errors.email ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {errors.email && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                        {errors.email}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Age & Gender
                    </label>
                    <input
                      type="text"
                      value={newPatient.ageGender}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, ageGender: e.target.value }))}
                      placeholder="e.g. 28 Years / Male"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Appointment Details */}
          <div style={{ marginBottom: '26px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              2 Appointment Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0' }}>
              Choose the date, time and visit details
            </p>

            {/* Row 1: Date & Time Slot */}
            <div className="new-appointment-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div style={{ position: 'relative', zIndex: isCalendarOpen ? 70 : 2 }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Appointment Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{formatDateForDisplay(appointmentDate)}</span>
                    <span style={{ fontSize: '15px' }}>📅</span>
                  </div>
                  <AdminCalendarPopover
                    isOpen={isCalendarOpen}
                    onClose={() => setIsCalendarOpen(false)}
                    selectedDate={appointmentDate}
                    disablePastDates={true}
                    workingDays={workingDays}
                    dateRestrictions={dateRestrictions}
                    onSelectDate={(displayStr, isoStr) => {
                      if (isoStr) {
                        setAppointmentDate(isoStr);
                        if (errors.appointmentDate) {
                          setErrors((prev) => ({ ...prev, appointmentDate: '' }));
                        }
                      }
                      setIsCalendarOpen(false);
                    }}
                  />
                </div>
                {checkDateClosedStatus(appointmentDate).isClosed && (
                  <div style={{ marginTop: '6px', fontSize: '11.5px', color: '#dc2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🚫</span>
                    <span>{checkDateClosedStatus(appointmentDate).reason}</span>
                  </div>
                )}
                {errors.appointmentDate && !checkDateClosedStatus(appointmentDate).isClosed && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.appointmentDate}
                  </span>
                )}
              </div>

              <div style={{ position: 'relative', zIndex: 10 }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Preferred Time Slot <span style={{ color: '#ef4444' }}>*</span>
                </label>
                {!isMobile ? (
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    {generateAdminSlots().map((slotStr) => {
                      const startPart = slotStr.split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                      const isBooked = bookedSlots.some((bs) => {
                        const bsClean = String(bs).split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                        return bsClean === startPart;
                      });
                      return (
                        <option key={slotStr} value={slotStr} disabled={isBooked} style={{ color: isBooked ? '#94a3b8' : '#1e293b' }}>
                          {slotStr}{isBooked ? ' (Booked)' : ''}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <AdminMobileSelect
                    id="mobile-preferred-time-slot"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    required
                    options={generateAdminSlots().map((slotStr) => {
                      const startPart = slotStr.split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                      const isBooked = bookedSlots.some((bs) => {
                        const bsClean = String(bs).split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                        return bsClean === startPart;
                      });
                      return {
                        value: slotStr,
                        label: `${slotStr}${isBooked ? ' (Booked)' : ''}`,
                        disabled: isBooked,
                      };
                    })}
                  />
                )}
              </div>
            </div>

            {/* Row 2: Reason for Visit & Consultation Type */}
            <div className="new-appointment-grid-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Reason for Visit <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reasonForVisit}
                  onChange={(e) => {
                    setReasonForVisit(e.target.value);
                    if (errors.reasonForVisit) setErrors((prev) => ({ ...prev, reasonForVisit: '' }));
                  }}
                  placeholder="e.g. Skin Allergy, Migraine, Stomach Pain..."
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    border: errors.reasonForVisit ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                    fontSize: '13.5px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.reasonForVisit && (
                  <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                    {errors.reasonForVisit}
                  </span>
                )}
              </div>

              <div style={{ position: 'relative', zIndex: 9 }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Consultation Type
                </label>
                {!isMobile ? (
                  <select
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="In-clinic Visit">In-clinic Visit</option>
                    <option value="Video Consultation">Video Consultation</option>
                  </select>
                ) : (
                  <AdminMobileSelect
                    id="mobile-consultation-type"
                    value={consultationType}
                    onChange={(e) => setConsultationType(e.target.value)}
                    options={[
                      { value: 'In-clinic Visit', label: 'In-clinic Visit' },
                      { value: 'Video Consultation', label: 'Video Consultation' },
                    ]}
                  />
                )}
              </div>
            </div>

            {/* Additional Notes (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                Additional Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setNotes(e.target.value);
                  }
                }}
                rows={3}
                placeholder="Add any additional information, symptoms or special requests..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
              />
              <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
                {notes.length}/500
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div
            className="new-appointment-footer-btns"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              Cancel
            </button>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 26px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1e4620',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#163518')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e4620')}
            >
              <span>Next</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentModal;


import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import appointmentApi from '../api/appointmentApi';
import useAuth from '../hooks/useAuth';
import PatientAuthModal from './auth/PatientAuthModal';

const AppointmentModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Keep modal state intact without forcefully redirecting to /login
  }, [isOpen]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const dialogRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    dateOfBirth: '',
    date: '',
    time: '10:00 AM',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [dateRestrictions, setDateRestrictions] = useState([]);
  const [customWorkingHours, setCustomWorkingHours] = useState([]);
  const [slotDuration, setSlotDuration] = useState('30 Minutes');
  const [consultationHours, setConsultationHours] = useState('09:00 AM - 06:00 PM');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [closedDatePopup, setClosedDatePopup] = useState({
    isOpen: false,
    dateFormatted: '',
    reason: '',
  });

  const fetchModalBookedSlots = async (dateStr) => {
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
    if (formData.date) {
      fetchModalBookedSlots(formData.date);
    }
    const handleSync = () => {
      if (formData.date) fetchModalBookedSlots(formData.date);
    };
    const handleStorage = (e) => {
      if (e.key === 'kss_appointment_sync' && formData.date) {
        fetchModalBookedSlots(formData.date);
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
  }, [formData.date]);

  useEffect(() => {
    appointmentApi.getAppointmentSettings().then((data) => {
      const days = data?.workingDays || data?.working_days;
      if (Array.isArray(days) && days.length > 0) setWorkingDays(days);
      const restrs = data?.dateRestrictions || data?.date_restrictions;
      if (Array.isArray(restrs)) setDateRestrictions(restrs);
      const cwh = data?.customWorkingHours || data?.custom_working_hours;
      if (Array.isArray(cwh)) setCustomWorkingHours(cwh);
      const ch = data?.consultationHours || data?.consultation_hours;
      if (ch) setConsultationHours(ch);
      const sd = data?.slotDuration || data?.slot_duration;
      if (sd) setSlotDuration(sd);
    }).catch(() => {});

    const handleSettingsUpdated = (e) => {
      const detail = e?.detail || {};
      const days = detail?.workingDays || detail?.working_days;
      if (Array.isArray(days)) setWorkingDays(days);
      const restrs = detail?.dateRestrictions || detail?.date_restrictions;
      if (Array.isArray(restrs)) setDateRestrictions(restrs);
      const cwh = detail?.customWorkingHours || detail?.custom_working_hours;
      if (Array.isArray(cwh)) setCustomWorkingHours(cwh);
      const ch = detail?.consultationHours || detail?.consultation_hours;
      if (ch) setConsultationHours(ch);
      const sd = detail?.slotDuration || detail?.slot_duration;
      if (sd) setSlotDuration(sd);
    };
    window.addEventListener('appointment-settings-updated', handleSettingsUpdated);
    return () => window.removeEventListener('appointment-settings-updated', handleSettingsUpdated);
  }, []);

  const checkDateRestriction = (dateStr) => {
    if (!dateStr || !dateRestrictions || !Array.isArray(dateRestrictions) || dateRestrictions.length === 0) {
      return { isRestricted: false, reason: '' };
    }
    const dateNorm = String(dateStr).trim();
    const monthNorm = dateNorm.substring(0, 7);
    for (const r of dateRestrictions) {
      if (!r || typeof r !== 'object') continue;
      const start = r.startDate || r.start_date || r.date;
      const end = r.endDate || r.end_date || start;
      const rMonth = r.month || (r.type === 'month' ? (start ? String(start).substring(0, 7) : null) : null);
      if (r.type === 'month' || rMonth) {
        if (rMonth === monthNorm || (start && end && start <= dateNorm && dateNorm <= end)) {
          return {
            isRestricted: true,
            reason: r.reason || 'Entire month closed',
          };
        }
      }
      if (start && end) {
        if (start <= dateNorm && dateNorm <= end) {
          return {
            isRestricted: true,
            reason: r.reason || 'Clinic closed on this date',
          };
        }
      }
    }
    return { isRestricted: false, reason: '' };
  };

  const parseTimeStrToMinutes = (tStr) => {
    if (!tStr) return null;
    const cleaned = String(tStr).trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return null;
    let [_, h, m, p] = match;
    let hours = parseInt(h, 10);
    const mins = parseInt(m, 10);
    if (p === 'PM' && hours !== 12) hours += 12;
    if (p === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const getEffectiveHoursForDate = (dateStr) => {
    if (!dateStr || !customWorkingHours || customWorkingHours.length === 0) {
      return { startTime: '09:00 AM', endTime: '06:00 PM', isCustom: false, reason: '' };
    }
    for (const ch of customWorkingHours) {
      if (ch && ch.startDate && ch.endDate && ch.startDate <= dateStr && dateStr <= ch.endDate) {
        return {
          startTime: ch.startTime || '09:00 AM',
          endTime: ch.endTime || '06:00 PM',
          isCustom: true,
          reason: ch.reason || 'Custom working hours',
        };
      }
    }
    return { startTime: '09:00 AM', endTime: '06:00 PM', isCustom: false, reason: '' };
  };
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Auto-populate authenticated patient details
  useEffect(() => {
    if (user && isAuthenticated) {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '';
      setFormData((prev) => ({
        ...prev,
        name: prev.name || fullName,
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone_number || '',
      }));
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Handle light-dismiss (clicking outside the modal)
  const handleDialogClick = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isClickOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isClickOutside) {
      onClose();
    }
  };

  const [modalErrors, setModalErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
      if (/[^a-zA-Z\s]/.test(value)) {
        setModalErrors((prev) => ({ ...prev, name: 'Only alphabets and spaces are allowed' }));
      } else if (modalErrors.name) {
        setModalErrors((prev) => ({ ...prev, name: '' }));
      }
      setFormData((prev) => ({ ...prev, name: cleaned }));
      return;
    }

    if (name === 'phone') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }
      if (/\D/.test(value)) {
        setModalErrors((prev) => ({ ...prev, phone: 'Only numbers are allowed' }));
      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {
        setModalErrors((prev) => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9' }));
        return;
      } else if (modalErrors.phone) {
        setModalErrors((prev) => ({ ...prev, phone: '' }));
      }
      digits = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
      return;
    }

    if (name === 'email') {
      let val = value.replace(/\s/g, '');
      const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);
      if (comMatch) {
        val = comMatch[1];
        setModalErrors((prev) => ({ ...prev, email: 'No words or characters allowed after .com' }));
      } else if (modalErrors.email) {
        setModalErrors((prev) => ({ ...prev, email: '' }));
      }
      setFormData((prev) => ({ ...prev, email: val }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (name === 'date' && value) {
      const dObj = new Date(value);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dObj.getDay()];
      const { isRestricted, reason } = checkDateRestriction(value);

      if (!workingDays.includes(dayName)) {
        const msg = `The clinic is closed on ${dayName}s. Please select an open working day (${workingDays.join(', ')}).`;
        setClosedDatePopup({
          isOpen: true,
          dateFormatted: value,
          reason: msg,
        });
        setModalErrors((prev) => ({
          ...prev,
          date: `Clinic is closed on this date. ${msg}`,
        }));
      } else if (isRestricted) {
        const msg = reason || 'Clinic closed on this date';
        setClosedDatePopup({
          isOpen: true,
          dateFormatted: value,
          reason: msg,
        });
        setModalErrors((prev) => ({
          ...prev,
          date: `Clinic is closed on this date (${msg}). Please select another date.`,
        }));
      } else {
        setModalErrors((prev) => {
          const next = { ...prev };
          delete next.date;
          return next;
        });
      }
    } else if (modalErrors[name]) {
      setModalErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    const nameTrimmed = (formData.name || '').trim();
    if (!nameTrimmed) {
      errors.name = 'Full Name is required';
    } else if (nameTrimmed.length > 25) {
      errors.name = 'Full Name cannot exceed 25 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      errors.name = 'Only alphabets and spaces are allowed';
    }

    const digits = (formData.phone || '').replace(/\D/g, '');
    if (!digits) {
      errors.phone = 'Phone number is required';
    } else if (digits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(digits)) {
      errors.phone = 'Mobile number must start with 6, 7, 8, or 9';
    }

    if (formData.date) {
      const dObj = new Date(formData.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[dObj.getDay()];
      const { isRestricted, reason } = checkDateRestriction(formData.date);
      if (!workingDays.includes(dayName)) {
        errors.date = `The clinic is closed on ${dayName}s. Please select an open working day.`;
      } else if (isRestricted) {
        errors.date = `Appointments are disabled on this date (${reason}). Please select another date.`;
      }
    }

    const emailVal = (formData.email || '').trim();
    if (emailVal) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(emailVal)) {
        errors.email = 'Please enter a valid email address';
      } else if (/\.com.+$/i.test(emailVal)) {
        errors.email = 'No words or characters allowed after .com';
      }
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    setIsBookingLoading(true);
    setServerError('');
    const bookingDate = formData.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    appointmentApi.bookAppointment({
      patient_name: formData.name,
      patient_phone: formData.phone,
      patient_email: formData.email,
      gender: formData.gender || '',
      date_of_birth: formData.dateOfBirth || '',
      dateOfBirth: formData.dateOfBirth || '',
      appointment_date: bookingDate,
      time_slot: formData.time || '10:00 AM',
      reason_for_visit: formData.notes || '',
      consultation_type: 'In clinic Visit',
      status: 'Confirmed',
    })
      .then((res) => {
        setIsSubmitted(true);
        if (typeof window !== 'undefined') {
          const newAptId = res?.appointment?.appointment_id || res?.appointment_id;
          if (newAptId) sessionStorage.setItem('kss_last_appointment_id', newAptId);
          window.dispatchEvent(new CustomEvent('appointment-booked', { detail: res }));
        }
      })
      .catch((err) => {
        console.error('Booking failed:', err);
        setServerError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save appointment. Please verify details.');
      })
      .finally(() => {
        setIsBookingLoading(false);
      });
  };

  if (!isAuthenticated && isOpen) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      aria-labelledby="modal-title"
      style={{
        overflow: 'hidden',
        border: 'none',
        borderRadius: '20px',
      }}
    >
      <div style={{ padding: '32px 28px', position: 'relative' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4b5563',
          }}
        >
          ✕
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              ✓
            </div>
            <h2 id="modal-title" style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Appointment Requested!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              Thank you, <strong>{formData.name}</strong>. Our clinic team will call you shortly on{' '}
              <strong>{formData.phone}</strong> to confirm your slot on <strong>{formData.date || 'your chosen date'}</strong> at{' '}
              <strong>{formData.time}</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '22px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#2e7d32',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Dr. Kumar Tripathi Ampeh (Pat.) Clinic
              </span>
              <h2
                id="modal-title"
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#111827',
                  marginTop: '4px',
                }}
              >
                Book Your Consultation
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                Fill in your details for a personalized homeopathic health consultation.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Full Name *
                    </label>
                    <span style={{ fontSize: '12px', color: (formData.name || '').length >= 25 ? '#ef4444' : '#9ca3af' }}>
                      {(formData.name || '').length}/25
                    </span>
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    autoFocus
                    maxLength={25}
                    placeholder="e.g. Ramesh Patel"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: modalErrors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {modalErrors.name && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.name}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Phone Number *
                      </label>
                      <span style={{ fontSize: '12px', color: (formData.phone || '').length === 10 ? '#16a34a' : '#9ca3af' }}>
                        {(formData.phone || '').length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      placeholder="Starts with 6-9"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: modalErrors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    {modalErrors.phone && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.phone}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="patient@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: modalErrors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    {modalErrors.email && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.email}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Gender (Optional)
                    </label>
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Date of Birth (Optional)
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      max={new Date().toISOString().split('T')[0]}
                      value={formData.dateOfBirth || ''}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.date}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: modalErrors.date ? '1.5px solid #dc2626' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    {modalErrors.date && (
                      <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px', margin: '4px 0 0 0' }}>
                        {modalErrors.date}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Time Slot
                    </label>
                    {(() => {
                      const eff = getEffectiveHoursForDate(formData.date);
                      const sMins = parseTimeStrToMinutes(eff.startTime) ?? (9 * 60);
                      const eMins = parseTimeStrToMinutes(eff.endTime) ?? (18 * 60);
                      const durMatch = String(slotDuration || '').match(/\d+/);
                      const durMins = durMatch ? parseInt(durMatch[0], 10) : 30;

                      const slotsToRender = [];
                      for (let cur = sMins; cur < eMins; cur += durMins) {
                        const h = Math.floor(cur / 60);
                        const m = cur % 60;
                        const period = h >= 12 ? 'PM' : 'AM';
                        const dispH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                        const timeLabel = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
                        
                        const endCur = cur + durMins;
                        const endH = Math.floor(endCur / 60);
                        const endM = endCur % 60;
                        const endPeriod = endH >= 12 ? 'PM' : 'AM';
                        const endDispH = endH === 0 ? 12 : (endH > 12 ? endH - 12 : endH);
                        const endLabel = `${String(endDispH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${endPeriod}`;
                        
                        slotsToRender.push({
                          value: timeLabel,
                          label: `${timeLabel} - ${endLabel}`,
                          mins: cur,
                        });
                      }

                      return (
                        <div>
                          <select
                            name="time"
                            value={formData.time}
                            onChange={handleChange}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '14px',
                              outline: 'none',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            {slotsToRender.map((s) => {
                              const sClean = s.value.split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                              const isBooked = bookedSlots.some((bs) => {
                                const bsClean = String(bs).split(/[-–—]|to/i)[0].trim().toUpperCase().replace(/^0/, '');
                                return bsClean === sClean;
                              });
                              return (
                                <option key={s.value} value={s.value} disabled={isBooked} style={{ color: isBooked ? '#94a3b8' : '#111827' }}>
                                  {s.label}{isBooked ? ' (Booked)' : ''}
                                </option>
                              );
                            })}
                          </select>
                          {eff.isCustom && (
                            <span style={{ fontSize: '11px', color: '#0369a1', display: 'block', marginTop: '3px' }}>
                              Special hours ({eff.startTime} - {eff.endTime}): {eff.reason}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                    Reason for Visit <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    placeholder="e.g. Chronic migraines, allergies, skin irritation..."
                    value={formData.notes}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                >
                  Confirm Appointment Request
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Closed Date Pop-up Modal */}
      {closedDatePopup.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setClosedDatePopup({ isOpen: false, dateFormatted: '', reason: '' })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px 24px 22px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: '19px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 8px',
                letterSpacing: '-0.2px',
              }}
            >
              Clinic is closed on this date.
            </h3>

            {closedDatePopup.dateFormatted && (
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginBottom: '12px',
                }}
              >
                📅 {closedDatePopup.dateFormatted}
              </div>
            )}

            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: '1.5',
                margin: '0 0 20px',
              }}
            >
              {closedDatePopup.reason
                ? closedDatePopup.reason
                : 'Appointments cannot be booked for this date as the clinic is closed. Please choose another date.'}
            </p>

            <button
              type="button"
              onClick={() => setClosedDatePopup({ isOpen: false, dateFormatted: '', reason: '' })}
              style={{
                width: '100%',
                padding: '11px 20px',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#143326')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
};

export default AppointmentModal;


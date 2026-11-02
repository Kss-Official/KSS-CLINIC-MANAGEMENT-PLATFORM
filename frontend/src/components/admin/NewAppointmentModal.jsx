import React, { useState, useEffect } from 'react';
import appointmentApi from '../../api/appointmentApi';
import AdminCalendarPopover from './AdminCalendarPopover';

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
  const [appointmentDate, setAppointmentDate] = useState('2026-10-28');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [timeSlot, setTimeSlot] = useState('10:30 AM - 11:00 AM');
  const [reasonForVisit, setReasonForVisit] = useState('Skin Allergy');
  const [consultationType, setConsultationType] = useState('In-clinic Visit');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real patients from Neon PostgreSQL
  useEffect(() => {
    if (!isOpen) return;
    const fetchPatients = async () => {
      try {
        const data = await appointmentApi.getPatients();
        if (Array.isArray(data) && data.length > 0) {
          setAvailablePatients(data);
          if (!selectedPatient) {
            const p = data[0];
            setSelectedPatient({
              id: p.id,
              name: p.name,
              phone: p.mobile,
              email: p.email || '',
              age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
              gender: p.ageGender?.split('/')[1]?.trim() || 'Male',
              initials: p.initials || 'PT',
            });
          }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        reason_for_visit: reasonForVisit,
        consultation_type: consultationType,
        status: 'Confirmed',
      });

      if (onSave) {
        onSave({
          appointment: res?.appointment || res,
          patient: selectedPatient || newPatient,
          date: appointmentDate,
          timeSlot,
          reasonForVisit,
          consultationType,
          notes,
        });
      }
      onClose();
    } catch (err) {
      console.error('Booking failed:', err);
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to save appointment. Please verify details.');
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

        <form onSubmit={handleSubmit}>
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
                <div style={{ position: 'relative', marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '500', color: '#475569', marginBottom: '6px' }}>
                    Search Patient
                  </label>
                  <div style={{ position: 'relative' }}>
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
                          zIndex: 50,
                        }}
                      >
                        {availablePatients
                          .filter(
                            (p) =>
                              (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (p.mobile && p.mobile.includes(searchQuery)) ||
                              (p.id && p.id.toLowerCase().includes(searchQuery.toLowerCase()))
                          )
                          .map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatient({
                                  id: p.id,
                                  name: p.name,
                                  phone: p.mobile,
                                  email: p.email || '',
                                  age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
                                  gender: p.ageGender?.split('/')[1]?.trim() || 'Male',
                                  initials: p.initials || 'PT',
                                });
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
                          ))}
                      </div>
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
                      value={newPatient.name}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. John Doe"
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
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="10-digit mobile number"
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="e.g. patient@gmail.com"
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
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
                    onSelectDate={(displayStr, isoStr) => {
                      if (isoStr) setAppointmentDate(isoStr);
                      setIsCalendarOpen(false);
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Preferred Time Slot <span style={{ color: '#ef4444' }}>*</span>
                </label>
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
                  <option value="09:30 AM - 10:00 AM">09:30 AM - 10:00 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="10:30 AM - 11:00 AM">10:30 AM - 11:00 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="01:00 PM - 01:30 PM">01:00 PM - 01:30 PM</option>
                  <option value="02:30 PM - 03:00 PM">02:30 PM - 03:00 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                </select>
              </div>
            </div>

            {/* Row 2: Reason for Visit & Consultation Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Reason for Visit <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
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
                  <option value="Skin Allergy">Skin Allergy</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Chronic Migraine">Chronic Migraine</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Digestive Issue">Digestive Issue</option>
                  <option value="Thyroid Consultation">Thyroid Consultation</option>
                  <option value="General Health Checkup">General Health Checkup</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Consultation Type
                </label>
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
                  <option value="Home Visit">Home Visit</option>
                </select>
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


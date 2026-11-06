import appointmentApi from '../../api/appointmentApi';
import React, { useEffect, useState } from 'react';

const ViewAppointmentModal = ({ isOpen, onClose, appointment }) => {
  const raw = appointment || {};
  const [currentStatus, setCurrentStatus] = useState(raw.status || 'Confirmed');

  useEffect(() => {
    setCurrentStatus(raw.status || 'Confirmed');
  }, [raw.status, raw.id, raw.appointment_id, raw.rawId]);

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

  const handleConfirmAppointment = async () => {
    try {
      const targetId = raw.rawId || raw.id || raw.appointment_id;
      await appointmentApi.updateAppointmentStatus(targetId, 'Confirmed');
      setCurrentStatus('Confirmed');
      window.dispatchEvent(
        new CustomEvent('appointment-updated', {
          detail: { id: targetId, status: 'Confirmed' },
        })
      );
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
    }
  };

  const handleCompleteAppointment = async () => {
    try {
      const targetId = raw.rawId || raw.id || raw.appointment_id;
      const res = await appointmentApi.updateAppointmentStatus(targetId, 'Complete');
      setCurrentStatus('Complete');
      const updatedApt = res || raw;
      window.dispatchEvent(
        new CustomEvent('appointment-updated', {
          detail: { id: targetId, status: 'Complete', appointment: updatedApt },
        })
      );
      const aptNum = updatedApt.appointment_id || raw.appointment_id || (targetId ? `APT-${targetId}` : 'APT-0000');
      const pName = updatedApt.patient_name || raw.patient_name || raw.name || 'Patient';
      window.dispatchEvent(
        new CustomEvent('prescription-remaining-notification', {
          detail: {
            ...raw,
            ...updatedApt,
            id: targetId,
            rawId: targetId,
            appointment_id: aptNum,
            patient_name: pName,
            name: pName,
            status: 'Completed',
            prescriptionStatus: 'Pending',
          },
        })
      );
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  if (!isOpen) return null;

  // Normalize appointment data with clean fallbacks
  const formatDisplayDate = (d) => {
    if (!d) return '28 Oct 2026';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [year, month, day] = d.split('-');
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]} ${year}`;
    }
    return d;
  };

  const formattedId = raw.appointment_id || (raw.id && String(raw.id).startsWith('APT-') ? raw.id : (raw.id ? ('APT-' + raw.id) : 'APT-1001'));
  const userReason = (raw.reason_for_visit || raw.reason || '').trim();
  const rawNotes = (raw.clinical_remarks || raw.notes || '').trim();
  const hasDistinctNotes = Boolean(rawNotes && rawNotes !== userReason);

  const apt = {
    ...raw,
    id: formattedId,
    appointment_id: formattedId,
    name: raw.patient_name || raw.name || 'Rahul Sharma',
    contact: raw.patient_phone || raw.contact || '+91 98765 43210',
    date: formatDisplayDate(raw.appointment_date || raw.date),
    time: raw.time_slot || raw.time || '09:30 AM',
    reason: userReason || 'Homeopathic Consultation',
    status: currentStatus || raw.status || 'Confirmed',
    consultationType: (raw.consultation_type || raw.consultationType || 'In clinic Visit').replace('In-clinic', 'In clinic'),
    ageGender: raw.ageGender || raw.age_gender || (raw.patient_gender ? (raw.patient_age ? (raw.patient_age + ' • ' + raw.patient_gender) : raw.patient_gender) : 'Adult'),
    bloodGroup: raw.blood_group || raw.bloodGroup || 'O+',
    email: raw.patient_email || raw.email || '',
    doctor: raw.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
    clinicalNotes: hasDistinctNotes ? rawNotes : '',
    prescriptionStatus: raw.prescription_status || raw.prescriptionStatus || 'Pending',
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#e8f7ee', color: '#1e7e34', border: '#bbf7d0' };
      case 'Pending':
        return { bg: '#fef7e6', color: '#b45309', border: '#fde68a' };
      case 'Complete':
      case 'Completed':
        return { bg: '#eaf2ff', color: '#2563eb', border: '#bfdbfe' };
      case 'Cancelled':
        return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const getPrescriptionBadge = (status) => {
    switch (status) {
      case 'Complete':
      case 'Completed':
        return { bg: '#e8f7ee', color: '#1e7e34', border: '#bbf7d0', label: 'Prescription Created' };
      case 'Pending':
      default:
        return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', label: 'Prescription Pending' };
    }
  };

  const badge = getStatusBadge(currentStatus || apt.status || 'Confirmed');
  const rxStatus = apt.prescriptionStatus || 'Pending';
  const rxBadge = getPrescriptionBadge(rxStatus);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
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
          maxWidth: '580px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Modal Scroll Container */}
        <div
          className="admin-modal-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '24px 28px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#166534',
                  backgroundColor: '#dcfce7',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}
              >
                <span>📅</span>
                <span>Appointment Details</span>
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {apt.name}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                ID: <span style={{ fontWeight: '700', color: '#1e4620' }}>{apt.id}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: badge.bg,
                  color: badge.color,
                  border: `1px solid ${badge.border}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {currentStatus || apt.status}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Patient Card Banner */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '14px 18px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '16px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {apt.name
                ? apt.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'PT'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                {apt.name}
              </div>
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span>📞 {apt.contact}</span>
                {apt.ageGender && <span>• {apt.ageGender}</span>}
                {apt.email && <span>• ✉️ {apt.email}</span>}
              </div>
            </div>
          </div>

          {/* Details 2x2 Grid (Strict minmax(0, 1fr) ensures columns never overflow) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '12px',
              marginBottom: '16px',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Date & Time */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                DATE & TIME
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                📅 {apt.date}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                🕒 {apt.time}
              </div>
            </div>

            {/* 2. Consultation Type */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                CONSULTATION TYPE
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                🩺 {apt.consultationType || 'In clinic Visit'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Regular Consultation
              </div>
            </div>

            {/* 3. Assigned Doctor */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                ASSIGNED DOCTOR
              </div>
              <div
                style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                title={apt.doctor}
              >
                👨‍⚕️ {apt.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Homeopathy Consultant
              </div>
            </div>

            {/* 4. Prescription Status */}
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                minWidth: 0,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                PRESCRIPTION STATUS
              </div>
              <div style={{ marginTop: '5px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 9px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: '700',
                    backgroundColor: rxBadge.bg,
                    color: rxBadge.color,
                    border: `1px solid ${rxBadge.border}`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>💊</span>
                  <span>{rxBadge.label}</span>
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {rxStatus === 'Complete' || rxStatus === 'Completed' ? 'Prescription active' : 'Awaiting prescription creation'}
              </div>
            </div>
          </div>

          {/* Reason for Visit Card (Full Width with perfect wrap for any user input) */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '14px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#475569',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <span>🎯</span>
              <span>Reason for Visit</span>
            </div>
            <div
              style={{
                fontSize: '13.5px',
                color: '#0f172a',
                fontWeight: '500',
                lineHeight: '1.55',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere',
                whiteSpace: 'pre-wrap',
                backgroundColor: '#ffffff',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0',
                boxSizing: 'border-box',
              }}
            >
              {apt.reason || 'General Consultation'}
            </div>
          </div>

          {/* Clinical Remarks / Notes Card */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '16px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: '700',
                color: '#475569',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <span>📝</span>
              <span>Clinical Remarks & Notes</span>
            </div>
            {apt.clinicalNotes ? (
              <div
                style={{
                  fontSize: '13.5px',
                  color: '#334155',
                  lineHeight: '1.55',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  boxSizing: 'border-box',
                }}
              >
                {apt.clinicalNotes}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  fontStyle: 'italic',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  borderRadius: '10px',
                  border: '1px dashed #cbd5e1',
                  boxSizing: 'border-box',
                }}
              >
                No clinical remarks or extra notes recorded for this appointment.
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              boxSizing: 'border-box',
            }}
          >
            {currentStatus === 'Pending' && (
              <button
                type="button"
                onClick={handleConfirmAppointment}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#15803d')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
              >
                <span>✓</span>
                <span>Confirm Appointment</span>
              </button>
            )}
            {currentStatus !== 'Complete' && currentStatus !== 'Completed' && (
              <button
                type="button"
                onClick={handleCompleteAppointment}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <span>✓</span>
                <span>Mark as Complete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointmentModal;

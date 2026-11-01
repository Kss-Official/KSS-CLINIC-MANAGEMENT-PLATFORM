import React, { useEffect } from 'react';

const ViewAppointmentModal = ({ isOpen, onClose, appointment }) => {
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

  // Fallback appointment data
  const apt = appointment || {
    id: 'APT-1001',
    name: 'Rahul Sharma',
    contact: '+91 98765 43210',
    date: '28 Oct 2026',
    time: '09:30 AM',
    reason: 'Skin Allergy',
    status: 'Confirmed',
    consultationType: 'In clinic Visit',
    ageGender: '28 Years / Male',
    bloodGroup: 'O+',
    email: 'rahul.sharma@gmail.com',
    doctor: 'Dr. Kumar Tripathi Ampeh (Pat.)',
    notes: 'Patient reported recurring allergic rashes on hands and neck. Prescribed constitutional remedy and recommended dietary caution.',
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#e8f7ee', color: '#1e7e34', border: '#bbf7d0' };
      case 'Pending':
        return { bg: '#fef7e6', color: '#b45309', border: '#fde68a' };
      case 'Completed':
        return { bg: '#eaf2ff', color: '#2563eb', border: '#bfdbfe' };
      case 'Cancelled':
        return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const badge = getStatusBadge(apt.status || 'Confirmed');

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
          position: 'relative',
        }}
      >
        {/* Modal Scroll Container */}
        <div
          className="admin-modal-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 32px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#265e38',
                  backgroundColor: '#e8f5ec',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                APPOINTMENT DETAILS
              </div>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#0f172a',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                {apt.name}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                ID: <span style={{ fontWeight: '600', color: '#334155' }}>{apt.id}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                }}
              >
                {apt.status}
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
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
              padding: '16px 20px',
              border: '1px solid #e2e8f0',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
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
              <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                {apt.contact} {apt.ageGender ? `• ${apt.ageGender}` : ''}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>
                DATE & TIME
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                📅 {apt.date}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                🕒 {apt.time}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>
                CONSULTATION TYPE
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                🩺 {apt.consultationType || 'In clinic Visit'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Regular Consultation
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>
                REASON FOR VISIT
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                {apt.reason || 'General Checkup'}
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#ffffff',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>
                ASSIGNED DOCTOR
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>
                {apt.doctor || 'Dr. Kumar Tripathi Ampeh'}
              </div>
            </div>
          </div>

          {/* Clinical Remarks / Notes */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #f1f5f9',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', marginBottom: '6px' }}>
              CLINICAL REMARKS & NOTES
            </div>
            <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5, margin: 0 }}>
              {apt.notes || 'Patient reported acute symptoms. Regular follow-up and homeopathic remedies scheduled according to diagnostic review.'}
            </p>
          </div>

          {/* Action Footer */}
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
                padding: '9px 20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1e4620',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointmentModal;


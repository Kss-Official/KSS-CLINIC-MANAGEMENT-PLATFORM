import React, { useState, useEffect } from 'react';
import PrescriptionPreviewCard from './PrescriptionPreviewCard';
import appointmentApi from '../../api/appointmentApi';

const ViewPrescriptionModal = ({
  isOpen,
  onClose,
  prescription,
  onNavigateToPatient,
  onWhatsAppSent,
}) => {
  const [activeRx, setActiveRx] = useState(prescription);

  useEffect(() => {
    setActiveRx(prescription);
    if (!isOpen || !prescription) return;

    const rxIdentifier = prescription.id || prescription.rxId;
    if (rxIdentifier) {
      appointmentApi.getPrescriptions().then((list) => {
        if (Array.isArray(list)) {
          const found = list.find((item) => (item.id === rxIdentifier || item.rxId === rxIdentifier));
          if (found) {
            setActiveRx((prev) => ({
              ...prev,
              ...found,
              appointment_id: found.appointment_id || found.apt_number || found.aptNumber || prev?.appointment_id,
              apt_number: found.apt_number || found.appointment_id || found.aptNumber || prev?.apt_number,
              aptNumber: found.aptNumber || found.appointment_id || found.apt_number || prev?.aptNumber,
              medicines: (found.medicines && found.medicines.length > 0) ? found.medicines : (prev?.medicines || []),
              diagnosis: found.diagnosis || prev?.diagnosis,
              patientId: found.patientId || prev?.patientId,
              additionalInstructions: found.additionalInstructions || prev?.additionalInstructions,
            }));
          }
        }
      }).catch((err) => console.error('Failed to load prescription medicines:', err));
    }

    // Fallback: if appointment ID is not yet attached, find matched appointment by patient name
    const pName = prescription.patientName || prescription.patient_name || prescription.name;
    if (!prescription.appointment_id && !prescription.apt_number && !prescription.aptNumber && pName) {
      appointmentApi.getAppointments().then((aptList) => {
        if (Array.isArray(aptList)) {
          const matchedApt = aptList.find(
            (a) =>
              (a.patient_name && a.patient_name.toLowerCase() === pName.toLowerCase()) ||
              (a.name && a.name.toLowerCase() === pName.toLowerCase())
          );
          if (matchedApt) {
            const aptNum = matchedApt.appointment_id || (matchedApt.id ? `APT-${matchedApt.id}` : '');
            if (aptNum) {
              setActiveRx((prev) => ({
                ...prev,
                appointment_id: aptNum,
                appointmentId: aptNum,
                apt_number: aptNum,
                aptNumber: aptNum,
              }));
            }
          }
        }
      }).catch((err) => console.error('Failed to lookup appointment for prescription:', err));
    }
  }, [prescription, isOpen]);
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

  // Current prescription data (from props or fetched state)
  const rx = activeRx || prescription || {
    id: '',
    name: '',
    ageGender: '',
    date: '',
    time: '',
    complaint: '',
    status: 'Pending',
    mobile: '',
    doctor: 'Dr. Kumar Tripathi Ampeh (Pat.)',
    diagnosis: '',
    notes: '',
  };

  const medicines = rx.medicines && rx.medicines.length > 0
    ? rx.medicines
    : [];

  const resolvedAptNum =
    rx.appointment_id ||
    rx.appointmentId ||
    rx.apt_number ||
    rx.aptNumber ||
    rx.appointment_number ||
    rx.patient?.appointment_id ||
    rx.patient?.appointmentId ||
    rx.patient?.aptNumber ||
    '';

  const resolvedReason =
    rx.reason_for_visit ||
    rx.reason ||
    rx.complaint ||
    rx.mainComplaint ||
    rx.appointment?.reason_for_visit ||
    rx.appointment?.reason ||
    '';

  const patientObj = {
    name: rx.name || rx.patientName || rx.patient_name || 'Patient',
    id: rx.patientId || rx.patient_id_ref || rx.patient?.id || rx.patient?.patient_id || '',
    ageGender: rx.ageGender || rx.age_gender || rx.patient?.age_gender || '',
    phone: rx.contact || rx.mobile || rx.phone || rx.patient_phone || rx.patient?.phone || '',
    appointment_id: resolvedAptNum,
    appointmentId: resolvedAptNum,
    apt_number: resolvedAptNum,
    aptNumber: resolvedAptNum,
    reason_for_visit: resolvedReason,
    reason: resolvedReason,
  };

  return (
    <div
      onClick={onClose}
      className="admin-view-rx-overlay"
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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        overscrollBehavior: 'contain',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="admin-view-rx-modal"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="admin-modal-scroll admin-view-rx-scroll"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: '24px 28px',
            flex: '1 1 0%',
            minHeight: 0,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Modal Header */}
          <div
            className="admin-view-rx-header"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '16px',
              gap: '12px',
            }}
          >
            <div>
              <h2
                className="admin-view-rx-title"
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a',
                  margin: '0 0 3px 0',
                }}
              >
                {prescription ? 'Prescription Details' : 'New Prescription'}
              </h2>
              <p
                className="admin-view-rx-subtitle"
                style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}
              >
                {prescription
                  ? 'Review the prescription details and clinical documentation.'
                  : 'Create and preview the prescription for the selected patient.'}
              </p>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="admin-view-rx-close-btn"
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
                transition: 'color 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Prescription Preview Document Card Component */}
          <PrescriptionPreviewCard
            prescriptionId={rx.id || rx.rxId}
            patient={patientObj}
            aptNumber={resolvedAptNum}
            date={rx.date || '28 Oct 2026'}
            consultationType={rx.consultationType || 'Follow-up'}
            reasonForVisit={resolvedReason}
            diagnosis={rx.diagnosis || rx.complaint || 'Skin allergy due to seasonal change.'}
            medicines={medicines}
            additionalInstructions={rx.notes || rx.additionalInstructions || 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'}
            onSendWhatsApp={async (extraData = {}) => {
              const rxIdentifier = rx.id || rx.rxId || rx.prescription_id;
              const res = await appointmentApi.sendPrescriptionWhatsApp(rxIdentifier, {
                phone: patientObj.phone || patientObj.contact || patientObj.mobile,
                patientName: patientObj.name,
                patientId: patientObj.id || patientObj.patientId,
                date: rx.date,
                consultationType: rx.consultationType,
                diagnosis: rx.diagnosis || rx.complaint,
                medicines: medicines,
                additionalInstructions: rx.notes || rx.additionalInstructions,
                pdf_base64: extraData.pdf_base64,
              });
              try {
                await appointmentApi.updatePrescriptionStatus(rxIdentifier, 'Delivered');
              } catch (e) {
                console.warn('Status update fallback error:', e);
              }
              setActiveRx((prev) => (prev ? { ...prev, status: 'Delivered' } : prev));
              // Notify parent page to update the list row status instantly
              if (onWhatsAppSent) {
                onWhatsAppSent(rxIdentifier, 'Delivered');
              }
              // Also broadcast so PrescriptionsPage listener can catch it
              window.dispatchEvent(new CustomEvent('prescription-whatsapp-sent', {
                detail: { rxId: rxIdentifier, status: 'Delivered' }
              }));
              return res;
            }}
          />

          {/* Close Action Button at Bottom */}
          <div className="admin-view-rx-footer-close" style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              className="admin-view-rx-btn-close"
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .admin-view-rx-overlay {
            padding: 8px 6px !important;
          }
          .admin-view-rx-modal {
            width: 100% !important;
            max-width: 100% !important;
            max-height: 94vh !important;
            border-radius: 16px !important;
          }
          .admin-view-rx-scroll {
            padding: 14px 10px 16px !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
          }
          .admin-view-rx-header {
            margin-bottom: 10px !important;
          }
          .admin-view-rx-title {
            font-size: 17px !important;
            margin: 0 0 2px 0 !important;
          }
          .admin-view-rx-subtitle {
            font-size: 11.5px !important;
            line-height: 1.35 !important;
          }
          .admin-view-rx-footer-close {
            margin-top: 12px !important;
            width: 100% !important;
          }
          .admin-view-rx-btn-close {
            width: 100% !important;
            justify-content: center !important;
            min-height: 42px !important;
            font-size: 13px !important;
            box-sizing: border-box !important;
          }
        }
        @media (max-width: 380px) {
          .admin-view-rx-overlay {
            padding: 6px 4px !important;
          }
          .admin-view-rx-scroll {
            padding: 12px 8px 14px !important;
          }
          .admin-view-rx-title {
            font-size: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewPrescriptionModal;

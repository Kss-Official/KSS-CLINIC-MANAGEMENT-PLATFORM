import React, { useState, useEffect } from 'react';
import PrescriptionPreviewCard from './PrescriptionPreviewCard';
import appointmentApi from '../../api/appointmentApi';

const ViewPrescriptionModal = ({
  isOpen,
  onClose,
  prescription,
  onNavigateToPatient,
}) => {
  const [activeRx, setActiveRx] = useState(prescription);

  useEffect(() => {
    setActiveRx(prescription);
    if (!isOpen || !prescription) return;

    if (!prescription.medicines || prescription.medicines.length === 0) {
      const rxIdentifier = prescription.id || prescription.rxId;
      if (rxIdentifier) {
        appointmentApi.getPrescriptions().then((list) => {
          if (Array.isArray(list)) {
            const found = list.find((item) => (item.id === rxIdentifier || item.rxId === rxIdentifier));
            if (found && found.medicines && found.medicines.length > 0) {
              setActiveRx((prev) => ({
                ...prev,
                ...found,
                medicines: found.medicines,
                diagnosis: found.diagnosis || prev?.diagnosis,
                patientId: found.patientId || prev?.patientId,
                additionalInstructions: found.additionalInstructions || prev?.additionalInstructions,
              }));
            }
          }
        }).catch((err) => console.error('Failed to load prescription medicines:', err));
      }
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
    id: 'RX-2026-1016',
    name: 'Rahul Sharma',
    ageGender: '28 Years / Male',
    date: '28 Oct 2026',
    time: '09:45 AM',
    complaint: 'Skin Allergy',
    status: 'Delivered',
    mobile: '+91 98765 43210',
    doctor: 'Dr. Kumar Tripathi Ampeh (Pat.)',
    diagnosis: 'Skin allergy due to seasonal change.',
    notes: 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.',
  };

  // Medicine list mapping by prescription ID or fallback matching reference image
  const getPrescriptionMedicines = (rxId) => {
    switch (rxId) {
      case 'RX-2026-1016':
        return [
          { name: 'Rhus Tox', potency: '30C', dosage: '5 drops', duration: '15 Days', instructions: 'Twice daily' },
          { name: 'Apis Mellifica', potency: '200C', dosage: '5 drops', duration: '10 Days', instructions: 'Once daily' },
        ];
      case 'RX-2026-1015':
        return [
          { name: 'Belladonna', potency: '30C', dosage: '4 Pills', duration: '7 Days', instructions: 'Twice daily' },
          { name: 'Natrum Muriaticum', potency: '200CH', dosage: '4 Pills', duration: '14 Days', instructions: 'Once daily' },
        ];
      case 'RX-2026-1014':
        return [
          { name: 'Glonoinum', potency: '30C', dosage: '4 Pills', duration: '14 Days', instructions: 'Twice daily' },
          { name: 'Iris Versicolor', potency: '200CH', dosage: '4 Pills', duration: '10 Days', instructions: 'Once daily' },
        ];
      case 'RX-2026-1013':
        return [
          { name: 'Gelsemium', potency: '30C', dosage: '4 Pills', duration: '14 Days', instructions: 'Twice daily' },
          { name: 'China Officinalis', potency: '200CH', dosage: '4 Pills', duration: '14 Days', instructions: 'Once daily' },
        ];
      default:
        return [
          { name: 'Rhus Tox', potency: '30C', dosage: '5 drops', duration: '15 Days', instructions: 'Twice daily' },
          { name: 'Apis Mellifica', potency: '200C', dosage: '5 drops', duration: '10 Days', instructions: 'Once daily' },
        ];
    }
  };

  const medicines = rx.medicines && rx.medicines.length > 0
    ? rx.medicines
    : getPrescriptionMedicines(rx.id);

  const patientObj = {
    name: rx.name || rx.patientName || 'Rahul Sharma',
    id: rx.patientId || rx.patient_id_ref || rx.patient?.id || 'PAT-1001',
    ageGender: rx.ageGender || rx.age_gender || '28 Years / Male',
    phone: rx.contact || rx.mobile || rx.patient_phone || '+91 98765 43210',
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
        padding: '20px 16px',
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
          maxWidth: '680px',
          maxHeight: 'calc(100vh - 40px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className="admin-modal-scroll"
          style={{
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '24px 28px',
            flex: 1,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Modal Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#0f172a',
                  margin: '0 0 3px 0',
                }}
              >
                New Prescription
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Create and preview the prescription for the selected patient.
              </p>
            </div>

            {/* Close Button */}
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
                transition: 'color 0.15s ease',
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
            patient={patientObj}
            date={rx.date || '28 Oct 2026'}
            consultationType={rx.consultationType || 'Follow-up'}
            diagnosis={rx.diagnosis || rx.complaint || 'Skin allergy due to seasonal change.'}
            medicines={medicines}
            additionalInstructions={rx.notes || rx.additionalInstructions || 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'}
            onSendWhatsApp={() => {
              alert(`Prescription ${rx.id || 'RX-2026-1016'} sent via WhatsApp to ${patientObj.name}!`);
            }}
            onDownloadPdf={() => {
              alert(`Downloading Prescription ${rx.id || 'RX-2026-1016'}.pdf...`);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ViewPrescriptionModal;

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
    id: 'RX-2026-1016',
    name: 'Rahul Sharma',
    ageGender: '28 Years / Male',
    date: '28 Oct 2026',
    time: '09:45 AM',
    complaint: 'Skin Allergy',
    status: 'Pending',
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

  const patientObj = {
    name: rx.name || rx.patientName || rx.patient_name || 'Patient',
    id: rx.patientId || rx.patient_id_ref || rx.patient?.id || rx.patient?.patient_id || 'PAT-1001',
    ageGender: rx.ageGender || rx.age_gender || rx.patient?.age_gender || 'Adult',
    phone: rx.contact || rx.mobile || rx.phone || rx.patient_phone || rx.patient?.phone || '+91 98765 43210',
    appointment_id: resolvedAptNum,
    appointmentId: resolvedAptNum,
    apt_number: resolvedAptNum,
    aptNumber: resolvedAptNum,
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
          className="admin-modal-scroll"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
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
                Prescription Details
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                View and review the prescription for the selected patient.
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
            prescriptionId={rx.id || rx.rxId}
            patient={patientObj}
            aptNumber={resolvedAptNum}
            date={rx.date || '28 Oct 2026'}
            consultationType={rx.consultationType || 'Follow-up'}
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
        </div>
      </div>
    </div>
  );
};

export default ViewPrescriptionModal;

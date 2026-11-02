import React, { useState, useEffect } from 'react';
import PrescriptionPreviewCard from './PrescriptionPreviewCard';
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

const NewPrescriptionModal = ({ isOpen, onClose, onSave, initialPatient }) => {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePatients, setAvailablePatients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState({
    id: 'PAT-1001',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    age: '28 Years',
    gender: 'Male',
    ageGender: '28 Years / Male',
    initials: 'RS',
  });

  const [appointmentDate, setAppointmentDate] = useState('2026-10-28');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [consultationType, setConsultationType] = useState('Follow-up');
  const [mainComplaint, setMainComplaint] = useState('Skin Allergy');

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('Skin allergy due to seasonal change.');

  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: 'Rhus Tox',
      potency: '30C',
      dosage: '5 drops',
      duration: '15 Days',
      instructions: 'Twice daily',
    },
    {
      id: 2,
      name: 'Apis Mellifica',
      potency: '200C',
      dosage: '5 drops',
      duration: '10 Days',
      instructions: 'Once daily',
    },
  ]);

  const [additionalInstructions, setAdditionalInstructions] = useState(
    'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'
  );

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
    }
  }, [isOpen]);
  // Fetch real patients from Neon PostgreSQL database on modal open
  useEffect(() => {
    if (!isOpen) return;
    const fetchPatients = async () => {
      try {
        const data = await appointmentApi.getPatients();
        if (Array.isArray(data) && data.length > 0) {
          setAvailablePatients(data);
          // If no selected patient or PAT-1001 default, select first verified patient from database
          setSelectedPatient((prev) => {
            if (!prev || prev.id === 'PAT-1001') {
              const p = data[0];
              return {
                id: p.id,
                name: p.name,
                phone: p.mobile,
                age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
                gender: p.ageGender?.split('/')[1]?.trim() || 'Adult',
                ageGender: p.ageGender || '28 Years / Adult',
                initials: p.initials || 'PT',
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load database patients for prescription:', err);
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

  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        potency: '',
        dosage: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedicine = (id) => {
    if (medicines.length > 1) {
      setMedicines((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleMedicineChange = (id, field, value) => {
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Advance to Step 2: Prescription Preview Screen
    setStep(2);
  };

  const handleSavePrescription = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return; // Prevent duplicate submissions

    if (!selectedPatient || !selectedPatient.name) {
      alert('Please select a patient before saving the prescription.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        patient: selectedPatient,
        patient_name: selectedPatient.name,
        patient_phone: selectedPatient.phone,
        patient_id_ref: selectedPatient.id,
        age_gender: selectedPatient.ageGender || `${selectedPatient.age} / ${selectedPatient.gender}`,
        date: formatDateForDisplay(appointmentDate),
        appointmentDate,
        consultationType,
        mainComplaint,
        symptoms,
        diagnosis: diagnosis || 'Clinical Consultation',
        medicines: medicines.filter((m) => m.name && m.name.trim() !== ''),
        additionalInstructions,
        status: 'Delivered',
      };

      const savedRx = await appointmentApi.createPrescription(payload);
      setSuccessMessage(`Prescription ${savedRx.id} successfully saved for ${selectedPatient.name}!`);

      if (onSave) {
        onSave(savedRx);
      }

      // Brief feedback before closing modal
      setTimeout(() => {
        setSuccessMessage('');
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save prescription to database:', err);
      alert('Failed to save prescription to database. Please check your connection and try again.');
      setIsSaving(false);
    }
  };

  const handleFinalSave = async (deliveryMethod = 'WhatsApp') => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        patient: selectedPatient,
        patient_name: selectedPatient.name,
        patient_phone: selectedPatient.phone,
        patient_id_ref: selectedPatient.id,
        age_gender: selectedPatient.ageGender || `${selectedPatient.age} / ${selectedPatient.gender}`,
        date: formatDateForDisplay(appointmentDate),
        appointmentDate,
        consultationType,
        mainComplaint,
        symptoms,
        diagnosis: diagnosis || 'Skin allergy due to seasonal change.',
        medicines: medicines.filter((m) => m.name && m.name.trim() !== ''),
        additionalInstructions,
        status: deliveryMethod === 'WhatsApp' ? 'Delivered' : 'Sent',
      };

      const savedRx = await appointmentApi.createPrescription(payload);
      if (onSave) {
        onSave(savedRx);
      }
      onClose();
    } catch (err) {
      console.error('Failed to finalize prescription:', err);
      onClose();
    } finally {
      setIsSaving(false);
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
          maxWidth: step === 2 ? '680px' : '780px',
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
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
              New Prescription
            </h2>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
              Create a new prescription for the selected patient.
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

        {step === 2 ? (
          <div>
            {/* Back to Edit Button */}
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#1e4620',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                <span>←</span>
                <span>Edit Prescription Details</span>
              </button>
            </div>

            <PrescriptionPreviewCard
              patient={selectedPatient}
              date={formatDateForDisplay(appointmentDate)}
              consultationType={consultationType}
              diagnosis={diagnosis || mainComplaint || 'Skin allergy due to seasonal change.'}
              medicines={medicines.filter((m) => m.name && m.name.trim() !== '')}
              additionalInstructions={
                additionalInstructions ||
                'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'
              }
              onSendWhatsApp={() => {
                alert(`Prescription successfully sent via WhatsApp to ${selectedPatient.name}!`);
                handleFinalSave('WhatsApp');
              }}
              onDownloadPdf={() => {
                alert(`Downloading Prescription PDF for ${selectedPatient.name}...`);
                handleFinalSave('PDF');
              }}
            />
          </div>
        ) : (
        <form onSubmit={handleSubmit}>
          {/* Section 1: Patient Details */}
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Patient Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
              Search and select a patient for the prescription.
            </p>

            {/* Search Patient */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
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
                  height: '42px',
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
                    maxHeight: '160px',
                    overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 20,
                  }}
                >
                  {availablePatients
                    .filter((p) => {
                      const q = searchQuery.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.mobile && p.mobile.includes(q)) ||
                        (p.id && p.id.toLowerCase().includes(q))
                      );
                    })
                    .map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient({
                            id: p.id,
                            name: p.name,
                            phone: p.mobile,
                            age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
                            gender: p.ageGender?.split('/')[1]?.trim() || 'Adult',
                            ageGender: p.ageGender || '28 Years / Adult',
                            initials: p.initials || 'PT',
                          });
                          setSearchQuery('');
                        }}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '13px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                      >
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{p.name} ({p.id})</span>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{p.mobile}</span>
                      </div>
                    ))}
                </div>
              )}
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
          </div>

          {/* Section 2: Visit Details */}
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Visit Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
              Enter the consultation information.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Appointment Date
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setIsCalendarOpen((prev) => !prev)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
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
                    <span style={{ fontSize: '14px' }}>📅</span>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Consultation Type
                </label>
                <select
                  value={consultationType}
                  onChange={(e) => setConsultationType(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="In-clinic Visit">In-clinic Visit</option>
                  <option value="Online Video">Online Video</option>
                  <option value="Follow-up Call">Follow-up Call</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Main Complaint
                </label>
                <select
                  value={mainComplaint}
                  onChange={(e) => setMainComplaint(e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="Skin Allergy">Skin Allergy</option>
                  <option value="Chronic Migraine">Chronic Migraine</option>
                  <option value="Digestive Issue">Digestive Issue</option>
                  <option value="Thyroid Consultation">Thyroid Consultation</option>
                  <option value="General Consultation">General Consultation</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Symptoms & Diagnosis */}
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Symptoms & Diagnosis
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
              Record patient's symptoms and your clinical diagnosis.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Symptoms (Optional)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setSymptoms(e.target.value);
                  }}
                  rows={3}
                  placeholder="Enter symptoms observed or shared by the patient..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {symptoms.length}/500
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Diagnosis / Case Notes (Optional)
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setDiagnosis(e.target.value);
                  }}
                  rows={3}
                  placeholder="Enter your diagnosis, observations or case notes..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {diagnosis.length}/500
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Prescription Details */}
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
              Prescription Details
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
              Add medicines and dosage instructions.
            </p>

            {/* Medicines Table */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', color: '#64748b', width: '36px' }}>No.</th>
                    <th style={{ padding: '10px 12px', color: '#64748b' }}>Medicine Name <span style={{ color: '#ef4444' }}>*</span></th>
                    <th style={{ padding: '10px 12px', color: '#64748b', width: '110px' }}>Potency <span style={{ color: '#ef4444' }}>*</span></th>
                    <th style={{ padding: '10px 12px', color: '#64748b', width: '110px' }}>Dosage <span style={{ color: '#ef4444' }}>*</span></th>
                    <th style={{ padding: '10px 12px', color: '#64748b', width: '75px' }}>Duration <span style={{ color: '#ef4444' }}>*</span></th>
                    <th style={{ padding: '10px 12px', color: '#64748b' }}>Instructions (Optional)</th>
                    <th style={{ padding: '10px 12px', color: '#64748b', width: '45px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, idx) => (
                    <tr key={med.id} style={{ borderBottom: idx < medicines.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select
                          value={med.name}
                          onChange={(e) => handleMedicineChange(med.id, 'name', e.target.value)}
                          style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        >
                          <option value="">Select medicine</option>
                          <option value="Arsenicum Album">Arsenicum Album</option>
                          <option value="Nux Vomica">Nux Vomica</option>
                          <option value="Pulsatilla">Pulsatilla</option>
                          <option value="Sepia">Sepia</option>
                          <option value="Belladonna">Belladonna</option>
                          <option value="Bryonia">Bryonia</option>
                          <option value="Natrum Muriaticum">Natrum Muriaticum</option>
                          <option value="Lycopodium">Lycopodium</option>
                          <option value="Sulphur">Sulphur</option>
                          <option value="Calcarea Carbonica">Calcarea Carbonica</option>
                          <option value="Thuja Occidentalis">Thuja Occidentalis</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select
                          value={med.potency}
                          onChange={(e) => handleMedicineChange(med.id, 'potency', e.target.value)}
                          style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        >
                          <option value="">Select</option>
                          <option value="30C">30C</option>
                          <option value="200C">200C</option>
                          <option value="1M">1M</option>
                          <option value="6X">6X</option>
                          <option value="Mother Tincture (Q)">Mother Tincture (Q)</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <select
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(med.id, 'dosage', e.target.value)}
                          style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                        >
                          <option value="">Select</option>
                          <option value="2 drops">2 drops</option>
                          <option value="4 pills">4 pills</option>
                          <option value="1 teaspoon">1 teaspoon</option>
                          <option value="10 drops in water">10 drops in water</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleMedicineChange(med.id, 'duration', e.target.value)}
                          placeholder="Days"
                          style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="text"
                          value={med.instructions}
                          onChange={(e) => handleMedicineChange(med.id, 'instructions', e.target.value)}
                          placeholder="e.g., 2 drops twice da..."
                          style={{ width: '100%', height: '36px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(med.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: medicines.length > 1 ? '#94a3b8' : '#cbd5e1',
                            cursor: medicines.length > 1 ? 'pointer' : 'not-allowed',
                            padding: '4px',
                          }}
                          title="Delete row"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* + Add Medicine Button */}
            <button
              type="button"
              onClick={handleAddMedicine}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #bbf7d0',
                backgroundColor: '#f0fdf4',
                color: '#166534',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              <span>+</span>
              <span>Add Medicine</span>
            </button>
          </div>

          {/* Section 5: Additional Instructions (Optional) */}
          <div style={{ marginBottom: '26px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
              Additional Instructions (Optional)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => {
                if (e.target.value.length <= 500) setAdditionalInstructions(e.target.value);
              }}
              rows={3}
              placeholder="Diet suggestions, precautions, follow-up notes, or any additional instructions..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
              {additionalInstructions.length}/500
            </div>
          </div>

          {/* Success Message Banner */}
          {successMessage && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '10px',
                color: '#065f46',
                fontSize: '13.5px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{successMessage}</span>
            </div>
          )}

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
            {/* 1. Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              Close
            </button>

            {/* 2. Save Button (Saves to Neon Database and links to Patient) */}
            <button
              type="button"
              onClick={handleSavePrescription}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isSaving ? '#94a3b8' : '#0f766e',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = '#0d655e';
              }}
              onMouseLeave={(e) => {
                if (!isSaving) e.currentTarget.style.backgroundColor = '#0f766e';
              }}
            >
              {isSaving ? (
                <>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '14px',
                      height: '14px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save</span>
                </>
              )}
            </button>

            {/* 3. Next Button (Advances to Prescription Preview) */}
            <button
              type="submit"
              disabled={isSaving}
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
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <span>Next</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </form>
        )}
        </div>
      </div>
    </div>
  );
};

export default NewPrescriptionModal;


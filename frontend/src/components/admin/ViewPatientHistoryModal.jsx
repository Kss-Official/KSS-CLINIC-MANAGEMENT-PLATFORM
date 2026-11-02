import React, { useState, useEffect, useRef } from 'react';
import AdminPagination from './AdminPagination';

const ViewPatientHistoryModal = ({
  isOpen,
  onClose,
  patient,
  onViewAppointment,
  onViewPrescription,
}) => {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointmentFilter, setAppointmentFilter] = useState('All');
  const [prescriptionFilter, setPrescriptionFilter] = useState('All');
  const [appointmentCurrentPage, setAppointmentCurrentPage] = useState(1);
  const [appointmentPageSize, setAppointmentPageSize] = useState('5 page');
  const [prescriptionCurrentPage, setPrescriptionCurrentPage] = useState(1);
  const [prescriptionPageSize, setPrescriptionPageSize] = useState('5 page');
  const scrollContainerRef = useRef(null);
  const appointmentCardRef = useRef(null);
  const prescriptionCardRef = useRef(null);

  // Lock background screen scroll and handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    setAppointmentCurrentPage(1);
    setPrescriptionCurrentPage(1);

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

  // Handle tab switching with reset to top of scroll container
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  // Patient data fallback to Rahul Sharma if none passed
  const currentPatient = patient || {
    id: 'PAT-1001',
    name: 'Rahul Sharma',
    initials: 'RS',
    ageGender: '28 Years / Male',
    mobile: '+91 98765 43210',
    email: 'rahul.sharma@gmail.com',
    address: '12, Green Park, MG Road, Bangalore, Karnataka - 560001',
    bloodGroup: 'O+',
    knownAllergies: 'Skin Allergy',
    primaryConcern: 'Chronic Skin Allergy',
    notes: 'Prefers WhatsApp communication for reports.',
  };

  const appointmentsList = patient?.appointments || [
    { date: '28 Oct 2026', time: '09:45 AM', reason: 'Skin Allergy', status: 'Completed' },
    { date: '12 Oct 2026', time: '04:00 PM', reason: 'Follow-up', status: 'Completed' },
    { date: '25 Sep 2026', time: '10:30 AM', reason: 'Chronic Migraine', status: 'Completed' },
    { date: '10 Sep 2026', time: '11:00 AM', reason: 'Consultation', status: 'Completed' },
    { date: '22 Aug 2026', time: '03:30 PM', reason: 'Digestive Issue', status: 'Completed' },
    { date: '08 Aug 2026', time: '02:00 PM', reason: 'Follow-up', status: 'Completed' },
    { date: '19 Jul 2026', time: '11:15 AM', reason: 'Skin Allergy', status: 'Completed' },
    { date: '03 Jul 2026', time: '10:30 AM', reason: 'Consultation', status: 'Completed' },
    { date: '15 Jun 2026', time: '04:45 PM', reason: 'Allergy Check', status: 'Completed' },
    { date: '28 May 2026', time: '09:30 AM', reason: 'Initial Consultation', status: 'Completed' },
  ];

  const prescriptionsList = patient?.prescriptions || [
    { id: 'RX-2026-1016', date: '28 Oct 2026', complaint: 'Skin Allergy', status: 'Delivered' },
    { id: 'RX-2026-1015', date: '12 Oct 2026', complaint: 'Follow-up', status: 'Sent' },
    { id: 'RX-2026-1014', date: '25 Sep 2026', complaint: 'Chronic Migraine', status: 'Delivered' },
    { id: 'RX-2026-1013', date: '10 Sep 2026', complaint: 'Consultation', status: 'Delivered' },
    { id: 'RX-2026-1012', date: '22 Aug 2026', complaint: 'Digestive Issue', status: 'Failed' },
    { id: 'RX-2026-1011', date: '08 Aug 2026', complaint: 'Follow-up', status: 'Delivered' },
    { id: 'RX-2026-1010', date: '19 Jul 2026', complaint: 'Skin Allergy', status: 'Delivered' },
    { id: 'RX-2026-1009', date: '03 Jul 2026', complaint: 'Consultation', status: 'Sent' },
    { id: 'RX-2026-1008', date: '15 Jun 2026', complaint: 'Allergy Check', status: 'Delivered' },
    { id: 'RX-2026-1007', date: '28 May 2026', complaint: 'Initial Consultation', status: 'Delivered' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
      case 'Delivered':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Sent':
        return { bg: '#eaf2ff', color: '#2563eb' };
      case 'Failed':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const filteredAppointments = appointmentsList.filter((item) => {
    if (appointmentFilter === 'All') return true;
    return item.status.toLowerCase() === appointmentFilter.toLowerCase();
  });

  const filteredPrescriptions = prescriptionsList.filter((item) => {
    if (prescriptionFilter === 'All') return true;
    return item.status.toLowerCase() === prescriptionFilter.toLowerCase();
  });

  // Dynamic pagination calculation for Appointments
  const aptLimit = parseInt(appointmentPageSize, 10) || 5;
  const aptTotalPages = Math.max(1, Math.ceil(filteredAppointments.length / aptLimit));
  const aptValidPage = Math.min(Math.max(1, appointmentCurrentPage), aptTotalPages);
  const paginatedAppointments = filteredAppointments.slice((aptValidPage - 1) * aptLimit, aptValidPage * aptLimit);

  // Dynamic pagination calculation for Prescriptions
  const rxLimit = parseInt(prescriptionPageSize, 10) || 5;
  const rxTotalPages = Math.max(1, Math.ceil(filteredPrescriptions.length / rxLimit));
  const rxValidPage = Math.min(Math.max(1, prescriptionCurrentPage), rxTotalPages);
  const paginatedPrescriptions = filteredPrescriptions.slice((rxValidPage - 1) * rxLimit, rxValidPage * rxLimit);

  // Render Sub-card 1: Appointment History
  const renderAppointmentCard = () => (
    <div
      key="appointments"
      className="admin-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: 0,
        boxShadow: activeTab === 'appointments' ? '0 4px 12px rgba(30, 70, 32, 0.05)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#1e4620' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
              Appointment History
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              List of all appointments for this patient.
            </p>
          </div>
        </div>

        <select
          value={appointmentFilter}
          onChange={(e) => { setAppointmentFilter(e.target.value); setAppointmentCurrentPage(1); }}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
            backgroundColor: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Time</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Reason for Visit</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No appointments found for this patient.
                </td>
              </tr>
            ) : (
              paginatedAppointments.map((row, idx) => {
              const badge = getStatusBadge(row.status);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 10px', fontWeight: '600', color: '#0f172a' }}>{row.date}</td>
                  <td style={{ padding: '10px 10px', color: '#64748b' }}>{row.time}</td>
                  <td style={{ padding: '10px 10px', color: '#334155' }}>{row.reason}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: badge.bg, color: badge.color }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onViewAppointment &&
                        onViewAppointment({
                          name: currentPatient.name,
                          contact: currentPatient.mobile,
                          date: row.date,
                          time: row.time,
                          reason: row.reason,
                          status: row.status,
                          id: `APT-${idx + 1001}`,
                          consultationType: 'In clinic Visit',
                          ageGender: currentPatient.ageGender,
                        })
                      }
                      style={{
                        padding: '3px 10px',
                        borderRadius: '5px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fff',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={aptValidPage}
        totalRecords={filteredAppointments.length}
        pageSize={appointmentPageSize}
        onPageChange={setAppointmentCurrentPage}
        onPageSizeChange={(newSize) => {
          setAppointmentPageSize(newSize);
          setAppointmentCurrentPage(1);
        }}
        pageSizeOptions={['5 page', '10 page', '20 page']}
        recordType="appointments"
      />
    </div>
  );

  // Render Sub-card 2: Prescription History
  const renderPrescriptionCard = () => (
    <div
      key="prescriptions"
      className="admin-card"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '20px',
        marginBottom: 0,
        boxShadow: activeTab === 'prescriptions' ? '0 4px 12px rgba(30, 70, 32, 0.05)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ color: '#1e4620' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
              Prescription History
            </h4>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              List of all prescriptions issued to this patient.
            </p>
          </div>
        </div>

        <select
          value={prescriptionFilter}
          onChange={(e) => { setPrescriptionFilter(e.target.value); setPrescriptionCurrentPage(1); }}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
            backgroundColor: '#fff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="All">All Status</option>
          <option value="Delivered">Delivered</option>
          <option value="Sent">Sent</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Prescription ID</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Main Complaint</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '8px 10px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrescriptions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No prescriptions found for this patient.
                </td>
              </tr>
            ) : (
              paginatedPrescriptions.map((row, idx) => {
              const badge = getStatusBadge(row.status);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '10px 10px', fontWeight: '600', color: '#0f172a' }}>{row.id}</td>
                  <td style={{ padding: '10px 10px', color: '#64748b' }}>{row.date}</td>
                  <td style={{ padding: '10px 10px', color: '#334155' }}>{row.complaint}</td>
                  <td style={{ padding: '10px 10px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600', backgroundColor: badge.bg, color: badge.color }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() =>
                        onViewPrescription &&
                        onViewPrescription({
                          ...row,
                          id: row.id || row.rxId,
                          rxId: row.id || row.rxId,
                          name: currentPatient.name,
                          patientName: currentPatient.name,
                          patientId: currentPatient.id || row.patientId || row.patient_id_ref || 'PAT-1001',
                          date: row.date,
                          time: row.time,
                          complaint: row.complaint,
                          status: row.status,
                          ageGender: currentPatient.ageGender || row.ageGender,
                          mobile: currentPatient.mobile || row.mobile,
                          contact: currentPatient.mobile || row.mobile,
                          diagnosis: row.diagnosis || row.complaint || 'General Consultation',
                          medicines: row.medicines && row.medicines.length > 0 ? row.medicines : [],
                          symptoms: row.symptoms || '',
                          additionalInstructions: row.additionalInstructions || row.notes || '',
                          notes: row.additionalInstructions || row.notes || '',
                        })
                      }
                      style={{
                        padding: '3px 10px',
                        borderRadius: '5px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#fff',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })
            )}
          </tbody>
        </table>
      </div>

      <AdminPagination
        currentPage={rxValidPage}
        totalRecords={filteredPrescriptions.length}
        pageSize={prescriptionPageSize}
        onPageChange={setPrescriptionCurrentPage}
        onPageSizeChange={(newSize) => {
          setPrescriptionPageSize(newSize);
          setPrescriptionCurrentPage(1);
        }}
        pageSizeOptions={['5 page', '10 page', '20 page']}
        recordType="prescriptions"
      />
    </div>
  );

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
          maxWidth: '1100px',
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
          ref={scrollContainerRef}
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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                Patient History
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                View complete records for the selected patient.
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

          {/* 2-Column Grid Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* Left Column: Patient Profile Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '24px',
                boxSizing: 'border-box',
              }}
            >
              {/* Avatar & Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', paddingBottom: '18px', borderBottom: '1px solid #f1f5f9' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: '#bbf7d0',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {currentPatient.initials || currentPatient.name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                    {currentPatient.name}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {currentPatient.id}
                  </div>
                </div>
              </div>

              {/* Information Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Age / Gender</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{currentPatient.ageGender}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Mobile Number</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{currentPatient.mobile}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Email</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', wordBreak: 'break-all' }}>{currentPatient.email}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Address</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right', lineHeight: 1.35 }}>{currentPatient.address}</span>
                </div>

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Blood Group</span>
                  <span style={{ color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>{currentPatient.bloodGroup || 'O+'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Known Allergies</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{currentPatient.knownAllergies || 'Skin Allergy'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Primary Concern</span>
                  <span style={{ color: '#0f172a', fontWeight: '600', textAlign: 'right' }}>{currentPatient.primaryConcern || 'Chronic Skin Allergy'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ color: '#64748b', fontWeight: '500' }}>Notes</span>
                  <span style={{ color: '#0f172a', fontWeight: '500', textAlign: 'right', lineHeight: 1.35 }}>{currentPatient.notes || 'Prefers WhatsApp communication for reports.'}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Tabs & Records */}
            <div>
              {/* Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
                {[
                  { id: 'appointments', label: 'Appointments', icon: '📅' },
                  { id: 'prescriptions', label: 'Prescriptions', icon: '📄' },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabClick(tab.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '10px 4px 14px 4px',
                        fontSize: '14.5px',
                        fontWeight: isActive ? '700' : '500',
                        color: isActive ? '#1e4620' : '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        position: 'relative',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                      {isActive && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-1px',
                            left: 0,
                            right: 0,
                            height: '2.5px',
                            backgroundColor: '#1e4620',
                            borderRadius: '2px 2px 0 0',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Conditional Display: Display only the selected tab's data */}
              {activeTab === 'appointments' && (
                <div ref={appointmentCardRef}>
                  {renderAppointmentCard()}
                </div>
              )}

              {activeTab === 'prescriptions' && (
                <div ref={prescriptionCardRef}>
                  {renderPrescriptionCard()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPatientHistoryModal;

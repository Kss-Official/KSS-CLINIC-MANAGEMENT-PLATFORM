import React, { useState, useEffect, useRef } from 'react';
import AdminPagination from './AdminPagination';
import appointmentApi from '../../api/appointmentApi';

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

  const [enrichedPatient, setEnrichedPatient] = useState(patient || null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Synchronize and enrich patient data whenever modal opens or patient prop updates
  useEffect(() => {
    if (!isOpen || !patient) {
      setEnrichedPatient(patient || null);
      setIsLoadingDetails(false);
      return;
    }

    // Set initial patient object immediately
    setEnrichedPatient(patient);

    const targetPatientId = patient.id || patient.patientId || patient.patient_id_ref || patient.database_id;
    const hasFullRecords = Array.isArray(patient.appointments) && patient.appointments.length > 0 && patient.email;

    // If patient already has full records, no extra fetch needed
    if (hasFullRecords) {
      setIsLoadingDetails(false);
      return;
    }

    let isMounted = true;
    const fetchCompleteData = async () => {
      setIsLoadingDetails(true);
      let fullData = null;

      if (targetPatientId) {
        try {
          fullData = await appointmentApi.getPatientDetail(targetPatientId);
        } catch (e) {
          // fallback to getPatients list
        }
      }

      if (!fullData || !fullData.appointments) {
        try {
          const allPatients = await appointmentApi.getPatients();
          if (Array.isArray(allPatients)) {
            const cleanPhone = String(patient.mobile || patient.phone || patient.contact || '').replace(/\D/g, '').slice(-10);
            const patName = (patient.name || patient.patientName || '').trim().toLowerCase();

            fullData = allPatients.find((p) => {
              if (targetPatientId && (p.id === targetPatientId || p.patient_id === targetPatientId || String(p.database_id) === String(targetPatientId))) {
                return true;
              }
              const pPhone = String(p.mobile || p.phone || '').replace(/\D/g, '').slice(-10);
              if (cleanPhone && pPhone && cleanPhone === pPhone) {
                return true;
              }
              if (patName && p.name && p.name.trim().toLowerCase() === patName) {
                return true;
              }
              return false;
            });
          }
        } catch (err) {
          console.error('Error fetching patients list in modal:', err);
        }
      }

      if (isMounted && fullData) {
        setEnrichedPatient((prev) => ({
          ...(prev || {}),
          ...fullData,
          appointments: fullData.appointments || [],
          prescriptions: fullData.prescriptions || [],
        }));
      }

      if (isMounted) {
        setIsLoadingDetails(false);
      }
    };

    fetchCompleteData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, patient]);

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

  // Handle tab switching with smooth scroll to top of container
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!isOpen) return null;

  // Real patient data from database (enriched or fallback to prop)
  const currentPatient = enrichedPatient || patient || {
    id: '',
    name: '',
    initials: '',
    ageGender: '',
    mobile: '',
    email: '',
    address: '',
    bloodGroup: '',
    knownAllergies: '',
    primaryConcern: '',
    notes: '',
  };

  const appointmentsList = currentPatient?.appointments || [];
  const prescriptionsList = currentPatient?.prescriptions || [];

  const getStatusBadge = (status) => {
    const s = String(status || '').trim().toLowerCase();
    switch (s) {
      case 'confirmed':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      case 'complete':
      case 'completed':
        return { bg: '#eaf2ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'delivered':
        return { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' };
      case 'sent':
        return { bg: '#eaf2ff', color: '#1d4ed8', border: '#bfdbfe' };
      case 'pending':
        return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'cancelled':
      case 'failed':
        return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
    }
  };

  const filteredAppointments = appointmentsList.filter((item) => {
    if (appointmentFilter === 'All') return true;
    const itemStatus = String(item.status || '').toLowerCase();
    const filter = appointmentFilter.toLowerCase();
    if (filter === 'complete' || filter === 'completed') {
      return itemStatus === 'complete' || itemStatus === 'completed';
    }
    return itemStatus === filter;
  });

  const filteredPrescriptions = prescriptionsList.filter((item) => {
    if (prescriptionFilter === 'All') return true;
    const itemStatus = String(item.status || '').toLowerCase();
    return itemStatus === prescriptionFilter.toLowerCase();
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
        borderRadius: '16px',
        padding: '22px 24px',
        marginBottom: 0,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#e8f5ec',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
              Appointment History
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              List of all appointments for this patient.
            </p>
          </div>
        </div>

        <select
          value={appointmentFilter}
          onChange={(e) => { setAppointmentFilter(e.target.value); setAppointmentCurrentPage(1); }}
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12.5px',
            fontWeight: '500',
            color: '#334155',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="All">All Status</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Complete">Complete</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div
        className="admin-table-container"
        style={{
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '16px',
        }}
      >
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: '150px' }}>Date</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: '100px' }}>Time</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: '180px' }}>Reason for Visit</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', width: '110px' }}>Status</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingDetails ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13px' }}>
                  Loading appointments from database...
                </td>
              </tr>
            ) : filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13px' }}>
                  No appointments found matching your filter.
                </td>
              </tr>
            ) : (
              paginatedAppointments.map((row, idx) => {
                const badge = getStatusBadge(row.status);
                return (
                  <tr
                    key={row.id || idx}
                    className="admin-table-row"
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcfb',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafcfb')}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {row.date}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {row.time}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>
                      <div
                        title={row.reason}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: '1.45',
                        }}
                      >
                        {row.reason}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 11px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() =>
                          onViewAppointment &&
                          onViewAppointment({
                            name: currentPatient.name,
                            patient_name: currentPatient.name,
                            contact: currentPatient.mobile,
                            patient_phone: currentPatient.mobile,
                            date: row.date,
                            appointment_date: row.date,
                            time: row.time,
                            time_slot: row.time,
                            reason: row.reason,
                            reason_for_visit: row.reason,
                            status: row.status,
                            id: row.id || `APT-${idx + 1001}`,
                            appointment_id: row.id || (row.appointment_id || `APT-${idx + 1001}`),
                            consultationType: 'In clinic Visit',
                            ageGender: currentPatient.ageGender,
                          })
                        }
                        style={{
                          padding: '5px 14px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.color = '#0f172a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
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
        borderRadius: '16px',
        padding: '22px 24px',
        marginBottom: 0,
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#e8f5ec',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div>
            <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
              Prescription History
            </h4>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              List of all prescriptions issued to this patient.
            </p>
          </div>
        </div>

        <select
          value={prescriptionFilter}
          onChange={(e) => { setPrescriptionFilter(e.target.value); setPrescriptionCurrentPage(1); }}
          style={{
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '12.5px',
            fontWeight: '500',
            color: '#334155',
            backgroundColor: '#ffffff',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="All">All Status</option>
          <option value="Delivered">Delivered</option>
          <option value="Sent">Sent</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      <div
        className="admin-table-container"
        style={{
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          marginBottom: '16px',
        }}
      >
        <table style={{ width: '100%', minWidth: '640px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: '150px' }}>Prescription ID</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', whiteSpace: 'nowrap', width: '130px' }}>Date</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', minWidth: '180px' }}>Main Complaint</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', width: '110px' }}>Status</th>
              <th style={{ padding: '11px 14px', color: '#475569', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'center', width: '90px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingDetails ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13px' }}>
                  Loading prescriptions from database...
                </td>
              </tr>
            ) : filteredPrescriptions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13px' }}>
                  No prescriptions found matching your filter.
                </td>
              </tr>
            ) : (
              paginatedPrescriptions.map((row, idx) => {
                const badge = getStatusBadge(row.status);
                return (
                  <tr
                    key={row.id || idx}
                    className="admin-table-row"
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcfb',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafcfb')}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap' }}>
                      {row.id}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap' }}>
                      {row.date}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#334155' }}>
                      <div
                        title={row.complaint}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          wordBreak: 'break-word',
                          overflowWrap: 'anywhere',
                          lineHeight: '1.45',
                        }}
                      >
                        {row.complaint}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 11px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          textTransform: 'capitalize',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() =>
                          onViewPrescription &&
                          onViewPrescription({
                            ...row,
                            id: row.id || row.rxId,
                            rxId: row.id || row.rxId,
                            appointment_id: row.appointment_id || row.appointmentId || row.apt_number || row.aptNumber,
                            name: currentPatient.name,
                            patientName: currentPatient.name,
                            patientId: currentPatient.id || row.patientId || row.patient_id_ref || '',
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
                          padding: '5px 14px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          backgroundColor: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.color = '#0f172a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                          e.currentTarget.style.color = '#334155';
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
        zIndex: 9999,
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
          maxWidth: '1160px',
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
            padding: '28px 32px',
            flex: 1,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
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
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* 2-Column Grid Layout */}
          <div
            className="patient-history-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '320px minmax(0, 1fr)',
              gap: '24px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Patient Profile Card */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '24px 22px',
                boxSizing: 'border-box',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
              }}
            >
              {/* Avatar & Patient Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  marginBottom: '20px',
                  paddingBottom: '18px',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: '#dcfce7',
                    border: '1.5px solid #bbf7d0',
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '18px',
                    flexShrink: 0,
                    letterSpacing: '0.5px',
                  }}
                >
                  {currentPatient.initials || currentPatient.name?.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: '800',
                      color: '#0f172a',
                      margin: '0 0 4px 0',
                      lineHeight: 1.25,
                      wordBreak: 'break-word',
                    }}
                  >
                    {currentPatient.name}
                  </h3>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: '#475569',
                        backgroundColor: '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.3px',
                      }}
                    >
                      {currentPatient.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Information Rows with Aligned Colons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', fontSize: '13px' }}>
                {[
                  { label: 'Age / Gender', val: currentPatient.ageGender },
                  { label: 'Mobile Number', val: currentPatient.mobile },
                  { label: 'Email', val: currentPatient.email, breakAll: true },
                  { label: 'Address', val: currentPatient.address },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ width: '105px', minWidth: '105px', color: '#64748b', fontWeight: '500', fontSize: '12.5px' }}>
                      {row.label}
                    </span>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>:</span>
                    <span
                      style={{
                        flex: 1,
                        color: '#0f172a',
                        fontWeight: '600',
                        wordBreak: row.breakAll ? 'break-all' : 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {row.val || '—'}
                    </span>
                  </div>
                ))}

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                {[
                  { label: 'Blood Group', val: currentPatient.bloodGroup || 'O+', isBadge: true },
                  { label: 'Known Allergies', val: currentPatient.knownAllergies || 'Skin Allergy' },
                  { label: 'Primary Concern', val: currentPatient.primaryConcern || 'General Consultation' },
                  { label: 'Notes', val: currentPatient.notes || 'Registered via Appointment Booking.' },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ width: '105px', minWidth: '105px', color: '#64748b', fontWeight: '500', fontSize: '12.5px' }}>
                      {row.label}
                    </span>
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>:</span>
                    <span
                      style={{
                        flex: 1,
                        color: '#0f172a',
                        fontWeight: '600',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {row.isBadge ? (
                        <span style={{ display: 'inline-block', backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11.5px', fontWeight: '700', padding: '1px 8px', borderRadius: '4px' }}>
                          {row.val}
                        </span>
                      ) : (
                        row.val || '—'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Tabs & Records */}
            <div style={{ minWidth: 0, width: '100%' }}>
              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderBottom: '2px solid #f1f5f9',
                  marginBottom: '20px',
                  paddingBottom: '2px',
                }}
              >
                {[
                  { id: 'appointments', label: 'Appointments', icon: '📅', count: filteredAppointments.length },
                  { id: 'prescriptions', label: 'Prescriptions', icon: '📄', count: filteredPrescriptions.length },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabClick(tab.id)}
                      style={{
                        background: isActive ? '#f0fdf4' : 'transparent',
                        border: 'none',
                        borderBottom: isActive ? '2.5px solid #166534' : '2.5px solid transparent',
                        padding: '10px 16px 12px 16px',
                        fontSize: '14px',
                        fontWeight: isActive ? '700' : '600',
                        color: isActive ? '#166534' : '#64748b',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderRadius: '8px 8px 0 0',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#0f172a';
                          e.currentTarget.style.backgroundColor = '#f8fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.color = '#64748b';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          backgroundColor: isActive ? '#dcfce7' : '#e2e8f0',
                          color: isActive ? '#15803d' : '#64748b',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                        }}
                      >
                        {tab.count}
                      </span>
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

      <style>{`
        @media (max-width: 900px) {
          .patient-history-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ViewPatientHistoryModal;

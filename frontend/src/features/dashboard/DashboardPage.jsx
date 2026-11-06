import React, { useState, useRef, useEffect, useCallback } from 'react';
import appointmentApi from '../../api/appointmentApi';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../components/admin/AdminLayout';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';
import ActionDropdown from '../../components/admin/ActionDropdown';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminCalendarPopover from '../../components/admin/AdminCalendarPopover';
import { formatDateForDataset, parseDateString, matchesDateFilter as checkDateFilter } from '../../utils/dateFilterUtils';

const parseDateTimeString = (dateStr, timeStr) => {
  if (!dateStr) return 0;
  const d = parseDateString(dateStr);
  if (!d || isNaN(d.getTime())) return 0;

  if (timeStr) {
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const meridiem = (match[3] || '').toUpperCase();
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
    }
  }
  return d.getTime();
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { openNewAppointment, openNewPrescription, openViewAppointment, openViewPrescription } = useAdmin();

  // Filters & State
  const [appointmentDateFilter, setAppointmentDateFilter] = useState('All Dates');
  const [customDate, setCustomDate] = useState('');
  const [isPickingDate, setIsPickingDate] = useState(false);
  const dateInputRef = useRef(null);

  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('All');
  const [prescriptionDateFilter, setPrescriptionDateFilter] = useState('All Dates');
  const [prescriptionCustomDate, setPrescriptionCustomDate] = useState('');
  const [isPickingPrescriptionDate, setIsPickingPrescriptionDate] = useState(false);
  const prescriptionDateInputRef = useRef(null);
  const [prescriptionStatusFilter, setPrescriptionStatusFilter] = useState('All');
  const [prescriptionCurrentPage, setPrescriptionCurrentPage] = useState(1);
  const [prescriptionPageSize, setPrescriptionPageSize] = useState('5 page');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState('5 page');



  const [appointmentsData, setAppointmentsData] = useState([]);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(true);

  const mapApiAppointment = (item) => ({
    id: item.appointment_id || (item.id ? `APT-${item.id}` : 'APT-0000'),
    appointment_id: item.appointment_id || (item.id ? `APT-${item.id}` : 'APT-0000'),
    rawId: item.id,
    name: item.patient_name || item.name || 'Anonymous Patient',
    contact: item.patient_phone || item.contact || 'N/A',
    email: item.patient_email || item.email || '',
    date: item.appointment_date || item.date || '',
    time: item.time_slot || item.time || '',
    reason: item.reason_for_visit || item.reason || 'General Consultation',
    consultationType: item.consultation_type || item.consultationType || 'In clinic Visit',
    status: item.status || 'Confirmed',
    prescriptionStatus: item.prescription_status || item.prescriptionStatus || 'Pending',
    ageGender: item.age_gender || item.ageGender || 'Adult',
    notes: (item.clinical_remarks || item.notes || '') !== (item.reason_for_visit || '') ? (item.clinical_remarks || item.notes || '') : '',
    doctor: item.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
  });

  const fetchAppointments = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsAppointmentsLoading(true);
      }
      const data = await appointmentApi.getAppointments();
      if (Array.isArray(data)) {
        const mapped = data.map(mapApiAppointment);
        setAppointmentsData((prev) => {
          if (prev.length === mapped.length && JSON.stringify(prev) === JSON.stringify(mapped)) {
            return prev;
          }
          return mapped;
        });
      } else {
        setAppointmentsData([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard appointments:', err);
    } finally {
      if (!silent) {
        setIsAppointmentsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchAppointments(false);

    const handleAppointmentBooked = () => {
      fetchAppointments(true);
    };

    const handleFocus = () => {
      fetchAppointments(true);
    };

    window.addEventListener('appointment-booked', handleAppointmentBooked);
    window.addEventListener('appointment-updated', handleAppointmentBooked);
    window.addEventListener('appointment-deleted', handleAppointmentBooked);
    window.addEventListener('prescription-created', handleAppointmentBooked);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      fetchAppointments(true);
    }, 5000);

    return () => {
      window.removeEventListener('appointment-booked', handleAppointmentBooked);
      window.removeEventListener('appointment-updated', handleAppointmentBooked);
      window.removeEventListener('appointment-deleted', handleAppointmentBooked);
      window.removeEventListener('prescription-created', handleAppointmentBooked);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchAppointments]);
  const [prescriptionsData, setPrescriptionsData] = useState([]);
  const [isPrescriptionsLoading, setIsPrescriptionsLoading] = useState(true);

  const fetchPrescriptions = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsPrescriptionsLoading(true);
      }
      const data = await appointmentApi.getPrescriptions();
      if (Array.isArray(data)) {
        const mapped = data.map((item) => ({
          name: item.name || item.patientName || 'Patient',
          patientName: item.patientName || item.name || 'Patient',
          patientId: item.patientId || item.patient_id_ref || (item.patient?.id ? `PAT-${item.patient.id}` : (item.patient_record?.patient_id || '')),
          contact: item.contact || item.mobile || item.phone || item.patient_phone || '',
          mobile: item.mobile || item.contact || item.phone || item.patient_phone || '',
          rxId: item.rxId || item.id,
          id: item.rxId || item.id,
          prescriptionId: item.rxId || item.id,
          appointment_id: item.appointment_id || item.appointmentId || item.apt_number || item.aptNumber || '',
          appointmentId: item.appointment_id || item.appointmentId || item.apt_number || item.aptNumber || '',
          apt_number: item.apt_number || item.appointment_id || item.appointmentId || item.aptNumber || '',
          aptNumber: item.aptNumber || item.appointment_id || item.appointmentId || item.apt_number || '',
          database_id: item.database_id,
          created_at: item.created_at,
          date: item.date,
          time: item.time || '10:00 AM',
          consultationType: item.consultationType || item.consultation_type || 'Follow-up',
          ageGender: item.ageGender || item.age_gender || '',
          complaint: item.complaint || item.reason_for_visit || item.reason || '',
          symptoms: item.symptoms || '',
          diagnosis: item.diagnosis || '',
          medicines: item.medicines || [],
          additionalInstructions: item.additionalInstructions || item.notes || '',
          notes: item.notes || item.additionalInstructions || '',
          status: item.status || 'Confirmed',
        }));
        setPrescriptionsData((prev) => {
          if (prev.length === mapped.length && JSON.stringify(prev) === JSON.stringify(mapped)) {
            return prev;
          }
          return mapped;
        });
      } else {
        setPrescriptionsData([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard prescriptions from Neon:', err);
    } finally {
      if (!silent) {
        setIsPrescriptionsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions(false);

    const handlePrescriptionCreated = (e) => {
      fetchPrescriptions(true);
      if (e?.detail) {
        const item = e.detail;
        const formatted = {
          name: item.name || item.patientName || 'Patient',
          rxId: item.rxId || item.id,
          id: item.rxId || item.id,
          database_id: item.database_id,
          created_at: item.created_at,
          date: item.date,
          time: item.time || '10:00 AM',
          ageGender: item.ageGender || '',
          complaint: item.complaint || item.reason_for_visit || item.reason || '',
          symptoms: item.symptoms || '',
          diagnosis: item.diagnosis || '',
          medicines: item.medicines || [],
          additionalInstructions: item.additionalInstructions || '',
          status: item.status || 'Confirmed',
        };
        setPrescriptionsData((prev) => [
          formatted,
          ...prev.filter((p) => (p.rxId || p.id) !== formatted.rxId),
        ]);
      }
    };

    const handleFocus = () => {
      fetchPrescriptions(true);
    };

    window.addEventListener('prescription-created', handlePrescriptionCreated);
    window.addEventListener('prescription-updated', handlePrescriptionCreated);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      fetchPrescriptions(true);
    }, 5000);

    return () => {
      window.removeEventListener('prescription-created', handlePrescriptionCreated);
      window.removeEventListener('prescription-updated', handlePrescriptionCreated);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchPrescriptions]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
      case 'Delivered':
        return {
          bg: '#e8f7ee',
          color: '#1e7e34',
        };
      case 'Pending':
        return {
          bg: '#fef7e6',
          color: '#b45309',
        };
      case 'Complete':
      case 'Completed':
      case 'Sent':
        return {
          bg: '#eaf2ff',
          color: '#2563eb',
        };
      case 'Failed':
        return {
          bg: '#fee2e2',
          color: '#dc2626',
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#475569',
        };
    }
  };

  const handleDateFilterChange = (val) => {
    setCurrentPage(1);
    if (val === 'Select Date') {
      setIsPickingDate(true);
    } else {
      setIsPickingDate(false);
      setAppointmentDateFilter(val);
    }
  };

  const handleCustomDatePicked = (isoVal) => {
    if (!isoVal) return;
    setCustomDate(isoVal);
    const formatted = formatDateForDataset(isoVal);
    setAppointmentDateFilter(`Custom: ${formatted}`);
    setIsPickingDate(false);
    setCurrentPage(1);
  };

  const matchesDateFilter = (itemDate) => checkDateFilter(itemDate, appointmentDateFilter);

  // Dynamic appointment metric counts from Neon PostgreSQL
  const totalDashboardAppointments = appointmentsData.length;
  const completedDashboardAppointments = appointmentsData.filter(a => ['complete', 'completed'].includes((a.status || '').toLowerCase().trim())).length;
  const confirmedDashboardAppointments = appointmentsData.filter(a => ['confirmed', 'confirm', 'pending'].includes((a.status || '').toLowerCase().trim())).length;

  const filteredAppointmentsData = appointmentsData.filter((item) => {
    const matchesDate = matchesDateFilter(item.date);
    const itemStatus = (item.status || '').toLowerCase().trim();
    let matchesStatus = true;
    if (appointmentStatusFilter !== 'All') {
      const filterLower = appointmentStatusFilter.toLowerCase().trim();
      if (filterLower === 'completed' || filterLower === 'complete') {
        matchesStatus = ['complete', 'completed'].includes(itemStatus);
      } else if (filterLower === 'pending' || filterLower === 'confirmed') {
        matchesStatus = ['pending', 'confirmed'].includes(itemStatus);
      } else {
        matchesStatus = itemStatus === filterLower;
      }
    }
    return matchesDate && matchesStatus;
  });

  const handlePrescriptionDateFilterChange = (val) => {
    setPrescriptionCurrentPage(1);
    if (val === 'Select Date') {
      setIsPickingPrescriptionDate(true);
    } else {
      setIsPickingPrescriptionDate(false);
      setPrescriptionDateFilter(val);
    }
  };

  const handlePrescriptionCustomDatePicked = (isoVal) => {
    if (!isoVal) return;
    setPrescriptionCustomDate(isoVal);
    const formatted = formatDateForDataset(isoVal);
    setPrescriptionDateFilter(`Custom: ${formatted}`);
    setIsPickingPrescriptionDate(false);
    setPrescriptionCurrentPage(1);
  };

  const matchesPrescriptionDateFilter = (itemDate) => checkDateFilter(itemDate, prescriptionDateFilter);

  // Sort most recently created prescriptions first (newest created at the top)
  const allFilteredPrescriptions = prescriptionsData
    .filter((item) => {
      const matchesDate = matchesPrescriptionDateFilter(item.date);
      const matchesStatus =
        prescriptionStatusFilter === 'All' ||
        item.status.toLowerCase() === prescriptionStatusFilter.toLowerCase();
      return matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      if (b.database_id && a.database_id && b.database_id !== a.database_id) {
        return b.database_id - a.database_id;
      }
      if (b.created_at && a.created_at && b.created_at !== a.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (b.rxId && a.rxId && b.rxId !== a.rxId) {
        return b.rxId.localeCompare(a.rxId, undefined, { numeric: true });
      }
      const timeA = parseDateTimeString(a.date, a.time);
      const timeB = parseDateTimeString(b.date, b.time);
      return timeB - timeA;
    });

  // Dynamic pagination for Recent Prescriptions
  const prescriptionLimit = parseInt(prescriptionPageSize, 10) || 5;
  const totalPrescriptionPages = Math.max(1, Math.ceil(allFilteredPrescriptions.length / prescriptionLimit));
  const validPrescriptionPage = Math.min(Math.max(1, prescriptionCurrentPage), totalPrescriptionPages);
  const paginatedPrescriptionsData = allFilteredPrescriptions.slice(
    (validPrescriptionPage - 1) * prescriptionLimit,
    validPrescriptionPage * prescriptionLimit
  );

  // Dynamic pagination calculation based on data and page size
  const limit = parseInt(pageSize, 10) || 5;
  const totalPages = Math.max(1, Math.ceil(filteredAppointmentsData.length / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedAppointmentsData = filteredAppointmentsData.slice((validPage - 1) * limit, validPage * limit);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Top Greeting Banner */}
      <div
        className="admin-dashboard-banner"
        style={{
          backgroundColor: '#eaf5ed',
          borderRadius: '20px',
          padding: '0 40px',
          height: '158px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#224938',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            GOOD MORNING,
          </div>
          <h1
            className="admin-dashboard-banner-title"
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#0a1c2a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            Dr. Kumar Tripathi Ampeh (Pat.)
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            Here's your clinic overview for today
          </p>
        </div>

        {/* Herbal Mortar Illustration */}
        <div
          className="admin-dashboard-banner-img-wrap"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <img
            src={bannerHerbsImg}
            alt="Herbal Medicine"
            className="admin-dashboard-banner-img"
            style={{
              height: '158px',
              maxHeight: '100%',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
              objectPosition: 'bottom right',
            }}
          />
        </div>
      </div>

      {/* 2. Four Metrics Summary Cards */}
      <div
        className="admin-dashboard-metrics-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '26px',
        }}
      >
        {/* Card 1: Total Appointments */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#dafaea',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Total Appointments
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isAppointmentsLoading ? '...' : totalDashboardAppointments}
            </span>
          </div>
        </div>

        {/* Card 2: Consultations Completed */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#e2eefe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Consultations Completed
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isAppointmentsLoading ? '...' : completedDashboardAppointments}
            </span>
          </div>
        </div>

        {/* Card 3: Consultations Confirmed */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#fef5d2',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Consultations Confirmed
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isAppointmentsLoading ? '...' : confirmedDashboardAppointments}
            </span>
          </div>
        </div>

        {/* Card 4: Prescriptions Issued */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#f5edff',
              color: '#8631d1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Prescriptions Issued
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isPrescriptionsLoading ? '...' : prescriptionsData.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: Upcoming Appointments */}
      <div
        className="admin-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          marginBottom: '26px',
        }}
      >
        {/* Header Controls */}
        <div
          className="admin-dashboard-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#e8f5ec',
                color: '#1e4620',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                Upcoming Appointments
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Your scheduled appointments for today.
              </p>
            </div>
          </div>

          <div className="admin-dashboard-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Date Dropdown with 5 options: All Dates, Today, Tomorrow, This Week, Select Date (Calendar) */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={appointmentDateFilter.startsWith('Custom:') ? 'Select Date' : appointmentDateFilter}
                onChange={(e) => handleDateFilterChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="All Dates">All Dates</option>
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This Week">This Week</option>
                <option value="Select Date">
                  {appointmentDateFilter.startsWith('Custom:')
                    ? `📅 ${appointmentDateFilter.replace('Custom: ', '')}`
                    : 'Select Date (Calendar)'}
                </option>
              </select>

              <AdminCalendarPopover
                isOpen={isPickingDate}
                onClose={() => setIsPickingDate(false)}
                selectedDate={appointmentDateFilter.startsWith('Custom:') ? appointmentDateFilter.replace('Custom: ', '') : (customDate || formatDateForDataset(new Date().toISOString().split('T')[0]))}
                onSelectDate={(displayStr, isoStr) => {
                  if (displayStr) {
                    setCustomDate(isoStr);
                    setAppointmentDateFilter(`Custom: ${displayStr}`);
                  } else {
                    setCustomDate('');
                    setAppointmentDateFilter('All Dates');
                  }
                  setIsPickingDate(false);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={appointmentStatusFilter}
              onChange={(e) => {
                setAppointmentStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Complete">Complete</option>
            </select>

            {/* New Appointment Button */}
            <button
              type="button"
              onClick={openNewAppointment}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#1e4620',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#163518')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e4620')}
            >
              <span>+</span>
              <span>New Appointment</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Time</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Contact</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', maxWidth: '240px', minWidth: '150px' }}>Reason for Visit</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '700', color: '#64748b', textAlign: 'center', width: '130px', minWidth: '130px', whiteSpace: 'nowrap' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isAppointmentsLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '18px',
                          height: '18px',
                          border: '2px solid #cbd5e1',
                          borderTopColor: '#1e4620',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span style={{ fontSize: '13.5px', fontWeight: '500' }}>Loading appointments from Neon PostgreSQL...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAppointmentsData.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No appointments found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedAppointmentsData.map((row, idx) => {
                  const badge = getStatusBadge(row.status);
                  return (
                    <tr
                      key={row.rawId || row.id || idx}
                      className="admin-table-row"
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#1e293b' }}>
                        {row.time}
                      </td>
                      <td style={{ padding: '14px 16px', position: 'relative' }}>
                        <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                          {row.name}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                        {row.contact}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155', maxWidth: '240px', minWidth: '150px' }}>
                        <div
                          title={row.reason || 'General Consultation'}
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
                          {row.reason || 'General Consultation'}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewAppointment(row);
                            }}
                            style={{
                              padding: '5px 14px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              fontSize: '12.5px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f1f5f9';
                              e.currentTarget.style.borderColor = '#cbd5e1';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ffffff';
                              e.currentTarget.style.borderColor = '#e2e8f0';
                            }}
                          >
                            View
                          </button>
                          <ActionDropdown
                            items={[
                              {
                                label: 'View Details',
                                icon: '👁️',
                                onClick: () => openViewAppointment(row),
                              },
                              {
                                label: 'Create Prescription',
                                icon: '🌿',
                                onClick: () => openNewPrescription(row),
                              },
                              ...(row.status !== 'Complete' && row.status !== 'Completed' ? [{
                                label: 'Mark as Complete',
                                icon: '✓',
                                onClick: async () => {
                                  try {
                                    const targetId = row.rawId || row.id;
                                    const res = await appointmentApi.updateAppointmentStatus(targetId, 'Complete');
                                    const updatedApt = res || row;
                                    window.dispatchEvent(new CustomEvent('appointment-updated', {
                                      detail: { id: targetId, status: 'Complete', appointment: updatedApt }
                                    }));
                                    const aptNum = updatedApt.appointment_id || row.appointment_id || (targetId ? `APT-${targetId}` : 'APT-0000');
                                    const pName = updatedApt.patient_name || row.patient_name || row.name || 'Patient';
                                    window.dispatchEvent(
                                      new CustomEvent('prescription-remaining-notification', {
                                        detail: {
                                          ...row,
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
                                    console.error('Failed to mark complete from dashboard:', err);
                                  }
                                }
                              }] : []),
                              {
                                label: 'Go to Appointments',
                                icon: '📅',
                                onClick: () => navigate('/appointments'),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <AdminPagination
          currentPage={validPage}
          totalRecords={filteredAppointmentsData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={['5 page', '10 page', '20 page']}
          recordType="appointments"
        />
      </div>

      {/* 4. Section: Recent Prescriptions */}
      <div
        className="admin-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          marginBottom: '26px',
        }}
      >
        <div
          className="admin-dashboard-card-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#e8f5ec',
                color: '#1e4620',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                Recent Prescriptions
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                Latest prescriptions issued.
              </p>
            </div>
          </div>

          <div className="admin-dashboard-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Date Dropdown with 5 options: All Dates, Today, Tomorrow, This Week, Select Date (Calendar) */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={prescriptionDateFilter.startsWith('Custom:') ? 'Select Date' : prescriptionDateFilter}
                onChange={(e) => handlePrescriptionDateFilterChange(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  color: '#334155',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="All Dates">All Dates</option>
                <option value="Today">Today</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="This Week">This Week</option>
                <option value="Select Date">
                  {prescriptionDateFilter.startsWith('Custom:')
                    ? `📅 ${prescriptionDateFilter.replace('Custom: ', '')}`
                    : 'Select Date (Calendar)'}
                </option>
              </select>

              <AdminCalendarPopover
                isOpen={isPickingPrescriptionDate}
                onClose={() => setIsPickingPrescriptionDate(false)}
                selectedDate={prescriptionDateFilter.startsWith('Custom:') ? prescriptionDateFilter.replace('Custom: ', '') : (prescriptionCustomDate || formatDateForDataset(new Date().toISOString().split('T')[0]))}
                onSelectDate={(displayStr, isoStr) => {
                  if (displayStr) {
                    setPrescriptionCustomDate(isoStr);
                    setPrescriptionDateFilter(`Custom: ${displayStr}`);
                  } else {
                    setPrescriptionCustomDate('');
                    setPrescriptionDateFilter('All Dates');
                  }
                  setIsPickingPrescriptionDate(false);
                }}
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={prescriptionStatusFilter}
              onChange={(e) => {
                setPrescriptionStatusFilter(e.target.value);
                setPrescriptionCurrentPage(1);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                color: '#334155',
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
        </div>

        <div className="admin-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '650px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Prescription ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>WhatsApp Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isPrescriptionsLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '36px',
                      color: '#94a3b8',
                      fontSize: '13.5px',
                    }}
                  >
                    Loading prescriptions from Neon database...
                  </td>
                </tr>
              ) : allFilteredPrescriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign: 'center',
                      padding: '36px',
                      color: '#94a3b8',
                      fontSize: '13.5px',
                    }}
                  >
                    No prescriptions found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedPrescriptionsData.map((row, idx) => {
                const badge = getStatusBadge(row.status);
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {row.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                      {row.rxId}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                      {row.date}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewPrescription(row);
                          }}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '12.5px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f1f5f9';
                            e.currentTarget.style.borderColor = '#cbd5e1';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                          }}
                        >
                          View
                        </button>
                        <ActionDropdown
                          items={[
                            {
                              label: 'View Prescription',
                              icon: '👁️',
                              onClick: () => openViewPrescription(row),
                            },
                            {
                              label: 'Go to Prescriptions',
                              icon: '📄',
                              onClick: () => navigate('/prescriptions'),
                            },
                            {
                              label: 'Send via WhatsApp',
                              icon: '📲',
                              onClick: () => openNewPrescription(row, 2),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer for Recent Prescriptions */}
        <AdminPagination
          currentPage={validPrescriptionPage}
          totalRecords={allFilteredPrescriptions.length}
          pageSize={prescriptionPageSize}
          onPageChange={setPrescriptionCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPrescriptionPageSize(newPageSize);
            setPrescriptionCurrentPage(1);
          }}
          pageSizeOptions={['5 page', '10 page', '20 page']}
          recordType="prescriptions"
        />
      </div>

      {/* 5. Section: Quick Actions */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#e8f5ec',
              color: '#1e4620',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
              Quick Actions
            </h2>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Common tasks for faster workflow.
            </p>
          </div>
        </div>

        <div className="admin-dashboard-quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Action 1: Add Patient */}
          <div
            onClick={openNewAppointment}
            style={{
              backgroundColor: '#f9fdfa',
              border: '1px solid #e1efe3',
              borderRadius: '14px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#edf7ee';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fdfa';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                marginBottom: '12px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              Add Patient
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Register a new patient
            </div>
          </div>

          {/* Action 2: Create Prescription */}
          <div
            id="dash-create-prescription-quick-action"
            onClick={() => openNewPrescription(null)}
            style={{
              backgroundColor: '#fbfcfd',
              border: '1px solid #eef2f6',
              borderRadius: '14px',
              padding: '28px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fbfcfd';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                marginBottom: '12px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
              + Create Prescription
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Generate a new prescription
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1080px) {
          .admin-dashboard-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .admin-dashboard-banner {
            height: auto !important;
            min-height: 120px !important;
            padding: 22px 18px !important;
          }
          .admin-dashboard-banner-title {
            font-size: 22px !important;
          }
          .admin-dashboard-banner-img {
            opacity: 0.28 !important;
            height: 120px !important;
          }
          .admin-dashboard-card-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .admin-dashboard-filter-group {
            width: 100% !important;
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .admin-dashboard-filter-group select,
          .admin-dashboard-filter-group button {
            flex: 1 1 calc(50% - 8px) !important;
          }
        }
        @media (max-width: 540px) {
          .admin-dashboard-metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-dashboard-quick-actions-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-dashboard-filter-group select,
          .admin-dashboard-filter-group button {
            flex: 1 1 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;

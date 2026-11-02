import React, { useState, useRef, useEffect, useCallback } from 'react';
import appointmentApi from '../../api/appointmentApi';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../components/admin/AdminLayout';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';
import ActionDropdown from '../../components/admin/ActionDropdown';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminCalendarPopover from '../../components/admin/AdminCalendarPopover';

const formatDateForDataset = (isoStr) => {
  if (!isoStr) return '';
  const [year, month, day] = isoStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${monthName} ${year}`;
};

const parseDateString = (str) => {
  if (!str) return null;
  const parts = str.trim().split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = months.indexOf(parts[1].toLowerCase());
    const year = parseInt(parts[2], 10);
    if (month !== -1 && !isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return new Date(str);
};

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
    rawId: item.id,
    name: item.patient_name || item.name || 'Anonymous Patient',
    contact: item.patient_phone || item.contact || 'N/A',
    email: item.patient_email || item.email || '',
    date: item.appointment_date || item.date || '',
    time: item.time_slot || item.time || '',
    reason: item.reason_for_visit || item.reason || 'General Consultation',
    consultationType: item.consultation_type || item.consultationType || 'In clinic Visit',
    status: item.status || 'Pending',
    ageGender: item.age_gender || item.ageGender || 'Adult',
    notes: item.notes || item.reason_for_visit || '',
    doctor: item.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
  });

  const fetchAppointments = useCallback(async () => {
    try {
      setIsAppointmentsLoading(true);
      const data = await appointmentApi.getAppointments();
      if (Array.isArray(data)) {
        setAppointmentsData(data.map(mapApiAppointment));
      } else {
        setAppointmentsData([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard appointments:', err);
    } finally {
      setIsAppointmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();

    const handleAppointmentBooked = () => {
      fetchAppointments();
    };

    window.addEventListener('appointment-booked', handleAppointmentBooked);
    window.addEventListener('focus', fetchAppointments);

    return () => {
      window.removeEventListener('appointment-booked', handleAppointmentBooked);
      window.removeEventListener('focus', fetchAppointments);
    };
  }, [fetchAppointments]);
  const [prescriptionsData, setPrescriptionsData] = useState([]);
  const [isPrescriptionsLoading, setIsPrescriptionsLoading] = useState(true);

  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsPrescriptionsLoading(true);
      const data = await appointmentApi.getPrescriptions();
      if (Array.isArray(data)) {
        setPrescriptionsData(
          data.map((item) => ({
            name: item.name || item.patientName || 'Patient',
            rxId: item.rxId || item.id,
            id: item.rxId || item.id,
            date: item.date,
            time: item.time || '10:00 AM',
            ageGender: item.ageGender || '',
            complaint: item.complaint || 'Consultation',
            symptoms: item.symptoms || '',
            diagnosis: item.diagnosis || '',
            medicines: item.medicines || [],
            additionalInstructions: item.additionalInstructions || '',
            status: item.status || 'Delivered',
          }))
        );
      } else {
        setPrescriptionsData([]);
      }
    } catch (err) {
      console.error('Failed to load dashboard prescriptions from Neon:', err);
    } finally {
      setIsPrescriptionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();

    const handlePrescriptionCreated = () => {
      fetchPrescriptions();
    };

    window.addEventListener('prescription-created', handlePrescriptionCreated);
    window.addEventListener('focus', fetchPrescriptions);

    return () => {
      window.removeEventListener('prescription-created', handlePrescriptionCreated);
      window.removeEventListener('focus', fetchPrescriptions);
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

  const matchesDateFilter = (itemDate) => {
    if (appointmentDateFilter === 'All Dates' || !appointmentDateFilter) return true;
    if (appointmentDateFilter === 'Today') return itemDate === '28 Oct 2026';
    if (appointmentDateFilter === 'Tomorrow') return itemDate === '29 Oct 2026';
    if (appointmentDateFilter === 'This Week') {
      const d = parseDateString(itemDate);
      if (!d) return false;
      const startOfWeek = new Date(2026, 9, 25);
      const endOfWeek = new Date(2026, 9, 31, 23, 59, 59);
      return d >= startOfWeek && d <= endOfWeek;
    }
    if (appointmentDateFilter.startsWith('Custom:')) {
      const targetDate = appointmentDateFilter.replace('Custom: ', '').trim();
      return itemDate === targetDate;
    }
    return itemDate === appointmentDateFilter;
  };

  // Dynamic appointment metric counts from Neon PostgreSQL
  const totalDashboardAppointments = appointmentsData.length;
  const completedDashboardAppointments = appointmentsData.filter(a => (a.status || '').toLowerCase() === 'completed').length;
  const pendingDashboardAppointments = appointmentsData.filter(a => (a.status || '').toLowerCase() === 'pending').length;

  const filteredAppointmentsData = appointmentsData.filter((item) => {
    const matchesDate = matchesDateFilter(item.date);
    const matchesStatus =
      appointmentStatusFilter === 'All' || item.status.toLowerCase() === appointmentStatusFilter.toLowerCase();
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

  const matchesPrescriptionDateFilter = (itemDate) => {
    if (prescriptionDateFilter === 'All Dates' || !prescriptionDateFilter) return true;
    if (prescriptionDateFilter === 'Today') return itemDate === '28 Oct 2026';
    if (prescriptionDateFilter === 'Tomorrow') return itemDate === '29 Oct 2026';
    if (prescriptionDateFilter === 'This Week') {
      const d = parseDateString(itemDate);
      if (!d) return false;
      const startOfWeek = new Date(2026, 9, 25);
      const endOfWeek = new Date(2026, 9, 31, 23, 59, 59);
      return d >= startOfWeek && d <= endOfWeek;
    }
    if (prescriptionDateFilter.startsWith('Custom:')) {
      const targetDate = prescriptionDateFilter.replace('Custom: ', '').trim();
      return itemDate === targetDate;
    }
    return itemDate === prescriptionDateFilter;
  };

  // Sort most recently created prescriptions first (descending by date and time)
  const allFilteredPrescriptions = prescriptionsData
    .filter((item) => {
      const matchesDate = matchesPrescriptionDateFilter(item.date);
      const matchesStatus =
        prescriptionStatusFilter === 'All' ||
        item.status.toLowerCase() === prescriptionStatusFilter.toLowerCase();
      return matchesDate && matchesStatus;
    })
    .sort((a, b) => {
      const timeA = parseDateTimeString(a.date, a.time);
      const timeB = parseDateTimeString(b.date, b.time);
      if (timeB !== timeA) return timeB - timeA;
      return (b.rxId || '').localeCompare(a.rxId || '');
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
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '26px',
        }}
      >
        {/* Card 1: Today's Appointments */}
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
              Today's Appointments
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

        {/* Card 3: Consultations Pending */}
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
              Consultations Pending
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isAppointmentsLoading ? '...' : pendingDashboardAppointments}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                selectedDate={appointmentDateFilter.startsWith('Custom:') ? appointmentDateFilter.replace('Custom: ', '') : (customDate || '28 Oct 2026')}
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
              <option value="Pending">Pending</option>
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
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Time</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Contact</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Reason for Visit</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12.5px', fontWeight: '600', color: '#64748b', textAlign: 'center' }}>Action</th>
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
                      key={idx}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#1e293b' }}>
                        {row.time}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                        {row.contact}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155' }}>
                        {row.reason}
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
                            onClick={() => openViewAppointment(row)}
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
                                label: 'Go to Appointments',
                                icon: '📅',
                                onClick: () => navigate('/appointments'),
                              },
                              {
                                label: 'Create Prescription',
                                icon: '🌿',
                                onClick: () => openNewPrescription(),
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                selectedDate={prescriptionDateFilter.startsWith('Custom:') ? prescriptionDateFilter.replace('Custom: ', '') : (prescriptionCustomDate || '28 Oct 2026')}
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

            <button
              type="button"
              onClick={() => navigate('/prescriptions')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'none',
                border: 'none',
                color: '#1e4620',
                fontSize: '13.5px',
                fontWeight: '600',
                cursor: 'pointer',
                padding: '6px 8px',
              }}
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                          onClick={() => openViewPrescription(row)}
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
                              label: 'Resend via WhatsApp',
                              icon: '📲',
                              onClick: () =>
                                alert(`Prescription ${row.rxId} resent via WhatsApp to ${row.name}!`),
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
            onClick={openNewPrescription}
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
    </div>
  );
};

export default DashboardPage;

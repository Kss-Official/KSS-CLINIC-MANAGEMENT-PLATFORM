import React, { useState, useRef, useEffect, useCallback } from 'react';
import appointmentApi from '../../api/appointmentApi';
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

const AppointmentsPage = () => {
  const { openNewAppointment, openViewAppointment } = useAdmin();

  const [dateFilter, setDateFilter] = useState('All Dates');
  const [customDate, setCustomDate] = useState('');
  const [isPickingDate, setIsPickingDate] = useState(false);
  const dateInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('10 page');
  const [currentPage, setCurrentPage] = useState(1);

  const [appointmentsList, setAppointmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setIsLoading(true);
      setError(null);
      const data = await appointmentApi.getAppointments();
      if (Array.isArray(data)) {
        setAppointmentsList(data.map(mapApiAppointment));
      } else {
        setAppointmentsList([]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      setError('Unable to load appointments from Neon cloud database. Please verify backend connection.');
    } finally {
      setIsLoading(false);
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

  const handleUpdateStatus = async (aptId, newStatus) => {
    setAppointmentsList((prev) =>
      prev.map((apt) => (apt.id === aptId ? { ...apt, status: newStatus } : apt))
    );
    try {
      await appointmentApi.updateAppointmentStatus(aptId, newStatus);
    } catch (err) {
      console.error('Failed to update status on server:', err);
      fetchAppointments();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Pending':
        return { bg: '#fef7e6', color: '#b45309' };
      case 'Completed':
        return { bg: '#eaf2ff', color: '#2563eb' };
      case 'Cancelled':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const resetFilters = () => {
    setDateFilter('All Dates');
    setCustomDate('');
    setIsPickingDate(false);
    setStatusFilter('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleDateFilterChange = (val) => {
    setCurrentPage(1);
    if (val === 'Select Date') {
      setIsPickingDate(true);
    } else {
      setIsPickingDate(false);
      setDateFilter(val);
    }
  };

  const handleCustomDatePicked = (isoVal) => {
    if (!isoVal) return;
    setCustomDate(isoVal);
    const formatted = formatDateForDataset(isoVal);
    setDateFilter(`Custom: ${formatted}`);
    setIsPickingDate(false);
    setCurrentPage(1);
  };

  const matchesDateFilter = (itemDate) => {
    if (dateFilter === 'All Dates') return true;
    if (dateFilter === 'Today') return itemDate === '28 Oct 2026';
    if (dateFilter === 'Tomorrow') return itemDate === '29 Oct 2026';
    if (dateFilter === 'This Week') {
      const d = parseDateString(itemDate);
      if (!d) return false;
      const startOfWeek = new Date(2026, 9, 25);
      const endOfWeek = new Date(2026, 9, 31, 23, 59, 59);
      return d >= startOfWeek && d <= endOfWeek;
    }
    if (dateFilter.startsWith('Custom:')) {
      const targetDate = dateFilter.replace('Custom: ', '').trim();
      return itemDate === targetDate;
    }
    return itemDate === dateFilter;
  };

  // Filtered rows matching all filter criteria
  const filteredAppointments = appointmentsList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contact.includes(searchQuery) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesDate = matchesDateFilter(item.date);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dynamic pagination calculation based on data and page size
  // Dynamic metrics calculation from live Neon data
  const totalAppointmentsCount = appointmentsList.length;
  const completedCount = appointmentsList.filter((a) => (a.status || '').toLowerCase() === 'completed').length;
  const pendingCount = appointmentsList.filter((a) => (a.status || '').toLowerCase() === 'pending').length;
  const cancelledCount = appointmentsList.filter((a) => (a.status || '').toLowerCase() === 'cancelled').length;

  const limit = parseInt(pageSize, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedAppointments = filteredAppointments.slice((validPage - 1) * limit, validPage * limit);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Top Appointments Banner */}
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
            APPOINTMENTS
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
            Appointments
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            View and manage patient appointments.
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
              {isLoading ? '...' : totalAppointmentsCount}
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
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Consultations Completed
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isLoading ? '...' : completedCount}
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
              {isLoading ? '...' : pendingCount}
            </span>
          </div>
        </div>

        {/* Card 4: Cancelled */}
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
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Cancelled
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {isLoading ? '...' : cancelledCount}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Appointments Table Container */}
      <div
        className="admin-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Navigation Tabs and New Appointment CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '14px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Section Header Title */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '15.5px',
                fontWeight: '700',
                color: '#1e4620',
                position: 'relative',
                paddingBottom: '8px',
              }}
            >
              All Appointments
              <span
                style={{
                  position: 'absolute',
                  bottom: '-14px',
                  left: 0,
                  right: 0,
                  height: '2.5px',
                  backgroundColor: '#1e4620',
                  borderRadius: '1px',
                }}
              />
            </span>
          </div>

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

        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '22px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 500px' }}>
            {/* Date Dropdown with 5 options: All Dates, Today, Tomorrow, This Week, Select Date (Calendar) */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={dateFilter.startsWith('Custom:') ? 'Select Date' : dateFilter}
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
                  {dateFilter.startsWith('Custom:') ? `📅 ${dateFilter.replace('Custom: ', '')}` : 'Select Date (Calendar)'}
                </option>
              </select>

              <AdminCalendarPopover
                isOpen={isPickingDate}
                onClose={() => setIsPickingDate(false)}
                selectedDate={dateFilter.startsWith('Custom:') ? dateFilter.replace('Custom: ', '') : (customDate || '28 Oct 2026')}
                onSelectDate={(displayStr, isoStr) => {
                  if (displayStr) {
                    setCustomDate(isoStr);
                    setDateFilter(`Custom: ${displayStr}`);
                  } else {
                    setCustomDate('');
                    setDateFilter('All Dates');
                  }
                  setIsPickingDate(false);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
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
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by patient name, mobile or appointment ID..."
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={resetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1e4620')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Appointments Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>APPOINTMENT ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>PATIENT NAME</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>CONTACT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>DATE & TIME</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>REASON FOR VISIT</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textAlign: 'center' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
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
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#dc2626', fontSize: '13.5px' }}>
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={fetchAppointments}
                      style={{
                        marginTop: '12px',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        backgroundColor: '#1e4620',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                        fontWeight: '600',
                      }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No appointments found matching your filters.
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((row, idx) => {
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
                        {row.id}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                        {row.contact}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155', lineHeight: 1.35 }}>
                        <div>{row.date}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{row.time}</div>
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
                                label: 'Mark as Completed',
                                icon: '✓',
                                onClick: () => handleUpdateStatus(row.id, 'Completed'),
                              },
                              {
                                label: 'Mark as Confirmed',
                                icon: '📅',
                                onClick: () => handleUpdateStatus(row.id, 'Confirmed'),
                              },
                              {
                                label: 'Cancel Appointment',
                                icon: '✕',
                                danger: true,
                                onClick: () => handleUpdateStatus(row.id, 'Cancelled'),
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
          totalRecords={filteredAppointments.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={['10 page', '20 page', '50 page']}
          recordType="appointments"
        />
      </div>
    </div>
  );
};

export default AppointmentsPage;


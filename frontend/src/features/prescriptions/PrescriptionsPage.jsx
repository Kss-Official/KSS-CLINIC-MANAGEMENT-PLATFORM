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

const PrescriptionsPage = () => {
  const { openNewPrescription, openViewPrescription, openPatientHistory } = useAdmin();

  const [dateFilter, setDateFilter] = useState('All Dates');
  const [customDate, setCustomDate] = useState('');
  const [isPickingDate, setIsPickingDate] = useState(false);
  const dateInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState('All');
  const [patientFilter, setPatientFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('10 page');
  const [currentPage, setCurrentPage] = useState(1);

  const [prescriptionsList, setPrescriptionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentApi.getPrescriptions();
      setPrescriptionsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load prescriptions from Neon database:', err);
      setError('Failed to load prescriptions from database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();

    const handleRxCreated = () => {
      fetchPrescriptions();
    };

    window.addEventListener('prescription-created', handleRxCreated);
    window.addEventListener('focus', fetchPrescriptions);
    return () => {
      window.removeEventListener('prescription-created', handleRxCreated);
      window.removeEventListener('focus', fetchPrescriptions);
    };
  }, [fetchPrescriptions]);

  const handleUpdateRxStatus = (rxId, newStatus) => {
    setPrescriptionsList((prev) =>
      prev.map((rx) => (rx.id === rxId ? { ...rx, status: newStatus } : rx))
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Sent':
        return { bg: '#eaf2ff', color: '#2563eb' };
      case 'Pending':
        return { bg: '#fef7e6', color: '#b45309' };
      case 'Failed':
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
    setPatientFilter('All');
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

  const filteredPrescriptions = prescriptionsList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.complaint.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPatient =
      patientFilter === 'All' || item.name.toLowerCase() === patientFilter.toLowerCase();

    const matchesDate = matchesDateFilter(item.date);

    return matchesSearch && matchesStatus && matchesPatient && matchesDate;
  });

  // Dynamic pagination calculation based on data and page size
  const limit = parseInt(pageSize, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredPrescriptions.length / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedPrescriptions = filteredPrescriptions.slice((validPage - 1) * limit, validPage * limit);

  // Dynamic metrics derived directly from Neon database records
  const issuedTodayCount = prescriptionsList.filter((p) => p.date === 'Today' || p.date === formatDateForDataset(new Date().toISOString().split('T')[0])).length;
  const sentTodayCount = prescriptionsList.filter((p) => p.status === 'Sent' || p.status === 'Delivered').length;
  const pendingCount = prescriptionsList.filter((p) => p.status === 'Pending').length;
  const totalCount = prescriptionsList.length;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Banner */}
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
            PRESCRIPTIONS
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
            prescriptions
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            View, manage and track all issued prescription.
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
        {/* Card 1: Prescriptions Issued Today */}
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
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Prescriptions Issued Today
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {issuedTodayCount}
            </span>
          </div>
        </div>

        {/* Card 2: Sent via WhatsApp Today */}
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
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Sent via WhatsApp Today
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {sentTodayCount}
            </span>
          </div>
        </div>

        {/* Card 3: Pending to Send */}
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
              Pending to Send
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {pendingCount}
            </span>
          </div>
        </div>

        {/* Card 4: Total Prescriptions */}
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
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Total Prescriptions
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Prescriptions Table Container */}
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
        {/* Navigation Tabs and Create Prescription CTA */}
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
              All Prescriptions
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

          {/* Create Prescription Button */}
          <button
            type="button"
            onClick={openNewPrescription}
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
            <span>Create Prescription</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 540px' }}>
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
              <option value="Delivered">Delivered</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            {/* Patients Dropdown */}
            <select
              value={patientFilter}
              onChange={(e) => {
                setPatientFilter(e.target.value);
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
              <option value="All">All Patients</option>
              {Array.from(new Set(prescriptionsList.map((p) => p.name).filter(Boolean))).map((patientName) => (
                <option key={patientName} value={patientName}>
                  {patientName}
                </option>
              ))}
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
                placeholder="Search by patient name, prescription ID or sy..."
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

        {/* Prescriptions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Prescription ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Age / Gender</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Date</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Main Complaint</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>WhatsApp Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13.5px' }}>
                    Loading prescriptions from database...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#dc2626', fontSize: '13.5px' }}>
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={fetchPrescriptions}
                      style={{
                        marginTop: '10px',
                        padding: '6px 14px',
                        backgroundColor: '#1e4620',
                        color: '#ffffff',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                      }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredPrescriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No prescriptions found in database.
                  </td>
                </tr>
              ) : (
                paginatedPrescriptions.map((row, idx) => {
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
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {row.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                      {row.ageGender}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155', lineHeight: 1.35 }}>
                      <div>{row.date}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{row.time}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155' }}>
                      {row.complaint}
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
                              label: 'Resend via WhatsApp',
                              icon: '📲',
                              onClick: () => {
                                handleUpdateRxStatus(row.id, 'Delivered');
                                alert(`Prescription ${row.id} resent via WhatsApp to ${row.name}!`);
                              },
                            },
                            {
                              label: 'Mark as Delivered',
                              icon: '✓',
                              onClick: () => handleUpdateRxStatus(row.id, 'Delivered'),
                            },
                            {
                              label: 'View Patient History',
                              icon: '👤',
                              onClick: () =>
                                openPatientHistory({
                                  id: 'PAT-1001',
                                  name: row.name,
                                  ageGender: row.ageGender,
                                  mobile: '+91 98765 43210',
                                }),
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
          totalRecords={filteredPrescriptions.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={['10 page', '20 page', '50 page']}
          recordType="prescriptions"
        />
      </div>
    </div>
  );
};

export default PrescriptionsPage;

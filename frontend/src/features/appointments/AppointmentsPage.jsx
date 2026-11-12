import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import appointmentApi from '../../api/appointmentApi';
import { useAdmin } from '../../components/admin/AdminLayout';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';
import ActionDropdown from '../../components/admin/ActionDropdown';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminCalendarPopover from '../../components/admin/AdminCalendarPopover';
import { formatDateForDataset, parseDateString, matchesDateFilter as checkDateFilter, isCreatedToday } from '../../utils/dateFilterUtils';

const AppointmentsPage = () => {
  const { openNewAppointment, openViewAppointment, openNewPrescription, openPatientHistory } = useAdmin();

  const [dateFilter, setDateFilter] = useState('All Dates');
  const [customDate, setCustomDate] = useState('');
  const [isPickingDate, setIsPickingDate] = useState(false);
  const dateInputRef = useRef(null);

  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('All');
  const [prescriptionFilter, setPrescriptionFilter] = useState('All');
  const [unreadAptIds, setUnreadAptIds] = useState(new Set());

  // Listen for direct custom event filter changes
  useEffect(() => {
    const handleFilterEvent = (e) => {
      const status = e?.detail;
      if (status) {
        const norm = String(status).trim().toLowerCase();
        if (norm === 'confirmed') setStatusFilter('Confirmed');
        else if (norm === 'new' || norm === 'pending') setStatusFilter('New');
        else if (norm === 'complete' || norm === 'completed') setStatusFilter('Complete');
        else if (norm === 'cancelled') setStatusFilter('Cancelled');
        else if (norm === 'all') setStatusFilter('All');
        setCurrentPage(1);
      }
    };
    window.addEventListener('filter-appointments-status', handleFilterEvent);
    return () => window.removeEventListener('filter-appointments-status', handleFilterEvent);
  }, []);

  // Automatically sync statusFilter when navigated with ?status=... or ?filter=...
  useEffect(() => {
    const statusParam = searchParams.get('status') || searchParams.get('filter');
    if (statusParam) {
      const norm = statusParam.trim().toLowerCase();
      if (norm === 'confirmed') {
        setStatusFilter('Confirmed');
      } else if (norm === 'new' || norm === 'pending') {
        setStatusFilter('New');
      } else if (norm === 'complete' || norm === 'completed') {
        setStatusFilter('Complete');
      } else if (norm === 'cancelled') {
        setStatusFilter('Cancelled');
      } else if (norm === 'all') {
        setStatusFilter('All');
      }
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Load unread appointment IDs for accurate "New" filtering
  useEffect(() => {
    const loadUnreadApts = async () => {
      try {
        const notifData = await appointmentApi.getNotifications();
        if (notifData && Array.isArray(notifData.notifications)) {
          const ids = new Set();
          notifData.notifications.forEach((n) => {
            if (!n.is_read || (n.title && n.title.toLowerCase().includes('new'))) {
              if (n.appointment) {
                ids.add(n.appointment);
                ids.add(String(n.appointment));
                ids.add(Number(n.appointment));
              }
              if (n.raw_id) {
                ids.add(n.raw_id);
                ids.add(String(n.raw_id));
              }
              if (n.appointment_id) {
                ids.add(n.appointment_id);
                ids.add(String(n.appointment_id).toLowerCase());
              }
              if (n.appointment_details?.appointment_id) {
                ids.add(n.appointment_details.appointment_id);
                ids.add(String(n.appointment_details.appointment_id).toLowerCase());
              }
              if (n.appointment_details?.id) {
                ids.add(n.appointment_details.id);
                ids.add(String(n.appointment_details.id));
              }
            }
          });
          setUnreadAptIds(ids);
        }
      } catch (e) {}
    };
    loadUnreadApts();
    window.addEventListener('appointment-updated', loadUnreadApts);
    window.addEventListener('appointment-booked', loadUnreadApts);
    return () => {
      window.removeEventListener('appointment-updated', loadUnreadApts);
      window.removeEventListener('appointment-booked', loadUnreadApts);
    };
  }, []);


  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('10 page');
  const [currentPage, setCurrentPage] = useState(1);

  const [appointmentsList, setAppointmentsList] = useState(() => {
    try {
      const cached = localStorage.getItem('kss_cached_admin_appointments') || sessionStorage.getItem('kss_cached_admin_appointments');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });
  const [backendStats, setBackendStats] = useState(null);
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('kss_cached_admin_appointments') || sessionStorage.getItem('kss_cached_admin_appointments');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return false;
      }
    } catch {}
    return true;
  });
  const [error, setError] = useState(null);

  const mapApiAppointment = (item) => {
    const rxStatus = item.prescription_status || item.prescriptionStatus || 'Pending';
    const aptStatus = item.status || 'Confirmed';
    const aptId = item.appointment_id || (item.id ? (String(item.id).startsWith('APT-') ? item.id : `APT-${item.id}`) : 'APT-0000');
    const pId = item.patient_record?.patient_id || item.patient_id_ref || (item.patient_id ? (String(item.patient_id).startsWith('PAT-') ? item.patient_id : `PAT-${item.patient_id}`) : '');

    return {
      id: aptId,
      appointment_id: aptId,
      appointmentId: aptId,
      apt_number: aptId,
      aptNumber: aptId,
      rawId: item.id,
      patient_id: pId,
      patient_id_ref: pId,
      patientId: pId,
      name: item.patient_name || item.name || 'Anonymous Patient',
      patient_name: item.patient_name || item.name || 'Anonymous Patient',
      patientName: item.patient_name || item.name || 'Anonymous Patient',
      contact: item.patient_phone || item.contact || 'N/A',
      patient_phone: item.patient_phone || item.contact || 'N/A',
      patientPhone: item.patient_phone || item.contact || 'N/A',
      mobile: item.patient_phone || item.contact || 'N/A',
      email: item.patient_email || item.email || '',
      patient_email: item.patient_email || item.email || '',
      date: item.appointment_date || item.date || '',
      appointment_date: item.appointment_date || item.date || '',
      time: item.time_slot || item.time || '',
      time_slot: item.time_slot || item.time || '',
      timeSlot: item.time_slot || item.time || '',
      reason: item.reason_for_visit || item.reason || '',
      reason_for_visit: item.reason_for_visit || item.reason || '',
      reasonForVisit: item.reason_for_visit || item.reason || '',
      consultationType: item.consultation_type || item.consultationType || 'In clinic Visit',
      status: aptStatus,
      prescriptionStatus: rxStatus,
      prescription_status: rxStatus,
      ageGender: item.age_gender || item.ageGender || 'Adult',
      age_gender: item.age_gender || item.ageGender || 'Adult',
      notes: (item.clinical_remarks || item.notes || '') !== (item.reason_for_visit || '') ? (item.clinical_remarks || item.notes || '') : '',
      doctor: item.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
      createdAt: item.created_at || item.createdAt || '',
      created_at: item.created_at || item.createdAt || '',
    };
  };

  const fetchAppointments = useCallback(async (silent = false) => {
    try {
      if (!silent && appointmentsList.length === 0) {
        setIsLoading(true);
      }
      setError(null);
      const [data, stats] = await Promise.all([
        appointmentApi.getAppointments(),
        appointmentApi.getAppointmentStats().catch(() => null),
      ]);
      if (stats) {
        setBackendStats(stats);
      }
      if (Array.isArray(data)) {
        const mapped = data.map(mapApiAppointment);
        try {
          localStorage.setItem('kss_cached_admin_appointments', JSON.stringify(mapped));
          sessionStorage.setItem('kss_cached_admin_appointments', JSON.stringify(mapped));
        } catch {}
        setAppointmentsList((prev) => {
          if (prev.length === mapped.length && JSON.stringify(prev) === JSON.stringify(mapped)) {
            return prev;
          }
          return mapped;
        });
      } else {
        setAppointmentsList([]);
      }
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
      if (!silent && appointmentsList.length === 0) {
        setError('Unable to load appointments from Neon cloud database. Please verify backend connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [appointmentsList.length]);

  useEffect(() => {
    fetchAppointments();

    const handleRefresh = () => {
      fetchAppointments(true);
    };

    const handlePrescriptionCreated = (event) => {
      const detail = event?.detail;
      const aptId =
        detail?.appointment_id ||
        detail?.appointmentId ||
        detail?.apt_number ||
        detail?.aptNumber ||
        (detail?.appointment?.appointment_id) ||
        (detail?.appointment?.id);

      const pName = (detail?.patient_name || detail?.patient?.name || '').trim().toLowerCase();

      setAppointmentsList((prev) =>
        prev.map((apt) => {
          const matchesId =
            (aptId && (
              apt.id === aptId ||
              apt.appointment_id === aptId ||
              apt.rawId === aptId ||
              String(apt.rawId) === String(aptId) ||
              String(apt.id).toLowerCase() === String(aptId).toLowerCase()
            ));
          const matchesPatient = pName && apt.name && apt.name.toLowerCase() === pName;
          if (matchesId || (matchesPatient && !aptId)) {
            return { ...apt, prescriptionStatus: 'Complete', prescription_status: 'Complete' };
          }
          return apt;
        })
      );
      fetchAppointments(true);
    };

    window.addEventListener('appointment-booked', handleRefresh);
    window.addEventListener('appointment-updated', handleRefresh);
    window.addEventListener('appointment-deleted', handleRefresh);
    window.addEventListener('prescription-created', handlePrescriptionCreated);
    window.addEventListener('focus', handleRefresh);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchAppointments(true);
    }, 20000);

    return () => {
      window.removeEventListener('appointment-booked', handleRefresh);
      window.removeEventListener('appointment-updated', handleRefresh);
      window.removeEventListener('appointment-deleted', handleRefresh);
      window.removeEventListener('prescription-created', handlePrescriptionCreated);
      window.removeEventListener('focus', handleRefresh);
      clearInterval(interval);
    };
  }, [fetchAppointments]);

  const handleUpdateStatus = async (aptId, newStatus) => {
    const targetApt = appointmentsList.find((apt) => apt.id === aptId) || appointmentsList.find((apt) => apt.rawId === aptId);
    setAppointmentsList((prev) =>
      prev.map((apt) => (apt.id === aptId ? { ...apt, status: newStatus } : apt))
    );
    try {
      const res = await appointmentApi.updateAppointmentStatus(aptId, newStatus);
      const updatedApt = res || targetApt || { id: aptId, status: newStatus };
      window.dispatchEvent(
        new CustomEvent('appointment-updated', {
          detail: { id: aptId, status: newStatus, appointment: updatedApt },
        })
      );
      if (newStatus === 'Complete' || newStatus === 'Completed') {
        const aptNum = updatedApt.appointment_id || targetApt?.appointment_id || (aptId ? `APT-${aptId}` : 'APT-0000');
        const pName = updatedApt.patient_name || targetApt?.patient_name || targetApt?.name || 'Patient';
        window.dispatchEvent(
          new CustomEvent('prescription-remaining-notification', {
            detail: {
              ...(targetApt || {}),
              ...(updatedApt || {}),
              id: aptId,
              rawId: targetApt?.rawId || aptId,
              appointment_id: aptNum,
              patient_name: pName,
              name: pName,
              status: 'Completed',
              prescriptionStatus: 'Pending',
            },
          })
        );
      }
    } catch (err) {
      console.error('Failed to update status on server:', err);
      fetchAppointments();
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Complete':
      case 'Completed':
        return { bg: '#eaf2ff', color: '#2563eb' };
      case 'Pending':
        return { bg: '#fef7e6', color: '#b45309' };
      case 'Cancelled':
        return { bg: '#fee2e2', color: '#dc2626' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const getPrescriptionBadge = (rxStatus) => {
    switch (rxStatus) {
      case 'Complete':
      case 'Completed':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Pending':
      default:
        return { bg: '#fef7e6', color: '#b45309' };
    }
  };

  const resetFilters = () => {
    setDateFilter('All Dates');
    setCustomDate('');
    setIsPickingDate(false);
    setStatusFilter('All');
    setPrescriptionFilter('All');
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

  const matchesDateFilter = (item) => checkDateFilter(item, dateFilter);

  // Filtered rows matching all filter criteria
  const filteredAppointments = appointmentsList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.contact.includes(searchQuery) ||
      (item.reason && item.reason.toLowerCase().includes(searchQuery.toLowerCase()));

    // 1. Appointment Status filter - applies EXCLUSIVELY to appointment status (row.status)
    const matchesStatus = (() => {
      if (!statusFilter || statusFilter === 'All') return true;
      const aptStatus = String(item.status || 'Confirmed').trim().toLowerCase();
      const targetStatus = String(statusFilter).trim().toLowerCase();
      if (targetStatus === 'complete' || targetStatus === 'completed') {
        return aptStatus === 'complete' || aptStatus === 'completed';
      }
      if (targetStatus === 'confirmed') {
        return aptStatus === 'confirmed';
      }
      if (targetStatus === 'new' || targetStatus === 'pending') {
        // Include all records so New appears at the top, and other categories appear below it
        return true;
      }
      return aptStatus === targetStatus;
    })();

    // 2. Prescription Status filter - applies EXCLUSIVELY to prescription status (row.prescriptionStatus)
    const matchesPrescription = (() => {
      if (!prescriptionFilter || prescriptionFilter === 'All') return true;
      const rxStatus = String(item.prescriptionStatus || 'Pending').trim().toLowerCase();
      const targetRx = String(prescriptionFilter).trim().toLowerCase();
      if (targetRx === 'complete') {
        return rxStatus === 'complete' || rxStatus === 'completed';
      }
      return rxStatus === targetRx;
    })();

    const matchesDate = matchesDateFilter(item);

    return matchesSearch && matchesStatus && matchesPrescription && matchesDate;
  });

  // Dynamic pagination calculation based on data and page size
  // Dynamic metrics calculation from live Neon data
  const totalAppointmentsCount = appointmentsList.length;
  // Today's Appointments count: displays only appointments created on the current date, automatically resetting to 0 when a new day begins
  const todayAppointmentsCount = useMemo(() => {
    return appointmentsList.filter((a) => isCreatedToday(a.createdAt || a.created_at)).length;
  }, [appointmentsList]);
  const completedCount = appointmentsList.filter((a) => ['complete', 'completed'].includes((a.status || '').toLowerCase())).length;
  const pendingCount = appointmentsList.filter((a) => ['pending', 'confirmed'].includes((a.status || '').toLowerCase())).length;
  const cancelledCount = appointmentsList.filter((a) => (a.status || '').toLowerCase() === 'cancelled').length;

  const isItemNew = useCallback((item) => {
    if (!item) return false;
    const aptStatus = String(item.status || '').trim().toLowerCase();
    if (aptStatus === 'pending' || aptStatus === 'new') return true;
    if (unreadAptIds.has(item.rawId) || unreadAptIds.has(String(item.rawId)) || unreadAptIds.has(Number(item.rawId))) return true;
    if (unreadAptIds.has(item.id) || unreadAptIds.has(String(item.id).toLowerCase())) return true;
    return false;
  }, [unreadAptIds]);

  // Sort appointments so when statusFilter is 'New', New appointments appear at the top and other categories below
  const sortedAppointments = useMemo(() => {
    if (statusFilter === 'New') {
      return [...filteredAppointments].sort((a, b) => {
        const aNew = isItemNew(a);
        const bNew = isItemNew(b);
        if (aNew && !bNew) return -1;
        if (!aNew && bNew) return 1;
        const statusOrder = { confirmed: 1, complete: 2, completed: 2, cancelled: 3 };
        const aOrder = statusOrder[String(a.status || '').toLowerCase()] || 4;
        const bOrder = statusOrder[String(b.status || '').toLowerCase()] || 4;
        return aOrder - bOrder;
      });
    }
    return filteredAppointments;
  }, [filteredAppointments, statusFilter, isItemNew]);

  const limit = parseInt(pageSize, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(sortedAppointments.length / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedAppointments = sortedAppointments.slice((validPage - 1) * limit, validPage * limit);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Top Appointments Banner */}
      <div
        className="admin-page-banner"
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
            className="admin-page-banner-title"
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
          className="admin-page-banner-img-wrap"
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
            className="admin-page-banner-img"
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
        className="admin-metrics-grid"
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
              {isLoading ? '...' : todayAppointmentsCount}
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
            id="admin-new-appointment-btn"
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
          className="admin-page-filter-toolbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            marginBottom: '22px',
            flexWrap: 'wrap',
          }}
        >
          <div className="admin-page-filter-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 500px', flexWrap: 'wrap' }}>
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
                selectedDate={dateFilter.startsWith('Custom:') ? dateFilter.replace('Custom: ', '') : (customDate || formatDateForDataset(new Date().toISOString().split('T')[0]))}
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
              <option value="Complete">Complete</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* All Prescriptions Filter */}
            <select
              value={prescriptionFilter}
              onChange={(e) => {
                setPrescriptionFilter(e.target.value);
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
              <option value="All">All Prescriptions</option>
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
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
        <div className="admin-table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>APPOINTMENT ID</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>PATIENT NAME</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>CONTACT</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>DATE & TIME</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', maxWidth: '200px', minWidth: '130px' }}>REASON FOR VISIT</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>PRESCRIPTION</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '12px 10px', fontSize: '11.5px', fontWeight: '700', color: '#64748b', letterSpacing: '0.4px', textAlign: 'center', width: '110px', minWidth: '110px', whiteSpace: 'nowrap' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#dc2626', fontSize: '13.5px' }}>
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No appointments found matching your filters.
                  </td>
                </tr>
              ) : (
                <>
                  {statusFilter === 'New' && sortedAppointments.filter(isItemNew).length === 0 && (
                    <tr key="sec-hdr-empty-new" style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                      <td colSpan={8} style={{ padding: '12px 18px', borderLeft: '5px solid #16a34a' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px' }}>✨</span>
                            <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                              New Appointments Section
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '500', marginLeft: '6px' }}>
                              (0 new pending appointments — all other appointment categories listed below)
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '2px 10px', borderRadius: '9999px' }}>
                            0 New
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {paginatedAppointments.map((row, idx) => {
                  const badge = getStatusBadge(row.status);
                  const rxBadge = getPrescriptionBadge(row.prescriptionStatus);
                  const isNew = isItemNew(row);
                  const showNewSectionHdr = statusFilter === 'New' && isNew && idx === 0;
                  const showOtherSectionHdr = statusFilter === 'New' && !isNew && (idx === 0 || isItemNew(paginatedAppointments[idx - 1]));

                  return (
                    <React.Fragment key={row.rawId || row.id || idx}>
                      {showNewSectionHdr && (
                        <tr key="sec-hdr-new" style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
                          <td colSpan={8} style={{ padding: '11px 18px', borderLeft: '5px solid #16a34a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>✨</span>
                                <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#166534', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                                  New Appointments Section
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#15803d', fontWeight: '600' }}>
                                  (Prioritized at Top)
                                </span>
                              </div>
                              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', border: '1px solid #86efac', padding: '2px 10px', borderRadius: '9999px' }}>
                                {sortedAppointments.filter(isItemNew).length} New Appointments
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {showOtherSectionHdr && (
                        <tr key="sec-hdr-other" style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td colSpan={8} style={{ padding: '11px 18px', borderLeft: '5px solid #64748b', borderTop: '2px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px' }}>📋</span>
                                <span style={{ fontSize: '12.5px', fontWeight: '800', color: '#334155', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                                  Other Appointment Categories
                                </span>
                                <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: '500' }}>
                                  (Confirmed, Complete, Cancelled)
                                </span>
                              </div>
                              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', backgroundColor: '#e2e8f0', padding: '2px 10px', borderRadius: '9999px' }}>
                                {sortedAppointments.filter((it) => !isItemNew(it)).length} Appointments
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        className="admin-table-row"
                        style={{
                          borderBottom: '1px solid #f8fafc',
                          transition: 'all 0.3s ease',
                          backgroundColor: (statusFilter === 'New' && isNew) ? '#fbfdfc' : 'transparent',
                          borderLeft: (statusFilter === 'New' && isNew) ? '3px solid #16a34a' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = (statusFilter === 'New' && isNew) ? '#f0fdf4' : '#fafafa')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = (statusFilter === 'New' && isNew) ? '#fbfdfc' : 'transparent')}
                      >
                      <td style={{ padding: '13px 10px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                        {row.id}
                      </td>
                      <td style={{ padding: '13px 10px', position: 'relative' }}>
                        <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: '600' }}>
                          {row.name}
                        </span>
                      </td>
                      <td style={{ padding: '13px 10px', fontSize: '13.5px', color: '#64748b' }}>
                        {row.contact}
                      </td>
                      <td style={{ padding: '13px 10px', fontSize: '13.5px', color: '#334155', lineHeight: 1.35 }}>
                        <div>{row.date}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{row.time}</div>
                      </td>
                      <td style={{ padding: '13px 10px', fontSize: '13.5px', color: '#334155', maxWidth: '200px', minWidth: '130px' }}>
                        <div
                          title={row.reason || ''}
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
                          {row.reason || ''}
                        </div>
                      </td>
                      <td style={{ padding: '13px 10px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: rxBadge.bg,
                            color: rxBadge.color,
                            border: 'none',
                          }}
                        >
                          {row.prescriptionStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '13px 10px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '11.5px',
                            fontWeight: '600',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '13px 10px', textAlign: 'center' }}>
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
                                label: 'View Patient History',
                                icon: '👤',
                                onClick: () =>
                                  openPatientHistory({
                                    id: row.patientId || row.patient_id || (row.patient?.id ? `PAT-${row.patient.id}` : (row.rawId ? `PAT-${row.rawId}` : '')),
                                    name: row.name || row.patientName,
                                    ageGender: row.ageGender || row.age_gender,
                                    mobile: row.contact || row.mobile || '',
                                    email: row.email || row.patientEmail,
                                    address: row.address,
                                    bloodGroup: row.bloodGroup || row.blood_group,
                                    knownAllergies: row.knownAllergies || row.known_allergies,
                                    primaryConcern: row.reason || row.reason_for_visit,
                                    notes: row.clinicalRemarks || row.notes,
                                    appointments: row.patient?.appointments || row.appointments,
                                    prescriptions: row.patient?.prescriptions || row.prescriptions,
                                  }),
                              },
                              {
                                label: 'Create Prescription',
                                icon: '🌿',
                                onClick: () => openNewPrescription(row),
                              },
                              {
                                label: 'Mark as Complete',
                                icon: '✓',
                                onClick: () => handleUpdateStatus(row.id, 'Complete'),
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
                    </React.Fragment>
                  );
                })}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <AdminPagination
          currentPage={validPage}
          totalRecords={sortedAppointments.length}
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

      <style>{`
        @media (max-width: 1080px) {
          .admin-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .admin-page-banner {
            height: auto !important;
            min-height: 120px !important;
            padding: 22px 18px !important;
          }
          .admin-page-banner-title {
            font-size: 22px !important;
          }
          .admin-page-banner-img {
            opacity: 0.28 !important;
            height: 120px !important;
          }
          .admin-page-filter-toolbar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .admin-page-filter-group {
            width: 100% !important;
            flex: 1 1 100% !important;
          }
          .admin-page-filter-group select {
            flex: 1 1 calc(50% - 6px) !important;
          }
        }
        @media (max-width: 540px) {
          .admin-metrics-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-page-filter-group select,
          .admin-page-filter-group button {
            flex: 1 1 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentsPage;


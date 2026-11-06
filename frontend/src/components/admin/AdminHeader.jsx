import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogoImg from '../../assets/brand-logo.png';
import useAuth from '../../hooks/useAuth';
import appointmentApi from '../../api/appointmentApi';

const AdminHeader = ({ onToggleSidebar, onViewAppointment, onNewPrescription }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [confirmedReminders, setConfirmedReminders] = useState([]);
  const [confirmedPatientsCount, setConfirmedPatientsCount] = useState(0);
  const [isRemindersExpanded, setIsRemindersExpanded] = useState(true);
  const [dropdownFilter, setDropdownFilter] = useState('all'); // 'all' | 'new' | 'confirmed'
  const [isReminderPillVisible, setIsReminderPillVisible] = useState(true);
  const [isPillHovered, setIsPillHovered] = useState(false);
  const [pendingReminders, setPendingReminders] = useState([]);
  const [pendingPatientsCount, setPendingPatientsCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newAppointmentEnabled, setNewAppointmentEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_notification_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.newAppointment === 'boolean') {
          return parsed.newAppointment;
        }
      }
    } catch {}
    return true;
  });
  const [appointmentReminderEnabled, setAppointmentReminderEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_notification_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.appointmentReminder === 'boolean') {
          return parsed.appointmentReminder;
        }
      }
    } catch {}
    return true;
  });
  const [prescriptionUpdatesEnabled, setPrescriptionUpdatesEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_notification_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.prescriptionUpdates === 'boolean') {
          return parsed.prescriptionUpdates;
        }
      }
    } catch {}
    return true;
  });
  const [floatingNotification, setFloatingNotification] = useState(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const [clinicProfileImage, setClinicProfileImage] = useState(() => {
    return localStorage.getItem('clinic_profile_image') || user?.profile_image_url || null;
  });

  const fetchClinicProfileImage = async () => {
    try {
      const data = await appointmentApi.getClinicSettings();
      const imgUrl = data?.profile_image_url || data?.profileImageUrl || null;
      if (imgUrl) {
        setClinicProfileImage(imgUrl);
        localStorage.setItem('clinic_profile_image', imgUrl);
      } else {
        setClinicProfileImage(null);
        localStorage.removeItem('clinic_profile_image');
      }
    } catch (err) {
      // Ignore network errors on initial header mount
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await appointmentApi.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
        setConfirmedReminders(data.confirmed_reminders || []);
        setConfirmedPatientsCount(typeof data.confirmed_patients_count === 'number' ? data.confirmed_patients_count : 0);
        setPendingReminders(data.pending_reminders || []);
        setPendingPatientsCount(typeof data.pending_patients_count === 'number' ? data.pending_patients_count : 0);
        if (typeof data.new_appointment_enabled === 'boolean') {
          setNewAppointmentEnabled(data.new_appointment_enabled);
        }
        if (typeof data.appointment_reminder_enabled === 'boolean') {
          setAppointmentReminderEnabled(data.appointment_reminder_enabled);
        }
        if (typeof data.prescription_updates_enabled === 'boolean') {
          setPrescriptionUpdatesEnabled(data.prescription_updates_enabled);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  // Optimized periodic smooth animation: emerges smoothly, stays clearly visible, and disappears within 4–5s (faster 8s cycle)
  useEffect(() => {
    if (!appointmentReminderEnabled || confirmedReminders.length === 0) {
      setIsReminderPillVisible(false);
      return;
    }

    const VISIBLE_DURATION = 3800; // Remains visible for 3.8s, smoothly retracting by ~4.2s (within 4-5 seconds)
    const CYCLE_INTERVAL = 8000;   // Repeats faster (every 8 seconds)

    // Initially show
    setIsReminderPillVisible(true);

    let hideTimeout = setTimeout(() => {
      setIsReminderPillVisible(false);
    }, VISIBLE_DURATION);

    const interval = setInterval(() => {
      setIsReminderPillVisible(true);
      hideTimeout = setTimeout(() => {
        setIsReminderPillVisible(false);
      }, VISIBLE_DURATION);
    }, CYCLE_INTERVAL);

    return () => {
      clearInterval(interval);
      clearTimeout(hideTimeout);
    };
  }, [appointmentReminderEnabled, confirmedReminders.length]);

  // Auto-dismiss floating Prescription Remaining notification after 8 seconds
  useEffect(() => {
    if (!floatingNotification) return;
    const timer = setTimeout(() => {
      setFloatingNotification(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [floatingNotification]);

  const handleFloatingNotificationClick = (fn) => {
    setFloatingNotification(null);
    const item = fn?.data || fn || {};
    const formattedAptId = fn.appointment_id || item.appointment_id || (item.id ? ('APT-' + item.id) : 'APT-0000');
    const pName = fn.patient_name || item.patient_name || item.name || 'Patient';
    const aptToOpen = {
      ...item,
      id: formattedAptId,
      rawId: item.rawId || item.id,
      appointment_id: formattedAptId,
      patient_id_ref: item.patient_id_ref || item.patient_record?.patient_id || (item.patient_record_id ? `PAT-${item.patient_record_id}` : null) || 'PAT-1010',
      name: pName,
      patient_name: pName,
      contact: item.patient_phone || item.contact || item.phone || '',
      patient_phone: item.patient_phone || item.contact || item.phone || '',
      email: item.patient_email || item.email || '',
      date: item.appointment_date || item.date || '',
      appointment_date: item.appointment_date || item.date || '',
      time: item.time_slot || item.time || '',
      time_slot: item.time_slot || item.time || '',
      reason: item.reason_for_visit || item.reason || 'Homeopathic Consultation',
      reason_for_visit: item.reason_for_visit || item.reason || 'Homeopathic Consultation',
      consultationType: item.consultation_type || item.consultationType || 'In clinic Visit',
      status: 'Completed',
      prescriptionStatus: 'Pending',
      ageGender: item.age_gender || item.ageGender || 'Adult',
      age: item.patient_age || item.age || (item.age_gender ? item.age_gender.split('/')[0].trim() : '30'),
      gender: item.patient_gender || item.gender || (item.age_gender ? item.age_gender.split('/')[1]?.trim() : 'Adult'),
      notes: item.notes || item.reason_for_visit || 'Homeopathic Consultation',
      doctor: item.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
    };

    sessionStorage.setItem('pending_prescription_patient', JSON.stringify(aptToOpen));
    navigate('/prescriptions', { state: { openNewPrescription: true, patient: aptToOpen } });
    if (typeof onNewPrescription === 'function') {
      onNewPrescription(aptToOpen);
    }
    window.dispatchEvent(new CustomEvent('open-create-prescription', { detail: aptToOpen }));
  };

  useEffect(() => {
    fetchNotifications();
    fetchClinicProfileImage();

    // Listen to custom event when clinic profile image is updated
    const handleClinicImageUpdated = (e) => {
      const newImg = e?.detail?.profile_image_url || null;
      setClinicProfileImage(newImg);
      if (newImg) {
        localStorage.setItem('clinic_profile_image', newImg);
      } else {
        localStorage.removeItem('clinic_profile_image');
      }
    };
    window.addEventListener('clinic-profile-image-updated', handleClinicImageUpdated);

    // Listen to custom event when notification settings are updated
    const handleNotificationSettingsUpdated = (e) => {
      const updated = e?.detail;
      if (updated) {
        if (typeof updated.newAppointment === 'boolean') {
          setNewAppointmentEnabled(updated.newAppointment);
        }
        if (typeof updated.appointmentReminder === 'boolean') {
          setAppointmentReminderEnabled(updated.appointmentReminder);
        }
        if (typeof updated.prescriptionUpdates === 'boolean') {
          setPrescriptionUpdatesEnabled(updated.prescriptionUpdates);
        }
      }
      fetchNotifications();
    };
    window.addEventListener('notification-settings-updated', handleNotificationSettingsUpdated);

    // Listen to appointment changes anywhere in the app for automatic real-time updates
    const handleAppointmentChanged = () => {
      fetchNotifications();
    };
    window.addEventListener('appointment-booked', handleAppointmentChanged);
    window.addEventListener('appointment-updated', handleAppointmentChanged);
    window.addEventListener('appointment-deleted', handleAppointmentChanged);
    window.addEventListener('appointment-settings-updated', handleAppointmentChanged);
    window.addEventListener('prescription-created', handleAppointmentChanged);

    // Immediate Prescription Remaining Notification listener
    const handlePrescriptionRemainingEvent = (e) => {
      const detail = e?.detail;
      if (!detail) return;
      try {
        const saved = localStorage.getItem('clinic_notification_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.prescriptionUpdates === false) {
            return;
          }
        }
      } catch {}

      const aptNum = detail.appointment_id || (detail.id ? `APT-${detail.id}` : 'APT-0000');
      const pName = detail.patient_name || detail.name || 'Patient';

      setFloatingNotification({
        id: detail.id || detail.rawId,
        appointment_id: aptNum,
        patient_name: pName,
        status: 'Completed',
        data: detail,
      });

      fetchNotifications();
    };
    window.addEventListener('prescription-remaining-notification', handlePrescriptionRemainingEvent);

    // Poll every 5 seconds for real-time automatic notification updates
    const interval = setInterval(fetchNotifications, 5000);

    // Outside click to close notification and profile dropdowns
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      clearInterval(interval);
      window.removeEventListener('clinic-profile-image-updated', handleClinicImageUpdated);
      window.removeEventListener('notification-settings-updated', handleNotificationSettingsUpdated);
      window.removeEventListener('appointment-booked', handleAppointmentChanged);
      window.removeEventListener('appointment-updated', handleAppointmentChanged);
      window.removeEventListener('appointment-deleted', handleAppointmentChanged);
      window.removeEventListener('appointment-settings-updated', handleAppointmentChanged);
      window.removeEventListener('prescription-created', handleAppointmentChanged);
      window.removeEventListener('prescription-remaining-notification', handlePrescriptionRemainingEvent);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await appointmentApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const handleMarkSingleRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await appointmentApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const navigateToFilteredAppointments = (status) => {
    setNotificationsOpen(false);
    navigate(`/appointments?status=${status}`);
    window.dispatchEvent(new CustomEvent('filter-appointments-status', { detail: status }));
  };

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      handleMarkSingleRead(notif.id);
    }
    setNotificationsOpen(false);

    const isPrescriptionRemaining = Boolean(
      (notif.title && notif.title.toLowerCase().includes('prescription remaining')) ||
      (notif.message && notif.message.toLowerCase().includes('prescription remaining'))
    );

    const item = notif.appointment_details || {};
    const rxStatus = item.prescription_status || item.prescriptionStatus || 'Pending';
    const aptStatus = item.status || 'Confirmed';

    const formattedAptId = item.appointment_id || (item.id ? ('APT-' + item.id) : (notif.appointment ? ('APT-' + notif.appointment) : 'APT-0000'));
    const aptToOpen = {
      ...item,
      id: formattedAptId,
      rawId: item.id || notif.appointment,
      appointment_id: formattedAptId,
      patient_id_ref: item.patient_record?.patient_id || (item.patient_record_id ? `PAT-${item.patient_record_id}` : null) || 'PAT-1010',
      name: item.patient_name || notif.patient_name || 'Patient',
      patient_name: item.patient_name || notif.patient_name || 'Patient',
      contact: item.patient_phone || notif.patient_phone || '',
      patient_phone: item.patient_phone || notif.patient_phone || '',
      email: item.patient_email || notif.patient_email || '',
      date: item.appointment_date || notif.appointment_date || '',
      appointment_date: item.appointment_date || notif.appointment_date || '',
      time: item.time_slot || notif.booking_time || '',
      time_slot: item.time_slot || notif.booking_time || '',
      reason: item.reason_for_visit || 'Homeopathic Consultation',
      reason_for_visit: item.reason_for_visit || 'Homeopathic Consultation',
      consultationType: item.consultation_type || item.consultationType || 'In clinic Visit',
      status: aptStatus,
      prescriptionStatus: rxStatus,
      ageGender: item.age_gender || item.ageGender || 'Adult',
      age: item.patient_age || (item.age_gender ? item.age_gender.split('/')[0].trim() : '30'),
      gender: item.patient_gender || (item.age_gender ? item.age_gender.split('/')[1]?.trim() : 'Adult'),
      notes: item.notes || item.reason_for_visit || 'Homeopathic Consultation',
      doctor: item.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
    };

    if (isPrescriptionRemaining) {
      sessionStorage.setItem('pending_prescription_patient', JSON.stringify(aptToOpen));
      navigate('/prescriptions', { state: { openNewPrescription: true, patient: aptToOpen } });
      if (typeof onNewPrescription === 'function') {
        onNewPrescription(aptToOpen);
      }
      window.dispatchEvent(new CustomEvent('open-create-prescription', { detail: aptToOpen }));
      return;
    }

    if (typeof onViewAppointment === 'function') {
      onViewAppointment(aptToOpen);
    }
  };

  const isNewAptNotif = (n) =>
    ((n.title && (n.title.toLowerCase().includes('new') || n.title.toLowerCase().includes('appointment'))) ||
     (n.message && (n.message.toLowerCase().includes('new') || n.message.toLowerCase().includes('appointment')))) &&
    !(n.title && n.title.toLowerCase().includes('prescription'));

  const isRxNotif = (n) =>
    (n.title && n.title.toLowerCase().includes('prescription')) ||
    (n.message && n.message.toLowerCase().includes('prescription'));

  const newAppointmentsList = notifications.filter(
    (n) => !n.is_read && isNewAptNotif(n)
  );
  const rxRemainingList = notifications.filter(
    (n) => (n.title && n.title.toLowerCase().includes('prescription remaining')) ||
           (n.message && n.message.toLowerCase().includes('prescription remaining'))
  ).sort((a, b) => {
    if (!a.is_read && b.is_read) return -1;
    if (a.is_read && !b.is_read) return 1;
    return 0;
  });
  const otherNotifsList = notifications.filter((n) => {
    return !!n.is_read;
  });

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login', { replace: true });
  };

  return (
    <header
      className="admin-header"
      style={{
        width: '100%',
        height: '70px',
        flexShrink: 0,
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 100,
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Left: Hamburger Button (Mobile) + Website Logo & Brand Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar Menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: '#1e4620',
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div
          className="admin-header-brand"
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none',
          }}
          title="Homeopathy Clinic"
        >
          <img
            src={brandLogoImg}
            alt="Homeopathy Clinic"
            className="admin-header-logo-img"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      </div>

      {/* Right: Notifications & Doctor Profile Dropdown */}
      <div
        className="admin-header-right-group"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Animated Confirmed Appointment Reminders Pill emerging from behind notification icon */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {appointmentReminderEnabled && confirmedReminders.length > 0 && (
            <button
              type="button"
              id="admin-header-confirmed-reminders-pill"
              onClick={() => {
                navigateToFilteredAppointments('Confirmed');
              }}
              onMouseEnter={() => setIsPillHovered(true)}
              onMouseLeave={() => setIsPillHovered(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                borderRadius: '20px',
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                border: (isReminderPillVisible || isPillHovered) ? '1px solid #a7f3d0' : 'none',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                marginRight: (isReminderPillVisible || isPillHovered) ? '8px' : '0px',
                padding: (isReminderPillVisible || isPillHovered) ? '6px 14px' : '0px',
                maxWidth: (isReminderPillVisible || isPillHovered) ? '260px' : '0px',
                opacity: (isReminderPillVisible || isPillHovered) ? 1 : 0,
                transform: (isReminderPillVisible || isPillHovered) ? 'translateX(0) scale(1)' : 'translateX(35px) scale(0.9)',
                pointerEvents: (isReminderPillVisible || isPillHovered) ? 'auto' : 'none',
                overflow: 'hidden',
                transition: 'transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, max-width 0.38s cubic-bezier(0.16, 1, 0.3, 1), padding 0.3s ease, margin 0.3s ease',
                boxShadow: (isReminderPillVisible || isPillHovered) ? '0 2px 8px rgba(6, 95, 70, 0.12)' : 'none',
                zIndex: 1,
              }}
              title={`${confirmedReminders.length} confirmed appointment reminders - Click to view`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                <strong style={{ fontWeight: '700' }}>{confirmedReminders.length}</strong> Confirmed {confirmedReminders.length === 1 ? 'Reminder' : 'Reminders'}
              </span>
            </button>
          )}

          {/* Notification Bell with dynamic unread count & dropdown */}
          <div ref={notifRef} style={{ position: 'relative', zIndex: 10 }}>
          <button
            type="button"
            id="admin-notifications-toggle-btn"
            className="admin-header-notif-btn"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            aria-label={`Notifications, ${unreadCount} unread`}
            style={{
              position: 'relative',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: notificationsOpen ? '#1e4620' : '#475569',
              background: notificationsOpen ? '#e8f5ec' : 'transparent',
              border: 'none',
              borderRadius: '10px',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!notificationsOpen) e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (!notificationsOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Notifications"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {/* Unread & confirmed/pending reminders indicator badge with count */}
            {(() => {
              const unreadNewCount = newAppointmentsList.length;
              const unreadRxCount = rxRemainingList.filter((n) => !n.is_read).length;
              const activeReminderCount = appointmentReminderEnabled ? (confirmedReminders.length || pendingReminders.length) : 0;
              const effectiveUnread = unreadNewCount + unreadRxCount;
              const displayBadgeCount = effectiveUnread > 0 ? effectiveUnread : activeReminderCount;
              if (displayBadgeCount <= 0) return null;
              const isUnread = effectiveUnread > 0;
              return (
                <span
                  id="admin-header-bell-badge"
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    minWidth: '17px',
                    height: '17px',
                    backgroundColor: isUnread ? '#ef4444' : (confirmedReminders.length > 0 ? '#059669' : '#d97706'),
                    color: '#ffffff',
                    borderRadius: '9999px',
                    border: '2px solid #ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxSizing: 'border-box',
                    lineHeight: 1,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  {displayBadgeCount > 9 ? '9+' : displayBadgeCount}
                </span>
              );
            })()}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div
              id="admin-notifications-dropdown"
              className="admin-notifications-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: '380px',
                maxWidth: 'calc(100vw - 32px)',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 12px 36px rgba(0, 0, 0, 0.14), 0 2px 8px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                zIndex: 1000,
                overflow: 'hidden',
                animation: 'adminDropdownFadeIn 0.15s ease-out',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Notifications
                  </h3>

                  {/* 1. New Button (Filters notification dropdown to show ONLY new appointment notifications) */}
                  {newAppointmentsList.length > 0 && (
                    <button
                      type="button"
                      id="notifications-new-count-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownFilter((prev) => (prev === 'new' ? 'all' : 'new'));
                      }}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '700',
                        color: dropdownFilter === 'new' ? '#ffffff' : '#1e4620',
                        backgroundColor: dropdownFilter === 'new' ? '#166534' : '#e8f5ec',
                        border: dropdownFilter === 'new' ? '1px solid #14532d' : '1px solid #bbf7d0',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        outline: 'none',
                        boxShadow: dropdownFilter === 'new' ? '0 1px 4px rgba(22, 101, 52, 0.25)' : 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                      onMouseEnter={(e) => {
                        if (dropdownFilter !== 'new') e.currentTarget.style.backgroundColor = '#dcfce7';
                        e.currentTarget.style.transform = 'scale(1.04)';
                      }}
                      onMouseLeave={(e) => {
                        if (dropdownFilter !== 'new') e.currentTarget.style.backgroundColor = '#e8f5ec';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={dropdownFilter === 'new' ? 'Click to show all notifications' : 'Click to show only new appointment notifications'}
                    >
                      <span>{newAppointmentsList.length} new</span>
                    </button>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1e4620',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List (Structured with New Appointments, Prescription Remaining, Confirmed Reminders & others) */}
              <div
                style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                    {/* 1. NEW APPOINTMENTS SECTION (ALWAYS APPEARS AT THE TOP) */}
                    {(dropdownFilter === 'all' || dropdownFilter === 'new') && newAppointmentsList.length > 0 && (
                      <div id="new-appointments-section" style={{ borderBottom: '1px solid #dcfce7' }}>
                        <div
                          style={{
                            padding: '9px 18px',
                            backgroundColor: '#f0fdf4',
                            borderBottom: '1px solid #dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ fontSize: '13px' }}>✨</span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#166534',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              New Appointments
                            </span>
                          </div>
                          <span
                            id="new-appointments-section-count-badge"
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#15803d',
                              backgroundColor: '#dcfce7',
                              border: '1px solid #86efac',
                              padding: '1px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {newAppointmentsList.length} new
                          </span>
                        </div>

                        <div className="new-appointments-list">
                          {newAppointmentsList.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className="new-appointment-item"
                              style={{
                                padding: '13px 18px',
                                borderBottom: '1px solid #f1f5f9',
                                backgroundColor: '#f8fdf9',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'flex-start',
                                position: 'relative',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f8fdf9')}
                            >
                              {/* Green Calendar Icon Badge */}
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '10px',
                                  backgroundColor: '#dcfce7',
                                  color: '#166534',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  marginTop: '2px',
                                }}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                              </div>

                              {/* Content */}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                                    {notif.patient_name || 'Patient'}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {notif.created_at_formatted && (
                                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                        {notif.created_at_formatted}
                                      </span>
                                    )}
                                    <span
                                      style={{
                                        width: '7px',
                                        height: '7px',
                                        borderRadius: '50%',
                                        backgroundColor: '#16a34a',
                                        flexShrink: 0,
                                      }}
                                    />
                                  </div>
                                </div>

                                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.35, fontWeight: '500' }}>
                                  {notif.message || notif.title || 'New appointment booked'}
                                </div>

                                {/* Details Tag */}
                                {(notif.appointment_date || notif.booking_time) && (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginTop: '6px',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #bbf7d0',
                                      fontSize: '11.5px',
                                      color: '#166534',
                                      fontWeight: '600',
                                    }}
                                  >
                                    {notif.appointment_date && <span>📅 {notif.appointment_date}</span>}
                                    {notif.appointment_date && notif.booking_time && <span>•</span>}
                                    {notif.booking_time && <span>⏰ {notif.booking_time}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. PRESCRIPTION REMAINING SECTION */}
                    {(dropdownFilter === 'all' || dropdownFilter === 'rx_remaining') && rxRemainingList.length > 0 && (
                      <div id="prescription-remaining-section" style={{ borderBottom: '1px solid #fed7aa' }}>
                        <div
                          style={{
                            padding: '9px 18px',
                            backgroundColor: '#fffbeb',
                            borderBottom: '1px solid #fde68a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ fontSize: '13px' }}>📝</span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#b45309',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Prescription Remaining
                            </span>
                          </div>
                          <span
                            id="prescription-remaining-count-badge"
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: '#b45309',
                              backgroundColor: '#fef3c7',
                              border: '1px solid #fde68a',
                              padding: '1px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            {rxRemainingList.length} remaining
                          </span>
                        </div>

                        <div className="prescription-remaining-list">
                          {rxRemainingList.map((notif) => {
                            const aptNum = notif.appointment_details?.appointment_id || notif.appointment_id || (notif.appointment ? `APT-${notif.appointment}` : 'APT-0000');
                            const patientName = notif.patient_name || notif.appointment_details?.patient_name || 'Patient';
                            return (
                              <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className="rx-remaining-item prescription-remaining-item"
                                style={{
                                  padding: '13px 18px',
                                  borderBottom: '1px solid #fef3c7',
                                  backgroundColor: !notif.is_read ? '#fffdf7' : '#ffffff',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'flex-start',
                                  position: 'relative',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef9c3')}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = !notif.is_read ? '#fffdf7' : '#ffffff')}
                                title="Click to create prescription with patient pre-filled"
                              >
                                {/* Amber/Gold Icon Badge */}
                                <div
                                  style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    backgroundColor: '#fef3c7',
                                    color: '#b45309',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="12" y1="18" x2="12" y2="12" />
                                    <line x1="9" y1="15" x2="15" y2="15" />
                                  </svg>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  {/* Row 1: Patient Name & Prescription Remaining Badge */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                                      {patientName}
                                    </span>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                      <span
                                        style={{
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          color: '#9a3412',
                                          backgroundColor: '#ffedd5',
                                          border: '1px solid #fed7aa',
                                          padding: '2px 8px',
                                          borderRadius: '4px',
                                          letterSpacing: '0.2px',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        Prescription Remaining
                                      </span>
                                      {!notif.is_read && (
                                        <span
                                          style={{
                                            width: '7px',
                                            height: '7px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ea580c',
                                            flexShrink: 0,
                                          }}
                                          title="Unread notification"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {/* Row 2: Appointment Number & Appointment Status: Completed */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '11.5px',
                                        color: '#334155',
                                        backgroundColor: '#f1f5f9',
                                        border: '1px solid #e2e8f0',
                                        padding: '2px 8px',
                                        borderRadius: '5px',
                                      }}
                                    >
                                      <span style={{ color: '#64748b', fontWeight: '500' }}>APT:</span>
                                      <span style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                                        {aptNum}
                                      </span>
                                    </div>

                                    <div
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '11.5px',
                                        fontWeight: '600',
                                        color: '#1d4ed8',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        padding: '2px 8px',
                                        borderRadius: '9999px',
                                      }}
                                    >
                                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                                      <span>Appointment Status: Completed</span>
                                    </div>
                                  </div>

                                  {/* Row 3: Scheduled Date/Time & CTA Button */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', gap: '6px', flexWrap: 'wrap' }}>
                                    {(notif.appointment_date || notif.booking_time) && (
                                      <div
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          fontSize: '11.5px',
                                          color: '#78350f',
                                          fontWeight: '600',
                                        }}
                                      >
                                        {notif.appointment_date && <span>📅 {notif.appointment_date}</span>}
                                        {notif.appointment_date && notif.booking_time && <span>•</span>}
                                        {notif.booking_time && <span>⏰ {notif.booking_time}</span>}
                                      </div>
                                    )}
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#166534',
                                        backgroundColor: '#dcfce7',
                                        border: '1px solid #86efac',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                      }}
                                    >
                                      + Create Prescription →
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. CONFIRMED APPOINTMENT REMINDERS SECTION (LISTED BELOW NEW) */}
                    {appointmentReminderEnabled && dropdownFilter === 'all' && confirmedReminders.length > 0 && (
                      <div id="confirmed-reminders-section" style={{ borderBottom: '1px solid #d1fae5' }}>
                        <div
                          id="confirmed-reminders-toggle-header"
                          onClick={() => setIsRemindersExpanded((prev) => !prev)}
                          style={{
                            padding: '9px 18px',
                            backgroundColor: '#f0fdf4',
                            borderBottom: isRemindersExpanded ? '1px solid #d1fae5' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                          title={isRemindersExpanded ? 'Click to collapse reminder details' : 'Click to expand reminder details'}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#166534',
                                letterSpacing: '0.4px',
                                textTransform: 'uppercase',
                              }}
                            >
                              Confirmed Appointment Reminders
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              id="confirmed-reminders-section-count-badge"
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#15803d',
                                backgroundColor: '#dcfce7',
                                border: '1px solid #86efac',
                                padding: '1px 8px',
                                borderRadius: '9999px',
                              }}
                            >
                              {confirmedReminders.length}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#166534',
                                fontWeight: '700',
                                display: 'inline-block',
                                transition: 'transform 0.2s ease',
                                transform: isRemindersExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              }}
                            >
                              ▼
                            </span>
                          </div>
                        </div>

                        {/* Collapsible Reminder Details */}
                        {isRemindersExpanded && (
                          <div className="confirmed-reminders-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                            {confirmedReminders.map((rem) => (
                              <div
                                key={rem.id}
                                onClick={() => handleNotificationClick(rem)}
                                className="confirmed-reminder-item"
                                style={{
                                  padding: '12px 18px',
                                  borderBottom: '1px solid #e2e8f0',
                                  backgroundColor: '#fbfdfc',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.15s ease',
                                  display: 'flex',
                                  gap: '12px',
                                  alignItems: 'flex-start',
                                  position: 'relative',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#ecfdf5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fbfdfc';
                                }}
                              >
                                {/* Green Calendar Icon Badge */}
                                <div
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: '10px',
                                    backgroundColor: '#e8f5ec',
                                    color: '#1e4620',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    marginTop: '2px',
                                  }}
                                >
                                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>
                                      {rem.patient_name}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: '10.5px',
                                        fontWeight: '700',
                                        color: '#166534',
                                        backgroundColor: '#dcfce7',
                                        border: '1px solid #bbf7d0',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                      }}
                                    >
                                      Confirmed
                                    </span>
                                  </div>

                                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', lineHeight: 1.35, fontWeight: '500' }}>
                                    Confirmed appointment reminder
                                  </div>

                                  {/* Details Tag */}
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginTop: '6px',
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #cbd5e1',
                                      fontSize: '11px',
                                      color: '#334155',
                                      fontWeight: '600',
                                    }}
                                  >
                                    <span>📅 {rem.appointment_date}</span>
                                    <span>•</span>
                                    <span>⏰ {rem.booking_time}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 3. OTHER / PAST NOTIFICATIONS */}
                    {dropdownFilter === 'all' && otherNotifsList.length > 0 && (
                      <div className="other-notifications-list">
                        <div
                          style={{
                            padding: '7px 18px',
                            backgroundColor: '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#64748b',
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          Earlier Notifications
                        </div>
                        {otherNotifsList.map((notif) => {
                    const isUnread = !notif.is_read;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        style={{
                          padding: '14px 18px',
                          borderBottom: '1px solid #f8fafc',
                          backgroundColor: isUnread ? '#f8fdf9' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'flex-start',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#edf9f1' : '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isUnread ? '#f8fdf9' : '#ffffff';
                        }}
                      >
                        {/* Icon Badge */}
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            backgroundColor: isUnread ? '#dcfce7' : '#f1f5f9',
                            color: isUnread ? '#166534' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '2px',
                          }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '13.5px', fontWeight: isUnread ? '700' : '600', color: '#0f172a' }}>
                              {notif.patient_name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                              {notif.created_at_formatted || 'Just now'}
                            </span>
                          </div>

                          <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '2px', lineHeight: 1.35 }}>
                            {notif.message || notif.title || 'Notification'}
                          </div>

                          {/* Details Tag */}
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '6px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              backgroundColor: isUnread ? '#ffffff' : '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              fontSize: '11.5px',
                              color: '#1e4620',
                              fontWeight: '600',
                            }}
                          >
                            <span>📅 {notif.appointment_date}</span>
                            <span>•</span>
                            <span>⏰ {notif.booking_time}</span>
                          </div>
                        </div>

                        {/* Unread dot or Mark as read action */}
                        {isUnread && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkSingleRead(notif.id, e)}
                            title="Mark as read"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#16a34a',
                              cursor: 'pointer',
                              padding: '4px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#16a34a',
                                display: 'inline-block',
                              }}
                            />
                          </button>
                        )}
                      </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Filter empty states */}
                    {dropdownFilter === 'new' && newAppointmentsList.length === 0 && (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✨</div>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#166534' }}>No New Appointment Notifications</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>There are currently no new appointment notifications.</div>
                      </div>
                    )}

                    {dropdownFilter === 'rx_remaining' && rxRemainingList.length === 0 && (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📝</div>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#9a3412' }}>No Prescription Remaining Notifications</div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>All prescriptions for completed appointments have been created.</div>
                      </div>
                    )}

                    {dropdownFilter === 'all' &&
                     newAppointmentsList.length === 0 &&
                     rxRemainingList.length === 0 &&
                     (!appointmentReminderEnabled || confirmedReminders.length === 0) &&
                     otherNotifsList.length === 0 && (
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            backgroundColor: '#f1f5f9',
                            color: '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 10px',
                          }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#334155' }}>
                          No notifications yet
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
                          New appointment bookings will appear here automatically.
                        </div>
                      </div>
                    )}
                  </div>

              {/* Dropdown Footer */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #f1f5f9',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/appointments');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e4620',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>View All Appointments</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Doctor Profile Pill */}
        <div
          ref={profileRef}
          style={{ position: 'relative' }}
        >
          {/* Profile Trigger (Avatar + Doctor Info + Arrow) */}
          <div
            className="admin-header-profile-trigger"
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Doctor Profile Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              userSelect: 'none',
              padding: '6px 12px',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: dropdownOpen ? '#f8fafc' : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => {
              if (!dropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Circular Avatar (Clinic Profile Picture or Initials 'DT') */}
            {clinicProfileImage ? (
              <img
                src={clinicProfileImage}
                alt="Clinic Profile"
                className="admin-header-avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1.5px solid #22c55e',
                }}
                onError={() => {
                  setClinicProfileImage(null);
                  localStorage.removeItem('clinic_profile_image');
                }}
              />
            ) : (
              <div
                className="admin-header-avatar"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  letterSpacing: '0.5px',
                  flexShrink: 0,
                }}
              >
                DT
              </div>
            )}

            {/* Doctor Info */}
            <div className="admin-header-doctor-text" style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div
                style={{
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#1e293b',
                  whiteSpace: 'nowrap',
                }}
              >
                Dr. K. Tripathi Ampeh (Pat.)
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginTop: '2px',
                }}
              >
                Doctor
              </div>
            </div>

            {/* Dropdown Chevron Arrow */}
            <div
              className="admin-header-doctor-arrow"
              style={{
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Profile Dropdown Menu with Settings & Logout */}
          {dropdownOpen && (
            <div
              className="admin-profile-dropdown"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                backgroundColor: '#ffffff',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                padding: '6px',
                minWidth: '165px',
                zIndex: 120,
                overflow: 'hidden',
              }}
            >
              {/* Mobile-Only Header showing Doctor Info */}
              <div
                className="admin-mobile-dropdown-header"
                style={{
                  display: 'none',
                  flexDirection: 'column',
                  padding: '10px 12px 10px',
                  borderBottom: '1px solid #f1f5f9',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: '#1e293b',
                    lineHeight: 1.3,
                  }}
                >
                  Dr. K. Tripathi Ampeh (Pat.)
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    marginTop: '2px',
                  }}
                >
                  Doctor / Administrator
                </span>
              </div>
              {/* Option 1: Settings */}
              <div
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                style={{
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#1e293b',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </div>

              {/* Option 2: Logout */}
              <div
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  padding: '10px 14px',
                  fontSize: '13.5px',
                  fontWeight: '600',
                  color: '#dc2626',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Immediate Prescription Remaining Notification Banner */}
      {floatingNotification && prescriptionUpdatesEnabled && (
        <div
          id="floating-prescription-notification"
          onClick={() => handleFloatingNotificationClick(floatingNotification)}
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(180, 83, 9, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)',
            border: '1.5px solid #fed7aa',
            borderLeft: '5px solid #f59e0b',
            padding: '14px 18px',
            zIndex: 99999,
            cursor: 'pointer',
            animation: 'adminNotifSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 16px 36px rgba(180, 83, 9, 0.22), 0 6px 14px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(180, 83, 9, 0.18), 0 4px 12px rgba(0, 0, 0, 0.08)';
          }}
          title="Click to create prescription for this patient"
        >
          {/* Top row: Badge + Close Icon */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '3px 9px',
                borderRadius: '6px',
              }}
            >
              <span style={{ fontSize: '13px' }}>📝</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#b45309',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                Prescription Remaining
              </span>
            </div>
            <button
              type="button"
              id="close-floating-rx-notification"
              onClick={(e) => {
                e.stopPropagation();
                setFloatingNotification(null);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '14px',
                fontWeight: '700',
                lineHeight: 1,
              }}
              title="Dismiss notification"
            >
              ✕
            </button>
          </div>

          {/* Patient Name */}
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
            {floatingNotification.patient_name}
          </div>

          {/* Row 2: Appointment Number & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                color: '#334155',
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '5px',
              }}
            >
              <span style={{ color: '#64748b', fontWeight: '500' }}>APT:</span>
              <span style={{ fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>
                {floatingNotification.appointment_id}
              </span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#166534',
                backgroundColor: '#dcfce7',
                border: '1px solid #bbf7d0',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              <span>Status: Completed</span>
            </div>
          </div>

          {/* Bottom Action Prompt */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #fef3c7',
            }}
          >
            <span style={{ fontSize: '11.5px', color: '#78350f', fontWeight: '500' }}>
              Click notification to create prescription
            </span>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: '700',
                color: '#166534',
                backgroundColor: '#dcfce7',
                border: '1px solid #86efac',
                padding: '3px 10px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>+ Create Prescription</span>
              <span>→</span>
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes adminNotifSlideIn {
          from {
            opacity: 0;
            transform: translateX(40px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </header>
  );
};

export default AdminHeader;


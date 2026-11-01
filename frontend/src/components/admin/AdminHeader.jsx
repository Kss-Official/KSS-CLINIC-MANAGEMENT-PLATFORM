import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import brandLogoImg from '../../assets/brand-logo.png';
import useAuth from '../../hooks/useAuth';
import appointmentApi from '../../api/appointmentApi';

const AdminHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await appointmentApi.getNotifications();
      if (data) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 5 seconds for real-time automatic notification updates
    const interval = setInterval(fetchNotifications, 5000);

    // Listen to custom event when an appointment is booked anywhere in the app
    const handleAppointmentBooked = () => {
      fetchNotifications();
    };
    window.addEventListener('appointment-booked', handleAppointmentBooked);

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
      window.removeEventListener('appointment-booked', handleAppointmentBooked);
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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
      {/* Left: Website Logo & Brand Name from Brand/Logo.png */}
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

      {/* Right: Notifications & Doctor Profile Dropdown */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Notification Bell with dynamic unread count & dropdown */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            type="button"
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
            {/* Unread indicator badge with count */}
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  minWidth: '17px',
                  height: '17px',
                  backgroundColor: '#ef4444',
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
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: '600',
                        color: '#1e4620',
                        backgroundColor: '#e8f5ec',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}
                    >
                      {unreadCount} new
                    </span>
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

              {/* Notification List */}
              <div
                style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                }}
              >
                {notifications.length === 0 ? (
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
                ) : (
                  notifications.map((notif) => {
                    const isUnread = !notif.is_read;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => {
                          if (isUnread) handleMarkSingleRead(notif.id);
                        }}
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
                            New appointment booked
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
                  })
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

        {/* Doctor Profile Pill */}
        <div ref={profileRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Profile Section (Avatar & Doctor Info) - Click opens the dropdown menu */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((prev) => !prev);
            }}
            title="Account Menu"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              userSelect: 'none',
              padding: '6px 10px',
              borderRadius: '10px',
              cursor: 'pointer',
              backgroundColor: dropdownOpen ? '#f8fafc' : 'transparent',
              transition: 'background-color 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
            onMouseLeave={(e) => {
              if (!dropdownOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Circular Initials Avatar DT (Profile Icon - clickable trigger) */}
            <div
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

            {/* Doctor Info (Profile Name & Role - clickable trigger) */}
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
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
          </div>

          {/* Visual Dropdown Arrow - Does NOT open the dropdown when clicked */}
          <div
            style={{
              padding: '6px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
            aria-hidden="true"
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

          {/* Profile Dropdown Menu - containing both Settings and Logout options */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '56px',
                right: 0,
                backgroundColor: '#ffffff',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0,0,0,0.04)',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
                padding: '6px 0',
                minWidth: '180px',
                zIndex: 120,
                overflow: 'hidden',
              }}
            >
              {/* Option 1: Settings */}
              <div
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/settings');
                }}
                style={{
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.color = '#1e4620';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Settings</span>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

              {/* Option 2: Logout */}
              <div
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  padding: '10px 18px',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  color: '#dc2626',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    </header>
  );
};

export default AdminHeader;


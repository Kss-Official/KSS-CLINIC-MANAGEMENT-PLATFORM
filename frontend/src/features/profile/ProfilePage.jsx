import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import profileHerbs from '../../assets/profile-banner-herbs.png';

const ProfilePage = () => {
  // User profile state
  const [profile, setProfile] = useState({
    fullName: 'Rahul Sharma',
    mobileNumber: '+91 98765 43210',
    email: 'rahul.sharma@gmail.com',
    dateOfBirth: '12 March 1998',
    gender: 'Male',
    city: 'Bangalore, Karnataka',
    initials: 'RS',
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...profile });
  const editDialogRef = useRef(null);

  // Appointment Details Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const appointmentDialogRef = useRef(null);

  // Filters
  const [appointmentFilter, setAppointmentFilter] = useState('All');
  const [prescriptionFilter, setPrescriptionFilter] = useState('All');

  // Appointment History Data
  const [appointments] = useState([
    {
      id: 1,
      appointmentId: 'APT-2026-1016-001',
      day: '16',
      month: 'OCT 2026',
      fullDate: '16 October 2026',
      title: 'Homeopathy Consultation',
      type: 'Homeopathy Consultation',
      doctor: 'Dr. K. Tripathi Ampeh (Pat.)',
      time: '09:30 AM',
      status: 'Completed',
      pdfName: 'Prescription_16_Oct_2026.pdf',
      pdfDate: 'Issued 16 Oct 2026',
    },
    {
      id: 2,
      appointmentId: 'APT-2026-0928-004',
      day: '28',
      month: 'SEP 2026',
      fullDate: '28 September 2026',
      title: 'Homeopathy Consultation',
      type: 'Homeopathy Consultation',
      doctor: 'Dr. K. Tripathi Ampeh (Pat.)',
      time: '11:00 AM',
      status: 'Completed',
      pdfName: 'Prescription_28_Sep_2026.pdf',
      pdfDate: 'Issued 28 Sep 2026',
    },
    {
      id: 3,
      appointmentId: 'APT-2026-0812-002',
      day: '12',
      month: 'AUG 2026',
      fullDate: '12 August 2026',
      title: 'Follow-up Consultation',
      type: 'Follow-up Consultation',
      doctor: 'Dr. K. Tripathi Ampeh (Pat.)',
      time: '10:30 AM',
      status: 'Completed',
      pdfName: 'Prescription_12_Aug_2026.pdf',
      pdfDate: 'Issued 12 Aug 2026',
    },
    {
      id: 4,
      appointmentId: 'APT-2026-0725-001',
      day: '25',
      month: 'JUL 2026',
      fullDate: '25 July 2026',
      title: 'Initial Consultation',
      type: 'Initial Consultation',
      doctor: 'Dr. K. Tripathi Ampeh (Pat.)',
      time: '09:00 AM',
      status: 'Completed',
      pdfName: 'Prescription_25_Jul_2026.pdf',
      pdfDate: 'Issued 25 Jul 2026',
    },
  ]);

  // Prescriptions Data
  const [prescriptions] = useState([
    {
      id: 1,
      title: 'Prescription - Follow-up',
      date: '16 Oct 2026',
      fileName: 'Prescription_16_Oct_2026.pdf',
    },
    {
      id: 2,
      title: 'Prescription - Consultation',
      date: '28 Sep 2026',
      fileName: 'Prescription_28_Sep_2026.pdf',
    },
    {
      id: 3,
      title: 'Prescription - Follow-up',
      date: '12 Aug 2026',
      fileName: 'Prescription_12_Aug_2026.pdf',
    },
    {
      id: 4,
      title: 'Prescription - Initial Visit',
      date: '25 Jul 2026',
      fileName: 'Prescription_25_Jul_2026.pdf',
    },
  ]);

  // Edit Modal Dialog Lifecycle
  useEffect(() => {
    const dialog = editDialogRef.current;
    if (!dialog) return;
    if (isEditOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isEditOpen]);

  // Appointment Details Dialog Lifecycle
  useEffect(() => {
    const dialog = appointmentDialogRef.current;
    if (!dialog) return;
    if (selectedAppointment) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [selectedAppointment]);

  const handleOpenEdit = () => {
    setEditFormData({ ...profile });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  const handleEditChange = (e) => {
    setEditFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const parts = editFormData.fullName.trim().split(' ');
    const computedInitials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : editFormData.fullName.slice(0, 2).toUpperCase();

    setProfile({
      ...editFormData,
      initials: computedInitials || 'RS',
    });
    setIsEditOpen(false);
  };

  const handleOpenAppointmentModal = (appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(null);
  };

  const handleDownloadPrescription = (fileName) => {
    alert(`Downloading ${fileName}... In a full setup, this downloads your digital homeopathic prescription.`);
  };

  const handleViewPdf = (fileName) => {
    alert(`Opening preview for ${fileName}...`);
  };

  // Light dismiss on backdrop click
  const handleDialogBackdropClick = (e, onClose, ref) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
      onClose();
    }
  };

  return (
    <div style={{ backgroundColor: '#f8faf9', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar onOpenBooking={() => {}} />

      {/* Main Container */}
      <div className="container" style={{ padding: '36px 24px 80px', flex: 1, maxWidth: '1160px' }}>
        {/* Top Profile Banner Card */}
        <div
          style={{
            backgroundColor: '#edf5ee',
            border: '1px solid #e1efe4',
            borderRadius: '18px',
            padding: '28px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '34px',
                fontWeight: '800',
                color: '#111827',
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
              }}
            >
              Profile
            </h1>
            <p style={{ fontSize: '15px', color: '#6b7280', margin: 0 }}>
              Manage your profile, view your appointment history and prescriptions.
            </p>
          </div>

          {/* Right Herbal Graphic */}
          <div style={{ flexShrink: 0 }}>
            <img
              src={profileHerbs}
              alt="Natural Homeopathy Herbs"
              style={{
                height: '96px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* Personal Information Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '32px 36px',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
            border: '1px solid #edf2ee',
            marginBottom: '28px',
          }}
        >
          {/* Card Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '28px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>
                Personal Information
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                Keep your information updated for a better experience.
              </p>
            </div>

            {/* Edit Profile Button */}
            <button
              type="button"
              onClick={handleOpenEdit}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#374151',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <span>✏️</span>
              Edit Profile
            </button>
          </div>

          {/* Details Row: Avatar on Left, Details Grid on Right */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '40px',
              alignItems: 'center',
            }}
            className="profile-personal-grid"
          >
            {/* Avatar Circle */}
            <div style={{ position: 'relative', width: '92px', height: '92px' }}>
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  fontSize: '28px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(22, 101, 52, 0.12)',
                }}
              >
                {profile.initials}
              </div>

              {/* Camera Icon Overlay */}
              <button
                type="button"
                onClick={handleOpenEdit}
                aria-label="Change photo"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: '#1b4332',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                }}
              >
                📷
              </button>
            </div>

            {/* Information Grid: 2 Columns x 3 Rows */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                columnGap: '48px',
                rowGap: '22px',
              }}
              className="profile-fields-grid"
            >
              {/* Row 1: Full Name & Mobile */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>👤</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    FULL NAME
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.fullName}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>📞</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    MOBILE NUMBER
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.mobileNumber}
                  </span>
                </div>
              </div>

              {/* Row 2: Email & Date of Birth */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>✉️</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    EMAIL
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.email}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>📅</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    DATE OF BIRTH
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.dateOfBirth}
                  </span>
                </div>
              </div>

              {/* Row 3: Gender & City */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>👥</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    GENDER
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.gender}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ color: '#9ca3af', fontSize: '16px', marginTop: '1px' }}>📍</span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    CITY
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.city}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: 2 Side-by-Side Cards (Appointment History & Prescriptions) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            alignItems: 'start',
          }}
          className="profile-bottom-grid"
        >
          {/* Card 1: Appointment History */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
              border: '1px solid #edf2ee',
            }}
          >
            {/* Header with Filter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    fontSize: '16px',
                  }}
                >
                  📅
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Appointment History
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    View your past and upcoming appointments.
                  </p>
                </div>
              </div>

              <select
                value={appointmentFilter}
                onChange={(e) => setAppointmentFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="All">All Appointments</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>

            {/* Appointments List (Clicking opens details modal) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {appointments.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenAppointmentModal(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8faf9';
                    e.currentTarget.style.borderColor = '#edf2ee';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Date Badge */}
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '12px',
                        backgroundColor: '#edf5ee',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#1b4332', lineHeight: '1' }}>
                        {item.day}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#2e7d32', marginTop: '2px' }}>
                        {item.month}
                      </span>
                    </div>

                    {/* Consultation Meta */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                        {item.doctor}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0' }}>
                        {item.time}
                      </p>
                    </div>
                  </div>

                  {/* Right Status & Arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                      }}
                    >
                      {item.status}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '18px' }}>›</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Prescriptions */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
              border: '1px solid #edf2ee',
            }}
          >
            {/* Header with Filter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '22px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    fontSize: '16px',
                  }}
                >
                  📄
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Prescriptions
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                    View and download your prescription records.
                  </p>
                </div>
              </div>

              <select
                value={prescriptionFilter}
                onChange={(e) => setPrescriptionFilter(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="All">All Prescriptions</option>
                <option value="Recent">Recent</option>
              </select>
            </div>

            {/* Prescriptions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prescriptions.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: '#edf5ee',
                        color: '#2e7d32',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0 }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0' }}>
                        {item.date}
                      </p>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadPrescription(item.fileName)}
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bbf7d0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                  >
                    <span>📥</span>
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= APPOINTMENT DETAILS MODAL (EXACT MATCHING UI) ================= */}
      <dialog
        ref={appointmentDialogRef}
        onClick={(e) => handleDialogBackdropClick(e, handleCloseAppointmentModal, appointmentDialogRef)}
        aria-labelledby="appointment-details-title"
        style={{
          borderRadius: '20px',
          border: 'none',
          padding: 0,
          maxWidth: '600px',
          width: '92%',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {selectedAppointment && (
          <div style={{ padding: '32px 32px 28px' }}>
            {/* Header Row: Title on Left, Status Badge & Close button on Right */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <h3
                id="appointment-details-title"
                style={{
                  fontSize: '20px',
                  fontWeight: '800',
                  color: '#111827',
                  margin: 0,
                  letterSpacing: '-0.2px',
                }}
              >
                Appointment Details
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                  }}
                >
                  {selectedAppointment.status}
                </span>

                <button
                  type="button"
                  onClick={handleCloseAppointmentModal}
                  aria-label="Close Appointment Details"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Box 1: Primary Details 2-Column Grid */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #edf2ee',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  rowGap: '20px',
                  columnGap: '24px',
                }}
              >
                {/* Row 1: Type & ID */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    📅
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Appointment Type
                    </span>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.type}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    📄
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Appointment ID
                    </span>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.appointmentId}
                    </strong>
                  </div>
                </div>

                {/* Row 2: Date & Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    📅
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Date
                    </span>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.fullDate}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    🕒
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Time
                    </span>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.time}
                    </strong>
                  </div>
                </div>

                {/* Row 3: Doctor & Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Doctor
                    </span>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.doctor}
                    </strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: '#f0fdf4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2e7d32',
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    ⏱️
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280' }}>
                      Consultation Status
                    </span>
                    <strong style={{ fontSize: '14px', color: '#16a34a', display: 'block', marginTop: '1px' }}>
                      {selectedAppointment.status}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Consultation Summary */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #edf2ee',
                borderRadius: '16px',
                padding: '16px 20px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: '#f0fdf4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2e7d32',
                  fontSize: '16px',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                📄
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 3px 0' }}>
                  Consultation Summary
                </h4>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.5' }}>
                  Your consultation was completed. Review the visit information and any documents shared by your doctor.
                </p>
              </div>
            </div>

            {/* Box 3: Attached Documents */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <span style={{ fontSize: '15px' }}>📎</span>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Attached Documents
                </h4>
              </div>

              {/* Document Item Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Red PDF Badge */}
                  <span
                    style={{
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    PDF
                  </span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#111827', display: 'block' }}>
                      {selectedAppointment.pdfName}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      PDF • {selectedAppointment.pdfDate}
                    </span>
                  </div>
                </div>

                {/* Right Buttons: View PDF & Download */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleViewPdf(selectedAppointment.pdfName)}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <span>👁️</span>
                    View PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPrescription(selectedAppointment.pdfName)}
                    style={{
                      backgroundColor: '#dcfce7',
                      color: '#166534',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bbf7d0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                  >
                    <span>📥</span>
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>

      {/* Edit Profile Dialog Modal */}
      <dialog
        ref={editDialogRef}
        onClick={(e) => handleDialogBackdropClick(e, handleCloseEdit, editDialogRef)}
        aria-labelledby="edit-profile-title"
        style={{
          borderRadius: '18px',
          border: 'none',
          padding: 0,
          maxWidth: '480px',
          width: '92%',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3 id="edit-profile-title" style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>
              Edit Profile
            </h3>
            <button
              type="button"
              onClick={handleCloseEdit}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6b7280',
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={editFormData.fullName}
                onChange={handleEditChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                name="mobileNumber"
                value={editFormData.mobileNumber}
                onChange={handleEditChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={editFormData.email}
                onChange={handleEditChange}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dateOfBirth"
                  value={editFormData.dateOfBirth}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                  Gender
                </label>
                <select
                  name="gender"
                  value={editFormData.gender}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                City, State
              </label>
              <input
                type="text"
                name="city"
                value={editFormData.city}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={handleCloseEdit}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#4b5563',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#1b4332',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: '#ffffff',
          borderTop: '1px solid #edf2ee',
          padding: '24px 0',
          fontSize: '13px',
          color: '#6b7280',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            maxWidth: '1160px',
          }}
        >
          <p style={{ margin: 0 }}>
            © 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <a href="#privacy" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Consultation</a>
            <a href="#support" style={{ color: '#6b7280', textDecoration: 'none' }}>Contact Support</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 860px) {
          .profile-personal-grid {
            grid-template-columns: 1fr !important;
            justify-items: center;
            text-align: center;
          }
          .profile-fields-grid {
            grid-template-columns: 1fr !important;
            row-gap: 16px !important;
          }
          .profile-bottom-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

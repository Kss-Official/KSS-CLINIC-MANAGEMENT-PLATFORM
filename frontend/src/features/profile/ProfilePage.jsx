import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import useAuth from '../../hooks/useAuth';
import appointmentApi from '../../api/appointmentApi';
import PatientAuthModal from '../../components/auth/PatientAuthModal';
import profileHerbs from '../../assets/profile-banner-herbs.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User profile state initialized with clinic reference design defaults
  const [profile, setProfile] = useState({
    fullName: user ? (`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username) : 'Rahul Sharma',
    mobileNumber: user?.phone_number || '+91 98765 43210',
    email: user?.email || 'rahul.sharma@gmail.com',
    dateOfBirth: '12 March 1998',
    gender: 'Male',
    city: 'Bangalore, Karnataka',
    initials: user ? (user.username || 'RS').slice(0, 2).toUpperCase() : 'RS',
    patientId: user?.patient_id || 'PAT-1001',
    address: user?.address || '123 Clinic Street, Indiranagar, Bangalore',
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    ...profile,
    mobileNumber: user?.phone_number || '9876543210',
  });
  const [editErrors, setEditErrors] = useState({});
  const editDialogRef = useRef(null);

  // Appointment Details Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const appointmentDialogRef = useRef(null);

  // Filters
  const [appointmentFilter, setAppointmentFilter] = useState('All');
  const [prescriptionFilter, setPrescriptionFilter] = useState('All');

  // Appointment History Data
  const [appointments, setAppointments] = useState([
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
  const [prescriptions, setPrescriptions] = useState([
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

  // Fetch real patient profile, appointments, and prescriptions from Neon PostgreSQL
  const fetchPatientData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const res = await appointmentApi.getMyProfile();
      if (res) {
        setProfile((prev) => ({
          ...prev,
          fullName: res.name || prev.fullName,
          email: res.email || prev.email,
          mobileNumber: res.mobile || prev.mobileNumber,
          initials: res.initials || prev.initials,
          patientId: res.id || prev.patientId,
          address: res.address || prev.address,
          gender: res.ageGender || prev.gender,
        }));

        // Format real appointments
        if (Array.isArray(res.appointments)) {
          const formattedApts = res.appointments.map((a, idx) => {
            const dateStr = a.date || '';
            const parts = dateStr.trim().split(/[\s-]+/);
            const day = parts[0] || '28';
            const month = parts.length > 2 ? `${parts[1].toUpperCase()} ${parts[2]}` : (parts[1] || 'OCT 2026');

            return {
              id: a.id || a.appointmentId || idx + 1,
              appointmentId: a.id || a.appointmentId || `APT-${idx + 1}`,
              day: day,
              month: month,
              fullDate: a.date,
              title: a.reason || 'Homeopathy Consultation',
              type: a.consultationType || 'In clinic Visit',
              doctor: 'Dr. Kumar Tripathi Ampeh (Pat.)',
              time: a.time || '10:00 AM',
              status: a.status || 'Confirmed',
              pdfName: `Appointment_${a.id || idx + 1}.pdf`,
              pdfDate: a.date,
              reason: a.reason,
            };
          });
          setAppointments(formattedApts);
        }

        // Format real prescriptions
        if (Array.isArray(res.prescriptions)) {
          const formattedRxs = res.prescriptions.map((r, idx) => {
            return {
              id: r.id || r.rxId || idx + 1,
              title: `Prescription - ${r.diagnosis || r.complaint || 'Clinical Consultation'}`,
              date: r.date || 'Today',
              fileName: `Prescription_${r.id || idx + 1}.pdf`,
              diagnosis: r.diagnosis,
              complaint: r.complaint,
              symptoms: r.symptoms,
              medicines: r.medicines || [],
              additionalInstructions: r.additionalInstructions,
              status: r.status || 'Delivered',
            };
          });
          setPrescriptions(formattedRxs);
        }
      }
    } catch (err) {
      console.error('Failed to load patient profile from Neon:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPatientData();

    // Real-time synchronization: refresh on event or focus
    window.addEventListener('appointment-booked', fetchPatientData);
    window.addEventListener('prescription-created', fetchPatientData);
    window.addEventListener('focus', fetchPatientData);

    // Reliable 10-second polling for automatic sync across Patient and Admin portals
    const interval = setInterval(fetchPatientData, 10000);

    return () => {
      window.removeEventListener('appointment-booked', fetchPatientData);
      window.removeEventListener('prescription-created', fetchPatientData);
      window.removeEventListener('focus', fetchPatientData);
      clearInterval(interval);
    };
  }, [fetchPatientData]);

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
    // Extract 10-digit mobile number for clean editing
    const rawMobile = profile.mobileNumber || '';
    let digits = rawMobile.replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      digits = digits.slice(2);
    }
    digits = digits.slice(0, 10);

    setEditFormData({
      ...profile,
      mobileNumber: digits,
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditErrors({});
    setIsEditOpen(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fullName') {
      const cleaned = value.replace(/[^a-zA-Z\s.()]/g, '').slice(0, 35);
      if (/[^a-zA-Z\s.()]/.test(value)) {
        setEditErrors((prev) => ({
          ...prev,
          fullName: 'Only letters, spaces, dots, and parentheses are allowed',
        }));
      } else if (editErrors.fullName) {
        setEditErrors((prev) => ({ ...prev, fullName: '' }));
      }
      setEditFormData((prev) => ({ ...prev, fullName: cleaned }));
      return;
    }

    if (name === 'mobileNumber') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }
      if (/\D/.test(value)) {
        setEditErrors((prev) => ({
          ...prev,
          mobileNumber: 'Only numbers are allowed',
        }));
      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {
        setEditErrors((prev) => ({
          ...prev,
          mobileNumber: 'Mobile number must start with 6, 7, 8, or 9',
        }));
        return;
      } else if (editErrors.mobileNumber) {
        setEditErrors((prev) => ({ ...prev, mobileNumber: '' }));
      }
      digits = digits.slice(0, 10);
      setEditFormData((prev) => ({ ...prev, mobileNumber: digits }));
      return;
    }

    if (name === 'email') {
      let val = value.replace(/\s/g, '').toLowerCase();
      const comIndex = val.indexOf('.com');
      if (comIndex !== -1) {
        val = val.slice(0, comIndex + 4);
      }
      if (editErrors.email) {
        setEditErrors((prev) => ({ ...prev, email: '' }));
      }
      setEditFormData((prev) => ({ ...prev, email: val }));
      return;
    }

    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileEmailKeyDown = (e) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    const currentVal = (editFormData.email || '').toLowerCase();
    const comIndex = currentVal.indexOf('.com');
    if (comIndex !== -1) {
      if (e.target.selectionStart >= comIndex + 4) {
        e.preventDefault();
      }
    }
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const errors = {};

    // 1. Full Name Validation: non-empty, letters & spaces only, max 25 chars
    const nameTrimmed = (editFormData.fullName || '').trim();
    if (!nameTrimmed) {
      errors.fullName = 'Full Name is required';
    } else if (nameTrimmed.length > 35) {
      errors.fullName = 'Full Name cannot exceed 35 characters';
    } else if (!/^[a-zA-Z\s.()]+$/.test(nameTrimmed)) {
      errors.fullName = 'Only alphabets and spaces are allowed';
    }

    // 2. Mobile Number Validation: exactly 10 digits, starts with 6, 7, 8, 9
    const mobileDigits = (editFormData.mobileNumber || '').replace(/\D/g, '');
    if (!mobileDigits) {
      errors.mobileNumber = 'Mobile number is required';
    } else if (mobileDigits.length !== 10) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(mobileDigits)) {
      errors.mobileNumber = 'Mobile number must start with 6, 7, 8, or 9';
    }

    // 3. Email Validation: valid email format, no words after .com
    const emailVal = (editFormData.email || '').trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailVal) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(emailVal)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com)';
    } else if (/@.*\.com.+/i.test(emailVal)) {
      errors.email = 'No words or characters allowed after .com';
    }

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }

    // Compute initials from Full Name
    const parts = nameTrimmed.split(/\s+/);
    const computedInitials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : nameTrimmed.slice(0, 2).toUpperCase();

    // Format mobile for display (+91 98765 43210)
    const formattedMobile = `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`;

    appointmentApi.updateMyProfile({
      name: nameTrimmed,
      phone: mobileDigits,
      email: emailVal,
    }).catch((err) => console.error('Failed to update profile in Neon:', err));

    setProfile({
      ...editFormData,
      fullName: nameTrimmed,
      mobileNumber: formattedMobile,
      initials: computedInitials || 'RS',
    });
    setEditErrors({});
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

      {/* Main Container: Expanded to cover LHS and RHS matching Navbar */}
      <div
        className="profile-container"
        style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '36px 40px 80px',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        {/* Top Profile Banner Card (Exact match to Reference Image 1) */}
        <div
          className="profile-header-card"
          style={{
            backgroundColor: '#edf5ee',
            border: '1px solid #e1efe4',
            borderRadius: '20px',
            padding: '24px 44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ zIndex: 2, maxWidth: '680px' }}>
            <h1
              style={{
                fontSize: '34px',
                fontWeight: '800',
                color: '#111827',
                margin: '0 0 6px 0',
                letterSpacing: '-0.4px',
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              Profile
            </h1>
            <p
              style={{
                fontSize: '15px',
                color: '#4b5563',
                margin: 0,
                fontWeight: '400',
                fontFamily: "'Manrope', sans-serif",
                lineHeight: '1.5',
              }}
            >
              Manage your profile, view your appointment history and prescriptions.
            </p>
          </div>

          {/* Right Herbal Graphic (High-definition, perfectly sized & positioned) */}
          <div
            className="profile-herbs-wrapper"
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px',
            }}
          >
            <img
              src={profileHerbs}
              alt="Natural Homeopathy Herbs"
              className="profile-herbs-img"
              style={{
                height: '170px',
                width: 'auto',
                display: 'block',
                objectFit: 'contain',
                filter: 'drop-shadow(0 10px 22px rgba(22, 101, 52, 0.12))',
                transition: 'transform 0.3s ease',
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
              <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0', fontFamily: "'Manrope', sans-serif" }}>
                Personal Information
              </h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
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
                gap: '8px',
                transition: 'all 0.15s ease',
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </svg>
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
            <div
              style={{
                width: '92px',
                height: '92px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '28px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(22, 101, 52, 0.12)',
                fontFamily: "'Manrope', sans-serif",
                flexShrink: 0,
              }}
            >
              {profile.initials}
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    FULL NAME
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.fullName}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    EMAIL
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.email}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
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
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v10" />
                    <path d="M8 12h8" />
                  </svg>
                </span>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>
                    GENDER
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block' }}>
                    {profile.gender}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                    Appointment History
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>
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
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <option value="All">All Appointments</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>

            {/* Appointments List (Clicking opens details modal) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {appointments.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '500' }}>
                    No appointment records found in your account.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/book-appointment')}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '9999px',
                      backgroundColor: '#265e38',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    Book Your First Appointment →
                  </button>
                </div>
              ) : appointments
                .filter((item) => {
                  if (appointmentFilter === 'All') return true;
                  if (appointmentFilter === 'Upcoming') return item.status === 'Confirmed' || item.status === 'Pending';
                  if (appointmentFilter === 'Completed') return item.status === 'Completed';
                  return true;
                })
                .map((item) => (
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
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#1b4332', lineHeight: '1', fontFamily: "'Manrope', sans-serif" }}>
                        {item.day}
                      </span>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#2e7d32', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                        {item.month}
                      </span>
                    </div>

                    {/* Consultation Meta */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>
                        {item.doctor}
                      </p>
                      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>
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
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {item.status}
                    </span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32',
                    flexShrink: 0,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                    Prescriptions
                  </h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>
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
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                <option value="All">All Prescriptions</option>
                <option value="Recent">Recent</option>
              </select>
            </div>

            {/* Prescriptions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {prescriptions.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
                    No prescriptions issued yet. Once your doctor creates a prescription, it will appear here permanently.
                  </p>
                </div>
              ) : prescriptions
                .filter((item) => {
                  if (prescriptionFilter === 'All') return true;
                  return true;
                })
                .map((item) => (
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
                        flexShrink: 0,
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>
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
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bbf7d0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
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
          maxWidth: '620px',
          width: '92%',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          backgroundColor: '#ffffff',
        }}
      >
        {selectedAppointment && (
          <div style={{ padding: '32px 36px 30px' }}>
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
                  letterSpacing: '-0.3px',
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Appointment Details
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: '700',
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    fontFamily: "'Manrope', sans-serif",
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
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    borderRadius: '6px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Appointment Type
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Appointment ID
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Date
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Time
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Doctor
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="9 12 11 14 15 10" />
                    </svg>
                  </div>
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Consultation Status
                    </span>
                    <strong style={{ fontSize: '13.5px', color: '#16a34a', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
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
                marginBottom: '20px',
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
                  backgroundColor: '#e8f5e9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#111827', margin: '0 0 3px 0', fontFamily: "'Manrope', sans-serif" }}>
                  Consultation Summary
                </h4>
                <p style={{ fontSize: '12.5px', color: '#6b7280', margin: 0, lineHeight: '1.5', fontFamily: "'Manrope', sans-serif" }}>
                  Your consultation was completed. Review the visit information and any documents shared by your doctor.
                </p>
              </div>
            </div>

            {/* Box 3: Attached Documents */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                  Attached Documents
                </h4>
              </div>

              {/* Document Item Box */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #edf2ee',
                  borderRadius: '14px',
                  padding: '14px 18px',
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
                      backgroundColor: '#fef2f2',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    PDF
                  </span>
                  <div>
                    <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.pdfName}
                    </strong>
                    <span style={{ fontSize: '11.5px', color: '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>
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
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
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
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bbf7d0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
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
              aria-label="Close Edit Profile"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSaveProfile} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', fontFamily: "'Manrope', sans-serif" }}>
                  Full Name
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: (editFormData.fullName || '').length >= 35 ? '#dc2626' : '#9ca3af',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {(editFormData.fullName || '').length}/35
                </span>
              </div>
              <input
                type="text"
                name="fullName"
                value={editFormData.fullName || ''}
                maxLength={35}
                onChange={handleEditChange}
                placeholder="Enter full name"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: editErrors.fullName ? '1px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.15s ease',
                }}
              />
              {editErrors.fullName && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{editErrors.fullName}</span>
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', fontFamily: "'Manrope', sans-serif" }}>
                  Mobile Number
                </label>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: (editFormData.mobileNumber || '').length === 10 ? '#16a34a' : '#9ca3af',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {(editFormData.mobileNumber || '').length}/10 digits
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '8px',
                  border: editErrors.mobileNumber ? '1px solid #ef4444' : '1px solid #d1d5db',
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.15s ease',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#f9fafb',
                    color: '#4b5563',
                    fontSize: '14px',
                    fontWeight: '700',
                    borderRight: '1px solid #e5e7eb',
                    userSelect: 'none',
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={editFormData.mobileNumber || ''}
                  onChange={handleEditChange}
                  maxLength={10}
                  placeholder="Starts with 6, 7, 8 or 9"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: 'none',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: 'border-box',
                    letterSpacing: '0.5px',
                  }}
                />
              </div>
              {editErrors.mobileNumber && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{editErrors.mobileNumber}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', fontFamily: "'Manrope', sans-serif" }}>
                  Email Address
                </label>
              </div>
              <input
                type="email"
                name="email"
                value={editFormData.email || ''}
                onChange={handleEditChange}
                onKeyDown={handleProfileEmailKeyDown}
                placeholder="name@example.com"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: editErrors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff',
                  transition: 'border-color 0.15s ease',
                }}
              />
              {editErrors.email && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Manrope', sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{editErrors.email}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px', fontFamily: "'Manrope', sans-serif" }}>
                  Date of Birth
                </label>
                <input
                  type="text"
                  name="dateOfBirth"
                  value={editFormData.dateOfBirth || ''}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px', fontFamily: "'Manrope', sans-serif" }}>
                  Gender
                </label>
                <select
                  name="gender"
                  value={editFormData.gender || 'Male'}
                  onChange={handleEditChange}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '5px', fontFamily: "'Manrope', sans-serif" }}>
                City, State
              </label>
              <input
                type="text"
                name="city"
                value={editFormData.city || ''}
                onChange={handleEditChange}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: "'Manrope', sans-serif",
                  boxSizing: 'border-box',
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
                  fontFamily: "'Manrope', sans-serif",
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
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </dialog>

      <PatientAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => fetchPatientData()}
      />

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
          style={{
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '0 40px',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
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
        dialog::backdrop {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
        }
        @media (max-width: 860px) {
          .profile-header-card {
            padding: 22px 28px !important;
          }
          .profile-herbs-img {
            height: 135px !important;
          }
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
        @media (max-width: 640px) {
          .profile-header-card {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 20px 20px !important;
          }
          .profile-herbs-wrapper {
            align-self: flex-end !important;
            margin-right: 0 !important;
          }
          .profile-herbs-img {
            height: 110px !important;
          }
          .profile-container {
            padding: 24px 16px 50px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;

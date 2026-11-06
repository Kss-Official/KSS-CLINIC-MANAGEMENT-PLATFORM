import React, { useState, useRef, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import Navbar from '../../components/layout/Navbar';

import useAuth from '../../hooks/useAuth';

import appointmentApi from '../../api/appointmentApi';
import userApi from '../../api/userApi';

import PatientAuthModal from '../../components/auth/PatientAuthModal';

import ViewPrescriptionModal from '../../components/admin/ViewPrescriptionModal';

import PrescriptionPreviewCard from '../../components/admin/PrescriptionPreviewCard';

import { downloadPrescriptionPdf } from '../../utils/prescriptionPdf';
import { downloadAppointmentConfirmationPdf } from '../../utils/appointmentPdf';

import profileHerbs from '../../assets/profile-banner-herbs.png?v=v3_clean_mortar_herbs';



const formatMobileForDisplay = (raw) => {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    const ten = digits.slice(2);
    return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
  }
  return raw;
};

const formatDobForDisplay = (dobStr) => {
  if (!dobStr) return '—';
  const trimmed = String(dobStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[parseInt(month, 10) - 1];
    if (monthName) {
      return `${parseInt(day, 10)} ${monthName} ${year}`;
    }
  }
  return trimmed;
};

const ProfilePage = () => {

  const navigate = useNavigate();

  const { user, isAuthenticated, updateUser } = useAuth();

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);



  // Consistent initials generator across Profile and Navbar
  const getInitials = (name, fallbackUser = null) => {
    if (fallbackUser?.initials) return fallbackUser.initials.toUpperCase();
    const nameToUse = (
      name ||
      fallbackUser?.full_name ||
      fallbackUser?.name ||
      fallbackUser?.fullName ||
      `${fallbackUser?.first_name || ''} ${fallbackUser?.last_name || ''}`.trim() ||
      fallbackUser?.username ||
      ''
    ).trim();
    if (!nameToUse) return 'P';
    const parts = nameToUse.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const initialName = user ? (user.full_name || user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '') : '';
  const initialInitials = user?.initials || getInitials(initialName, user);

  // User profile state initialized with clinic reference design defaults

  const [profile, setProfile] = useState({

    fullName: initialName,

    mobileNumber: user?.phone_number || '',

    email: user?.email || '',

    dateOfBirth: '',

    gender: '',

    city: '',

    initials: initialInitials,

    patientId: user?.patient_id || '',

    address: user?.address || '',

    profileImageUrl: user?.profile_image_url || null,

  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const uploadDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target)) {
        setUploadDropdownOpen(false);
      }
    };
    if (uploadDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [uploadDropdownOpen]);



  // Profile Image Upload / Removal Handlers
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5 MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const res = await userApi.uploadProfileImage(formData);
      const newImageUrl = res?.profile_image_url || res?.user?.profile_image_url;

      if (newImageUrl) {
        setProfile((prev) => ({
          ...prev,
          profileImageUrl: newImageUrl,
        }));
        if (updateUser && user) {
          updateUser({
            ...user,
            profile_image_url: newImageUrl,
          });
        }
        window.dispatchEvent(new CustomEvent('profile-image-updated', {
          detail: { profile_image_url: newImageUrl }
        }));
      }
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      const msg = err.response?.data?.error || 'Failed to upload profile picture. Please try again.';
      alert(msg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (e) => {
    e?.stopPropagation?.();
    setUploadDropdownOpen(false);

    // 1. Instantly remove image from both Personal Information and Navbar with a single click
    setProfile((prev) => ({ ...prev, profileImageUrl: null }));
    if (updateUser && user) {
      updateUser({
        ...user,
        profile_image_url: null,
      });
    }

    window.dispatchEvent(new CustomEvent('profile-image-updated', {
      detail: { profile_image_url: null }
    }));

    // 2. Perform backend delete
    setIsUploadingImage(true);
    try {
      await userApi.removeProfileImage();
    } catch (err) {
      console.error('Failed to remove profile picture:', err);
      alert(err.response?.data?.error || 'Failed to remove profile picture.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Edit Modal State

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editFormData, setEditFormData] = useState({

    ...profile,

    mobileNumber: user?.phone_number || '9876543210',

  });

  const [editErrors, setEditErrors] = useState({});

  const editDialogRef = useRef(null);



  // Prescription Preview & Download State

  const [viewPrescriptionModalOpen, setViewPrescriptionModalOpen] = useState(false);

  const [selectedPrescription, setSelectedPrescription] = useState(null);

  const [downloadingRxId, setDownloadingRxId] = useState(null);

  const [downloadingRx, setDownloadingRx] = useState(null);



  // Appointment Details Modal State

  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [viewingAppointmentPdf, setViewingAppointmentPdf] = useState(false);

  const [downloadingAppointmentPdf, setDownloadingAppointmentPdf] = useState(false);

  const [appointmentPdfModalOpen, setAppointmentPdfModalOpen] = useState(false);

  const [appointmentPdfUrl, setAppointmentPdfUrl] = useState(null);

  const [appointmentPdfFilename, setAppointmentPdfFilename] = useState('');

  const appointmentDialogRef = useRef(null);

  // Filters
  const [appointmentFilter, setAppointmentFilter] = useState('All');
  const [prescriptionFilter, setPrescriptionFilter] = useState('All');

  // Pagination states
  const [aptCurrentPage, setAptCurrentPage] = useState(1);
  const [aptPageSize, setAptPageSize] = useState(5);

  const [rxCurrentPage, setRxCurrentPage] = useState(1);
  const [rxPageSize, setRxPageSize] = useState(5);

  // Appointment History Data (starts empty, populated strictly for authenticated user)

  const [appointments, setAppointments] = useState([]);



  // Prescriptions Data (starts empty, populated strictly for authenticated user)

  const [prescriptions, setPrescriptions] = useState([]);



  // Fetch real patient profile, appointments, and prescriptions from Neon PostgreSQL

  const fetchPatientData = useCallback(async (silent = false) => {

    try {

      if (!silent) {

        setIsLoading(true);

      }

      const currentUser = userRef.current;
      const queryParams = {};

      if (currentUser?.patient_id) queryParams.patient_id = currentUser.patient_id;
      if (currentUser?.email) queryParams.email = currentUser.email;
      if (currentUser?.phone_number) queryParams.phone = currentUser.phone_number;

      const res = await appointmentApi.getMyProfile(queryParams);

      if (res) {
        const loadedName = res.name || currentUser?.full_name || currentUser?.name || '';
        const loadedInitials = res.initials || getInitials(loadedName, currentUser);
        const loadedImage = res.profile_image_url || null;

        setProfile((prev) => ({

          ...prev,

          fullName: loadedName,

          email: res.email || prev.email || '',

          mobileNumber: res.mobile || prev.mobileNumber || '',

          initials: loadedInitials,

          patientId: res.id || prev.patientId || '',

          address: res.address || prev.address || '',

          gender: res.gender || '',

          dateOfBirth: res.dateOfBirth || res.date_of_birth || res.dob || '',

          city: res.city || prev.city || '',

          profileImageUrl: loadedImage,

        }));

        if (updateUser && currentUser) {
          const isNameDiff = (currentUser.name || currentUser.full_name || '') !== loadedName;
          const isInitialsDiff = (currentUser.initials || '') !== loadedInitials;
          const isImgDiff = (currentUser.profile_image_url || null) !== (loadedImage || null);
          const isPatientIdDiff = Boolean(res.id && currentUser.patient_id !== res.id);
          if (isNameDiff || isInitialsDiff || isImgDiff || isPatientIdDiff) {
            updateUser({
              ...currentUser,
              name: loadedName,
              full_name: loadedName,
              first_name: loadedName ? loadedName.split(' ')[0] : currentUser.first_name,
              last_name: loadedName && loadedName.includes(' ') ? loadedName.split(' ').slice(1).join(' ') : (currentUser.last_name || ''),
              initials: loadedInitials,
              profile_image_url: loadedImage,
              patient_id: res.id || currentUser.patient_id,
            });
          }
        }



        // Format real appointments

        if (Array.isArray(res.appointments) && res.appointments.length > 0) {

          const formattedApts = res.appointments.map((a, idx) => {

            const dateStr = a.date || '';

            const parts = dateStr.trim().split(/[\s-]+/).filter(Boolean);

            let day = '01';
            let monthShort = 'NOV';
            let year = '2026';

            if (parts.length >= 3) {
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                year = parts[0];
                const mIdx = parseInt(parts[1], 10) - 1;
                const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                monthShort = monthNames[mIdx] || parts[1].slice(0, 3).toUpperCase();
                day = parts[2];
              } else {
                // DD Month YYYY (e.g. 5 November 2026)
                day = parts[0];
                monthShort = parts[1].slice(0, 3).toUpperCase();
                year = parts[2];
              }
            } else if (parts.length === 2) {
              day = parts[0];
              monthShort = parts[1].slice(0, 3).toUpperCase();
            } else if (parts.length === 1 && parts[0]) {
              day = parts[0];
            }

            return {

              id: a.id || a.appointmentId || idx + 1,

              appointmentId: a.id || a.appointmentId || `APT-${idx + 1}`,

              day: day,

              month: monthShort,

              monthShort: monthShort,

              year: year,

              fullDate: a.date,

              title: a.reason || 'Homeopathy Consultation',

              type: a.consultationType || 'In clinic Visit',

              doctor: 'Dr. Kumar Tripathi Ampeh (Pat.)',

              time: a.time || '10:00 AM',

              status: a.status || 'Confirmed',

              pdfName: `Appointment_${a.id || a.appointmentId || idx + 1}.pdf`,

              pdfDate: a.date,

              reason: a.reason || '',

              hasPrescription: !!a.hasPrescription,

              patientName: a.patientName || a.fullName || a.name || profile.fullName || 'Patient',

              patientPhone: a.patientPhone || a.phone || a.mobile || a.mobileNumber || profile.mobileNumber || '',

              patientEmail: a.patientEmail || a.email || profile.email || '',

              gender: a.gender || profile.gender || '',

              age: a.age || profile.age || '',

              city: a.city || profile.city || '',

            };

          });

          setAppointments((prev) => {

            if (JSON.stringify(prev) === JSON.stringify(formattedApts)) return prev;

            return formattedApts;

          });

        } else {

          setAppointments([]);

        }



        // Format real prescriptions

        if (Array.isArray(res.prescriptions)) {

          if (res.prescriptions.length > 0) {

            const formattedRxs = res.prescriptions.map((r, idx) => {

              const rxId = r.id || r.rxId || `RX-2026-${1000 + idx}`;

              const patientName = r.patientName || r.name || res.name || profile.fullName || 'Patient';

              const safePatientName = patientName.replace(/\s+/g, '_');

              const patientId = r.patientId || res.id || profile.patientId || 'PAT-1001';

              const ageGender = r.ageGender || res.ageGender || profile.gender || '30 / Adult';

              const contact = r.contact || r.mobile || res.mobile || profile.mobileNumber || '+91 98765 43210';

              const diagnosis = r.diagnosis || r.complaint || 'Clinical Consultation';

              const medicines = Array.isArray(r.medicines) ? r.medicines : [];

              const additionalInstructions = r.additionalInstructions || r.additional_instructions || r.notes || '';



              return {

                id: rxId,

                rxId: rxId,

                prescriptionId: rxId,

                title: `Prescription - ${diagnosis}`,

                date: r.date || 'Today',

                time: r.time || '10:00 AM',

                created_at: r.created_at,

                createdAt: r.created_at,

                fileName: `Prescription_${safePatientName}_${rxId}.pdf`,

                diagnosis,

                complaint: r.complaint || diagnosis,

                symptoms: r.symptoms || '',

                medicines,

                additionalInstructions,

                notes: additionalInstructions,

                status: r.status || 'Pending',

                patientName,

                name: patientName,

                patientId,

                ageGender,

                contact,

                mobile: contact,

                phone: contact,

                patient: {

                  name: patientName,

                  id: patientId,

                  ageGender,

                  phone: contact,

                  contact,

                },

              };

            });

            setPrescriptions((prev) => {

              if (JSON.stringify(prev) === JSON.stringify(formattedRxs)) return prev;

              return formattedRxs;

            });

          } else {

            setPrescriptions([]);

          }

        }

      }

    } catch (err) {

      console.error('Failed to load patient profile from Neon:', err);

    } finally {

      if (!silent) {

        setIsLoading(false);

      }

    }

  }, []);



  useEffect(() => {

    fetchPatientData(false);



    const handleEvent = () => fetchPatientData(true);



    // Real-time synchronization: refresh on event or focus

    window.addEventListener('appointment-booked', handleEvent);

    window.addEventListener('appointment-updated', handleEvent);

    window.addEventListener('prescription-created', handleEvent);

    window.addEventListener('focus', handleEvent);



    // Reliable 10-second polling for automatic sync across Patient and Admin portals

    const interval = setInterval(() => fetchPatientData(true), 10000);



    return () => {

      window.removeEventListener('appointment-booked', handleEvent);

      window.removeEventListener('appointment-updated', handleEvent);

      window.removeEventListener('prescription-created', handleEvent);

      window.removeEventListener('focus', handleEvent);

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
    const computedInitials = getInitials(nameTrimmed, user);

    // Format mobile for display (+91 98765 43210)
    const formattedMobile = `+91 ${mobileDigits.slice(0, 5)} ${mobileDigits.slice(5)}`;

    appointmentApi.updateMyProfile({
      name: nameTrimmed,
      phone: mobileDigits,
      email: emailVal,
      gender: editFormData.gender || '',
      date_of_birth: editFormData.dateOfBirth || '',
      city: editFormData.city || '',
    }).then((res) => {
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
    }).catch((err) => console.error('Failed to update profile:', err));

    setProfile((prev) => ({
      ...prev,
      ...editFormData,
      fullName: nameTrimmed,
      mobileNumber: formattedMobile,
      initials: computedInitials,
    }));

    if (updateUser && user) {
      updateUser({
        ...user,
        name: nameTrimmed,
        full_name: nameTrimmed,
        first_name: nameTrimmed ? nameTrimmed.split(' ')[0] : user.first_name,
        last_name: nameTrimmed && nameTrimmed.includes(' ') ? nameTrimmed.split(' ').slice(1).join(' ') : '',
        initials: computedInitials,
      });
    }

    window.dispatchEvent(new CustomEvent('profile-updated', {
      detail: {
        name: nameTrimmed,
        full_name: nameTrimmed,
        initials: computedInitials,
      }
    }));

    setEditErrors({});

    setIsEditOpen(false);

  };



  const handleOpenAppointmentModal = (appointment) => {

    setSelectedAppointment(appointment);

  };



  const handleCloseAppointmentModal = () => {

    setSelectedAppointment(null);

  };



  const handleDownloadPrescription = async (rx) => {

    if (!rx) return;

    const rxId = rx.prescriptionId || rx.id || rx.rxId;

    setDownloadingRxId(rxId);

    setDownloadingRx(rx);



    try {

      // Allow DOM to update and render the offscreen printable card

      await new Promise((resolve) => setTimeout(resolve, 150));



      const cardElement = document.getElementById('printable-prescription-card-patient');

      if (!cardElement) {

        throw new Error('Could not locate printable prescription element.');

      }



      const patientName = rx.patientName || rx.name || profile.fullName || 'Patient';

      const safePatientName = patientName.replace(/\s+/g, '_');

      const filename = `Prescription_${safePatientName}_${rxId}.pdf`;



      await downloadPrescriptionPdf(cardElement, filename);

    } catch (err) {

      console.error('Failed to download prescription PDF:', err);

      alert('Failed to download prescription PDF: ' + (err?.message || 'Please try again.'));

    } finally {

      setDownloadingRxId(null);

      setDownloadingRx(null);

    }

  };



  const handleViewPrescription = (rx) => {

    setSelectedPrescription(rx);

    setViewPrescriptionModalOpen(true);

  };



  const handleViewPdf = async (aptOrName) => {
    const apt = (typeof aptOrName === 'object' && aptOrName !== null) ? aptOrName : (selectedAppointment || {});
    const aptId = apt.appointmentId || apt.id || (typeof aptOrName === 'string' ? aptOrName.replace(/^Appointment_/i, '').replace(/\.pdf$/i, '') : '');
    const filename = apt.pdfName || (aptId ? `Appointment_${aptId}.pdf` : 'Appointment_Document.pdf');
    if (!aptId) {
      alert('Could not identify appointment for PDF preview.');
      return;
    }

    setViewingAppointmentPdf(true);
    try {
      const blob = await appointmentApi.downloadAppointmentPdfBlob(aptId);
      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);
      setAppointmentPdfUrl(blobUrl);
      setAppointmentPdfFilename(filename);
      setAppointmentPdfModalOpen(true);
      try {
        window.open(blobUrl, '_blank');
      } catch (e) {
        console.warn('Popup blocked; viewing in in-app preview modal', e);
      }
    } catch (err) {
      console.error('Failed to view appointment PDF:', err);
      alert('Failed to view appointment PDF. Please try again.');
    } finally {
      setViewingAppointmentPdf(false);
    }
  };

  const handleDownloadAppointmentPdf = (aptOrName) => {
    const apt = (typeof aptOrName === 'object' && aptOrName !== null) ? aptOrName : (selectedAppointment || {});
    if (!apt) return;

    const aptId = apt.appointmentId || apt.id || 'APT-CONFIRMED';
    // Generates the exact confirmed appointment receipt PDF matching website branding
    downloadAppointmentConfirmationPdf({
      appointmentId: aptId,
      fullName: apt.patientName || profile.fullName || user?.name || 'Patient',
      mobileNumber: apt.patientPhone || profile.mobileNumber || user?.phone || '',
      email: apt.patientEmail || profile.email || user?.email || '',
      doctorName: apt.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
      service: apt.reason || apt.title || apt.service || 'Homeopathic Consultation',
      reason: apt.reason || apt.title || '',
      date: apt.fullDate || apt.date || '',
      time: apt.time || '',
      clinicAddress: '12, Green Park, MG Road, Bangalore, Karnataka - 560001',
      clinicPhone: '+91 98765 43210',
      filename: apt.pdfName || `Appointment_${aptId}.pdf`,
    });
  };

  const handleRescheduleAppointment = (apt) => {
    const targetApt = apt || selectedAppointment;
    if (!targetApt) return;

    // Cache appointment data in localStorage so BookAppointmentPage picks it up reliably
    try {
      localStorage.setItem('kss_reschedule_appointment', JSON.stringify({
        ...targetApt,
        id: targetApt.appointmentId || targetApt.id,
        appointmentId: targetApt.appointmentId || targetApt.id,
        patientName: targetApt.patientName || profile.fullName || user?.name || '',
        patientPhone: targetApt.patientPhone || profile.mobileNumber || user?.phone || '',
        patientEmail: targetApt.patientEmail || profile.email || user?.email || '',
        patientGender: targetApt.gender || profile.gender || '',
        patientAge: targetApt.age || profile.age || '',
        city: targetApt.city || profile.city || '',
        reason: targetApt.title || targetApt.service || targetApt.reason || '',
        title: targetApt.title || targetApt.service || targetApt.reason || '',
        fullDate: targetApt.fullDate || targetApt.date || '',
        time: targetApt.time || '',
        doctor: targetApt.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
      }));
    } catch (e) {
      console.warn('Failed to cache reschedule appointment', e);
    }

    handleCloseAppointmentModal();

    navigate('/book-appointment', {
      state: {
        rescheduleAppointment: {
          ...targetApt,
          id: targetApt.appointmentId || targetApt.id,
          appointmentId: targetApt.appointmentId || targetApt.id,
          patientName: targetApt.patientName || profile.fullName || user?.name || '',
          patientPhone: targetApt.patientPhone || profile.mobileNumber || user?.phone || '',
          patientEmail: targetApt.patientEmail || profile.email || user?.email || '',
          patientGender: targetApt.gender || profile.gender || '',
          patientAge: targetApt.age || profile.age || '',
          city: targetApt.city || profile.city || '',
          reason: targetApt.title || targetApt.service || targetApt.reason || '',
          title: targetApt.title || targetApt.service || targetApt.reason || '',
          fullDate: targetApt.fullDate || targetApt.date || '',
          time: targetApt.time || '',
          doctor: targetApt.doctor || 'Dr. Kumar Tripathi Ampeh (Pat.)',
        },
      },
    });
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

  // Reusable Pagination Component (matching target UI with prev/next, active green page, and size selector)
  const renderPagination = ({
    currentPage,
    totalPages,
    pageSize,
    onPageChange,
    onPageSizeChange,
  }) => {
    const count = Math.max(1, totalPages);
    let startPage = 1;
    let endPage = count;
    if (count > 5) {
      startPage = Math.max(1, currentPage - 2);
      endPage = Math.min(count, startPage + 4);
      if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
      }
    }
    const pageNumbers = [];
    for (let p = startPage; p <= endPage; p++) {
      pageNumbers.push(p);
    }

    return (
      <div
        className="profile-pagination"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '18px',
          paddingTop: '16px',
          borderTop: '1px solid #f1f5f9',
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          aria-label="Previous Page"
          style={{
            width: '34px',
            height: '34px',
            minWidth: '34px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: currentPage <= 1 ? '#cbd5e1' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.45 : 1,
            transition: 'all 0.15s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Page Number Buttons */}
        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                width: '34px',
                height: '34px',
                minWidth: '34px',
                borderRadius: '8px',
                border: isActive ? '1px solid #0d5c3a' : '1px solid #e2e8f0',
                backgroundColor: isActive ? '#0d5c3a' : '#ffffff',
                color: isActive ? '#ffffff' : '#374151',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '600',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                padding: 0,
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.color = '#374151';
                }
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(count, currentPage + 1))}
          disabled={currentPage >= count}
          aria-label="Next Page"
          style={{
            width: '34px',
            height: '34px',
            minWidth: '34px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            color: currentPage >= count ? '#cbd5e1' : '#475569',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentPage >= count ? 'not-allowed' : 'pointer',
            opacity: currentPage >= count ? 0.45 : 1,
            transition: 'all 0.15s ease',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            if (currentPage < count) {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < count) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Page Size Selector */}
        <div
          className="profile-page-size-wrap"
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: '6px',
          }}
        >
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Select items per page"
            style={{
              height: '34px',
              padding: '0 28px 0 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: "'Manrope', sans-serif",
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <option value={5}>5 page</option>
            <option value={10}>10 page</option>
            <option value={20}>20 page</option>
          </select>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              position: 'absolute',
              right: '9px',
              pointerEvents: 'none',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  };

  return (

    <div

      className="profile-page-wrapper"

      style={{

        backgroundColor: '#f8faf9',

        minHeight: '100vh',

        display: 'flex',

        flexDirection: 'column',

        flex: 1,

        width: '100%',

        margin: 0,

        padding: 0,

      }}

    >

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

        {/* Top Profile Banner Card with Rich Graphics & Expanded Info */}

        <div

          className="profile-header-card"

          style={{

            backgroundColor: '#edf5ee',

            background: 'linear-gradient(135deg, #eef7f0 0%, #edf5ee 50%, #e5f1e7 100%)',

            border: '1px solid #d8e8dc',

            borderRadius: '24px',

            padding: '28px 44px',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'space-between',

            marginBottom: '28px',

            overflow: 'hidden',

            position: 'relative',

            boxShadow: '0 4px 20px -2px rgba(22, 101, 52, 0.05)',

          }}

        >

          {/* Left Text Column */}

          <div style={{ zIndex: 2, maxWidth: '620px' }} className="profile-header-text">

            {/* Eyebrow Chip */}

            <div

              style={{

                display: 'inline-flex',

                alignItems: 'center',

                gap: '8px',

                backgroundColor: '#ffffff',

                border: '1px solid #c7ebd2',

                borderRadius: '9999px',

                padding: '4px 13px',

                marginBottom: '10px',

                boxShadow: '0 2px 6px rgba(22, 101, 52, 0.04)',

              }}

            >

              <span

                style={{

                  width: '7px',

                  height: '7px',

                  borderRadius: '50%',

                  backgroundColor: '#10b981',

                  display: 'inline-block',

                }}

              />

              <span

                style={{

                  fontSize: '11.5px',

                  fontWeight: '800',

                  color: '#166534',

                  letterSpacing: '0.6px',

                  textTransform: 'uppercase',

                  fontFamily: "'Manrope', sans-serif",

                }}

              >

                Patient Care Dashboard

              </span>

            </div>



            <h1

              className="profile-header-title"

              style={{

                fontSize: '34px',

                fontWeight: '800',

                color: '#111827',

                margin: '0 0 10px 0',

                letterSpacing: '-0.4px',

                fontFamily: "'Manrope', sans-serif",

              }}

            >

              Profile

            </h1>



            {/* Paragraph with enriched, professional text covering the space */}

            <p

              className="profile-header-desc"

              style={{

                fontSize: '14.5px',

                color: '#4b5563',

                margin: 0,

                fontWeight: '400',

                fontFamily: "'Manrope', sans-serif",

                lineHeight: '1.65',

                maxWidth: '600px',

              }}

            >

              Manage your personal information, view your clinical consultation history, track treatment progress, and easily access your personalized homeopathic remedies and prescriptions.

            </p>

          </div>



          {/* Right Herbal Graphic (Wide High-definition, perfectly sized & positioned) */}

          <div

            className="profile-herbs-wrapper"

            style={{

              flexShrink: 0,

              display: 'flex',

              alignItems: 'center',

              justifyContent: 'center',

              position: 'relative',

              zIndex: 2,

            }}

          >

            <img

              src={profileHerbs}

              alt="Natural Homeopathy Herbs"

              className="profile-herbs-img"

              style={{

                height: '165px',

                maxWidth: '560px',

                width: 'auto',

                display: 'block',

                objectFit: 'contain',

                filter: 'drop-shadow(0 10px 20px rgba(22, 101, 52, 0.12))',

                transition: 'transform 0.3s ease',

              }}

            />

          </div>

        </div>



        {/* Personal Information Card */}

        <div

          className="profile-personal-card"

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

            className="profile-personal-card-header"

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

              className="profile-edit-btn"

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

            {/* Avatar & Upload Option with Dropdown */}
            <div
              ref={uploadDropdownRef}
              className="profile-avatar-wrapper"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                width: '120px',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              {/* Avatar Circle */}
              <div
                className="profile-avatar-circle"
                onClick={() => !isUploadingImage && setUploadDropdownOpen((prev) => !prev)}
                title="Click to manage profile picture"
                style={{
                  width: '92px',
                  height: '92px',
                  borderRadius: '50%',
                  backgroundColor: profile.profileImageUrl ? '#f8fafc' : '#dcfce7',
                  color: '#15803d',
                  fontSize: '28px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 12px rgba(22, 101, 52, 0.15)',
                  fontFamily: "'Manrope', sans-serif",
                  flexShrink: 0,
                  position: 'relative',
                  cursor: isUploadingImage ? 'wait' : 'pointer',
                  overflow: 'hidden',
                  border: '2px solid #ffffff',
                  outline: '2.5px solid #86efac',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {profile.profileImageUrl ? (
                  <img
                    key={profile.profileImageUrl}
                    src={profile.profileImageUrl}
                    alt={profile.fullName || 'Patient Profile'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '50%',
                    }}
                    onError={() => {
                      setProfile((prev) => ({ ...prev, profileImageUrl: null }));
                    }}
                  />
                ) : (
                  profile.initials
                )}

                {/* Upload Spinner Overlay */}
                {isUploadingImage && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      borderRadius: '50%',
                    }}
                  >
                    <svg
                      style={{ animation: 'spin 1s linear infinite' }}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Profile Dropdown Button */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => !isUploadingImage && setUploadDropdownOpen((prev) => !prev)}
                  disabled={isUploadingImage}
                  style={{
                    backgroundColor: uploadDropdownOpen ? '#f0fdf4' : 'transparent',
                    border: 'none',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontFamily: "'Manrope', sans-serif",
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isUploadingImage) {
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                      e.currentTarget.style.color = '#15803d';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadDropdownOpen) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#166534';
                    }
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Upload Profile</span>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transform: uploadDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Dropdown Menu: shows Upload Image when no image, or Change/Remove when image exists */}
                {uploadDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
                      padding: '6px',
                      minWidth: '160px',
                      zIndex: 60,
                      animation: 'fadeIn 0.12s ease-out',
                    }}
                  >
                    {/* Action 1: Upload Image (if no image) OR Change Profile (if image exists) */}
                    <button
                      type="button"
                      onClick={() => {
                        setUploadDropdownOpen(false);
                        fileInputRef.current?.click();
                      }}
                      disabled={isUploadingImage}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: 'transparent',
                        color: '#1e293b',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "'Manrope', sans-serif",
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0fdf4';
                        e.currentTarget.style.color = '#15803d';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#1e293b';
                      }}
                    >
                      {profile.profileImageUrl ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      )}
                      <span>{profile.profileImageUrl ? 'Change Profile' : 'Upload Image'}</span>
                    </button>

                    {/* Action 2: Remove Profile (only visible when profile image exists) */}
                    {profile.profileImageUrl && (
                      <button
                        type="button"
                        onClick={(e) => {
                          setUploadDropdownOpen(false);
                          handleRemoveImage(e);
                        }}
                        disabled={isUploadingImage}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          border: 'none',
                          borderRadius: '8px',
                          backgroundColor: 'transparent',
                          color: '#dc2626',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontFamily: "'Manrope', sans-serif",
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef2f2';
                          e.currentTarget.style.color = '#b91c1c';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#dc2626';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Remove Profile</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
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

              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />

                    <circle cx="12" cy="7" r="4" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    FULL NAME

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {profile.fullName}

                  </span>

                </div>

              </div>



              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    MOBILE NUMBER

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {profile.mobileNumber}

                  </span>

                </div>

              </div>



              {/* Row 2: Email & Date of Birth */}

              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />

                    <polyline points="22,6 12,13 2,6" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    EMAIL

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {profile.email}

                  </span>

                </div>

              </div>



              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                    <line x1="16" y1="2" x2="16" y2="6" />

                    <line x1="8" y1="2" x2="8" y2="6" />

                    <line x1="3" y1="10" x2="21" y2="10" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    DATE OF BIRTH

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: profile.dateOfBirth ? '#111827' : '#9ca3af', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {formatDobForDisplay(profile.dateOfBirth)}

                  </span>

                </div>

              </div>



              {/* Row 3: Gender & City */}

              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <circle cx="12" cy="12" r="9" />

                    <path d="M12 7v10" />

                    <path d="M8 12h8" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    GENDER

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: profile.gender ? '#111827' : '#9ca3af', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {profile.gender || '—'}

                  </span>

                </div>

              </div>



              <div className="profile-field-item" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>

                <span className="profile-field-icon" style={{ color: '#6b7280', marginTop: '2px', display: 'flex' }}>

                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />

                    <circle cx="12" cy="10" r="3" />

                  </svg>

                </span>

                <div style={{ flex: 1, minWidth: 0 }}>

                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#9ca3af', letterSpacing: '0.5px' }}>

                    CITY

                  </span>

                  <span style={{ fontSize: '15px', fontWeight: '700', color: profile.city ? '#111827' : '#9ca3af', marginTop: '2px', display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>

                    {profile.city || '—'}

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
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          }}
          className="profile-bottom-grid"
        >

          {/* Card 1: Appointment History */}

          <div

            className="profile-section-card profile-appointments-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
              border: '1px solid #edf2ee',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}

          >

            {/* Header with Filter */}

            <div

              className="profile-card-header"

              style={{

                display: 'flex',

                alignItems: 'flex-start',

                justifyContent: 'space-between',

                marginBottom: '22px',

              }}

            >

              <div className="profile-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

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
                className="profile-filter-select"
                value={appointmentFilter}
                onChange={(e) => {
                  setAppointmentFilter(e.target.value);
                  setAptCurrentPage(1);
                }}

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

              {isLoading && appointments.length === 0 ? (

                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>

                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>

                    Loading appointments...

                  </p>

                </div>

              ) : appointments.length === 0 ? (

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

              ) : (() => {

                const filtered = appointments.filter((item) => {

                  if (appointmentFilter === 'All') return true;

                  if (appointmentFilter === 'Upcoming') return item.status === 'Confirmed' || item.status === 'Pending';

                  if (appointmentFilter === 'Completed') return item.status === 'Completed' || item.status === 'Complete';

                  return true;

                });



                if (filtered.length === 0) {

                  return (

                    <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>

                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>

                        No {appointmentFilter.toLowerCase()} appointments found.

                      </p>

                    </div>

                  );

                }



                const totalPages = Math.max(1, Math.ceil(filtered.length / aptPageSize));
                const safeCurrentPage = Math.min(Math.max(1, aptCurrentPage), totalPages);
                const startIndex = (safeCurrentPage - 1) * aptPageSize;
                const paginatedAppointments = filtered.slice(startIndex, startIndex + aptPageSize);

                return (
                  <>
                    {paginatedAppointments.map((item) => (

                <div

                  key={item.id}

                  onClick={() => handleOpenAppointmentModal(item)}

                  className="profile-appointment-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0,
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

                  <div className="profile-appointment-left" style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>

                    {/* Date Badge */}

                    <div

                      className="profile-date-badge"

                      style={{

                        width: '56px',

                        height: '56px',

                        minWidth: '56px',

                        borderRadius: '12px',

                        backgroundColor: '#edf5ee',

                        border: '1px solid #d8e8dc',

                        display: 'flex',

                        flexDirection: 'column',

                        alignItems: 'center',

                        justifyContent: 'center',

                        flexShrink: 0,

                        padding: '3px 2px',

                        boxSizing: 'border-box',

                        textAlign: 'center',

                      }}

                    >

                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#1b4332', lineHeight: '1', fontFamily: "'Manrope', sans-serif", textAlign: 'center', display: 'block' }}>

                        {item.day}

                      </span>

                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#2e7d32', letterSpacing: '0.4px', lineHeight: '1.1', marginTop: '2px', fontFamily: "'Manrope', sans-serif", textAlign: 'center', display: 'block' }}>

                        {item.monthShort || item.month}

                      </span>

                      {item.year && (

                        <span style={{ fontSize: '9px', fontWeight: '600', color: '#6b7280', lineHeight: '1', marginTop: '2px', fontFamily: "'Manrope', sans-serif", textAlign: 'center', display: 'block' }}>

                          {item.year}

                        </span>

                      )}

                    </div>



                    {/* Consultation Meta */}

                    <div className="profile-appointment-meta" style={{ flex: 1, minWidth: 0 }}>

                      <h4 className="profile-appointment-title" style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

                        {item.title}

                      </h4>

                      <p className="profile-appointment-doctor" style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>

                        {item.doctor}

                      </p>

                      <p className="profile-appointment-time" style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>

                        {item.time}

                      </p>

                    </div>

                  </div>



                  {/* Right Status & Arrow */}

                  <div className="profile-appointment-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>

                    <span

                      className="profile-status-badge"

                      style={{

                        backgroundColor: item.status === 'Rescheduled' ? '#eff6ff' : item.status === 'Cancelled' ? '#fef2f2' : '#dcfce7',

                        color: item.status === 'Rescheduled' ? '#1d4ed8' : item.status === 'Cancelled' ? '#b91c1c' : '#166534',

                        border: item.status === 'Rescheduled' ? '1px solid #bfdbfe' : item.status === 'Cancelled' ? '1px solid #fecaca' : 'none',

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

              {renderPagination({
                currentPage: safeCurrentPage,
                totalPages: totalPages,
                pageSize: aptPageSize,
                onPageChange: (p) => setAptCurrentPage(p),
                onPageSizeChange: (s) => {
                  setAptPageSize(s);
                  setAptCurrentPage(1);
                },
              })}
            </>
          );
        })()}

            </div>

          </div>



          {/* Card 2: Prescriptions */}

          <div

            className="profile-section-card profile-prescriptions-card"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.03)',
              border: '1px solid #edf2ee',
              width: '100%',
              maxWidth: '100%',
              minWidth: 0,
              boxSizing: 'border-box',
            }}

          >

            {/* Header with Filter */}

            <div

              className="profile-card-header"

              style={{

                display: 'flex',

                alignItems: 'flex-start',

                justifyContent: 'space-between',

                marginBottom: '22px',

              }}

            >

              <div className="profile-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

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
                className="profile-filter-select"
                value={prescriptionFilter}
                onChange={(e) => {
                  setPrescriptionFilter(e.target.value);
                  setRxCurrentPage(1);
                }}

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

                <option value="Recent">Recent Prescriptions</option>

              </select>

            </div>



            {/* Prescriptions List */}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {(() => {

                if (isLoading && prescriptions.length === 0) {

                  return (

                    <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>

                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>

                        Loading prescriptions...

                      </p>

                    </div>

                  );

                }



                if (prescriptions.length === 0) {

                  return (

                    <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>

                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>

                        No prescriptions issued yet. Once your doctor creates a prescription, it will appear here permanently.

                      </p>

                    </div>

                  );

                }



                const filteredPrescriptions = prescriptions.filter((item, index) => {

                  if (prescriptionFilter === 'All') return true;

                  if (prescriptionFilter === 'Recent') {

                    // Only show recently created prescriptions, not the full history

                    if (index === 0) return true;

                    if (item.created_at && prescriptions[0]?.created_at) {

                      const diffMs = Math.abs(new Date(prescriptions[0].created_at) - new Date(item.created_at));

                      return diffMs < 12 * 60 * 60 * 1000;

                    }

                    return false;

                  }

                  return true;

                });



                if (filteredPrescriptions.length === 0) {

                  return (

                    <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748b' }}>

                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>

                        No recent prescriptions found.

                      </p>

                    </div>

                  );

                }



                const totalPages = Math.max(1, Math.ceil(filteredPrescriptions.length / rxPageSize));
                const safeCurrentPage = Math.min(Math.max(1, rxCurrentPage), totalPages);
                const startIndex = (safeCurrentPage - 1) * rxPageSize;
                const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, startIndex + rxPageSize);

                return (
                  <>
                    {paginatedPrescriptions.map((item) => (

                <div

                  key={item.id}

                  onClick={() => handleViewPrescription(item)}

                  title="Click to view full prescription"

                  className="profile-prescription-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    boxSizing: 'border-box',
                    minWidth: 0,
                  }}

                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}

                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}

                >

                  <div className="profile-prescription-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>

                    <div

                      className="profile-rx-icon"

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

                    <div className="profile-prescription-meta" style={{ flex: 1, minWidth: 0 }}>

                      <h4 className="profile-prescription-title" style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif", overflowWrap: 'anywhere', wordBreak: 'break-word' }}>

                        {item.title}

                      </h4>

                      <p className="profile-prescription-date" style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0 0', fontFamily: "'Manrope', sans-serif" }}>

                        {item.date}

                      </p>

                    </div>

                  </div>



                  {/* Download Button */}

                  <button

                    type="button"

                    className="profile-download-btn"

                    disabled={downloadingRxId === (item.id || item.rxId)}

                    onClick={(e) => {

                      e.stopPropagation();

                      handleDownloadPrescription(item);

                    }}

                    title="Download prescription PDF"

                    style={{

                      backgroundColor: '#dcfce7',

                      color: '#166534',

                      border: 'none',

                      borderRadius: '8px',

                      padding: '7px 14px',

                      fontSize: '12px',

                      fontWeight: '700',

                      cursor: downloadingRxId === (item.id || item.rxId) ? 'not-allowed' : 'pointer',

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '6px',

                      flexShrink: 0,

                      marginLeft: '8px',

                      transition: 'all 0.15s ease',

                      fontFamily: "'Manrope', sans-serif",

                    }}

                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#bbf7d0')}

                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}

                  >

                    {downloadingRxId === (item.id || item.rxId) ? (

                      <>

                        <div

                          style={{

                            width: '12px',

                            height: '12px',

                            border: '2px solid rgba(22, 101, 52, 0.3)',

                            borderTopColor: '#166534',

                            borderRadius: '50%',

                            animation: 'spin 0.8s linear infinite',

                          }}

                        />

                        <span>Downloading...</span>

                      </>

                    ) : (

                      <>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">

                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />

                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            ))}

            {renderPagination({
              currentPage: safeCurrentPage,
              totalPages: totalPages,
              pageSize: rxPageSize,
              onPageChange: (p) => setRxCurrentPage(p),
              onPageSizeChange: (s) => {
                setRxPageSize(s);
                setRxCurrentPage(1);
              },
            })}
          </>
        );
      })()}

            </div>

          </div>

        </div>

      </div>



      {/* ================= APPOINTMENT DETAILS MODAL (EXACT MATCHING UI) ================= */}

      <dialog
        ref={appointmentDialogRef}
        onClick={(e) => handleDialogBackdropClick(e, handleCloseAppointmentModal, appointmentDialogRef)}
        aria-labelledby="appointment-details-title"
        className="profile-appointment-dialog"
        style={{
          borderRadius: '20px',
          border: 'none',
          padding: 0,
          maxWidth: '620px',
          width: '92%',
          maxHeight: '90vh',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#ffffff',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {selectedAppointment && (
          <div className="profile-modal-inner" style={{ padding: '32px 36px 30px' }}>
            {/* Header Row: Title on Left, Status Badge & Close button on Right */}
            <div
              className="profile-modal-header"
              style={{
                display: 'flex',

                alignItems: 'center',

                justifyContent: 'space-between',

                marginBottom: '24px',

              }}

            >

              <h3
                id="appointment-details-title"
                className="profile-modal-title"
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
                  className="profile-modal-status-badge"
                  style={{
                    backgroundColor: selectedAppointment.status === 'Rescheduled' ? '#eff6ff' : selectedAppointment.status === 'Cancelled' ? '#fef2f2' : '#dcfce7',
                    color: selectedAppointment.status === 'Rescheduled' ? '#1d4ed8' : selectedAppointment.status === 'Cancelled' ? '#b91c1c' : '#15803d',
                    border: selectedAppointment.status === 'Rescheduled' ? '1px solid #bfdbfe' : selectedAppointment.status === 'Cancelled' ? '1px solid #fecaca' : 'none',
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
                  className="profile-modal-close-x"
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
              className="profile-modal-box profile-modal-details-box"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #edf2ee',
                borderRadius: '16px',
                padding: '22px 24px',
                marginBottom: '16px',
              }}
            >
              <div
                className="profile-modal-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  rowGap: '20px',
                  columnGap: '24px',
                }}
              >
                {/* Row 1: Type & ID */}
                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Appointment Type
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.type}
                    </strong>
                  </div>
                </div>

                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Appointment ID
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.appointmentId}
                    </strong>
                  </div>
                </div>

                {/* Row 2: Date & Time */}
                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Date
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.fullDate}
                    </strong>
                  </div>
                </div>

                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Time
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.time}
                    </strong>
                  </div>
                </div>

                {/* Row 3: Doctor & Status */}
                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Doctor
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif" }}>
                      {selectedAppointment.doctor}
                    </strong>
                  </div>
                </div>

                <div className="profile-modal-grid-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div className="profile-modal-grid-content">
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Consultation Status
                    </span>
                    <strong
                      className="profile-modal-grid-value"
                      style={{
                        fontSize: '13.5px',
                        color: selectedAppointment.status === 'Rescheduled' ? '#1d4ed8' : selectedAppointment.status === 'Cancelled' ? '#b91c1c' : '#16a34a',
                        display: 'block',
                        marginTop: '1px',
                        fontFamily: "'Manrope', sans-serif",
                      }}
                    >
                      {selectedAppointment.status}
                    </strong>
                  </div>
                </div>

                {/* Row 4: Reason for Visit */}
                <div className="profile-modal-reason-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', gridColumn: 'span 2', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                  <div
                    className="profile-modal-grid-icon"
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="profile-modal-grid-label" style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#6b7280', fontFamily: "'Manrope', sans-serif" }}>
                      Reason for Visit
                    </span>
                    <strong className="profile-modal-grid-value" style={{ fontSize: '13.5px', color: '#111827', display: 'block', marginTop: '1px', fontFamily: "'Manrope', sans-serif", wordBreak: 'break-word' }}>
                      {selectedAppointment.reason || selectedAppointment.title || 'Consultation'}
                    </strong>
                  </div>
                </div>

              </div>

            </div>



            {/* Box 2: Consultation Summary / Appointment Notice */}

            <div
              className="profile-modal-box profile-modal-summary-box"
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
                className="profile-modal-summary-icon"
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

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 className="profile-modal-summary-title" style={{ fontSize: '14px', fontWeight: '800', color: '#111827', margin: '0 0 3px 0', fontFamily: "'Manrope', sans-serif" }}>
                  {(selectedAppointment.status === 'Completed' || selectedAppointment.status === 'Complete')
                    ? 'Consultation Summary'
                    : 'Appointment Details'}
                </h4>
                <p className="profile-modal-summary-text" style={{ fontSize: '12.5px', color: '#6b7280', margin: 0, lineHeight: '1.5', fontFamily: "'Manrope', sans-serif" }}>
                  {(selectedAppointment.status === 'Completed' || selectedAppointment.status === 'Complete')
                    ? 'Your consultation was completed. Review the visit information and any documents shared by your doctor.'
                    : `Your appointment is confirmed for ${selectedAppointment.fullDate} at ${selectedAppointment.time}. Please arrive 10 minutes prior to your consultation.`}
                </p>
              </div>

            </div>



            {/* Box 3: Attached Documents - Appointment Confirmation Receipt PDF */}
            {selectedAppointment && (
            <div className="profile-modal-docs-section">
              <div className="profile-modal-docs-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <h4 style={{ fontSize: '13.5px', fontWeight: '800', color: '#111827', margin: 0, fontFamily: "'Manrope', sans-serif" }}>
                  Attached Documents
                </h4>
              </div>

              {/* Document Item Box */}
              <div
                className="profile-modal-doc-box"
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
                <div className="profile-modal-doc-left" style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 auto' }}>
                  {/* Red PDF Badge */}
                  <span
                    className="profile-modal-doc-badge"
                    style={{
                      backgroundColor: '#fef2f2',
                      color: '#ef4444',
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      letterSpacing: '0.5px',
                      fontFamily: "'Manrope', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    PDF
                  </span>
                  <div className="profile-modal-doc-info" style={{ minWidth: 0, flex: 1 }}>
                    <strong className="profile-modal-doc-name" style={{ fontSize: '13.5px', color: '#111827', display: 'block', fontFamily: "'Manrope', sans-serif", wordBreak: 'break-all' }}>
                      {selectedAppointment.pdfName || `Appointment_${selectedAppointment.appointmentId || selectedAppointment.id}.pdf`}
                    </strong>
                    <span className="profile-modal-doc-date" style={{ fontSize: '11.5px', color: '#9ca3af', fontFamily: "'Manrope', sans-serif", display: 'block' }}>
                      PDF • {selectedAppointment.fullDate || selectedAppointment.pdfDate || selectedAppointment.date}
                    </span>
                  </div>
                </div>

                {/* Right Button: Download only */}
                <div className="profile-modal-doc-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={downloadingAppointmentPdf}
                    onClick={() => handleDownloadAppointmentPdf(selectedAppointment)}
                    className="profile-modal-doc-btn"
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
            )}

            {/* Modal Bottom Action Bar: Close & Reschedule Appointment */}
            <div
              className="profile-modal-actions"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '22px',
                paddingTop: '18px',
                borderTop: '1px solid #edf2ee',
              }}
            >
              <button
                type="button"
                onClick={handleCloseAppointmentModal}
                className="profile-modal-btn-close"
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: "'Manrope', sans-serif",
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleRescheduleAppointment(selectedAppointment)}
                className="profile-modal-btn-reschedule"
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#1b4332',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(27, 67, 50, 0.2)',
                  fontFamily: "'Manrope', sans-serif",
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2d6a4f')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
                Reschedule Appointment
              </button>
            </div>
          </div>

        )}

      </dialog>



      {/* Edit Profile Dialog Modal */}
      <dialog
        ref={editDialogRef}
        onClick={(e) => handleDialogBackdropClick(e, handleCloseEdit, editDialogRef)}
        aria-labelledby="edit-profile-title"
        className="profile-edit-dialog"
        style={{
          borderRadius: '18px',
          border: 'none',
          padding: 0,
          maxWidth: '480px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          margin: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          backgroundColor: '#ffffff',
        }}
      >

        <div className="profile-edit-modal-inner" style={{ padding: '28px 24px' }}>

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



            <div className="profile-edit-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

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

                  value={editFormData.gender || ''}

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

                  <option value="">Select Gender</option>

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



            <div className="profile-edit-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>

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



      {/* Prescription View Modal for Patient Portal */}

      <ViewPrescriptionModal

        isOpen={viewPrescriptionModalOpen}

        onClose={() => {

          setViewPrescriptionModalOpen(false);

          setSelectedPrescription(null);

        }}

        prescription={selectedPrescription}

      />

      {/* Appointment PDF Preview Modal */}
      {appointmentPdfModalOpen && appointmentPdfUrl && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAppointmentPdfModalOpen(false);
            }
          }}
        >
          <div
            className="profile-pdf-modal-inner"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '960px',
              height: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="profile-pdf-modal-header"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '15px',
                      fontWeight: '700',
                      color: '#111827',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {appointmentPdfFilename || 'Appointment Document'}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Official Consultation & Prescription Document
                  </span>
                </div>
              </div>

              <div className="profile-pdf-modal-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => window.open(appointmentPdfUrl, '_blank')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    backgroundColor: '#ffffff',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Open in New Tab
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadAppointmentPdf(selectedAppointment)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#166534',
                    backgroundColor: '#dcfce7',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>

                <button
                  type="button"
                  onClick={() => setAppointmentPdfModalOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#6b7280',
                    cursor: 'pointer',
                    fontSize: '18px',
                  }}
                  aria-label="Close PDF Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Embedded PDF iframe */}
            <div style={{ flex: 1, backgroundColor: '#525659', position: 'relative' }}>
              <iframe
                src={`${appointmentPdfUrl}#toolbar=1`}
                title="Appointment PDF Viewer"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}



      {/* Offscreen printable prescription container */}

      <div

        style={{

          position: 'fixed',

          left: '-9999px',

          top: 0,

          width: '760px',

          zIndex: -1,

          pointerEvents: 'none',

          opacity: 0,

        }}

      >

        {downloadingRx && (

          <PrescriptionPreviewCard

            cardId="printable-prescription-card-patient"

            prescriptionId={downloadingRx.prescriptionId || downloadingRx.id || downloadingRx.rxId}

            patient={{

              name: downloadingRx.patientName || downloadingRx.name || profile.fullName,

              id: downloadingRx.patientId || profile.patientId || 'PAT-1001',

              ageGender: downloadingRx.ageGender || profile.gender || '30 / Adult',

              phone: downloadingRx.contact || downloadingRx.mobile || profile.mobileNumber,

            }}

            date={downloadingRx.date}

            consultationType={downloadingRx.complaint || downloadingRx.consultationType || 'Follow-up'}

            diagnosis={downloadingRx.diagnosis}

            medicines={downloadingRx.medicines}

            additionalInstructions={downloadingRx.additionalInstructions || downloadingRx.notes || ''}

          />

        )}

      </div>



      {/* Footer */}

      <footer

        className="profile-footer"

        style={{

          backgroundColor: '#ffffff',

          borderTop: '1px solid #edf2ee',

          padding: '24px 0',

          fontSize: '13px',

          color: '#6b7280',

          marginTop: 'auto',

          marginBottom: 0,

          width: '100%',

          flexShrink: 0,

        }}

      >

        <div

          className="profile-footer-inner"

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

          <p className="profile-footer-copyright" style={{ margin: 0 }}>

            © 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.

          </p>

          <div className="profile-footer-links" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>

            <a href="#privacy" className="profile-footer-link" style={{ color: '#6b7280', textDecoration: 'none' }}>Privacy Policy</a>

            <a href="#terms" className="profile-footer-link" style={{ color: '#6b7280', textDecoration: 'none' }}>Terms of Consultation</a>

            <a href="#support" className="profile-footer-link" style={{ color: '#6b7280', textDecoration: 'none' }}>Contact Support</a>

          </div>

        </div>

      </footer>



      <style>{`

        dialog::backdrop {

          background: rgba(15, 23, 42, 0.45);

          backdrop-filter: blur(4px);

        }

        .profile-page-wrapper {
          overflow-x: hidden;
          width: 100%;
          box-sizing: border-box;
        }

        .profile-container {
          box-sizing: border-box;
          width: 100%;
        }

        .profile-herbs-img {
          user-select: none;
          pointer-events: none;
        }

        /* ================= TABLET BREAKPOINT (<= 860px) ================= */
        @media (max-width: 860px) {

          .profile-header-card {

            padding: 22px 28px !important;

          }

          .profile-herbs-img {

            height: 125px !important;

            max-width: 420px !important;

          }

          .profile-personal-card {
            padding: 24px 24px !important;
          }

          .profile-personal-grid {

            grid-template-columns: 1fr !important;

            gap: 22px !important;

            justify-items: center;

          }

          .profile-avatar-wrapper {
            margin: 0 auto !important;
          }

          .profile-fields-grid {

            width: 100% !important;

            grid-template-columns: 1fr 1fr !important;

            column-gap: 20px !important;

            row-gap: 14px !important;

            text-align: left !important;

          }

          .profile-field-item {
            background-color: #fbfdfc;
            border: 1px solid #edf4ef;
            border-radius: 12px;
            padding: 12px 14px;
            box-sizing: border-box;
          }

          .profile-bottom-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 20px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .profile-section-card {
            padding: 22px 20px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }

        }

        /* ================= MOBILE BREAKPOINT (<= 640px) ================= */
        @media (max-width: 640px) {

          .profile-container {

            padding: 18px 14px 44px !important;

          }

          .profile-header-card {

            flex-direction: column !important;

            align-items: flex-start !important;

            gap: 14px !important;

            padding: 18px 16px !important;

            border-radius: 18px !important;

            margin-bottom: 18px !important;

          }

          .profile-header-title {
            font-size: 26px !important;
            margin-bottom: 8px !important;
          }

          .profile-header-desc {
            font-size: 13.5px !important;
            line-height: 1.55 !important;
          }

          .profile-herbs-wrapper {

            align-self: center !important;

            margin-top: 4px !important;

            margin-right: 0 !important;

          }

          .profile-herbs-img {

            height: 85px !important;

            max-width: 250px !important;

          }

          .profile-personal-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
            margin-bottom: 18px !important;
          }

          .profile-personal-card-header {
            display: flex !important;
            align-items: flex-start !important;
            justify-content: space-between !important;
            gap: 10px !important;
            margin-bottom: 18px !important;
          }

          .profile-personal-card-header h2 {
            font-size: 17px !important;
          }

          .profile-personal-card-header p {
            font-size: 12px !important;
            line-height: 1.4 !important;
          }

          .profile-edit-btn {
            padding: 7px 12px !important;
            font-size: 12px !important;
            flex-shrink: 0 !important;
            white-space: nowrap !important;
          }

          .profile-fields-grid {
            grid-template-columns: 1fr !important;
            row-gap: 10px !important;
            column-gap: 0 !important;
          }

          .profile-field-item {
            padding: 10px 12px !important;
            border-radius: 10px !important;
          }

          .profile-bottom-grid {
            display: grid !important;
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 18px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .profile-section-card,
          .profile-appointments-card,
          .profile-prescriptions-card {
            padding: 18px 14px !important;
            border-radius: 16px !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }

          .profile-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .profile-card-header-left {
            width: 100% !important;
            min-width: 0 !important;
          }

          .profile-filter-select {
            align-self: flex-start !important;
            width: auto !important;
            font-size: 11.5px !important;
            padding: 5px 10px !important;
          }

          .profile-appointment-item,
          .profile-prescription-item {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
            padding: 10px 8px !important;
            gap: 8px !important;
          }

          .profile-appointment-left,
          .profile-prescription-left {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex: 1 1 0% !important;
            min-width: 0 !important;
            max-width: calc(100% - 90px) !important;
            overflow: hidden !important;
          }

          .profile-date-badge {
            width: 46px !important;
            height: 46px !important;
            min-width: 46px !important;
            border-radius: 10px !important;
            padding: 2px !important;
            flex-shrink: 0 !important;
          }

          .profile-date-badge span:first-child {
            font-size: 13.5px !important;
          }

          .profile-rx-icon {
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            border-radius: 8px !important;
            flex-shrink: 0 !important;
          }

          .profile-appointment-meta,
          .profile-prescription-meta {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            max-width: 100% !important;
            overflow: hidden !important;
          }

          .profile-appointment-title,
          .profile-appointment-doctor,
          .profile-prescription-title {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }

          .profile-appointment-title {
            font-size: 13.5px !important;
            word-break: break-all !important;
          }

          .profile-appointment-doctor {
            font-size: 11.5px !important;
          }

          .profile-appointment-time {
            font-size: 10.5px !important;
          }

          .profile-prescription-title {
            font-size: 13px !important;
            word-break: break-all !important;
          }

          .profile-prescription-date {
            font-size: 11px !important;
          }

          .profile-appointment-right {
            display: flex !important;
            align-items: center !important;
            gap: 5px !important;
            flex-shrink: 0 !important;
            margin-left: 6px !important;
          }

          .profile-status-badge {
            font-size: 10.5px !important;
            padding: 3px 7px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }

          .profile-download-btn {
            padding: 6px 9px !important;
            font-size: 11px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            margin-left: 6px !important;
            gap: 4px !important;
          }

          .profile-pagination {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-wrap: wrap !important;
            gap: 4px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }

          .profile-pagination button {
            width: 30px !important;
            height: 30px !important;
            min-width: 30px !important;
            font-size: 12px !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }

          .profile-page-size-wrap {
            margin-left: 4px !important;
          }

          .profile-page-size-wrap select {
            height: 30px !important;
            font-size: 11.5px !important;
            padding: 0 22px 0 8px !important;
            box-sizing: border-box !important;
          }

          /* Modals & Dialogs Responsive */
          .profile-appointment-dialog {
            width: 92% !important;
            max-width: 92% !important;
            max-height: 88vh !important;
            border-radius: 16px !important;
            margin: auto !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            overscroll-behavior: contain !important;
            box-sizing: border-box !important;
          }

          .profile-modal-inner {
            padding: 16px 14px 16px !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
          }

          .profile-modal-header {
            margin-bottom: 12px !important;
          }

          .profile-modal-title {
            font-size: 17px !important;
          }

          .profile-modal-status-badge {
            font-size: 11px !important;
            padding: 3px 10px !important;
          }

          .profile-modal-box {
            padding: 12px 10px !important;
            border-radius: 12px !important;
            margin-bottom: 10px !important;
            box-sizing: border-box !important;
          }

          .profile-modal-grid {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            column-gap: 8px !important;
            row-gap: 10px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }

          .profile-modal-grid-item {
            gap: 8px !important;
            min-width: 0 !important;
          }

          .profile-modal-grid-icon {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-radius: 6px !important;
          }

          .profile-modal-grid-icon svg {
            width: 14px !important;
            height: 14px !important;
          }

          .profile-modal-grid-content {
            min-width: 0 !important;
            flex: 1 1 0% !important;
            overflow: hidden !important;
          }

          .profile-modal-grid-label {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }

          .profile-modal-grid-value {
            font-size: 12px !important;
            word-break: break-word !important;
            line-height: 1.25 !important;
          }

          .profile-modal-reason-row {
            padding-top: 10px !important;
            gap: 8px !important;
          }

          .profile-modal-summary-box {
            padding: 11px 10px !important;
            margin-bottom: 10px !important;
            gap: 8px !important;
          }

          .profile-modal-summary-icon {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-radius: 6px !important;
          }

          .profile-modal-summary-icon svg {
            width: 14px !important;
            height: 14px !important;
          }

          .profile-modal-summary-title {
            font-size: 12.5px !important;
            margin-bottom: 2px !important;
          }

          .profile-modal-summary-text {
            font-size: 11px !important;
            line-height: 1.4 !important;
          }

          .profile-modal-docs-header {
            margin-bottom: 8px !important;
          }

          .profile-modal-docs-header h4 {
            font-size: 12.5px !important;
          }

          .profile-modal-doc-box {
            padding: 10px 10px !important;
            border-radius: 12px !important;
            gap: 8px !important;
            box-sizing: border-box !important;
          }

          .profile-modal-doc-left {
            gap: 8px !important;
            min-width: 0 !important;
            flex: 1 1 auto !important;
          }

          .profile-modal-doc-badge {
            font-size: 10px !important;
            padding: 4px 7px !important;
          }

          .profile-modal-doc-name {
            font-size: 12px !important;
            line-height: 1.25 !important;
          }

          .profile-modal-doc-date {
            font-size: 10.5px !important;
          }

          .profile-modal-doc-btn {
            padding: 6px 12px !important;
            font-size: 11.5px !important;
            border-radius: 7px !important;
            white-space: nowrap !important;
          }

          .profile-modal-actions {
            flex-direction: column-reverse !important;
            gap: 8px !important;
            margin-top: 14px !important;
            padding-top: 12px !important;
            width: 100% !important;
          }

          .profile-modal-btn-close,
          .profile-modal-btn-reschedule {
            width: 100% !important;
            justify-content: center !important;
            min-height: 40px !important;
            padding: 9px 14px !important;
            font-size: 13px !important;
            box-sizing: border-box !important;
          }

          .profile-edit-dialog {
            width: 92% !important;
            max-width: 92% !important;
            max-height: 88vh !important;
            border-radius: 16px !important;
            margin: auto !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            box-sizing: border-box !important;
          }

          .profile-edit-modal-inner {
            padding: 18px 14px !important;
            box-sizing: border-box !important;
          }

          .profile-edit-grid {
            grid-template-columns: 1fr !important;
          }

          .profile-edit-actions {
            flex-direction: column-reverse !important;
            gap: 8px !important;
          }

          .profile-edit-actions button {
            width: 100% !important;
            justify-content: center !important;
          }

          .profile-pdf-modal-inner {
            height: 94vh !important;
          }

          .profile-pdf-modal-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
            padding: 12px 14px !important;
          }

          .profile-pdf-modal-actions {
            width: 100% !important;
            justify-content: flex-end !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          /* Footer */
          .profile-footer {

            padding: 22px 0 20px !important;

          }

          .profile-footer-inner {

            padding: 0 16px !important;

            flex-direction: column !important;

            align-items: center !important;

            text-align: center !important;

            gap: 14px !important;

          }

          .profile-footer-links {

            display: flex !important;

            justify-content: center !important;

            align-items: center !important;

            flex-wrap: wrap !important;

            gap: 10px 18px !important;

            order: 1 !important;

          }

          .profile-footer-link {

            font-size: 13px !important;

            font-weight: 600 !important;

            color: #475569 !important;

          }

          .profile-footer-copyright {

            font-size: 12px !important;

            color: #94a3b8 !important;

            text-align: center !important;

            line-height: 1.55 !important;

            order: 2 !important;

            max-width: 320px !important;

          }

        }

        /* ================= EXTRA SMALL SCREENS (<= 380px) ================= */
        @media (max-width: 380px) {

          .profile-container {
            padding: 14px 10px 36px !important;
          }

          .profile-header-card {
            padding: 16px 12px !important;
          }

          .profile-personal-card,
          .profile-section-card {
            padding: 14px 10px !important;
          }

          .profile-personal-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }

          .profile-appointment-item,
          .profile-prescription-item {
            padding: 8px 6px !important;
            gap: 6px !important;
          }

          .profile-appointment-left,
          .profile-prescription-left {
            gap: 8px !important;
            max-width: calc(100% - 80px) !important;
          }

          .profile-date-badge {
            width: 42px !important;
            height: 42px !important;
            min-width: 42px !important;
            border-radius: 8px !important;
          }

          .profile-date-badge span:first-child {
            font-size: 12.5px !important;
          }

          .profile-date-badge span:nth-child(2) {
            font-size: 9px !important;
          }

          .profile-rx-icon {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
          }

          .profile-appointment-title {
            font-size: 12.5px !important;
          }

          .profile-status-badge {
            font-size: 10px !important;
            padding: 2px 6px !important;
          }

          .profile-download-btn {
            padding: 5px 7px !important;
            font-size: 10.5px !important;
          }

          .profile-download-btn svg {
            width: 12px !important;
            height: 12px !important;
          }

          .profile-pagination button {
            width: 27px !important;
            height: 27px !important;
            min-width: 27px !important;
            font-size: 11px !important;
          }

          .profile-page-size-wrap select {
            height: 27px !important;
            font-size: 10.5px !important;
            padding: 0 18px 0 6px !important;
          }

          /* Modal tweaks for <= 380px */
          .profile-appointment-dialog,
          .profile-edit-dialog {
            width: 95% !important;
            max-width: 95% !important;
            max-height: 88vh !important;
          }

          .profile-modal-inner {
            padding: 14px 10px 14px !important;
          }

          .profile-modal-grid {
            column-gap: 6px !important;
            row-gap: 8px !important;
          }

          .profile-modal-grid-label {
            font-size: 9.5px !important;
          }

          .profile-modal-grid-value {
            font-size: 11.5px !important;
          }

          .profile-modal-doc-box {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }

          .profile-modal-doc-right {
            width: 100% !important;
          }

          .profile-modal-doc-btn {
            width: 100% !important;
            justify-content: center !important;
          }

        }

      `}</style>

    </div>

  );

};



export default ProfilePage;


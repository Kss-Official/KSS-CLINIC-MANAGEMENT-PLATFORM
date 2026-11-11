import React, { useState, useEffect, useRef } from 'react';
import appointmentApi from '../../api/appointmentApi';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';
import { getEffectiveImageUrl } from '../../utils/imageUrl';

// Validation and formatting helper utilities for Settings form
const extract10Digits = (phoneStr) => {
  if (!phoneStr) return '';
  let digits = String(phoneStr).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

const formatWithCountryCode = (digits) => {
  if (!digits) return '';
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  return `+91 ${digits}`;
};

const validateClinicName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return 'Clinic Name is required.';
  }
  if (name.length > 35) {
    return 'Clinic Name must not exceed 35 characters.';
  }
  return '';
};

const validateDoctorName = (name) => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return 'Doctor Name is required.';
  }
  if (!/^[A-Za-z\s.()]+$/.test(name)) {
    return 'Doctor Name can only contain letters, spaces, dots (.), and parentheses ( ).';
  }
  if (name.length > 35) {
    return 'Doctor Name must not exceed 35 characters.';
  }
  return '';
};

const validateEmail = (email) => {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return 'Email address is required.';
  }
  // Once the user enters .com, no additional characters should be allowed.
  const comIndex = trimmed.indexOf('.com');
  if (comIndex !== -1 && comIndex + 4 < trimmed.length) {
    return 'No characters are allowed after .com in the email address.';
  }
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return 'Please enter a valid email address.';
  }
  return '';
};

const validateMobileNumber = (digits, isRequired = true) => {
  if (!digits) {
    return isRequired ? 'Contact number is required.' : '';
  }
  if (!/^\d+$/.test(digits)) {
    return 'Mobile number must contain only digits.';
  }
  if (!['6', '7', '8', '9'].includes(digits[0])) {
    return 'Mobile number must start with 6, 7, 8, or 9.';
  }
  if (digits.length !== 10) {
    return 'Mobile number must be exactly 10 digits.';
  }
  return '';
};

const SettingsPage = () => {
  // 1. Clinic Information State (Initializes from saved localStorage or default)
  const [clinicInfo, setClinicInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_info_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      clinicName: 'HOMEOPATHY CLINIC',
      doctorName: 'Dr. Kumar Tripathi Ampeh (Pat.)',
      contactNumber: '+91 98765 43210',
      alternateNumber: '+91 99887 66554',
      email: 'clinic.tripathi@gmail.com',
      address: '12, Green Park, Bangalore',
    };
  });

  // Clinic Profile Image State & Dropdown
  const [clinicProfileImage, setClinicProfileImage] = useState(() => {
    const saved = localStorage.getItem('clinic_profile_image');
    const effective = saved ? getEffectiveImageUrl(saved) : null;
    if (saved && !effective) {
      try { localStorage.removeItem('clinic_profile_image'); } catch {}
    }
    return effective;
  });
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const fileInputRef = useRef(null);
  const uploadDropdownRef = useRef(null);

  // Fetch clinic settings from backend on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await appointmentApi.getClinicSettings();
        if (data) {
          if (data.clinicName || data.doctorName) {
            setClinicInfo(data);
            try {
              localStorage.setItem('clinic_info_settings', JSON.stringify(data));
            } catch {}
          }
          const rawImg = data.profile_image_url || data.profileImageUrl || null;
          const imgUrl = rawImg ? getEffectiveImageUrl(rawImg) : null;
          if (imgUrl) {
            setClinicProfileImage(imgUrl);
            setAvatarImgError(false);
            localStorage.setItem('clinic_profile_image', imgUrl);
            window.dispatchEvent(
              new CustomEvent('clinic-profile-image-updated', {
                detail: { profile_image_url: imgUrl },
              })
            );
          } else {
            const localSaved = localStorage.getItem('clinic_profile_image');
            const effectiveLocal = localSaved ? getEffectiveImageUrl(localSaved) : null;
            if (effectiveLocal) {
              setClinicProfileImage(effectiveLocal);
              setAvatarImgError(false);
            } else {
              setClinicProfileImage(null);
              localStorage.removeItem('clinic_profile_image');
            }
          }

          const days = data.workingDays || data.working_days;
          if (Array.isArray(days) && days.length > 0) {
            setWorkingDays(days);
            setDraftWorkingDays([...days]);
            try {
              localStorage.setItem('clinic_appointment_settings', JSON.stringify({
                workingDays: days,
                consultationHours: data.consultationHours || data.consultation_hours || '09:00 AM - 06:00 PM',
                slotDuration: data.slotDuration || data.slot_duration || '30 Minutes',
              }));
            } catch {}
          }
          if (data.consultationHours || data.consultation_hours) {
            setConsultationHours(data.consultationHours || data.consultation_hours);
          }
          if (data.slotDuration || data.slot_duration) {
            setSlotDuration(data.slotDuration || data.slot_duration);
          }
          const rawRestrictions = data.dateRestrictions || data.date_restrictions || [];
          if (Array.isArray(rawRestrictions)) {
            const loadedRestrictions = rawRestrictions.map((r, i) => ({
              ...r,
              id: r.id || `restr_${i}_${Date.now()}`
            }));
            setDateRestrictions(loadedRestrictions);
          }
          const rawCustomHours = data.customWorkingHours || data.custom_working_hours || [];
          if (Array.isArray(rawCustomHours)) {
            const loadedCustomHours = rawCustomHours.map((c, i) => ({
              ...c,
              id: c.id || `cwh_${i}_${Date.now()}`
            }));
            setCustomWorkingHours(loadedCustomHours);
          }
          if (data.notifications && typeof data.notifications === 'object') {
            setNotifications(data.notifications);
            setDraftNotifications(data.notifications);
            try {
              localStorage.setItem('clinic_notification_settings', JSON.stringify(data.notifications));
            } catch {}
          }
          if (data.notificationChannels && typeof data.notificationChannels === 'object') {
            setNotificationChannels(data.notificationChannels);
            setDraftChannels(data.notificationChannels);
          }
        }
      } catch (err) {
        // Fall back gracefully to localStorage or defaults
        console.log('Loading local clinic settings...');
      }
    };
    fetchSettings();
  }, []);

  // Listen to clinic-profile-image-updated events and outside clicks
  useEffect(() => {
    const handleClinicImageUpdated = (e) => {
      const newImg = e?.detail?.profile_image_url ? getEffectiveImageUrl(e.detail.profile_image_url) : null;
      setClinicProfileImage(newImg);
      setAvatarImgError(false);
    };
    window.addEventListener('clinic-profile-image-updated', handleClinicImageUpdated);

    const handleClickOutside = (e) => {
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(e.target)) {
        setUploadDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('clinic-profile-image-updated', handleClinicImageUpdated);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handlers for Clinic Profile Image Upload & Removal
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check MIME type and file extension to support all desktop and mobile formats
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/pjpeg', 'image/x-png', 'image/bmp'];
    const hasValidExt = /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name || '');
    if (!validTypes.includes(file.type) && !hasValidExt) {
      showToast('Please upload a valid image file (JPG, PNG, WEBP, GIF).');
      if (e.target) e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.');
      if (e.target) e.target.value = '';
      return;
    }

    // Immediate local preview so both Settings and Header switch instantly
    const localPreviewUrl = URL.createObjectURL(file);
    const previousImage = clinicProfileImage;
    setClinicProfileImage(localPreviewUrl);
    setAvatarImgError(false);
    window.dispatchEvent(
      new CustomEvent('clinic-profile-image-updated', {
        detail: { profile_image_url: localPreviewUrl },
      })
    );
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('profile_image', file);

      const res = await appointmentApi.uploadClinicProfileImage(formData);
      const serverUrl = res?.profile_image_url || res?.profileImageUrl;
      const effectiveUrl = getEffectiveImageUrl(serverUrl) || localPreviewUrl;

      setClinicProfileImage(effectiveUrl);
      setAvatarImgError(false);
      if (effectiveUrl) {
        localStorage.setItem('clinic_profile_image', effectiveUrl);
      }
      window.dispatchEvent(
        new CustomEvent('clinic-profile-image-updated', {
          detail: { profile_image_url: effectiveUrl },
        })
      );
      showToast('Clinic profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading clinic profile image:', err);
      // Revert to previous image if upload failed
      setClinicProfileImage(previousImage);
      window.dispatchEvent(
        new CustomEvent('clinic-profile-image-updated', {
          detail: { profile_image_url: previousImage },
        })
      );
      const errMsg = err?.response?.data?.error || err?.message || 'Failed to upload clinic profile picture.';
      showToast(errMsg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (e) => {
    e?.stopPropagation?.();
    setIsUploadingImage(true);
    try {
      await appointmentApi.removeClinicProfileImage();
      setClinicProfileImage(null);
      localStorage.removeItem('clinic_profile_image');
      window.dispatchEvent(
        new CustomEvent('clinic-profile-image-updated', {
          detail: { profile_image_url: null },
        })
      );
      showToast('Clinic profile picture removed successfully!');
    } catch (err) {
      console.error('Error removing clinic profile image:', err);
      showToast(err?.message || 'Failed to remove clinic profile picture.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // 2. Appointment Settings State
  const [workingDays, setWorkingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [consultationHours, setConsultationHours] = useState('09:00 AM - 06:00 PM');
  const [slotDuration, setSlotDuration] = useState('30 Minutes');
  const [dateRestrictions, setDateRestrictions] = useState([]);
  const [customWorkingHours, setCustomWorkingHours] = useState([]);

  // Draft States for editing appointment modal
  const [appointmentModalTab, setAppointmentModalTab] = useState('general'); // 'general' | 'restrictions' | 'custom_hours'
  const [draftDateRestrictions, setDraftDateRestrictions] = useState([]);
  const [draftCustomWorkingHours, setDraftCustomWorkingHours] = useState([]);

  // Form states for adding a new date restriction
  const [newRestrMode, setNewRestrMode] = useState('range'); // 'range' | 'month'
  const [newRestrStartDate, setNewRestrStartDate] = useState('');
  const [newRestrEndDate, setNewRestrEndDate] = useState('');
  const [newRestrMonth, setNewRestrMonth] = useState(new Date().getMonth());
  const [newRestrYear, setNewRestrYear] = useState(new Date().getFullYear());
  const [newRestrReason, setNewRestrReason] = useState('');

  // Form states for adding date-specific working hours
  const [newCustomStartDate, setNewCustomStartDate] = useState('');
  const [newCustomEndDate, setNewCustomEndDate] = useState('');
  const [newCustomStartTime, setNewCustomStartTime] = useState('09:00 AM');
  const [newCustomEndTime, setNewCustomEndTime] = useState('02:00 PM');
  const [newCustomReason, setNewCustomReason] = useState('');

  // 3. Notification Settings State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_notification_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      newAppointment: true,
      appointmentReminder: true,
      prescriptionUpdates: true,
    };
  });
  const [notificationChannels, setNotificationChannels] = useState({
    whatsapp: true,
    email: true,
    sms: false,
  });

  // Modal Open States
  const [editClinicModalOpen, setEditClinicModalOpen] = useState(false);
  const [editAppointmentModalOpen, setEditAppointmentModalOpen] = useState(false);
  const [editNotificationModalOpen, setEditNotificationModalOpen] = useState(false);

  // Draft States for editing
  const [draftClinicInfo, setDraftClinicInfo] = useState({ ...clinicInfo });
  const [draftContactDigits, setDraftContactDigits] = useState('9876543210');
  const [draftAlternateDigits, setDraftAlternateDigits] = useState('9988766554');
  const [formErrors, setFormErrors] = useState({});
  const [draftWorkingDays, setDraftWorkingDays] = useState([...workingDays]);
  const [draftStartHour, setDraftStartHour] = useState('09:00 AM');
  const [draftEndHour, setDraftEndHour] = useState('06:00 PM');
  const [draftSlotDuration, setDraftSlotDuration] = useState(slotDuration);
  const [draftNotifications, setDraftNotifications] = useState({ ...notifications });
  const [draftChannels, setDraftChannels] = useState({ ...notificationChannels });

  // Success Toast Banner
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  const isAnySettingsModalOpen =
    editClinicModalOpen || editAppointmentModalOpen || editNotificationModalOpen;

  // Background Scroll Lock & ESC listener
  useEffect(() => {
    if (isAnySettingsModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;

      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setEditClinicModalOpen(false);
          setEditAppointmentModalOpen(false);
          setEditNotificationModalOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      };
    }
  }, [isAnySettingsModalOpen]);

  // Handlers for Clinic Info
  const handleOpenClinicModal = () => {
    setDraftClinicInfo({ ...clinicInfo });
    setDraftContactDigits(extract10Digits(clinicInfo.contactNumber));
    setDraftAlternateDigits(extract10Digits(clinicInfo.alternateNumber));
    setFormErrors({});
    setEditClinicModalOpen(true);
  };

    const handleClinicNameChange = (e) => {
    const raw = e.target.value;
    // Maximum length 35 characters
    const filtered = raw.slice(0, 35);
    setDraftClinicInfo((prev) => ({ ...prev, clinicName: filtered }));
    if (formErrors.clinicName) {
      setFormErrors((prev) => ({ ...prev, clinicName: validateClinicName(filtered) }));
    }
  };

  const handleDoctorNameChange = (e) => {
    const raw = e.target.value;
    // Allow letters, spaces, dots (.), and parentheses ( ), max 35 characters
    const filtered = raw.replace(/[^a-zA-Z\s.()]/g, '').slice(0, 35);
    setDraftClinicInfo((prev) => ({ ...prev, doctorName: filtered }));
    if (formErrors.doctorName) {
      setFormErrors((prev) => ({ ...prev, doctorName: validateDoctorName(filtered) }));
    }
  };

  const handleEmailChange = (e) => {
    let val = e.target.value.toLowerCase();
    // Once the user enters .com, no additional characters should be allowed.
    // Prevent typing or pasting anything after .com
    const comIndex = val.indexOf('.com');
    if (comIndex !== -1) {
      val = val.slice(0, comIndex + 4);
    }
    setDraftClinicInfo((prev) => ({ ...prev, email: val }));
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: validateEmail(val) }));
    }
  };

  const handleEmailKeyDown = (e) => {
    // Allow navigation/control keys: Backspace, Delete, Tab, Arrow keys, Enter, Ctrl/Cmd shortcuts
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

    const currentVal = (draftClinicInfo.email || '').toLowerCase();
    const comIndex = currentVal.indexOf('.com');
    if (comIndex !== -1) {
      const selStart = e.target.selectionStart;
      // If typing at or after .com, prevent typing any additional characters
      if (selStart >= comIndex + 4) {
        e.preventDefault();
      }
    }
  };

  const handleContactNumberChange = (e) => {
    // Only numbers, max 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDraftContactDigits(digits);
    if (formErrors.contactNumber) {
      setFormErrors((prev) => ({ ...prev, contactNumber: validateMobileNumber(digits, true) }));
    }
  };

  const handleAlternateNumberChange = (e) => {
    // Only numbers, max 10 digits
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDraftAlternateDigits(digits);
    if (formErrors.alternateNumber) {
      setFormErrors((prev) => ({ ...prev, alternateNumber: validateMobileNumber(digits, false) }));
    }
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setDraftClinicInfo((prev) => ({ ...prev, address: val }));
    if (formErrors.address && val.trim()) {
      setFormErrors((prev) => ({ ...prev, address: '' }));
    }
  };

  const handleSaveClinicInfo = (e) => {
    e.preventDefault();

    const errors = {
      clinicName: validateClinicName(draftClinicInfo.clinicName),
      doctorName: validateDoctorName(draftClinicInfo.doctorName),
      email: validateEmail(draftClinicInfo.email),
      contactNumber: validateMobileNumber(draftContactDigits, true),
      alternateNumber: validateMobileNumber(draftAlternateDigits, false),
      address: draftClinicInfo.address?.trim() ? '' : 'Address is required.',
    };

    const hasErrors = Object.values(errors).some((err) => Boolean(err));
    if (hasErrors) {
      setFormErrors(errors);
      return;
    }

    const updated = {
      clinicName: draftClinicInfo.clinicName.trim(),
      doctorName: draftClinicInfo.doctorName.trim(),
      contactNumber: formatWithCountryCode(draftContactDigits),
      alternateNumber: draftAlternateDigits ? formatWithCountryCode(draftAlternateDigits) : '',
      email: draftClinicInfo.email.trim(),
      address: draftClinicInfo.address.trim(),
    };

    setClinicInfo(updated);
    try {
      localStorage.setItem('clinic_info_settings', JSON.stringify(updated));
    } catch {}

    // Persist to backend API with validation feedback
    appointmentApi.updateClinicSettings(updated).catch((err) => {
      console.warn('Backend settings sync notice:', err);
    });

    setEditClinicModalOpen(false);
    showToast('Clinic Information updated successfully!');
  };

  // Format helper for display
  const formatDateBadge = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [y, m, d] = parts;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
    } catch {
      return dateStr;
    }
  };

  const timeSlotOptions = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM'
  ];

  // Handlers for Appointment Settings
  const handleOpenAppointmentModal = () => {
    setDraftWorkingDays([...workingDays]);
    const parts = consultationHours.split(' - ');
    setDraftStartHour(parts[0] || '09:00 AM');
    setDraftEndHour(parts[1] || '06:00 PM');
    setDraftSlotDuration(slotDuration);
    setDraftDateRestrictions([...dateRestrictions]);
    setDraftCustomWorkingHours([...customWorkingHours]);
    setAppointmentModalTab('general');

    setNewRestrStartDate('');
    setNewRestrEndDate('');
    setNewRestrReason('');
    setNewCustomStartDate('');
    setNewCustomEndDate('');
    setNewCustomStartTime('09:00 AM');
    setNewCustomEndTime('02:00 PM');
    setNewCustomReason('');

    setEditAppointmentModalOpen(true);
  };

  const toggleDraftDay = (day) => {
    if (draftWorkingDays.includes(day)) {
      setDraftWorkingDays(draftWorkingDays.filter((d) => d !== day));
    } else {
      setDraftWorkingDays([...draftWorkingDays, day]);
    }
  };

  const handleAddRestriction = (e) => {
    if (e) e.preventDefault();
    if (newRestrMode === 'range') {
      if (!newRestrStartDate) {
        showToast('Please select a start date.');
        return;
      }
      const end = newRestrEndDate || newRestrStartDate;
      if (end < newRestrStartDate) {
        showToast('End date cannot be earlier than start date.');
        return;
      }
      const item = {
        id: `restr_${Date.now()}`,
        type: 'range',
        startDate: newRestrStartDate,
        endDate: end,
        reason: newRestrReason.trim() || 'Clinic closed',
      };
      setDraftDateRestrictions([...draftDateRestrictions, item]);
      setNewRestrReason('');
      showToast('Date restriction added.');
    } else {
      const y = parseInt(newRestrYear, 10);
      const m = parseInt(newRestrMonth, 10);
      const startStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const item = {
        id: `restr_${Date.now()}`,
        type: 'month',
        month: `${y}-${String(m + 1).padStart(2, '0')}`,
        startDate: startStr,
        endDate: endStr,
        reason: newRestrReason.trim() || `Closed for ${monthNames[m]} ${y}`,
      };
      setDraftDateRestrictions([...draftDateRestrictions, item]);
      setNewRestrReason('');
      showToast(`Entire month restriction (${monthNames[m]} ${y}) added.`);
    }
  };

  const handleRemoveRestriction = (id, index) => {
    setDraftDateRestrictions((prev) =>
      prev.filter((r, idx) => (r.id ? r.id !== id : idx !== index && idx !== id))
    );
  };

  const handleAddCustomWorkingHours = (e) => {
    if (e) e.preventDefault();
    if (!newCustomStartDate) {
      showToast('Please select a date.');
      return;
    }
    const end = newCustomEndDate || newCustomStartDate;
    if (end < newCustomStartDate) {
      showToast('End date cannot be earlier than start date.');
      return;
    }
    const item = {
      id: `cwh_${Date.now()}`,
      startDate: newCustomStartDate,
      endDate: end,
      startTime: newCustomStartTime,
      endTime: newCustomEndTime,
      reason: newCustomReason.trim() || 'Custom working hours',
    };
    setDraftCustomWorkingHours([...draftCustomWorkingHours, item]);
    setNewCustomReason('');
    showToast('Custom working hours added.');
  };

  const handleRemoveCustomWorkingHours = (id, index) => {
    setDraftCustomWorkingHours((prev) =>
      prev.filter((c, idx) => (c.id ? c.id !== id : idx !== index && idx !== id))
    );
  };

  const handleSaveAppointmentSettings = async (e) => {
    if (e) e.preventDefault();
    const updatedDays = [...draftWorkingDays];
    const updatedHours = `${draftStartHour} - ${draftEndHour}`;
    const updatedSlot = draftSlotDuration;
    const updatedRestrictions = [...draftDateRestrictions];
    const updatedCustomHours = [...draftCustomWorkingHours];

    setWorkingDays(updatedDays);
    setConsultationHours(updatedHours);
    setSlotDuration(updatedSlot);
    setDateRestrictions(updatedRestrictions);
    setCustomWorkingHours(updatedCustomHours);
    setEditAppointmentModalOpen(false);

    const payload = {
      workingDays: updatedDays,
      working_days: updatedDays,
      consultationHours: updatedHours,
      consultation_hours: updatedHours,
      slotDuration: updatedSlot,
      slot_duration: updatedSlot,
      dateRestrictions: updatedRestrictions,
      date_restrictions: updatedRestrictions,
      customWorkingHours: updatedCustomHours,
      custom_working_hours: updatedCustomHours,
    };

    try {
      localStorage.setItem('clinic_appointment_settings', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('appointment-settings-updated', { detail: payload }));
      await appointmentApi.updateAppointmentSettings(payload);
      showToast('Appointment settings saved successfully!');
    } catch (err) {
      console.warn('Backend appointment settings sync notice:', err);
      showToast('Appointment settings saved successfully!');
    }
  };

  // Handlers for Notification Settings
  const handleOpenNotificationModal = () => {
    setDraftNotifications({ ...notifications });
    setDraftChannels({ ...notificationChannels });
    setEditNotificationModalOpen(true);
  };

  const handleSaveNotificationSettings = async (e) => {
    e.preventDefault();
    const updatedNotifs = { ...draftNotifications };
    const updatedChannels = { ...draftChannels };
    setNotifications(updatedNotifs);
    setNotificationChannels(updatedChannels);
    setEditNotificationModalOpen(false);
    try {
      localStorage.setItem('clinic_notification_settings', JSON.stringify(updatedNotifs));
    } catch {}
    window.dispatchEvent(new CustomEvent('notification-settings-updated', { detail: updatedNotifs }));
    showToast('Notification settings saved successfully!');
    try {
      await appointmentApi.updateNotificationSettings({
        notifications: updatedNotifs,
        notificationChannels: updatedChannels,
      });
    } catch (err) {
      console.warn('Backend notification settings sync notice:', err);
    }
  };

  const toggleDay = async (day) => {
    const isCurrentlyActive = workingDays.includes(day);
    const newDays = isCurrentlyActive
      ? workingDays.filter((d) => d !== day)
      : [...workingDays, day];

    setWorkingDays(newDays);

    const payload = {
      workingDays: newDays,
      working_days: newDays,
      consultationHours,
      consultation_hours: consultationHours,
      slotDuration,
      slot_duration: slotDuration,
      dateRestrictions,
      date_restrictions: dateRestrictions,
      customWorkingHours,
      custom_working_hours: customWorkingHours,
    };

    try {
      localStorage.setItem('clinic_appointment_settings', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('appointment-settings-updated', { detail: payload }));
      await appointmentApi.updateAppointmentSettings(payload);
      showToast(`Working day ${isCurrentlyActive ? 'disabled' : 'enabled'}: ${day}`);
    } catch (err) {
      console.warn('Backend appointment settings sync notice:', err);
      showToast(`Working day ${isCurrentlyActive ? 'disabled' : 'enabled'}: ${day}`);
    }
  };

  // (toggleNotification removed: Notification settings are read-only on the card; changes require clicking 'Edit' and saving in the modal)

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#1e4620',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMessage}
        </div>
      )}

      {/* Settings Banner */}
      <div
        className="admin-page-banner"
        style={{
          backgroundColor: '#eaf5ed',
          borderRadius: '20px',
          padding: '0 40px',
          height: '148px',
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
            Clinic Information
          </h1>
          <p
            className="admin-page-banner-subtitle"
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            Update your clinic details and contact information.
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
              height: '148px',
              maxHeight: '100%',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
              objectPosition: 'bottom right',
            }}
          />
        </div>
      </div>

      {/* Card 1: Clinic Information */}
      <div
        className="admin-settings-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px 28px',
          border: '1px solid #f1f5f9',
          marginBottom: '22px',
        }}
      >
        <div className="admin-settings-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div className="admin-settings-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#dafaea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                <line x1="10" y1="9" x2="14" y2="9" />
                <line x1="12" y1="7" x2="12" y2="11" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px 0' }}>Clinic Information</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Update your clinic details and contact information.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenClinicModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Unified Flex Layout: Avatar + Details Grid */}
        <div className="admin-clinic-profile-flex" style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
          {/* Clinic Profile Picture & Upload Option */}
          <div
            className="admin-clinic-avatar-wrap"
            ref={uploadDropdownRef}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              flexShrink: 0,
              minWidth: '110px',
              paddingTop: '2px',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.webp,.gif"
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {/* Circular Avatar */}
            <div
              onClick={() => {
                if (!isUploadingImage && fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              title="Click to upload/change clinic profile photo"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '26px',
                letterSpacing: '0.5px',
                marginBottom: '10px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                border: clinicProfileImage ? '2px solid #22c55e' : '1px solid #bbf7d0',
                flexShrink: 0,
                cursor: isUploadingImage ? 'wait' : 'pointer',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isUploadingImage) {
                  e.currentTarget.style.transform = 'scale(1.03)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.25)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
              }}
            >
              {clinicProfileImage && !avatarImgError ? (
                <img
                  src={clinicProfileImage}
                  alt="Clinic Profile"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '50%',
                  }}
                  onError={() => {
                    setAvatarImgError(true);
                  }}
                />
              ) : (
                'DT'
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

            {/* Profile Upload Dropdown Button */}
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
                <span>Profile Upload</span>
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

              {/* Dropdown Menu with Change Profile and Remove Profile */}
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
                  {/* Action 1: Change Profile */}
                  <button
                    type="button"
                    onClick={() => {
                      setUploadDropdownOpen(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                      }
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                    <span>Change Profile</span>
                  </button>

                  {/* Action 2: Remove Profile */}
                  <button
                    type="button"
                    onClick={(e) => {
                      setUploadDropdownOpen(false);
                      handleRemoveImage(e);
                    }}
                    disabled={isUploadingImage || !clinicProfileImage}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: '8px',
                      backgroundColor: 'transparent',
                      color: !clinicProfileImage ? '#cbd5e1' : '#dc2626',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: !clinicProfileImage ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      fontFamily: "'Manrope', sans-serif",
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (clinicProfileImage) {
                        e.currentTarget.style.backgroundColor = '#fef2f2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Remove Profile</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unified 4-Column Grid: Row 1 & Row 2 perfectly aligned */}
          <div
            className="admin-clinic-info-grid"
            style={{
              flex: 1,
              minWidth: 0,
              display: 'grid',
              gridTemplateColumns: '1.15fr 1.55fr 1.25fr 1.25fr',
              rowGap: '22px',
            }}
          >
            {/* Row 1, Col 1: Clinic Name */}
            <div className="admin-info-cell admin-info-cell-1" style={{ paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                CLINIC NAME
              </div>
              <div className="admin-info-val" style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>
                {clinicInfo.clinicName}
              </div>
            </div>

            {/* Row 1, Col 2: Doctor Name */}
            <div className="admin-info-cell admin-info-cell-2" style={{ paddingLeft: '24px', paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                DOCTOR NAME
              </div>
              <div className="admin-info-val" style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>
                {clinicInfo.doctorName}
              </div>
            </div>

            {/* Row 1, Col 3: Contact Number */}
            <div className="admin-info-cell admin-info-cell-3" style={{ paddingLeft: '24px', paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                CONTACT NUMBER
              </div>
              <div className="admin-info-val" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{clinicInfo.contactNumber}</span>
              </div>
            </div>

            {/* Row 1, Col 4: Alternate Number */}
            <div className="admin-info-cell admin-info-cell-4" style={{ paddingLeft: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ALTERNATE NUMBER
              </div>
              <div className="admin-info-val" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{clinicInfo.alternateNumber}</span>
              </div>
            </div>

            {/* Row 2, Col 1: Email Address (Directly under Clinic Name) */}
            <div className="admin-info-cell admin-info-cell-5" style={{ paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                EMAIL ADDRESS
              </div>
              <div className="admin-info-val" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a', minWidth: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="admin-info-val-email">{clinicInfo.email}</span>
              </div>
            </div>

            {/* Row 2, Col 2: Address (Directly under Doctor Name!) */}
            <div className="admin-info-cell admin-info-cell-address" style={{ gridColumn: '2 / span 3', paddingLeft: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                ADDRESS
              </div>
              <div className="admin-info-val" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a', minWidth: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{clinicInfo.address}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Appointment Settings */}
      <div
        className="admin-settings-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px 28px',
          border: '1px solid #f1f5f9',
          marginBottom: '22px',
        }}
      >
        <div className="admin-settings-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div className="admin-settings-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#dafaea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 3px 0' }}>Appointment Settings</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Configure your working hours, consultation slots and appointment preferences.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAppointmentModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Edit
          </button>
        </div>

        <div className="admin-appt-settings-grid" style={{ display: 'grid', gridTemplateColumns: '1.45fr 1.25fr 1fr', alignItems: 'center' }}>
          {/* Column 1: Working Days */}
          <div style={{ paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              WORKING DAYS
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                const active = workingDays.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: active ? '#dafaea' : '#f1f5f9',
                      color: active ? '#15803d' : '#64748b',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Consultation Hours */}
          <div style={{ paddingLeft: '24px', paddingRight: '20px', borderRight: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              CONSULTATION HOURS
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{consultationHours}</span>
            </div>
          </div>

          {/* Column 3: Slot Duration */}
          <div style={{ paddingLeft: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '10px' }}>
              SLOT DURATION
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M5 22h14" />
                <path d="M5 2h14" />
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              </svg>
              <span>{slotDuration}</span>
            </div>
          </div>
        </div>

        {(dateRestrictions.length > 0 || customWorkingHours.length > 0) && (
          <div className="admin-appt-badges-wrap" style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {dateRestrictions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Restricted Dates:
                </span>
                {dateRestrictions.map((r) => (
                  <span
                    key={r.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <span>🚫</span>
                    <span>
                      {r.startDate === r.endDate
                        ? formatDateBadge(r.startDate)
                        : `${formatDateBadge(r.startDate)} - ${formatDateBadge(r.endDate)}`}
                    </span>
                    {r.reason && <span style={{ color: '#64748b', fontWeight: '400' }}>({r.reason})</span>}
                  </span>
                ))}
              </div>
            )}
            {customWorkingHours.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Special Working Hours:
                </span>
                {customWorkingHours.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      color: '#0369a1',
                      fontSize: '12px',
                      fontWeight: '600',
                    }}
                  >
                    <span>⏱</span>
                    <span>
                      {c.startDate === c.endDate
                        ? formatDateBadge(c.startDate)
                        : `${formatDateBadge(c.startDate)} - ${formatDateBadge(c.endDate)}`}
                      : {c.startTime} - {c.endTime}
                    </span>
                    {c.reason && <span style={{ color: '#64748b', fontWeight: '400' }}>({c.reason})</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card 3: Notification Settings */}
      <div className="admin-settings-card" style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '26px 28px', border: '1px solid #f1f5f9' }}>
        <div className="admin-settings-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="admin-settings-card-header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e8f5ec', color: '#265e38', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>Notification Settings</h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>Choose what notifications you want to receive.</p>
            </div>
          </div>
          <button
            id="edit-notification-settings-btn"
            type="button"
            onClick={handleOpenNotificationModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#0f172a',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Edit
          </button>
        </div>

        <div className="admin-notification-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { key: 'newAppointment', title: 'New Appointment', desc: 'Get notified when a new appointment is booked.' },
            { key: 'appointmentReminder', title: 'Appointment Reminder', desc: 'Receive reminders for upcoming appointments.' },
            { key: 'prescriptionUpdates', title: 'Prescription Updates', desc: 'Get notified when a prescription is issued.' },
          ].map((item) => {
            const enabled = notifications[item.key];
            return (
              <div
                key={item.key}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', userSelect: 'none' }}
                onClick={() => {
                  showToast("Notification settings are read-only. Click 'Edit' to change settings.");
                }}
              >
                <div
                  title="Notification settings are read-only. Click 'Edit' to change settings."
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '9999px',
                    backgroundColor: enabled ? '#1e7e34' : '#cbd5e1',
                    position: 'relative',
                    cursor: 'default',
                    flexShrink: 0,
                    transition: 'background-color 0.2s',
                    marginTop: '2px',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: enabled ? '19px' : '3px',
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
                <div style={{ cursor: 'default' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', lineHeight: 1.35 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL 1: Edit Clinic Information ================= */}
      {editClinicModalOpen && (
        <div
          className="admin-settings-modal-overlay"
          onClick={() => setEditClinicModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            className="admin-settings-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Clinic Information
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Update your clinic and doctor contact details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditClinicModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveClinicInfo} noValidate>
                <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                        Clinic Name *
                      </label>
                      <span style={{ fontSize: '11px', color: (draftClinicInfo.clinicName?.length || 0) === 35 ? '#ea580c' : '#94a3b8' }}>
                        {draftClinicInfo.clinicName?.length || 0}/35
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={35}
                      value={draftClinicInfo.clinicName || ''}
                      onChange={handleClinicNameChange}
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          clinicName: validateClinicName(draftClinicInfo.clinicName),
                        }))
                      }
                      placeholder="e.g. HOMEOPATHY CLINIC"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formErrors.clinicName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                    {formErrors.clinicName && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.clinicName}
                      </span>
                    )}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                        Doctor Name *
                      </label>
                      <span style={{ fontSize: '11px', color: (draftClinicInfo.doctorName?.length || 0) === 35 ? '#ea580c' : '#94a3b8' }}>
                        {draftClinicInfo.doctorName?.length || 0}/35
                      </span>
                    </div>
                    <input
                      type="text"
                      maxLength={35}
                      value={draftClinicInfo.doctorName || ''}
                      onChange={handleDoctorNameChange}
                      onBlur={() =>
                        setFormErrors((prev) => ({
                          ...prev,
                          doctorName: validateDoctorName(draftClinicInfo.doctorName),
                        }))
                      }
                      placeholder="e.g. Dr Kumar Tripathi"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: formErrors.doctorName ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                      }}
                    />
                    {formErrors.doctorName && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.doctorName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Contact Number *
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: formErrors.contactNumber ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          userSelect: 'none',
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={draftContactDigits}
                        onChange={handleContactNumberChange}
                        onBlur={() =>
                          setFormErrors((prev) => ({
                            ...prev,
                            contactNumber: validateMobileNumber(draftContactDigits, true),
                          }))
                        }
                        placeholder="9876543210"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {formErrors.contactNumber && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.contactNumber}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Alternate Number
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        border: formErrors.alternateNumber ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          borderRight: '1px solid #cbd5e1',
                          color: '#475569',
                          fontSize: '13.5px',
                          fontWeight: '600',
                          userSelect: 'none',
                        }}
                      >
                        +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={draftAlternateDigits}
                        onChange={handleAlternateNumberChange}
                        onBlur={() =>
                          setFormErrors((prev) => ({
                            ...prev,
                            alternateNumber: validateMobileNumber(draftAlternateDigits, false),
                          }))
                        }
                        placeholder="9988766554"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '13.5px',
                          color: '#0f172a',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    {formErrors.alternateNumber && (
                      <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                        {formErrors.alternateNumber}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={draftClinicInfo.email || ''}
                    onChange={handleEmailChange}
                    onKeyDown={handleEmailKeyDown}
                    onBlur={() =>
                      setFormErrors((prev) => ({
                        ...prev,
                        email: validateEmail(draftClinicInfo.email),
                      }))
                    }
                    placeholder="clinic.tripathi@gmail.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: formErrors.email ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {formErrors.email}
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Address *
                  </label>
                  <textarea
                    rows={3}
                    value={draftClinicInfo.address || ''}
                    onChange={handleAddressChange}
                    onBlur={() =>
                      setFormErrors((prev) => ({
                        ...prev,
                        address: draftClinicInfo.address?.trim() ? '' : 'Address is required.',
                      }))
                    }
                    placeholder="Clinic address..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: formErrors.address ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: 1.4,
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  {formErrors.address && (
                    <span style={{ color: '#dc2626', fontSize: '11.5px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
                      {formErrors.address}
                    </span>
                  )}
                </div>

                <div className="admin-modal-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setEditClinicModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  {/* Save Changes Button (Clinic Information) */}
                  <button
                    id="save-clinic-btn"
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: Edit Appointment Settings ================= */}
      {editAppointmentModalOpen && (
        <div
          className="admin-settings-modal-overlay"
          onClick={() => setEditAppointmentModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            className="admin-settings-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Appointment Settings
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Configure working days, hours, slot duration, and scheduling restrictions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditAppointmentModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveAppointmentSettings}>
                {/* SECTION 1: Working Days */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
                    Working Days (Click to toggle)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => {
                      const isSelected = draftWorkingDays.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDraftDay(d)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: isSelected ? '1px solid #1e7e34' : '1px solid #e2e8f0',
                            backgroundColor: isSelected ? '#e8f5ec' : '#f8fafc',
                            color: isSelected ? '#1e7e34' : '#64748b',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{d}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 2: General Hours & Duration */}
                <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Start Time
                    </label>
                    <select
                      value={draftStartHour}
                      onChange={(e) => setDraftStartHour(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {timeSlotOptions.slice(0, 10).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      End Time
                    </label>
                    <select
                      value={draftEndHour}
                      onChange={(e) => setDraftEndHour(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13.5px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      {timeSlotOptions.slice(12).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slot Duration */}
                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Slot Duration
                  </label>
                  <select
                    value={draftSlotDuration}
                    onChange={(e) => setDraftSlotDuration(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="15 Minutes">15 Minutes</option>
                    <option value="20 Minutes">20 Minutes</option>
                    <option value="30 Minutes">30 Minutes</option>
                    <option value="45 Minutes">45 Minutes</option>
                    <option value="60 Minutes">60 Minutes</option>
                  </select>
                </div>

                {/* DIVIDER */}
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '22px 0' }} />

                {/* SECTION 3: Disable Specific Dates or Months */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      Disable Specific Dates or Months
                    </div>
                    {draftDateRestrictions.length > 0 && (
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '11px', borderRadius: '10px', padding: '1px 8px', fontWeight: '700' }}>
                        {draftDateRestrictions.length} active
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                    Block appointment booking on holidays, planned clinic leaves, or an entire month.
                  </p>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {/* Restriction Mode Selector */}
                    <div style={{ display: 'flex', gap: '20px', marginBottom: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="formRestrMode"
                          checked={newRestrMode === 'range'}
                          onChange={() => setNewRestrMode('range')}
                        />
                        Specific Date / Date Range
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="formRestrMode"
                          checked={newRestrMode === 'month'}
                          onChange={() => setNewRestrMode('month')}
                        />
                        Entire Month
                      </label>
                    </div>

                    {newRestrMode === 'range' ? (
                      <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                            Select Date (or Start Date)
                          </label>
                          <input
                            type="date"
                            value={newRestrStartDate}
                            onChange={(e) => {
                              setNewRestrStartDate(e.target.value);
                              if (!newRestrEndDate || newRestrEndDate < e.target.value) {
                                setNewRestrEndDate(e.target.value);
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              backgroundColor: '#ffffff',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                            End Date (Optional Range)
                          </label>
                          <input
                            type="date"
                            value={newRestrEndDate}
                            min={newRestrStartDate}
                            onChange={(e) => setNewRestrEndDate(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              fontSize: '13px',
                              backgroundColor: '#ffffff',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', marginBottom: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                              Select Month
                            </label>
                            <select
                              value={newRestrMonth}
                              onChange={(e) => setNewRestrMonth(parseInt(e.target.value, 10))}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                backgroundColor: '#ffffff',
                                boxSizing: 'border-box',
                              }}
                            >
                              {[
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                              ].map((mName, idx) => (
                                <option key={idx} value={idx}>{mName}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                              Select Year
                            </label>
                            <select
                              value={newRestrYear}
                              onChange={(e) => setNewRestrYear(parseInt(e.target.value, 10))}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '13px',
                                backgroundColor: '#ffffff',
                                boxSizing: 'border-box',
                              }}
                            >
                              {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2].map((yr) => (
                                <option key={yr} value={yr}>{yr}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#0369a1', marginBottom: '12px' }}>
                          Appointments will be disabled for the whole month: 01 to {new Date(newRestrYear, newRestrMonth + 1, 0).getDate()} {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][newRestrMonth]} {newRestrYear}.
                        </div>
                      </div>
                    )}

                    <div className="admin-modal-row-btn" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          Reason / Description (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder={newRestrMode === 'range' ? 'e.g. Clinic Closed, Public Holiday' : 'e.g. Annual Winter Break'}
                          value={newRestrReason}
                          onChange={(e) => setNewRestrReason(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddRestriction}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#dc2626',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          height: '37px',
                        }}
                      >
                        + Disable Date / Month
                      </button>
                    </div>

                    {/* Configured Restrictions List */}
                    {draftDateRestrictions.length > 0 && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Active Restrictions ({draftDateRestrictions.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                          {draftDateRestrictions.map((r, idx) => (
                            <div
                              key={r.id}
                              className="active-restriction-item"
                              data-restr-id={r.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', color: '#991b1b', textTransform: 'uppercase' }}>
                                  {r.type === 'month' ? 'Entire Month' : 'Date'}
                                </span>
                                <div>
                                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#991b1b' }}>
                                    {r.startDate === r.endDate
                                      ? formatDateBadge(r.startDate)
                                      : `${formatDateBadge(r.startDate)} - ${formatDateBadge(r.endDate)}`}
                                  </div>
                                  {r.reason && (
                                    <div style={{ fontSize: '11px', color: '#7f1d1d' }}>
                                      {r.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRestriction(r.id, idx)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fca5a5',
                                  backgroundColor: '#ffffff',
                                  color: '#dc2626',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* DIVIDER */}
                <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '22px 0' }} />

                {/* SECTION 4: Date-Based Working Hours */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>
                      Date-Based Working Hours
                    </div>
                    {draftCustomWorkingHours.length > 0 && (
                      <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '11px', borderRadius: '10px', padding: '1px 8px', fontWeight: '700' }}>
                        {draftCustomWorkingHours.length} active
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>
                    Assign custom Start Time and End Time to a particular date (e.g., Saturday half-day or evening clinic).
                  </p>

                  <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {/* Date Selection */}
                    <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          Select Date (or Start Date)
                        </label>
                        <input
                          type="date"
                          value={newCustomStartDate}
                          onChange={(e) => {
                            setNewCustomStartDate(e.target.value);
                            if (!newCustomEndDate || newCustomEndDate < e.target.value) {
                              setNewCustomEndDate(e.target.value);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          End Date (Optional Range)
                        </label>
                        <input
                          type="date"
                          value={newCustomEndDate}
                          min={newCustomStartDate}
                          onChange={(e) => setNewCustomEndDate(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Custom Hours */}
                    <div className="admin-modal-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          Start Time
                        </label>
                        <select
                          value={newCustomStartTime}
                          onChange={(e) => setNewCustomStartTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        >
                          {timeSlotOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          End Time
                        </label>
                        <select
                          value={newCustomEndTime}
                          onChange={(e) => setNewCustomEndTime(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        >
                          {timeSlotOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Note & Add button */}
                    <div className="admin-modal-row-btn" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '5px' }}>
                          Description / Shift Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Saturday Half Day, Extended Evening Clinic"
                          value={newCustomReason}
                          onChange={(e) => setNewCustomReason(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '13px',
                            backgroundColor: '#ffffff',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleAddCustomWorkingHours}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '12.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          height: '37px',
                        }}
                      >
                        + Set Date Hours
                      </button>
                    </div>

                    {/* Configured Custom Hours List */}
                    {draftCustomWorkingHours.length > 0 && (
                      <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                          Active Date-Specific Hours ({draftCustomWorkingHours.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                          {draftCustomWorkingHours.map((c, idx) => (
                            <div
                              key={c.id}
                              className="active-custom-hours-item"
                              data-cwh-id={c.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: '#f0f9ff',
                                border: '1px solid #bae6fd',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', textTransform: 'uppercase' }}>
                                  {c.startTime} - {c.endTime}
                                </span>
                                <div>
                                  <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#0369a1' }}>
                                    {c.startDate === c.endDate
                                      ? formatDateBadge(c.startDate)
                                      : `${formatDateBadge(c.startDate)} - ${formatDateBadge(c.endDate)}`}
                                  </div>
                                  {c.reason && (
                                    <div style={{ fontSize: '11px', color: '#0284c7' }}>
                                      {c.reason}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomWorkingHours(c.id, idx)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #93c5fd',
                                  backgroundColor: '#ffffff',
                                  color: '#0284c7',
                                  fontSize: '11.5px',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="admin-modal-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setEditAppointmentModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  {/* Save Changes Button (Appointment Settings) */}
                  <button
                    id="save-appointment-btn"
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: Edit Notification Settings ================= */}
      {editNotificationModalOpen && (
        <div
          className="admin-settings-modal-overlay"
          onClick={() => setEditNotificationModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          <div
            className="admin-settings-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div
              className="admin-modal-scroll"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 32px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                    Edit Notification Settings
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
                    Choose which notifications you and your patients receive.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditNotificationModalOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#ffffff',
                    color: '#64748b',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveNotificationSettings}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                  {[
                    { key: 'newAppointment', title: 'New Appointment Alerts', desc: 'Notify immediately when an appointment is scheduled.' },
                    { key: 'appointmentReminder', title: 'Appointment Reminders', desc: 'Send automated reminders 2 hours before the session.' },
                    { key: 'prescriptionUpdates', title: 'Prescription Updates', desc: 'Send notification when a prescription is issued or dispatched.' },
                  ].map((item) => {
                    const isChecked = draftNotifications[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setDraftNotifications({
                            ...draftNotifications,
                            [item.key]: !isChecked,
                          })
                        }
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '1px solid #f1f5f9',
                          backgroundColor: isChecked ? '#fbfdfb' : '#ffffff',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>{item.title}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
                        </div>
                        <div
                          style={{
                            width: '38px',
                            height: '22px',
                            borderRadius: '9999px',
                            backgroundColor: isChecked ? '#1e7e34' : '#cbd5e1',
                            position: 'relative',
                            flexShrink: 0,
                            transition: 'background-color 0.2s',
                          }}
                        >
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff',
                              position: 'absolute',
                              top: '3px',
                              left: isChecked ? '19px' : '3px',
                              transition: 'left 0.2s',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="admin-modal-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => setEditNotificationModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#ffffff',
                      color: '#475569',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  {/* Save Changes Button (Notification Settings) */}
                  <button
                    id="save-notification-settings-btn"
                    type="submit"
                    style={{
                      padding: '9px 22px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#1e4620',
                      color: '#ffffff',
                      fontSize: '13.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .admin-clinic-info-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 18px !important;
          }
          .admin-info-cell-address {
            grid-column: 1 / span 2 !important;
            padding-left: 0 !important;
            border-top: 1px solid #f1f5f9 !important;
            padding-top: 14px !important;
          }
          .admin-notification-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
          }
        }
        @media (max-width: 768px) {
          .admin-page-banner {
            height: auto !important;
            min-height: 110px !important;
            padding: 20px 18px !important;
          }
          .admin-page-banner-title {
            font-size: 22px !important;
          }
          .admin-page-banner-img {
            opacity: 0.28 !important;
            height: 100px !important;
          }
          .admin-appt-settings-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .admin-appt-settings-grid > div {
            padding-left: 0 !important;
            padding-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 14px !important;
          }
          .admin-appt-settings-grid > div:last-child {
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
        }
        @media (max-width: 640px) {
          /* Top Banner */
          .admin-page-banner {
            height: auto !important;
            min-height: 96px !important;
            padding: 16px 14px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
          }
          .admin-page-banner-title {
            font-size: 20px !important;
            margin-bottom: 4px !important;
          }
          .admin-page-banner-subtitle {
            font-size: 12.5px !important;
            line-height: 1.35 !important;
          }
          .admin-page-banner-img {
            height: 75px !important;
            opacity: 0.22 !important;
          }

          /* Cards Container & Headers */
          .admin-settings-card {
            padding: 16px 14px !important;
            border-radius: 14px !important;
            margin-bottom: 16px !important;
          }
          .admin-settings-card-header {
            flex-wrap: wrap !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .admin-settings-card-header-left {
            gap: 10px !important;
            flex: 1 !important;
            min-width: 180px !important;
          }
          .admin-settings-card-header-left h2 {
            font-size: 15px !important;
          }
          .admin-settings-card-header-left p {
            font-size: 12px !important;
          }

          /* Card 1: Clinic Profile Avatar & Details */
          .admin-clinic-profile-flex {
            flex-direction: column !important;
            align-items: center !important;
            gap: 16px !important;
          }
          .admin-clinic-avatar-wrap {
            width: 100% !important;
            align-items: center !important;
            padding-top: 0 !important;
          }
          .admin-clinic-info-grid {
            width: 100% !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-info-cell {
            padding-left: 0 !important;
            padding-right: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid #f1f5f9 !important;
            padding-bottom: 12px !important;
          }
          .admin-info-cell:last-child {
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }
          .admin-info-cell-address {
            grid-column: 1 / span 1 !important;
            border-top: none !important;
            padding-left: 0 !important;
          }
          .admin-info-val {
            word-break: break-word !important;
            overflow-wrap: anywhere !important;
          }
          .admin-info-val-email {
            word-break: break-all !important;
            overflow-wrap: anywhere !important;
          }

          /* Card 2: Appointment Settings */
          .admin-appt-badges-wrap {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          /* Card 3: Notification Settings */
          .admin-notification-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          /* Modals */
          .admin-settings-modal-overlay {
            padding: 10px !important;
          }
          .admin-settings-modal-card {
            width: 100% !important;
            max-height: 92vh !important;
            border-radius: 16px !important;
          }
          .admin-modal-scroll {
            padding: 18px 14px !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .admin-modal-grid-2col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-modal-row-btn {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .admin-modal-row-btn button {
            width: 100% !important;
            height: 40px !important;
            justify-content: center !important;
          }
          .admin-modal-actions {
            flex-direction: column-reverse !important;
            gap: 8px !important;
          }
          .admin-modal-actions button {
            width: 100% !important;
            min-height: 40px !important;
            justify-content: center !important;
          }
        }
        @media (max-width: 380px) {
          .admin-settings-card {
            padding: 14px 10px !important;
          }
          .admin-modal-scroll {
            padding: 14px 10px !important;
          }
          .admin-page-banner {
            padding: 14px 10px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Link, useNavigate, useLocation } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';

import PatientAuthModal from '../../components/auth/PatientAuthModal';

import Navbar from '../../components/layout/Navbar';

import bookingBannerClean from '../../assets/booking-banner-clean.jpg';

import confirmedIllustration from '../../assets/confirmed-illustration.png?v=v2_hd_3d';

import appointmentApi from '../../api/appointmentApi';
import { downloadAppointmentConfirmationPdf } from '../../utils/appointmentPdf';



const BookAppointmentPage = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated } = useAuth();

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [rescheduleData, setRescheduleData] = useState(() => {
    let data = location.state?.rescheduleAppointment;
    if (!data) {
      try {
        const cached = localStorage.getItem('kss_reschedule_appointment');
        if (cached) data = JSON.parse(cached);
      } catch {}
    }
    if (data) {
      const s = String(data.status || '').trim().toLowerCase();
      if (s === 'complete' || s === 'completed' || s === 'cancelled') {
        try { localStorage.removeItem('kss_reschedule_appointment'); } catch {}
        return null;
      }
    }
    return data || null;
  });

  const [isRescheduledSuccess, setIsRescheduledSuccess] = useState(false);

  const [currentStep, setCurrentStep] = useState(() => {
    let data = location.state?.rescheduleAppointment;
    if (!data) {
      try {
        const cached = localStorage.getItem('kss_reschedule_appointment');
        if (cached) data = JSON.parse(cached);
      } catch {}
    }
    if (data) {
      const s = String(data.status || '').trim().toLowerCase();
      if (s === 'complete' || s === 'completed' || s === 'cancelled') {
        return 1;
      }
      return 2;
    }
    return 1;
  });



  // Form state initialized matching reference design (empty inputs with clean placeholders)

  const [formData, setFormData] = useState({

    fullName: '',

    mobileNumber: '',

    email: '',

    age: '',

    gender: '',

    dateOfBirth: '',

    city: '',

    reasonForVisit: '',

    selectedDay: new Date().getDate(),

    selectedMonth: new Date().getMonth(),

    selectedYear: new Date().getFullYear(),

    selectedTimeSlot: '',

    appointmentId: '',

  });



  const [errors, setErrors] = useState({});

  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedData, setConfirmedData] = useState(null);

  useEffect(() => {

    if (user && isAuthenticated) {

      const full = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '';

      setFormData((prev) => ({

        ...prev,

        fullName: prev.fullName || full,

        mobileNumber: prev.mobileNumber || user.phone_number || '',

        email: prev.email || user.email || '',

        gender: prev.gender || user.gender || '',

        dateOfBirth: prev.dateOfBirth || (user.date_of_birth ? (typeof user.date_of_birth === 'string' ? user.date_of_birth : user.date_of_birth.toISOString().split('T')[0]) : '') || '',

        city: prev.city || user.address || '',

      }));

      // Prefill from patient profile if available
      appointmentApi.getMyProfile().then((res) => {
        if (res) {
          if (user?.email && res.email && res.email.toLowerCase() !== user.email.toLowerCase()) {
            return;
          }
          setFormData((prev) => ({
            ...prev,
            gender: prev.gender || res.gender || '',
            dateOfBirth: prev.dateOfBirth || res.dateOfBirth || res.date_of_birth || res.dob || '',
            city: prev.city || res.city || res.address || '',
          }));
        }
      }).catch(() => {});

    }

  }, [user, isAuthenticated]);

  // Synchronize appointment details when in Reschedule mode
  useEffect(() => {
    if (rescheduleData) {
      setFormData((prev) => ({
        ...prev,
        fullName: rescheduleData.patientName || prev.fullName,
        mobileNumber: rescheduleData.patientPhone || prev.mobileNumber,
        email: rescheduleData.patientEmail || prev.email,
        gender: rescheduleData.patientGender || prev.gender,
        age: rescheduleData.patientAge ? String(rescheduleData.patientAge) : prev.age,
        city: rescheduleData.city || prev.city,
        reasonForVisit: rescheduleData.reason || rescheduleData.title
          ? String(rescheduleData.reason || rescheduleData.title).replace(/[^a-zA-Z\s]/g, '').slice(0, 35)
          : prev.reasonForVisit,
        appointmentId: rescheduleData.appointmentId || rescheduleData.id || prev.appointmentId,
      }));
    }
  }, [rescheduleData]);

  const handleCancelReschedule = () => {
    setRescheduleData(null);
    setIsRescheduledSuccess(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kss_reschedule_appointment');
      } catch {}
    }
    setCurrentStep(1);
  };

  const handleStartNewBooking = () => {
    setCurrentStep(1);
    setIsRescheduledSuccess(false);
    setRescheduleData(null);
    setConfirmedData(null);
    setErrors({});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kss_reschedule_appointment');
      } catch {}
    }

    const full = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.name || user?.full_name || user?.username || '';
    setFormData((prev) => ({
      ...prev,
      reasonForVisit: '',
      selectedDay: new Date().getDate(),
      selectedMonth: new Date().getMonth(),
      selectedYear: new Date().getFullYear(),
      selectedTimeSlot: '',
      appointmentId: '',
      fullName: prev.fullName || full,
      mobileNumber: prev.mobileNumber || user?.phone_number || user?.phone || '',
      email: prev.email || user?.email || '',
    }));

    setTimeout(() => {
      const formEl = document.getElementById('booking-form-section') || document.querySelector('.booking-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 320, behavior: 'smooth' });
      }
    }, 50);
  };

  useEffect(() => {
    const handleReset = () => {
      handleStartNewBooking();
    };
    window.addEventListener('reset-booking-form', handleReset);
    return () => {
      window.removeEventListener('reset-booking-form', handleReset);
    };
  }, [user]);



  // Calendar view month & year state - automatically opens with today's month & year

  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());

  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());



  const months = [

    'January', 'February', 'March', 'April', 'May', 'June',

    'July', 'August', 'September', 'October', 'November', 'December',

  ];



  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Synchronized appointment settings state from Admin
  const [workingDays, setWorkingDays] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const days = parsed.workingDays || parsed.working_days;
        if (Array.isArray(days) && days.length > 0) return days;
      }
    } catch {}
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  });

  const [dateRestrictions, setDateRestrictions] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const restrs = parsed.dateRestrictions || parsed.date_restrictions;
        if (Array.isArray(restrs)) return restrs;
      }
    } catch {}
    return [];
  });

  const [closedDateModal, setClosedDateModal] = useState({
    isOpen: false,
    dateFormatted: '',
    reason: '',
  });

  const [consultationHours, setConsultationHours] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const ch = parsed.consultationHours || parsed.consultation_hours;
        if (ch) return ch;
      }
    } catch {}
    return '09:00 AM - 06:00 PM';
  });

  const [slotDuration, setSlotDuration] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const sd = parsed.slotDuration || parsed.slot_duration;
        if (sd) return sd;
      }
    } catch {}
    return '30 Minutes';
  });

  const [customWorkingHours, setCustomWorkingHours] = useState(() => {
    try {
      const cached = localStorage.getItem('clinic_appointment_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        const cwh = parsed.customWorkingHours || parsed.custom_working_hours;
        if (Array.isArray(cwh)) return cwh;
      }
    } catch {}
    return [];
  });

  // Helper to check if a date is restricted
  const checkDateRestricted = (y, m, d) => {
    if (!dateRestrictions || !Array.isArray(dateRestrictions) || dateRestrictions.length === 0) {
      return { isRestricted: false, reason: '' };
    }
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateNorm = `${y}-${mStr}-${dStr}`;
    const monthNorm = `${y}-${mStr}`;
    for (const r of dateRestrictions) {
      if (!r || typeof r !== 'object') continue;
      const start = r.startDate || r.start_date || r.date;
      const end = r.endDate || r.end_date || start;
      const rMonth = r.month || (r.type === 'month' ? (start ? String(start).substring(0, 7) : null) : null);
      if (r.type === 'month' || rMonth) {
        if (rMonth === monthNorm || (start && end && start <= dateNorm && dateNorm <= end)) {
          return {
            isRestricted: true,
            reason: r.reason || 'Entire month closed',
          };
        }
      }
      if (start && end) {
        if (start <= dateNorm && dateNorm <= end) {
          return {
            isRestricted: true,
            reason: r.reason || 'Clinic closed on this date',
          };
        }
      }
    }
    return { isRestricted: false, reason: '' };
  };

  // Helper to convert time format to minutes from midnight
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return null;
    const cleaned = String(timeStr).trim().toUpperCase();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (!match) return null;
    let [_, h, m, period] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper to format dynamic clinic schedule rows for the sidebar card
  const getClinicScheduleRows = () => {
    const ALL_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const DAY_LABELS = {
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    };

    if (!workingDays || workingDays.length === 0) {
      return [{ label: 'All Days', timings: 'Closed', isClosed: true }];
    }

    const cleanHours = (consultationHours || '09:00 AM - 06:00 PM')
      .replace(/-/g, '–')
      .replace(/\b0(\d):/g, '$1:');

    const openDays = ALL_WEEKDAYS.filter((d) => workingDays.includes(d));
    const closedDays = ALL_WEEKDAYS.filter((d) => !workingDays.includes(d));

    const formatDayList = (days) => {
      if (!days || days.length === 0) return '';
      if (days.length === 1) return DAY_LABELS[days[0]];
      if (days.length === 7) return 'Monday – Sunday';
      const idxs = days.map((d) => ALL_WEEKDAYS.indexOf(d));
      const isContiguous = idxs.every((val, i, arr) => i === 0 || val === arr[i - 1] + 1);
      if (isContiguous) {
        return `${DAY_LABELS[days[0]]} – ${DAY_LABELS[days[days.length - 1]]}`;
      }
      return days.map((d) => DAY_LABELS[d]).join(', ');
    };

    const rows = [];
    if (openDays.length > 0) {
      rows.push({
        label: formatDayList(openDays),
        timings: cleanHours,
        isClosed: false,
      });
    }
    if (closedDays.length > 0) {
      rows.push({
        label: formatDayList(closedDays),
        timings: 'Closed',
        isClosed: true,
      });
    }
    return rows;
  };

  const getSelectedDateTimingInfo = () => {
    if (!formData.selectedDay) return null;
    const dObj = new Date(formData.selectedYear, formData.selectedMonth, formData.selectedDay);
    const dayOfWeekName = daysOfWeek[dObj.getDay()];
    const isWorking = workingDays.includes(dayOfWeekName);
    const { isRestricted, reason: restrictionReason } = checkDateRestricted(
      formData.selectedYear,
      formData.selectedMonth,
      formData.selectedDay
    );
    const eff = getEffectiveWorkingHours(
      formData.selectedYear,
      formData.selectedMonth,
      formData.selectedDay
    );

    const monthShort = months[formData.selectedMonth]?.slice(0, 3) || '';
    const dateLabel = `${formData.selectedDay} ${monthShort} ${formData.selectedYear}`;

    if (!isWorking || isRestricted) {
      return {
        label: `${dateLabel} (Selected)`,
        timings: 'Closed',
        isClosed: true,
      };
    }

    if (eff.isCustom) {
      const cleanCustom = `${eff.startTime} – ${eff.endTime}`.replace(/\b0(\d):/g, '$1:');
      return {
        label: `${dateLabel} (${eff.reason || 'Special Hours'})`,
        timings: cleanCustom,
        isClosed: false,
      };
    }

    return null;
  };

  // Helper to determine effective working hours for a specific date
  const getEffectiveWorkingHours = (y, m, d) => {
    const mStr = String(m + 1).padStart(2, '0');
    const dStr = String(d).padStart(2, '0');
    const dateNorm = `${y}-${mStr}-${dStr}`;
    if (customWorkingHours && Array.isArray(customWorkingHours) && customWorkingHours.length > 0) {
      for (const ch of customWorkingHours) {
        if (!ch || typeof ch !== 'object') continue;
        const start = ch.startDate || ch.start_date || ch.date;
        const end = ch.endDate || ch.end_date || start;
        if (start && end && start <= dateNorm && dateNorm <= end) {
          return {
            startTime: ch.startTime || ch.start_time || '09:00 AM',
            endTime: ch.endTime || ch.end_time || '06:00 PM',
            isCustom: true,
            reason: ch.reason || 'Special working hours',
          };
        }
      }
    }
    const defParts = (consultationHours || '09:00 AM - 06:00 PM').split(' - ');
    const defStart = defParts[0]?.trim() || '09:00 AM';
    const defEnd = defParts[1]?.trim() || '06:00 PM';
    return {
      startTime: defStart,
      endTime: defEnd,
      isCustom: false,
      reason: '',
    };
  };

  useEffect(() => {
    const fetchAppointmentSettings = async () => {
      try {
        const data = await appointmentApi.getAppointmentSettings();
        if (data) {
          const days = data?.workingDays || data?.working_days;
          if (Array.isArray(days) && days.length > 0) setWorkingDays(days);
          const restrs = data?.dateRestrictions || data?.date_restrictions;
          if (Array.isArray(restrs)) setDateRestrictions(restrs);
          const cwh = data?.customWorkingHours || data?.custom_working_hours;
          if (Array.isArray(cwh)) setCustomWorkingHours(cwh);
          const ch = data?.consultationHours || data?.consultation_hours;
          if (ch) setConsultationHours(ch);
          const sd = data?.slotDuration || data?.slot_duration;
          if (sd) setSlotDuration(sd);
          try {
            localStorage.setItem('clinic_appointment_settings', JSON.stringify(data));
          } catch {}
        }
      } catch (err) {
        console.log('Using cached or default appointment settings');
      }
    };
    fetchAppointmentSettings();

    const handleSettingsUpdated = (e) => {
      const detail = e?.detail || {};
      const days = detail?.workingDays || detail?.working_days;
      if (Array.isArray(days)) setWorkingDays(days);
      const restrs = detail?.dateRestrictions || detail?.date_restrictions;
      if (Array.isArray(restrs)) setDateRestrictions(restrs);
      const cwh = detail?.customWorkingHours || detail?.custom_working_hours;
      if (Array.isArray(cwh)) setCustomWorkingHours(cwh);
      const ch = detail?.consultationHours || detail?.consultation_hours;
      if (ch) setConsultationHours(ch);
      const sd = detail?.slotDuration || detail?.slot_duration;
      if (sd) setSlotDuration(sd);
    };

    const handleStorageChange = (e) => {
      if (e.key === 'clinic_appointment_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const days = parsed.workingDays || parsed.working_days;
          if (Array.isArray(days)) setWorkingDays(days);
          const restrs = parsed.dateRestrictions || parsed.date_restrictions;
          if (Array.isArray(restrs)) setDateRestrictions(restrs);
          const cwh = parsed.customWorkingHours || parsed.custom_working_hours;
          if (Array.isArray(cwh)) setCustomWorkingHours(cwh);
          const ch = parsed.consultationHours || parsed.consultation_hours;
          if (ch) setConsultationHours(ch);
          const sd = parsed.slotDuration || parsed.slot_duration;
          if (sd) setSlotDuration(sd);
        } catch {}
      }
    };

    window.addEventListener('appointment-settings-updated', handleSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', fetchAppointmentSettings);
    return () => {
      window.removeEventListener('appointment-settings-updated', handleSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', fetchAppointmentSettings);
    };
  }, []);

  // Ensure initially selected day is not on a disabled working day or restricted date
  useEffect(() => {
    if (!workingDays || workingDays.length === 0) return;
    const curDate = new Date(formData.selectedYear, formData.selectedMonth, formData.selectedDay);
    const dayOfWeekName = daysOfWeek[curDate.getDay()];
    const { isRestricted } = checkDateRestricted(formData.selectedYear, formData.selectedMonth, formData.selectedDay);

    if (!workingDays.includes(dayOfWeekName) || isRestricted) {
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      const target = curDate < base ? base : curDate;
      for (let offset = 0; offset <= 90; offset++) {
        const candidate = new Date(target);
        candidate.setDate(target.getDate() + offset);
        const candidateDayName = daysOfWeek[candidate.getDay()];
        const candY = candidate.getFullYear();
        const candM = candidate.getMonth();
        const candD = candidate.getDate();
        const { isRestricted: candRestr } = checkDateRestricted(candY, candM, candD);

        if (workingDays.includes(candidateDayName) && !candRestr) {
          setFormData((prev) => ({
            ...prev,
            selectedDay: candD,
            selectedMonth: candM,
            selectedYear: candY,
          }));
          setCalendarMonth(candM);
          setCalendarYear(candY);
          break;
        }
      }
    }
  }, [workingDays, dateRestrictions]);



  // Dynamic Time Slots generator using clinic settings (consultation hours & slot duration)
  const generateDynamicSlots = useCallback((startStr, endStr, durationStr) => {
    const match = String(durationStr || '').match(/\d+/);
    const durationMins = match ? parseInt(match[0], 10) : 30;
    if (durationMins <= 0) return [];

    const startMins = timeToMinutes(startStr) ?? (9 * 60);
    const endMins = timeToMinutes(endStr) ?? (18 * 60);

    const generated = [];
    for (let cur = startMins; cur < endMins; cur += durationMins) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      const period = h >= 12 ? 'PM' : 'AM';
      const dispH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
      const timeLabel = `${String(dispH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      generated.push({ time: timeLabel, defaultAvailable: true });
    }
    return generated;
  }, []);

  const [bookedSlotsMap, setBookedSlotsMap] = useState({});

  const normalizeSlotTime = (t) => {
    if (!t) return '';
    const start = t.split('-')[0].trim();
    return start.toUpperCase().replace(/^0/, '');
  };

  const fetchBookedSlots = async (targetDateStr) => {
    try {
      const formattedDate = targetDateStr || `${formData.selectedYear}-${String(formData.selectedMonth + 1).padStart(2, '0')}-${String(formData.selectedDay).padStart(2, '0')}`;
      const data = await appointmentApi.getBookedSlots(formattedDate);
      if (data?.all_booked_slots) {
        setBookedSlotsMap(data.all_booked_slots);
      }
      if (data?.booked_slots && Array.isArray(data.booked_slots)) {
        setBookedSlotsMap((prev) => ({
          ...prev,
          [formattedDate]: data.booked_slots,
          ...(data.normalized_date ? { [data.normalized_date]: data.booked_slots } : {}),
        }));
      }
      if (data?.slotDuration || data?.slot_duration) {
        setSlotDuration(data.slotDuration || data.slot_duration);
      }
      if (data?.consultationHours || data?.consultation_hours) {
        setConsultationHours(data.consultationHours || data.consultation_hours);
      }
      if (data?.workingDays || data?.working_days) {
        setWorkingDays(data.workingDays || data.working_days);
      }
    } catch (err) {
      console.warn('Could not fetch booked slots:', err);
    }
  };

  useEffect(() => {
    const formattedDate = `${formData.selectedYear}-${String(formData.selectedMonth + 1).padStart(2, '0')}-${String(formData.selectedDay).padStart(2, '0')}`;
    fetchBookedSlots(formattedDate);

    const handleRefreshSlots = () => {
      fetchBookedSlots(formattedDate);
    };

    const handleStorageSync = (e) => {
      if (e.key === 'kss_appointment_sync') {
        fetchBookedSlots(formattedDate);
      }
    };

    window.addEventListener('appointment-booked', handleRefreshSlots);
    window.addEventListener('appointment-updated', handleRefreshSlots);
    window.addEventListener('appointment-deleted', handleRefreshSlots);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      window.removeEventListener('appointment-booked', handleRefreshSlots);
      window.removeEventListener('appointment-updated', handleRefreshSlots);
      window.removeEventListener('appointment-deleted', handleRefreshSlots);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, [formData.selectedYear, formData.selectedMonth, formData.selectedDay]);

  const getSelectedDateKeys = () => {
    const day = formData.selectedDay;
    const month = formData.selectedMonth;
    const year = formData.selectedYear;
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const normKey = `${year}-${mStr}-${dStr}`;
    const rawKey = `${day} ${months[month]} ${year}`;
    const shortRawKey = `${day} ${months[month]?.slice(0, 3)} ${year}`;
    const slashKey = `${dStr}/${mStr}/${year}`;
    const slashKeyAlt = `${day}/${month + 1}/${year}`;
    return [normKey, rawKey, shortRawKey, slashKey, slashKeyAlt];
  };

  const getBookedSlotsForSelectedDate = () => {
    const keys = getSelectedDateKeys();
    const set = new Set();
    keys.forEach((k) => {
      if (bookedSlotsMap[k]) {
        bookedSlotsMap[k].forEach((slot) => {
          const norm = normalizeSlotTime(slot);
          if (norm) set.add(norm);
        });
      }
    });
    return set;
  };

  const bookedSet = getBookedSlotsForSelectedDate();

  const effectiveHours = getEffectiveWorkingHours(
    formData.selectedYear,
    formData.selectedMonth,
    formData.selectedDay
  );
  const startMins = timeToMinutes(effectiveHours.startTime);
  const endMins = timeToMinutes(effectiveHours.endTime);

  const baseTimeSlots = useMemo(() => {
    return generateDynamicSlots(effectiveHours.startTime, effectiveHours.endTime, slotDuration);
  }, [generateDynamicSlots, effectiveHours.startTime, effectiveHours.endTime, slotDuration]);

  const timeSlots = useMemo(() => {
    return baseTimeSlots.map((slot) => {
      const norm = normalizeSlotTime(slot.time);
      const isBooked = bookedSet.has(norm);
      const slotMins = timeToMinutes(slot.time);
      const isOutsideHours =
        slotMins !== null &&
        startMins !== null &&
        endMins !== null &&
        (slotMins < startMins || slotMins >= endMins);
      // Display only genuinely booked slots as unavailable
      const isAvailable = slot.defaultAvailable && !isBooked && !isOutsideHours;

      return {
        ...slot,
        available: isAvailable,
        isBooked,
        isOutsideHours,
      };
    });
  }, [baseTimeSlots, bookedSet, startMins, endMins]);



  const handleChange = (e) => {

    const { name, value } = e.target;



    if (name === 'fullName') {

      // Rule 1: Limit 25 characters, only alphabetic characters and spaces

      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);

      if (/[^a-zA-Z\s]/.test(value)) {

        setErrors((prev) => ({

          ...prev,

          fullName: 'Only alphabets and spaces are allowed',

        }));

      } else if (errors.fullName) {

        setErrors((prev) => ({ ...prev, fullName: '' }));

      }

      setFormData((prev) => ({ ...prev, fullName: cleaned }));

      return;

    }



    if (name === 'mobileNumber') {

      // Rule 2: Limit 10 digits, must start with 6, 7, 8, or 9

      let digits = value.replace(/\D/g, '');



      // In case full number with 91 is entered or pasted

      if (digits.length > 10 && digits.startsWith('91')) {

        digits = digits.slice(2);

      }



      if (/\D/.test(value)) {

        setErrors((prev) => ({

          ...prev,

          mobileNumber: 'Only numbers are allowed',

        }));

      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {

        setErrors((prev) => ({

          ...prev,

          mobileNumber: 'Mobile number must start with 6, 7, 8, or 9',

        }));

        return;

      } else if (errors.mobileNumber) {

        setErrors((prev) => ({ ...prev, mobileNumber: '' }));

      }



      digits = digits.slice(0, 10);

      setFormData((prev) => ({ ...prev, mobileNumber: digits }));

      return;

    }



    if (name === 'email') {

      // Rule 3: Email format; no words or characters allowed after .com

      let val = value.replace(/\s/g, '');

      const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);

      if (comMatch) {

        val = comMatch[1];

        setErrors((prev) => ({

          ...prev,

          email: 'No words or characters allowed after .com',

        }));

      } else if (errors.email) {

        setErrors((prev) => ({ ...prev, email: '' }));

      }

      setFormData((prev) => ({ ...prev, email: val }));

      return;

    }

    if (name === 'dateOfBirth') {

      if (value) {
        const birthYear = new Date(value).getFullYear();
        const currentYear = new Date().getFullYear();
        const calcAge = Math.max(0, currentYear - birthYear);
        setFormData((prev) => ({
          ...prev,
          dateOfBirth: value,
          age: prev.age || (calcAge > 0 ? calcAge.toString() : ''),
        }));
      } else {
        setFormData((prev) => ({ ...prev, dateOfBirth: '' }));
      }
      if (errors.age) {
        setErrors((prev) => ({ ...prev, age: '' }));
      }
      return;

    }



    if (name === 'reasonForVisit') {
      // Rule: Limit 35 characters, only alphabetic characters and spaces
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 35);
      if (/[^a-zA-Z\s]/.test(value)) {
        setErrors((prev) => ({
          ...prev,
          reasonForVisit: 'Only alphabets and spaces are allowed',
        }));
      } else if (errors.reasonForVisit) {
        setErrors((prev) => ({ ...prev, reasonForVisit: '' }));
      }
      setFormData((prev) => ({ ...prev, reasonForVisit: cleaned }));
      return;
    }



    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {

      setErrors((prev) => ({ ...prev, [name]: '' }));

    }

  };



  const validateStep1 = () => {

    const newErrors = {};



    // 1. Full Name Validation: non-empty, letters & spaces only, max 25 chars

    const nameTrimmed = (formData.fullName || '').trim();

    if (!nameTrimmed) {

      newErrors.fullName = 'Full Name is required';

    } else if (nameTrimmed.length > 25) {

      newErrors.fullName = 'Full Name cannot exceed 25 characters';

    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {

      newErrors.fullName = 'Only alphabets and spaces are allowed';

    }



    // 2. Mobile Number Validation: exactly 10 digits, starts with 6, 7, 8, or 9

    const mobileDigits = (formData.mobileNumber || '').replace(/\D/g, '');

    if (!mobileDigits) {

      newErrors.mobileNumber = 'Whatsapp Mobile Number is required';

    } else if (mobileDigits.length !== 10) {

      newErrors.mobileNumber = 'Mobile number must be exactly 10 digits';

    } else if (!/^[6-9]/.test(mobileDigits)) {

      newErrors.mobileNumber = 'Mobile number must start with 6, 7, 8, or 9';

    }



    // 3. Email Validation (if provided): proper email format ending in valid domain, no extra chars after .com

    const emailVal = (formData.email || '').trim();

    if (emailVal) {

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailRegex.test(emailVal)) {

        newErrors.email = 'Please enter a valid email address (e.g. name@example.com)';

      } else if (/\.com.+$/i.test(emailVal)) {

        newErrors.email = 'No words or characters allowed after .com';

      }

    }



    // 4. Age / Date of Birth Validation

    if (formData.dateOfBirth) {
      // Valid date of birth supplied
    } else if (formData.age.toString().trim()) {
      if (isNaN(formData.age) || Number(formData.age) <= 0 || Number(formData.age) > 120) {
        newErrors.age = 'Enter a valid age (1 - 120)';
      }
    }



    // 5. Reason for Visit (Required): max 35 characters, alphabets & spaces only
    const reasonTrimmed = (formData.reasonForVisit || '').trim();
    if (!reasonTrimmed) {
      newErrors.reasonForVisit = 'Reason for visit is required';
    } else if (reasonTrimmed.length > 35) {
      newErrors.reasonForVisit = 'Reason cannot exceed 35 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(reasonTrimmed)) {
      newErrors.reasonForVisit = 'Only alphabets and spaces are allowed';
    }



    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;

  };



  const handleNextStep = async (e) => {

    if (e) e.preventDefault();



    if (currentStep === 1) {

      if (validateStep1()) {

        setCurrentStep(2);

        window.scrollTo({ top: 260, behavior: 'smooth' });

      }

    } else if (currentStep === 2) {

      // Ensure the selected date is not in the past

      const selectedDateZero = new Date(formData.selectedYear, formData.selectedMonth, formData.selectedDay);

      selectedDateZero.setHours(0, 0, 0, 0);

      const todayZero = new Date();

      todayZero.setHours(0, 0, 0, 0);

      if (selectedDateZero < todayZero) {

        alert('You cannot select or book an appointment for a past date. Please select today or a future date.');

        return;

      }
      // Ensure the selected date is on an active working day
      const selectedDayName = daysOfWeek[selectedDateZero.getDay()];
      if (!workingDays.includes(selectedDayName)) {
        setClosedDateModal({
          isOpen: true,
          dateFormatted: `${formData.selectedDay} ${months[formData.selectedMonth]} ${formData.selectedYear}`,
          reason: `The clinic is closed on ${selectedDayName}s. Please select an open working day.`,
        });
        return;
      }

      // Ensure the selected date is not restricted
      const { isRestricted: isDateRestrictedOnNext, reason: nextRestrReason } = checkDateRestricted(formData.selectedYear, formData.selectedMonth, formData.selectedDay);
      if (isDateRestrictedOnNext) {
        setClosedDateModal({
          isOpen: true,
          dateFormatted: `${formData.selectedDay} ${months[formData.selectedMonth]} ${formData.selectedYear}`,
          reason: nextRestrReason || 'Clinic closed on this date',
        });
        return;
      }



      // Ensure a time slot has been chosen and is available
      if (!formData.selectedTimeSlot) {
        alert('Please select an available time slot for your appointment.');
        return;
      }

      const currentSlotObj = timeSlots.find(
        (s) => normalizeSlotTime(s.time) === normalizeSlotTime(formData.selectedTimeSlot)
      );

      if (!currentSlotObj || !currentSlotObj.available) {
        alert('The selected time slot is no longer available. Please choose another time slot.');
        fetchBookedSlots();
        return;
      }

      setBookingLoading(true);
      const formattedDate = `${formData.selectedDay} ${months[formData.selectedMonth]} ${formData.selectedYear}`;

      try {
        if (rescheduleData) {
          const targetId = rescheduleData.appointmentId || rescheduleData.id;
          const chosenTime = formData.selectedTimeSlot;
          const chosenReason = formData.reasonForVisit?.trim() || '';
          const res = await appointmentApi.rescheduleAppointment(targetId, {
            appointment_date: formattedDate,
            time_slot: chosenTime,
            reason_for_visit: chosenReason,
            status: 'Rescheduled',
          });

          const realId = res?.appointment?.appointment_id || res?.appointment_id || targetId;
          const finalTime = res?.appointment?.time_slot || res?.time_slot || chosenTime;
          const finalReason = res?.appointment?.reason_for_visit !== undefined ? res.appointment.reason_for_visit : (res?.reason_for_visit !== undefined ? res.reason_for_visit : chosenReason);

          setFormData((prev) => ({
            ...prev,
            appointmentId: realId,
            selectedTimeSlot: finalTime,
            reasonForVisit: finalReason,
          }));
          setConfirmedData({
            appointmentId: realId,
            fullName: formData.fullName,
            mobileNumber: formData.mobileNumber,
            email: formData.email,
            date: formattedDate,
            time: finalTime,
            reason: finalReason,
          });
          setIsRescheduledSuccess(true);

          // Immediately update bookedSlotsMap: release original slot and reserve newly selected slot
          const [normK, rawK] = getSelectedDateKeys();
          const oldTimeNorm = normalizeSlotTime(rescheduleData?.time);
          const newTimeNorm = normalizeSlotTime(formData.selectedTimeSlot);

          setBookedSlotsMap((prev) => {
            const next = { ...prev };
            [normK, rawK].forEach((k) => {
              const currentList = Array.isArray(next[k]) ? next[k] : [];
              const filtered = currentList.filter((s) => normalizeSlotTime(s) !== oldTimeNorm);
              next[k] = [...filtered, formData.selectedTimeSlot];
            });
            return next;
          });

          // Also re-fetch booked slots to sync directly with backend truth
          fetchBookedSlots();

          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('kss_reschedule_appointment');
            } catch {}
            if (realId) localStorage.setItem('kss_last_appointment_id', realId);
            window.dispatchEvent(new CustomEvent('appointment-updated', { detail: res }));
            window.dispatchEvent(new CustomEvent('appointment-booked', { detail: res }));
          }

          setCurrentStep(3);
          setTimeout(() => {
            const bookingCardEl = document.querySelector('.booking-card');
            if (bookingCardEl) {
              bookingCardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }
          }, 50);
          return;
        }

        const chosenTime = formData.selectedTimeSlot;
        const chosenReason = formData.reasonForVisit?.trim() || '';
        const res = await appointmentApi.bookAppointment({
          patient_name: formData.fullName,
          patient_phone: formData.mobileNumber,
          patient_email: formData.email,
          gender: formData.gender,
          date_of_birth: formData.dateOfBirth,
          dateOfBirth: formData.dateOfBirth,
          age: formData.age,
          city: formData.city,
          appointment_date: formattedDate,
          time_slot: chosenTime,
          reason_for_visit: chosenReason,
          consultation_type: 'In clinic Visit',
          status: 'Confirmed',
        });

        const realId = res?.appointment?.appointment_id || res?.appointment_id || `APT-${Date.now().toString().slice(-6)}`;
        const finalTime = res?.appointment?.time_slot || res?.time_slot || chosenTime;
        const finalReason = res?.appointment?.reason_for_visit !== undefined ? res.appointment.reason_for_visit : (res?.reason_for_visit !== undefined ? res.reason_for_visit : chosenReason);

        setFormData((prev) => ({
          ...prev,
          appointmentId: realId,
          selectedTimeSlot: finalTime,
          reasonForVisit: finalReason,
        }));
        setConfirmedData({
          appointmentId: realId,
          fullName: formData.fullName,
          mobileNumber: formData.mobileNumber,
          email: formData.email,
          date: formattedDate,
          time: finalTime,
          reason: finalReason,
        });



        // Immediately update bookedSlotsMap so slot is disabled

        const [normK, rawK] = getSelectedDateKeys();

        setBookedSlotsMap((prev) => ({

          ...prev,

          [normK]: [...(prev[normK] || []), formData.selectedTimeSlot],

          [rawK]: [...(prev[rawK] || []), formData.selectedTimeSlot],

        }));



        if (typeof window !== 'undefined') {
          if (realId) localStorage.setItem('kss_last_appointment_id', realId);
          window.dispatchEvent(new CustomEvent('appointment-booked', { detail: res }));
        }

        setCurrentStep(3);

        setTimeout(() => {
          const bookingCardEl = document.querySelector('.booking-card');
          if (bookingCardEl) {
            bookingCardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 200, behavior: 'smooth' });
          }
        }, 50);

      } catch (err) {

        console.error('Booking failed:', err);

        fetchBookedSlots();

        alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to book appointment. Please try again.');

      } finally {

        setBookingLoading(false);

      }

    }

  };



  // Helper to check if a date is before today

  const isDateInPast = (year, month, day) => {

    const target = new Date(year, month, day);

    target.setHours(0, 0, 0, 0);

    const todayZero = new Date();

    todayZero.setHours(0, 0, 0, 0);

    return target < todayZero;

  };



  // Helper to check if navigating to previous month is blocked because it is in the past

  const isPrevMonthDisabled = () => {

    const now = new Date();

    const currentYear = now.getFullYear();

    const currentMonth = now.getMonth();

    let prevM = calendarMonth - 1;

    let prevY = calendarYear;

    if (prevM < 0) {

      prevM = 11;

      prevY -= 1;

    }

    if (prevY < currentYear) return true;

    if (prevY === currentYear && prevM < currentMonth) return true;

    return false;

  };



  // Calendar Helpers

  const handlePrevMonth = () => {

    if (isPrevMonthDisabled()) return;

    if (calendarMonth === 0) {

      setCalendarMonth(11);

      setCalendarYear((y) => y - 1);

    } else {

      setCalendarMonth((m) => m - 1);

    }

  };



  const handleNextMonth = () => {

    if (calendarMonth === 11) {

      setCalendarMonth(0);

      setCalendarYear((y) => y + 1);

    } else {

      setCalendarMonth((m) => m + 1);

    }

  };



  const handleSelectDate = (day, isCurrentMonth, isPast) => {

    if (!isCurrentMonth || isPast) return;

    const dObj = new Date(calendarYear, calendarMonth, day);
    const dayOfWeekName = daysOfWeek[dObj.getDay()];
    if (!workingDays.includes(dayOfWeekName)) {
      return; // Cannot select closed day
    }

    const { isRestricted } = checkDateRestricted(calendarYear, calendarMonth, day);
    if (isRestricted) {
      return; // Cannot select restricted date
    }

    setFormData((prev) => ({
      ...prev,
      selectedDay: day,
      selectedMonth: calendarMonth,
      selectedYear: calendarYear,
      selectedTimeSlot: '',
    }));

  };



  // Generate calendar days for month view - past dates and filler days disabled

  const generateCalendarDays = () => {

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();

    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();



    const days = [];



    // Previous month filler days (always disabled)

    for (let i = firstDay - 1; i >= 0; i--) {

      days.push({

        day: daysInPrevMonth - i,

        isCurrentMonth: false,

        isPast: true,

        hasDot: false,

      });

    }



    // Current month days

    for (let i = 1; i <= daysInMonth; i++) {

      const isPast = isDateInPast(calendarYear, calendarMonth, i);
      const dObj = new Date(calendarYear, calendarMonth, i);
      const dayOfWeekName = daysOfWeek[dObj.getDay()];
      const isWorkingDay = workingDays.includes(dayOfWeekName);
      const { isRestricted, reason: restrictionReason } = checkDateRestricted(calendarYear, calendarMonth, i);
      const isDisabled = isPast || !isWorkingDay || isRestricted;

      // Days with availability dot: only available for today and future non-restricted working days
      const hasDot = !isDisabled;

      days.push({

        day: i,

        isCurrentMonth: true,

        isPast,

        isWorkingDay,

        isDateRestricted: isRestricted,

        restrictionReason,

        isDisabled,

        hasDot,

      });

    }



    // Next month filler days to complete grid (multiples of 7)

    const remaining = (7 - (days.length % 7)) % 7;

    for (let i = 1; i <= remaining; i++) {

      days.push({

        day: i,

        isCurrentMonth: false,

        isPast: false,

        hasDot: false,

      });

    }



    return days;

  };



  const formatSelectedFullDate = () => {

    const d = new Date(formData.selectedYear, formData.selectedMonth, formData.selectedDay);

    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

    const monthName = months[formData.selectedMonth];

    return `${dayName}, ${formData.selectedDay} ${monthName} ${formData.selectedYear}`;

  };



  // Handle PDF Download / Print
  const handleDownloadPdf = () => {
    try {
      const reasonVal = (confirmedData ? confirmedData.reason : formData.reasonForVisit)?.trim() || '';
      const timeVal = confirmedData?.time || formData.selectedTimeSlot || '';
      const dateVal = confirmedData?.date || formatSelectedFullDate();
      const idVal = confirmedData?.appointmentId || formData.appointmentId;
      downloadAppointmentConfirmationPdf({
        appointmentId: idVal,
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        doctorName: 'Dr. K. Tripathi Ampeh (Pat.)',
        service: reasonVal,
        reason: reasonVal,
        date: dateVal,
        time: timeVal,
        clinicAddress: '123 Clinic Street, Your City,\nYour State - 123456',
        clinicPhone: '+91 98765 43210',
      });
    } catch (err) {
      console.error('Error generating appointment PDF:', err);
      window.print();
    }
  };

  // Handle WhatsApp action
  const handleWhatsappSend = () => {
    const timeVal = confirmedData?.time || formData.selectedTimeSlot || '';
    const dateVal = confirmedData?.date || formatSelectedFullDate();
    const idVal = confirmedData?.appointmentId || formData.appointmentId;
    const text = encodeURIComponent(
      `Hello Dr. Kumar Tripathi Ampeh Clinic, my appointment is confirmed with ID: ${idVal} for ${dateVal}${timeVal ? ` at ${timeVal}` : ''}.`
    );
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };



  return (

    <div

      className="booking-page-wrapper"

      style={{

        backgroundColor: '#f8faf9',

        minHeight: '100vh',

        display: 'flex',

        flexDirection: 'column',

        flex: 1,

        width: '100%',

        maxWidth: '100vw',

        overflowX: 'hidden',

        margin: 0,

        padding: 0,

      }}

    >

      {/* Top Navbar */}
      <Navbar
        onOpenBooking={handleStartNewBooking}
      />



      {/* Patient Auth Modal */}

      <PatientAuthModal

        isOpen={showAuthModal}

        onClose={() => setShowAuthModal(false)}

        onSuccess={(authenticatedUser) => {

          setShowAuthModal(false);

        }}

      />

      {/* Pop-up dialog when patient clicks a closed or restricted date */}
      {closedDateModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="closed-date-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setClosedDateModal({ isOpen: false, dateFormatted: '', reason: '' })}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              padding: '28px 24px 22px',
              width: '100%',
              maxWidth: '420px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 8px',
                letterSpacing: '-0.2px',
              }}
            >
              Clinic is closed on this date.
            </h3>

            {closedDateModal.dateFormatted && (
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f1f5f9',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: '600',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  marginBottom: '12px',
                }}
              >
                📅 {closedDateModal.dateFormatted}
              </div>
            )}

            <p
              style={{
                fontSize: '13.5px',
                color: '#64748b',
                lineHeight: '1.5',
                margin: '0 0 22px',
              }}
            >
              {closedDateModal.reason
                ? closedDateModal.reason
                : 'Appointments cannot be booked for this date as the clinic is closed. Please choose another date.'}
            </p>

            <button
              type="button"
              className="btn-ok-closed-date"
              onClick={() => setClosedDateModal({ isOpen: false, dateFormatted: '', reason: '' })}
              style={{
                width: '100%',
                padding: '11px 20px',
                backgroundColor: '#1b4332',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#143326')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
            >
              OK
            </button>
          </div>
        </div>
      )}




      {/* Div 1: Hero Header Banner with Sleek Compact Height matching Reference Image */}

      <section

        aria-label="Book Your Appointment"

        className="booking-hero-banner"

        style={{

          position: 'relative',

          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

          height: 'clamp(220px, 18vw, 275px)',

          backgroundColor: '#143420',

          overflow: 'hidden',

          display: 'block',

          margin: 0,

          padding: 0,

        }}

      >

        {/* Banner Background Image with exact framing matching reference */}

        <img

          src={bookingBannerClean}

          alt=""

          aria-hidden="true"

          className="booking-hero-banner-image"

          style={{

            width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

            height: '100%',

            objectFit: 'cover',

            objectPosition: 'right center',

            display: 'block',

            margin: 0,

            padding: 0,

          }}

        />



        {/* Soft, light gradient overlay: luminous and natural without heavy dark shadow */}

        <div
          className="booking-hero-banner-overlay"
          style={{

            position: 'absolute',

            top: 0,

            left: 0,

            width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

            height: '100%',

            background:

              'linear-gradient(90deg, rgba(16, 46, 26, 0.52) 0%, rgba(16, 46, 26, 0.28) 26%, rgba(16, 46, 26, 0.06) 40%, rgba(16, 46, 26, 0) 52%)',

            pointerEvents: 'none',

          }}

        />



        {/* Real HTML Text Layer placed over the soft green bokeh area */}

        <div

          className="booking-banner-content-layer"

          style={{

            position: 'absolute',

            top: 0,

            left: 0,

            width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

            height: '100%',

            display: 'flex',

            alignItems: 'center',

            lineHeight: '1.2',

            pointerEvents: 'none',

          }}

        >

          <div

            className="booking-banner-inner"

            style={{

              width: '100%',

              maxWidth: '1440px',

              margin: '0 auto',

              padding: '0 40px',

              boxSizing: 'border-box',

            }}

          >

            <div

              style={{

                maxWidth: '650px',

                pointerEvents: 'auto',

              }}

            >

              <h1

                className="booking-banner-title"

                style={{

                  fontSize: 'clamp(22px, 2.4vw, 36px)',

                  fontWeight: '800',

                  color: '#ffffff',

                  lineHeight: '1.18',

                  letterSpacing: '-0.3px',

                  margin: '0 0 8px 0',

                  fontFamily: "'Manrope', sans-serif",

                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',

                }}

              >

                Book Your Appointment

              </h1>

              <p

                className="booking-banner-subtitle"

                style={{

                  fontSize: 'clamp(12px, 1.05vw, 15px)',

                  color: '#e2fbe8',

                  fontWeight: '500',

                  lineHeight: '1.45',

                  margin: 0,

                  fontFamily: "'Manrope', sans-serif",

                  textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',

                }}

              >

                Schedule your consultation with Dr. K. Tripathi Ampeh (Pat.).

              </p>

            </div>

          </div>

        </div>

      </section>



      {/* Main Content Area: Expanded layout covering LHS & RHS nicely */}

      <div

        id="booking-form-section"

        className="booking-main-content"

        style={{

          width: '100%',

          maxWidth: '1440px',

          margin: '0 auto',

          padding: '44px 36px 80px',

          boxSizing: 'border-box',

          flex: 1,

        }}

      >

        <div

          style={{

            display: 'grid',

            gridTemplateColumns: 'minmax(0, 1.95fr) minmax(340px, 1.05fr)',

            gap: '32px',

            alignItems: 'start',

          }}

          className="booking-grid"

        >

          {/* Left Column: Multi-Step Card */}

          <div

            className="booking-card"

            style={{

              backgroundColor: '#ffffff',

              borderRadius: '20px',

              padding: currentStep === 3 ? '40px 36px 36px' : '38px',

              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',

              border: '1px solid #edf2ee',

            }}

          >

            {/* Step Indicators (shown on Step 1 & 2) */}

            {currentStep < 3 && (

              <div

                className="booking-stepper-wrap"

                style={{

                  display: 'flex',

                  alignItems: 'center',

                  justifyContent: 'space-between',

                  marginBottom: '36px',

                  paddingBottom: '24px',

                  borderBottom: '1px solid #f1f5f2',

                }}

              >

                {/* Step 1 */}

                <div className="booking-step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                  <div

                    className="booking-step-circle"

                    style={{

                      width: '28px',

                      height: '28px',

                      borderRadius: '50%',

                      backgroundColor: '#1b4332',

                      color: '#ffffff',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      fontSize: '13px',

                      fontWeight: '700',

                      flexShrink: 0,

                    }}

                  >

                    1

                  </div>

                  <span

                    className="booking-step-label"

                    style={{

                      fontSize: '14px',

                      fontWeight: currentStep === 1 ? '700' : '600',

                      color: currentStep === 1 ? '#111827' : '#374151',

                    }}

                  >

                    <span className="booking-step-label-full">Patient Details</span>

                    <span className="booking-step-label-short">Details</span>

                  </span>

                </div>



                {/* Line 1 */}

                <div

                  className="booking-step-divider"

                  style={{

                    flex: 1,

                    height: '2px',

                    backgroundColor: currentStep >= 2 ? '#1b4332' : '#e5e7eb',

                    margin: '0 16px',

                  }}

                />



                {/* Step 2 */}

                <div className="booking-step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                  <div

                    className="booking-step-circle"

                    style={{

                      width: '28px',

                      height: '28px',

                      borderRadius: '50%',

                      backgroundColor: currentStep >= 2 ? '#1b4332' : '#ffffff',

                      color: currentStep >= 2 ? '#ffffff' : '#6b7280',

                      border: currentStep >= 2 ? 'none' : '1.5px solid #d1d5db',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      fontSize: '13px',

                      fontWeight: '700',

                      flexShrink: 0,

                    }}

                  >

                    2

                  </div>

                  <span

                    className="booking-step-label"

                    style={{

                      fontSize: '14px',

                      fontWeight: currentStep === 2 ? '700' : '500',

                      color: currentStep === 2 ? '#111827' : '#6b7280',

                    }}

                  >

                    <span className="booking-step-label-full">Select Date & Time</span>

                    <span className="booking-step-label-short">Date & Time</span>

                  </span>

                </div>



                {/* Line 2 */}

                <div

                  className="booking-step-divider"

                  style={{

                    flex: 1,

                    height: '2px',

                    backgroundColor: currentStep >= 3 ? '#1b4332' : '#e5e7eb',

                    margin: '0 16px',

                  }}

                />



                {/* Step 3 */}

                <div className="booking-step-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                  <div

                    className="booking-step-circle"

                    style={{

                      width: '28px',

                      height: '28px',

                      borderRadius: '50%',

                      backgroundColor: currentStep >= 3 ? '#1b4332' : '#ffffff',

                      color: currentStep >= 3 ? '#ffffff' : '#6b7280',

                      border: currentStep >= 3 ? 'none' : '1.5px solid #d1d5db',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      fontSize: '13px',

                      fontWeight: '700',

                      flexShrink: 0,

                    }}

                  >

                    3

                  </div>

                  <span

                    className="booking-step-label"

                    style={{

                      fontSize: '14px',

                      fontWeight: currentStep === 3 ? '700' : '500',

                      color: currentStep === 3 ? '#111827' : '#6b7280',

                    }}

                  >

                    <span className="booking-step-label-full">Confirm Appointment</span>

                    <span className="booking-step-label-short">Confirm</span>

                  </span>

                </div>

              </div>

            )}

            {/* Rescheduling Active Notice Banner */}
            {rescheduleData && currentStep !== 3 && (
              <div
                className="booking-reschedule-banner"
                style={{
                  marginBottom: '24px',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: '#dbeafe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1d4ed8',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    🔄
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e40af', fontFamily: "'Manrope', sans-serif" }}>
                      Rescheduling Appointment: {rescheduleData.appointmentId || rescheduleData.id}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#3b82f6', marginTop: '2px', fontFamily: "'Manrope', sans-serif" }}>
                      Current: {rescheduleData.fullDate || rescheduleData.date} at {rescheduleData.time || 'Scheduled slot'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="booking-cancel-reschedule-btn"
                  onClick={handleCancelReschedule}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #93c5fd',
                    color: '#1e40af',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontFamily: "'Manrope', sans-serif",
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  Cancel Reschedule
                </button>
              </div>
            )}



            {/* ================= STEP 1: Patient Information ================= */}

            {currentStep === 1 && (

              <form onSubmit={handleNextStep}>

                <div style={{ marginBottom: '28px' }}>

                  <h2 className="booking-step-heading" style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>

                    Patient Information

                  </h2>

                  <p className="booking-step-subheading" style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>

                    Please enter your basic details to book an appointment.

                  </p>

                </div>



                <div className="booking-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                  {/* Full Name */}

                  <div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>

                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>

                        Full Name <span style={{ color: '#ef4444' }}>*</span>

                      </label>

                      <span style={{ fontSize: '12px', color: (formData.fullName || '').length >= 25 ? '#ef4444' : '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>

                        {(formData.fullName || '').length}/25

                      </span>

                    </div>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />

                          <circle cx="12" cy="7" r="4" />

                        </svg>

                      </span>

                      <input

                        type="text"

                        name="fullName"

                        value={formData.fullName}

                        onChange={handleChange}

                        maxLength={25}

                        placeholder="Enter your full name"

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 14px 11px 40px',

                          borderRadius: '10px',

                          border: errors.fullName ? '1px solid #ef4444' : '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: '#111827',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = errors.fullName ? '#ef4444' : '#e2e8f0')}

                      />

                    </div>

                    {errors.fullName && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.fullName}</p>}

                  </div>



                  {/* Whatsapp Mobile Number */}

                  <div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>

                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>

                        Whatsapp Mobile Number <span style={{ color: '#ef4444' }}>*</span>

                      </label>

                      <span style={{ fontSize: '12px', color: (formData.mobileNumber || '').length === 10 ? '#16a34a' : '#9ca3af', fontFamily: "'Manrope', sans-serif" }}>

                        {(formData.mobileNumber || '').length}/10 digits

                      </span>

                    </div>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />

                        </svg>

                      </span>

                      <input

                        type="tel"

                        name="mobileNumber"

                        value={formData.mobileNumber}

                        onChange={handleChange}

                        maxLength={10}

                        placeholder="Starts with 6, 7, 8 or 9"

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 14px 11px 40px',

                          borderRadius: '10px',

                          border: errors.mobileNumber ? '1px solid #ef4444' : '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: '#111827',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = errors.mobileNumber ? '#ef4444' : '#e2e8f0')}

                      />

                    </div>

                    {errors.mobileNumber && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.mobileNumber}</p>}

                  </div>

                </div>



                <div className="booking-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                  {/* Email Address */}

                  <div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                      Email Address <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>

                    </label>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <rect width="20" height="16" x="2" y="4" rx="2" />

                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />

                        </svg>

                      </span>

                      <input

                        type="email"

                        name="email"

                        value={formData.email}

                        onChange={handleChange}

                        placeholder="name@example.com"

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 14px 11px 40px',

                          borderRadius: '10px',

                          border: errors.email ? '1px solid #ef4444' : '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: '#111827',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = errors.email ? '#ef4444' : '#e2e8f0')}

                      />

                    </div>

                    {errors.email && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.email}</p>}

                  </div>



                  {/* Age */}

                  <div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                      Age <span style={{ color: '#ef4444' }}>*</span>

                    </label>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                          <line x1="16" y1="2" x2="16" y2="6" />

                          <line x1="8" y1="2" x2="8" y2="6" />

                          <line x1="3" y1="10" x2="21" y2="10" />

                        </svg>

                      </span>

                      <input

                        type="number"

                        name="age"

                        value={formData.age}

                        onChange={handleChange}

                        placeholder="Enter your age"

                        min="1"

                        max="120"

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 64px 11px 40px',

                          borderRadius: '10px',

                          border: errors.age ? '1px solid #ef4444' : '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: '#111827',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = errors.age ? '#ef4444' : '#e2e8f0')}

                      />

                      <span

                        style={{

                          position: 'absolute',

                          right: '16px',

                          top: '50%',

                          transform: 'translateY(-50%)',

                          fontSize: '13px',

                          color: '#9ca3af',

                          pointerEvents: 'none',

                        }}

                      >

                        years

                      </span>

                    </div>

                    {errors.age && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.age}</p>}

                  </div>

                </div>



                <div className="booking-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                  {/* Gender */}

                  <div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                      Gender <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>

                    </label>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <circle cx="12" cy="8" r="4" />

                          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />

                        </svg>

                      </span>

                      <select

                        name="gender"

                        value={formData.gender}

                        onChange={handleChange}

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 36px 11px 40px',

                          borderRadius: '10px',

                          border: '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: formData.gender ? '#111827' : '#9ca3af',

                          backgroundColor: '#ffffff',

                          appearance: 'none',

                          cursor: 'pointer',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}

                      >

                        <option value="">Select gender</option>

                        <option value="Male">Male</option>

                        <option value="Female">Female</option>

                        <option value="Other">Other</option>

                      </select>

                      <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>

                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                          <path d="m6 9 6 6 6-6" />

                        </svg>

                      </span>

                    </div>

                  </div>



                  {/* Date of Birth */}

                  <div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                      Date of Birth <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>

                    </label>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                          <line x1="16" y1="2" x2="16" y2="6" />

                          <line x1="8" y1="2" x2="8" y2="6" />

                          <line x1="3" y1="10" x2="21" y2="10" />

                        </svg>

                      </span>

                      <input

                        type="date"

                        name="dateOfBirth"

                        value={formData.dateOfBirth}

                        max={new Date().toISOString().split('T')[0]}

                        onChange={handleChange}

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 14px 11px 40px',

                          borderRadius: '10px',

                          border: '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: formData.dateOfBirth ? '#111827' : '#9ca3af',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}

                      />

                    </div>

                  </div>

                </div>



                <div className="booking-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

                  {/* City */}

                  <div>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                      City <span style={{ color: '#9ca3af', fontWeight: '400' }}>(Optional)</span>

                    </label>

                    <div style={{ position: 'relative' }}>

                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />

                          <circle cx="12" cy="10" r="3" />

                        </svg>

                      </span>

                      <input

                        type="text"

                        name="city"

                        value={formData.city}

                        onChange={handleChange}

                        placeholder="Enter your city"

                        style={{

                          width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                          padding: '11px 14px 11px 40px',

                          borderRadius: '10px',

                          border: '1px solid #e2e8f0',

                          fontSize: '14px',

                          outline: 'none',

                          color: '#111827',

                          backgroundColor: '#ffffff',

                          transition: 'border-color 0.2s',

                        }}

                        onFocus={(e) => (e.target.style.borderColor = '#265e38')}

                        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}

                      />

                    </div>

                  </div>

                </div>



                {/* Reason for Visit */}

                <div style={{ marginBottom: '32px' }}>

                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>

                    Reason for Visit <span style={{ color: '#dc2626' }}>*</span>

                  </label>

                  <div style={{ position: 'relative' }}>

                    <span style={{ position: 'absolute', left: '14px', top: '14px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>

                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">

                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />

                        <polyline points="14 2 14 8 20 8" />

                      </svg>

                    </span>

                    <textarea

                      name="reasonForVisit"

                      value={formData.reasonForVisit}

                      onChange={handleChange}

                      maxLength={35}

                      rows="4"

                      placeholder="Briefly mention your health concern (e.g., Fever, Skin allergy, Routine checkup)"

                      style={{

                        width: '100%',

        overflowX: 'hidden',

        maxWidth: '100vw',

                        padding: '12px 14px 28px 40px',

                        borderRadius: '10px',

                        border: errors.reasonForVisit ? '1px solid #ef4444' : '1px solid #e2e8f0',

                        fontSize: '14px',

                        outline: 'none',

                        color: '#111827',

                        backgroundColor: '#ffffff',

                        resize: 'none',

                        fontFamily: 'inherit',

                        transition: 'border-color 0.2s',

                      }}

                      onFocus={(e) => (e.target.style.borderColor = errors.reasonForVisit ? '#ef4444' : '#265e38')}

                      onBlur={(e) => (e.target.style.borderColor = errors.reasonForVisit ? '#ef4444' : '#e2e8f0')}

                    />

                    <span

                      style={{

                        position: 'absolute',

                        right: '14px',

                        bottom: '10px',

                        fontSize: '12px',

                        color: (formData.reasonForVisit || '').length >= 35 ? '#ef4444' : '#9ca3af',

                      }}

                    >

                      {(formData.reasonForVisit || '').length}/35

                    </span>

                  </div>

                  {errors.reasonForVisit && (
                    <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{errors.reasonForVisit}</p>
                  )}

                </div>



                {/* Bottom Bar: Security & Next Button */}

                <div

                  className="booking-step-bottom-bar"

                  style={{

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'space-between',

                    flexWrap: 'wrap',

                    gap: '16px',

                    paddingTop: '20px',

                    borderTop: '1px solid #f1f5f2',

                  }}

                >

                  <div

                    className="booking-security-box"

                    style={{

                      display: 'flex',

                      alignItems: 'center',

                      gap: '12px',

                      backgroundColor: '#f0fdf4',

                      border: '1px solid #dcfce7',

                      borderRadius: '12px',

                      padding: '10px 18px',

                    }}

                  >

                    <div

                      style={{

                        width: '32px',

                        height: '32px',

                        borderRadius: '8px',

                        backgroundColor: '#dcfce7',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        flexShrink: 0,

                      }}

                    >

                      <svg

                        width="16"

                        height="16"

                        viewBox="0 0 24 24"

                        fill="none"

                        stroke="#16a34a"

                        strokeWidth="2"

                        strokeLinecap="round"

                        strokeLinejoin="round"

                      >

                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />

                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />

                      </svg>

                    </div>

                    <div>

                      <h5 style={{ fontSize: '13.5px', fontWeight: '700', color: '#111827', margin: 0 }}>

                        Your information is secure

                      </h5>

                      <p style={{ fontSize: '12px', color: '#4b5563', margin: '2px 0 0 0' }}>

                        We keep your personal information private and secure.

                      </p>

                    </div>

                  </div>



                  <button

                    type="submit"

                    className="booking-submit-btn"

                    style={{

                      backgroundColor: '#265e38',

                      color: '#ffffff',

                      border: 'none',

                      borderRadius: '10px',

                      padding: '13px 32px',

                      fontSize: '14.5px',

                      fontWeight: '700',

                      cursor: 'pointer',

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '8px',

                      boxShadow: '0 4px 14px rgba(38, 94, 56, 0.25)',

                      transition: 'all 0.2s ease',

                    }}

                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1f4e2e')}

                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#265e38')}

                  >

                    Next Step <span>→</span>

                  </button>

                </div>

              </form>

            )}



            {/* ================= STEP 2: Select Date & Time ================= */}

            {currentStep === 2 && (

              <div>

                <div style={{ marginBottom: '28px' }}>

                  <h2 className="booking-step-heading" style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0' }}>

                    Select Date & Time

                  </h2>

                  <p className="booking-step-subheading" style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>

                    Choose a convenient date and time for your consultation.

                  </p>

                </div>



                {/* Two Panels: Calendar on Left, Time Slots on Right */}

                <div

                  style={{

                    display: 'grid',

                    gridTemplateColumns: 'minmax(280px, 1fr) minmax(320px, 1.25fr)',

                    gap: '24px',

                    marginBottom: '32px',

                  }}

                  className="step2-split-grid"

                >

                  {/* Left Box: Calendar Widget */}

                  <div

                    className="booking-calendar-card"

                    style={{

                      border: '1px solid #eef2ef',

                      borderRadius: '16px',

                      padding: '20px',

                      backgroundColor: '#ffffff',

                    }}

                  >

                    {/* Month Navigator Header */}

                    <div

                      style={{

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'space-between',

                        marginBottom: '18px',

                        padding: '0 4px',

                      }}

                    >

                      <button

                        type="button"

                        onClick={handlePrevMonth}

                        disabled={isPrevMonthDisabled()}

                        style={{

                          background: 'none',

                          border: 'none',

                          cursor: isPrevMonthDisabled() ? 'not-allowed' : 'pointer',

                          fontSize: '18px',

                          color: isPrevMonthDisabled() ? '#cbd5e1' : '#6b7280',

                          padding: '4px 8px',

                          opacity: isPrevMonthDisabled() ? 0.35 : 1,

                        }}

                        aria-label="Previous Month"

                      >

                        ‹

                      </button>

                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 }}>

                        {months[calendarMonth]} {calendarYear}

                      </h3>

                      <button

                        type="button"

                        onClick={handleNextMonth}

                        style={{

                          background: 'none',

                          border: 'none',

                          cursor: 'pointer',

                          fontSize: '18px',

                          color: '#6b7280',

                          padding: '4px 8px',

                        }}

                        aria-label="Next Month"

                      >

                        ›

                      </button>

                    </div>



                    {/* Weekday Names */}

                    <div
                      className="booking-calendar-weekdays"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#6b7280',
                        marginBottom: '12px',
                      }}
                    >
                      {daysOfWeek.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    {/* Calendar Days Matrix */}

                    <div
                      className="booking-calendar-matrix"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '6px',
                        textAlign: 'center',
                      }}
                    >
                      {generateCalendarDays().map((item, idx) => {
                        const isDayClosed = item.isCurrentMonth && item.isWorkingDay === false;
                        const isDateRestricted = item.isCurrentMonth && item.isDateRestricted;
                        const isDisabled = !item.isCurrentMonth || item.isPast || isDayClosed || isDateRestricted;

                        const isSelected =
                          item.isCurrentMonth &&
                          !isDisabled &&
                          item.day === formData.selectedDay &&
                          calendarMonth === formData.selectedMonth &&
                          calendarYear === formData.selectedYear;

                        return (
                          <div
                            key={idx}
                            className="booking-calendar-cell"
                            onClick={() => {
                              if (!item.isCurrentMonth) return;
                              if (isDisabled) {
                                const formattedDate = `${item.day} ${months[calendarMonth]} ${calendarYear}`;
                                let reasonText = item.restrictionReason;
                                if (!reasonText) {
                                  if (item.isPast) {
                                    reasonText = 'Appointments cannot be booked for past dates.';
                                  } else if (isDayClosed) {
                                    const dObj = new Date(calendarYear, calendarMonth, item.day);
                                    reasonText = `The clinic is closed on ${daysOfWeek[dObj.getDay()]}s.`;
                                  } else {
                                    reasonText = 'Clinic is closed on this date.';
                                  }
                                }
                                setClosedDateModal({
                                  isOpen: true,
                                  dateFormatted: formattedDate,
                                  reason: reasonText,
                                });
                              } else {
                                handleSelectDate(item.day, item.isCurrentMonth, item.isPast);
                              }
                            }}
                            title={
                              !item.isCurrentMonth
                                ? ''
                                : item.isPast
                                ? 'Past date not selectable'
                                : isDateRestricted
                                ? `Clinic closed on this date (${item.restrictionReason || 'Restricted'})`
                                : isDayClosed
                                ? 'Clinic is closed on this day'
                                : 'Click to select date'
                            }
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              height: '38px',
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            <div
                              className="booking-calendar-day-circle"
                              style={{
                                width: '32px',
                                height: '32px',

                                borderRadius: '50%',

                                display: 'flex',

                                alignItems: 'center',

                                justifyContent: 'center',

                                fontSize: '13px',

                                fontWeight: isSelected ? '700' : '500',

                                backgroundColor: isSelected ? '#1b4332' : 'transparent',

                                color: isSelected

                                  ? '#ffffff'

                                  : isDisabled

                                  ? '#cbd5e1'

                                  : '#111827',

                                opacity: isDisabled ? 0.45 : 1,

                                transition: 'all 0.15s',

                              }}

                            >

                              {item.day}

                            </div>

                            {item.hasDot && !isSelected && (

                              <span

                                style={{

                                  width: '3.5px',

                                  height: '3.5px',

                                  borderRadius: '50%',

                                  backgroundColor: '#1b4332',

                                  marginTop: '2px',

                                }}

                              />

                            )}

                          </div>

                        );

                      })}

                    </div>



                    {/* Legend: Available / Not Available */}

                    <div

                      style={{

                        display: 'flex',

                        alignItems: 'center',

                        gap: '16px',

                        marginTop: '22px',

                        paddingTop: '16px',

                        borderTop: '1px solid #f1f5f2',

                        fontSize: '12px',

                        color: '#6b7280',

                      }}

                    >

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1b4332' }} />

                        <span>Available</span>

                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />

                        <span>Not Available</span>

                      </div>

                    </div>

                  </div>



                  {/* Right Box: Available Time Slots */}

                  <div

                    className="booking-slots-card"

                    style={{

                      border: '1px solid #eef2ef',

                      borderRadius: '16px',

                      padding: '20px',

                      backgroundColor: '#ffffff',

                      display: 'flex',

                      flexDirection: 'column',

                      justifyContent: 'space-between',

                    }}

                  >

                    <div>

                      {/* Slots Header */}

                      <div
                        className="booking-slots-header"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '18px',
                          flexWrap: 'wrap',
                          gap: '8px',
                        }}
                      >

                        <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>

                          Available Time Slots

                        </h3>

                        <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>

                          {formatSelectedFullDate()}

                        </span>

                      </div>



                      {/* 3 Columns Time Slots Grid */}

                      {effectiveHours.isCustom && (
                        <div
                          style={{
                            marginBottom: '16px',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            color: '#1e40af',
                            fontWeight: '600',
                          }}
                        >
                          <span>⏱</span>
                          <span>
                            Special Clinic Hours for this date: <strong>{effectiveHours.startTime} - {effectiveHours.endTime}</strong>
                            {effectiveHours.reason ? ` (${effectiveHours.reason})` : ''}
                          </span>
                        </div>
                      )}

                      <div

                        className="booking-slots-grid"

                        style={{

                          display: 'grid',

                          gridTemplateColumns: 'repeat(3, 1fr)',

                          gap: '10px',

                          marginBottom: '20px',

                        }}

                      >

                        {timeSlots.map((slot, index) => {

                          const isSelected = formData.selectedTimeSlot === slot.time && slot.available;

                          const isUnavailable = !slot.available;



                          return (

                            <button
                              key={index}
                              type="button"
                              className="booking-time-slot-btn"
                              disabled={isUnavailable}
                              onClick={() => {
                                if (!isUnavailable) {
                                  setFormData((p) => ({ ...p, selectedTimeSlot: slot.time }));
                                }
                              }}
                              title={slot.isBooked ? 'Slot already booked' : slot.isOutsideHours ? `Outside clinic hours (${effectiveHours.startTime} - ${effectiveHours.endTime})` : isUnavailable ? 'Slot unavailable' : 'Click to select slot'}
                              style={{
                                padding: '10px 6px',
                                borderRadius: '8px',
                                border: isSelected
                                  ? '1.5px solid #1b4332'
                                  : isUnavailable
                                  ? '1px solid #f1f5f9'
                                  : '1px solid #e2e8f0',
                                backgroundColor: isSelected
                                  ? '#1b4332'
                                  : isUnavailable
                                  ? '#f8fafc'
                                  : '#ffffff',
                                color: isSelected
                                  ? '#ffffff'
                                  : isUnavailable
                                  ? '#94a3b8'
                                  : '#374151',
                                fontSize: '13px',
                                fontWeight: isSelected ? '700' : '500',
                                cursor: isUnavailable ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'center',
                              }}
                            >
                              {slot.time}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Selected Slot Information Pill */}
                    <div
                      className="booking-selected-slot-pill"
                      style={{
                        backgroundColor: formData.selectedTimeSlot ? '#f0fdf4' : '#fffbeb',
                        border: formData.selectedTimeSlot ? '1px solid #dcfce7' : '1px solid #fde68a',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: formData.selectedTimeSlot ? '#dcfce7' : '#fef3c7',
                          color: formData.selectedTimeSlot ? '#16a34a' : '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          flexShrink: 0,
                        }}
                      >
                        ℹ
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: formData.selectedTimeSlot ? '#166534' : '#92400e', display: 'block' }}>
                          {formData.selectedTimeSlot ? 'Selected Slot' : 'Select Time Slot'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: formData.selectedTimeSlot ? '#14532d' : '#78350f' }}>
                          {formData.selectedTimeSlot
                            ? `${formatSelectedFullDate()} at ${formData.selectedTimeSlot}`
                            : `Please choose an available time slot above for ${formatSelectedFullDate()}`}
                        </span>
                      </div>
                    </div>

                  </div>

                </div>



                {/* Bottom Bar: Back & Next Step Button */}

                <div

                  className="booking-step2-bottom"

                  style={{

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'space-between',

                    paddingTop: '20px',

                    borderTop: '1px solid #f1f5f2',

                  }}

                >

                  <button

                    type="button"

                    className="booking-back-btn"

                    onClick={() => setCurrentStep(1)}

                    style={{

                      backgroundColor: '#ffffff',

                      color: '#374151',

                      border: '1px solid #d1d5db',

                      borderRadius: '8px',

                      padding: '10px 22px',

                      fontSize: '14px',

                      fontWeight: '600',

                      cursor: 'pointer',

                      display: 'inline-flex',

                      alignItems: 'center',

                      gap: '6px',

                    }}

                  >

                    ← Back

                  </button>



                  <button
                    type="button"
                    className="booking-step-btn"
                    onClick={handleNextStep}
                    disabled={bookingLoading}
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 28px',
                      fontSize: '14px',
                      fontWeight: '700',
                      cursor: bookingLoading ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(27, 67, 50, 0.25)',
                      opacity: bookingLoading ? 0.75 : 1,
                    }}
                  >
                    {bookingLoading ? (
                      rescheduleData ? 'Rescheduling...' : 'Booking...'
                    ) : rescheduleData ? (
                      <>
                        Confirm Reschedule <span>→</span>
                      </>
                    ) : (
                      <>
                        Confirm & Book Appointment <span>→</span>
                      </>
                    )}
                  </button>

                </div>

              </div>

            )}



            {/* ================= STEP 3: YOUR APPOINTMENT IS CONFIRMED! (EXACT MATCHING UI) ================= */}
            {currentStep === 3 && (
              <div className="booking-confirm-animated">
                {/* Top 3D Calendar & Remedies Illustration with Celebration Effects */}
                <div style={{ textAlign: 'center', marginBottom: '20px', position: 'relative' }}>
                  <div className="booking-confirm-glow-wrap">
                    {/* Celebratory Sparkle Particles */}
                    <div className="booking-confirm-particles" aria-hidden="true">
                      <span className="particle p1" />
                      <span className="particle p2" />
                      <span className="particle p3" />
                      <span className="particle p4" />
                      <span className="particle p5" />
                      <span className="particle p6" />
                      <span className="particle p7" />
                      <span className="particle p8" />
                    </div>

                    <img
                      src={confirmedIllustration}
                      alt="Appointment Confirmed"
                      className="booking-confirm-img"
                      style={{
                        maxWidth: '300px',
                        width: '100%',
                        height: 'auto',
                        display: 'inline-block',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                </div>

                {/* Heading & Subtitle */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2
                    className="booking-confirm-title"
                    style={{
                      fontSize: '28px',
                      fontWeight: '800',
                      color: '#0f172a',
                      margin: '0 0 10px 0',
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {isRescheduledSuccess ? 'Your Appointment is Rescheduled!' : 'Your Appointment is Confirmed!'}
                  </h2>
                  <p
                    className="booking-confirm-subtitle"
                    style={{
                      fontSize: '14px',
                      color: '#64748b',
                      lineHeight: '1.6',
                      margin: 0,
                    }}
                  >
                    {isRescheduledSuccess ? (
                      <>
                        Your appointment has been successfully rescheduled for{' '}
                        <strong style={{ color: '#0f172a' }}>
                          {confirmedData?.date || `${formData.selectedDay} ${months[formData.selectedMonth]} ${formData.selectedYear}`} at {confirmedData?.time || formData.selectedTimeSlot}
                        </strong>.<br />
                        We have updated your consultation schedule.
                      </>
                    ) : (
                      <>
                        Thank you for choosing Dr. Kumar Tripathi Ampeh (Pat.).<br />
                        We look forward to seeing you at the clinic.
                      </>
                    )}
                  </p>
                </div>

                {/* Appointment Details Section - Clean Modern Cardless UI */}
                <div
                  className="booking-confirm-card"
                  style={{
                    backgroundColor: 'transparent',
                    borderTop: '1px solid #f1f5f9',
                    borderBottom: '1px solid #f1f5f9',
                    borderRadius: 0,
                    padding: '24px 2px 24px',
                    marginBottom: '24px',
                  }}
                >
                  {/* Header Row: Title & Confirmed Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '22px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          backgroundColor: '#ecfdf5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '15px',
                        }}
                      >
                        📋
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>
                        Appointment Details
                      </h3>
                    </div>

                    <span
                      style={{
                        backgroundColor: isRescheduledSuccess ? '#eff6ff' : '#ecfdf5',
                        color: isRescheduledSuccess ? '#1d4ed8' : '#047857',
                        border: isRescheduledSuccess ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
                        fontSize: '12px',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: isRescheduledSuccess ? '#3b82f6' : '#10b981',
                          display: 'inline-block',
                        }}
                      />
                      {isRescheduledSuccess ? 'Rescheduled' : 'Confirmed'}
                    </span>
                  </div>

                  {/* 2-Columns Details Grid */}
                  {(() => {
                    const displayReason = (confirmedData ? confirmedData.reason : formData.reasonForVisit)?.trim() || '';
                    const displayTime = confirmedData?.time || formData.selectedTimeSlot || '';
                    const displayDate = confirmedData?.date || formatSelectedFullDate();
                    const displayId = confirmedData?.appointmentId || formData.appointmentId;
                    const col2LabelWidth = '108px';
                    return (
                      <div
                        className="booking-confirm-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1.15fr 1fr',
                          rowGap: '16px',
                          columnGap: '28px',
                          fontSize: '14px',
                        }}
                      >
                        {/* Row 1 */}
                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🪪</span>
                          <span className="booking-confirm-label" style={{ color: '#64748b', minWidth: '120px', width: '120px', flexShrink: 0, fontWeight: '500' }}>Appointment ID</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700', wordBreak: 'break-all' }}>{displayId}</strong>
                        </div>

                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>👨‍⚕️</span>
                          <span className="booking-confirm-label booking-confirm-label-col2" style={{ color: '#64748b', minWidth: col2LabelWidth, width: col2LabelWidth, flexShrink: 0, fontWeight: '500' }}>Doctor</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700' }}>Dr. K. Tripathi Ampeh (Pat.)</strong>
                        </div>

                        {/* Row 2 */}
                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>👤</span>
                          <span className="booking-confirm-label" style={{ color: '#64748b', minWidth: '120px', width: '120px', flexShrink: 0, fontWeight: '500', marginTop: '2px' }}>Patient Name</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700', marginTop: '2px', wordBreak: 'break-word' }}>{formData.fullName}</strong>
                        </div>

                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginTop: '2px' }}>
                            📋
                          </span>
                          <span className="booking-confirm-label booking-confirm-label-col2" style={{ color: '#64748b', minWidth: col2LabelWidth, width: col2LabelWidth, flexShrink: 0, fontWeight: '500', marginTop: '2px' }}>
                            Reason for Visit
                          </span>
                          <div style={{ flex: 1, minWidth: 0, maxHeight: '130px', overflowY: 'auto', wordBreak: 'break-word', overflowWrap: 'anywhere', paddingRight: '4px' }}>
                            <strong style={{ color: '#0f172a', fontWeight: '700', lineHeight: '1.45', display: 'block' }}>
                              {displayReason}
                            </strong>
                          </div>
                        </div>

                        {/* Row 3 */}
                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>📞</span>
                          <span className="booking-confirm-label" style={{ color: '#64748b', minWidth: '120px', width: '120px', flexShrink: 0, fontWeight: '500' }}>Mobile Number</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700' }}>{formData.mobileNumber}</strong>
                        </div>

                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>📅</span>
                          <span className="booking-confirm-label booking-confirm-label-col2" style={{ color: '#64748b', minWidth: col2LabelWidth, width: col2LabelWidth, flexShrink: 0, fontWeight: '500' }}>Date</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700' }}>{displayDate}</strong>
                        </div>

                        {/* Row 4 */}
                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>✉️</span>
                          <span className="booking-confirm-label" style={{ color: '#64748b', minWidth: '120px', width: '120px', flexShrink: 0, fontWeight: '500' }}>Email</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700', wordBreak: 'break-all' }}>{formData.email}</strong>
                        </div>

                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🕒</span>
                          <span className="booking-confirm-label booking-confirm-label-col2" style={{ color: '#64748b', minWidth: col2LabelWidth, width: col2LabelWidth, flexShrink: 0, fontWeight: '500' }}>Time</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700' }}>{displayTime}</strong>
                        </div>

                        {/* Row 5: Clinic Address */}
                        <div className="booking-confirm-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                          <span className="booking-confirm-icon" style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: '#f8fafc', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', marginTop: '2px', flexShrink: 0 }}>📍</span>
                          <span className="booking-confirm-label" style={{ color: '#64748b', minWidth: '120px', width: '120px', flexShrink: 0, marginTop: '2px', fontWeight: '500' }}>Clinic Address</span>
                          <strong style={{ color: '#0f172a', fontWeight: '700', lineHeight: '1.5' }}>
                            123 Clinic Street, Your City,<br />
                            Your State - 123456
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Important Note Callout */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderLeft: '3px solid #10b981',
                    borderRadius: '0 10px 10px 0',
                    padding: '13px 18px',
                    marginBottom: '30px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '800',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  >
                    ℹ
                  </div>
                  <div>
                    <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px 0' }}>
                      Important Note
                    </h5>
                    <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, lineHeight: '1.55' }}>
                      Please arrive 5-10 minutes before your appointment time. If you need to reschedule or cancel, please contact us in advance.
                    </p>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div
                  className="booking-confirm-actions"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Button 1: Download Confirmation (PDF) */}
                  <button
                    type="button"
                    className="booking-action-btn"
                    onClick={handleDownloadPdf}
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9ca3af')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
                  >
                    <span>📥</span>
                    Download Confirmation (PDF)
                  </button>

                  {/* Button 2: View in Profile / Appointments */}
                  <button
                    type="button"
                    className="booking-action-btn"
                    onClick={() => navigate('/profile')}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dbeafe')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                  >
                    <span>👤</span>
                    View in Profile
                  </button>

                  {/* Button 3: Book Another Appointment */}
                  <button
                    type="button"
                    className="booking-action-btn"
                    onClick={handleStartNewBooking}
                    style={{
                      backgroundColor: '#f0fdf4',
                      color: '#166534',
                      border: '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '11px 18px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                      fontFamily: "'Manrope', sans-serif",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0fdf4')}
                  >
                    <span>📅</span>
                    Book Another Appointment
                  </button>

                  {/* Button 4: Back to Home */}
                  <button
                    type="button"
                    className="booking-action-btn booking-home-btn"
                    onClick={() => navigate('/')}
                    style={{
                      backgroundColor: '#1b4332',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '11px 22px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginLeft: 'auto',
                      boxShadow: '0 4px 12px rgba(27, 67, 50, 0.2)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#143527')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1b4332')}
                  >
                    <span>🏠</span>
                    Back to Home
                  </button>
                </div>
              </div>
            )}

          </div>



          {/* Right Column: 4 Information Cards (Exact match to reference design) */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Card 1: Homeopathy Consultation */}

            <div

              className="booking-sidebar-card"

              style={{

                backgroundColor: '#ffffff',

                borderRadius: '20px',

                padding: '26px 24px',

                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',

                border: '1px solid #edf2ee',

              }}

            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>

                <div

                  style={{

                    width: '42px',

                    height: '42px',

                    borderRadius: '12px',

                    backgroundColor: '#f0fdf4',

                    border: '1px solid #dcfce7',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    color: '#265e38',

                    flexShrink: 0,

                  }}

                >

                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />

                    <line x1="16" y1="2" x2="16" y2="6" />

                    <line x1="8" y1="2" x2="8" y2="6" />

                    <line x1="3" y1="10" x2="21" y2="10" />

                  </svg>

                </div>

                <div>

                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>

                    Homeopathy Consultation

                  </h3>

                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '3px 0 0' }}>

                    DR. KUMAR TRIPATHI AMPEH (PAT.)

                  </p>

                </div>

              </div>



              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                {[

                  'Personalized consultation',

                  'Natural and holistic approach',

                  'Detailed discussion of your health concerns',

                  'Customized homeopathic treatment',

                  'Follow-up guidance',

                ].map((item, idx) => (

                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#4b5563' }}>

                    <div

                      style={{

                        width: '18px',

                        height: '18px',

                        borderRadius: '50%',

                        backgroundColor: '#ecfdf5',

                        display: 'flex',

                        alignItems: 'center',

                        justifyContent: 'center',

                        flexShrink: 0,

                      }}

                    >

                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">

                        <polyline points="20 6 9 17 4 12" />

                      </svg>

                    </div>

                    <span>{item}</span>

                  </div>

                ))}

              </div>

            </div>



            {/* Card 2: Clinic Timings */}

            <div

              className="booking-sidebar-card"

              style={{

                backgroundColor: '#ffffff',

                borderRadius: '20px',

                padding: '24px',

                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',

                border: '1px solid #edf2ee',

              }}

            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>

                <div

                  style={{

                    width: '38px',

                    height: '38px',

                    borderRadius: '12px',

                    backgroundColor: '#f0fdf4',

                    border: '1px solid #dcfce7',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    color: '#265e38',

                    flexShrink: 0,

                  }}

                >

                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <circle cx="12" cy="12" r="10" />

                    <polyline points="12 6 12 12 16 14" />

                  </svg>

                </div>

                <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>

                  Clinic Timings

                </h4>

              </div>



                            {/* Dynamic Clinic Timings Schedule Rows */}
              {getClinicScheduleRows().map((row, idx, arr) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    marginBottom: idx === arr.length - 1 && !getSelectedDateTimingInfo() ? '0' : '10px',
                  }}
                >
                  <span style={{ color: '#4b5563' }}>{row.label}</span>
                  {row.isClosed ? (
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>Closed</span>
                  ) : (
                    <strong style={{ color: '#111827', fontWeight: '700' }}>{row.timings}</strong>
                  )}
                </div>
              ))}

              {/* Dynamic Selected Date Status if Closed or Special Hours */}
              {(() => {
                const selTiming = getSelectedDateTimingInfo();
                if (!selTiming) return null;
                return (
                  <div
                    style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #e2e8f0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                    }}
                  >
                    <span style={{ color: '#64748b', fontWeight: '600' }}>{selTiming.label}</span>
                    {selTiming.isClosed ? (
                      <span style={{ color: '#dc2626', fontWeight: '700' }}>Closed</span>
                    ) : (
                      <strong style={{ color: '#0369a1', fontWeight: '700' }}>{selTiming.timings}</strong>
                    )}
                  </div>
                );
              })()}

            </div>



            {/* Card 3: Clinic Address */}

            <div

              className="booking-sidebar-card"

              style={{

                backgroundColor: '#ffffff',

                borderRadius: '20px',

                padding: '24px',

                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',

                border: '1px solid #edf2ee',

              }}

            >

              <div
                className="booking-sidebar-card-header"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}
              >

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                  <div

                    style={{

                      width: '38px',

                      height: '38px',

                      borderRadius: '12px',

                      backgroundColor: '#f0fdf4',

                      border: '1px solid #dcfce7',

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      color: '#265e38',

                      flexShrink: 0,

                    }}

                  >

                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />

                      <circle cx="12" cy="10" r="3" />

                    </svg>

                  </div>

                  <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>

                    Clinic Address

                  </h4>

                </div>

                <a

                  href="https://maps.google.com"

                  target="_blank"

                  rel="noreferrer"

                  style={{

                    fontSize: '12px',

                    fontWeight: '600',

                    color: '#265e38',

                    backgroundColor: '#ecfdf5',

                    padding: '5px 12px',

                    borderRadius: '9999px',

                    textDecoration: 'none',

                    display: 'inline-block',

                    transition: 'all 0.2s',

                  }}

                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d1fae5')}

                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ecfdf5')}

                >

                  View on Map

                </a>

              </div>



              <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>

                123 Clinic Street, Your City,<br />

                Your State – 123456

              </p>

            </div>



            {/* Card 4: Need Help? */}

            <div

              className="booking-sidebar-card"

              style={{

                backgroundColor: '#ffffff',

                borderRadius: '20px',

                padding: '24px',

                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.03)',

                border: '1px solid #edf2ee',

              }}

            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>

                <div

                  style={{

                    width: '38px',

                    height: '38px',

                    borderRadius: '12px',

                    backgroundColor: '#f0fdf4',

                    border: '1px solid #dcfce7',

                    display: 'flex',

                    alignItems: 'center',

                    justifyContent: 'center',

                    color: '#265e38',

                    flexShrink: 0,

                  }}

                >

                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#265e38" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">

                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />

                  </svg>

                </div>

                <h4 style={{ fontSize: '15.5px', fontWeight: '800', color: '#111827', margin: 0 }}>

                  Need Help?

                </h4>

              </div>



              <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 10px 0' }}>

                Feel free to contact us for any assistance.

              </p>



              <a

                href="tel:+919876543210"

                style={{

                  fontSize: '16.5px',

                  fontWeight: '800',

                  color: '#265e38',

                  textDecoration: 'none',

                  display: 'inline-block',

                }}

              >

                +91 98765 43210

              </a>

            </div>

          </div>

        </div>

      </div>



      {/* Div 3: Bottom Footer Bar (Clean, Professional & Fully Responsive) */}

      <footer

        className="booking-footer"

        style={{

          backgroundColor: '#ffffff',

          borderTop: '1px solid #edf2ee',

          padding: '24px 0',

          marginTop: 'auto',

          marginBottom: 0,

          width: '100%',

          flexShrink: 0,

        }}

      >

        <div

          className="booking-footer-inner"

          style={{

            width: '100%',

            maxWidth: '1440px',

            margin: '0 auto',

            padding: '0 40px',

            display: 'flex',

            alignItems: 'center',

            justifyContent: 'space-between',

            flexWrap: 'wrap',

            gap: '16px',

            boxSizing: 'border-box',

          }}

        >

          {/* Left: Copyright Notice */}

          <p

            className="booking-footer-copyright"

            style={{

              margin: 0,

              fontSize: '13px',

              color: '#6b7280',

              fontFamily: "'Manrope', sans-serif",

              lineHeight: '1.5',

            }}

          >

            © 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved.

          </p>



          {/* Right: Policy & Support Links */}

          <div

            className="booking-footer-links"

            style={{

              display: 'flex',

              alignItems: 'center',

              gap: '28px',

              flexWrap: 'wrap',

            }}

          >

            <a

              href="#privacy"

              className="booking-footer-link"

              style={{

                color: '#6b7280',

                textDecoration: 'none',

                fontSize: '13px',

                fontFamily: "'Manrope', sans-serif",

                transition: 'color 0.2s ease',

              }}

              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}

              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}

            >

              Privacy Policy

            </a>

            <a

              href="#terms"

              className="booking-footer-link"

              style={{

                color: '#6b7280',

                textDecoration: 'none',

                fontSize: '13px',

                fontFamily: "'Manrope', sans-serif",

                transition: 'color 0.2s ease',

              }}

              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}

              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}

            >

              Terms of Consultation

            </a>

            <a

              href="#support"

              className="booking-footer-link"

              style={{

                color: '#6b7280',

                textDecoration: 'none',

                fontSize: '13px',

                fontFamily: "'Manrope', sans-serif",

                transition: 'color 0.2s ease',

              }}

              onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}

              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}

            >

              Contact Support

            </a>

          </div>

        </div>

      </footer>



      <style>{`
        /* Desktop defaults for step labels */
        .booking-step-label-short {
          display: none;
        }
        .booking-step-label-full {
          display: inline;
        }

        /* Confirmation Celebration Animations & Effects */
        @keyframes glowPulse {
          0% {
            opacity: 0.4;
            transform: scale(0.95);
          }
          100% {
            opacity: 0.75;
            transform: scale(1.05);
          }
        }
        .booking-confirm-glow-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .booking-confirm-glow-wrap::before {
          content: '';
          position: absolute;
          width: 80%;
          height: 80%;
          left: 10%;
          top: 10%;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.2) 0%, rgba(74, 222, 128, 0.08) 50%, transparent 72%);
          border-radius: 50%;
          filter: blur(24px);
          z-index: 0;
          animation: glowPulse 3s ease-in-out infinite alternate;
          pointer-events: none;
        }

        /* 3D Illustration Entrance and Floating Animation */
        @keyframes confirmIllustrationEntrance {
          0% {
            opacity: 0;
            transform: scale(0.6) translateY(30px);
          }
          55% {
            opacity: 1;
            transform: scale(1.06) translateY(-4px);
          }
          75% {
            transform: scale(0.98) translateY(2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes floatIllustration {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.5deg);
          }
        }
        .booking-confirm-img {
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 10px 22px rgba(22, 101, 52, 0.12));
          animation: confirmIllustrationEntrance 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                     floatIllustration 4.5s ease-in-out 0.8s infinite;
        }

        /* Celebratory Sparkle Particles */
        .booking-confirm-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }
        .particle {
          position: absolute;
          border-radius: 50%;
          opacity: 0;
          animation: particleBurst 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        @keyframes particleBurst {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.3);
          }
          30% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            opacity: 0;
            transform: var(--dest-transform) scale(0);
          }
        }
        .p1 { top: 30%; left: 15%; width: 9px; height: 9px; background: #22c55e; --dest-transform: translate(-38px, -45px); animation-delay: 0.15s; }
        .p2 { top: 20%; right: 18%; width: 10px; height: 10px; background: #eab308; --dest-transform: translate(45px, -50px); animation-delay: 0.2s; }
        .p3 { top: 60%; left: 8%; width: 8px; height: 8px; background: #10b981; --dest-transform: translate(-50px, 15px); animation-delay: 0.1s; }
        .p4 { top: 55%; right: 12%; width: 9px; height: 9px; background: #16a34a; --dest-transform: translate(52px, 18px); animation-delay: 0.25s; }
        .p5 { top: 12%; left: 45%; width: 8px; height: 8px; background: #86efac; --dest-transform: translate(-15px, -55px); animation-delay: 0.18s; }
        .p6 { top: 15%; right: 35%; width: 7px; height: 7px; background: #facc15; --dest-transform: translate(25px, -52px); animation-delay: 0.22s; }
        .p7 { bottom: 15%; left: 22%; width: 8px; height: 8px; background: #34d399; --dest-transform: translate(-30px, 35px); animation-delay: 0.28s; }
        .p8 { bottom: 18%; right: 25%; width: 9px; height: 9px; background: #4ade80; --dest-transform: translate(35px, 38px); animation-delay: 0.12s; }

        /* Staggered Content Reveals */
        @keyframes fadeInUpStagger {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .booking-confirm-title {
          animation: fadeInUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s both;
        }
        .booking-confirm-subtitle {
          animation: fadeInUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.38s both;
        }
        .booking-confirm-card {
          animation: fadeInUpStagger 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
        }

        .booking-confirm-label {
          min-width: 120px;
          width: 120px;
          flex-shrink: 0;
        }
        .booking-confirm-label-col2 {
          min-width: 72px;
          width: 72px;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .booking-main-content {
            padding: 32px 20px 60px !important;
          }
        }

        @media (max-width: 900px) {
          .booking-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .step2-split-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }

        @media (max-width: 680px) {
          .booking-step-label-full {
            display: none !important;
          }
          .booking-step-label-short {
            display: inline !important;
            font-size: 12px !important;
            font-weight: 600 !important;
          }
          .booking-step-divider {
            margin: 0 8px !important;
            min-width: 8px !important;
            flex: 1 1 8px !important;
          }
        }

        @media (max-width: 640px) {
          .booking-page-wrapper {
            overflow-x: hidden !important;
            max-width: 100vw !important;
            width: 100% !important;
          }
          .booking-hero-banner {
            height: 175px !important;
          }
          .booking-banner-inner {
            padding: 0 16px !important;
          }
          .booking-hero-banner-image {
            min-height: 175px !important;
            object-fit: cover !important;
            object-position: center !important;
          }
          .booking-hero-banner-overlay {
            background: linear-gradient(90deg, rgba(16, 46, 26, 0.82) 0%, rgba(16, 46, 26, 0.65) 55%, rgba(16, 46, 26, 0.38) 100%) !important;
          }
          .booking-banner-title {
            font-size: 21px !important;
            line-height: 1.25 !important;
            margin-bottom: 4px !important;
          }
          .booking-banner-subtitle {
            font-size: 12px !important;
            line-height: 1.4 !important;
            max-width: 320px !important;
          }
          .booking-main-content {
            padding: 16px 12px 40px !important;
            max-width: 100vw !important;
            box-sizing: border-box !important;
          }
          .booking-card {
            padding: 18px 14px !important;
            border-radius: 16px !important;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03) !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .booking-card input,
          .booking-card select,
          .booking-card textarea {
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            font-size: 14px !important;
          }
          .booking-card input[type="date"] {
            min-height: 44px !important;
            font-family: inherit !important;
          }
          .booking-stepper-wrap {
            margin-bottom: 20px !important;
            padding-bottom: 14px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .booking-step-item {
            gap: 6px !important;
            min-width: 0 !important;
            flex-shrink: 0 !important;
          }
          .booking-step-circle {
            width: 24px !important;
            height: 24px !important;
            font-size: 11px !important;
            flex-shrink: 0 !important;
          }
          .booking-step-label {
            font-size: 12px !important;
            white-space: nowrap !important;
          }
          .booking-step-divider {
            margin: 0 6px !important;
            min-width: 8px !important;
            flex: 1 1 8px !important;
          }
          .booking-reschedule-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding: 12px 14px !important;
            margin-bottom: 18px !important;
          }
          .booking-cancel-reschedule-btn {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            min-height: 38px !important;
            box-sizing: border-box !important;
          }
          .booking-step-heading {
            font-size: 19px !important;
            margin-bottom: 4px !important;
          }
          .booking-step-subheading {
            font-size: 12.5px !important;
            line-height: 1.45 !important;
          }
          .booking-form-row {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            margin-bottom: 16px !important;
          }
          .booking-step-bottom-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            padding-top: 16px !important;
          }
          .booking-security-box {
            width: 100% !important;
            box-sizing: border-box !important;
            padding: 10px 14px !important;
          }
          .booking-submit-btn,
          .booking-step-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 13px 20px !important;
            font-size: 14.5px !important;
            min-height: 46px !important;
            box-sizing: border-box !important;
          }
          .booking-step2-bottom {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 10px !important;
            padding-top: 16px !important;
          }
          .booking-back-btn {
            width: 100% !important;
            justify-content: center !important;
            min-height: 44px !important;
            font-size: 14px !important;
            box-sizing: border-box !important;
          }
          .booking-calendar-card,
          .booking-slots-card {
            padding: 14px 12px !important;
            border-radius: 14px !important;
            box-sizing: border-box !important;
          }
          .booking-calendar-matrix {
            gap: 4px !important;
          }
          .booking-calendar-cell {
            height: 36px !important;
          }
          .booking-calendar-day-circle {
            width: 30px !important;
            height: 30px !important;
            font-size: 12px !important;
          }
          .booking-slots-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 4px !important;
            margin-bottom: 14px !important;
          }
          .booking-slots-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .booking-time-slot-btn {
            padding: 11px 6px !important;
            font-size: 12.5px !important;
            min-height: 42px !important;
            box-sizing: border-box !important;
          }
          .booking-selected-slot-pill {
            padding: 10px 12px !important;
            gap: 10px !important;
            border-radius: 10px !important;
          }
          .booking-confirm-img {
            max-width: 160px !important;
            height: auto !important;
            margin: 0 auto !important;
          }
          .booking-confirm-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            margin-bottom: 6px !important;
          }
          .booking-confirm-subtitle {
            font-size: 12.5px !important;
            line-height: 1.5 !important;
          }
          .booking-confirm-card {
            padding: 16px 0 !important;
            margin-bottom: 18px !important;
            border-radius: 0 !important;
          }
          .booking-confirm-grid {
            grid-template-columns: 1fr !important;
            row-gap: 12px !important;
          }
          .booking-confirm-row {
            display: flex !important;
            align-items: flex-start !important;
            gap: 8px !important;
            font-size: 13px !important;
          }
          .booking-confirm-label,
          .booking-confirm-label-col2 {
            min-width: 105px !important;
            width: 105px !important;
            font-size: 12px !important;
            color: #64748b !important;
            flex-shrink: 0 !important;
          }
          .booking-confirm-icon {
            width: 24px !important;
            height: 24px !important;
            font-size: 12px !important;
            flex-shrink: 0 !important;
          }
          .booking-confirm-actions {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
            width: 100% !important;
          }
          .booking-action-btn {
            width: 100% !important;
            justify-content: center !important;
            margin: 0 !important;
            padding: 12px 14px !important;
            font-size: 13.5px !important;
            min-height: 44px !important;
            box-sizing: border-box !important;
          }
          .booking-sidebar-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
            box-sizing: border-box !important;
          }
          .booking-sidebar-card-header {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          .booking-footer {
            padding: 22px 0 20px !important;
            background-color: #ffffff !important;
            border-top: 1px solid #edf2ee !important;
          }
          .booking-footer-inner {
            padding: 0 16px !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 14px !important;
          }
          .booking-footer-links {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            flex-wrap: wrap !important;
            gap: 10px 20px !important;
            order: 1 !important;
          }
          .booking-footer-link {
            font-size: 13px !important;
            font-weight: 600 !important;
            color: #475569 !important;
            padding: 4px 6px !important;
            border-radius: 6px !important;
            transition: all 0.15s ease !important;
          }
          .booking-footer-link:hover {
            color: #1b4332 !important;
            background-color: #f1f5f9 !important;
          }
          .booking-footer-copyright {
            font-size: 12px !important;
            color: #94a3b8 !important;
            text-align: center !important;
            line-height: 1.55 !important;
            order: 2 !important;
            max-width: 320px !important;
          }
        }

        @media (max-width: 480px) {
          .booking-hero-banner {
            height: 160px !important;
          }
          .booking-hero-banner-image {
            min-height: 160px !important;
          }
          .booking-banner-title {
            font-size: 20px !important;
          }
          .booking-banner-subtitle {
            font-size: 12px !important;
            max-width: 270px !important;
          }
          .booking-card {
            padding: 16px 12px !important;
          }
        }

        @media (max-width: 400px) {
          .booking-step-label-short {
            font-size: 11px !important;
          }
          .booking-step-circle {
            width: 22px !important;
            height: 22px !important;
            font-size: 10.5px !important;
          }
          .booking-step-divider {
            margin: 0 4px !important;
            min-width: 6px !important;
            flex: 1 1 6px !important;
          }
          .booking-step-item {
            gap: 4px !important;
          }
          .booking-calendar-matrix {
            gap: 2px !important;
          }
          .booking-calendar-day-circle {
            width: 28px !important;
            height: 28px !important;
            font-size: 11.5px !important;
          }
          .booking-calendar-cell {
            height: 34px !important;
          }
          .booking-confirm-label,
          .booking-confirm-label-col2 {
            min-width: 95px !important;
            width: 95px !important;
            font-size: 11.5px !important;
          }
        }

        @media (max-width: 340px) {
          .booking-step-label-short {
            font-size: 10px !important;
          }
          .booking-step-divider {
            margin: 0 2px !important;
            min-width: 4px !important;
          }
          .booking-calendar-day-circle {
            width: 26px !important;
            height: 26px !important;
            font-size: 11px !important;
          }
          .booking-time-slot-btn {
            padding: 9px 4px !important;
            font-size: 11.5px !important;
          }
          .booking-confirm-label,
          .booking-confirm-label-col2 {
            min-width: 88px !important;
            width: 88px !important;
            font-size: 11px !important;
          }
        }

        /* Print Media Optimization */
        @media print {
          @page {
            margin: 12mm;
            size: A4 portrait;
          }
          body, html {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header,
          nav,
          footer,
          .booking-hero-banner,
          .booking-confirm-actions,
          .booking-sidebar-card,
          .booking-footer,
          .navbar-container,
          .navbar,
          .booking-stepper-wrap {
            display: none !important;
          }
          .booking-page-wrapper {
            padding: 0 !important;
            background: #ffffff !important;
          }
          .booking-main-content {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .booking-grid {
            display: block !important;
          }
          .booking-card {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            padding: 24px 28px !important;
            page-break-inside: avoid !important;
          }
          .booking-confirm-img {
            max-width: 130px !important;
          }
          .booking-confirm-title {
            font-size: 22px !important;
          }
          .booking-confirm-grid {
            grid-template-columns: 1.15fr 1fr !important;
            row-gap: 14px !important;
            column-gap: 28px !important;
          }
          .booking-confirm-label {
            min-width: 120px !important;
            width: 120px !important;
          }
          .booking-confirm-label-col2 {
            min-width: 72px !important;
            width: 72px !important;
          }
        }
      `}</style>

    </div>

  );

};



export default BookAppointmentPage;


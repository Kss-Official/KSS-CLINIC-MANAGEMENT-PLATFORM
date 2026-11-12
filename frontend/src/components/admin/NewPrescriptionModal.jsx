import React, { useState, useEffect, useRef, useMemo } from 'react';
import PrescriptionPreviewCard from './PrescriptionPreviewCard';
import appointmentApi from '../../api/appointmentApi';
import AdminCalendarPopover from './AdminCalendarPopover';

const getTodayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateForDisplay = (isoStr) => {
  if (!isoStr) {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  }
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${months[month]} ${year}`;
  }
  return isoStr;
};

const parseDisplayDateToIso = (dateStr) => {
  if (!dateStr) return '';
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const monthIdx = months.findIndex((m) => parts[1].toLowerCase().startsWith(m));
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
      const mm = String(monthIdx + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      return `${year}-${mm}-${dd}`;
    }
  }
  return '';
};

// Helper: Check if initialPatient is a genuine, non-synthetic patient/appointment object
const isValidInitialPatient = (p) => {
  if (!p || typeof p !== 'object') return false;
  // Guard against synthetic DOM/React events (e.g., from onClick={openNewPrescription})
  if (p.nativeEvent || p._reactName || p.target || p.currentTarget || typeof p.preventDefault === 'function') {
    return false;
  }
  const name = p.patient_name || p.name || p.patientName;
  const hasApt = Boolean(p.appointment_id || (p.id && String(p.id).startsWith('APT-')) || p.rawId);
  const hasPatId = Boolean(p.patient_id_ref || p.patient_record_id || p.patient_id || (p.id && String(p.id).startsWith('PAT-')));
  const hasRx = Boolean(p.rxId || (p.id && String(p.id).startsWith('RX-')) || p.prescriptionId);

  // Must have a real non-placeholder name, or real appointment / patient ID / prescription ID
  if (typeof name === 'string' && name.trim() && name.trim().toLowerCase() !== 'patient') {
    return true;
  }
  return Boolean(hasApt || hasPatId || hasRx);
};

const NewPrescriptionModal = ({ isOpen, onClose, onSave, initialPatient, initialStep = 1 }) => {
  const [step, setStep] = useState(initialStep || 1);
  const [existingRxId, setExistingRxId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availablePatients, setAvailablePatients] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(() => (
    isValidInitialPatient(initialPatient) ? initialPatient : null
  ));
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [appointmentDate, setAppointmentDate] = useState(getTodayIso);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [consultationType, setConsultationType] = useState('Follow-up');
  const [mainComplaint, setMainComplaint] = useState('');

  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('Skin allergy due to seasonal change.');

  const [medicines, setMedicines] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [additionalInstructions, setAdditionalInstructions] = useState(
    'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'
  );

  const [isMobileAptDropdownOpen, setIsMobileAptDropdownOpen] = useState(false);
  const [isMobileConsultDropdownOpen, setIsMobileConsultDropdownOpen] = useState(false);
  const mobileAptDropdownRef = useRef(null);
  const mobileConsultDropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (mobileAptDropdownRef.current && !mobileAptDropdownRef.current.contains(e.target)) {
        setIsMobileAptDropdownOpen(false);
      }
      if (mobileConsultDropdownRef.current && !mobileConsultDropdownRef.current.contains(e.target)) {
        setIsMobileConsultDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  const prevIsOpenRef = useRef(false);
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    // When modal transitions from closed to open:
    if (isOpen && !prevIsOpenRef.current) {
      setStep(initialStep || 1);
      setSearchQuery('');
      setSuccessMessage('');
      setErrorMessage('');
      setAttemptedSubmit(false);
      setIsSaving(false);
      setIsMobileAptDropdownOpen(false);
      setIsMobileConsultDropdownOpen(false);
      setIsCalendarOpen(false);

      if (isValidInitialPatient(initialPatient)) {
        hasAutoSelectedRef.current = true;
        const isPrescription = Boolean(
          initialPatient.rxId ||
          initialPatient.prescriptionId ||
          (initialPatient.id && String(initialPatient.id).startsWith('RX-'))
        );
        const rxIdVal = isPrescription ? (initialPatient.rxId || initialPatient.id || initialPatient.prescriptionId) : null;
        setExistingRxId(rxIdVal);

        if (isPrescription) {
          const pName = initialPatient.patientName || initialPatient.name || initialPatient.patient_name || 'Patient';
          const pPhone = initialPatient.contact || initialPatient.mobile || initialPatient.phone || initialPatient.patient_phone || '';
          const pId = initialPatient.patientId || initialPatient.patient_id_ref || (initialPatient.patient_id ? (String(initialPatient.patient_id).startsWith('PAT-') ? initialPatient.patient_id : `PAT-${initialPatient.patient_id}`) : '') || (initialPatient.patient?.id ? `PAT-${initialPatient.patient.id}` : (initialPatient.patient?.patient_id ? `PAT-${initialPatient.patient.patient_id}` : ''));
          const pAge = initialPatient.age || (initialPatient.ageGender ? initialPatient.ageGender.split('/')[0].trim() : '30');
          const pGender = initialPatient.gender || (initialPatient.ageGender ? initialPatient.ageGender.split('/')[1]?.trim() : 'Adult');

          setSelectedPatient({
            id: pId,
            name: pName,
            phone: pPhone,
            ageGender: initialPatient.ageGender || `${pAge} | ${pGender}`,
            age: pAge,
            gender: pGender,
            initials:
              pName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'PT',
            rxId: rxIdVal,
          });

          const aptNum =
            initialPatient.appointment_id ||
            initialPatient.appointmentId ||
            initialPatient.apt_number ||
            initialPatient.aptNumber ||
            '';
          const rxReason =
            initialPatient.reason_for_visit ||
            initialPatient.reason ||
            initialPatient.mainComplaint ||
            initialPatient.complaint ||
            '';
          if (aptNum) {
            setSelectedAppointment({
              id: aptNum,
              appointment_id: aptNum,
              appointmentId: aptNum,
              date: initialPatient.date,
              time: initialPatient.time,
              reason: rxReason,
              reason_for_visit: rxReason,
            });
            // Also automatically fetch the corresponding appointment details to ensure the exact reason for visit
            appointmentApi.getAppointments().then((list) => {
              if (Array.isArray(list)) {
                const foundApt = list.find((a) => (a.appointment_id === aptNum || a.id === aptNum || String(a.id) === String(aptNum)));
                if (foundApt && (foundApt.reason_for_visit || foundApt.reason)) {
                  const fetchedReason = foundApt.reason_for_visit || foundApt.reason;
                  setSelectedAppointment((prev) => ({
                    ...(prev || {}),
                    id: aptNum,
                    appointment_id: aptNum,
                    reason: fetchedReason,
                    reason_for_visit: fetchedReason,
                  }));
                  setMainComplaint((prev) => (prev && prev !== 'General Consultation' && prev !== 'Follow-up' && prev !== 'Clinical Consultation' ? prev : fetchedReason));
                }
              }
            }).catch((err) => console.warn('Could not fetch appointment details for prescription:', err));
          } else {
            setSelectedAppointment(null);
          }

          if (initialPatient.date || initialPatient.appointment_date || initialPatient.appointmentDate) {
            const iso = parseDisplayDateToIso(initialPatient.date || initialPatient.appointment_date || initialPatient.appointmentDate);
            if (iso) setAppointmentDate(iso);
          }

          if (initialPatient.consultationType || initialPatient.consultation_type) {
            setConsultationType(initialPatient.consultationType || initialPatient.consultation_type);
          }

          if (rxReason) {
            setMainComplaint(rxReason);
          }

          if (initialPatient.symptoms) {
            setSymptoms(initialPatient.symptoms);
          }
          if (initialPatient.diagnosis) {
            setDiagnosis(initialPatient.diagnosis);
          } else if (initialPatient.complaint) {
            setDiagnosis(initialPatient.complaint);
          }

          if (Array.isArray(initialPatient.medicines) && initialPatient.medicines.length > 0) {
            setMedicines(
              initialPatient.medicines.map((m, idx) => ({
                id: m.id || idx + 1,
                name: m.name || m.medicine_name || '',
                potency: m.potency || '',
                dosage: m.dosage || '',
                duration: m.duration || '',
                instructions: m.instructions || '',
              }))
            );
          } else if (rxIdVal) {
            // Asynchronously fetch prescription details to populate medicines/diagnosis if not fully in row
            appointmentApi.getPrescriptions().then((list) => {
              if (Array.isArray(list)) {
                const found = list.find((item) => item.id === rxIdVal || item.rxId === rxIdVal);
                if (found) {
                  if (found.medicines && found.medicines.length > 0) {
                    setMedicines(
                      found.medicines.map((m, idx) => ({
                        id: m.id || idx + 1,
                        name: m.name || m.medicine_name || '',
                        potency: m.potency || '',
                        dosage: m.dosage || '',
                        duration: m.duration || '',
                        instructions: m.instructions || '',
                      }))
                    );
                  }
                  if (found.diagnosis) setDiagnosis(found.diagnosis);
                  if (found.symptoms) setSymptoms(found.symptoms);
                  if (found.additionalInstructions) setAdditionalInstructions(found.additionalInstructions);
                  const fApt = found.appointment_id || found.apt_number || found.aptNumber;
                  if (fApt) {
                    setSelectedAppointment((prev) => prev || { id: fApt, appointment_id: fApt, appointmentId: fApt });
                  }
                }
              }
            }).catch((err) => console.error('Failed to load prescription medicines for workflow:', err));
          }

          if (initialPatient.additionalInstructions || initialPatient.notes) {
            setAdditionalInstructions(initialPatient.additionalInstructions || initialPatient.notes);
          }
        } else {
          // Pre-fill ONLY when a valid appointment/patient is provided (e.g. from Prescription Remaining notification)
          const isAppointment = Boolean(
            initialPatient.appointment_id ||
            (initialPatient.id && String(initialPatient.id).startsWith('APT-')) ||
            initialPatient.appointmentId ||
            initialPatient.timeSlot
          );
          if (isAppointment) {
            setSelectedAppointment(initialPatient);
            const pName = initialPatient.patient_name || initialPatient.name || initialPatient.patientName || 'Patient';
            const pPhone = initialPatient.patient_phone || initialPatient.contact || initialPatient.phone || initialPatient.mobile || '';
            const pAge = initialPatient.age || initialPatient.patient_age || (initialPatient.ageGender ? initialPatient.ageGender.split('/')[0].trim() : '30');
            const pGender = initialPatient.gender || initialPatient.patient_gender || (initialPatient.ageGender ? initialPatient.ageGender.split('/')[1]?.trim() : 'Adult');
            const pId = initialPatient.patient_id_ref || initialPatient.patient_record_id || (initialPatient.patient_record?.patient_id) || (initialPatient.patient_id ? `PAT-${initialPatient.patient_id}` : null) || initialPatient.patientId || (initialPatient.id && String(initialPatient.id).startsWith('PAT-') ? initialPatient.id : '');

            setSelectedPatient({
              id: pId,
              name: pName,
              phone: pPhone,
              ageGender: `${pAge} | ${pGender}`,
              age: pAge,
              gender: pGender,
              initials:
                pName
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'PT',
            });
            if (initialPatient.date || initialPatient.appointment_date) {
              const iso = parseDisplayDateToIso(initialPatient.date || initialPatient.appointment_date);
              if (iso) setAppointmentDate(iso);
            }
            if (initialPatient.reason || initialPatient.reason_for_visit) {
              setMainComplaint(initialPatient.reason || initialPatient.reason_for_visit);
            }
            if (initialPatient.consultationType || initialPatient.consultation_type) {
              setConsultationType(initialPatient.consultationType || initialPatient.consultation_type);
            }
          } else {
            const pName = initialPatient.name || initialPatient.patient_name || 'Patient';
            const pPhone = initialPatient.phone || initialPatient.mobile || initialPatient.contact || initialPatient.patient_phone || '';
            const pAge = initialPatient.age || initialPatient.patient_age || '30';
            const pGender = initialPatient.gender || initialPatient.patient_gender || 'Adult';
            const pId = initialPatient.id || initialPatient.patient_id || initialPatient.patient_id_ref || '';
            setSelectedPatient({
              ...initialPatient,
              id: pId,
              name: pName,
              phone: pPhone,
              age: pAge,
              gender: pGender,
              ageGender: initialPatient.ageGender || `${pAge} | ${pGender}`,
              initials:
                initialPatient.initials ||
                pName
                  .split(' ')
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() ||
                'PT',
            });
            setSelectedAppointment(null);
          }
        }
      } else {
        // Direct open: Patient MUST be empty until user searches and selects a patient!
        hasAutoSelectedRef.current = false;
        setExistingRxId(null);
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setAppointmentDate(getTodayIso());
        setMainComplaint('');
        setMedicines([]);
        setErrorMessage('');
        setAttemptedSubmit(false);
      }
    } else if (!isOpen && prevIsOpenRef.current) {
      // When modal closes: clean up completely
      hasAutoSelectedRef.current = false;
      setStep(1);
      setSearchQuery('');
      setExistingRxId(null);
      setSelectedPatient(null);
      setSelectedAppointment(null);
      setAppointmentDate(getTodayIso());
      setMainComplaint('');
      setSymptoms('');
      setDiagnosis('Skin allergy due to seasonal change.');
      setMedicines([]);
      setSuccessMessage('');
      setErrorMessage('');
      setAttemptedSubmit(false);
      setIsSaving(false);
      setIsMobileAptDropdownOpen(false);
      setIsMobileConsultDropdownOpen(false);
      setIsCalendarOpen(false);
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialPatient, initialStep]);

  // Keep step synced if initialStep changes while open
  useEffect(() => {
    if (isOpen && initialStep) {
      setStep(initialStep);
    }
  }, [isOpen, initialStep]);

  const patientAppointments = useMemo(() => {
    const list = [
      ...(availablePatients.find((p) => p.id === selectedPatient?.id || (p.name && p.name.toLowerCase() === selectedPatient?.name?.toLowerCase()))?.appointments || []),
      ...(selectedPatient?.appointments || []),
    ];
    const selId = selectedAppointment?.appointment_id || selectedAppointment?.id;
    if (selectedAppointment && selId) {
      if (!list.some((a) => String(a.appointment_id || a.id) === String(selId))) {
        list.unshift(selectedAppointment);
      }
    }
    const seen = new Set();
    return list.filter((a) => {
      const id = a.appointment_id || a.id;
      if (!id || seen.has(String(id))) return false;
      seen.add(String(id));
      return true;
    });
  }, [availablePatients, selectedPatient, selectedAppointment?.appointment_id, selectedAppointment?.id]);

  useEffect(() => {
    if (!selectedPatient) {
      setSelectedAppointment(null);
      hasAutoSelectedRef.current = false;
      return;
    }
    // If an appointment is already selected or auto-selected once, DO NOT overwrite!
    if (selectedAppointment || hasAutoSelectedRef.current) {
      return;
    }
    if (patientAppointments && patientAppointments.length > 0) {
      const match = patientAppointments.find((a) => {
        const aIso = parseDisplayDateToIso(a.date);
        return aIso && aIso === appointmentDate;
      }) || patientAppointments[0];
      if (match) {
        setSelectedAppointment(match);
        hasAutoSelectedRef.current = true;
        if (match.reason || match.reason_for_visit) {
          setMainComplaint(match.reason || match.reason_for_visit);
        }
        if (match.consultationType || match.consultation_type) {
          setConsultationType(match.consultationType || match.consultation_type);
        }
      }
    }
  }, [selectedPatient, patientAppointments, selectedAppointment, appointmentDate]);

  // Fetch real patients from Neon PostgreSQL database on modal open
  useEffect(() => {
    if (!isOpen) return;
    const fetchPatients = async () => {
      try {
        const data = await appointmentApi.getPatients();
        if (Array.isArray(data) && data.length > 0) {
          setAvailablePatients(data);
          setSelectedPatient((prev) => {
            if (!prev || !prev.name) return prev;
            const match = data.find((p) =>
              (p.mobile && prev.phone && (p.mobile === prev.phone || p.mobile.endsWith(prev.phone.slice(-10)))) ||
              (p.name && prev.name && p.name.trim().toLowerCase() === prev.name.trim().toLowerCase())
            );
            if (match) {
              return {
                ...prev,
                id: match.id || prev.id,
                name: match.name || prev.name,
                phone: match.mobile || prev.phone,
                age: match.ageGender?.split('/')[0]?.trim() || prev.age || '30',
                gender: match.ageGender?.split('/')[1]?.trim() || prev.gender || 'Adult',
                ageGender: match.ageGender || prev.ageGender || '30 | Adult',
                initials: match.initials || prev.initials,
              };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Failed to load database patients for prescription:', err);
      }
    };
    fetchPatients();
  }, [isOpen]);


  // Lock background screen scroll and handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

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
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validateMedicines = () => {
    if (!medicines || medicines.length === 0) {
      return {
        isValid: false,
        message: 'Please add at least one medicine and complete the prescription before proceeding.',
      };
    }

    const hasIncomplete = medicines.some((m) => {
      const name = (m.name || '').trim();
      const potency = (m.potency || '').trim();
      const dosage = (m.dosage || '').trim();
      const duration = (m.duration || '').trim();
      return !name || !potency || !dosage || !duration;
    });

    if (hasIncomplete) {
      return {
        isValid: false,
        message: 'Please add at least one medicine and complete the prescription before proceeding.',
      };
    }

    return { isValid: true };
  };

  const handleAddMedicine = () => {
    setErrorMessage('');
    setMedicines((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        name: '',
        potency: '',
        dosage: '',
        duration: '',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedicine = (id) => {
    setErrorMessage('');
    setMedicines((prev) => prev.filter((m) => m.id !== id));
  };

  const handleMedicineChange = (id, field, value) => {
    setErrorMessage('');
    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setErrorMessage('');

    if (!selectedPatient || !selectedPatient.name) {
      const msg = 'Please search and select a patient first.';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    const val = validateMedicines();
    if (!val.isValid) {
      setAttemptedSubmit(true);
      setErrorMessage(val.message);
      alert(val.message);
      return;
    }

    // Ensure selected date is today or a future date
    const checkDate = new Date(appointmentDate);
    checkDate.setHours(0, 0, 0, 0);
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    if (checkDate < todayZero) {
      const msg = 'Cannot select a past date. Please choose today or a future date.';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    setIsSaving(true);
    try {
      const validMeds = medicines.map((m) => ({
        id: m.id,
        name: (m.name || '').trim(),
        potency: (m.potency || '').trim(),
        dosage: (m.dosage || '').trim(),
        duration: (m.duration || '').trim(),
        instructions: (m.instructions || '').trim(),
      }));

      const effectiveAptNum =
        selectedAppointment?.appointment_id ||
        selectedAppointment?.id ||
        selectedPatient?.appointmentId ||
        selectedPatient?.appointment_id ||
        selectedPatient?.aptNumber ||
        selectedPatient?.apt_number ||
        initialPatient?.appointment_id ||
        initialPatient?.aptNumber ||
        initialPatient?.apt_number ||
        (initialPatient?.id && String(initialPatient.id).startsWith('APT-') ? initialPatient.id : null) ||
        null;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });

      const payload = {
        patient: selectedPatient,
        patient_name: selectedPatient.name,
        patient_phone: selectedPatient.phone,
        patient_id_ref: selectedPatient.id,
        appointment_id: effectiveAptNum,
        appointmentId: effectiveAptNum,
        apt_number: effectiveAptNum,
        aptNumber: effectiveAptNum,
        appointment_number: effectiveAptNum,
        age_gender: selectedPatient.ageGender || `${selectedPatient.age} / ${selectedPatient.gender}`,
        date: formatDateForDisplay(appointmentDate),
        appointmentDate,
        time: currentTime,
        consultationType,
        mainComplaint,
        complaint: mainComplaint,
        symptoms,
        diagnosis: diagnosis || mainComplaint || 'Clinical Consultation',
        medicines: validMeds,
        additionalInstructions,
        status: 'Pending',
      };

      let savedRx;
      if (existingRxId) {
        try {
          savedRx = await appointmentApi.updatePrescription(existingRxId, payload);
        } catch (updateErr) {
          console.warn('Update prescription error on Next:', updateErr);
          savedRx = { id: existingRxId, rxId: existingRxId, ...payload };
        }
      } else {
        savedRx = await appointmentApi.createPrescription(payload);
        const newRxId = savedRx.id || savedRx.rxId || savedRx.prescription_id;
        if (newRxId) {
          setExistingRxId(newRxId);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prescription-created', { detail: savedRx }));
        if (effectiveAptNum) {
          window.dispatchEvent(
            new CustomEvent('appointment-updated', {
              detail: { appointment_id: effectiveAptNum, prescription_status: 'Complete' },
            })
          );
        }
      }

      // Advance to Step 2: Prescription Preview Screen
      setStep(2);
    } catch (err) {
      console.error('Failed to save prescription on Next:', err);
      const errDetail =
        err?.response?.data?.error ||
        'Failed to save prescription to database. Please check your connection and try again.';
      setErrorMessage(errDetail);
      alert(errDetail);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrescription = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isSaving) return; // Prevent duplicate submissions
    setErrorMessage('');

    if (!selectedPatient || !selectedPatient.name) {
      const msg = 'Please select a patient before saving the prescription.';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    // Ensure selected date is today or a future date
    const checkDate = new Date(appointmentDate);
    checkDate.setHours(0, 0, 0, 0);
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    if (checkDate < todayZero) {
      const msg = 'Cannot select a past date. Please choose today or a future date.';
      setErrorMessage(msg);
      alert(msg);
      return;
    }

    const val = validateMedicines();
    if (!val.isValid) {
      setAttemptedSubmit(true);
      setErrorMessage(val.message);
      alert(val.message);
      return;
    }

    setIsSaving(true);
    try {
      const validMeds = medicines.map((m) => ({
        id: m.id,
        name: (m.name || '').trim(),
        potency: (m.potency || '').trim(),
        dosage: (m.dosage || '').trim(),
        duration: (m.duration || '').trim(),
        instructions: (m.instructions || '').trim(),
      }));

      const effectiveAptNum =
        selectedAppointment?.appointment_id ||
        selectedAppointment?.id ||
        selectedPatient?.appointmentId ||
        selectedPatient?.appointment_id ||
        selectedPatient?.aptNumber ||
        selectedPatient?.apt_number ||
        initialPatient?.appointment_id ||
        initialPatient?.aptNumber ||
        initialPatient?.apt_number ||
        (initialPatient?.id && String(initialPatient.id).startsWith('APT-') ? initialPatient.id : null) ||
        null;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });

      const payload = {
        patient: selectedPatient,
        patient_name: selectedPatient.name,
        patient_phone: selectedPatient.phone,
        patient_id_ref: selectedPatient.id,
        appointment_id: effectiveAptNum,
        appointmentId: effectiveAptNum,
        apt_number: effectiveAptNum,
        aptNumber: effectiveAptNum,
        appointment_number: effectiveAptNum,
        age_gender: selectedPatient.ageGender || `${selectedPatient.age} / ${selectedPatient.gender}`,
        date: formatDateForDisplay(appointmentDate),
        appointmentDate,
        time: currentTime,
        consultationType,
        mainComplaint,
        complaint: mainComplaint,
        symptoms,
        diagnosis: diagnosis || mainComplaint || 'Clinical Consultation',
        medicines: validMeds,
        additionalInstructions,
        status: 'Pending',
      };

      let savedRx;
      if (existingRxId) {
        try {
          savedRx = await appointmentApi.updatePrescription(existingRxId, payload);
        } catch (updateErr) {
          console.warn('Update prescription error on Save:', updateErr);
          savedRx = { id: existingRxId, rxId: existingRxId, ...payload };
        }
      } else {
        savedRx = await appointmentApi.createPrescription(payload);
        const newRxId = savedRx.id || savedRx.rxId || savedRx.prescription_id;
        if (newRxId) {
          setExistingRxId(newRxId);
        }
      }

      setSuccessMessage(`Prescription ${savedRx.id || savedRx.rxId || savedRx.prescription_id} successfully saved for ${selectedPatient.name}!`);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prescription-created', { detail: savedRx }));
        if (effectiveAptNum) {
          window.dispatchEvent(
            new CustomEvent('appointment-updated', {
              detail: { appointment_id: effectiveAptNum, prescription_status: 'Complete' },
            })
          );
        }
      }

      if (onSave) {
        onSave(savedRx);
      }

      // Brief feedback before closing modal
      setTimeout(() => {
        setSuccessMessage('');
        setIsSaving(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save prescription to database:', err);
      const errDetail = err?.response?.data?.error || 'Failed to save prescription to database. Please check your connection and try again.';
      setErrorMessage(errDetail);
      alert(errDetail);
      setIsSaving(false);
    }
  };

  const handleFinalSave = async (deliveryMethod = 'WhatsApp') => {
    if (isSaving) return;
    const val = validateMedicines();
    if (!val.isValid) {
      setAttemptedSubmit(true);
      setErrorMessage(val.message);
      alert(val.message);
      setStep(1);
      return;
    }
    setIsSaving(true);
    try {
      const effectiveAptNum =
        selectedAppointment?.appointment_id ||
        selectedAppointment?.id ||
        selectedPatient?.appointmentId ||
        selectedPatient?.appointment_id ||
        selectedPatient?.aptNumber ||
        selectedPatient?.apt_number ||
        initialPatient?.appointment_id ||
        initialPatient?.aptNumber ||
        initialPatient?.apt_number ||
        (initialPatient?.id && String(initialPatient.id).startsWith('APT-') ? initialPatient.id : null) ||
        null;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });

      const payload = {
        patient: selectedPatient,
        patient_name: selectedPatient.name,
        patient_phone: selectedPatient.phone,
        patient_id_ref: selectedPatient.id,
        appointment_id: effectiveAptNum,
        appointmentId: effectiveAptNum,
        apt_number: effectiveAptNum,
        aptNumber: effectiveAptNum,
        appointment_number: effectiveAptNum,
        age_gender: selectedPatient.ageGender || `${selectedPatient.age} / ${selectedPatient.gender}`,
        date: formatDateForDisplay(appointmentDate),
        appointmentDate,
        time: currentTime,
        consultationType,
        mainComplaint,
        complaint: mainComplaint,
        symptoms,
        diagnosis: diagnosis || mainComplaint || 'Skin allergy due to seasonal change.',
        medicines: medicines.filter((m) => m.name && m.name.trim() !== ''),
        additionalInstructions,
        status: deliveryMethod === 'WhatsApp' ? 'Delivered' : 'Pending',
      };

      if (existingRxId) {
        if (deliveryMethod === 'WhatsApp') {
          await appointmentApi.updatePrescriptionStatus(existingRxId, 'Delivered');
        }
        const finalizedRx = { id: existingRxId, rxId: existingRxId, ...payload, status: deliveryMethod === 'WhatsApp' ? 'Delivered' : 'Pending' };
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('prescription-created', { detail: finalizedRx }));
          if (effectiveAptNum) {
            window.dispatchEvent(
              new CustomEvent('appointment-updated', {
                detail: { appointment_id: effectiveAptNum, prescription_status: 'Complete' },
              })
            );
          }
        }
        if (onSave) {
          onSave(finalizedRx);
        }
        onClose();
        return;
      }

      const savedRx = await appointmentApi.createPrescription(payload);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prescription-created', { detail: savedRx }));
        if (effectiveAptNum) {
          window.dispatchEvent(
            new CustomEvent('appointment-updated', {
              detail: { appointment_id: effectiveAptNum, prescription_status: 'Complete' },
            })
          );
        }
      }
      if (onSave) {
        onSave(savedRx);
      }
      onClose();
    } catch (err) {
      console.error('Failed to finalize prescription:', err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <style>{`
        .new-rx-desktop-select {
          display: block;
        }
        .new-rx-mobile-select {
          display: none;
        }
        .new-rx-visit-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        .new-rx-symptoms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .new-rx-footer-buttons {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;
        }

        @media (max-width: 640px) {
          .new-rx-desktop-select {
            display: none !important;
          }
          .new-rx-mobile-select {
            display: block !important;
          }
          .new-rx-modal-overlay {
            padding: 10px 8px !important;
          }
          .new-rx-modal-card {
            max-height: 94vh !important;
            border-radius: 16px !important;
          }
          .new-rx-modal-scroll {
            padding: 16px 14px 20px !important;
          }
          .new-rx-visit-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .new-rx-symptoms-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .new-rx-medicines-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .new-rx-medicines-table-wrapper table {
            min-width: 580px;
          }
          .new-rx-footer-buttons {
            flex-wrap: wrap !important;
            gap: 8px !important;
            justify-content: stretch !important;
          }
          .new-rx-footer-buttons button {
            flex: 1 1 auto !important;
            min-height: 40px !important;
            padding: 8px 14px !important;
            font-size: 13px !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div
        className="new-rx-modal-overlay"
        onClick={onClose}
        onWheel={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
        onTouchMove={(e) => {
          if (e.target === e.currentTarget) e.preventDefault();
        }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          boxSizing: 'border-box',
          overflow: 'hidden',
          overscrollBehavior: 'contain',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        <div
          className="new-rx-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            width: '100%',
            maxWidth: step === 2 ? '680px' : '780px',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.25)',
            boxSizing: 'border-box',
            position: 'relative',
            maxHeight: 'calc(100vh - 48px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            className="admin-modal-scroll new-rx-modal-scroll"
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              padding: '32px 36px',
              flex: 1,
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
          {/* Modal Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '22px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 4px 0' }}>
                {step === 2 ? 'Prescription Details' : 'New Prescription'}
              </h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0 }}>
                {step === 2
                  ? 'View and review the prescription for the selected patient.'
                  : 'Create a new prescription for the selected patient.'}
              </p>
            </div>
            {/* Close X Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {step === 2 ? (
            <div>
              {/* Back to Edit Button */}
              <div style={{ marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#1e4620',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '4px 0',
                  }}
                >
                  <span>←</span>
                  <span>Edit Prescription Details</span>
                </button>
              </div>

              <PrescriptionPreviewCard
                prescriptionId={existingRxId}
                patient={{
                  ...selectedPatient,
                  appointment_id: selectedAppointment?.appointment_id || selectedAppointment?.id || selectedPatient?.appointmentId || selectedPatient?.appointment_id || selectedPatient?.aptNumber || initialPatient?.appointment_id || initialPatient?.aptNumber || '',
                  appointmentId: selectedAppointment?.appointment_id || selectedAppointment?.id || selectedPatient?.appointmentId || selectedPatient?.appointment_id || selectedPatient?.aptNumber || initialPatient?.appointment_id || initialPatient?.aptNumber || '',
                  aptNumber: selectedAppointment?.appointment_id || selectedAppointment?.id || selectedPatient?.appointmentId || selectedPatient?.appointment_id || selectedPatient?.aptNumber || initialPatient?.appointment_id || initialPatient?.aptNumber || '',
                  apt_number: selectedAppointment?.appointment_id || selectedAppointment?.id || selectedPatient?.appointmentId || selectedPatient?.appointment_id || selectedPatient?.aptNumber || initialPatient?.appointment_id || initialPatient?.aptNumber || '',
                  reason_for_visit: mainComplaint || selectedAppointment?.reason_for_visit || selectedAppointment?.reason || initialPatient?.reason_for_visit || initialPatient?.reason || initialPatient?.complaint || '',
                  reason: mainComplaint || selectedAppointment?.reason_for_visit || selectedAppointment?.reason || initialPatient?.reason_for_visit || initialPatient?.reason || initialPatient?.complaint || '',
                }}
                aptNumber={
                  selectedAppointment?.appointment_id ||
                  selectedAppointment?.id ||
                  selectedPatient?.appointmentId ||
                  selectedPatient?.appointment_id ||
                  selectedPatient?.aptNumber ||
                  initialPatient?.appointment_id ||
                  initialPatient?.aptNumber ||
                  ''
                }
                date={formatDateForDisplay(appointmentDate)}
                consultationType={consultationType}
                reasonForVisit={mainComplaint || selectedAppointment?.reason_for_visit || selectedAppointment?.reason || initialPatient?.reason_for_visit || initialPatient?.reason || initialPatient?.complaint || ''}
                diagnosis={diagnosis || mainComplaint || 'Skin allergy due to seasonal change.'}
                medicines={medicines.filter((m) => m.name && m.name.trim() !== '')}
                additionalInstructions={
                  additionalInstructions ||
                  'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'
                }
                onSendWhatsApp={async (extraData = {}) => {
                  const effectiveAptNum =
                    selectedAppointment?.appointment_id ||
                    selectedAppointment?.id ||
                    selectedPatient?.appointmentId ||
                    selectedPatient?.appointment_id ||
                    selectedPatient?.aptNumber ||
                    initialPatient?.appointment_id ||
                    initialPatient?.aptNumber ||
                    '';
                  const payload = {
                    patient: selectedPatient,
                    patient_name: selectedPatient?.name || 'Patient',
                    patient_phone: selectedPatient?.phone,
                    patient_id_ref: selectedPatient?.id,
                    appointment_id: effectiveAptNum || null,
                    appointmentId: effectiveAptNum || null,
                    apt_number: effectiveAptNum || null,
                    aptNumber: effectiveAptNum || null,
                    age_gender: selectedPatient?.ageGender || `${selectedPatient?.age} / ${selectedPatient?.gender}`,
                    date: formatDateForDisplay(appointmentDate),
                    appointmentDate,
                    consultationType,
                    mainComplaint,
                    reason_for_visit: mainComplaint || selectedAppointment?.reason_for_visit || selectedAppointment?.reason || initialPatient?.reason_for_visit || initialPatient?.reason || '',
                    reasonForVisit: mainComplaint || selectedAppointment?.reason_for_visit || selectedAppointment?.reason || initialPatient?.reason_for_visit || initialPatient?.reason || '',
                    symptoms,
                    diagnosis: diagnosis || mainComplaint || 'Skin allergy due to seasonal change.',
                    medicines: medicines.filter((m) => m.name && m.name.trim() !== ''),
                    additionalInstructions: additionalInstructions || 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.',
                    status: 'Pending',
                  };

                  let rxIdToSend = existingRxId;
                  if (!rxIdToSend) {
                    const savedRx = await appointmentApi.createPrescription(payload);
                    rxIdToSend = savedRx.id || savedRx.rxId;
                  }

                  try {
                    const res = await appointmentApi.sendPrescriptionWhatsApp(rxIdToSend, {
                      phone: selectedPatient?.phone,
                      patientName: selectedPatient?.name,
                      patientId: selectedPatient?.id,
                      ageGender: selectedPatient?.ageGender,
                      date: formatDateForDisplay(appointmentDate),
                      consultationType,
                      diagnosis: payload.diagnosis,
                      medicines: payload.medicines,
                      additionalInstructions: payload.additionalInstructions,
                      aptNumber: effectiveAptNum,
                      pdf_base64: extraData.pdf_base64,
                    });
                    await appointmentApi.updatePrescriptionStatus(rxIdToSend, 'Delivered');
                    if (onSave) {
                      onSave({
                        ...(savedRx || {}),
                        id: rxIdToSend,
                        rxId: rxIdToSend,
                        status: 'Delivered',
                        created_at: (savedRx && savedRx.created_at) || new Date().toISOString(),
                        appointment_date: (savedRx && savedRx.appointment_date) || payload.date,
                        appointmentDate: (savedRx && savedRx.appointmentDate) || payload.date,
                        ...payload,
                      });
                    }
                    window.dispatchEvent(new CustomEvent('prescription-whatsapp-sent', {
                      detail: { rxId: rxIdToSend, status: 'Delivered' }
                    }));
                    return res;
                  } catch (sendErr) {
                    if (onSave) {
                      onSave({
                        ...(savedRx || {}),
                        id: rxIdToSend,
                        rxId: rxIdToSend,
                        status: 'Pending',
                        created_at: (savedRx && savedRx.created_at) || new Date().toISOString(),
                        appointment_date: (savedRx && savedRx.appointment_date) || payload.date,
                        appointmentDate: (savedRx && savedRx.appointmentDate) || payload.date,
                        ...payload,
                      });
                    }
                    throw sendErr;
                  }
                }}
                onDownloadPdf={() => {
                  handleFinalSave('PDF');
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Section 1: Patient Details */}
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
                  Patient Details
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Search and select a patient for the prescription.
                </p>

                {/* Search Patient */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="prescription-modal-patient-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by patient name, mobile number or patient ID..."
                    style={{
                      width: '100%',
                      height: '42px',
                      paddingLeft: '40px',
                      paddingRight: '14px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      color: '#1e293b',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                    onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                  />
                  {/* Search results dropdown */}
                  {searchQuery.trim() && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        marginTop: '4px',
                        maxHeight: '160px',
                        overflowY: 'auto',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 20,
                      }}
                    >
                      {(() => {
                        const q = searchQuery.toLowerCase().trim();
                        const filtered = availablePatients.filter((p) => {
                          return (
                            (p.name && p.name.toLowerCase().includes(q)) ||
                            (p.mobile && p.mobile.includes(q)) ||
                            (p.id && p.id.toLowerCase().includes(q))
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div style={{ padding: '12px 14px', fontSize: '13px', color: '#64748b' }}>
                              No patient found matching "{searchQuery}"
                            </div>
                          );
                        }

                        return filtered.map((p) => (
                          <div
                            key={p.id}
                            className="patient-search-result-item"
                            onClick={() => {
                              setSelectedPatient({
                                id: p.id,
                                name: p.name,
                                phone: p.mobile,
                                age: p.ageGender?.split('/')[0]?.trim() || '28 Years',
                                gender: p.ageGender?.split('/')[1]?.trim() || 'Adult',
                                ageGender: p.ageGender || '28 Years / Adult',
                                initials: p.initials || 'PT',
                                appointments: p.appointments || [],
                              });
                              const apts = p.appointments || [];
                              if (apts.length > 0) {
                                const latestApt = apts[0];
                                setSelectedAppointment(latestApt);
                                hasAutoSelectedRef.current = true;
                                if (latestApt.reason || latestApt.reason_for_visit) {
                                  setMainComplaint(latestApt.reason || latestApt.reason_for_visit);
                                }
                                if (latestApt.consultationType || latestApt.consultation_type) {
                                  setConsultationType(latestApt.consultationType || latestApt.consultation_type);
                                }
                                const iso = parseDisplayDateToIso(latestApt.date);
                                if (iso) setAppointmentDate(iso);
                              } else {
                                setSelectedAppointment(null);
                                hasAutoSelectedRef.current = false;
                                if (p.primaryConcern) {
                                  setMainComplaint(p.primaryConcern);
                                }
                              }
                              setSearchQuery('');
                            }}
                            style={{
                              padding: '10px 14px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '13px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                          >
                            <span style={{ fontWeight: '600', color: '#0f172a' }}>{p.name} ({p.id})</span>
                            <span style={{ color: '#64748b', fontSize: '12px' }}>{p.mobile}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Selected Patient Card */}
                {selectedPatient && (
                  <div
                    id="new-prescription-selected-patient-card"
                    style={{
                      backgroundColor: '#edf7ed',
                      border: '1px solid #c7e6c9',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#bbf7d0',
                          color: '#166534',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {selectedPatient.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                          {selectedPatient.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#52606d', marginTop: '2px' }}>
                          {selectedPatient.id} &nbsp;|&nbsp; {selectedPatient.phone} &nbsp;|&nbsp; {selectedPatient.age} &nbsp;|&nbsp; {selectedPatient.gender}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSelectedAppointment(null);
                        hasAutoSelectedRef.current = false;
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#16a34a',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title="Remove patient selection"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Section 2: Visit Details */}
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
                  Visit Details
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Enter the consultation information.
                </p>

                {patientAppointments && patientAppointments.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Select Linked Appointment
                    </label>

                    {/* Desktop Select */}
                    <div className="new-rx-desktop-select">
                      <select
                        value={selectedAppointment?.appointment_id || selectedAppointment?.id || ''}
                        onChange={(e) => {
                          const aptId = e.target.value;
                          hasAutoSelectedRef.current = true;
                          if (!aptId) {
                            setSelectedAppointment(null);
                            return;
                          }
                          const apt = patientAppointments.find((a) => String(a.id) === String(aptId) || String(a.appointment_id) === String(aptId));
                          if (apt) {
                            setSelectedAppointment(apt);
                            const iso = parseDisplayDateToIso(apt.date);
                            if (iso) setAppointmentDate(iso);
                            if (apt.consultationType || apt.consultation_type) {
                              setConsultationType(apt.consultationType || apt.consultation_type);
                            }
                            if (apt.reason || apt.reason_for_visit) {
                              setMainComplaint(apt.reason || apt.reason_for_visit);
                            }
                          } else {
                            setSelectedAppointment(null);
                          }
                        }}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="">-- Match appointment automatically by date --</option>
                        {patientAppointments.map((a) => {
                          const aptKey = a.appointment_id || a.id;
                          const timeStr = a.time ? ` (${a.time})` : '';
                          return (
                            <option key={aptKey} value={aptKey}>
                              {aptKey} — {a.date}{timeStr}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Mobile Custom Dropdown (full-width within mobile screen, scrollable) */}
                    <div className="new-rx-mobile-select" ref={mobileAptDropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileAptDropdownOpen((prev) => !prev);
                          setIsMobileConsultDropdownOpen(false);
                          setIsCalendarOpen(false);
                        }}
                        style={{
                          width: '100%',
                          minHeight: '42px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: isMobileAptDropdownOpen ? '1.5px solid #1e4620' : '1px solid #cbd5e1',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          color: selectedAppointment ? '#0f172a' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {selectedAppointment
                            ? `${selectedAppointment.appointment_id || selectedAppointment.id} — ${selectedAppointment.date}${selectedAppointment.time ? ` (${selectedAppointment.time})` : ''}`
                            : '-- Match appointment automatically by date --'}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            flexShrink: 0,
                            transform: isMobileAptDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isMobileAptDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            maxHeight: '220px',
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 1050,
                          }}
                        >
                          <div
                            onClick={() => {
                              hasAutoSelectedRef.current = true;
                              setSelectedAppointment(null);
                              setIsMobileAptDropdownOpen(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              fontSize: '13px',
                              color: !selectedAppointment ? '#1e4620' : '#475569',
                              fontWeight: !selectedAppointment ? '600' : '400',
                              backgroundColor: !selectedAppointment ? '#f0fdf4' : 'transparent',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                            }}
                          >
                            -- Match appointment automatically by date --
                          </div>
                          {patientAppointments.map((a) => {
                            const aptKey = a.appointment_id || a.id;
                            const currentSelectedKey = selectedAppointment?.appointment_id || selectedAppointment?.id;
                            const isSelected = currentSelectedKey && String(currentSelectedKey) === String(aptKey);
                            const timeStr = a.time ? ` (${a.time})` : '';
                            return (
                              <div
                                key={aptKey}
                                onClick={() => {
                                  hasAutoSelectedRef.current = true;
                                  setSelectedAppointment(a);
                                  const iso = parseDisplayDateToIso(a.date);
                                  if (iso) setAppointmentDate(iso);
                                  if (a.consultationType || a.consultation_type) {
                                    setConsultationType(a.consultationType || a.consultation_type);
                                  }
                                  if (a.reason || a.reason_for_visit) {
                                    setMainComplaint(a.reason || a.reason_for_visit);
                                  }
                                  setIsMobileAptDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  fontSize: '13px',
                                  color: isSelected ? '#1e4620' : '#0f172a',
                                  fontWeight: isSelected ? '600' : '400',
                                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                  wordBreak: 'break-word',
                                }}
                              >
                                {aptKey} — {a.date}{timeStr}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="new-rx-visit-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Appointment Date
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div
                        onClick={() => {
                          setIsCalendarOpen((prev) => !prev);
                          setIsMobileAptDropdownOpen(false);
                          setIsMobileConsultDropdownOpen(false);
                        }}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          color: '#1e293b',
                          backgroundColor: '#ffffff',
                          boxSizing: 'border-box',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                      >
                        <span>{formatDateForDisplay(appointmentDate)}</span>
                        <span style={{ fontSize: '14px' }}>📅</span>
                      </div>
                      <AdminCalendarPopover
                        isOpen={isCalendarOpen}
                        onClose={() => setIsCalendarOpen(false)}
                        selectedDate={appointmentDate}
                        disablePastDates={true}
                        onSelectDate={(displayStr, isoStr) => {
                          if (isoStr) setAppointmentDate(isoStr);
                          setIsCalendarOpen(false);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Consultation Type
                    </label>

                    {/* Desktop Select */}
                    <div className="new-rx-desktop-select">
                      <select
                        value={consultationType}
                        onChange={(e) => setConsultationType(e.target.value)}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="In-clinic Visit">In-clinic Visit</option>
                        <option value="Online Video">Online Video</option>
                        <option value="Follow-up Call">Follow-up Call</option>
                      </select>
                    </div>

                    {/* Mobile Custom Dropdown */}
                    <div className="new-rx-mobile-select" ref={mobileConsultDropdownRef} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileConsultDropdownOpen((prev) => !prev);
                          setIsMobileAptDropdownOpen(false);
                          setIsCalendarOpen(false);
                        }}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isMobileConsultDropdownOpen ? '1.5px solid #1e4620' : '1px solid #cbd5e1',
                          fontSize: '13px',
                          backgroundColor: '#ffffff',
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <span>{consultationType}</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#64748b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            flexShrink: 0,
                            transform: isMobileConsultDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {isMobileConsultDropdownOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                            zIndex: 1050,
                            overflow: 'hidden',
                          }}
                        >
                          {['In-clinic Visit', 'Online Video', 'Follow-up Call'].map((cType) => {
                            const isSelected = consultationType === cType;
                            return (
                              <div
                                key={cType}
                                onClick={() => {
                                  setConsultationType(cType);
                                  setIsMobileConsultDropdownOpen(false);
                                }}
                                style={{
                                  padding: '10px 12px',
                                  fontSize: '13px',
                                  color: isSelected ? '#1e4620' : '#0f172a',
                                  fontWeight: isSelected ? '600' : '400',
                                  backgroundColor: isSelected ? '#f0fdf4' : 'transparent',
                                  borderBottom: '1px solid #f1f5f9',
                                  cursor: 'pointer',
                                }}
                              >
                                {cType}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Complaint / Reason for Visit field auto-populated from Appointment */}
                <div style={{ marginTop: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                    Main Complaint (Reason for Visit)
                  </label>
                  <input
                    type="text"
                    value={mainComplaint}
                    onChange={(e) => setMainComplaint(e.target.value)}
                    placeholder="Reason for Visit from appointment booking"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Section 3: Symptoms & Diagnosis */}
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
                  Symptoms & Diagnosis
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Record patient's symptoms and your clinical diagnosis.
                </p>

                <div className="new-rx-symptoms-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Symptoms (Optional)
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) setSymptoms(e.target.value);
                      }}
                      rows={3}
                      placeholder="Enter symptoms observed or shared by the patient..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                      {symptoms.length}/500
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                      Diagnosis / Case Notes (Optional)
                    </label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) setDiagnosis(e.target.value);
                      }}
                      rows={3}
                      placeholder="Enter your diagnosis, observations or case notes..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                      {diagnosis.length}/500
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Prescription Details */}
              <div style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b', margin: '0 0 2px 0' }}>
                  Prescription Details
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px 0' }}>
                  Add medicines and dosage instructions.
                </p>

                {/* Validation Error Message Banner if attempted without valid medicines */}
                {errorMessage && (
                  <div
                    id="rx-medicines-error-banner"
                    style={{
                      marginBottom: '12px',
                      padding: '10px 14px',
                      backgroundColor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      color: '#b91c1c',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Medicines Table */}
                <div className="new-rx-medicines-table-wrapper" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                  <table id="rx-medicines-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '10px 12px', color: '#64748b', width: '36px' }}>No.</th>
                        <th style={{ padding: '10px 12px', color: '#64748b', minWidth: '150px' }}>Medicine Name <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ padding: '10px 12px', color: '#64748b', width: '110px' }}>Potency <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ padding: '10px 12px', color: '#64748b', width: '125px' }}>Dosage <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ padding: '10px 12px', color: '#64748b', width: '105px' }}>Duration <span style={{ color: '#ef4444' }}>*</span></th>
                        <th style={{ padding: '10px 12px', color: '#64748b', minWidth: '150px' }}>Instructions (Optional)</th>
                        <th style={{ padding: '10px 12px', color: '#64748b', width: '45px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicines.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              padding: '24px 16px',
                              textAlign: 'center',
                              color: '#64748b',
                              fontSize: '13px',
                              backgroundColor: '#f8fafc',
                            }}
                          >
                            No medicines added. Click{' '}
                            <button
                              type="button"
                              id="rx-empty-add-medicine-btn"
                              onClick={handleAddMedicine}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#166534',
                                fontWeight: '600',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0,
                              }}
                            >
                              + Add Medicine
                            </button>{' '}
                            to add medicines and dosage instructions.
                          </td>
                        </tr>
                      ) : (
                        medicines.map((med, idx) => {
                          const isInvalidName = attemptedSubmit && !med.name?.trim();
                          const isInvalidPotency = attemptedSubmit && !med.potency?.trim();
                          const isInvalidDosage = attemptedSubmit && !med.dosage?.trim();
                          const isInvalidDuration = attemptedSubmit && !med.duration?.trim();

                          return (
                            <tr key={med.id || idx} style={{ borderBottom: idx < medicines.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <td style={{ padding: '10px 12px', color: '#64748b', fontWeight: '600' }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={(e) => handleMedicineChange(med.id, 'name', e.target.value)}
                                  placeholder="Medicine name"
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: isInvalidName ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                                    backgroundColor: isInvalidName ? '#fff5f5' : '#ffffff',
                                    fontSize: '12.5px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = isInvalidName ? '#ef4444' : '#1e4620')}
                                  onBlur={(e) => (e.target.style.borderColor = isInvalidName ? '#ef4444' : '#cbd5e1')}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={med.potency}
                                  onChange={(e) => handleMedicineChange(med.id, 'potency', e.target.value)}
                                  placeholder="e.g. 30C, 200C"
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: isInvalidPotency ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                                    backgroundColor: isInvalidPotency ? '#fff5f5' : '#ffffff',
                                    fontSize: '12.5px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = isInvalidPotency ? '#ef4444' : '#1e4620')}
                                  onBlur={(e) => (e.target.style.borderColor = isInvalidPotency ? '#ef4444' : '#cbd5e1')}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={med.dosage}
                                  onChange={(e) => handleMedicineChange(med.id, 'dosage', e.target.value)}
                                  placeholder="e.g. 4 pills, 2 drops"
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: isInvalidDosage ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                                    backgroundColor: isInvalidDosage ? '#fff5f5' : '#ffffff',
                                    fontSize: '12.5px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = isInvalidDosage ? '#ef4444' : '#1e4620')}
                                  onBlur={(e) => (e.target.style.borderColor = isInvalidDosage ? '#ef4444' : '#cbd5e1')}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => handleMedicineChange(med.id, 'duration', e.target.value)}
                                  placeholder="e.g. 15 Days"
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: isInvalidDuration ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
                                    backgroundColor: isInvalidDuration ? '#fff5f5' : '#ffffff',
                                    fontSize: '12.5px',
                                    color: '#1e293b',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = isInvalidDuration ? '#ef4444' : '#1e4620')}
                                  onBlur={(e) => (e.target.style.borderColor = isInvalidDuration ? '#ef4444' : '#cbd5e1')}
                                />
                              </td>
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="text"
                                  value={med.instructions}
                                  onChange={(e) => handleMedicineChange(med.id, 'instructions', e.target.value)}
                                  placeholder="e.g. Twice daily"
                                  style={{
                                    width: '100%',
                                    height: '36px',
                                    padding: '0 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '12.5px',
                                    color: '#1e293b',
                                    backgroundColor: '#ffffff',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                  }}
                                  onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="rx-delete-row-btn"
                                  onClick={() => handleRemoveMedicine(med.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    padding: '6px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ef4444';
                                    e.currentTarget.style.backgroundColor = '#fee2e2';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                  title="Delete row"
                                  aria-label={`Delete medicine ${idx + 1}`}
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* + Add Medicine Button */}
                <button
                  type="button"
                  id="rx-add-medicine-btn"
                  onClick={handleAddMedicine}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #bbf7d0',
                    backgroundColor: '#f0fdf4',
                    color: '#166534',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  <span>+</span>
                  <span>Add Medicine</span>
                </button>
              </div>

              {/* Section 5: Additional Instructions (Optional) */}
              <div style={{ marginBottom: '26px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={additionalInstructions}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setAdditionalInstructions(e.target.value);
                  }}
                  rows={3}
                  placeholder="Diet suggestions, precautions, follow-up notes, or any additional instructions..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {additionalInstructions.length}/500
                </div>
              </div>

              {/* Success Message Banner */}
              {successMessage && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    color: '#065f46',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Validation Error Message Banner */}
              {errorMessage && (
                <div
                  id="rx-validation-error-message"
                  style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    color: '#b91c1c',
                    fontSize: '13.5px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Modal Footer Buttons */}
              <div
                className="new-rx-footer-buttons"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                {/* 1. Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  Close
                </button>

                {/* 2. Save Button (Saves to Neon Database and links to Patient) */}
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSaving ? '#94a3b8' : '#0f766e',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(15, 118, 110, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#0d655e';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) e.currentTarget.style.backgroundColor = '#0f766e';
                  }}
                >
                  {isSaving ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      <span>Save</span>
                    </>
                  )}
                </button>

                {/* 3. Next Button (Advances to Prescription Preview) */}
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 26px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#1e4620',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? (
                    <>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '14px',
                          height: '14px',
                          border: '2px solid #ffffff',
                          borderTopColor: 'transparent',
                          borderRadius: '50%',
                        }}
                      />
                      <span>Saving & Next...</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default NewPrescriptionModal;


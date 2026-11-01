import React, { useRef, useState, useEffect } from 'react';

const AppointmentModal = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: '10:00 AM',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      setIsSubmitted(false);
    }
  }, [isOpen]);

  // Handle light-dismiss (clicking outside the modal)
  const handleDialogClick = (e) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isClickOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;

    if (isClickOutside) {
      onClose();
    }
  };

  const [modalErrors, setModalErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const cleaned = value.replace(/[^a-zA-Z\s]/g, '').slice(0, 25);
      if (/[^a-zA-Z\s]/.test(value)) {
        setModalErrors((prev) => ({ ...prev, name: 'Only alphabets and spaces are allowed' }));
      } else if (modalErrors.name) {
        setModalErrors((prev) => ({ ...prev, name: '' }));
      }
      setFormData((prev) => ({ ...prev, name: cleaned }));
      return;
    }

    if (name === 'phone') {
      let digits = value.replace(/\D/g, '');
      if (digits.length > 10 && digits.startsWith('91')) {
        digits = digits.slice(2);
      }
      if (/\D/.test(value)) {
        setModalErrors((prev) => ({ ...prev, phone: 'Only numbers are allowed' }));
      } else if (digits.length > 0 && !/^[6-9]/.test(digits)) {
        setModalErrors((prev) => ({ ...prev, phone: 'Mobile number must start with 6, 7, 8, or 9' }));
        return;
      } else if (modalErrors.phone) {
        setModalErrors((prev) => ({ ...prev, phone: '' }));
      }
      digits = digits.slice(0, 10);
      setFormData((prev) => ({ ...prev, phone: digits }));
      return;
    }

    if (name === 'email') {
      let val = value.replace(/\s/g, '');
      const comMatch = val.match(/^([^@]+@[a-zA-Z0-9.-]+\.com)(.+)$/i);
      if (comMatch) {
        val = comMatch[1];
        setModalErrors((prev) => ({ ...prev, email: 'No words or characters allowed after .com' }));
      } else if (modalErrors.email) {
        setModalErrors((prev) => ({ ...prev, email: '' }));
      }
      setFormData((prev) => ({ ...prev, email: val }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (modalErrors[name]) {
      setModalErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    const nameTrimmed = (formData.name || '').trim();
    if (!nameTrimmed) {
      errors.name = 'Full Name is required';
    } else if (nameTrimmed.length > 25) {
      errors.name = 'Full Name cannot exceed 25 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(nameTrimmed)) {
      errors.name = 'Only alphabets and spaces are allowed';
    }

    const digits = (formData.phone || '').replace(/\D/g, '');
    if (!digits) {
      errors.phone = 'Phone number is required';
    } else if (digits.length !== 10) {
      errors.phone = 'Phone number must be exactly 10 digits';
    } else if (!/^[6-9]/.test(digits)) {
      errors.phone = 'Mobile number must start with 6, 7, 8, or 9';
    }

    const emailVal = (formData.email || '').trim();
    if (emailVal) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(emailVal)) {
        errors.email = 'Please enter a valid email address';
      } else if (/\.com.+$/i.test(emailVal)) {
        errors.email = 'No words or characters allowed after .com';
      }
    }

    if (Object.keys(errors).length > 0) {
      setModalErrors(errors);
      return;
    }

    setIsSubmitted(true);
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      aria-labelledby="modal-title"
      style={{
        overflow: 'hidden',
        border: 'none',
        borderRadius: '20px',
      }}
    >
      <div style={{ padding: '32px 28px', position: 'relative' }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4b5563',
          }}
        >
          ✕
        </button>

        {isSubmitted ? (
          <div style={{ textAlign: 'center', padding: '24px 10px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                fontSize: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              ✓
            </div>
            <h2 id="modal-title" style={{ fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Appointment Requested!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              Thank you, <strong>{formData.name}</strong>. Our clinic team will call you shortly on{' '}
              <strong>{formData.phone}</strong> to confirm your slot on <strong>{formData.date || 'your chosen date'}</strong> at{' '}
              <strong>{formData.time}</strong>.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={onClose}
              style={{ width: '100%' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '22px' }}>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#2e7d32',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Dr. Kumar Tripathi Ampeh (Pat.) Clinic
              </span>
              <h2
                id="modal-title"
                style={{
                  fontSize: '24px',
                  fontWeight: '800',
                  color: '#111827',
                  marginTop: '4px',
                }}
              >
                Book Your Consultation
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
                Fill in your details for a personalized homeopathic health consultation.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                      Full Name *
                    </label>
                    <span style={{ fontSize: '12px', color: (formData.name || '').length >= 25 ? '#ef4444' : '#9ca3af' }}>
                      {(formData.name || '').length}/25
                    </span>
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    autoFocus
                    maxLength={25}
                    placeholder="e.g. Ramesh Patel"
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: modalErrors.name ? '1px solid #ef4444' : '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  {modalErrors.name && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.name}</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                        Phone Number *
                      </label>
                      <span style={{ fontSize: '12px', color: (formData.phone || '').length === 10 ? '#16a34a' : '#9ca3af' }}>
                        {(formData.phone || '').length}/10
                      </span>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      required
                      maxLength={10}
                      placeholder="Starts with 6-9"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: modalErrors.phone ? '1px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    {modalErrors.phone && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.phone}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="patient@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: modalErrors.email ? '1px solid #ef4444' : '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                    {modalErrors.email && <p style={{ fontSize: '12px', color: '#ef4444', margin: '4px 0 0' }}>{modalErrors.email}</p>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Time Slot
                    </label>
                    <select
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="10:00 AM">Morning (10:00 AM - 12:00 PM)</option>
                      <option value="12:30 PM">Afternoon (12:30 PM - 03:00 PM)</option>
                      <option value="04:30 PM">Evening (04:30 PM - 07:00 PM)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                    Brief Health Concern / Symptoms
                  </label>
                  <textarea
                    name="notes"
                    rows="3"
                    placeholder="e.g. Chronic migraines, allergies, skin irritation..."
                    value={formData.notes}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '8px', padding: '14px' }}
                >
                  Confirm Appointment Request
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </dialog>
  );
};

export default AppointmentModal;


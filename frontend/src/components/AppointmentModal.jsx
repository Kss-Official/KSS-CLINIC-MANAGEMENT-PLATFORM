import React, { useRef, useState, useEffect } from 'react';
import appointmentApi from '../api/appointmentApi';

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

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    appointmentApi.bookAppointment({
      patient_name: formData.name,
      patient_phone: formData.phone,
      patient_email: formData.email,
      appointment_date: formData.date || '28 Oct 2026',
      time_slot: formData.time || '10:00 AM',
      reason_for_visit: formData.notes || 'Homeopathic Consultation',
      consultation_type: 'In clinic Visit',
      status: 'Confirmed',
    }).catch((err) => console.error('Booking failed:', err));
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
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    autoFocus
                    placeholder="e.g. Ramesh Patel"
                    value={formData.name}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
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
                        border: '1px solid #d1d5db',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                    />
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


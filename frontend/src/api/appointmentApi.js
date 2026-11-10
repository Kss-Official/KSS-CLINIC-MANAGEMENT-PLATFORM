import axiosClient from './axiosClient';

export const appointmentApi = {
  // Appointments
  getAppointments: async (params = {}) => {
    const response = await axiosClient.get('/appointments/', { params });
    return response.data;
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await axiosClient.patch(`/appointments/${id}/`, { status });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kss_appointment_sync', Date.now().toString());
      } catch {}
      window.dispatchEvent(
        new CustomEvent('appointment-updated', { detail: response.data })
      );
      window.dispatchEvent(
        new CustomEvent('appointment-booked', { detail: response.data })
      );
    }
    return response.data;
  },

  rescheduleAppointment: async (id, data) => {
    const response = await axiosClient.patch(`/appointments/${id}/`, {
      ...data,
      status: 'Rescheduled',
    });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kss_appointment_sync', Date.now().toString());
      } catch {}
      window.dispatchEvent(
        new CustomEvent('appointment-updated', { detail: response.data })
      );
      window.dispatchEvent(
        new CustomEvent('appointment-booked', { detail: response.data })
      );
    }
    return response.data;
  },

  deleteAppointment: async (id) => {
    const response = await axiosClient.delete(`/appointments/${id}/`);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kss_appointment_sync', Date.now().toString());
      } catch {}
      window.dispatchEvent(
        new CustomEvent('appointment-deleted', { detail: { id } })
      );
      window.dispatchEvent(
        new CustomEvent('appointment-booked', { detail: { id } })
      );
      window.dispatchEvent(
        new CustomEvent('appointment-updated', { detail: { id } })
      );
    }
    return response.data;
  },

  bookAppointment: async (appointmentData) => {
    const response = await axiosClient.post('/appointments/', appointmentData);
    // Notify any active components in the same window
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kss_appointment_sync', Date.now().toString());
      } catch {}
      window.dispatchEvent(
        new CustomEvent('appointment-booked', { detail: response.data })
      );
      window.dispatchEvent(
        new CustomEvent('appointment-updated', { detail: response.data })
      );
    }
    return response.data;
  },

  getBookedSlots: async (date, excludeId = null) => {
    const params = {};
    if (date) params.date = date;
    if (excludeId) params.exclude_id = excludeId;
    const response = await axiosClient.get('/appointments/slots/', { params });
    return response.data;
  },

  getAppointmentStats: async () => {
    const response = await axiosClient.get('/appointments/stats/');
    return response.data;
  },

  // Patients
  getMyProfile: async (params = {}) => {
    const response = await axiosClient.get('/patients/me/', { params });
    return response.data;
  },

  updateMyProfile: async (data) => {
    const response = await axiosClient.patch('/patients/me/', data);
    return response.data;
  },

  getPatients: async (params = {}) => {
    const response = await axiosClient.get('/patients/', { params });
    return response.data;
  },

  getPatientDetail: async (id) => {
    const response = await axiosClient.get(`/patients/${id}/`);
    return response.data;
  },

  updatePatient: async (id, data) => {
    const response = await axiosClient.patch(`/patients/${id}/`, data);
    return response.data;
  },

  // Prescriptions
  getPrescriptions: async (params = {}) => {
    const response = await axiosClient.get('/prescriptions/', { params });
    return response.data;
  },

  createPrescription: async (prescriptionData) => {
    const response = await axiosClient.post('/prescriptions/', prescriptionData);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('prescription-created', { detail: response.data })
      );
    }
    return response.data;
  },

  updatePrescriptionStatus: async (rxId, status) => {
    const response = await axiosClient.patch(`/prescriptions/${rxId}/`, { status });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('prescription-updated', { detail: response.data })
      );
      window.dispatchEvent(
        new CustomEvent('prescription-created', { detail: response.data })
      );
    }
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await axiosClient.get('/notifications/');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await axiosClient.post(`/notifications/${id}/read/`);
    return response.data;
  },

  markAllNotificationsRead: async () => {
    const response = await axiosClient.post('/notifications/mark-all-read/');
    return response.data;
  },

  // Notification Settings
  getNotificationSettings: async () => {
    try {
      const response = await axiosClient.get('/settings/notifications/');
      return response.data;
    } catch {
      const clinic = await appointmentApi.getClinicSettings();
      return clinic.notifications || {};
    }
  },

  updateNotificationSettings: async (settingsData) => {
    const response = await axiosClient.post('/settings/notifications/', settingsData);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('notification-settings-updated', {
          detail: response.data?.notifications || settingsData?.notifications || settingsData,
        })
      );
    }
    return response.data;
  },

  // Clinic Settings
  getClinicSettings: async () => {
    const response = await axiosClient.get('/settings/clinic/');
    return response.data;
  },

  updateClinicSettings: async (settingsData) => {
    const response = await axiosClient.post('/settings/clinic/', settingsData);
    return response.data;
  },

  // Appointment Settings (Working Days, Hours, Slots)
  getAppointmentSettings: async () => {
    const response = await axiosClient.get('/settings/appointment/');
    return response.data;
  },

  updateAppointmentSettings: async (settingsData) => {
    const response = await axiosClient.post('/settings/appointment/', settingsData);
    return response.data;
  },

  uploadClinicProfileImage: async (formData) => {
    const response = await axiosClient.post('/settings/clinic/profile-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removeClinicProfileImage: async () => {
    const response = await axiosClient.delete('/settings/clinic/profile-image/');
    return response.data;
  },

  // WhatsApp Cloud API Prescription Sender
  sendPrescriptionWhatsApp: async (rxId, data = {}) => {
    const target = rxId ? `/prescriptions/${encodeURIComponent(rxId)}/send-whatsapp/` : '/prescriptions/send-whatsapp/';
    const response = await axiosClient.post(target, data);
    return response.data;
  },

  // WhatsApp Cloud API Appointment Confirmation Sender
  sendAppointmentWhatsApp: async (appointmentId, data = {}) => {
    const target = appointmentId ? `/appointments/${encodeURIComponent(appointmentId)}/send-whatsapp/` : '/appointments/send-whatsapp/';
    const response = await axiosClient.post(target, data);
    return response.data;
  },

  // Appointment PDF
  getAppointmentPdfUrl: (appointmentId) => {
    return `/api/appointments/${encodeURIComponent(appointmentId)}/pdf/`;
  },

  downloadAppointmentPdfBlob: async (appointmentId) => {
    const response = await axiosClient.get(`/appointments/${encodeURIComponent(appointmentId)}/pdf/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default appointmentApi;

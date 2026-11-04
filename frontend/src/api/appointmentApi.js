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
      window.dispatchEvent(
        new CustomEvent('appointment-updated', { detail: response.data })
      );
    }
    return response.data;
  },

  deleteAppointment: async (id) => {
    const response = await axiosClient.delete(`/appointments/${id}/`);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('appointment-deleted', { detail: { id } })
      );
    }
    return response.data;
  },

  bookAppointment: async (appointmentData) => {
    const response = await axiosClient.post('/appointments/', appointmentData);
    // Notify any active components in the same window
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('appointment-booked', { detail: response.data })
      );
    }
    return response.data;
  },

  getBookedSlots: async (date) => {
    const params = date ? { date } : {};
    const response = await axiosClient.get('/appointments/slots/', { params });
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

  // Clinic Settings
  getClinicSettings: async () => {
    const response = await axiosClient.get('/settings/clinic/');
    return response.data;
  },

  updateClinicSettings: async (settingsData) => {
    const response = await axiosClient.post('/settings/clinic/', settingsData);
    return response.data;
  },

  // WhatsApp Cloud API Prescription Sender
  sendPrescriptionWhatsApp: async (rxId, data = {}) => {
    const target = rxId ? `/prescriptions/${encodeURIComponent(rxId)}/send-whatsapp/` : '/prescriptions/send-whatsapp/';
    const response = await axiosClient.post(target, data);
    return response.data;
  },
};

export default appointmentApi;

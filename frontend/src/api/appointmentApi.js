import axiosClient from './axiosClient';

export const appointmentApi = {
  // Appointments
  getAppointments: async (params = {}) => {
    const response = await axiosClient.get('/appointments/', { params });
    return response.data;
  },

  updateAppointmentStatus: async (id, status) => {
    const response = await axiosClient.patch(`/appointments/${id}/`, { status });
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
};

export default appointmentApi;

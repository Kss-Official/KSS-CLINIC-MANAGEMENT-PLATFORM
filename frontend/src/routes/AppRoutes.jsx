import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Homepage with exact UI from design
import HomePage from '../features/home/HomePage';

// Dedicated Marketing Pages
import AboutPage from '../features/about/AboutPage';
import ServicesPage from '../features/services/ServicesPage';
import StoriesPage from '../features/stories/StoriesPage';
import ContactPage from '../features/contact/ContactPage';

// Dedicated Book Appointment Page
import BookAppointmentPage from '../features/booking/BookAppointmentPage';

// Patient Profile Page
import ProfilePage from '../features/profile/ProfilePage';

// Public Authentication (Patient Portal & Admin Portal)
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import AdminLoginPage from '../features/auth/AdminLoginPage';

// Admin Portal Layout & Pages matching reference images exactly
import AdminLayout from '../components/admin/AdminLayout';
import DashboardPage from '../features/dashboard/DashboardPage';
import AppointmentsPage from '../features/appointments/AppointmentsPage';
import PrescriptionsPage from '../features/prescriptions/PrescriptionsPage';
import PatientHistoryPage from '../features/patients/PatientHistoryPage';
import SettingsPage from '../features/settings/SettingsPage';

// Fallback legacy management
import UserListPage from '../features/users/UserListPage';
import UserDetailPage from '../features/users/UserDetailPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Main Homepage */}
      <Route path="/" element={<HomePage />} />

      {/* 2. Dedicated Marketing Pages */}
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/stories" element={<StoriesPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* 3. Book Appointment Page */}
      <Route path="/book-appointment" element={<BookAppointmentPage />} />

      {/* 4. Protected Patient Portal (Only accessible by authenticated patients) */}
      <Route element={<ProtectedRoute redirectPath="/login" allowedRoles={['PATIENT']} />}>
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 5. Separate Patient and Admin Authentication */}
      <Route path="/login" element={<LoginPage initialMode="login" />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      {/* 6. Protected Admin Portal Routes (Requires authenticated Doctor/Admin) */}
      <Route element={<ProtectedRoute redirectPath="/admin-login" allowedRoles={['ADMIN', 'DOCTOR', 'RECEPTIONIST']} />}>
        <Route
          path="/dashboard"
          element={
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          }
        />
        <Route
          path="/appointments"
          element={
            <AdminLayout>
              <AppointmentsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/prescriptions"
          element={
            <AdminLayout>
              <PrescriptionsPage />
            </AdminLayout>
          }
        />
        <Route
          path="/patient-history"
          element={
            <AdminLayout>
              <PatientHistoryPage />
            </AdminLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AdminLayout>
              <SettingsPage />
            </AdminLayout>
          }
        />
        {/* Legacy / User management */}
        <Route
          path="/users"
          element={
            <AdminLayout>
              <UserListPage />
            </AdminLayout>
          }
        />
        <Route
          path="/users/:id"
          element={
            <AdminLayout>
              <UserDetailPage />
            </AdminLayout>
          }
        />
      </Route>

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

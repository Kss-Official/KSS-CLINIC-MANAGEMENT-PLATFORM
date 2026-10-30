import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public Homepage with exact UI from design
import HomePage from '../features/home/HomePage';

// Dedicated Book Appointment Page (exact UI from uploaded booking design)
import BookAppointmentPage from '../features/booking/BookAppointmentPage';

// Patient Profile Page (exact matching UI from uploaded profile design)
import ProfilePage from '../features/profile/ProfilePage';

// Management Layout
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Footer from '../components/layout/Footer';

// Features / Admin & Portal Pages
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import UserListPage from '../features/users/UserListPage';
import UserDetailPage from '../features/users/UserDetailPage';

const DashboardLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar onOpenBooking={() => {}} />
      <div className="main-layout">
        <Sidebar />
        <main className="content-area">{children}</main>
      </div>
      <Footer />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Main Homepage with exact design */}
      <Route path="/" element={<HomePage />} />

      {/* 2. Book Appointment Page (exact matching UI) */}
      <Route path="/book-appointment" element={<BookAppointmentPage />} />

      {/* 3. Patient Profile Page (exact matching UI) */}
      <Route path="/profile" element={<ProfilePage />} />

      {/* 3. Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* 4. Portal / Management Routes */}
      <Route
        path="/dashboard"
        element={
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/users"
        element={
          <DashboardLayout>
            <UserListPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/users/:id"
        element={
          <DashboardLayout>
            <UserDetailPage />
          </DashboardLayout>
        }
      />

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;

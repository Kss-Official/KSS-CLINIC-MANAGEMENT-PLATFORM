import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const ProtectedRoute = ({ redirectPath, allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // If redirectPath not explicitly passed, infer based on requested roles
  const fallbackRedirect = allowedRoles?.includes('PATIENT') ? '/login' : '/admin-login';
  const effectiveRedirect = redirectPath || fallbackRedirect;

  if (!isAuthenticated) {
    return <Navigate to={effectiveRedirect} state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    // If patient tries to access admin routes, keep them inside the patient portal
    if (user.role === 'PATIENT') {
      return <Navigate to="/profile" replace />;
    }
    // If admin/staff tries to access patient-only routes, redirect them to admin dashboard
    if (['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;

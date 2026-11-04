import { useAppStore } from '../store/store';
import authApi from '../api/authApi';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, clearAuth, updateUser } = useAppStore();

  const isStaffOrAdminUser = (u) => {
    if (!u) return false;
    return ['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(u.role) || !!u.is_staff || !!u.is_superuser;
  };

  const isPatientUser = (u) => {
    if (!u) return false;
    return u.role === 'PATIENT';
  };

  const adminLogin = async (credentials) => {
    clearAuth();
    const data = await authApi.adminLogin(credentials);
    const authUser = data.user || { username: credentials.username };
    const authToken = data.token || data.access || data.access_token;

    if (!isStaffOrAdminUser(authUser)) {
      clearAuth();
      throw new Error('Access denied. Patient accounts cannot log in through the Admin Portal. Please use the Patient Login.');
    }

    setAuth(authUser, authToken);
    return data;
  };

  const patientLogin = async (credentials) => {
    clearAuth();
    const data = await authApi.patientLogin(credentials);
    const authUser = data.user || { username: credentials.username };
    const authToken = data.token || data.access || data.access_token;

    if (!isPatientUser(authUser)) {
      clearAuth();
      throw new Error('Access denied. Administrator accounts cannot log in through the Patient Portal. Please use the Admin Login.');
    }

    setAuth(authUser, authToken);
    return data;
  };

  const login = async (credentials) => {
    if (credentials?.portal === 'admin') {
      return adminLogin(credentials);
    }
    if (credentials?.portal === 'patient') {
      return patientLogin(credentials);
    }
    clearAuth();
    const data = await authApi.login(credentials);
    const authToken = data.token || data.access || data.access_token;
    const authUser = data.user || { username: credentials.username };
    setAuth(authUser, authToken);
    return data;
  };

  const register = async (userData) => {
    clearAuth();
    const data = await authApi.register(userData);
    if (data.token || data.access) {
      setAuth(data.user, data.token || data.access);
    }
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuth();
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isStaffOrAdmin: isStaffOrAdminUser(user),
    isPatient: isPatientUser(user),
    login,
    adminLogin,
    patientLogin,
    register,
    logout,
    updateUser,
  };
};

export default useAuth;

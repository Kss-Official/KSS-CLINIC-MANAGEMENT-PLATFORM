import { useAppStore } from '../store/store';
import authApi from '../api/authApi';

export const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, clearAuth, updateUser } = useAppStore();

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    const authToken = data.token || data.access || data.access_token;
    const authUser = data.user || { username: credentials.username };
    setAuth(authUser, authToken);
    return data;
  };

  const register = async (userData) => {
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
    login,
    register,
    logout,
    updateUser,
  };
};

export default useAuth;


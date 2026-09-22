import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
  login as apiLogin,
  register as apiRegister,
  registerPartner as apiRegisterPartner,
  getMe,
  logout as apiLogout
} from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  // 'user' | 'partner' — which panel the user selected in role selection screen
  const [authMode, setAuthMode] = useState('user');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await getMe();
          if (res.success) {
            setCurrentUser(res.data);
            setIsAuthenticated(true);
          }
        } catch (error) {
          localStorage.removeItem('token');
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Compute the correct post-login redirect path based on the user role.
   */
  const getPostLoginPath = useCallback((user) => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'partner') return '/partner';
    return '/profile';
  }, []);

  /**
   * Handle everything after a successful login/register response.
   */
  const handleAuthSuccess = useCallback((userData) => {
    localStorage.setItem('token', userData.token);
    setCurrentUser(userData);
    setIsAuthenticated(true);
    setAuthModalOpen(false);
    setAuthError(null);
  }, []);

  const login = async (credentials) => {
    try {
      setAuthError(null);
      const res = await apiLogin(credentials);
      if (res.success) {
        handleAuthSuccess(res.data);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        return { success: true, user: res.data, redirectTo: getPostLoginPath(res.data) };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);
      const res = await apiRegister(userData);
      if (res.success) {
        handleAuthSuccess(res.data);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        return { success: true, user: res.data, redirectTo: getPostLoginPath(res.data) };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed. Please try again.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  /**
   * Partner registration — always results in role='partner' (enforced server-side).
   */
  const registerPartnerAccount = async (partnerData) => {
    try {
      setAuthError(null);
      const res = await apiRegisterPartner(partnerData);
      if (res.success) {
        handleAuthSuccess(res.data);
        return { success: true, user: res.data, redirectTo: '/partner' };
      } else {
        const msg = res.message || 'Partner registration failed.';
        setAuthError(msg);
        return { success: false, message: msg };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Partner registration failed. Please try again.';
      setAuthError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem('token');
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  const requireAuth = (callback) => {
    if (isAuthenticated) {
      if (callback) callback();
    } else {
      if (callback) setPendingAction(() => callback);
      setAuthModalOpen(true);
    }
  };

  /**
   * Open the auth modal pre-configured for the partner flow.
   */
  const openPartnerAuth = () => {
    setAuthMode('partner');
    setAuthModalOpen(true);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    registerPartnerAccount,
    logout,
    authModalOpen,
    setAuthModalOpen,
    authError,
    setAuthError,
    requireAuth,
    authMode,
    setAuthMode,
    openPartnerAuth,
    getPostLoginPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

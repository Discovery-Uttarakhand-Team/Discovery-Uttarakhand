import React, { createContext, useState, useEffect, useContext } from 'react';
import { login as apiLogin, register as apiRegister, getMe, logout as apiLogout } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

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

  const login = async (credentials) => {
    try {
      setAuthError(null);
      const res = await apiLogin(credentials);
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        setCurrentUser(res.data);
        setIsAuthenticated(true);
        setAuthModalOpen(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        return { success: true };
      }
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Login failed. Please try again.');
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      setAuthError(null);
      const res = await apiRegister(userData);
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        setCurrentUser(res.data);
        setIsAuthenticated(true);
        setAuthModalOpen(false);
        if (pendingAction) {
          pendingAction();
          setPendingAction(null);
        }
        return { success: true };
      }
    } catch (error) {
      setAuthError(error.response?.data?.message || 'Registration failed. Please try again.');
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
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

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    authModalOpen,
    setAuthModalOpen,
    authError,
    setAuthError,
    requireAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

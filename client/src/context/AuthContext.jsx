import React, { createContext, useEffect, useState, useCallback } from "react";
import { 
  getStoredUser, 
  getCurrentUser, 
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  getToken,
  clearAuth,
  setAuth
} from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        // Verify token with backend
        try {
          const response = await getCurrentUser();
          if (response.authenticated && response.user) {
            setUser(response.user);
            // Update stored user with fresh data
            setAuth(token, response.user);
          } else {
            // Token invalid, clear auth
            clearAuth();
          }
        } catch (err) {
          console.log("[AuthContext] Token verification failed:", err.message);
          // Keep stored user if token verification fails but user exists
          if (storedUser) {
            setUser(storedUser);
          }
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Register new user
  const register = useCallback(async (name, email, password, role = "customer") => {
    setError(null);
    try {
      const result = await apiRegister(name, email, password, role);
      if (result.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Login user
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await apiLogin(email, password);
      if (result.user) {
        setUser(result.user);
      }
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    setError(null);
    try {
      await apiLogout();
    } catch (err) {
      console.error("[AuthContext] Logout error:", err.message);
    } finally {
      setUser(null);
      clearAuth();
    }
  }, []);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await getCurrentUser();
      if (response.authenticated && response.user) {
        setUser(response.user);
        setAuth(token, response.user);
      }
    } catch (err) {
      console.error("[AuthContext] Refresh user error:", err.message);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        register,
        login,
        logout,
        refreshUser,
        clearError,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

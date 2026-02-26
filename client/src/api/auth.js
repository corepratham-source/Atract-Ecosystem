import { API_BASE } from "../config/api";

// Token storage key
export const TOKEN_KEY = "atract_token";
export const USER_KEY = "atract_user";

// Get stored token
export const getToken = () => localStorage.getItem(TOKEN_KEY);

// Get stored user
export const getStoredUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

// Set token and user in localStorage
export const setAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear auth from localStorage
export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Register a new user
export const register = async (name, email, password, role = "customer") => {
  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password, role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  // Store token and user
  if (data.token) {
    setAuth(data.token, data.user);
  }

  return data;
};

// Login user
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  // Store token and user
  if (data.token) {
    setAuth(data.token, data.user);
  }

  return data;
};

// Logout user
export const logout = async () => {
  const token = getToken();
  
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (error) {
    console.error("Logout API error:", error);
  }

  // Clear local storage
  clearAuth();
};

// Get current user (verify token)
export const getCurrentUser = async () => {
  const token = getToken();
  
  if (!token) {
    throw new Error("No token found");
  }

  const response = await fetch(`${API_BASE}/api/auth/verify`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include", // Include cookies
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Verification failed");
  }

  return data;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { getStoredUser as getStoredUserFromApi, getToken } from "../api/auth";
import { AuthContext } from "../context/AuthContext";

// Re-export for backward compatibility
export const getStoredUser = getStoredUserFromApi;
export { getToken };

export default function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const { user, loading: authLoading } = useContext(AuthContext);
  
  // Get user from localStorage as fallback
  const localUser = getStoredUser();
  const token = getToken();

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Determine the current user (from context or localStorage)
  const currentUser = user || localUser;

  // Not logged in → redirect to login
  if (!currentUser && !token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role-based access control
  if (allowedRole && currentUser) {
    const currentRole = currentUser.role;

    if (currentRole !== allowedRole) {
      // Redirect based on current role
      if (currentRole === "admin") {
        return <Navigate to="/admin" replace />;
      }
      return <Navigate to="/customer" replace />;
    }
  }

  return children;
}

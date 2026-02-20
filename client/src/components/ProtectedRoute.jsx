import { Navigate, useLocation } from "react-router-dom";

const STORAGE_KEY = "atract_user";

function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    return <Navigate to="/customer" replace />;
  }

  return children;
}

export { getStoredUser, STORAGE_KEY };

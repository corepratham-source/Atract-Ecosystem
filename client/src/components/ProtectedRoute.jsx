// import { Navigate, useLocation } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { auth, isFirebaseConfigured } from "../config/firebaseConfig";

// const STORAGE_KEY = "atract_user";

// function getStoredUser() {
//   try {
//     const raw = localStorage.getItem(STORAGE_KEY);
//     return raw ? JSON.parse(raw) : null;
//   } catch {
//     return null;
//   }
// }

// export function ProtectedRoute({ children, allowedRole }) {
//   const location = useLocation();
//   const [isLoading, setIsLoading] = useState(true);
//   const [firebaseUser, setFirebaseUser] = useState(null);
//   const user = getStoredUser();

//   useEffect(() => {
//     // Skip Firebase auth if not configured
//     if (!isFirebaseConfigured || !auth) {
//       console.warn("[ProtectedRoute] Firebase not configured - using local storage only");
//       setIsLoading(false);
//       return;
//     }
    
//     // Listen for Firebase auth state changes
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       setFirebaseUser(user);
//       setIsLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   // Show loading while checking auth state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-slate-50">
//         <div className="text-center">
//           <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-slate-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   // Check if user is authenticated (either Firebase or local storage)
//   if (!user && !firebaseUser) {
//     return <Navigate to="/login" state={{ from: location.pathname }} replace />;
//   }

//   if (allowedRole && user?.role !== allowedRole) {
//     if (user?.role === "admin") return <Navigate to="/admin" replace />;
//     return <Navigate to="/customer" replace />;
//   }

//   return children;
// }

// export { getStoredUser, STORAGE_KEY };

// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { firebaseAuth as auth, isFirebaseConfigured } from "../config/firebaseConfig";
import { STORAGE_KEY } from "../constants/user";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  const localUser = getStoredUser();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      console.warn("[ProtectedRoute] Firebase not available → using local user only");
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!localUser && !firebaseUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Role-based access control
  if (allowedRole) {
    // Determine current role
    let currentRole = localUser?.role;

    // If Firebase user exists → we can improve this later with custom claims
    // For now we trust localStorage role (common pattern in many apps)
    if (firebaseUser && localUser?.role) {
      currentRole = localUser.role;
    }

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
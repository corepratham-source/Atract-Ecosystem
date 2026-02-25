import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import Logo from "../assets/Logo.png";
import { STORAGE_KEY, getStoredUser } from "../constants/user";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get stored user info to determine if role should be shown
  const storedUser = useMemo(() => {
    const userStr = localStorage.getItem(STORAGE_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const showRole = storedUser && storedUser.role;
  const defaultRole = storedUser?.role || "customer";

  // Handle Firebase login
  const handleFirebaseLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Try Firebase authentication first
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("Firebase Login success", user);
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user since email is not verified
        await user.signOut();
        setError("Please verify your email before logging in. Check your inbox for the verification link.");
        setLoading(false);
        return;
      }
      
      // Store user info for the app
      const userData = {
        uid: user.uid,
        email: user.email,
        role: defaultRole,
        name: user.displayName || user.email.split('@')[0],
        emailVerified: user.emailVerified
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      
      // Navigate based on role
      if (defaultRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/customer", { replace: true });
      }
    } catch (firebaseError) {
      console.log("Firebase auth failed, trying backend:", firebaseError.code);
      
      // Check for specific Firebase errors
      if (firebaseError.code === "auth/invalid-credential") {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      if (firebaseError.code === "auth/user-not-found") {
        setError("No account found with this email");
        setLoading(false);
        return;
      }
      if (firebaseError.code === "auth/wrong-password") {
        setError("Incorrect password");
        setLoading(false);
        return;
      }
      
      // Fallback to backend authentication if Firebase fails
      await handleBackendLogin(e);
    }
    setLoading(false);
  };

  // Handle backend login as fallback
  const handleBackendLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, role: defaultRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      const user = data.user;
      if (user) {
        // Store under "atract_user" key for consistency with ProtectedRoute
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        if (user.role === "admin") navigate("/admin", { replace: true });
        else navigate("/customer", { replace: true });
      } else {
        setError("Invalid response");
      }
    } catch (err) {
      setError(err.message || "Network error");
    }
    setLoading(false);
  };

  // For backward compatibility - use the Firebase login handler
  const handleSubmit = handleFirebaseLogin;

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log("Google Sign-In success", user);
      
      // Check if email is verified (Google accounts are typically verified)
      // But we can still check for safety
      if (!user.emailVerified && user.providerData[0]?.providerId !== 'google.com') {
        await user.signOut();
        setError("Please verify your email before logging in.");
        setLoading(false);
        return;
      }
      
      // Store user info for the app
      const userData = {
        uid: user.uid,
        email: user.email,
        role: defaultRole,
        name: user.displayName || user.email.split('@')[0],
        emailVerified: true,
        photoURL: user.photoURL
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      
      // Navigate based on role
      if (defaultRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/customer", { replace: true });
      }
    } catch (firebaseError) {
      console.log("Google Sign-In error:", firebaseError.code);
      if (firebaseError.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (firebaseError.code === "auth/account-exists-with-different-credential") {
        setError("An account already exists with a different sign-in method.");
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {/* Core Company Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center">
              <img 
                src={Logo} 
                alt="Company Logo" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-slate-600 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
                placeholder="••••••••"
              />
            </div>

            {showRole && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={defaultRole}
                onChange={() => {}}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none bg-white"
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-slate-900 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

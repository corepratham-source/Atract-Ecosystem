import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import Logo from "../assets/Logo.png";

const STORAGE_KEY = "atract_user";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setShowVerificationMessage(false);

    try {
      // Try Firebase authentication first
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      console.log("Verification email sent to:", user.email);

      // Store user info for later (without auto-login)
      const userData = {
        uid: user.uid,
        email: user.email,
        role: role,
        name: name.trim(),
        emailVerified: false
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // Show verification message instead of redirecting
      setShowVerificationMessage(true);
      setLoading(false);
      return;
    } catch (firebaseError) {
      console.log("Firebase signup error:", firebaseError.code);

      // If Firebase fails, try backend registration
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please try logging in.");
        setLoading(false);
        return;
      }

      // Fallback to backend registration
      try {
        const res = await fetch(`${API_BASE}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            role,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || "Signup failed");
          setLoading(false);
          return;
        }
        // Show verification message for backend signup too
        setShowVerificationMessage(true);
      } catch (err) {
        setError(err.message || "Network error");
      }
    }
    setLoading(false);
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("Google Sign-In success", user);

      // Google accounts are automatically verified
      const userData = {
        uid: user.uid,
        email: user.email,
        role: role,
        name: user.displayName || user.email.split('@')[0],
        emailVerified: true,
        photoURL: user.photoURL
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // Navigate based on role
      if (role === "admin") {
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

  // If verification message is shown, display it
  if (showVerificationMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Check your email & verify</h1>
              <p className="text-slate-600 mt-2">
                We've sent a verification email to <span className="font-medium">{email}</span>
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Please check your inbox and click the verification link, then log in.
              </p>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="block w-full py-3 rounded-xl font-semibold text-center text-white bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors"
              >
                Go to Login
              </Link>

              <button
                type="button"
                onClick={() => {
                  setShowVerificationMessage(false);
                  setEmail("");
                  setPassword("");
                  setName("");
                }}
                className="w-full py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Sign up with different email
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {/* Ecosystem and Company Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center -mb-4">
              <img
                src={Logo}
                alt="ATRact"
                className="w-32 h-32 object-contain"
              />
            </div>

            <p className="text-slate-600 leading-none">
              Create your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
                placeholder="Your name"
              />
            </div>

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
                minLength={6}
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-slate-300 focus:border-slate-300 outline-none bg-white"
              >
                <option value="admin">Admin</option>
                <option value="customer">Customer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account..." : "Sign up"}
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
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-slate-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

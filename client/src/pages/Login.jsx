import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../config/api";

const STORAGE_KEY = "atract_user";

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
  const defaultRole = storedUser?.role || "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-900">ATRact</h1>
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

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-slate-900 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation } from "react-router-dom";
import { microApps } from "../data/microApps";
import { STORAGE_KEY } from "../constants/user";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebaseConfig";
import Logo from "../assets/Logo.png";

/**
 * Fixed Left Sidebar for Customer Panel
 * 
 * Features:
 * - Fixed position (position: fixed)
 * - Full viewport height (height: 100vh)
 * - Scrollable content (overflow-y: auto)
 * - Always visible on desktop
 * - Toggleable on mobile
 */
export default function CustomerSidebar({ isOpen, onClose }) {
  const location = useLocation();
  const isDashboard = location.pathname === "/customer";
  
  // Get current app ID if on app page
  const currentAppId = location.pathname.startsWith("/customer/apps/") 
    ? location.pathname.split("/customer/apps/")[1] 
    : null;

  const handleLogout = async () => {
    try {
      // Try Firebase logout
      await signOut(auth);
    } catch (firebaseError) {
      console.log("Firebase logout error (may not be logged in):", firebaseError.code);
    }
    // Clear local storage
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Fixed Sidebar - Always fixed on the left */}
      <div
        className={`w-72 bg-white shadow-lg fixed left-0 top-0 h-screen flex flex-col border-r border-slate-200 z-50 transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          position: 'fixed',
          height: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Logo & Brand */}
        <div className="flex-shrink-0 border-b border-slate-200">
          <div className="p-4">
            <Link 
              to="/customer" 
              className="flex items-center gap-3"
              onClick={onClose}
            >
              <img 
                src={Logo} 
                alt="ATRact" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <span className="text-xl font-bold text-slate-900">ATRact</span>
                <p className="text-xs text-slate-500">HR Solutions</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto py-4" style={{ overflowY: 'auto' }}>
          {/* Dashboard Link */}
          <div className="px-3 mb-2">
            <Link
              to="/customer"
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isDashboard
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="px-4 py-2">
            <div className="border-t border-slate-200"></div>
          </div>

          {/* Apps Section */}
          <div className="px-3">
            <h3 className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Micro Apps
            </h3>
            
            <div className="space-y-1">
              {microApps.map((app) => (
                <Link
                  key={app.id}
                  to={`/customer/apps/${app.id}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                    currentAppId === app.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {/* App Icon */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    currentAppId === app.id 
                      ? "bg-blue-100" 
                      : "bg-slate-100"
                  }`}>
                    <span className="text-sm">
                      {app.id === "resume-screener" && "📋"}
                      {app.id === "resume-screener-lite" && "📋"}
                      {app.id === "interview-questions" && "❓"}
                      {app.id === "offer-letter" && "📝"}
                      {app.id === "salary-benchmark" && "💰"}
                      {app.id === "follow-up-tracker" && "🔄"}
                      {app.id === "policy-builder" && "📜"}
                      {app.id === "exit-interview" && "🚪"}
                      {app.id === "exit-interview-analyzer" && "🚪"}
                      {app.id === "exit-interview-generator" && "🚪"}
                      {app.id === "attendance-tracker" && "📅"}
                      {app.id === "performance-review" && "⭐"}
                      {app.id === "resume-formatter" && "📄"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block font-medium text-sm truncate">{app.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer - User & Logout */}
        <div className="flex-shrink-0 border-t border-slate-200 p-4">
          <div className="bg-slate-50 rounded-xl p-3 mb-3">
            <p className="text-sm font-medium text-slate-900 truncate">Customer User</p>
            <p className="text-xs text-slate-500 truncate">customer@atract.com</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { getStoredUser } from "./ProtectedRoute";
import AdsSidebar from "./AdsSidebar";

/**
 * Customer Micro App Shell
 * 
 * Layout: Ads on LEFT, Content on RIGHT
 * Navbar shows: App name + Profile dropdown
 * 
 * @param {Object} app - App configuration object (contains name, valueProposition, icon)
 * @param {React.ReactNode} children - Content to render
 * @param {boolean} showHeader - Whether to show the header with profile dropdown (default: true)
 * @param {boolean} showAds - Whether to show the ads sidebar (default: true)
 */
export default function CustomerMicroAppShell({ app, children, showHeader = true, showAds = true }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const user = getStoredUser();

  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const appName = app?.name || "App";
  const appIcon = app?.icon || "📱";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Fixed Left Sidebar with Ads */}
      {showAds && (
      <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
        <AdsSidebar />
      </div>
      )}
      
      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 flex flex-col ${showHeader ? '' : 'w-full'}`}>
        
        {/* Fixed Navbar with App Name and Profile */}
        {showHeader && (
          <header className="flex-shrink-0 bg-white border-b border-slate-200 sticky top-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Left: App Name */}
                <div className="flex items-center gap-3">
                  <Link 
                    to="/customer" 
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 lg:hidden"
                    title="Back to Dashboard"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </Link>
                  <span className="text-2xl" role="img" aria-label={appName}>{appIcon}</span>
                  <h1 className="text-lg font-bold text-slate-900">{appName}</h1>
                </div>

                {/* Right: Profile Dropdown */}
                <div className="flex items-center gap-4">
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                      title="User Menu"
                    >
                      {/* Profile Icon */}
                      <svg
                        className="w-5 h-5 text-slate-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                        {/* Header with user info */}
                        <div className="px-4 py-3 border-b border-slate-100">
                          <div className="text-sm font-semibold text-slate-900">
                            {userName}
                          </div>
                          <div className="text-xs text-slate-600 mt-1 break-words">
                            {userEmail}
                          </div>
                        </div>

                        {/* Logout button */}
                        <div className="p-2">
                          <button
                            onClick={() => {
                              setShowDropdown(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

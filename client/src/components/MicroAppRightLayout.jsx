import { useNavigate } from "react-router-dom";
import { ADMIN_BASE } from "../config/routes";
import { useState, useEffect, useRef } from "react";

/**
 * Right-side layout for micro apps: fits viewport, sticky navbar, scrollable content.
 * Use with LeftSidebar so the main content fits the screen and navbar is always visible.
 */
export default function MicroAppRightLayout({ app, children }) {
  const navigate = useNavigate();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const dropdownRef = useRef(null);
  
  // Get user from localStorage or session
  const user = JSON.parse(
    localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
  );
  const userName = user?.name || "Admin";
  const userEmail = user?.email || "admin@atract.com";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdminDropdown(false);
      }
    }
    if (showAdminDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAdminDropdown]);
  const appName = app?.name || "App";
  const appSubtitle = app?.valueProposition || "";
  const appIcon = app?.icon || "📱";

  return (
    <div className="flex-1 min-w-0 flex flex-col h-screen bg-gray-100 ml-0 lg:ml-80">
      {/* Sticky navbar - always visible */}
      <nav className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* <button
              type="button"
              onClick={() => navigate(ADMIN_BASE + "/")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 whitespace-nowrap"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Hub
            </button> */}
            {/* <span className="text-gray-300 hidden sm:inline">|</span> */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{appName}</h1>
              {appSubtitle && (
                <p className="text-xs text-gray-500 truncate hidden sm:block">{appSubtitle}</p>
              )}
            </div>
          </div>
          {/* App Icon and Admin Profile - displayed on the right side */}
          <div className="flex items-center gap-4">
            <span className="text-2xl sm:text-3xl" role="img" aria-label={appName}>
              {appIcon}
            </span>

            {/* Admin Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Admin Menu"
              >
                {/* Profile Icon */}
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                {/* Admin Label */}
                <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                  Admin
                </span>
                {/* Chevron Down */}
                <svg
                  className={`w-4 h-4 text-gray-600 transition-transform ${
                    showAdminDropdown ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showAdminDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  {/* Header with user info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-semibold text-gray-900">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 break-words">
                      {userEmail}
                    </div>
                  </div>

                  {/* Logout button */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowAdminDropdown(false);
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
      </nav>
      {/* Scrollable content - fills remaining height */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

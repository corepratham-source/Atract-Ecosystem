import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, STORAGE_KEY } from "./ProtectedRoute";
import { microApps } from "../data/microApps";
import CustomerSidebar from "./CustomerSidebar";

/**
 * Reusable CustomerLayout Component
 * 
 * @param {boolean} showSidebar - Whether to show the fixed left sidebar (default: true)
 * @param {boolean} showHeader - Whether to show the header with nav links (default: true)
 * @param {React.ReactNode} children - The content to render
 */
export default function CustomerLayout({ 
  showSidebar = true, 
  showHeader = true,
  children 
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isAppPage = location.pathname.startsWith("/customer/apps/");
  const isDashboard = location.pathname === "/customer";

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".user-dropdown-container")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Find the current app if on app page
  const currentAppId = isAppPage ? location.pathname.split("/customer/apps/")[1] : null;
  const currentApp = currentAppId ? microApps.find((a) => a.id === currentAppId) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {showSidebar && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Left Sidebar - Only shown when showSidebar is true */}
      {showSidebar && (
        <CustomerSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          showSidebar ? "lg:ml-72" : ""
        }`}
      >
        {/* Header */}
        {showHeader && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left side: Logo + Navigation */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Mobile menu button */}
                {showSidebar && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}

                <Link
                  to="/customer"
                  className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">A</span>
                  </div>
                  <span className="hidden sm:inline">ATRact</span>
                </Link>

                {/* Navigation Links - Hidden on mobile, visible on md+ */}
                <nav className="hidden md:flex items-center gap-1">
                  <Link
                    to="/customer"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      isDashboard
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/customer/apps/resume-screener-lite"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      currentAppId === "resume-screener-lite"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Resume Screener
                  </Link>
                  <Link
                    to="/customer/apps/interview-questions"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      currentAppId === "interview-questions"
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    Interview Questions
                  </Link>
                </nav>
              </div>

              {/* Right side: User Dropdown */}
              <div className="relative user-dropdown-container">
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none"
                >
                  {/* Avatar / Icon */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm">
                    <svg
                      className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                      <div className="text-base font-semibold text-slate-900">
                        {user?.name || "User"}
                      </div>
                      <div className="text-sm text-slate-600 mt-1 break-all">
                        {user?.email || "No email provided"}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
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
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

        {/* Breadcrumb for App Pages */}
        {showHeader && isAppPage && currentApp && (
          <div className="bg-white border-b border-slate-200">
            <div className="px-4 sm:px-6 py-3">
              <nav className="flex items-center gap-2 text-sm">
                <Link to="/customer" className="text-slate-500 hover:text-slate-700">
                  Dashboard
                </Link>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-slate-900 font-medium">{currentApp.name}</span>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ADMIN_BASE } from "../config/routes";

const navItems = [
  { to: ADMIN_BASE + "/", label: "Ecosystem Hub" },
  { to: ADMIN_BASE + "/dashboard", label: "Control Tower" },
];

function LogoMark() {
  return (
    <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center shadow-sm">
      <span className="text-sm font-semibold tracking-tight">A</span>
    </div>
  );
}

export default function AppShell({ title, subtitle, primaryAction, sidebarContent, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

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

  const mobileNav = (
    <div className="flex gap-2">
      {navItems.map((item) => {
        const active = location.pathname === item.to;
        return (
          <button
            key={item.to}
            type="button"
            onClick={() => navigate(item.to)}
            className={[
              "px-3 py-2 text-xs font-medium rounded-lg border",
              active
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="hidden md:flex md:w-64 md:flex-col md:sticky md:top-0 md:h-screen md:border-r md:border-slate-200 md:bg-white md:px-5 md:py-6 shrink-0">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-sm font-semibold leading-tight">ATRact</div>
              <div className="text-xs text-slate-500 leading-tight">
                Focused tools for professionals
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "px-3 py-2 rounded-lg text-sm font-medium border",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-white hover:border-slate-200 hover:bg-slate-50",
                  ].join(" ")
                }
                end
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {sidebarContent ? (
            <div className="flex-1 min-h-0 overflow-y-auto py-4">
              {sidebarContent}
            </div>
          ) : null}

          <div className="mt-auto pt-4 text-xs text-slate-400 shrink-0">
            © {new Date().getFullYear()} ATRact
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 bg-slate-50/85 backdrop-blur border-b border-slate-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 md:hidden">
                    <LogoMark />
                    <div className="text-sm font-semibold">ATRact</div>
                  </div>
                  <h1 className="mt-2 md:mt-0 text-xl sm:text-2xl font-semibold tracking-tight truncate">
                    {title}
                  </h1>
                  {subtitle ? (
                    <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <div className="md:hidden">{mobileNav}</div>
                  {primaryAction ? primaryAction : null}

                  {/* Admin Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Admin Menu"
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
                      {/* Admin Label */}
                      <span className="text-sm font-medium text-slate-700">Admin</span>
                      {/* Chevron Down */}
                      {/* <svg
                        className={`w-4 h-4 text-slate-600 transition-transform ${
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
                      </svg> */}
                    </button>

                    {/* Dropdown Menu */}
                    {showAdminDropdown && (
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
            </div>
          </header>

          <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}



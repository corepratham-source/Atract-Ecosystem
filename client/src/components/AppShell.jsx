import { NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/", label: "Ecosystem Hub" },
  { to: "/dashboard", label: "Control Tower" },
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
                <div className="flex items-center gap-3">
                  <div className="md:hidden">{mobileNav}</div>
                  {primaryAction ? primaryAction : null}
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



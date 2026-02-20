import { useNavigate } from "react-router-dom";
import EcosystemHubComponent from "../components/EcosystemHub";
import HomeSidebar from "../components/HomeSidebar";
import { ADMIN_BASE } from "../config/routes";
import { getStoredUser, STORAGE_KEY } from "../components/ProtectedRoute";

const homeApp = {
  valueProposition: "A portfolio of focused micro-products for HR-tech and professionals."
};

export default function EcosystemHubPage({ isPro = false }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <HomeSidebar app={homeApp} isPro={isPro} user={user} />
      <div className="flex-1 ml-80 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Fixed Header: title + Admin role/user + Control Tower */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-100 py-4 z-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ecosystem Hub</h1>
              <p className="text-sm text-slate-600">A portfolio of focused micro-products for HR-tech and professionals.</p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <span className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Admin</span>
                  {user.name && <span className="ml-1">· {user.name}</span>}
                </span>
              )}
              <button
                type="button"
                onClick={() => navigate(`${ADMIN_BASE}/dashboard`)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
              >
                Control Tower
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  navigate("/login", { replace: true });
                }}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <EcosystemHubComponent onNavigateToDashboard={() => navigate(`${ADMIN_BASE}/dashboard`)} />
        </div>
      </div>
    </div>
  );
}

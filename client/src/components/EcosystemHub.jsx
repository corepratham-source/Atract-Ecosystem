import { microApps } from "../data/microApps";
import { useNavigate } from "react-router-dom";

export default function EcosystemHub({ onNavigateToDashboard, onAppUsed }) {
  const navigate = useNavigate();

  const handleOpenApp = (appId) => {
    // Track app usage in localStorage for dashboard to sync
    if (onAppUsed) {
      onAppUsed(appId);
    } else {
      // Fallback: store in localStorage if no callback passed
      try {
        const recentApps = JSON.parse(localStorage.getItem('recentApps') || '[]');
        if (!recentApps.includes(appId)) {
          recentApps.push(appId);
        }
        localStorage.setItem('recentApps', JSON.stringify(recentApps));
      } catch (err) {
        console.error('Error storing recent apps:', err);
      }
    }
    navigate(`/apps/${appId}`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      Live: "bg-green-100 text-green-800 border-green-200",
      Build: "bg-amber-100 text-amber-800 border-amber-200",
      Pause: "bg-gray-100 text-gray-800 border-gray-200"
    };
    return badges[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  // All apps combined (both Live and Coming Soon)
  const allApps = microApps;

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              ATRact builds focused tools for professionals
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Each micro-app solves one specific pain point extremely well. No large platforms. No complex workflows.
            </p>
          </div>
          {onNavigateToDashboard ? (
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
            >
              Open Control Tower
            </button>
          ) : null}
        </div>
      </section>

      {/* All Apps Section - Combined */}
      <section>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">All Apps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {allApps.map((app) => (
            <AppCard key={app.id} app={app} onOpen={handleOpenApp} getStatusBadge={getStatusBadge} />
          ))}
        </div>
      </section>
    </div>
  );
}

function AppCard({ app, onOpen, getStatusBadge }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3 gap-2">
        <h4 className="text-base sm:text-lg font-semibold text-slate-900 flex-1">{app.name}</h4>
        <span className={`px-2 py-1 text-xs font-semibold rounded-lg border flex-shrink-0 ${getStatusBadge(app.status)}`}>
          {app.status}
        </span>
      </div>
      
      <p className="text-sm text-slate-600 mb-4 min-h-[40px]">
        {app.valueProposition}
      </p>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{app.pricing}</span>
        <button
          onClick={() => onOpen(app.id)}
          className="w-full sm:w-auto px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Open App
        </button>
      </div>
    </div>
  );
}


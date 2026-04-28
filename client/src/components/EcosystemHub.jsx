import { microApps } from "../data/microApps";
import { useNavigate } from "react-router-dom";
import { ADMIN_BASE } from "../config/routes";

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
    navigate(`${ADMIN_BASE}/apps/${appId}`);
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
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight" style={{ color: '#4A4A4A' }}>
              CORE builds focused tools for professionals
            </h2>
            <p className="mt-2 text-sm sm:text-base" style={{ color: '#9E9E9E' }}>
              Each micro-app solves one specific pain point extremely well. No large platforms. No complex workflows.
            </p>
          </div>
          {onNavigateToDashboard ? (
            <button
              onClick={onNavigateToDashboard}
              className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600"
            >
              Open Control Tower
            </button>
          ) : null}
        </div>
      </section>

      {/* All Apps Section - Combined */}
      <section>
        <h3 className="text-base sm:text-lg font-semibold mb-4" style={{ color: '#4A4A4A' }}>All Apps</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {allApps.map((app, index) => (
            <AppCard 
              key={app.id} 
              app={app} 
              onOpen={handleOpenApp} 
              getStatusBadge={getStatusBadge}
              index={index}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AppCard({ app, onOpen, getStatusBadge, index }) {
  return (
    <div 
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-red-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Content */}
      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between mb-3 gap-2">
          {/* Icon */}
          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <span className="text-xl">{app.icon || '📱'}</span>
          </div>
          
          <h4 className="text-base sm:text-lg font-bold flex-1 group-hover:text-red-600 transition-colors duration-300 ml-2" style={{ color: '#4A4A4A' }}>
            {app.name}
          </h4>
          <span className={`px-2 py-1 text-xs font-semibold rounded-lg border flex-shrink-0 ${getStatusBadge(app.status)} group-hover:scale-105 transition-transform duration-300`}>
            {app.status}
          </span>
        </div>
        
        <p className="text-sm mb-4 min-h-[40px] group-hover:text-slate-700 transition-colors duration-300" style={{ color: '#9E9E9E' }}>
          {app.valueProposition}
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-medium group-hover:text-red-600 transition-colors duration-300" style={{ color: '#9E9E9E' }}>{app.pricing}</span>
          <button
            onClick={() => onOpen(app.id)}
            className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2 transition-all duration-300 group-hover:shadow-lg transform group-hover:scale-105"
          >
            Open App →
          </button>
        </div>
      </div>
      
      {/* Bottom accent line */}
      <div className="h-1 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
    </div>
  );
}

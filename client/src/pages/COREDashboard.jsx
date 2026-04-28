import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CORELogo from "../components/CORELogo";
import { microApps } from "../data/microApps";

export default function COREDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter apps based on search
  const filteredApps = microApps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.valueProposition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const liveApps = filteredApps.filter((app) => app.status === "Live");
  const buildingApps = filteredApps.filter((app) => app.status === "Build");

  const handleAppClick = (appId) => {
    navigate(`/core/apps/${appId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur support-[backdrop-filter] border-b border-red-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <CORELogo size="md" showText={true} />
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900">CORE Apps Hub</h1>
            <p className="text-sm text-gray-600">Discover HR-Tech tools for your team</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search apps by name or feature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-6 py-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:outline-none text-gray-900 placeholder-gray-500 shadow-sm"
            />
            <svg
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Live Apps Section */}
        {liveApps.length > 0 && (
          <div className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                </span>
                Live & Ready
              </h2>
              <p className="text-gray-600 mt-1">Start using these apps immediately</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveApps.map((app) => (
                <AppCard key={app.id} app={app} onSelect={() => handleAppClick(app.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Building Apps Section */}
        {buildingApps.length > 0 && (
          <div className="mb-16">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                  <span className="text-base">🔨</span>
                </span>
                Coming Soon
              </h2>
              <p className="text-gray-600 mt-1">These tools are being crafted with care</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buildingApps.map((app) => (
                <AppCard key={app.id} app={app} onSelect={() => handleAppClick(app.id)} disabled={true} />
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No apps found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AppCard({ app, onSelect, disabled = false }) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`group text-left rounded-xl border-2 overflow-hidden transition-all duration-200 ${
        disabled
          ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
          : "border-red-100 bg-white hover:border-red-400 hover:shadow-lg hover:shadow-red-100 hover:-translate-y-1"
      }`}
    >
      {/* Header */}
      <div className={`px-6 py-4 border-b-2 ${disabled ? "border-gray-200 bg-gray-100" : "border-red-100 bg-gradient-to-r from-red-50 to-white"}`}>
        <div className="flex items-start justify-between mb-2">
          <span className="text-4xl">{app.icon}</span>
          <span
            className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
              app.status === "Live"
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
            }`}

          >
            {app.status}
          </span>
        </div>
        <h3 className={`font-bold text-lg group-hover:text-red-600 transition-colors ${disabled ? "text-gray-600" : "text-gray-900"}`}>
          {app.name}
        </h3>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-3">
        <p className={`text-sm line-clamp-2 ${disabled ? "text-gray-500" : "text-gray-600"}`}>
          {app.valueProposition}
        </p>

        <div className={`p-3 rounded-lg text-sm font-semibold ${
          disabled
            ? "bg-gray-100 text-gray-500"
            : "bg-red-50 text-red-700 group-hover:bg-red-100"
        }`}>
          💰 {app.pricing}
        </div>

        {app.audience && (
          <div className="pt-2 border-t border-gray-100">
            <p className={`text-xs ${disabled ? "text-gray-500" : "text-gray-600"}`}>
              <span className="font-semibold">For:</span> {app.audience}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={`px-6 py-3 border-t-2 ${disabled ? "border-gray-200 bg-gray-50" : "border-red-100 bg-red-50"}`}>
        <span className={`text-sm font-semibold ${disabled ? "text-gray-500" : "text-red-600 group-hover:text-red-700"}`}>
          {disabled ? "Coming Soon" : "Explore →"}
        </span>
      </div>
    </button>
  );
}

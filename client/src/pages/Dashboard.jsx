import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Snapshot from "../components/Snapshot";
import AppTable from "../components/AppTable";
import LeftSidebar from "../components/LeftSidebar";
import { microApps } from "../data/microApps";
import { API_BASE } from "../config/api";
import { getStoredUser, STORAGE_KEY } from "../components/ProtectedRoute";
const API_URL = `${API_BASE}/apps`;

const FETCH_TIMEOUT_MS = 6000;

// Fallback apps when MongoDB is unavailable - from microApps
const getFallbackApps = () =>
  microApps.map((m) => ({
    _id: m.id,
    appName: m.name,
    status: m.status || "Build",
    users7d: 0,
    users30d: 0,
    revenue30d: 0,
    retention: 0,
    cost: 0,
    owner: "",
    decision: "Watch",
  }));

const dashboardApp = {
  name: "Control Tower",
  valueProposition: "One screen to know what's working and what's not",
  pricing: "Free for internal use"
};

export default function Dashboard({ isPro = false }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [apps, setApps] = useState(getFallbackApps());
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    appName: "",
    users7d: 0,
    users30d: 0,
    revenue30d: 0,
    retention: 0,
    cost: 0,
    status: "Build",
    decision: "Watch",
    owner: ""
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const fetchApps = async () => {
      try {
        const res = await axios.get(API_URL, {
          signal: controller.signal,
          timeout: FETCH_TIMEOUT_MS,
        });
        clearTimeout(timeoutId);
        setApps(Array.isArray(res.data) && res.data.length > 0 ? res.data : getFallbackApps());
        setFetchError(null);
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.code === "ECONNABORTED" || err.name === "AbortError") {
          //setFetchError("Backend slow or unavailable. Showing demo data.");
        } else {
          //setFetchError("Could not load from database. Showing demo data.");
        }
        setApps(getFallbackApps());
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const handleAddApp = async (e) => {
    e.preventDefault();
    if (!newApp.appName.trim()) {
      alert("App name is required");
      return;
    }
    try {
      const res = await axios.post(API_URL, newApp);
      setApps([...apps, res.data]);
      setNewApp({
        appName: "",
        users7d: 0,
        users30d: 0,
        revenue30d: 0,
        retention: 0,
        cost: 0,
        status: "Build",
        decision: "Watch",
        owner: ""
      });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add app:", err);
      alert("Failed to add app: " + (err.response?.data?.error || err.message));
    }
  };

  // Get growing apps (users > 0)
  const growingApps = apps.filter(a => (a.users7d || 0) > 0 || (a.users30d || 0) > 0);
  // Get declining apps (users = 0)
  const decliningApps = apps.filter(a => (a.users7d || 0) === 0 && (a.users30d || 0) === 0);

  // Track app usage and move from declining to growing
  const trackAppUsage = async (appId) => {
    try {
      const app = apps.find(a => a._id === appId);
      if (!app) return;

      // Increment users7d by 1 to mark as "in use"
      const updatedApp = {
        ...app,
        users7d: (app.users7d || 0) + 1,
        users30d: (app.users30d || 0) + 1,
        status: "Live"
      };

      // Optimistic UI update
      setApps(prevApps => prevApps.map(a => a._id === appId ? updatedApp : a));

      // Update backend
      await axios.put(`${API_BASE}/apps/${appId}`, updatedApp);
    } catch (err) {
      console.error("Failed to track app usage:", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={dashboardApp} isPro={isPro} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-80 min-w-0 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden fixed top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md border border-slate-200"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Fixed Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-12 lg:pt-0 mb-4 sticky top-0 bg-gray-100 py-4 z-10">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Control Tower</h1>
              <p className="text-sm text-slate-600">Open → scan top → scan table → decide → close. Under 5 minutes.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {loading && (
                <span className="text-sm text-slate-500 animate-pulse">Syncing…</span>
              )}
              {fetchError && (
                <span className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                  {fetchError}
                </span>
              )}
              {user && (
                <span className="text-sm text-slate-600">
                  <span className="font-medium text-slate-800">Admin</span>
                  {user.name && <span className="ml-1">· {user.name}</span>}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 text-sm font-semibold"
              >
                {showAddForm ? "Close" : "+ Add App"}
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

          {showAddForm && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 mb-4">
              <form onSubmit={handleAddApp} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3 items-end">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">App Name</label>
                  <input
                    type="text"
                    required
                    value={newApp.appName}
                    onChange={(e) => setNewApp({ ...newApp, appName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="App Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    value={newApp.status}
                    onChange={(e) => setNewApp({ ...newApp, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="Build">🛠 Build</option>
                    <option value="Live">🚀 Live</option>
                    <option value="Pause">🧊 Pause</option>
                    <option value="Kill">❌ Kill</option>
                    <option value="Scale">🔥 Scale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Users (7d)</label>
                  <input
                    type="number"
                    value={newApp.users7d}
                    onChange={(e) => setNewApp({ ...newApp, users7d: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Users (30d)</label>
                  <input
                    type="number"
                    value={newApp.users30d}
                    onChange={(e) => setNewApp({ ...newApp, users30d: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Revenue (30d)</label>
                  <input
                    type="number"
                    value={newApp.revenue30d}
                    onChange={(e) => setNewApp({ ...newApp, revenue30d: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Retention %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newApp.retention}
                    onChange={(e) => setNewApp({ ...newApp, retention: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Cost / Month</label>
                  <input
                    type="number"
                    value={newApp.cost}
                    onChange={(e) => setNewApp({ ...newApp, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Owner</label>
                  <input
                    type="text"
                    value={newApp.owner}
                    onChange={(e) => setNewApp({ ...newApp, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Owner"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Decision</label>
                  <select
                    value={newApp.decision}
                    onChange={(e) => setNewApp({ ...newApp, decision: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    required
                  >
                    <option value="Scale">Scale</option>
                    <option value="Watch">Watch</option>
                    <option value="Kill">Kill</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION A: Ecosystem Snapshot (Top Strip) */}
          <Snapshot apps={apps} />

          {/* SECTION C: App Performance Breakdown - With user counts */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">App Performance Breakdown</h2>
            <div className="flex flex-nowrap gap-6 overflow-x-auto pb-4">
              {/* Growing Apps - Users > 0 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 min-w-[320px]">
                <h3 className="text-md font-medium text-emerald-700 mb-3 flex items-center gap-2">
                  📈 Growing Apps
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-semibold ml-auto">{growingApps.length}</span>
                </h3>
                {growingApps.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-2 text-left text-xs font-semibold text-slate-500">App</th>
                        <th className="py-2 px-2 text-right text-xs font-semibold text-slate-500">Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {growingApps.map((app) => (
                        <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium text-slate-900">{app.appName}</td>
                          <td className="py-2 px-2 text-right text-emerald-600 font-semibold">{((app.users7d || 0) + (app.users30d || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-500 text-sm italic">No growing apps yet. Open an app to get started!</p>
                )}
              </div>

              {/* Declining Apps - Users = 0 */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 min-w-[320px]">
                <h3 className="text-md font-medium text-rose-700 mb-3 flex items-center gap-2">
                  📉 Declining Apps
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-xs font-semibold ml-auto">{decliningApps.length}</span>
                </h3>
                {decliningApps.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-2 px-2 text-left text-xs font-semibold text-slate-500">App</th>
                        <th className="py-2 px-2 text-right text-xs font-semibold text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {decliningApps.map((app) => (
                        <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium text-slate-900">{app.appName}</td>
                          <td className="py-2 px-2 text-right">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-semibold">0 users</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-slate-500 text-sm italic">No declining apps. Keep it up!</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION B: App Portfolio Table (Main Section) */}
          <div className="mt-4 rounded-2xl border border-slate-200">
            <AppTable apps={apps} setApps={setApps} />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import axios from "axios";

import { API_BASE } from "../config/api";
const API_URL = `${API_BASE}/apps`;

export default function AppTable({ apps, setApps }) {
  const [editingId, setEditingId] = useState(null);
  const [editingField, setEditingField] = useState(null);

  const handleUpdate = async (id, field, value) => {
    // Optimistic update - use setState updater function to ensure latest state
    setApps(prevApps => {
      const newApps = [...prevApps];
      const appIndex = newApps.findIndex(a => a._id === id);
      if (appIndex !== -1) {
        newApps[appIndex] = { ...newApps[appIndex], [field]: value };
      }
      return newApps;
    });

    // Send to backend
    try {
      const app = apps.find(a => a._id === id);
      if (app) {
        await axios.put(`${API_URL}/${id}`, {
          ...app,
          [field]: value,
          lastUpdated: new Date()
        });
      }
      setEditingId(null);
      setEditingField(null);
    } catch (err) {
      console.error("Update failed:", err);
      // Revert on failure
      setApps(prevApps => prevApps.map(a => a._id === id ? apps.find(x => x._id === id) : a));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this app?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setApps(apps.filter(a => a._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const getRetentionColor = (retention) => {
    if (retention >= 30) return "bg-green-100 text-green-800";
    if (retention >= 10) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getStatusBadge = (status) => {
    const badges = {
      Build: "bg-blue-100 text-blue-800",
      Live: "bg-green-100 text-green-800",
      Pause: "bg-gray-100 text-gray-800",
      Kill: "bg-red-100 text-red-800",
      Scale: "bg-purple-100 text-purple-800"
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getDecisionBadge = (decision) => {
    const badges = {
      Scale: "bg-green-100 text-green-800",
      Watch: "bg-yellow-100 text-yellow-800",
      Kill: "bg-red-100 text-red-800"
    };
    return badges[decision] || "bg-gray-100 text-gray-800";
  };

  const getAlerts = (app) => {
    const alerts = [];
    if ((app.revenue30d || 0) === 0) alerts.push({ icon: "⚠", text: "No revenue in 30 days" });
    if ((app.retention || 0) < 10) alerts.push({ icon: "⚠", text: "Retention <10%" });
    // Positive indicators
    if ((app.revenue30d || 0) > 0 && (app.users7d || 0) > 0) {
      alerts.push({ icon: "💰", text: "Revenue active" });
    }
    const avgDaily30d = (app.users30d || 0) / 30;
    const growth = avgDaily30d > 0 ? (app.users7d || 0) / avgDaily30d : 0;
    if (growth >= 2) alerts.push({ icon: "🚀", text: "2x growth MoM" });
    return alerts;
  };

  const isEditing = (id, field) => editingId === id && editingField === field;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Mobile card layout */}
      <div className="md:hidden divide-y divide-slate-200">
        {apps.map((app) => {
          const alerts = getAlerts(app);
          const revenueVsCost = (app.revenue30d || 0) - (app.cost || 0);
          return (
            <div key={app._id} className={`p-4 ${revenueVsCost < 0 ? "bg-rose-50/60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-slate-900 truncate">{app.appName || "Untitled"}</span>
                <div className="flex gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadge(app.status || "Build")}`}>{app.status || "Build"}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getDecisionBadge(app.decision || "Watch")}`}>{app.decision || "Watch"}</span>
                  <button type="button" onClick={() => handleDelete(app._id)} className="text-xs text-rose-600 font-medium">Delete</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-slate-600">
                <span>Users 7d: {(app.users7d || 0).toLocaleString()}</span>
                <span>Users 30d: {(app.users30d || 0).toLocaleString()}</span>
                <span>Revenue: ₹{(app.revenue30d || 0).toLocaleString()}</span>
                <span>Cost: ₹{(app.cost || 0).toLocaleString()}</span>
                <span>Retention: {(app.retention || 0).toFixed(1)}%</span>
                <span>Owner: {app.owner || "—"}</span>
              </div>
              {alerts.length > 0 && <div className="mt-2 flex gap-1">{alerts.map((a, i) => <span key={i} title={a.text}>{a.icon}</span>)}</div>}
            </div>
          );
        })}
        {apps.length === 0 && <div className="text-center py-10 text-slate-500">No apps found. Add your first app using the form above.</div>}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-y-auto overflow-x-hidden max-h-[500px] w-full">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-50 sticky top-0">
            <tr className="">
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-32">App</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-16">Status</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-16">7d</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-16">30d</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-20">Rev</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-14">Ret</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-16">Cost</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-20">Owner</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 uppercase w-16">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {apps.map((app) => {
              const alerts = getAlerts(app);
              const revenueVsCost = (app.revenue30d || 0) - (app.cost || 0);
              const rowClass = revenueVsCost < 0 ? "bg-rose-50/60" : "bg-white";
              
              return (
                <tr key={app._id} className={rowClass}>
                  <td className="px-2 py-3 text-sm w-40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 truncate">
                        {isEditing(app._id, "appName") ? (
                          <input
                            type="text"
                            defaultValue={app.appName}
                            onBlur={(e) => handleUpdate(app._id, "appName", e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleUpdate(app._id, "appName", e.target.value);
                              }
                            }}
                            className="w-full px-2 py-1 border border-slate-300 rounded-lg"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(app._id);
                              setEditingField("appName");
                            }}
                            className="text-left font-medium text-slate-900 hover:bg-slate-50 px-2 py-1 rounded-lg truncate w-full"
                            title={app.appName || "Untitled"}
                          >
                            {app.appName || "Untitled"}
                          </button>
                        )}

                        {alerts.length > 0 ? (
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {alerts.map((alert, idx) => (
                              <span
                                key={idx}
                                title={alert.text}
                                className="text-base leading-none"
                              >
                                {alert.icon}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(app._id)}
                        className="text-xs font-medium text-rose-700 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg shrink-0"
                        title="Delete app"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-sm w-20">
                    <select
                      value={app.status || "Build"}
                      onChange={(e) => handleUpdate(app._id, "status", e.target.value)}
                      className={`px-1 py-1 rounded-lg text-xs font-semibold w-full ${getStatusBadge(app.status || "Build")} border-0 cursor-pointer`}
                    >
                      <option value="Build">🛠 Build</option>
                      <option value="Live">🚀 Live</option>
                      <option value="Pause">🧊 Pause</option>
                      <option value="Kill">❌ Kill</option>
                      <option value="Scale">🔥 Scale</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "users7d") ? (
                      <input
                        type="number"
                        defaultValue={app.users7d}
                        onBlur={(e) => handleUpdate(app._id, "users7d", parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "users7d", parseInt(e.target.value) || 0);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("users7d");
                        }}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {(app.users7d || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "users30d") ? (
                      <input
                        type="number"
                        defaultValue={app.users30d}
                        onBlur={(e) => handleUpdate(app._id, "users30d", parseInt(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "users30d", parseInt(e.target.value) || 0);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("users30d");
                        }}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {(app.users30d || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "revenue30d") ? (
                      <input
                        type="number"
                        defaultValue={app.revenue30d}
                        onBlur={(e) => handleUpdate(app._id, "revenue30d", parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "revenue30d", parseFloat(e.target.value) || 0);
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("revenue30d");
                        }}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        ₹{(app.revenue30d || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "retention") ? (
                      <input
                        type="number"
                        defaultValue={app.retention}
                        min="0"
                        max="100"
                        onBlur={(e) => handleUpdate(app._id, "retention", parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "retention", parseFloat(e.target.value) || 0);
                          }
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("retention");
                        }}
                        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-xs font-medium ${getRetentionColor(app.retention || 0)}`}
                      >
                        {(app.retention || 0).toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "cost") ? (
                      <input
                        type="number"
                        defaultValue={app.cost}
                        onBlur={(e) => handleUpdate(app._id, "cost", parseFloat(e.target.value) || 0)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "cost", parseFloat(e.target.value) || 0);
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("cost");
                        }}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        ₹{(app.cost || 0).toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {isEditing(app._id, "owner") ? (
                      <input
                        type="text"
                        defaultValue={app.owner}
                        onBlur={(e) => handleUpdate(app._id, "owner", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(app._id, "owner", e.target.value);
                          }
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(app._id);
                          setEditingField("owner");
                        }}
                        className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {app.owner || "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={app.decision || "Watch"}
                      onChange={(e) => handleUpdate(app._id, "decision", e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${getDecisionBadge(app.decision || "Watch")} border-0 cursor-pointer`}
                    >
                      <option value="Scale">Scale</option>
                      <option value="Watch">Watch</option>
                      <option value="Kill">Kill</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {apps.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            No apps found. Add your first app using the form above.
          </div>
        )}
      </div>
    </div>
  );
}

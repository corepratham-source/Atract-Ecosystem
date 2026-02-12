import { useState, useEffect, useCallback } from "react";
import LeftSidebar from "../components/LeftSidebar";
import MonetizationCard from "../components/MonetizationCard";

import { API_BASE } from "../config/api";

const getSessionId = () => {
  let sid = localStorage.getItem("attendance_session_id");
  if (!sid) {
    sid = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    localStorage.setItem("attendance_session_id", sid);
  }
  return sid;
};

const ads = [
  {
    title: "📊 Attendance Analytics",
    text: "Identify patterns before they become problems",
    button: "Try Free"
  },
  {
    title: "🔔 Automated Alerts",
    text: "Get notified when exceptions exceed thresholds",
    button: "Learn More"
  },
  {
    title: "📈 Monthly Reports",
    text: "Export attendance reports for payroll",
    button: "Upgrade"
  }
];

export default function AttendanceExceptionTracker({ app, isPro = false }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    managerName: "",
    month: new Date().toISOString().slice(0, 7),
  });
  const [exceptions, setExceptions] = useState([]);
  const [currentException, setCurrentException] = useState({
    late: "",
    absent: "",
    early: "",
    date: "",
    reason: "",
  });
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("log");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/records`, {
        headers: { "x-session-id": getSessionId() },
      });
      const data = await res.json();
      if (res.ok) setExceptions(data.records || []);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleExceptionChange = (e) => {
    const { name, value } = e.target;
    setCurrentException(prev => ({ ...prev, [name]: value }));
  };

  const handleUpgrade = () => {
    setShowPayment(true);
  };

  const processPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPayment(false);
    }, 1500);
  };

  const addRecord = async () => {
    if (!formData.employeeName || !currentException.date) return;

    // Check if pro feature is needed
    if (!isPro && exceptions.length >= 5) {
      setShowPayment(true);
      return;
    }

    const payload = {
      ...formData,
      ...currentException,
      late: Number(currentException.late) || 0,
      absent: Number(currentException.absent) || 0,
      early: Number(currentException.early) || 0,
    };

    try {
      const res = await fetch(`${API_BASE}/api/attendance/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getSessionId(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      setExceptions(prev => [...prev, { ...data.record, totalExceptions: (data.record.late || 0) + (data.record.absent || 0) + (data.record.early || 0) }]);
      setCurrentException({ late: "", absent: "", early: "", date: "", reason: "" });
    } catch (err) {
      console.error("Failed to add record:", err);
    }
  };

  const deleteRecord = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/records/${id}`, {
        method: "DELETE",
        headers: { "x-session-id": getSessionId() },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setExceptions(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const totalExceptions = exceptions.reduce((acc, r) => acc + r.totalExceptions, 0);
  const highRiskCount = exceptions.filter(r => r.totalExceptions >= 6 || r.absent >= 3).length;

  const filteredRecords = exceptions.filter(r => {
    if (filter === "high-risk") return r.totalExceptions >= 6 || r.absent >= 3;
    if (filter === "late") return r.late > 0;
    if (filter === "absent") return r.absent > 0;
    if (filter === "early") return r.early > 0;
    return true;
  });

  const copyReport = () => {
    const report = `ATTENDANCE EXCEPTION REPORT
========================
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Total Records: ${exceptions.length}
Total Exceptions: ${totalExceptions}
High Risk Employees: ${highRiskCount}

DETAILED RECORDS
-----------------
${exceptions.map(r => `
Employee: ${r.employeeName}
ID: ${r.employeeId}
Department: ${r.department}
Month: ${r.month}
Late: ${r.late} | Absent: ${r.absent} | Early: ${r.early}
Total: ${r.totalExceptions}
Risk Level: ${r.totalExceptions >= 6 || r.absent >= 3 ? "HIGH RISK" : "WATCH"}
`).join('\n')}

---
Generated by Atract HR Attendance Tracker
`;
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <LeftSidebar 
        app={app} 
        isPro={isPro}
        ads={ads}
        currentAd={currentAd}
        onUpgrade={handleUpgrade}
        onAdChange={setCurrentAd}
      />

      {/* Main Content */}
      <div className="flex-1 ml-80 p-6">
        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900">Unlock Full Features</h3>
              <p className="text-gray-600 mt-2">Track unlimited attendance exceptions with advanced analytics</p>
              
              <div className="mt-4 bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Monthly subscription</span>
                  <span className="text-2xl font-bold text-gray-900">₹199/month</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  • Unlimited records<br/>
                  • Export reports<br/>
                  • Automated alerts
                </div>
              </div>

              <button
                onClick={processPayment}
                disabled={isProcessing}
                className="w-full mt-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isProcessing ? "Processing..." : "Subscribe - ₹199/month"}
              </button>

              <button
                onClick={() => setShowPayment(false)}
                className="w-full mt-3 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gray-100 pb-4 -mx-6 px-6">
          <h1 className="text-3xl font-bold text-gray-900">{app?.name || "Attendance Exception Tracker"}</h1>
          <p className="text-gray-600 mt-1">{app?.valueProposition || "Track late / early / absent patterns"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("log")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "log"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            📋 Log Exceptions
          </button>
          <button
            onClick={() => setActiveTab("records")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "records"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
            }`}
            disabled={exceptions.length === 0}
          >
            📊 Records ({exceptions.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "log" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Rahul Verma"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. EMP001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Manager name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <input
                    type="month"
                    name="month"
                    value={formData.month}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={currentException.date}
                    onChange={handleExceptionChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exception Details</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Late Arrivals</label>
                  <input
                    type="number"
                    min="0"
                    name="late"
                    value={currentException.late}
                    onChange={handleExceptionChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Absent Days</label>
                  <input
                    type="number"
                    min="0"
                    name="absent"
                    value={currentException.absent}
                    onChange={handleExceptionChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Early Exits</label>
                  <input
                    type="number"
                    min="0"
                    name="early"
                    value={currentException.early}
                    onChange={handleExceptionChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
                <textarea
                  name="reason"
                  value={currentException.reason}
                  onChange={handleExceptionChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any notes or reasons..."
                  rows={2}
                />
              </div>

              <button
                onClick={addRecord}
                disabled={!formData.employeeName || !currentException.date}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  formData.employeeName && currentException.date
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isPro ? "Add Record" : `Add Record (${exceptions.length}/5 free)`}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />
              
              {/* Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{exceptions.length}</div>
                    <div className="text-xs text-gray-500">Records</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{totalExceptions}</div>
                    <div className="text-xs text-gray-500">Exceptions</div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Enter employee details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Log exceptions (late/absent/early)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>View patterns and risk levels</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === "records" && exceptions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Exception Records</h2>
                <div className="flex gap-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="high-risk">High Risk</option>
                    <option value="late">Late Only</option>
                    <option value="absent">Absent Only</option>
                    <option value="early">Early Only</option>
                  </select>
                  <button
                    onClick={copyReport}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Copy Report
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {filteredRecords.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No records match the selected filter</p>
                ) : (
                  filteredRecords
                    .sort((a, b) => b.totalExceptions - a.totalExceptions)
                    .map((r) => {
                      const highRisk = r.totalExceptions >= 6 || r.absent >= 3;
                      return (
                        <div
                          key={r.id}
                          className={`rounded-xl border p-4 flex items-start justify-between gap-4 ${
                            highRisk 
                              ? "border-red-200 bg-red-50" 
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">{r.employeeName}</h4>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                highRisk 
                                  ? "bg-red-100 text-red-700" 
                                  : "bg-amber-100 text-amber-700"
                              }`}>
                                {highRisk ? "High Risk" : "Watch"}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {r.employeeId} • {r.department} • {r.month}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                Late: {r.late}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                Absent: {r.absent}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                Early: {r.early}
                              </span>
                            </div>
                            {r.reason && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                Note: {r.reason}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => deleteRecord(r.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />
              
              {/* Stats */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Analytics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Records</span>
                    <span className="font-semibold">{exceptions.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Exceptions</span>
                    <span className="font-semibold">{totalExceptions}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">High Risk</span>
                    <span className="font-semibold text-red-600">{highRiskCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Avg per Employee</span>
                    <span className="font-semibold">
                      {exceptions.length > 0 ? (totalExceptions / exceptions.length).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

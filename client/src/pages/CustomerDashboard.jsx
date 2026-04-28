import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config/api";
import { getStoredUser } from "../components/ProtectedRoute";
import { microApps } from "../data/microApps";

export default function CustomerDashboard() {
  const user = getStoredUser();
  const [resumes, setResumes] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    fetch(`${API_BASE}/api/resume/my?email=${encodeURIComponent(user.email)}`)
      .then(res => res.json().catch(() => []))
      .then(data => setResumes(Array.isArray(data) ? data : data.resumes || []))
      .catch(() => setResumes([]));
  }, [user]);

  const readFileAsText = (f) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsText(f);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !user?.email) return;
    setUploadError("");
    setUploadSuccess(false);
    setUploading(true);
    try {
      let text = "";
      if (file.type === "text/plain" || file.name.endsWith(".txt")) {
        text = await readFileAsText(file);
      } else {
        setUploadError("Please upload a .txt file. Other formats may be added later.");
        setUploading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name || file.name.replace(/\.[^/.]+$/, ""),
          email: user.email,
          text: text.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        setUploading(false);
        return;
      }
      setFile(null);
      setUploadSuccess(true);
      // Refresh the resumes list
      fetch(`${API_BASE}/api/resume/my?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json().catch(() => []))
        .then(data => setResumes(Array.isArray(data) ? data : data.resumes || []))
        .catch(() => {});
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      setUploadError(err.message || "Upload failed");
    }
    setUploading(false);
  };

  if (!user) return null;

  return (
    <main className="w-full min-h-screen bg-slate-50">
      <div className="px-4 sm:px-4 lg:px-8 py-2 lg:py-2">
        <div className="max-w-8xl mx-auto space-y-6">
          {/* Welcome Header */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 sm:p-4 text-white shadow-lg">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋</h1>
            <p className="text-red-100 text-base">Manage your resumes and access powerful HR tools</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl font-bold">{resumes.length}</div>
              <div className="text-red-100 text-sm mt-2">Resumes Uploaded</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-shadow">
              <div className="text-3xl sm:text-4xl font-bold">
                {resumes.filter(r => r.matchPercentage != null).length}
              </div>
              <div className="text-red-100 text-sm mt-2">Analyzed Resumes</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-md hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl font-bold">{microApps.length}</div>
              <div className="text-red-100 text-sm mt-2">Available Tools</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Section 1: Quick Upload */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#4A4A4A' }}>Quick Upload</h2>
                  <p className="text-xs sm:text-sm" style={{ color: '#9E9E9E' }}>Upload your resume</p>
                </div>
              </div>
              
              <form onSubmit={handleUpload} className="space-y-7">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setUploadError("");
                  }}
                  className="block w-full text-sm" style={{ color: '#4A4A4A' }} 
                  placeholder="Upload your resume"
                />
                {uploadError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">{uploadError}</p>
                )}
                {uploadSuccess && (
                  <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">✓ Resume uploaded successfully!</p>
                )}
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-2.5 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {uploading ? "Uploading..." : "Upload Resume"}
                </button>
              </form>
              <p className="text-xs mt-8" style={{ color: '#9E9E9E' }}>Supported format: .txt files only</p>
            </section>

            {/* Section 2: My Resumes */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold" style={{ color: '#4A4A4A' }}>My Resumes</h2>
                </div>
                <span className="text-xs font-medium" style={{ color: '#9E9E9E' }} bg-slate-100 px-2 py-1 rounded-full whitespace-nowrap>
                  {resumes.length} total
                </span>
              </div>
              
              {resumes.length === 0 ? (
                <div className="text-center py-8" style={{ backgroundColor: '#F5F5F5' }} border-radius="0.5rem">
                  <svg className="w-12 h-12 mx-auto mb-2" style={{ color: '#E0E0E0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm" style={{ color: '#9E9E9E' }}>No resumes uploaded yet</p>
                  <p className="text-xs mt-1" style={{ color: '#9E9E9E' }}>Upload your first resume to get started</p>
                </div>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-y-auto">
                  {resumes.slice(0, 5).map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg border transition-colors"
                      style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium block truncate text-sm" style={{ color: '#4A4A4A' }}>{r.name || "Resume"}</span>
                        <span className="text-xs" style={{ color: '#9E9E9E' }}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${
                        r.matchPercentage >= 80 ? "bg-emerald-100 text-emerald-700" :
                        r.matchPercentage >= 60 ? "bg-blue-100 text-blue-700" :
                        r.matchPercentage >= 40 ? "bg-amber-100 text-amber-700" :
                        r.matchPercentage != null ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {r.matchPercentage != null ? `${r.matchPercentage}%` : "—"}
                      </span>
                    </li>
                  ))}
                  {resumes.length > 5 && (
                    <li className="text-center py-2 text-xs" style={{ color: '#9E9E9E' }}>
                      +{resumes.length - 5} more resumes
                    </li>
                  )}
                </ul>
              )}
            </section>
          </div>

          {/* Section 3: Tools & Apps */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold" style={{ color: '#4A4A4A' }}>HR Tools & Apps</h2>
                <p className="text-sm" style={{ color: '#9E9E9E' }}>Powerful tools to streamline your HR workflows</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {microApps.map((app, index) => (
                <Link
                  key={app.id}
                  to={`/customer/apps/${app.id}`}
                  className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-red-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative p-4">
                    {/* Icon with gradient background */}
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-md group-hover:shadow-lg">
                      <span className="text-lg">{app.icon || '📱'}</span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-sm mb-1 group-hover:text-red-600 transition-colors duration-300" style={{ color: '#4A4A4A' }}>{app.name}</h3>
                    
                    {/* Description */}
                    <p className="text-xs mb-2 line-clamp-2 group-hover:text-slate-700 transition-colors duration-300" style={{ color: '#9E9E9E' }}>{app.valueProposition}</p>
                    
                    {/* Pricing badge */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full group-hover:bg-red-100 transition-colors duration-300">
                        {app.pricing}
                      </span>
                      <span className="text-red-500 group-hover:translate-x-1 transition-transform duration-300 text-base">
                        →
                      </span>
                    </div>
                  </div>
                  
                  {/* Bottom accent line */}
                  <div className="h-1 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Link>
              ))}
            </div>
          </section>

          {/* Section 4: Profile */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-semibold" style={{ color: '#4A4A4A' }}>My Profile</h2>
            </div>
            
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="rounded-xl p-4 sm:p-6 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}>
                <dt className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#9E9E9E' }}>Full Name</dt>
                <dd className="font-semibold mt-2 text-base sm:text-lg" style={{ color: '#4A4A4A' }}>{user.name || "—"}</dd>
              </div>
              <div className="rounded-xl p-4 sm:p-6 border" style={{ backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }}>
                <dt className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#9E9E9E' }}>Email Address</dt>
                <dd className="font-semibold mt-2 text-base sm:text-lg break-all" style={{ color: '#4A4A4A' }}>{user.email || "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}

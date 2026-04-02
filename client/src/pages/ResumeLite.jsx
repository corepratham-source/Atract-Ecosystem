import { useState, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import LeftSidebar from "../components/LeftSidebar";
import { API_BASE } from "../config/api";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";

const MAX_RESUMES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc"];

const defaultApp = {
  name: "ResumeLite",
  valueProposition: "AI-Powered Multiple Resume Analysis & Scoring",
  pricing: "Powered by Groq AI",
  icon: "📊",
};

export default function ResumeLite({ app = defaultApp }) {
  useTrackAppUsage("resume-lite");

  const [jdText, setJdText] = useState("");
  const [jdName, setJdName] = useState("");
  const [resumes, setResumes] = useState([]);
  const [results, setResults] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [jdAlert, setJdAlert] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `${file.name}: Only PDF, DOC, DOCX allowed`;
    if (file.size > MAX_FILE_SIZE) return `${file.name}: Max 5MB`;
    if (resumes.some((r) => r.name === file.name)) return `${file.name}: Already added`;
    return null;
  };

  const addFiles = (files) => {
    setError("");
    const remaining = MAX_RESUMES - resumes.length;
    if (remaining <= 0) {
      setError(`Maximum ${MAX_RESUMES} resumes allowed`);
      return;
    }
    const toAdd = Array.from(files).slice(0, remaining);
    const valid = [];
    for (const f of toAdd) {
      const err = validateFile(f);
      if (err) { setError(err); continue; }
      valid.push({ file: f, name: f.name, id: Date.now() + Math.random() });
    }
    if (valid.length) setResumes((p) => [...p, ...valid]);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }, [resumes]);

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const removeResume = (id) => {
    setResumes((p) => p.filter((r) => r.id !== id));
    setResults((p) => p.filter((r) => r.id !== id));
  };

  const handleJDChange = (e) => {
    const val = e.target.value;
    setJdText(val);
    if (val.trim().length > 20 && !jdName) {
      const words = val.trim().split(/\s+/).slice(0, 6).join(" ");
      setJdName(words + (val.trim().split(/\s+/).length > 6 ? "..." : ""));
    }
  };

  const handleNewJD = () => {
    if (jdText.trim() && results.length > 0) {
      setJdAlert("New Job Description has been added successfully.");
      setTimeout(() => setJdAlert(""), 5000);
    }
    setJdText("");
    setJdName("");
    setResults([]);
    setResumes([]);
    setError("");
  };

  const analyze = async () => {
    if (!jdText.trim()) { setError("Please enter a Job Description"); return; }
    if (resumes.length === 0) { setError("Please upload at least one resume"); return; }

    setError("");
    setIsAnalyzing(true);
    setProgress(0);
    const newResults = [];

    for (let i = 0; i < resumes.length; i++) {
      const r = resumes[i];
      try {
        const form = new FormData();
        form.append("resume", r.file);
        form.append("name", r.name.replace(/\.[^.]+$/, ""));

        const uploadRes = await fetch(`${API_BASE}/api/resume/upload`, { method: "POST", body: form });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");

        let resumeText = uploadData.text;
        if (!resumeText && uploadData.id) {
          const getRes = await fetch(`${API_BASE}/api/resume/${uploadData.id}`);
          const getData = await getRes.json();
          resumeText = getData.text;
        }
        if (!resumeText) throw new Error("Could not extract text");

        const analyzeRes = await fetch(`${API_BASE}/api/analysis/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jdText: jdText.trim(), resumeText }),
        });
        const analyzeData = await analyzeRes.json();
        if (!analyzeRes.ok) throw new Error(analyzeData.error || "Analysis failed");

        const score = analyzeData.overallScore || analyzeData.matchScore || 0;
        const matched = analyzeData.matchedKeywords || analyzeData.strongAlignments || [];
        const missing = analyzeData.missingKeywords || analyzeData.criticalMismatches || [];
        const classification = analyzeData.classification || (score >= 70 ? "Strong Fit" : score >= 45 ? "Moderate" : "Weak");

        newResults.push({
          id: r.id,
          candidateName: r.name.replace(/\.[^.]+$/, ""),
          fileName: r.name,
          matchScore: score,
          skillsMatched: Array.isArray(matched) ? matched : [],
          missingSkills: Array.isArray(missing) ? missing : [],
          classification,
          usedAI: analyzeData.usedAI || false,
        });
      } catch (err) {
        newResults.push({
          id: r.id,
          candidateName: r.name.replace(/\.[^.]+$/, ""),
          fileName: r.name,
          matchScore: 0,
          skillsMatched: [],
          missingSkills: [],
          classification: "Error",
          error: err.message,
        });
      }
      setProgress(Math.round(((i + 1) / resumes.length) * 100));
    }

    setResults((prev) => {
      const merged = [...prev];
      for (const nr of newResults) {
        const idx = merged.findIndex((m) => m.id === nr.id);
        if (idx >= 0) merged[idx] = nr;
        else merged.push(nr);
      }
      return merged.sort((a, b) => b.matchScore - a.matchScore);
    });
    setIsAnalyzing(false);
  };

  const sortedResults = [...results].sort((a, b) => b.matchScore - a.matchScore);

  const exportExcel = () => {
    if (sortedResults.length === 0) return;

    const sheetTitle = jdName || "Resume Analysis";

    const data = sortedResults.map((r, i) => ({
      "Rank": i + 1,
      "Candidate Name": r.candidateName,
      "Resume Name": r.fileName,
      "Match %": r.matchScore,
      "Classification": r.classification,
      "Skills Matched": (r.skillsMatched || []).join(", "),
      "Missing Skills": (r.missingSkills || []).join(", "),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Insert JD title as first row
    XLSX.utils.sheet_add_aoa(ws, [[`JD: ${sheetTitle}`]], { origin: "A1" });
    XLSX.utils.sheet_add_aoa(ws, [[""]], { origin: "A2" });
    // Re-add headers at row 3, data starts at row 4
    const headers = Object.keys(data[0]);
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: "A3" });
    // Shift data rows down
    const dataRows = data.map((row) => headers.map((h) => row[h]));
    XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A4" });

    ws["!cols"] = [
      { wch: 6 },   // Rank
      { wch: 25 },  // Candidate Name
      { wch: 30 },  // Resume Name
      { wch: 10 },  // Match %
      { wch: 15 },  // Classification
      { wch: 40 },  // Skills Matched
      { wch: 40 },  // Missing Skills
    ];

    XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31));
    XLSX.writeFile(wb, `ResumeAnalysis_${(jdName || "JD").replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`);
  };

  const getScoreColor = (score) => {
    if (score >= 70) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 45) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  const getClassificationColor = (c) => {
    if (c === "Strong Fit") return "bg-emerald-100 text-emerald-800";
    if (c === "Moderate") return "bg-amber-100 text-amber-800";
    if (c === "Error") return "bg-red-100 text-red-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={true} backTo="/customer" />

      <div className="flex-1 ml-80 min-h-screen flex flex-col">
        {/* Sticky Header */}
        <div className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
              <p className="text-gray-500">{app.valueProposition}</p>
            </div>
            <span className="text-4xl">{app.icon}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* JD Alert */}
            {jdAlert && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                {jdAlert}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 flex items-center justify-between">
                <span>{error}</span>
                <button onClick={() => setError("")} className="text-red-500 hover:text-red-700 font-bold">×</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: JD + Upload */}
              <div className="lg:col-span-1 space-y-6">
                {/* JD Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Job Description</h2>
                    {(jdText || results.length > 0) && (
                      <button onClick={handleNewJD} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        + New JD
                      </button>
                    )}
                  </div>
                  <textarea
                    value={jdText}
                    onChange={handleJDChange}
                    placeholder="Paste the Job Description here..."
                    className="w-full h-40 p-3 border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none text-sm"
                  />
                  {jdName && (
                    <p className="text-xs text-gray-500 mt-2 truncate">JD: {jdName}</p>
                  )}
                </div>

                {/* Resume Upload */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Upload Resumes
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ({resumes.length}/{MAX_RESUMES})
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mb-4">PDF, DOC, DOCX — max 5MB each</p>

                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                      dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-emerald-400"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-gray-600">Drag & drop resumes here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => addFiles(e.target.files)}
                      className="hidden"
                    />
                  </div>

                  {/* File List */}
                  {resumes.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                      {resumes.map((r) => (
                        <div key={r.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                          <span className="text-sm text-slate-700 truncate mr-2">{r.name}</span>
                          <button onClick={() => removeResume(r.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Analyze Button */}
                  <button
                    onClick={analyze}
                    disabled={isAnalyzing || resumes.length === 0 || !jdText.trim()}
                    className={`w-full mt-4 py-4 text-lg font-semibold rounded-2xl transition-all ${
                      isAnalyzing || resumes.length === 0 || !jdText.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        Analyzing... {progress}%
                      </span>
                    ) : (
                      `Analyze ${resumes.length} Resume${resumes.length !== 1 ? "s" : ""}`
                    )}
                  </button>

                  {/* Progress Bar */}
                  {isAnalyzing && (
                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Results */}
              <div className="lg:col-span-2">
                {sortedResults.length === 0 ? (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="text-5xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
                    <p className="text-gray-500">Upload resumes and enter a Job Description to get started.</p>
                    <div className="flex justify-center gap-6 mt-4 text-sm text-gray-400">
                      <span>Max {MAX_RESUMES} resumes</span>
                      <span>AI-powered scoring</span>
                      <span>Excel export</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Results Header */}
                    <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Results — {sortedResults.length} Resume{sortedResults.length !== 1 ? "s" : ""}
                        </h2>
                        <p className="text-sm text-gray-500">Sorted by match percentage (highest first)</p>
                      </div>
                      <button
                        onClick={exportExcel}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-2 shadow-sm"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Export to Excel
                      </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">#</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Candidate</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Resume</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Match %</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Classification</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Skills Matched</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Missing Skills</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sortedResults.map((r, i) => (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-4 text-sm font-medium text-slate-500">{i + 1}</td>
                              <td className="px-5 py-4">
                                <div className="text-sm font-semibold text-slate-900">{r.candidateName}</div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm text-slate-600 truncate max-w-[180px]">{r.fileName}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(r.matchScore)}`}>
                                  {r.matchScore}%
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getClassificationColor(r.classification)}`}>
                                  {r.classification}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm text-slate-600 max-w-[200px]">
                                  {r.skillsMatched?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {r.skillsMatched.slice(0, 4).map((s, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full">{s}</span>
                                      ))}
                                      {r.skillsMatched.length > 4 && (
                                        <span className="text-xs text-gray-400">+{r.skillsMatched.length - 4}</span>
                                      )}
                                    </div>
                                  ) : <span className="text-gray-400">—</span>}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="text-sm max-w-[200px]">
                                  {r.missingSkills?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {r.missingSkills.slice(0, 3).map((s, j) => (
                                        <span key={j} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded-full">{s}</span>
                                      ))}
                                      {r.missingSkills.length > 3 && (
                                        <span className="text-xs text-gray-400">+{r.missingSkills.length - 3}</span>
                                      )}
                                    </div>
                                  ) : <span className="text-gray-400">—</span>}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

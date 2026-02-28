import { useState } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import LeftSidebar from "../components/LeftSidebar";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { API_BASE } from "../config/api";

const defaultApp = {
  name: "Interview Questions Generator",
  valueProposition: "Role-Specific AI Questions",
  pricing: "Powered by Groq",
  icon: "❓"
};

export default function InterviewQuestions({ app = defaultApp }) {
  useTrackAppUsage('interview-questions');

  const [role, setRole] = useState("");
  const [level, setLevel] = useState("Mid");
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  const generateQuestions = async () => {
    if (!role.trim()) {
      setError("Please enter a job role");
      return;
    }

    setIsLoading(true);
    setError("");
    setQuestions([]);

    try {
      const res = await fetch(`${API_BASE}/api/interview/generate-questions`, {  // ← Updated path
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim(), level }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");

      setQuestions(data.questions || []);
      setShowResults(true);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const copyAll = () => {
    const text = questions.map((q, i) => `${i+1}. ${q}`).join("\n");
    navigator.clipboard.writeText(text);
    alert("✅ Copied to clipboard!");
  };

  const reset = () => {
    setQuestions([]);
    setShowResults(false);
    setRole("");
    setError("");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={true} backTo="/customer" />

      <div className="flex-1 ml-80 min-h-screen flex flex-col">
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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

              {!showResults && (
                <div className="p-8">
                  <SectionTitle 
                    title="Generate Role-Specific Questions" 
                    description="Enter any job role → Get 8 fresh Groq-powered questions" 
                  />

                  {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

                  <div className="space-y-6">
                    <Field label="Job Role">
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Senior React Developer, Product Manager"
                        className="w-full px-5 py-4 rounded-2xl border border-slate-300 focus:border-emerald-500 text-lg"
                      />
                    </Field>

                    <Field label="Experience Level">
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl border border-slate-300 focus:border-emerald-500 text-lg"
                      >
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid-Level</option>
                        <option value="Senior">Senior</option>
                      </select>
                    </Field>

                    <button
                      onClick={generateQuestions}
                      disabled={isLoading || !role.trim()}
                      className={`w-full py-5 text-xl font-semibold rounded-2xl transition-all ${
                        isLoading || !role.trim() ? "bg-slate-200 text-slate-400" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg"
                      }`}
                    >
                      {isLoading ? "Generating..." : "🚀 Generate Questions"}
                    </button>
                  </div>
                </div>
              )}

              {showResults && questions.length > 0 && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-bold">Questions for {role} ({level})</h2>
                      <p className="text-emerald-600">Fresh • Role-Specific • Groq Powered</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={copyAll} className="px-6 py-3 bg-white border border-emerald-600 text-emerald-600 rounded-2xl font-semibold hover:bg-emerald-50">📋 Copy All</button>
                      <button onClick={reset} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-semibold hover:bg-slate-200">New Role</button>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {questions.map((q, i) => (
                      <div key={i} className="flex gap-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-700 font-bold rounded-full flex items-center justify-center flex-shrink-0">{i+1}</div>
                        <p className="text-lg leading-relaxed text-slate-800">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
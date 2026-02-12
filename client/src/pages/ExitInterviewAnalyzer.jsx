import { useState, useEffect } from "react";
import LeftSidebar from "../components/LeftSidebar";
import MonetizationCard from "../components/MonetizationCard";
import SectionTitle from "../components/SectionTitle";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const ads = [
  {
    title: "🚀 Upgrade to Pro",
    text: "Get unlimited exit interview analyses per month",
    button: "Start Free Trial"
  },
  {
    title: "📊 HR Analytics Bundle",
    text: "Combine with Performance Review for insights",
    button: "Learn More"
  },
  {
    title: "🎯 Better Retention",
    text: "Identify turnover patterns before it's too late",
    button: "See How"
  }
];

export default function ExitInterviewAnalyzer({ app }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [form, setForm] = useState({
    employeeName: "",
    department: "",
    role: "",
    tenure: "",
    exitDate: "",
    reason: "Resignation",
    notes: "",
    manager: "",
  });
  const [analysis, setAnalysis] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("exitInterviewTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("exitInterviewPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("exitInterviewTrials", count.toString());
  };

  // Rotate ads every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan) => {
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error?.includes("not configured")) {
          alert("Payment not configured. For demo: marking as paid.");
          setIsPaid(true);
          sessionStorage.setItem("exitInterviewPaid", "true");
          setShowPayment(false);
          updateTrialCount(0);
        } else {
          setError(data.error || "Failed to create order");
        }
        setIsProcessing(false);
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        setError("Payment script failed to load");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ATRact Exit Interview Analyzer",
        description: plan === "basic" ? "Single Analysis" : "Pro Membership",
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setIsPaid(true);
              sessionStorage.setItem("exitInterviewPaid", "true");
              setShowPayment(false);
              updateTrialCount(0);
              analyze();
              alert("Payment successful! Analyzing your exit interview...");
            } else {
              setError("Payment verification failed");
            }
          } catch {
            setError("Could not verify payment");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: { name: "Customer", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const analyze = async () => {
    if (!form.notes.trim() && !form.employeeName.trim()) {
      setError("Please enter employee details and notes");
      return;
    }

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPayment(true);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/exit-interview/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      
      setAnalysis({
        ...data,
        employeeName: form.employeeName,
        department: form.department,
        role: form.role,
        tenure: form.tenure,
        exitReason: form.reason,
      });
      
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getRiskColor = (risk) => {
    if (risk === "High") return "bg-red-100 text-red-700 border-red-200";
    if (risk === "Medium") return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-green-100 text-green-700 border-green-200";
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment === "Mostly Negative") return "text-red-600";
    if (sentiment === "Mostly Positive") return "text-green-600";
    return "text-amber-600";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <LeftSidebar 
        app={app} 
        isPro={isPaid}
        ads={ads}
        currentAd={currentAd}
        onUpgrade={() => setShowPayment(true)}
        onAdChange={setCurrentAd}
      />

      {/* Main Content */}
      <div className="flex-1 ml-80">
        {/* Fixed Header */}
        <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{app?.name || "Exit Interview Analyzer"}</h1>
              <p className="text-gray-600 text-sm">{app?.valueProposition || "Analyze exit feedback patterns to improve retention"}</p>
            </div>
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <span className="text-sm text-amber-700 font-medium">Free Trials: {trialCount}/{MAX_FREE_TRIALS}</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 max-w-6xl mx-auto">
          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
                <button
                  onClick={() => setShowPayment(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="p-6 text-center border-b border-gray-100">
                  <div className="text-3xl mb-2">🔒</div>
                  <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
                  <p className="text-gray-600 mt-1">You've used your 2 free analyses.</p>
                </div>

                <div className="p-6">
                  <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">Exit Interview Analysis</p>
                        <p className="text-sm text-gray-500">AI-powered retention insights</p>
                      </div>
                      <p className="text-2xl font-bold text-indigo-700">₹499</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handlePayment("exit_analysis")}
                    disabled={isProcessing}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : "Pay ₹499 & Analyze"}
                  </button>

                  {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                      {error}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 text-center border-t">
                  <button onClick={() => setShowPayment(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Analysis Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Employee Details Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name</label>
                    <input
                      type="text"
                      value={form.employeeName}
                      onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Engineering"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role / Position</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senior Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tenure</label>
                    <input
                      type="text"
                      value={form.tenure}
                      onChange={(e) => setForm({ ...form, tenure: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="2 years"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date</label>
                    <input
                      type="date"
                      value={form.exitDate}
                      onChange={(e) => setForm({ ...form, exitDate: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                    <select
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Resignation">Resignation</option>
                      <option value="Termination">Termination</option>
                      <option value="Retirement">Retirement</option>
                      <option value="End of Contract">End of Contract</option>
                      <option value="Mutual Separation">Mutual Separation</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={form.manager}
                    onChange={(e) => setForm({ ...form, manager: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Manager Name"
                  />
                </div>
              </div>

              {/* Notes Input Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Exit Interview Notes</h2>
                <p className="text-sm text-gray-500 mb-4">Paste exit interview transcript or notes here for AI analysis</p>
                
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full min-h-[150px] rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste exit interview notes here. Include reasons mentioned, feedback about management, work environment, growth opportunities, compensation concerns, etc..."
                />

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                {!isPaid && (
                  <div className="mt-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-indigo-800">Free Trial {trialCount}/{MAX_FREE_TRIALS}</span>
                    </div>
                    <div className="h-2 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all"
                        style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={analyze}
                    disabled={!form.notes.trim() || isProcessing}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      form.notes.trim() && !isProcessing
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 shadow-md"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing with Gemini...
                      </span>
                    ) : (
                      "Analyze Exit Interview"
                    )}
                  </button>

                  {analysis && (
                    <button
                      onClick={() => {
                        const text = `EXIT INTERVIEW ANALYSIS
===========================
Employee: ${analysis.employeeName || "N/A"}
Department: ${analysis.department || "N/A"}
Role: ${analysis.role || "N/A"}
Tenure: ${analysis.tenure || "N/A"}
Exit Reason: ${analysis.exitReason || "N/A"}
Generated: ${analysis.generatedAt}

SENTIMENT: ${analysis.sentiment}
RETENTION RISK: ${analysis.retentionRisk}

KEY THEMES:
${analysis.themes.map(t => `• ${t}`).join('\n')}

KEYWORDS:
${analysis.keywords.map(k => `• ${k}`).join('\n')}

RECOMMENDED ACTIONS:
${analysis.actions.map(a => `[${a.priority}] ${a.action} (${a.timeline})`).join('\n')}`;
                        copyToClipboard(text);
                        alert("Analysis copied to clipboard!");
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                    >
                      Copy Report
                    </button>
                  )}
                </div>
              </div>

              {/* Results Card */}
              {analysis && (
                <div className="bg-white rounded-2xl shadow-sm p-6 animate-[fadeIn_0.3s_ease-out]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Analysis Results</h2>
                    <span className="text-xs text-gray-500">{analysis.generatedAt}</span>
                  </div>

                  {/* Employee Summary */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Employee</span>
                        <p className="font-medium text-gray-900">{analysis.employeeName || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Department</span>
                        <p className="font-medium text-gray-900">{analysis.department || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Tenure</span>
                        <p className="font-medium text-gray-900">{analysis.tenure || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Risk Level</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${getRiskColor(analysis.retentionRisk)}`}>
                          {analysis.retentionRisk}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment & Risk */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sentiment Analysis</span>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${
                          analysis.sentiment === "Mostly Positive" ? "bg-green-500" :
                          analysis.sentiment === "Mostly Negative" ? "bg-red-500" :
                          "bg-amber-500"
                        }`} />
                        <span className={`font-semibold ${getSentimentColor(analysis.sentiment)}`}>
                          {analysis.sentiment}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Retention Risk</span>
                      <div className="mt-2">
                        <span className={`inline-block px-3 py-1 rounded-lg font-semibold ${getRiskColor(analysis.retentionRisk)}`}>
                          {analysis.retentionRisk} Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Themes */}
                  <div className="mb-6">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Themes Detected</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.themes.map((theme, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Keywords */}
                  {analysis.keywords.length > 0 && (
                    <div className="mb-6">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Keywords</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {analysis.keywords.map((keyword, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended Actions</span>
                    <div className="mt-3 space-y-3">
                      {analysis.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ${
                            action.priority === "High" ? "bg-red-100 text-red-700" :
                            action.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                          }`}>
                            {action.priority}
                          </span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{action.action}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Timeline: {action.timeline}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />
              
              {/* Info Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
                <ol className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Enter employee details and exit interview notes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>AI identifies themes, sentiment, and risk factors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Get actionable retention recommendations</span>
                  </li>
                </ol>
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">💡 Tips for Better Analysis</h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Include specific quotes from the employee</li>
                  <li>• Mention all reasons mentioned for leaving</li>
                  <li>• Include feedback about management</li>
                  <li>• Note any compensation concerns raised</li>
                  <li>• Document growth opportunity discussions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

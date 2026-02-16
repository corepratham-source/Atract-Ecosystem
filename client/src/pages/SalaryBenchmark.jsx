import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import LeftSidebar from "../components/LeftSidebar";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Salary Benchmark Tool",
  valueProposition: "Is this salary fair?",
  pricing: "₹299 per report",
};

export default function SalaryBenchmarkTool({ app = defaultApp }) {
  // Track app usage
  useTrackAppUsage('salary-benchmark');
  
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [skills, setSkills] = useState("");
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("salaryBenchmarkTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("salaryBenchmarkPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("salaryBenchmarkTrials", count.toString());
  };

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

  const generateReport = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/salary-benchmark/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience, salary: salary || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report");
      }

      setReport(data);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (plan) => {
    setPaymentLoading(true);
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
          sessionStorage.setItem("salaryBenchmarkPaid", "true");
          setShowPaymentModal(false);
          updateTrialCount(0);
          generateReport();
        } else {
          setError(data.error || "Failed to create order");
        }
        setPaymentLoading(false);
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        setError("Payment script failed to load");
        setPaymentLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ATRact Salary Benchmark",
        description: plan === "basic" ? "Basic - Unlimited Reports" : "Premium - Full Access",
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
              sessionStorage.setItem("salaryBenchmarkPaid", "true");
              setShowPaymentModal(false);
              updateTrialCount(0);
              generateReport();
              alert("Payment successful! Generating your report...");
            } else {
              setError("Payment verification failed");
            }
          } catch {
            setError("Could not verify payment");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: { name: "Customer", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => setPaymentLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Payment failed");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!role?.trim() || !location?.trim()) {
      setError("Role and Location are required");
      return;
    }
    setError("");

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPaymentModal(true);
    } else {
      generateReport();
    }
  };

  const canGenerate = role?.trim() && location?.trim();

  const getVerdictColor = (verdict) => {
    if (verdict.includes("Below")) return "bg-red-100 text-red-700 border-red-200";
    if (verdict.includes("Above")) return "bg-green-100 text-green-700 border-green-200";
    return "bg-blue-100 text-blue-700 border-blue-200";
  };

  const getVerdictIcon = (verdict) => {
    if (verdict.includes("Below")) return "⚠️";
    if (verdict.includes("Above")) return "🎉";
    return "✅";
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPaid} />

      <style>{`
        /* Tiny scrollbar for all scrollable areas */
        ::-webkit-scrollbar {
          width: 2px !important;
          height: 2px !important;
        }
        ::-webkit-scrollbar-track {
          background: transparent !important;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1 !important;
          border-radius: 2px !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8 !important;
        }
        /* Firefox */
        * {
          scrollbar-width: thin !important;
          scrollbar-color: #cbd5e1 transparent !important;
        }
      `}</style>

      <div className="flex-1 ml-80 flex">
        {/* LEFT – FORM (fixed) */}
        <div className="w-1/2 h-screen overflow-hidden flex flex-col shrink-0">
          <div className="bg-white border-r border-gray-200 flex flex-col h-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Salary Benchmark Tool</h2>
              <p className="text-sm text-slate-500 mt-1">Is this salary fair? For HR & candidates.</p>
              {!isPaid && (
                <p className="text-sm text-amber-500 mt-1 font-medium">
                  Free trials: {trialCount}/{MAX_FREE_TRIALS} used
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <SectionTitle
                title="Job Details"
                description="Enter the role and location to get salary benchmarks."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Role / Position">
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer, Product Manager"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bengaluru, Mumbai, Remote"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Experience (years)">
                  <input
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    placeholder="e.g. 3, 5, 8"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Company Name (optional)">
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google, Amazon, Startup"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Industry">
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Industry</option>
                    <option value="it">IT / Software</option>
                    <option value="finance">Finance / Banking</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="consulting">Consulting</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="retail">Retail</option>
                    <option value="startup">Startup</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Offer / Expected Salary (₹/month)">
                  <input
                    type="number"
                    min="0"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 75000 (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </div>

              <Field label="Key Skills (optional)">
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. React, Python, AWS, ML (comma separated)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </Field>

              {!isPaid && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
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
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate || isLoading}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  canGenerate && !isLoading
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating with Gemini...
                  </span>
                ) : (
                  "Generate Salary Report"
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">Pricing: ₹299 per report after free trials</p>
            </div>
          </div>
        </div>

        {/* RIGHT – REPORT (scrollable only) */}
        <div className="w-1/2 h-screen overflow-y-auto bg-gray-50">
          <div className="p-6">
            <SectionTitle
              title="Salary Benchmark Report"
              description={report ? "Your fairness assessment and recommendations" : "Enter details and generate to see report"}
            />

            {!report && !isLoading && (
              <div className="mt-12 text-center text-gray-500">
                <div className="text-5xl mb-4">📊</div>
                <p className="font-medium">Fill in the details on the left</p>
                <p className="text-sm mt-2">Click "Generate Salary Report" to get your analysis</p>
                <p className="text-xs mt-1 text-amber-500">{MAX_FREE_TRIALS - trialCount} free trials remaining</p>
              </div>
            )}

            {report && (
              <div className="mt-4 space-y-6">
                {/* Header Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-xl">📋</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.role}</h3>
                      <p className="text-sm text-gray-500">{report.location} • {report.experience} years experience</p>
                    </div>
                  </div>

                  {/* Salary Range */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
                    <div className="flex items-baseline justify-between gap-4 flex-wrap">
                      <div>
                        <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Indicative Range</div>
                        <div className="mt-1 text-2xl font-bold text-indigo-900">
                          ₹{report.range.min.toLocaleString()} – ₹{report.range.max.toLocaleString()}
                        </div>
                        <div className="text-sm text-indigo-600 mt-1">
                          Market Midpoint: ₹{report.range.mid.toLocaleString()}/month
                        </div>
                      </div>
                      {report.offered && (
                        <div className="text-right">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Your Offer</div>
                          <div className="mt-1 text-2xl font-bold text-gray-900">
                            ₹{report.offered.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {Math.round((report.offered / report.range.mid - 1) * 100) > 0 ? "+" : ""}
                            {Math.round((report.offered / report.range.mid - 1) * 100)}% vs midpoint
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className={`mt-4 rounded-xl p-4 border ${getVerdictColor(report.verdict)}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getVerdictIcon(report.verdict)}</span>
                      <span className="font-semibold">{report.verdict}</span>
                    </div>
                    <p className="text-sm mt-2 opacity-90">{report.notes}</p>
                  </div>

                  {/* Recommendation */}
                  {report.recommendation && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-start gap-3">
                        <span className="text-lg">💡</span>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Recommendation</div>
                          <p className="text-sm text-gray-600 mt-1">{report.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Insights */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4">📈 Market Insights</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Experience Factor</div>
                      <div className="font-semibold text-gray-900">
                        +₹{(report.experience * 4000).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">per year experience</div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-xs text-gray-500 mb-1">Location Premium</div>
                      <div className="font-semibold text-gray-900">Active</div>
                      <div className="text-xs text-gray-500">Metro cities get 5-20% premium</div>
                    </div>
                  </div>

                  {skills && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="text-xs text-blue-600 mb-1">Skills Premium</div>
                      <div className="text-sm text-blue-800">
                        <strong>{skills}</strong> - In-demand skills can command 10-25% premium
                      </div>
                    </div>
                  )}
                </div>

                {/* Upsell Card */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h4 className="font-semibold text-indigo-900">Ready to optimize your career?</h4>
                      <p className="text-sm text-indigo-700 mt-1">
                        Get your resume optimized for ATS with our Resume Screener & Formatter tools. 
                        Stand out to recruiters and hiring managers.
                      </p>
                      <button className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-800">
                        Explore Resume Services →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 text-center border-b border-gray-100">
              <div className="text-3xl mb-2">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
              <p className="text-gray-600 mt-1">You've used your 2 free salary benchmark reports.</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 border-2 border-indigo-200 rounded-xl p-4 hover:border-indigo-400 transition-all bg-gradient-to-br from-indigo-50/50 to-white">
                  <h3 className="text-lg font-bold text-indigo-900 mb-1">Basic</h3>
                  <div className="text-2xl font-bold text-indigo-700">₹199</div>
                  <p className="text-xs text-gray-500 mb-3">one-time</p>
                  <ul className="text-xs text-gray-600 space-y-1 mb-4">
                    <li>✓ Single report</li>
                    <li>✓ Salary range analysis</li>
                    <li>✓ Recommendation</li>
                  </ul>
                  <button
                    onClick={() => handlePayment("salary_basic")}
                    disabled={paymentLoading}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    Pay ₹199
                  </button>
                </div>

                <div className="flex-1 border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400 transition-all relative">
                  <div className="absolute -top-2 right-4 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    POPULAR
                  </div>
                  <h3 className="text-lg font-bold text-purple-900 mb-1">Premium</h3>
                  <div className="text-2xl font-bold text-purple-700">₹499</div>
                  <p className="text-xs text-gray-500 mb-3">one-time</p>
                  <ul className="text-xs text-gray-600 space-y-1 mb-4">
                    <li>✓ 3 detailed reports</li>
                    <li>✓ Career growth roadmap</li>
                    <li>✓ Negotiation strategies</li>
                  </ul>
                  <button
                    onClick={() => handlePayment("salary_premium")}
                    disabled={paymentLoading}
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                  >
                    Pay ₹499
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 text-center border-t">
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

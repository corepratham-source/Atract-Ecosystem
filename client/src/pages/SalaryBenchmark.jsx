import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { getStoredUser } from "../components/ProtectedRoute";
import { API_BASE } from "../config/api";

const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Salary Benchmark Tool",
  valueProposition: "Is this salary fair?",
  pricing: "₹299 per report",
};

export default function SalaryBenchmarkTool({ app = defaultApp, isPro = false }) {
  useTrackAppUsage('salary-benchmark');
  
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [company, setCompany] = useState(""); // unused but kept for future
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    setUser(u);
    
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
    if (!role || !location || !experience) {
      setError("Please fill in role, location, and experience");
      return;
    }

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPaymentModal(true);
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/salary-benchmark/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, location, experience, salary: salary || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate report");
      setReport(data);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "salary_benchmark" }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.error?.includes("not configured")) {
          alert("Payment not configured. For demo: marking as paid.");
          setIsPaid(true);
          sessionStorage.setItem("salaryBenchmarkPaid", "true");
          setShowPaymentModal(false);
          updateTrialCount(0);
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
        name: "Atract Salary Benchmark",
        description: "Salary benchmark report",
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
              alert("Payment successful!");
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            setError("Could not verify payment");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: { name: user?.name || "Customer", email: user?.email || "customer@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => { setError("Payment failed"); setPaymentLoading(false); });
      rzp.open();
    } catch (err) { 
      setError(err.message || "Payment initiation failed"); 
    } finally { 
      setPaymentLoading(false); 
    }
  };

  const getVerdict = () => {
    if (!report || !report.salary) return null;
    const userSalary = parseInt(report.salary.replace(/[^0-9]/g, ""));
    const median = report.median || userSalary;
    const diff = ((userSalary - median) / median) * 100;
    if (diff < -10) return { text: "Below Market", color: "red", icon: "⚠️" };
    if (diff > 20) return { text: "Above Market", color: "green", icon: "🎉" };
    return { text: "At Market Rate", color: "blue", icon: "✅" };
  };

  const verdict = getVerdict();

  return (
    <CustomerMicroAppShell app={app}>
      <div className="max-w-5xl mx-auto">
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex-1 flex flex-col divide-y divide-slate-200">
            {/* Header moved to navbar (CustomerMicroAppShell) */}

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 sm:p-8">
                {/* Input Section */}
                <div className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                    <SectionTitle title="Job Details" description="Enter to get salary benchmarks" />

                    <div className="space-y-4">
                      <Field label="Role / Position">
                        <input
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. Senior Engineer"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="Location">
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. Bengaluru"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="Experience (years)">
                        <input
                          type="number"
                          min="0"
                          value={experience}
                          onChange={(e) => setExperience(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </Field>
                      <Field label="Current Salary (optional)">
                        <input
                          value={salary}
                          onChange={(e) => setSalary(e.target.value)}
                          placeholder="e.g. ₹15,00,000"
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </Field>

                      {!isPaid && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-indigo-900 text-sm">Free Trial Progress</span>
                            <span className="text-xs font-semibold text-indigo-700">{trialCount}/{MAX_FREE_TRIALS}</span>
                          </div>
                          <div className="h-2 bg-indigo-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all" 
                              style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }} 
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={generateReport}
                        disabled={isLoading || !role || !location || !experience}
                        className={`w-full py-3 rounded-xl font-semibold text-lg transition-all ${
                          role && location && experience && !isLoading
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? "Generating..." : "📊 Get Benchmark Report"}
                      </button>
                    </div>
                  </div>

                  {/* Output Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-4 text-lg">Salary Report</h3>
                    {!report ? (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-slate-500 text-sm">Enter job details to see salary benchmark</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {verdict && (
                          <div className={`p-4 rounded-xl border ${
                            verdict.color === "red" ? "bg-red-50 border-red-200" :
                            verdict.color === "green" ? "bg-green-50 border-green-200" :
                            "bg-blue-50 border-blue-200"
                          }`}>
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{verdict.icon}</span>
                              <div>
                                <div className="font-bold text-slate-900">{verdict.text}</div>
                                <div className="text-sm text-slate-600">
                                  {report.salary && `Your salary: ${report.salary}`}
                                  {report.median && ` | Market median: ₹${parseInt(report.median).toLocaleString()}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-xs text-slate-500 uppercase">Min</div>
                            <div className="text-lg font-bold text-slate-900">₹{parseInt(report.min || 0).toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-4">
                            <div className="text-xs text-slate-500 uppercase">Max</div>
                            <div className="text-lg font-bold text-slate-900">₹{parseInt(report.max || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6">
              <div className="text-3xl mb-4 text-center">🔒</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Free Trial Used</h2>
              <p className="text-gray-600 text-sm mb-6">Subscribe for unlimited salary reports.</p>
              <button 
                onClick={handlePayment} 
                disabled={paymentLoading} 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {paymentLoading ? "Processing..." : "Subscribe ₹299/report"}
              </button>
            </div>
            <div className="p-4 bg-gray-50 text-center border-t">
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerMicroAppShell>
  );
}
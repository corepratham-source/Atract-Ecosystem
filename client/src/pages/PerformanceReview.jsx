import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { API_BASE } from "../config/api";

const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Performance Review Generator",
  valueProposition: "AI-Generated Insightful Reviews",
  pricing: "₹299 per review",
  icon: "⭐"
};

export default function PerformanceReview({ app = defaultApp }) {
  useTrackAppUsage('performance-review');
  
  const [form, setForm] = useState({
    employeeName: "",
    role: "",
    ratingPeriod: "",
    performanceArea: "Technical Skills",
    strengths: "",
    areasToImprove: "",
    rating: "4",
    feedback: "",
  });
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("performanceReviewTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("performanceReviewPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("performanceReviewTrials", count.toString());
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

  const generateReview = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/performance-review/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate review");
      setOutput(data.review || data.output);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setOutput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (plan) => {
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
          sessionStorage.setItem("performanceReviewPaid", "true");
          setShowPaymentModal(false);
          updateTrialCount(0);
          generateReview();
        } else {
          setError(data.error || "Failed to create order");
        }
        return;
      }
      await loadRazorpayScript();
      if (!window.Razorpay) {
        setError("Payment script failed to load");
        return;
      }
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ATRact Performance Review Generator",
        description: plan === "basic" ? "Basic - Single Review" : "Premium - Multiple Reviews",
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
              sessionStorage.setItem("performanceReviewPaid", "true");
              setShowPaymentModal(false);
              updateTrialCount(0);
              generateReview();
              alert("Payment successful! Generating your review...");
            } else {
              setError("Payment verification failed");
            }
          } catch {
            setError("Could not verify payment");
          }
        },
        prefill: { name: "User", email: "user@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => {} },
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Payment failed");
    }
  };

  const handleGenerate = () => {
    if (!form.employeeName?.trim() || !form.role?.trim()) {
      setError("Employee name and role are required");
      return;
    }
    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPaymentModal(true);
    } else {
      generateReview();
    }
  };

  const downloadReview = () => {
    const element = document.createElement("a");
    const file = new Blob([output], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `performance-review-${form.employeeName}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getRatingLabel = (rating) => {
    const ratings = { "2": "Needs Improvement", "3": "Meets Expectations", "4": "Exceeds Expectations", "5": "Outstanding" };
    return ratings[rating] || "Meets Expectations";
  };

  return (
    <CustomerMicroAppShell app={app}>
      <div className="max-w-5xl mx-auto">
          <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex-1 flex flex-col divide-y divide-slate-200">
              {/* Header */}
              <div className="px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Performance Review Generator</h2>
                <p className="text-slate-600 mt-1">Create thoughtful, structured performance reviews.</p>
                {!isPaid && (
                  <p className="text-sm text-amber-600 mt-2 font-medium">Free trials remaining: {MAX_FREE_TRIALS - trialCount}/{MAX_FREE_TRIALS}</p>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
            {/* Input Section */}
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <SectionTitle title="Review Details" description="Provide performance information" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee Name">
                  <input
                    value={form.employeeName}
                    onChange={(e) => setForm({...form, employeeName: e.target.value})}
                    placeholder="e.g. Sarah Johnson"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </Field>
                <Field label="Job Role">
                  <input
                    value={form.role}
                    onChange={(e) => setForm({...form, role: e.target.value})}
                    placeholder="e.g. Senior Developer"
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </Field>
              </div>

              <Field label="Rating Period">
                <input
                  value={form.ratingPeriod}
                  onChange={(e) => setForm({...form, ratingPeriod: e.target.value})}
                  placeholder="e.g. Q4 2024"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </Field>

              <Field label="Performance Area">
                <select
                  value={form.performanceArea}
                  onChange={(e) => setForm({...form, performanceArea: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="Technical Skills">Technical Skills</option>
                  <option value="Communication">Communication</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Teamwork">Teamwork</option>
                  <option value="Time Management">Time Management</option>
                  <option value="Problem Solving">Problem Solving</option>
                </select>
              </Field>

              <Field label="Key Strengths">
                <textarea
                  value={form.strengths}
                  onChange={(e) => setForm({...form, strengths: e.target.value})}
                  placeholder="e.g. Strong coding skills, good collaboration..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </Field>

              <Field label="Areas for Improvement">
                <textarea
                  value={form.areasToImprove}
                  onChange={(e) => setForm({...form, areasToImprove: e.target.value})}
                  placeholder="e.g. Project prioritization, public speaking..."
                  rows="3"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                />
              </Field>

              <Field label="Overall Rating">
                <select
                  value={form.rating}
                  onChange={(e) => setForm({...form, rating: e.target.value})}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="2">Needs Improvement</option>
                  <option value="3">Meets Expectations</option>
                  <option value="4">Exceeds Expectations</option>
                  <option value="5">Outstanding</option>
                </select>
              </Field>

              {!isPaid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-emerald-900 text-sm">Free Trial Progress</span>
                    <span className="text-xs font-semibold text-emerald-700">{trialCount}/{MAX_FREE_TRIALS}</span>
                  </div>
                  <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
                      style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!form.employeeName || !form.role || isLoading}
                className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-lg transition-all ${
                  form.employeeName && form.role && !isLoading
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isLoading ? "Generating..." : "⭐ Generate Review"}
              </button>
            </div>

            {/* Output Section */}
            <div className="space-y-4">
              {!output ? (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-8 text-center border border-emerald-200 h-full flex flex-col justify-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Generated Review</h3>
                  <p className="text-slate-600">Fill details on the left and click Generate to create your professional performance review.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-6 border border-slate-200 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900">{form.employeeName}</h3>
                      <p className="text-sm text-slate-600">{getRatingLabel(form.rating)}</p>
                    </div>
                    <button
                      onClick={downloadReview}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap text-sm text-slate-700">
                    {output}
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Pricing Info */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 bg-slate-50 border-t border-slate-200 text-sm text-slate-600">
          Pricing: <span className="font-semibold text-slate-900">{app.pricing}</span>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 text-center border-b border-gray-200">
                <div className="text-3xl mb-2">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
                <p className="text-gray-600 mt-1">Upgrade to continue generating reviews.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="border-2 border-emerald-200 rounded-xl p-4 hover:border-emerald-400 transition-all">
                  <h3 className="text-lg font-bold text-emerald-900 mb-1">Basic</h3>
                  <div className="text-2xl font-bold text-emerald-700">₹199</div>
                  <button
                    onClick={() => handlePayment("review_basic")}
                    className="w-full mt-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700"
                  >
                    Upgrade Now
                  </button>
                </div>
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
    </CustomerMicroAppShell>
  );
}

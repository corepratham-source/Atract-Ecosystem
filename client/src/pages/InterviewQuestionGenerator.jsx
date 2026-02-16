import { useState, useEffect } from "react";
import SectionTitle from "../components/SectionTitle";
import Field from "../components/Field";
import LeftSidebar from "../components/LeftSidebar";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Interview Question Generator",
  valueProposition: "Role-based question generation for interviews",
  pricing: "₹199/month",
};

export default function InterviewQuestionGenerator({ app = defaultApp }) {
  // Track app usage
  useTrackAppUsage('interview-questions');
  
  const [role, setRole] = useState("");
  const [level, setLevel] = useState("Mid");
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [trialCount, setTrialCount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("interviewQuestionTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("interviewQuestionPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("interviewQuestionTrials", count.toString());
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
          alert("Payment gateway not configured. For demo: marking as paid.");
          setIsPaid(true);
          sessionStorage.setItem("interviewQuestionPaid", "true");
          setShowPayment(false);
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
        name: "ATRact Interview Questions",
        description: plan === "basic" ? "Basic - Unlimited Generations" : "Premium - Full Access",
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
              sessionStorage.setItem("interviewQuestionPaid", "true");
              setShowPayment(false);
              updateTrialCount(0);
              alert("Payment successful! You now have unlimited access.");
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

  const generate = async () => {
    const trimmedRole = role.trim();
    if (!trimmedRole) {
      setError("Please enter a role");
      return;
    }

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPayment(true);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/interview/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: trimmedRole, level }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate questions");
      }

      setQuestions(data.questions || []);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPaid} />

      <div className="flex-1 ml-80 flex">
        {/* LEFT – INPUT (fixed) */}
        <div className="w-1/2 h-screen overflow-hidden flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            <div className="bg-white border rounded-xl shadow-sm flex-1 flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">Dynamic Interview Questions</h2>
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

                <Field label="Role" helper="Type any job role">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setError(""); }}
                    placeholder="e.g. Software Engineer, Product Manager..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Seniority">
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option>Junior</option>
                      <option>Mid</option>
                      <option>Senior</option>
                    </select>
                  </Field>
                  <Field label="AI Model">
                    <select
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                      disabled
                    >
                      <option value="gemini">Gemini (Google)</option>
                    </select>
                  </Field>
                </div>

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

              <div className="p-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={generate}
                  disabled={isLoading || !role.trim()}
                  className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${
                    role.trim() && !isLoading
                      ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
                    "Generate questions"
                  )}
                </button>
                <div className="text-xs text-slate-500 mt-2">Pricing: {app.pricing}</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT – QUESTIONS (scrollable only) */}
        <div className="w-1/2 h-screen overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="bg-white border rounded-xl shadow-sm p-6">
              <SectionTitle
                title="Generated Questions"
                description="AI-generated questions for your role. Use as-is or customize."
              />

              <div className="mt-3 space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {questions.length === 0 ? (
                  <div className="text-sm text-slate-500 py-8">
                    {isLoading ? (
                      <span>Generating questions...</span>
                    ) : (
                      <>
                        Enter a role and click <span className="font-semibold">"Generate questions"</span> to get AI-powered interview questions.
                      </>
                    )}
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition-all duration-150 hover:bg-slate-100"
                    >
                      <div className="text-xs font-semibold text-slate-500 mt-0.5 shrink-0">{idx + 1}</div>
                      <div className="text-sm text-slate-800">{q}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Horizontal ₹99 & ₹499 */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden relative">
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
              <p className="text-gray-600 mt-1">You've used your 2 free generations. Unlock unlimited access.</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 border-2 border-indigo-200 rounded-xl p-6 hover:border-indigo-400 transition-all bg-gradient-to-br from-indigo-50/50 to-white">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Basic</h3>
                  <div className="text-3xl font-bold text-indigo-700 mb-1">₹99</div>
                  <p className="text-sm text-gray-500 mb-4">one-time</p>
                  <ul className="space-y-2 text-sm text-gray-700 mb-6">
                    <li>✓ Unlimited generations</li>
                    <li>✓ Gemini (Google) model</li>
                    <li>✓ Any role & seniority</li>
                  </ul>
                  <button
                    onClick={() => handlePayment("basic")}
                    disabled={paymentLoading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? "Processing..." : "Pay ₹99"}
                  </button>
                </div>

                <div className="flex-1 border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50 hover:border-purple-400 transition-all relative">
                  <div className="absolute -top-3 right-6 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    RECOMMENDED
                  </div>
                  <h3 className="text-xl font-bold text-purple-900 mb-2">Premium</h3>
                  <div className="text-3xl font-bold text-purple-700 mb-1">₹499</div>
                  <p className="text-sm text-gray-500 mb-4">one-time</p>
                  <ul className="space-y-2 text-sm text-gray-700 mb-6">
                    <li>✓ Everything in Basic</li>
                    <li>✓ Bulk / batch generation</li>
                    <li>✓ Export & save questions</li>
                  </ul>
                  <button
                    onClick={() => handlePayment("premium")}
                    disabled={paymentLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentLoading ? "Processing..." : "Pay ₹499"}
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
              <button onClick={() => setShowPayment(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

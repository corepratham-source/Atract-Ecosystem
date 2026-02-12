import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import LeftSidebar from "../components/LeftSidebar";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Candidate Follow-up Tracker",
  valueProposition: "Never forget candidate follow-ups",
  pricing: "₹299/month",
  audience: "Recruiters",
  monetization: "Low–Medium. CRM / ATS partnerships.",
};

export default function CandidateFollowUpTracker({ app = defaultApp, isPro = false }) {
  const [candidateName, setCandidateName] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState("Screening");
  const [nextDate, setNextDate] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [trialCount, setTrialCount] = useState(0);
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("followUpTrackerTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("followUpTrackerPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("followUpTrackerTrials", count.toString());
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
        body: JSON.stringify({ plan: "follow_up_tracker" }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error?.includes("not configured")) {
          alert("Payment not configured. For demo: marking as paid.");
          setIsPaid(true);
          sessionStorage.setItem("followUpTrackerPaid", "true");
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
        name: "ATRact Follow-up Tracker",
        description: "Monthly subscription - ₹299",
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
              sessionStorage.setItem("followUpTrackerPaid", "true");
              setShowPayment(false);
              updateTrialCount(0);
              alert("Payment successful! You now have unlimited access.");
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
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

  const addCandidate = () => {
    if (!candidateName?.trim() || !role?.trim() || !nextDate) {
      setError("Candidate name, role, and next follow-up date are required");
      return;
    }

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPayment(true);
      return;
    }

    setError("");
    setCandidates([
      ...candidates,
      {
        id: Date.now(),
        name: candidateName.trim(),
        role: role.trim(),
        stage,
        nextDate,
        done: false,
      },
    ]);
    setCandidateName("");
    setRole("");
    setStage("Screening");
    setNextDate("");
    if (!isPaid) updateTrialCount(trialCount + 1);
  };

  const toggleDone = (id) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  };

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = candidates.filter((c) => !c.done && c.nextDate < today).length;
  const todayCount = candidates.filter((c) => !c.done && c.nextDate === today).length;
  const canAdd = candidateName?.trim() && role?.trim() && nextDate;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPaid} />

      <style>{`
        /* Tiny scrollbar for all scrollable areas */
        ::-webkit-scrollbar {
          width: 4px !important;
          height: 4px !important;
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
              <h2 className="text-xl font-bold text-gray-900">Candidate Follow-up Tracker</h2>
              <p className="text-sm text-slate-500 mt-1">Never forget candidate follow-ups. For recruiters.</p>
              {/* {!isPaid && (
                <p className="text-sm text-amber-500 mt-1 font-medium">
                  Free trial: {trialCount}/{MAX_FREE_TRIALS} used
                </p>
              )} */}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <SectionTitle
                title="Create follow-ups"
                description="Add candidates with the next follow-up date. Keep your pipeline moving daily."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Candidate name">
                  <input
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Role">
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. Sales Executive"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
                <Field label="Stage">
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Screening</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>On hold</option>
                  </select>
                </Field>
                <Field label="Next follow-up date">
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </Field>
              </div>

              {!isPaid && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-amber-800">Free Trial {trialCount}/{MAX_FREE_TRIALS}</span>
                  </div>
                  <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                      style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={addCandidate}
                disabled={!canAdd}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  canAdd
                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-sm hover:shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Add to follow-up list
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">Pricing: {app.pricing}</p>
            </div>
          </div>
        </div>

        {/* RIGHT – CANDIDATE LIST (scrollable only) */}
        <div className="w-1/2 h-screen overflow-y-auto bg-gray-50">
          <div className="p-6">
            <SectionTitle
              title="Follow-up list"
              description="Today & overdue. Click to mark done."
            />

            <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-900">Today & overdue</div>
                  <div className="flex gap-2 text-xs">
                    <span className="rounded-full bg-rose-50 text-rose-700 px-2 py-1 border border-rose-100 font-medium">
                      Overdue: {overdueCount}
                    </span>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-1 border border-emerald-100 font-medium">
                      Today: {todayCount}
                    </span>
                  </div>
                </div>
              </div>

              <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-4 space-y-2">
                {candidates.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <div className="text-4xl mb-4">📋</div>
                    <p className="font-medium">Add candidates to see follow-ups</p>
                    <p className="text-sm mt-2">A simple daily list = fewer lost candidates.</p>
                  </div>
                ) : (
                  [...candidates]
                    .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
                    .map((c) => {
                      const isOverdue = !c.done && c.nextDate < today;
                      const isToday = !c.done && c.nextDate === today;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleDone(c.id)}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm flex items-start justify-between gap-2 transition-all ${
                            c.done
                              ? "bg-slate-50 border-slate-200 text-slate-400 line-through"
                              : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{c.name}</div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {c.role} • {c.stage}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              Next follow-up: {c.nextDate}
                            </div>
                          </div>
                          {!c.done && (isOverdue || isToday) && (
                            <span
                              className={`text-[11px] font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                                isOverdue
                                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                                  : "bg-amber-50 text-amber-700 border border-amber-100"
                              }`}
                            >
                              {isOverdue ? "Overdue" : "Today"}
                            </span>
                          )}
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - Subscription */}
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

            <div className="p-6">
              <div className="text-3xl mb-4 text-center">🔒</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Free Trial Used</h2>
              <p className="text-gray-600 text-sm mb-6">You've used your 1 free add. Subscribe for unlimited follow-ups.</p>

              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Monthly subscription</span>
                  <span className="text-2xl font-bold text-indigo-700">₹299/month</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">Unlimited candidate follow-ups</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => handlePayment("follow_up_tracker")}
                disabled={paymentLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? "Processing..." : "Subscribe ₹299/month"}
              </button>
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

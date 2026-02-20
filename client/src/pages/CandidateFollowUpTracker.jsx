import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { getStoredUser } from "../components/ProtectedRoute";
import { API_BASE } from "../config/api";

const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Candidate Follow-up Tracker",
  valueProposition: "Never forget candidate follow-ups",
  pricing: "₹299/month",
};

export default function CandidateFollowUpTracker({ app = defaultApp }) {
  useTrackAppUsage('candidate-followup-tracker');
  
  const [user, setUser] = useState(null);
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
    const u = getStoredUser();
    setUser(u);
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

  const handlePayment = async () => {
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
        name: "Atract Follow-up Tracker",
        description: "Monthly subscription",
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
        prefill: { 
          name: user?.name || "Customer", 
          email: user?.email || "customer@example.com", 
          contact: "9999999999" 
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed");
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
      setError("All fields required");
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
    <CustomerMicroAppShell app={app}>
      <div className="max-w-5xl mx-auto">
        {/* Main Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex-1 flex flex-col divide-y divide-slate-200">
            {/* Header moved to navbar (CustomerMicroAppShell) */}

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 sm:p-8 h-full">
                {/* Input Section - Left */}
                <div className="space-y-6">
                  <SectionTitle
                    title="Add Follow-up"
                    description="Create new candidate follow-up tasks"
                  />

                    {error && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="space-y-4">
                      <Field label="Candidate Name">
                        <input
                          value={candidateName}
                          onChange={(e) => setCandidateName(e.target.value)}
                          placeholder="e.g. Priya Sharma"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      </Field>

                      <Field label="Role">
                        <input
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. Sales Executive"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      </Field>

                      <Field label="Pipeline Stage">
                        <select
                          value={stage}
                          onChange={(e) => setStage(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        >
                          <option value="Screening">Screening</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="On hold">On hold</option>
                        </select>
                      </Field>

                      <Field label="Next Follow-up Date">
                        <input
                          type="date"
                          value={nextDate}
                          onChange={(e) => setNextDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      </Field>
                    </div>

                    {/* Trial Progress */}
                    {!isPaid && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-indigo-900 text-sm">Free Trial</span>
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
                      onClick={addCandidate}
                      disabled={!canAdd}
                      className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-lg transition-all ${
                        canAdd
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Add to Follow-ups
                    </button>
                  </div>

                  {/* Output Section - Right (scrollable) */}
                  <div
                    className="space-y-4  pr-2"
                    style={{ maxHeight: 'calc(110vh - 8rem)' }}
                  >
                    <SectionTitle
                      title="Follow-up Queue"
                      description="Track today's and overdue follow-ups"
                    />

                    {candidates.length === 0 ? (
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 text-center border border-indigo-200 h-full flex flex-col justify-center min-h-[400px]">
                        <div className="text-5xl mb-4">📋</div>
                        <h3 className="text-lg font-bold text-slate-900">No candidates added</h3>
                        <p className="text-slate-600 text-sm mt-2">Add candidates to see them here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {[...candidates]
                          .sort((a, b) => a.nextDate.localeCompare(b.nextDate))
                          .map((c) => {
                            const isOverdue = !c.done && c.nextDate < today;
                            const isToday = !c.done && c.nextDate === today;
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleDone(c.id)}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${
                                  c.done
                                    ? "bg-slate-50 border-slate-200"
                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className={`font-semibold ${c.done ? "line-through text-slate-400" : "text-slate-900"}`}>
                                      {c.name}
                                    </div>
                                    <div className="text-sm text-slate-600 mt-1">
                                      {c.role} • {c.stage}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-2">
                                      📅 {new Date(c.nextDate).toLocaleDateString("en-IN")}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                                      c.done
                                        ? "bg-green-500 border-green-500"
                                        : "border-slate-300"
                                    }`} />
                                    {!c.done && (isOverdue || isToday) && (
                                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        isOverdue
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                      }`}>
                                        {isOverdue ? "Overdue" : "Today"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer / Pricing */}
          <div className="mt-6 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 text-center">
            Pricing: <span className="font-semibold text-slate-900">{app?.pricing}</span>
          </div>
        </div>

        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
              <button
                onClick={() => setShowPayment(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6">
                <div className="text-3xl mb-4 text-center">🔒</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Free Trial Ended</h2>
                <p className="text-gray-600 text-sm mb-6">Subscribe for unlimited follow-ups and candidate management</p>

                <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                  <div className="text-2xl font-bold text-indigo-700">₹299<span className="text-sm">/month</span></div>
                  <p className="text-sm text-slate-600 mt-2">Unlimited candidates • Unlimited follow-ups</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {paymentLoading ? "Processing..." : "Subscribe Now"}
                </button>
              </div>

              <div className="p-4 bg-gray-50 text-center border-t">
                <button 
                  onClick={() => setShowPayment(false)} 
                  className="text-gray-500 hover:text-gray-700 font-medium text-sm"
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
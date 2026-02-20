import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { API_BASE } from "../config/api";

const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Offer Letter Generator",
  valueProposition: "AI-Powered Professional Offer Letters",
  pricing: "₹199 per letter",
};

export default function OfferLetterGenerator({ app = defaultApp, isPro = false }) {
  useTrackAppUsage('offer-letter');
  
  const [form, setForm] = useState({
    company: "",
    candidate: "",
    role: "",
    startDate: "",
    salary: "",
    location: "",
    department: "",
    managerName: "",
    workMode: "Hybrid",
  });
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("offerLetterTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("offerLetterPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("offerLetterTrials", count.toString());
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

  const generateLetter = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/offer-letter/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate letter");
      setOutput(data.letter || data.output || "");
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
          sessionStorage.setItem("offerLetterPaid", "true");
          setShowPaymentModal(false);
          updateTrialCount(0);
          generateLetter();
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
        name: "Atract Offer Letter Generator",
        description: "Professional Offer Letter",
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
              sessionStorage.setItem("offerLetterPaid", "true");
              setShowPaymentModal(false);
              updateTrialCount(0);
              generateLetter();
              alert("Payment successful! Generating your letter...");
            } else {
              setError("Payment verification failed");
            }
          } catch {
            setError("Could not verify payment");
          }
        },
        prefill: { name: "User", email: "user@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => setShowPaymentModal(false) },
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
    if (!form.company?.trim() || !form.candidate?.trim() || !form.role?.trim()) {
      setError("Company, Candidate name, and Role are required");
      return;
    }
    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPaymentModal(true);
    } else {
      generateLetter();
    }
  };

  const downloadLetter = () => {
    if (!output) return;
    const element = document.createElement("a");
    const file = new Blob([output], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `offer-letter-${form.candidate.replace(/\s+/g, "-")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <CustomerMicroAppShell app={app}>
      <div className="max-w-5xl mx-auto">
        {/* Main Card */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex-1 flex flex-col divide-y divide-slate-200">
            {/* Header */}
            <div className="px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Offer Letter Generator</h2>
                <p className="text-slate-600 mt-1">Create professional offer letters in seconds.</p>
                {!isPaid && (
                  <p className="text-sm text-amber-600 mt-2 font-medium">
                    Free trials remaining: {MAX_FREE_TRIALS - trialCount}/{MAX_FREE_TRIALS}
                  </p>
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

                    {/* Header moved to navbar (MicroAppRightLayout) */}

                    <Field label="Company">
                      <input
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Acme Corp"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </Field>

                    <Field label="Candidate Name">
                      <input
                        value={form.candidate}
                        onChange={(e) => setForm({ ...form, candidate: e.target.value })}
                        placeholder="e.g. John Doe"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </Field>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Job Role">
                        <input
                          value={form.role}
                          onChange={(e) => setForm({ ...form, role: e.target.value })}
                          placeholder="e.g. Senior Developer"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </Field>
                      <Field label="Department">
                        <input
                          value={form.department}
                          onChange={(e) => setForm({ ...form, department: e.target.value })}
                          placeholder="e.g. Engineering"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Start Date">
                        <input
                          type="date"
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </Field>
                      <Field label="Location">
                        <input
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          placeholder="e.g. Bengaluru"
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </Field>
                    </div>

                    <Field label="Monthly Salary (₹)">
                      <input
                        type="number"
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                        placeholder="e.g. 500000"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </Field>

                    <Field label="Manager Name">
                      <input
                        value={form.managerName}
                        onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                        placeholder="e.g. Jane Smith"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      />
                    </Field>

                    <Field label="Work Mode">
                      <select
                        value={form.workMode}
                        onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      >
                        <option value="On-site">On-site</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </Field>

                    {!isPaid && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-purple-900 text-sm">Free Trial Progress</span>
                          <span className="text-xs font-semibold text-purple-700">{trialCount}/{MAX_FREE_TRIALS}</span>
                        </div>
                        <div className="h-2 bg-purple-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all"
                            style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={!form.company?.trim() || !form.candidate?.trim() || !form.role?.trim() || isLoading}
                      className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-lg transition-all ${
                        form.company?.trim() && form.candidate?.trim() && form.role?.trim() && !isLoading
                          ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md hover:shadow-lg"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? "Generating..." : "✍️ Generate Letter"}
                    </button>
                  </div>

                  {/* Output Section */}
                  <div className="space-y-4">
                    {!output ? (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 text-center border border-purple-200 h-full flex flex-col justify-center min-h-[400px]">
                        <div className="text-5xl mb-4">📄</div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Generated Letter</h3>
                        <p className="text-slate-600">Fill details on the left and click Generate to create your professional offer letter.</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-6 border border-slate-200 h-full flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-slate-900">Offer Letter Preview</h3>
                          <button
                            onClick={downloadLetter}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all"
                          >
                            ⬇️ Download
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-xl border border-slate-200 whitespace-pre-wrap text-sm leading-relaxed font-mono text-slate-700">
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
          <div className="mt-6 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 text-center">
            Pricing: <span className="font-semibold text-slate-900">{app.pricing}</span>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="p-6 text-center border-b border-gray-200">
                <div className="text-3xl mb-2">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
                <p className="text-gray-600 mt-1">Upgrade to continue generating offer letters.</p>
              </div>

              <div className="p-6 space-y-4">
                <div className="border-2 border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-all">
                  <h3 className="text-lg font-bold text-purple-900 mb-1">Basic Plan</h3>
                  <div className="text-2xl font-bold text-purple-700">₹99 per letter</div>
                  <button
                    onClick={() => handlePayment("letter_basic")}
                    className="w-full mt-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                  >
                    Upgrade Now
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 text-center border-t">
                <button
                  onClick={() => setShowPaymentModal(false)}
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
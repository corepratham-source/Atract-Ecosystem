import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import LeftSidebar from "../components/LeftSidebar";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Offer Letter Generator",
  valueProposition: "AI-Powered Professional Offer Letters",
  pricing: "₹199 per letter",
};

export default function OfferLetterGenerator({ app = defaultApp }) {
  const [form, setForm] = useState({
    company: "",
    candidate: "",
    role: "",
    startDate: "",
    salary: "",
    location: "",
    department: "",
    managerName: "",
    managerTitle: "HR Manager",
    benefits: "",
    workMode: "Hybrid",
    probationPeriod: "3 months",
    workingHours: "9:00 AM - 6:00 PM",
    leavePolicy: "As per company policy",
    noticePeriod: "15 days",
  });
  const [output, setOutput] = useState("");
  const [generated, setGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate offer letter");
      }

      setOutput(data.letter || "");
      setGenerated(true);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
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
          sessionStorage.setItem("offerLetterPaid", "true");
          setShowPaymentModal(false);
          generateLetter();
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
        name: "ATRact Offer Letter",
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
              sessionStorage.setItem("offerLetterPaid", "true");
              setShowPaymentModal(false);
              updateTrialCount(0);
              generateLetter();
              alert("Payment successful! Generating your offer letter...");
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
    const requiredFields = form.role?.trim() && form.company?.trim() && form.candidate?.trim();
    if (!requiredFields) {
      setError("Company, Candidate, and Role are required");
      return;
    }
    setError("");

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPaymentModal(true);
    } else {
      generateLetter();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert("Offer letter copied to clipboard!");
  };

  const downloadAsText = () => {
    const element = document.createElement("a");
    element.href = URL.createObjectURL(new Blob([output], { type: "text/plain" }));
    element.download = `Offer_Letter_${form.candidate.replace(/\s+/g, "_")}_${form.role.replace(/\s+/g, "_")}.txt`;
    element.click();
    URL.revokeObjectURL(element.href);
  };

  const canGenerate = form.role?.trim() && form.company?.trim() && form.candidate?.trim();

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
              <h2 className="text-xl font-bold text-gray-900">Offer Letter Details</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the details to generate a professional offer letter</p>
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

              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name">
                  <input
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ATRact Pvt Ltd"
                  />
                </Field>
                <Field label="Candidate Name">
                  <input
                    value={form.candidate}
                    onChange={(e) => setForm({ ...form, candidate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Role / Position">
                  <input
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Software Engineer"
                  />
                </Field>
                <Field label="Department">
                  <input
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Engineering"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Start Date">
                  <input
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="15 January 2026"
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Bengaluru, Karnataka"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Salary (₹)">
                  <input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="75000"
                  />
                </Field>
                <Field label="HR/Manager Name">
                  <input
                    value={form.managerName}
                    onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Priya Sharma"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Work Mode">
                  <select
                    value={form.workMode}
                    onChange={(e) => setForm({ ...form, workMode: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Office</option>
                    <option>Remote</option>
                    <option>Hybrid</option>
                  </select>
                </Field>
                <Field label="Probation Period">
                  <select
                    value={form.probationPeriod}
                    onChange={(e) => setForm({ ...form, probationPeriod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>1 month</option>
                    <option>2 months</option>
                    <option>3 months</option>
                    <option>6 months</option>
                  </select>
                </Field>
              </div>

              <Field label="Benefits">
                <textarea
                  value={form.benefits}
                  onChange={(e) => setForm({ ...form, benefits: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Health insurance, PF, Gratuity, Leave Travel Allowance, etc."
                  rows={2}
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
                  "Generate Offer Letter"
                )}
              </button>
              <p className="text-xs text-slate-500 mt-2 text-center">Pricing: ₹199 per letter after free trials</p>
            </div>
          </div>
        </div>

        {/* RIGHT – LETTER (scrollable only) */}
        <div className="w-1/2 h-screen overflow-y-auto bg-gray-50">
          <div className="p-6">
            <SectionTitle
              title="Generated Offer Letter"
              description={generated ? "Copy or download your offer letter" : "Fill details and generate to preview"}
            />

            {!generated && (
              <div className="mt-12 text-center text-gray-500">
                <div className="text-5xl mb-4">📝</div>
                <p className="font-medium">Fill in the details on the left</p>
                <p className="text-sm mt-2">Click "Generate Offer Letter" to create your letter</p>
                <p className="text-xs mt-1 text-amber-500">{MAX_FREE_TRIALS - trialCount} free trials remaining</p>
              </div>
            )}

            {generated && (
              <>
                {/* A4 Size Offer Letter */}
                <div className="mt-4 max-w-[210mm] mx-auto">
                  {/* A4 Paper Container */}
                  <div className="bg-white min-h-[297mm] shadow-2xl overflow-hidden relative">
                    {/* Letter Header */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 text-white">
                      <div className="flex items-center justify-between border-b border-slate-600 pb-4">
                        <div>
                          <h3 className="text-3xl font-bold font-serif tracking-wide">OFFER LETTER</h3>
                          <p className="text-slate-300 text-sm mt-1">Official Employment Offer</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">Date</p>
                          <p className="text-lg font-medium">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).replace(/ /g, " ")}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Letter Body */}
                    <div className="px-8 py-6">
                      <div className="space-y-4 text-[11pt] text-slate-800 font-serif leading-relaxed">
                        {output.split('\n').filter(line => line.trim()).map((line, idx) => {
                          // Check if line is a header (all caps or contains colon)
                          if (line.toUpperCase() === line && line.length > 3 && line.length < 60) {
                            return (
                              <h4 key={idx} className="text-sm font-bold text-slate-900 mt-6 mb-2 border-b-2 border-slate-800 pb-1 uppercase tracking-wide">
                                {line}
                              </h4>
                            );
                          }
                          // Check if line contains a label/value pair
                          if (line.includes(':')) {
                            const [label, ...valueParts] = line.split(':');
                            const value = valueParts.join(':').trim();
                            return (
                              <div key={idx} className="flex gap-2 py-1">
                                <span className="font-semibold text-slate-700 min-w-[120px] shrink-0">{label.trim()}:</span>
                                <span className="text-slate-800 flex-1">{value}</span>
                              </div>
                            );
                          }
                          // Regular paragraph
                          return <p key={idx} className="text-slate-800 text-justify">{line}</p>;
                        })}
                      </div>
                      
                      {/* Signature Section */}
                      <div className="mt-12 pt-6">
                        <div className="flex justify-between items-end gap-8">
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 mb-6">Yours sincerely,</p>
                            <div className="h-px bg-slate-400 mb-2 w-full max-w-[180px]"></div>
                            <p className="text-sm font-bold text-slate-900">{form.managerName || "HR Manager"}</p>
                            <p className="text-xs text-slate-600">{form.company || "Company Name"}</p>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-slate-600 mb-6">Accepted by,</p>
                            <div className="h-px bg-slate-400 mb-2 w-full max-w-[180px]"></div>
                            <p className="text-sm font-bold text-slate-900">{form.candidate || "Candidate Name"}</p>
                            <p className="text-xs text-slate-600">Date: _________________</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Letter Footer */}
                    <div className="absolute bottom-0 left-0 right-0 bg-slate-100 px-8 py-3 border-t border-slate-300">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <p>{form.company || "Company Name"} • {form.location || "Location"}</p>
                        <p className="font-medium uppercase tracking-wider">Confidential Document</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 max-w-[210mm] mx-auto">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </button>
                  <button
                    onClick={downloadAsText}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </>
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
              <p className="text-gray-600 mt-1">You've used your 2 free offer letter generations.</p>
            </div>

            <div className="p-6">
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">One Offer Letter</span>
                  <span className="text-2xl font-bold text-indigo-700">₹199</span>
                </div>
              </div>

              <button
                onClick={() => handlePayment("offer_letter")}
                disabled={paymentLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {paymentLoading ? "Processing..." : "Pay ₹199 & Generate"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 text-center border-t">
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

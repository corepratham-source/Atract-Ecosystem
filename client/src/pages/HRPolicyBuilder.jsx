import { useState, useEffect } from "react";
import Field from "../components/Field";
import SectionTitle from "../components/SectionTitle";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "HR Policy Builder",
  valueProposition: "Professional HR policies auto-drafted",
  pricing: "₹999 one-time",
};

const policyTypes = [
  { id: "leave", name: "Leave Policy", icon: "🏖️", desc: "Comprehensive leave management" },
  { id: "workfromhome", name: "Work from Home Policy", icon: "🏠", desc: "Remote work guidelines" },
  { id: "codeofconduct", name: "Code of Conduct", icon: "📋", desc: "Employee behavior standards" },
  { id: "recruitment", name: "Recruitment Policy", icon: "👥", desc: "Hiring procedures" },
  { id: "performance", name: "Performance Review Policy", icon: "📊", desc: "Appraisal guidelines" },
  { id: "disciplinary", name: "Disciplinary Policy", icon: "⚖️", desc: "Misconduct procedures" },
  { id: "confidentiality", name: "Confidentiality Policy", icon: "🔒", desc: "Data protection" },
  { id: "grievance", name: "Grievance Redressal Policy", icon: "📢", desc: "Complaint resolution" },
];

const companySizes = [
  { id: "1-20", name: "1-20 employees (Startup)", multiplier: 0.8 },
  { id: "21-100", name: "21-100 employees (SMB)", multiplier: 0.9 },
  { id: "101-500", name: "101-500 employees (Mid-size)", multiplier: 1.0 },
  { id: "500+", name: "500+ employees (Enterprise)", multiplier: 1.2 },
];

const tones = [
  { id: "formal", name: "Formal", desc: "Professional and authoritative", style: "formal" },
  { id: "neutral", name: "Neutral", desc: "Balanced and objective", style: "neutral" },
  { id: "warm", name: "Warm", desc: "Friendly and approachable", style: "friendly" },
];

export default function HRPolicyBuilder({ app = defaultApp }) {
  // Track app usage
  useTrackAppUsage('policy-builder');
  
  const [form, setForm] = useState({
    companyName: "",
    companyType: "Private Limited",
    policyType: "leave",
    companySize: "1-20",
    tone: "formal",
    industry: "Technology",
    location: "India",
    employeeCount: "",
    hrContact: "",
    hrName: "",
    effectiveDate: "",
    customClauses: "",
  });
  const [generated, setGenerated] = useState(false);
  const [output, setOutput] = useState("");
  const [paymentModal, setPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("hrPolicyTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("hrPolicyPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("hrPolicyTrials", count.toString());
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

  const generatePolicy = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/policy-builder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setOutput(data.policy);
      setGenerated(true);
      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (plan) => {
    setIsLoading(true);
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
          sessionStorage.setItem("hrPolicyPaid", "true");
          setPaymentModal(false);
          updateTrialCount(0);
          generatePolicy();
        } else {
          setError(data.error || "Failed to create order");
        }
        setIsLoading(false);
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        setError("Payment script failed to load");
        setIsLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ATRact HR Policy Builder",
        description: plan === "basic" ? "Single Policy" : "All Policies Bundle",
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
              sessionStorage.setItem("hrPolicyPaid", "true");
              setPaymentModal(false);
              updateTrialCount(0);
              generatePolicy();
              alert("Payment successful! Generating your policy...");
            } else {
              setError("Payment verification failed");
            }
          } catch {
            setError("Could not verify payment");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: { name: "Customer", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => setIsLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.");
        setIsLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Payment failed");
      setIsLoading(false);
    }
  };

  const handleGenerate = () => {
    if (!form.companyName?.trim() || !form.policyType) {
      setError("Company Name and Policy Type are required");
      return;
    }
    setError("");

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setPaymentModal(true);
    } else {
      generatePolicy();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    alert("Policy document copied to clipboard!");
  };

  const downloadAsText = () => {
    const element = document.createElement("a");
    const file = new Blob([output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${form.companyName.replace(/\s+/g, "_")}_${policyTypes.find(p => p.id === form.policyType)?.name.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const selectedPolicy = policyTypes.find(p => p.id === form.policyType);

  return (
    <CustomerMicroAppShell app={app}>
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">HR Policy Builder</h1>
            <p className="text-sm text-gray-500">Professional HR policies auto-drafted with legal compliance</p>
          </div>
          {!isPaid && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              <span className="text-sm text-amber-700 font-medium">Free Trials: {trialCount}/{MAX_FREE_TRIALS}</span>
            </div>
          )}
        </div>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Input Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <SectionTitle
                  title="Company & Policy Details"
                  description="Fill in the details to generate a comprehensive HR policy document"
                />

                <div className="mt-4 space-y-4">
                  {/* Company Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company Name *">
                      <input
                        value={form.companyName}
                        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="ATRact Pvt Ltd"
                      />
                    </Field>
                    <Field label="Company Type">
                      <select
                        value={form.companyType}
                        onChange={(e) => setForm({ ...form, companyType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option>Private Limited</option>
                        <option>Public Limited</option>
                        <option>Partnership</option>
                        <option>Sole Proprietorship</option>
                        <option>LLP</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Policy Type *">
                      <select
                        value={form.policyType}
                        onChange={(e) => setForm({ ...form, policyType: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {policyTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Company Size">
                      <select
                        value={form.companySize}
                        onChange={(e) => setForm({ ...form, companySize: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {companySizes.map(size => (
                          <option key={size.id} value={size.id}>{size.name}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Industry">
                      <input
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus-ring-2 focus:ring-indigo-500"
                        placeholder="Technology, Healthcare, etc."
                      />
                    </Field>
                    <Field label="Location">
                      <input
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="India, USA, etc."
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="HR Manager Name">
                      <input
                        value={form.hrName}
                        onChange={(e) => setForm({ ...form, hrName: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Priya Sharma"
                      />
                    </Field>
                    <Field label="HR Contact Email">
                      <input
                        value={form.hrContact}
                        onChange={(e) => setForm({ ...form, hrContact: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="hr@company.com"
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Effective Date">
                      <input
                        type="date"
                        value={form.effectiveDate}
                        onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </Field>
                    <Field label="Tone">
                      <select
                        value={form.tone}
                        onChange={(e) => setForm({ ...form, tone: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {tones.map(tone => (
                          <option key={tone.id} value={tone.id}>{tone.name} - {tone.desc}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Custom Clauses (optional)">
                    <textarea
                      value={form.customClauses}
                      onChange={(e) => setForm({ ...form, customClauses: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Any specific clauses you want to include..."
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

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                      !isLoading
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
                        Generating with Groq...
                      </span>
                    ) : (
                      "Generate Policy Document"
                    )}
                  </button>

                  <p className="text-xs text-center text-gray-500">
                    Pricing: ₹999 per policy | {MAX_FREE_TRIALS - trialCount} free trials remaining
                  </p>
                </div>
              </div>

              {/* Output Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <SectionTitle
                  title="Generated Policy Document"
                  description={generated ? "Review, copy or download your policy" : "Fill details and generate to preview"}
                />

                {!generated && (
                  <div className="mt-12 text-center text-gray-500">
                    <div className="text-5xl mb-4">{selectedPolicy?.icon || "📄"}</div>
                    <p className="font-medium">{selectedPolicy?.name}</p>
                    <p className="text-sm mt-2">{selectedPolicy?.desc}</p>
                    <p className="text-sm mt-4">Fill in the company details and click Generate</p>
                  </div>
                )}

                {generated && (
                  <>
                    <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 max-h-[500px] overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-serif leading-relaxed">
{output}
                      </pre>
                    </div>

                    <div className="flex gap-3 mt-4">
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
        </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
            <button
              onClick={() => setPaymentModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 text-center border-b border-gray-100">
              <div className="text-3xl mb-2">🔒</div>
              <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
              <p className="text-gray-600 mt-1">You've used your 2 free policy generations.</p>
            </div>

            <div className="p-6">
              <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{selectedPolicy?.name}</p>
                    <p className="text-sm text-gray-500">{form.companyName || "Your Company"}</p>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">₹999</p>
                </div>
              </div>

              <button
                onClick={() => handlePayment("hr_policy")}
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Pay ₹999 & Generate"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 text-center border-t">
              <button onClick={() => setPaymentModal(false)} className="text-gray-500 hover:text-gray-700 font-medium text-sm">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerMicroAppShell>
  );
}

// import { useState, useEffect } from "react";
// import Field from "../components/Field";
// import SectionTitle from "../components/SectionTitle";
// import LeftSidebar from "../components/LeftSidebar";
// import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
// import { API_BASE } from "../config/api";

// const MAX_FREE_TRIALS = 2;

// const defaultApp = {
//   name: "Performance Review Generator",
//   valueProposition: "AI-Generated Insightful Reviews",
//   pricing: "₹299 per review",
//   icon: "⭐"
// };

// export default function PerformanceReview({ app = defaultApp }) {
//   useTrackAppUsage('performance-review');

//   const [form, setForm] = useState({
//     employeeName: "",
//     role: "",
//     ratingPeriod: "",
//     performanceArea: "Technical Skills",
//     strengths: "",
//     areasToImprove: "",
//     rating: "4",
//     feedback: "",
//   });
//   const [output, setOutput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [showPaymentModal, setShowPaymentModal] = useState(false);
//   const [trialCount, setTrialCount] = useState(0);
//   const [isPaid, setIsPaid] = useState(false);
//   const [paymentLoading, setPaymentLoading] = useState(false);
//   const [activeTab, setActiveTab] = useState("input"); // 'input' or 'results'

//   useEffect(() => {
//     const stored = sessionStorage.getItem("performanceReviewTrials");
//     if (stored !== null) setTrialCount(parseInt(stored, 10));
//     const paid = sessionStorage.getItem("performanceReviewPaid") === "true";
//     setIsPaid(paid);
//   }, []);

//   const updateTrialCount = (count) => {
//     setTrialCount(count);
//     sessionStorage.setItem("performanceReviewTrials", count.toString());
//   };

//   const loadRazorpayScript = () => {
//     return new Promise((resolve) => {
//       if (window.Razorpay) {
//         resolve();
//         return;
//       }
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve();
//       script.onerror = () => resolve(false);
//       document.body.appendChild(script);
//     });
//   };

//   const generateReview = async () => {
//     setIsLoading(true);
//     setError("");
//     try {
//       const res = await fetch(`${API_BASE}/api/performance-review/generate`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(form),
//       });
//       const data = await res.json();
//       console.log("Review response:", data);
//       if (!res.ok) throw new Error(data.error || "Failed to generate review");

//       if (data.review || data.output) {
//         setOutput(data.review || data.output);
//       } else if (data.overallTone) {
//         const formatted = formatReviewAsText(data, form);
//         setOutput(formatted);
//       } else {
//         setOutput(JSON.stringify(data, null, 2));
//       }

//       setActiveTab("results");

//       if (!isPaid) updateTrialCount(trialCount + 1);
//     } catch (err) {
//       console.error("Generate review error:", err);
//       setError(err.message || "Something went wrong");
//       setOutput("");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const formatReviewAsText = (data, form) => {
//     return `PERFORMANCE REVIEW\n========================\n\nEmployee: ${form.employeeName || 'N/A'}\nRole: ${form.role || 'N/A'}\nPeriod: ${form.ratingPeriod || 'N/A'}\nPerformance Area: ${form.performanceArea || 'N/A'}\nRating: ${form.rating || 'N/A'}/5\n\nOVERALL ASSESSMENT\n------------------------\nOverall Tone: ${data.overallTone || 'N/A'}\nEstimated Rating: ${data.estimatedRating || 'N/A'}/5\n\nKEY STRENGTHS\n------------------------\n${form.strengths || 'No specific strengths mentioned'}\n\nAREAS FOR DEVELOPMENT\n------------------------\n${form.areasToImprove || 'No specific areas mentioned'}\n\nSUGGESTED SUMMARY\n------------------------\n${Array.isArray(data.suggestedSummary) ? data.suggestedSummary.join('\n') : data.suggestedSummary}\n\nNEXT STEPS\n------------------------\n${Array.isArray(data.nextSteps) ? data.nextSteps.map(ns => `• [${ns.type}] ${ns.action}`).join('\n') : 'N/A'}\n\nELIGIBILITY\n------------------------\nPromotion Eligible: ${data.promotionEligible ? 'Yes' : 'Not at this time'}\nBonus Eligible: ${data.bonusEligible ? 'Yes' : 'Not at this time'}\n\nGenerated: ${data.generatedAt || new Date().toLocaleString()}`;
//   };

//   const handlePayment = async (plan) => {
//     setError("");
//     try {
//       const res = await fetch(`${API_BASE}/api/payment/create-order`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ plan }),
//       });
//       const data = await res.json();
//       if (!res.ok || data.error) {
//         if (data.error?.includes("not configured")) {
//           alert("Payment not configured. For demo: marking as paid.");
//           setIsPaid(true);
//           sessionStorage.setItem("performanceReviewPaid", "true");
//           setShowPaymentModal(false);
//           updateTrialCount(0);
//           generateReview();
//         } else {
//           setError(data.error || "Failed to create order");
//         }
//         setPaymentLoading(false);
//         return;
//       }
//       await loadRazorpayScript();
//       if (!window.Razorpay) {
//         setError("Payment script failed to load");
//         setPaymentLoading(false);
//         return;
//       }
//       const options = {
//         key: data.keyId,
//         amount: data.amount,
//         currency: data.currency,
//         name: "ATRact Performance Review Generator",
//         description: plan === "basic" ? "Basic - Single Review" : "Premium - Multiple Reviews",
//         order_id: data.orderId,
//         handler: async (response) => {
//           try {
//             const verifyRes = await fetch(`${API_BASE}/api/payment/verify`, {
//               method: "POST",
//               headers: { "Content-Type": "application/json" },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//             });
//             const verifyData = await verifyRes.json();
//             if (verifyData.success) {
//               setIsPaid(true);
//               sessionStorage.setItem("performanceReviewPaid", "true");
//               setShowPaymentModal(false);
//               updateTrialCount(0);
//               generateReview();
//               alert("Payment successful! Generating your review...");
//             } else {
//               setError("Payment verification failed");
//             }
//           } catch {
//             setError("Could not verify payment");
//           }
//         },
//         prefill: { name: "User", email: "user@example.com", contact: "9999999999" },
//         theme: { color: "#4F46E5" },
//         modal: { ondismiss: () => {} },
//       };
//       const rzp = new window.Razorpay(options);
//       rzp.on("payment.failed", () => {
//         setError("Payment failed. Please try again.");
//       });
//       rzp.open();
//     } catch (err) {
//       setError(err.message || "Payment failed");
//     } finally {
//       setPaymentLoading(false);
//     }
//   };

//   const handleGenerate = () => {
//     if (!form.employeeName?.trim() || !form.role?.trim()) {
//       setError("Employee name and role are required");
//       return;
//     }
//     if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
//       setShowPaymentModal(true);
//     } else {
//       generateReview();
//     }
//   };

//   const downloadReview = () => {
//     const element = document.createElement("a");
//     const file = new Blob([output], { type: "text/plain" });
//     element.href = URL.createObjectURL(file);
//     element.download = `performance-review-${form.employeeName || 'review'}.txt`;
//     document.body.appendChild(element);
//     element.click();
//     document.body.removeChild(element);
//   };

//   const getRatingLabel = (rating) => {
//     const ratings = { "2": "Needs Improvement", "3": "Meets Expectations", "4": "Exceeds Expectations", "5": "Outstanding" };
//     return ratings[rating] || "Meets Expectations";
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       {/* Sidebar */}
//       <LeftSidebar app={app} isPro={isPaid} backTo="/customer" />

//       {/* Main Content Area */}
//       <div className="flex-1 ml-80 min-h-screen flex flex-col">
//         {/* Sticky Header */}
//         <div className="flex-shrink-0 sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
//           <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
//             <div className="min-w-0">
//               <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{app.name}</h1>
//               {app.valueProposition && (
//                 <p className="text-xs text-gray-500 truncate hidden sm:block">{app.valueProposition}</p>
//               )}
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="text-2xl" role="img" aria-label={app.name}>
//                 {app.icon || '⭐'}
//               </span>
//               {isPaid && (
//                 <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
//                   Pro
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-2 px-6 pt-4 overflow-x-auto pb-2">
//           <button
//             onClick={() => setActiveTab("input")}
//             className={`px-3 lg:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
//               activeTab === "input"
//                 ? "bg-emerald-500 text-white"
//                 : "bg-white text-gray-600 hover:bg-gray-50"
//             }`}
//           >
//             📝 Create Review
//           </button>
//           <button
//             onClick={() => setActiveTab("results")}
//             className={`px-3 lg:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
//               activeTab === "results"
//                 ? "bg-emerald-500 text-white"
//                 : "bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
//             }`}
//             disabled={!output}
//           >
//             📄 Results {output ? "" : "(0)"}
//           </button>
//         </div>

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto">
//           <div className="max-w-5xl mx-auto p-6">
//             <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
//               <div className="flex-1 flex flex-col divide-y divide-slate-200">
//                 {/* Card Header */}
//                 <div className="px-6 py-4 sm:px-8 sm:py-6 bg-gradient-to-r from-emerald-50 to-teal-50">
//                   <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Performance Review Generator</h2>
//                   <p className="text-slate-600 mt-1">Create thoughtful, structured performance reviews.</p>
//                   {!isPaid && (
//                     <p className="text-sm text-amber-600 mt-2 font-medium">Free trials remaining: {MAX_FREE_TRIALS - trialCount}/{MAX_FREE_TRIALS}</p>
//                   )}
//                 </div>

//                 {/* Card Content */}
//                 <div className="flex-1 overflow-y-auto">
//                   <>
//                     {activeTab === "input" && (
//                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 sm:p-8">
//                         {/* Input Section */}
//                         <div className="space-y-6">
//                           {error && (
//                             <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
//                               {error}
//                             </div>
//                           )}

//                           <SectionTitle title="Review Details" description="Provide performance information" />

//                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                             <Field label="Employee Name">
//                               <input
//                                 value={form.employeeName}
//                                 onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
//                                 placeholder="e.g. Sarah Johnson"
//                                 className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                               />
//                             </Field>
//                             <Field label="Job Role">
//                               <input
//                                 value={form.role}
//                                 onChange={(e) => setForm({ ...form, role: e.target.value })}
//                                 placeholder="e.g. Senior Developer"
//                                 className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                               />
//                             </Field>
//                           </div>

//                           <Field label="Rating Period">
//                             <input
//                               value={form.ratingPeriod}
//                               onChange={(e) => setForm({ ...form, ratingPeriod: e.target.value })}
//                               placeholder="e.g. Q4 2024"
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             />
//                           </Field>

//                           <Field label="Performance Area">
//                             <select
//                               value={form.performanceArea}
//                               onChange={(e) => setForm({ ...form, performanceArea: e.target.value })}
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             >
//                               <option value="Technical Skills">Technical Skills</option>
//                               <option value="Communication">Communication</option>
//                               <option value="Leadership">Leadership</option>
//                               <option value="Teamwork">Teamwork</option>
//                               <option value="Time Management">Time Management</option>
//                               <option value="Problem Solving">Problem Solving</option>
//                             </select>
//                           </Field>

//                           <Field label="Key Strengths">
//                             <textarea
//                               value={form.strengths}
//                               onChange={(e) => setForm({ ...form, strengths: e.target.value })}
//                               placeholder="List key strengths and achievements..."
//                               rows={3}
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             />
//                           </Field>

//                           <Field label="Areas to Improve">
//                             <textarea
//                               value={form.areasToImprove}
//                               onChange={(e) => setForm({ ...form, areasToImprove: e.target.value })}
//                               placeholder="Areas where improvement is needed..."
//                               rows={3}
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             />
//                           </Field>

//                           <Field label="Overall Rating">
//                             <select
//                               value={form.rating}
//                               onChange={(e) => setForm({ ...form, rating: e.target.value })}
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             >
//                               <option value="2">2 - Needs Improvement</option>
//                               <option value="3">3 - Meets Expectations</option>
//                               <option value="4">4 - Exceeds Expectations</option>
//                               <option value="5">5 - Outstanding</option>
//                             </select>
//                           </Field>

//                           <Field label="Additional Feedback">
//                             <textarea
//                               value={form.feedback}
//                               onChange={(e) => setForm({ ...form, feedback: e.target.value })}
//                               placeholder="Any additional feedback..."
//                               rows={2}
//                               className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
//                             />
//                           </Field>

//                           {!isPaid && (
//                             <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
//                               <div className="flex justify-between items-center mb-2">
//                                 <span className="font-medium text-emerald-900 text-sm">Free Trial Progress</span>
//                                 <span className="text-xs font-semibold text-emerald-700">{trialCount}/{MAX_FREE_TRIALS}</span>
//                               </div>
//                               <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
//                                 <div
//                                   className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all"
//                                   style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
//                                 />
//                               </div>
//                             </div>
//                           )}

//                           <button
//                             onClick={handleGenerate}
//                             disabled={!form.employeeName || !form.role || isLoading}
//                             className={`w-full py-3 sm:py-4 rounded-lg font-semibold text-lg transition-all ${
//                               form.employeeName && form.role && !isLoading
//                                 ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md hover:shadow-lg"
//                                 : "bg-slate-200 text-slate-500 cursor-not-allowed"
//                             }`}
//                           >
//                             {isLoading ? "Generating..." : "⭐ Generate Review"}
//                           </button>
//                         </div>
//                       </div>
//                     )}

//                     {activeTab === "results" && (
//                       <div className="p-6 sm:p-8">
//                         <div className="space-y-4 min-h-[400px]">
//                           {!output ? (
//                             <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-8 text-center border border-emerald-200 h-full flex flex-col justify-center">
//                               <div className="text-5xl mb-4">📋</div>
//                               <h3 className="text-xl font-bold text-slate-900 mb-2">Generated Review</h3>
//                               <p className="text-slate-600">
//                                 Fill details in the Create Review tab and click Generate to create your professional performance review.
//                               </p>
//                             </div>
//                           ) : (
//                             <div className="bg-white rounded-lg p-6 border border-slate-200 h-full flex flex-col">
//                               <div className="flex items-center justify-between mb-4">
//                                 <div>
//                                   <h3 className="font-bold text-slate-900">{form.employeeName}</h3>
//                                   <p className="text-sm text-slate-600">{getRatingLabel(form.rating)}</p>
//                                 </div>
//                                 <button
//                                   onClick={downloadReview}
//                                   className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all"
//                                 >
//                                   ⬇️ Download
//                                 </button>
//                               </div>
//                               <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap text-sm text-slate-700">
//                                 {output}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Pricing Info Footer */}
//         <div className="px-6 py-4 sm:px-8 sm:py-5 bg-slate-50 border-t border-slate-200 text-sm text-slate-600 flex-shrink-0">
//           Pricing: <span className="font-semibold text-slate-900">{app.pricing}</span>
//         </div>
//       </div>

//       {/* Payment Modal - Overlay (outside the main content area) */}
//       {showPaymentModal && (
//         <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
//             <button
//               onClick={() => setShowPaymentModal(false)}
//               className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//             <div className="p-6">
//               <div className="text-3xl mb-4 text-center">🔒</div>
//               <h2 className="text-xl font-bold text-gray-900 mb-2">Free Trial Used</h2>
//               <p className="text-gray-600 text-sm mb-6">Subscribe for unlimited performance reviews.</p>
//               <button
//                 onClick={() => handlePayment("basic")}
//                 className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 mb-3"
//               >
//                 Subscribe ₹299/report
//               </button>
//             </div>
//             <div className="p-4 bg-gray-50 text-center border-t">
//               <button
//                 onClick={() => setShowPaymentModal(false)}
//                 className="text-gray-500 hover:text-gray-700 text-sm"
//               >
//                 Maybe later
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import LeftSidebar from "../components/LeftSidebar";
import MonetizationCard from "../components/MonetizationCard";
import { useTrackAppUsage } from "../hooks/useTrackAppUsage";
import { API_BASE } from "../config/api";

const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Performance Review Generator",
  valueProposition: "Create thoughtful, structured performance reviews",
  pricing: "₹299 per review",
  icon: "⭐"
};

export default function PerformanceReview({ app = defaultApp }) {
  useTrackAppUsage("performance-review");

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
  const [activeTab, setActiveTab] = useState("input"); // "input" or "results"

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
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const generateReview = async () => {
    if (!form.employeeName.trim() || !form.role.trim()) {
      setError("Employee name and job role are required");
      return;
    }

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

      setOutput(data.review || data.output || JSON.stringify(data, null, 2));
      setActiveTab("results");

      if (!isPaid) updateTrialCount(trialCount + 1);
    } catch (err) {
      setError(err.message || "Something went wrong");
      setOutput("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (plan) => {
    setShowPaymentModal(false);
    alert("Payment flow started (demo mode - marking as paid)");
    setIsPaid(true);
    sessionStorage.setItem("performanceReviewPaid", "true");
    updateTrialCount(0);
    generateReview();
  };

  const downloadReview = () => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Performance_Review_${form.employeeName || "Employee"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRatingLabel = (rating) => {
    const map = {
      "2": "Needs Improvement",
      "3": "Meets Expectations",
      "4": "Exceeds Expectations",
      "5": "Outstanding",
    };
    return map[rating] || "Meets Expectations";
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <LeftSidebar app={app} isPro={isPaid} backTo="/customer" />

      <div className="flex-1 ml-80 min-h-screen overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-gray-50 pb-4 pt-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{app.name}</h1>
            <p className="text-gray-600 mt-1">{app.valueProposition}</p>
            {!isPaid && (
              <p className="text-sm text-amber-600 mt-2 font-medium">
                Free trials remaining: {MAX_FREE_TRIALS - trialCount}/{MAX_FREE_TRIALS}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-3 mb-6 border-b border-gray-200 pb-2">
            <button
              onClick={() => setActiveTab("input")}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === "input" ? "bg-indigo-600 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              📝 Create Review
            </button>
            <button
              onClick={() => setActiveTab("results")}
              disabled={!output}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === "results" ? "bg-indigo-600 text-white shadow-sm" : "bg-white border text-gray-600 hover:bg-gray-50"
              } ${!output ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              📄 Results {output ? "" : "(0)"}
            </button>
          </div>

          {/* Content */}
          {activeTab === "input" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-8">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee Name *</label>
                    <input
                      value={form.employeeName}
                      onChange={(e) => setForm({ ...form, employeeName: e.target.value })}
                      placeholder="e.g. Sarah Johnson"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Role *</label>
                    <input
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="e.g. Senior Developer"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating Period</label>
                  <input
                    value={form.ratingPeriod}
                    onChange={(e) => setForm({ ...form, ratingPeriod: e.target.value })}
                    placeholder="e.g. Q4 2024"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Performance Area</label>
                  <select
                    value={form.performanceArea}
                    onChange={(e) => setForm({ ...form, performanceArea: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  >
                    <option>Technical Skills</option>
                    <option>Communication</option>
                    <option>Leadership</option>
                    <option>Teamwork</option>
                    <option>Time Management</option>
                    <option>Problem Solving</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
                    <textarea
                      value={form.strengths}
                      onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                      placeholder="List key strengths and achievements..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Areas to Improve</label>
                    <textarea
                      value={form.areasToImprove}
                      onChange={(e) => setForm({ ...form, areasToImprove: e.target.value })}
                      placeholder="Areas where improvement is needed..."
                      rows={4}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overall Rating</label>
                    <select
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    >
                      <option value="2">2 - Needs Improvement</option>
                      <option value="3">3 - Meets Expectations</option>
                      <option value="4">4 - Exceeds Expectations</option>
                      <option value="5">5 - Outstanding</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Feedback</label>
                    <textarea
                      value={form.feedback}
                      onChange={(e) => setForm({ ...form, feedback: e.target.value })}
                      placeholder="Any additional comments..."
                      rows={2}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>
                </div>

                {!isPaid && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-indigo-800">Free Trial Progress</span>
                      <span className="font-medium text-indigo-800">
                        {trialCount}/{MAX_FREE_TRIALS}
                      </span>
                    </div>
                    <div className="h-2.5 bg-indigo-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                        style={{ width: `${(trialCount / MAX_FREE_TRIALS) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={generateReview}
                  disabled={isLoading || !form.employeeName.trim() || !form.role.trim()}
                  className={`w-full py-4 rounded-xl text-lg font-semibold transition-all shadow-md ${
                    form.employeeName.trim() && form.role.trim() && !isLoading
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isLoading ? "Generating Review..." : "Generate Performance Review"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "results" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Generated Review</h2>
                    <p className="text-gray-600 mt-1">
                      {form.employeeName} • {form.role} • {form.ratingPeriod || "Custom Period"}
                    </p>
                  </div>
                  <button
                    onClick={downloadReview}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 flex items-center gap-2"
                  >
                    ⬇️ Download TXT
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 whitespace-pre-wrap text-gray-800 leading-relaxed min-h-[400px]">
                  {output || "No review generated yet. Go back to Create Review tab and generate one."}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import CustomerMicroAppShell from "../components/CustomerMicroAppShell";
import MonetizationCard from "../components/MonetizationCard";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const ads = [
  {
    title: "📋 Structured Interviews",
    text: "Generate comprehensive exit interview questionnaires",
    button: "Try Now"
  },
  {
    title: "💡 Better Insights",
    text: "Ask the right questions to get honest feedback",
    button: "Learn More"
  },
  {
    title: "🔒 Confidential",
    text: "All responses are anonymized and secure",
    button: "Get Started"
  }
];

export default function ExitInterviewGenerator({ app }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    department: "",
    position: "",
    dateOfJoining: "",
    dateOfExit: "",
    lastWorkingDay: "",
    reasonForLeaving: "",
    managerName: "",
    interviewerName: "",
    employmentType: "Full-time",
    tenure: "",
    exitType: "Voluntary"
  });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [trialCount, setTrialCount] = useState(0);
  const [isPaid, setIsPaid] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("exitInterviewGenTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("exitInterviewGenPaid") === "true";
    setIsPaid(paid);
  }, []);

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("exitInterviewGenTrials", count.toString());
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Calculate tenure if dates are filled
    if (name === "dateOfJoining" || name === "dateOfExit") {
      const joining = name === "dateOfJoining" ? value : formData.dateOfJoining;
      const exit = name === "dateOfExit" ? value : formData.dateOfExit;
      
      if (joining && exit) {
        const start = new Date(joining);
        const end = new Date(exit);
        const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30));
        if (months > 0) {
          setFormData(prev => ({ ...prev, tenure: `${months} months` }));
        }
      }
    }
  };

  const handlePayment = async (plan) => {
    setIsProcessing(true);

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
          sessionStorage.setItem("exitInterviewGenPaid", "true");
          setShowPayment(false);
          updateTrialCount(0);
        } else {
          alert(data.error || "Failed to create order");
        }
        setIsProcessing(false);
        return;
      }

      await loadRazorpayScript();

      if (!window.Razorpay) {
        alert("Payment script failed to load");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "ATRact Exit Interview Generator",
        description: plan === "basic" ? "Single Generation" : "Pro Membership",
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
              sessionStorage.setItem("exitInterviewGenPaid", "true");
              setShowPayment(false);
              updateTrialCount(0);
              generateQuestions();
              alert("Payment successful! Generating your questions...");
            } else {
              alert("Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            alert("Could not verify payment");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: { name: "Customer", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#4F46E5" },
        modal: { ondismiss: () => setIsProcessing(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        alert("Payment failed. Please try again.");
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err) {
      alert(err.message || "Payment failed");
      setIsProcessing(false);
    }
  };

  const generateQuestions = () => {
    const questions = [];

    // Section 1: Overall Experience
    questions.push({
      category: "Overall Experience",
      question: `How would you describe your overall experience working at the company during your ${formData.tenure || "tenure"} here?`,
      type: "open"
    });

    questions.push({
      category: "Overall Experience",
      question: "What were the most rewarding aspects of your role?",
      type: "open"
    });

    questions.push({
      category: "Overall Experience",
      question: "What were the most challenging aspects of your role?",
      type: "open"
    });

    // Section 2: Management & Leadership
    questions.push({
      category: "Management & Leadership",
      question: `How would you describe your relationship with your manager, ${formData.managerName || "[Manager Name]"}?`,
      type: "rating"
    });

    questions.push({
      category: "Management & Leadership",
      question: "Did you receive adequate feedback and guidance on your performance?",
      type: "yesNo"
    });

    questions.push({
      category: "Management & Leadership",
      question: "Were your contributions recognized and appreciated?",
      type: "yesNo"
    });

    // Section 3: Compensation & Benefits
    questions.push({
      category: "Compensation & Benefits",
      question: "Was your compensation package competitive with the market?",
      type: "yesNo"
    });

    questions.push({
      category: "Compensation & Benefits",
      question: "Were the benefits and perks offered by the company satisfactory?",
      type: "rating"
    });

    questions.push({
      category: "Compensation & Benefits",
      question: "Did compensation play a role in your decision to leave?",
      type: "yesNo"
    });

    // Section 4: Career Growth
    questions.push({
      category: "Career Growth",
      question: "Were there adequate opportunities for professional development?",
      type: "yesNo"
    });

    questions.push({
      category: "Career Growth",
      question: "Did you feel there was a clear career path for growth?",
      type: "rating"
    });

    questions.push({
      category: "Career Growth",
      question: "Was there sufficient support for skill-building and training?",
      type: "yesNo"
    });

    // Section 5: Work Environment
    questions.push({
      category: "Work Environment",
      question: "How would you describe the work culture and environment?",
      type: "open"
    });

    questions.push({
      category: "Work Environment",
      question: "Did you feel valued and respected by your colleagues?",
      type: "rating"
    });

    questions.push({
      category: "Work Environment",
      question: "Was there a healthy work-life balance?",
      type: "rating"
    });

    // Section 6: Exit Reasons
    questions.push({
      category: "Exit Reasons",
      question: `What is the primary reason for your departure? (Given: ${formData.reasonForLeaving || "Not specified"})`,
      type: "open"
    });

    questions.push({
      category: "Exit Reasons",
      question: "Could anything have been done to change your decision to leave?",
      type: "open"
    });

    questions.push({
      category: "Exit Reasons",
      question: "Would you consider returning to the company in the future?",
      type: "yesNo"
    });

    // Section 7: Suggestions
    questions.push({
      category: "Suggestions",
      question: "What changes would you suggest to improve the company?",
      type: "open"
    });

    questions.push({
      category: "Suggestions",
      question: "What advice would you give to new employees joining the company?",
      type: "open"
    });

    questions.push({
      category: "Suggestions",
      question: "Is there anything else you'd like to share about your experience?",
      type: "open"
    });

    // Section 8: Final
    questions.push({
      category: "Final",
      question: "On a scale of 1-10, how likely are you to recommend this company as a workplace?",
      type: "nps"
    });

    questions.push({
      category: "Final",
      question: "Would you be willing to serve as a reference for future employees?",
      type: "yesNo"
    });

    setGeneratedQuestions(questions);
    setActiveTab("questions");
    if (!isPaid) updateTrialCount(trialCount + 1);
  };

  const handleGenerate = () => {
    if (!formData.employeeName?.trim()) {
      alert("Please enter employee name");
      return;
    }

    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPayment(true);
    } else {
      generateQuestions();
    }
  };

  const copyQuestions = () => {
    const text = `EXIT INTERVIEW QUESTIONS
=========================
Employee: ${formData.employeeName || "[Name]"}
Department: ${formData.department || "[Department]"}
Position: ${formData.position || "[Position]"}
Interviewer: ${formData.interviewerName || "[Interviewer]"}
Tenure: ${formData.tenure || "N/A"}
Reason for Leaving: ${formData.reasonForLeaving || "N/A"}

QUESTIONS
=========

${generatedQuestions.map((q, i) => `${i + 1}. [${q.category}] (${q.type.toUpperCase()})
   ${q.question}`).join('\n\n')}

---
Generated by ATRact HR Exit Interview Generator
Date: ${new Date().toLocaleDateString()}
`;

    navigator.clipboard.writeText(text);
    alert("Questions copied to clipboard!");
  };

  const downloadQuestions = () => {
    const element = document.createElement("a");
    const file = new Blob([`EXIT INTERVIEW QUESTIONS
${'='.repeat(50)}
Employee: ${formData.employeeName}
Department: ${formData.department}
Position: ${formData.position}
Interview Date: ${new Date().toLocaleDateString()}

${generatedQuestions.map((q, i) => `${i + 1}. ${q.category}: ${q.question}`).join('\n\n')}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Exit_Interview_${formData.employeeName.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Overall Experience": "bg-blue-100 text-blue-700",
      "Management & Leadership": "bg-purple-100 text-purple-700",
      "Compensation & Benefits": "bg-green-100 text-green-700",
      "Career Growth": "bg-amber-100 text-amber-700",
      "Work Environment": "bg-indigo-100 text-indigo-700",
      "Exit Reasons": "bg-red-100 text-red-700",
      "Suggestions": "bg-teal-100 text-teal-700",
      "Final": "bg-gray-100 text-gray-700"
    };
    return colors[category] || "bg-gray-100 text-gray-700";
  };

  const getTypeIcon = (type) => {
    const icons = {
      open: "💬",
      yesNo: "✓✗",
      rating: "⭐",
      nps: "1-10"
    };
    return icons[type] || "📝";
  };

  return (
    <CustomerMicroAppShell app={app}>
      {/* Payment Modal */}
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

              <div className="p-6 text-center border-b border-gray-100">
                <div className="text-3xl mb-2">🔒</div>
                <h2 className="text-2xl font-bold text-gray-900">Free Trials Used</h2>
                <p className="text-gray-600 mt-1">You've used your {trialCount} free question generations.</p>
              </div>

              <div className="p-6">
                <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-700">Exit Interview Questions</p>
                      <p className="text-sm text-gray-500">{generatedQuestions.length} comprehensive questions</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700">₹199</p>
                  </div>
                </div>

                <button
                  onClick={() => handlePayment("exit_gen")}
                  disabled={isProcessing}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Pay ₹199 & Generate"}
                </button>

                <button
                  onClick={() => handlePayment("pro")}
                  disabled={isProcessing}
                  className="w-full py-3 mt-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Upgrade to Pro - ₹999/month"}
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

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{app?.name || "HR Exit Interview Generator"}</h1>
              <p className="text-gray-600 mt-1">{app?.valueProposition || "Generate structured exit interview questionnaires"}</p>
            </div>
            {!isPaid && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <span className="text-sm text-amber-700 font-medium">Free Trials: {trialCount}/{MAX_FREE_TRIALS}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "details"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            📋 Employee Details
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === "questions"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            disabled={generatedQuestions.length === 0}
          >
            ❓ Generated Questions ({generatedQuestions.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Name *</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position/Role</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input
                    type="date"
                    name="dateOfJoining"
                    value={formData.dateOfJoining}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Exit</label>
                  <input
                    type="date"
                    name="dateOfExit"
                    value={formData.dateOfExit}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tenure</label>
                  <input
                    type="text"
                    name="tenure"
                    value={formData.tenure}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-calculated"
                    readOnly
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exit Type</label>
                  <select
                    name="exitType"
                    value={formData.exitType}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Voluntary">Voluntary</option>
                    <option value="Involuntary">Involuntary</option>
                    <option value="Resignation">Resignation</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Mutual Agreement">Mutual Agreement</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
                <select
                  name="reasonForLeaving"
                  value={formData.reasonForLeaving}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select primary reason</option>
                  <option value="Better Opportunity">Better Opportunity</option>
                  <option value="Compensation">Compensation</option>
                  <option value="Career Growth">Career Growth</option>
                  <option value="Work-Life Balance">Work-Life Balance</option>
                  <option value="Management Issues">Management Issues</option>
                  <option value="Company Culture">Company Culture</option>
                  <option value="Remote Work">Remote Work Preference</option>
                  <option value="Personal Reasons">Personal Reasons</option>
                  <option value="Health Issues">Health Issues</option>
                  <option value="Further Studies">Further Studies</option>
                  <option value="Relocation">Relocation</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    name="managerName"
                    value={formData.managerName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Manager name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interviewer Name</label>
                  <input
                    type="text"
                    name="interviewerName"
                    value={formData.interviewerName}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Interviewer name"
                  />
                </div>
              </div>

              {!isPaid && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 mb-4">
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

              <button
                onClick={handleGenerate}
                disabled={!formData.employeeName?.trim() || isProcessing}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  formData.employeeName?.trim() && !isProcessing
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 shadow-md"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Generating...
                  </span>
                ) : (
                  "Generate Exit Interview Questions"
                )}
              </button>

              <p className="text-xs text-center text-gray-500 mt-3">
                Generates 20 comprehensive questions across 8 categories
              </p>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />
              
              {/* Info Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Question Categories</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Overall Experience (3 questions)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Management & Leadership (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Compensation & Benefits (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    <span>Career Growth (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                    <span>Work Environment (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span>Exit Reasons (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                    <span>Suggestions (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                    <span>Final Questions (2)</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">💡 Tips</h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• Ensure employee is comfortable</li>
                  <li>• Ask open-ended questions</li>
                  <li>• Listen actively without judgment</li>
                  <li>• Take detailed notes</li>
                  <li>• Thank them for their time</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === "questions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Generated Exit Interview</h2>
                    <p className="text-sm text-gray-500">
                      {formData.employeeName} • {formData.department || "N/A"} • {formData.tenure || "N/A"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={copyQuestions}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={downloadQuestions}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-2"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>

                {/* Question Summary */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-blue-700">{generatedQuestions.length}</div>
                    <div className="text-xs text-blue-600">Total Questions</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-green-700">{generatedQuestions.filter(q => q.type === "open").length}</div>
                    <div className="text-xs text-green-600">Open Ended</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-amber-700">{generatedQuestions.filter(q => q.type === "rating" || q.type === "nps").length}</div>
                    <div className="text-xs text-amber-600">Rating Based</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-xl font-bold text-purple-700">{generatedQuestions.filter(q => q.type === "yesNo").length}</div>
                    <div className="text-xs text-purple-600">Yes/No</div>
                  </div>
                </div>
              </div>

              {/* Questions List */}
              {generatedQuestions.map((q, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-semibold text-gray-500">#{i + 1}</span>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(q.category)}`}>
                      {q.category}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                      {getTypeIcon(q.type)} {q.type}
                    </span>
                  </div>
                  <p className="text-gray-800">{q.question}</p>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />

              {/* Employee Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Interview Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Employee</span>
                    <span className="font-medium">{formData.employeeName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium">{formData.department || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Position</span>
                    <span className="font-medium">{formData.position || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tenure</span>
                    <span className="font-medium">{formData.tenure || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Exit Type</span>
                    <span className="font-medium">{formData.exitType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Reason</span>
                    <span className="font-medium">{formData.reasonForLeaving || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </CustomerMicroAppShell>
  );
}

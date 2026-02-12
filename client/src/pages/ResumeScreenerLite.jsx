import { useState, useEffect } from "react";
import Field from "../components/Field";
import LeftSidebar from "../components/LeftSidebar";
import mammoth from "mammoth";

import { API_BASE } from "../config/api";
const MAX_FREE_TRIALS = 2;

const defaultApp = {
  name: "Resume Screener Lite",
  valueProposition: "AI-Powered Resume Analysis with TF-IDF Matching",
  pricing: "₹499/month or ₹99 per batch",
};

export default function ResumeScreenerLite({ app = defaultApp }) {
  const [jd, setJd] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [trialCount, setTrialCount] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Multiple resumes and results
  const [uploadedResumes, setUploadedResumes] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [currentResumeId, setCurrentResumeId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("resumeScreenerTrials");
    if (stored !== null) setTrialCount(parseInt(stored, 10));
    const paid = sessionStorage.getItem("resumeScreenerPaid") === "true";
    setIsPaid(paid);
    fetchUploadedResumes();
  }, []);

  const fetchUploadedResumes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/resume`);
      const data = await res.json();
      if (data && Array.isArray(data)) {
        setUploadedResumes(data);
      }
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
    }
  };

  const updateTrialCount = (count) => {
    setTrialCount(count);
    sessionStorage.setItem("resumeScreenerTrials", count.toString());
  };

  const extractDOCX = async (arrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "No text found";
    } catch {
      return "Error reading DOCX";
    }
  };

  const extractPDF = (arrayBuffer) => {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const text = new TextDecoder().decode(bytes);
      const match = text.match(/stream\s+([\s\S]*?)\s+endstream/);
      if (match) {
        const clean = match[1].replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
        return clean || "Unable to extract PDF";
      }
      return "Unable to extract PDF";
    } catch {
      return "Error reading PDF";
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setIsProcessing(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const buffer = e.target?.result;
        let text = "";
        if (file.type === "application/pdf") {
          text = extractPDF(buffer);
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          text = await extractDOCX(buffer);
        } else if (file.type === "text/plain") {
          text = new TextDecoder().decode(buffer);
        } else {
          text = "Unsupported file type";
        }
        setResumeText(text);
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setError("Error reading file");
      setIsProcessing(false);
    }
  };

  // Analyze and automatically store resume in database
  const analyzeAndStoreResume = async () => {
    if (!jd || !resumeText) {
      setError("Please enter JD and upload resume");
      return;
    }

    // Check free trials
    if (trialCount >= MAX_FREE_TRIALS && !isPaid) {
      setShowPayment(true);
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      // First, upload to database (no button needed)
      const uploadResponse = await fetch(`${API_BASE}/api/resume/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: fileName || "Uploaded Resume", 
          text: resumeText 
        }),
      });

      const uploadData = await uploadResponse.json();
      
      if (uploadData.error) {
        setError(uploadData.error);
        setIsProcessing(false);
        return;
      }

      // Get the resume ID
      const resumeId = uploadData.id;

      // Then analyze the resume
      const analyzeResponse = await fetch(`${API_BASE}/api/analysis/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText: jd, resumeText }),
      });

      const analyzeData = await analyzeResponse.json();

      if (analyzeData.error) {
        setError(analyzeData.error);
        setHasAnalyzed(false);
      } else {
        // Store the result
        setResult(analyzeData);
        setCurrentResumeId(resumeId);
        
        // Refresh uploaded resumes list
        await fetchUploadedResumes();
        
        // Match all resumes against JD
        await matchAllResumes(jd);
        
        setHasAnalyzed(true);
        if (!isPaid) updateTrialCount(trialCount + 1);
      }
    } catch (e) {
      setError("Analysis failed: " + e.message);
      setHasAnalyzed(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Match all resumes against the current JD
  const matchAllResumes = async (jobDescription) => {
    if (!jobDescription) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/analysis/match-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText: jobDescription }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Matching error:", data.error);
      } else {
        setMatchResults(data.rankedCandidates || []);
      }
    } catch (e) {
      console.error("Matching failed:", e);
    }
  };

  // Load previous analysis result
  const loadResult = (historyItem) => {
    const found = matchResults.find(r => r.id === historyItem.id);
    if (found) {
      setResult({
        overallScore: found.matchPercentage,
        similarityScore: found.tfidfSimilarity,
        verdict: found.matchPercentage >= 80 ? "Excellent Match" : 
                 found.matchPercentage >= 60 ? "Good Match" : 
                 found.matchPercentage >= 40 ? "Moderate Match" : "Weak Match",
        verdictColor: found.matchPercentage >= 80 ? "emerald" : 
                      found.matchPercentage >= 60 ? "blue" : 
                      found.matchPercentage >= 40 ? "amber" : "rose",
        matchedKeywords: found.matchedKeywords || [],
        missingKeywords: found.missingKeywords || [],
        isTechnical: found.isTechnical
      });
      setCurrentResumeId(historyItem.id);
    }
  };

  // Delete a resume
  const deleteResume = async (id) => {
    try {
      await fetch(`${API_BASE}/api/resume/${id}`, { method: "DELETE" });
      await fetchUploadedResumes();
      await matchAllResumes(jd);
    } catch (err) {
      console.error("Delete failed:", err);
    }
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
          alert("Payment gateway not configured. Adding demo paid access.");
          setIsPaid(true);
          sessionStorage.setItem("resumeScreenerPaid", "true");
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
        name: "ATRact Resume Screener",
        description: plan === "basic" ? "Basic - Unlimited Analyses" : "Premium - Full Access",
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
              sessionStorage.setItem("resumeScreenerPaid", "true");
              setShowPayment(false);
              updateTrialCount(0);
              alert("Payment successful! You now have unlimited access.");
            } else {
              setError("Payment verification failed");
            }
          } catch (err) {
            console.error(err);
            setError("Could not verify payment");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: "Customer",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: { color: "#4F46E5" },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPaid} />

      <div className="flex-1 ml-80 flex">
        <div className="w-1/2 h-screen overflow-hidden flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            <div className="bg-white border rounded-xl shadow-sm flex-1 flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">📋 Job Description</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {uploadedResumes.length} resumes in database • {trialCount}/{MAX_FREE_TRIALS} free trials used
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <Field label="Job Description" helper="Paste the job description">
                  <textarea
                    value={jd}
                    onChange={(e) => setJd(e.target.value)}
                    className="w-full h-40 rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Paste JD here..."
                  />
                </Field>

                <Field label="Resume" helper="Upload PDF or DOCX">
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 bg-gray-50 transition-colors"
                  >
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2" />
                        <p className="text-gray-600 text-sm">Processing...</p>
                      </div>
                    ) : resumeText ? (
                      <div className="text-center">
                        <svg className="w-10 h-10 text-green-600 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xl text-black truncate block max-w-[200px] mx-auto">{fileName}</span>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-10 h-10 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-gray-500 text-sm">Click to upload resume</span>
                      </div>
                    )}
                  </label>
                </Field>
              </div>

              <div className="p-6 border-t border-gray-100">
                <button
                  onClick={analyzeAndStoreResume}
                  disabled={!jd || !resumeText || isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    jd && resumeText && !isProcessing
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing & Storing...
                    </span>
                  ) : (
                    "🎯 Analyze & Store Resume"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/2 h-screen overflow-y-auto bg-gray-50">
          <div className="p-6">
            {!hasAnalyzed ? (
              <div className="bg-white border rounded-xl p-12 shadow-sm text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Analyze</h3>
                <p className="text-gray-600 mb-4">
                  Upload a resume and paste the job description to get detailed analysis
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-blue-900 mb-2">What you'll get:</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-start"><span className="mr-2">✓</span><span>TF-IDF based accurate matching</span></li>
                    <li className="flex items-start"><span className="mr-2">✓</span><span>Cosine similarity percentage (0-100%)</span></li>
                    <li className="flex items-start"><span className="mr-2">✓</span><span>Technical/Non-technical role detection</span></li>
                    <li className="flex items-start"><span className="mr-2">✓</span><span>Key suggestions to improve your resume</span></li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-6">
                {/* Overall Score - First */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Overall Match Score</h3>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        result.verdictColor === "emerald" ? "bg-emerald-100 text-emerald-700" :
                        result.verdictColor === "blue" ? "bg-blue-100 text-blue-700" :
                        result.verdictColor === "amber" ? "bg-amber-100 text-amber-700" :
                        "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {result.verdict}
                    </span>
                  </div>

                  <div className="text-7xl font-bold text-gray-900 mb-2">
                    {result.overallScore}
                    <span className="text-3xl text-gray-400">%</span>
                  </div>

                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        result.verdictColor === "emerald" ? "bg-emerald-500" :
                        result.verdictColor === "blue" ? "bg-blue-500" :
                        result.verdictColor === "amber" ? "bg-amber-500" :
                        "bg-rose-500"
                      }`}
                      style={{ width: `${result.overallScore}%` }}
                    />
                  </div>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>TF-IDF Similarity:</strong> {result.similarityScore}%
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Role Type: <span className="font-medium">{result.isTechnical ? "Technical" : "Non-Technical"}</span>
                    </p>
                  </div>
                </div>

                {/* Suggestions - Second */}
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4">💡 Suggestions to Improve</h3>
                  
                  {/* Missing Keywords */}
                  {result.missingKeywords && result.missingKeywords.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-rose-700 mb-2">Add these missing skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.missingKeywords.map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Matched Keywords */}
                  {result.matchedKeywords && result.matchedKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-emerald-700 mb-2">Already matching:</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.matchedKeywords.slice(0, 10).map((keyword, idx) => (
                          <span key={idx} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!result.missingKeywords || result.missingKeywords.length === 0) && 
                   (!result.matchedKeywords || result.matchedKeywords.length === 0) && (
                    <p className="text-gray-500 text-sm">No specific keywords detected. Try adding more details to your job description.</p>
                  )}
                </div>

                {/* Ranked Candidates - Third */}
                {matchResults.length > 1 && (
                  <div className="bg-white border rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-4">🏆 All Candidate Rankings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {matchResults.length} resumes matched against your JD
                    </p>
                    <div className="space-y-3">
                      {matchResults.map((candidate, idx) => (
                        <div 
                          key={candidate.id} 
                          className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                            currentResumeId === candidate.id 
                              ? "bg-blue-50 border-2 border-blue-300" 
                              : "bg-gray-50 border-2 border-transparent"
                          }`}
                          onClick={() => loadResult({ id: candidate.id, name: candidate.name })}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                              idx === 0 ? "bg-yellow-100 text-yellow-700" :
                              idx === 1 ? "bg-gray-200 text-gray-700" :
                              idx === 2 ? "bg-orange-100 text-orange-700" :
                              "bg-blue-50 text-blue-700"
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{candidate.name}</p>
                              <p className="text-sm text-gray-500">{candidate.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-bold ${
                              candidate.matchPercentage >= 80 ? "text-emerald-600" :
                              candidate.matchPercentage >= 60 ? "text-blue-600" :
                              candidate.matchPercentage >= 40 ? "text-amber-600" :
                              "text-rose-600"
                            }`}>
                              {candidate.matchPercentage}%
                            </p>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteResume(candidate.id); }}
                              className="text-xs text-gray-400 hover:text-red-500 mt-1"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
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
              <p className="text-gray-600 mt-1">You've used your {MAX_FREE_TRIALS} free analyses. Unlock unlimited access.</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 border-2 border-indigo-200 rounded-xl p-6 hover:border-indigo-400 transition-all bg-gradient-to-br from-indigo-50/50 to-white">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Basic</h3>
                  <div className="text-3xl font-bold text-indigo-700 mb-1">₹99</div>
                  <p className="text-indigo-600 text-sm mb-4">Unlimited resume analyses</p>
                  <button
                    onClick={() => handlePayment("basic")}
                    disabled={paymentLoading}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? "Loading..." : "Pay ₹99"}
                  </button>
                </div>
                <div className="flex-1 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 transition-all bg-gradient-to-br from-purple-50/50 to-white relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-bold text-purple-900 mb-2">Premium</h3>
                  <div className="text-3xl font-bold text-purple-700 mb-1">₹499</div>
                  <p className="text-purple-600 text-sm mb-4">Full access + priority support</p>
                  <button
                    onClick={() => handlePayment("premium")}
                    disabled={paymentLoading}
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? "Loading..." : "Pay ₹499"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import LeftSidebar from "../components/LeftSidebar";
import MonetizationCard from "../components/MonetizationCard";
import mammoth from "mammoth";
import { API_BASE } from "../config/api";

const ads = [
  {
    title: "🎯 ATS Optimization",
    text: "Get your resume past applicant tracking systems",
    button: "Try Free"
  },
  {
    title: "📄 Professional Format",
    text: "Industry-standard resume layouts that impress",
    button: "Learn More"
  },
  {
    title: "🚀 Land More Interviews",
    text: "Stand out from other applicants with optimized content",
    button: "Upgrade"
  }
];

export default function ResumeFormatterPro({ app, isPro = false }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [targetRole, setTargetRole] = useState("");
  const [targetCompany, setTargetCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [seniority, setSeniority] = useState("Mid-level");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [achievements, setAchievements] = useState("");
  const [formattedResume, setFormattedResume] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formatStyle, setFormatStyle] = useState("modern");
  const [generatedCount, setGeneratedCount] = useState(0);
  const [error, setError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("format");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  // Extract text from DOCX
  const extractDOCX = async (arrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    } catch {
      return "";
    }
  };

  // Extract text from PDF (basic)
  const extractPDF = (arrayBuffer) => {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      const text = new TextDecoder().decode(bytes);
      const match = text.match(/stream\s+([\s\S]*?)\s+endstream/g);
      if (match) {
        return match.map(m => m.replace(/stream\s+|\s+endstream/g, ''))
          .join(' ')
          .replace(/[^\x20-\x7E]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
      return "";
    } catch {
      return "";
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                       'text/plain'];
    
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    setIsProcessing(true);
    setError("");
    setUploadedFileName(file.name);

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
        }
        
        if (text) {
          parseResumeContent(text);
        } else {
          setError("Could not extract text from file");
        }
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setError("Error reading file");
      setIsProcessing(false);
    }
  };

  const parseResumeContent = (content) => {
    // Normalize line endings and remove excessive whitespace
    const normalized = content.replace(/\r\n?/g, "\n").replace(/\t/g, ' ').replace(/ +/g, ' ');
    const rawLines = normalized.split('\n');
    const lines = rawLines.map(l => l.trim()).filter(l => l !== '');

    let currentSection = '';
    let expBlocks = [];
    let curExp = [];
    let eduBlocks = [];
    let curEdu = [];
    let skillsList = [];
    let achBlocks = [];
    let curAch = [];
    let summaryLines = [];

    // heuristics for name/contact
    let possibleName = '';
    let contactLine = '';
    const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
    const phoneRegex = /\+?\d[\d\s\-()]{6,}\d/;

    // choose first non-empty line as possible name if it looks like a name
    for (let i = 0; i < rawLines.length && i < 6; i++) {
      const l = rawLines[i].trim();
      if (!l) continue;
      if (emailRegex.test(l) || phoneRegex.test(l) || /linkedin|github|portfolio/i.test(l)) {
        contactLine = contactLine ? contactLine + ' | ' + l : l;
        continue;
      }
      // avoid lines that say 'resume' or are too long
      if (/resume/i.test(l) || l.length > 60) continue;
      if (!possibleName) possibleName = l;
    }

    // iterate lines and bucket into sections
    lines.forEach(line => {
      const lower = line.toLowerCase();

      // detect contact info anywhere
      if (emailRegex.test(line) || phoneRegex.test(line) || /linkedin\.com|github\.com|portfolio/i.test(line)) {
        contactLine = contactLine ? contactLine + ' | ' + line : line;
        return;
      }

      // detect section headers (explicit keywords or ALL CAPS headings)
      const isAllCaps = /^[A-Z0-9\s\-:\.]+$/.test(line) && line.replace(/[^A-Z0-9]/g, '').length >= 3;
      if (isAllCaps || /^(summary|professional summary|experience|work experience|employment history|education|skills|technical skills|projects|achievements|certifications|awards|contact)/i.test(lower)) {
        // finalize previous blocks if switching sections
        if (currentSection === 'experience' && curExp.length) { expBlocks.push(curExp.join(' ')); curExp = []; }
        if (currentSection === 'education' && curEdu.length) { eduBlocks.push(curEdu.join(' ')); curEdu = []; }
        if (currentSection === 'achievements' && curAch.length) { achBlocks.push(curAch.join(' ')); curAch = []; }

        if (/experience|work experience|employment/i.test(lower) || /professional experience/i.test(line)) {
          currentSection = 'experience';
        } else if (/education|degree|university|college/i.test(lower)) {
          currentSection = 'education';
        } else if (/skill|technolog|tool|expertise/i.test(lower)) {
          currentSection = 'skills';
        } else if (/achievement|project|accomplish|award/i.test(lower)) {
          currentSection = 'achievements';
        } else if (/summary|professional summary/i.test(lower)) {
          currentSection = 'summary';
        } else if (/contact/i.test(lower)) {
          currentSection = 'contact';
        } else {
          // fallback: set to summary
          currentSection = 'summary';
        }
        return;
      }

      // bucket lines
      if (currentSection === 'experience') {
        // treat blank-line separated paragraphs as separate experience items
        if (line === '') {
          if (curExp.length) { expBlocks.push(curExp.join(' ')); curExp = []; }
        } else {
          curExp.push(line);
        }
      } else if (currentSection === 'education') {
        if (line === '') { if (curEdu.length) { eduBlocks.push(curEdu.join(' ')); curEdu = []; } }
        else curEdu.push(line);
      } else if (currentSection === 'skills') {
        // split common separators
        const parts = line.split(/[,•·\-|]/).map(s => s.trim()).filter(Boolean);
        parts.forEach(p => {
          // further split by slash or / or and
          p.split(/\//).map(x => x.trim()).forEach(q => { if (q) skillsList.push(q); });
        });
      } else if (currentSection === 'achievements') {
        if (line === '') { if (curAch.length) { achBlocks.push(curAch.join(' ')); curAch = []; } }
        else curAch.push(line);
      } else if (currentSection === 'summary') {
        summaryLines.push(line);
      } else {
        // no current section - try to infer: lines with 'at' and years -> experience, lines with degree keywords -> education
        if (/\b(at|@)\b/i.test(line) && /\b(\d{4}|\d{2})\b/.test(line)) {
          curExp.push(line);
          currentSection = 'experience';
        } else if (/degree|b\.sc|m\.sc|bachelor|master|university|college|graduat/i.test(line)) {
          curEdu.push(line);
          currentSection = 'education';
        } else if (/skill|java(script)?|react|node|python|aws|docker|kubernetes|sql|nosql/i.test(line) && line.length < 120) {
          const parts = line.split(/[,•·\-|]/).map(s => s.trim()).filter(Boolean);
          parts.forEach(p => p.split(/\//).map(x => x.trim()).forEach(q => { if (q) skillsList.push(q); }));
          currentSection = 'skills';
        } else {
          summaryLines.push(line);
        }
      }
    });

    // finalize any running buffers
    if (curExp.length) expBlocks.push(curExp.join(' '));
    if (curEdu.length) eduBlocks.push(curEdu.join(' '));
    if (curAch.length) achBlocks.push(curAch.join(' '));

    // Compose cleaned strings
    const expText = expBlocks.join('\n\n');
    const eduText = eduBlocks.join('\n');
    const skillsText = Array.from(new Set(skillsList.map(s => s.replace(/^\-+|\.+$/g, '').trim()))).join(', ');
    const achText = achBlocks.join('\n');
    const summaryText = summaryLines.join(' ');

    if (expText) setExperience(expText.trim());
    if (eduText) setEducation(eduText.trim());
    if (skillsText) setSkills(skillsText.trim());
    if (achText) setAchievements(achText.trim());

    // Do NOT auto-show results on upload. Populate fields only.
    // Save parsed contact/name into local state if useful
    if (possibleName) {
      // don't overwrite targetRole (job title), but keep as metadata in `uploadedFileName` if empty
      if (!uploadedFileName) setUploadedFileName(possibleName);
    }
    // store contact info in achievements area if no explicit contact UI (optional)
    if (contactLine && !achText) {
      // do nothing for now; keep contact in parsed data only
    }
  };

  // Build a formatted resume string from current form fields (used when user clicks Generate)
  const buildLocalFormattedResume = () => {
    const headerParts = [];
    if (uploadedFileName) headerParts.push(uploadedFileName);
    if (targetRole) headerParts.push(targetRole);
    if (targetCompany) headerParts.push(targetCompany);

    const header = headerParts.join(' | ');
    let out = '';
    if (header) out += header + '\n' + '='.repeat(Math.min(80, header.length)) + '\n\n';

    if (experience) {
      out += 'WORK EXPERIENCE\n' + experience.trim() + '\n\n';
    }
    if (education) {
      out += 'EDUCATION\n' + education.trim() + '\n\n';
    }
    if (skills) {
      out += 'KEY SKILLS\n' + skills.trim() + '\n\n';
    }
    if (achievements) {
      out += 'ACHIEVEMENTS\n' + achievements.trim() + '\n\n';
    }

    out += 'Generated by ATRact Resume Formatter | ATS-Optimized';
    return out.trim();
  };

  const generateATSResumeWithAI = async () => {
    if (!targetRole && !experience) {
      setError('Please enter at least a target role or your experience');
      return;
    }

    // Check usage limits
    if (!isPro && generatedCount >= 3) {
      setShowPayment(true);
      return;
    }

    setIsProcessing(true);
    setError("");

    // Immediately build a local formatted resume from parsed/entered fields
    const localPreview = buildLocalFormattedResume();
    if (localPreview) {
      setFormattedResume(localPreview);
      setActiveTab('results');
    }

    try {
      const response = await fetch(`${API_BASE}/api/resume-formatter/generate-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetCompany,
          industry,
          seniority,
          skills,
          experience,
          education,
          achievements,
          formatStyle,
        }),
      });

      const data = await response.json();

      if (data.resume) {
        setFormattedResume(data.resume);
        setGeneratedCount((prev) => prev + 1);
        setActiveTab("results"); // Switch to results tab
      } else {
        setError(data.error || "Failed to generate resume");
      }
    } catch (e) {
      console.error("Generation error:", e);
      const msg = e.message?.includes("fetch") || e.message?.includes("Failed to fetch")
        ? "Backend server not running. Start it with: cd server && npm run dev"
        : `Error: ${e.message}`;
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (plan) => {
    setPaymentLoading(true);
    setError("");

    try {
      const amount = plan === 'single' ? 99 : 499;
      const res = await fetch(`${API_BASE}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          plan: plan === 'single' ? 'resume_format_single' : 'resume_format_pro',
          amount: amount * 100 
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        if (data.error?.includes("not configured")) {
          alert("Payment not configured. For demo: generating resume.");
          setShowPayment(false);
          if (plan === 'pro') {
            window.location.href = '/upgrade-success';
          } else {
            generateATSResumeWithAI();
          }
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
        amount: amount * 100,
        currency: data.currency || "INR",
        name: "ATRact Resume Formatter",
        description: plan === 'single' ? `Single Resume - ₹${amount}` : `Pro Membership - ₹${amount}/month`,
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
              setShowPayment(false);
              if (plan === 'single') {
                generateATSResumeWithAI();
              } else {
                alert("Pro membership activated! You now have unlimited resume generation.");
                setGeneratedCount(0);
              }
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
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (formattedResume) {
      navigator.clipboard.writeText(formattedResume);
    }
  };

  const downloadResume = () => {
    if (formattedResume) {
      const blob = new Blob([formattedResume], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ATS_Resume_${targetRole.replace(/\s+/g, '_') || 'Professional'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const downloadAsWord = () => {
    if (!formattedResume) return;
    
    // Simple HTML to DOC conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #1e293b; }
          h3 { color: #1e293b; border-bottom: 2px solid #1e293b; padding-bottom: 5px; }
          .header { background: linear-gradient(to right, #1e293b, #0f172a); color: white; padding: 24px; margin: -40px -40px 20px -40px; }
          .footer { background: #f1f5f9; padding: 8px 24px; margin: 20px -40px -40px -40px; border-top: 1px solid #cbd5e1; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${targetRole || 'Professional Resume'}</h1>
          <p>${targetCompany ? `Targeting: ${targetCompany}` : 'ATS-Optimized'}</p>
          <p>${industry ? `📍 ${industry}` : ''} ${seniority ? `💼 ${seniority}` : ''}</p>
        </div>
        ${skills ? `<h3>Key Skills</h3><p>${skills}</p>` : ''}
        ${experience ? `<h3>Work Experience</h3>${experience.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('')}` : ''}
        ${education ? `<h3>Education</h3>${education.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('')}` : ''}
        ${achievements ? `<h3>Key Achievements</h3>${achievements.split('\n').filter(l => l.trim()).map(l => `<p>${l}</p>`).join('')}` : ''}
        <div class="footer">
          <p>Generated by ATRact Resume Formatter | ATS-Optimized</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Resume_${targetRole.replace(/\s+/g, '_') || 'Professional'}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left Sidebar */}
      <LeftSidebar 
        app={app} 
        isPro={isPro}
        ads={ads}
        currentAd={currentAd}
        onUpgrade={() => setShowPayment(true)}
        onAdChange={setCurrentAd}
      />

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-80 p-4 lg:p-6">
        {/* Payment Modal */}
        {showPayment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-2xl">
                <div className="text-4xl mb-2">📄</div>
                <h3 className="text-2xl font-bold">Unlock Resume Formatting</h3>
                <p className="text-blue-100 text-sm mt-1">Choose your plan</p>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {/* Single Resume Option */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">Single Resume</div>
                        <div className="text-xs text-gray-500">One-time payment</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">₹99</div>
                    </div>
                    <button
                      onClick={() => handlePayment('single')}
                      disabled={paymentLoading}
                      className="w-full mt-2 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {paymentLoading ? "Processing..." : "Pay ₹99 - Format This Resume"}
                    </button>
                  </div>

                  {/* Pro Membership Option */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-400 relative">
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      BEST VALUE
                    </div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">Pro Membership</div>
                        <div className="text-xs text-gray-600">Unlimited resumes + premium features</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">₹499</div>
                        <div className="text-xs text-gray-500">/month</div>
                      </div>
                    </div>
                    <ul className="text-xs text-gray-700 space-y-1 mb-3">
                      <li className="flex items-center gap-1">
                        <span className="text-green-500">✓</span> Unlimited resume generation
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="text-green-500">✓</span> All format styles
                      </li>
                      <li className="flex items-center gap-1">
                        <span className="text-green-500">✓</span> Priority support
                      </li>
                    </ul>
                    <button
                      onClick={() => handlePayment('pro')}
                      disabled={paymentLoading}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {paymentLoading ? "Processing..." : "Upgrade to Pro - ₹499/month"}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowPayment(false)}
                  className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-gray-100 pb-3 lg:pb-4 -mx-4 lg:-mx-6 px-4 lg:px-6 pt-2">
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">{app?.name || "Resume Formatter Pro"}</h1>
          <p className="text-gray-600 text-sm lg:mt-1 hidden sm:block">{app?.valueProposition || "AI-Powered ATS-Optimized Resume Formatting"}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 lg:mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab("format")}
            className={`px-3 lg:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === "format"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            📝 Format Resume
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-3 lg:px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
              activeTab === "results"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 cursor-pointer"
            }`}
            disabled={!formattedResume}
          >
            📄 Results {formattedResume ? "" : "(0)"}
          </button>
        </div>

        {/* Format Tab */}
        {activeTab === "format" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-2 space-y-4 lg:space-y-6">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Target Information */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Target Role</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4 mb-4 lg:mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Job Title *</label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Senior React Developer"
                      className="w-full rounded-xl border border-gray-200 px-3 lg:px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Company</label>
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      placeholder="e.g. Google, Amazon"
                      className="w-full rounded-xl border border-gray-200 px-3 lg:px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. FinTech, E-commerce"
                      className="w-full rounded-xl border border-gray-200 px-3 lg:px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seniority Level</label>
                    <select
                      value={seniority}
                      onChange={(e) => setSeniority(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 lg:px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Entry-level / Fresher</option>
                      <option>Junior</option>
                      <option>Mid-level</option>
                      <option>Senior</option>
                      <option>Lead / Architect</option>
                      <option>Manager</option>
                      <option>Director / VP</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📁 Upload Resume (Optional)</h2>
                
                <div 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    isProcessing ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 cursor-pointer hover:border-blue-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                  {isProcessing ? (
                    <div>
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Processing file...</p>
                    </div>
                  ) : uploadedFileName ? (
                    <div>
                      <div className="text-4xl mb-2">✓</div>
                      <p className="text-sm text-green-600 font-semibold">{uploadedFileName}</p>
                      <p className="text-xs text-gray-400 mt-1">Click to upload another</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📄</div>
                      <p className="text-sm text-gray-600">
                        Click to upload or drag & drop<br/>
                        <span className="text-xs text-gray-400">PDF, DOC, DOCX, TXT (Max 5MB)</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resume Details */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Your Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Skills (comma-separated)</label>
                    <textarea
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      placeholder="e.g. JavaScript, React, Node.js, AWS, Leadership"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Experience</label>
                    <textarea
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="Paste your work experience or job descriptions..."
                      rows={6}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <textarea
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="Your degrees, certifications..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
                    <textarea
                      value={achievements}
                      onChange={(e) => setAchievements(e.target.value)}
                      placeholder="Notable accomplishments, projects, awards..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Format Options */}
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 lg:mb-4">🎨 Format Style</h2>
                
                <div className="grid grid-cols-3 gap-2 lg:gap-3">
                  {[
                    { value: 'modern', label: 'Modern', desc: 'Clean & current' },
                    { value: 'classic', label: 'Classic', desc: 'Traditional' },
                    { value: 'compact', label: 'Compact', desc: 'Dense layout' }
                  ].map(style => (
                    <button
                      key={style.value}
                      onClick={() => setFormatStyle(style.value)}
                      className={`px-2 lg:px-4 py-2 lg:py-3 rounded-xl border text-xs lg:text-sm font-medium transition-all ${
                        formatStyle === style.value
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="text-[10px] lg:text-xs text-gray-500 mt-1">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateATSResumeWithAI}
                disabled={(!targetRole && !experience) || isProcessing}
                className={`w-full py-3 lg:py-4 rounded-xl font-semibold transition-all ${
                  (targetRole || experience) && !isProcessing
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 lg:h-5 w-4 lg:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-sm lg:text-base">Formatting Resume...</span>
                  </span>
                ) : isPro ? (
                  <span className="text-sm lg:text-base">✨ Generate ATS-Optimized Resume</span>
                ) : (
                  <span className="text-sm lg:text-base">✨ Generate Resume ({generatedCount}/3 free)</span>
                )}
              </button>
            </div>

            {/* Sidebar */}
            <div className="space-y-4 lg:space-y-6">
              <MonetizationCard app={app} />
              
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{generatedCount}</div>
                    <div className="text-xs text-gray-500">Generated</div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Free Left</div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">How It Works</h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Enter target job details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Add your experience & skills</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Click Generate for ATS resume</span>
                  </li>
                </ol>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm p-6 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3">💡 ATS Tips</h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Use keywords from job description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Avoid tables, graphics, headers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Use standard section headings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Quantify with numbers and metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Keep formatting simple and clean</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-2 space-y-4 lg:space-y-6">
              {/* Resume Output */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">📄 Formatted Resume</h2>
                  {formattedResume && (
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </button>
                      <button
                        onClick={downloadResume}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        .TXT
                      </button>
                      <button
                        onClick={downloadAsWord}
                        className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        .DOC
                      </button>
                    </div>
                  )}
                </div>

                {/* A4 Resume Preview - Vertical Scroll Only */}
                <div className="bg-gray-200 rounded-xl p-2 lg:p-4 overflow-x-hidden max-h-[calc(150vh-100px)] lg:max-h-[calc(150vh-100px)] border border-gray-300">
                  {!formattedResume ? (
                    <div className="flex flex-col items-center justify-center text-gray-400" style={{ width: '100%', minHeight: '1100px', background: 'white' }}>
                      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 mt-8 lg:mt-32">
                        <svg className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="font-medium text-gray-600 mb-1 text-sm lg:text-base">No resume generated yet</p>
                      <p className="text-xs lg:text-sm text-center px-4">Fill in your details and click "Generate" to create your ATS-optimized resume</p>
                    </div>
                  ) : (
                    <div className="mx-auto shadow-lg bg-white" style={{ width: '100%', maxWidth: '800px', minHeight: '1100px' }}>
                      {/* Resume Header */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 lg:px-8 py-4 lg:py-6 text-white">
                        <h1 className="text-lg lg:text-2xl font-bold font-serif tracking-wide">{targetRole || "Professional Resume"}</h1>
                        <p className="text-slate-300 text-xs lg:text-sm mt-1">{targetCompany ? `Targeting: ${targetCompany}` : "ATS-Optimized"}</p>
                        <div className="flex flex-wrap gap-2 lg:gap-4 mt-3 lg:mt-4 text-xs text-slate-300">
                          {industry && <span>📍 {industry}</span>}
                          {seniority && <span>💼 {seniority}</span>}
                          <span>📄 Resume</span>
                        </div>
                      </div>
                      
                      {/* Resume Body */}
                      <div className="px-4 lg:px-8 py-4 lg:py-5 space-y-3 lg:space-y-4 text-xs lg:text-[10pt] text-slate-800 font-sans leading-relaxed">
                        {skills && (
                          <div className="mb-3 lg:mb-4">
                            <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-2">
                              Key Skills
                            </h3>
                            <p className="text-slate-700">{skills}</p>
                          </div>
                        )}
                        
                        {experience && (
                          <div className="mb-3 lg:mb-4">
                            <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-2">
                              Work Experience
                            </h3>
                            <div className="space-y-2 lg:space-y-3">
                              {experience.split('\n').filter(line => line.trim()).map((exp, idx) => (
                                <p key={idx} className="text-slate-700 text-justify">{exp}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {education && (
                          <div className="mb-3 lg:mb-4">
                            <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-2">
                              Education
                            </h3>
                            <div className="space-y-1 lg:space-y-2">
                              {education.split('\n').filter(line => line.trim()).map((edu, idx) => (
                                <p key={idx} className="text-slate-700">{edu}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {achievements && (
                          <div className="mb-3 lg:mb-4">
                            <h3 className="text-xs lg:text-sm font-bold text-slate-900 uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-2">
                              Key Achievements
                            </h3>
                            <div className="space-y-1 lg:space-y-2">
                              {achievements.split('\n').filter(line => line.trim()).map((ach, idx) => (
                                <p key={idx} className="text-slate-700 text-justify">{ach}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {formattedResume.split('\n').filter(line => line.trim()).map((line, idx) => {
                          const lower = line.toLowerCase();
                          if (lower.includes('skills') || lower.includes('experience') || 
                              lower.includes('education') || lower.includes('achievement') ||
                              lower.includes('key skills') || lower.includes('work experience')) {
                            return null;
                          }
                          
                          if (line.toUpperCase() === line && line.length > 3 && line.length < 50) {
                            return (
                              <div key={`header-${idx}`} className="mb-4">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b-2 border-slate-800 pb-1 mb-2">
                                  {line}
                                </h3>
                              </div>
                            );
                          }
                          
                          if (line.trim()) {
                            return (
                              <p key={idx} className="text-slate-700 text-justify">{line}</p>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      {/* Resume Footer */}
                      <div className="bg-slate-100 px-4 lg:px-8 py-2 border-t border-slate-300">
                        <div className="flex flex-col lg:flex-row justify-between items-center text-[8pt] lg:text-[9pt] text-slate-500 gap-1">
                          <p>Generated by ATRact Resume Formatter</p>
                          <p className="font-medium uppercase tracking-wider">ATS-Optimized</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MonetizationCard app={app} />
              
              {/* Resume Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Resume Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Target Role</span>
                    <span className="font-medium text-gray-900">{targetRole || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Company</span>
                    <span className="font-medium text-gray-900">{targetCompany || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry</span>
                    <span className="font-medium text-gray-900">{industry || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Seniority</span>
                    <span className="font-medium text-gray-900">{seniority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Style</span>
                    <span className="font-medium text-gray-900 capitalize">{formatStyle}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-sm p-6 border border-green-200">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  💡 ATS Tips
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Use keywords from job description</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Avoid tables, graphics, headers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Use standard section headings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Quantify with numbers and metrics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Keep formatting simple and clean</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

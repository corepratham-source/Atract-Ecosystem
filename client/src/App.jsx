import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EcosystemHubPage from "./pages/EcosystemHub";
import Dashboard from "./pages/Dashboard";
import MicroApp from "./pages/MicroApp";

// Individual micro-app pages
import ResumeScreenerPage from "./pages/ResumeScreener";
import ResumeScreenerLitePage from "./pages/ResumeScreenerLite";
import OfferLetterPage from "./pages/OfferLetter";
import FollowUpTrackerPage from "./pages/FollowUpTracker";
import PolicyBuilderPage from "./pages/PolicyBuilder";
import ExitInterviewPage from "./pages/ExitInterview";
import AttendanceTrackerPage from "./pages/AttendanceTracker";
import ResumeFormatterPage from "./pages/ResumeFormatter";

// Import standalone components
import InterviewQuestionGenerator from "./pages/InterviewQuestionGenerator";
import SalaryBenchmarkTool from "./pages/SalaryBenchmark";
import PerformanceReviewAnalyzer from "./pages/PerformanceReview";
import OfferLetterGenerator from "./pages/OfferLetterGenerator";
import HRPolicyBuilder from "./pages/HRPolicyBuilder";
import ExitInterviewAnalyzer from "./pages/ExitInterviewAnalyzer";
import ExitInterviewGenerator from "./pages/ExitInterviewGenerator";

// Micro apps data
import { microApps } from "./data/microApps";

const resumeScreenerApp = microApps.find((a) => a.id === "resume-screener");
const interviewQuestionsApp = microApps.find((a) => a.id === "interview-questions");
const salaryBenchmarkApp = microApps.find((a) => a.id === "salary-benchmark");
const performanceReviewApp = microApps.find((a) => a.id === "performance-review");
const offerLetterApp = microApps.find((a) => a.id === "offer-letter");
const policyBuilderApp = microApps.find((a) => a.id === "policy-builder");
const exitInterviewApp = microApps.find((a) => a.id === "exit-interview");
const exitInterviewGeneratorApp = microApps.find((a) => a.id === "exit-interview-generator");

function App() {
  const isPro = false; // This can be connected to auth/state later

  return (
    <Router>
      <Routes>
        <Route path="/" element={<EcosystemHubPage isPro={isPro} />} />
        <Route path="/dashboard" element={<Dashboard isPro={isPro} />} />

        {/* Specific routes FIRST (before dynamic route) */}
        <Route 
          path="/apps/resume-screener-lite" 
          element={<ResumeScreenerLitePage app={resumeScreenerApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/interview-questions" 
          element={<InterviewQuestionGenerator app={interviewQuestionsApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/salary-benchmark" 
          element={<SalaryBenchmarkTool app={salaryBenchmarkApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/performance-review" 
          element={<PerformanceReviewAnalyzer app={performanceReviewApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/offer-letter" 
          element={<OfferLetterGenerator app={offerLetterApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/policy-builder" 
          element={<HRPolicyBuilder app={policyBuilderApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/exit-interview-analyzer" 
          element={<ExitInterviewAnalyzer app={exitInterviewApp} isPro={isPro} />} 
        />
        <Route 
          path="/apps/exit-interview-generator" 
          element={<ExitInterviewGenerator app={exitInterviewGeneratorApp} isPro={isPro} />} 
        />

        {/* Other micro-apps using MicroApp wrapper - specific routes */}
        <Route path="/apps/resume-screener" element={<ResumeScreenerPage />} />
        {/* <Route path="/apps/offer-letter" element={<OfferLetterPage />} /> */}
        {/* <Route path="/apps/policy-builder" element={<PolicyBuilderPage />} /> */}
        <Route path="/apps/follow-up-tracker" element={<FollowUpTrackerPage isPro={isPro} />} />
        <Route path="/apps/exit-interview" element={<ExitInterviewPage isPro={isPro} />} />
        <Route path="/apps/attendance-tracker" element={<AttendanceTrackerPage isPro={isPro} />} />
        <Route path="/apps/resume-formatter" element={<ResumeFormatterPage isPro={isPro} />} />

        {/* Fallback dynamic route LAST (catches any other /apps/:appId) */}
        <Route path="/apps/:appId" element={<MicroApp isPro={isPro} />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

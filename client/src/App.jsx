import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, getStoredUser } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerAppPage from "./pages/CustomerAppPage";
import CustomerLayout from "./components/CustomerLayout";
import CustomerMicroAppShell from "./components/CustomerMicroAppShell";

import EcosystemHubPage from "./pages/EcosystemHub";
import Dashboard from "./pages/Dashboard";
import MicroApp from "./pages/MicroApp";
import ResumeScreenerPage from "./pages/ResumeScreener";
import ResumeScreenerLitePage from "./pages/ResumeScreenerLite";
import OfferLetterPage from "./pages/OfferLetter";
import FollowUpTrackerPage from "./pages/FollowUpTracker";
import PolicyBuilderPage from "./pages/PolicyBuilder";
import ExitInterviewPage from "./pages/ExitInterview";
import AttendanceTrackerPage from "./pages/AttendanceTracker";
import ResumeFormatterPage from "./pages/ResumeFormatter";
import InterviewQuestionGenerator from "./pages/InterviewQuestionGenerator";
import SalaryBenchmarkTool from "./pages/SalaryBenchmark";
import PerformanceReviewAnalyzer from "./pages/PerformanceReview";
import OfferLetterGenerator from "./pages/OfferLetterGenerator";
import HRPolicyBuilder from "./pages/HRPolicyBuilder";
import ExitInterviewAnalyzer from "./pages/ExitInterviewAnalyzer";
import ExitInterviewGenerator from "./pages/ExitInterviewGenerator";
import { microApps } from "./data/microApps";

const resumeScreenerApp = microApps.find((a) => a.id === "resume-screener");
const interviewQuestionsApp = microApps.find((a) => a.id === "interview-questions");
const salaryBenchmarkApp = microApps.find((a) => a.id === "salary-benchmark");
const performanceReviewApp = microApps.find((a) => a.id === "performance-review");
const offerLetterApp = microApps.find((a) => a.id === "offer-letter");
const policyBuilderApp = microApps.find((a) => a.id === "policy-builder");
const exitInterviewApp = microApps.find((a) => a.id === "exit-interview");
const exitInterviewGeneratorApp = microApps.find((a) => a.id === "exit-interview-generator");

const isPro = false;

function RootRedirect() {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/customer" replace />;
}

/**
 * Customer Dashboard - Full width, no ads
 */
function CustomerDashboardRoute() {
  return (
    <CustomerLayout>
      <CustomerDashboard />
    </CustomerLayout>
  );
}

/**
 * Customer App Pages - Ads on LEFT, Content on RIGHT
 */
function CustomerAppRoute() {
  return <CustomerAppPage />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          <Route index element={<EcosystemHubPage isPro={isPro} />} />
          <Route path="dashboard" element={<Dashboard isPro={isPro} />} />
          <Route path="apps/resume-screener-lite" element={<ResumeScreenerLitePage app={resumeScreenerApp} isPro={isPro} />} />
          <Route path="apps/interview-questions" element={<InterviewQuestionGenerator app={interviewQuestionsApp} isPro={isPro} />} />
          <Route path="apps/salary-benchmark" element={<SalaryBenchmarkTool app={salaryBenchmarkApp} isPro={isPro} />} />
          <Route path="apps/performance-review" element={<PerformanceReviewAnalyzer app={performanceReviewApp} isPro={isPro} />} />
          <Route path="apps/offer-letter" element={<OfferLetterGenerator app={offerLetterApp} isPro={isPro} />} />
          <Route path="apps/policy-builder" element={<HRPolicyBuilder app={policyBuilderApp} isPro={isPro} />} />
          <Route path="apps/exit-interview-analyzer" element={<ExitInterviewAnalyzer app={exitInterviewApp} isPro={isPro} />} />
          <Route path="apps/exit-interview-generator" element={<ExitInterviewGenerator app={exitInterviewGeneratorApp} isPro={isPro} />} />
          <Route path="apps/resume-screener" element={<ResumeScreenerPage />} />
          <Route path="apps/follow-up-tracker" element={<FollowUpTrackerPage isPro={isPro} />} />
          <Route path="apps/exit-interview" element={<ExitInterviewPage isPro={isPro} />} />
          <Route path="apps/attendance-tracker" element={<AttendanceTrackerPage isPro={isPro} />} />
          <Route path="apps/resume-formatter" element={<ResumeFormatterPage isPro={isPro} />} />
          <Route path="apps/:appId" element={<MicroApp isPro={isPro} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Customer Dashboard - Full width, no sidebar, no ads */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerLayout showSidebar={false}>
                <CustomerDashboard />
              </CustomerLayout>
            </ProtectedRoute>
          }
        />

        {/* Customer Apps - Ads on LEFT, Content on RIGHT */}
        <Route
          path="/customer/apps/:appId"
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerAppPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Router>
  );
}

export default App;

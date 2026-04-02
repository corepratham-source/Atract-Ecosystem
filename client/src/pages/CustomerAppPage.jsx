import { useParams, Navigate } from "react-router-dom";
import { microApps } from "../data/microApps";

import ResumeScreenerLitePage from "./ResumeScreenerLite";
import InterviewQuestionGenerator from "./InterviewQuestionGenerator";
import SalaryBenchmarkTool from "./SalaryBenchmark";
import PerformanceReviewAnalyzer from "./PerformanceReview";
import OfferLetterGenerator from "./OfferLetterGenerator";
import HRPolicyBuilder from "./HRPolicyBuilder";
import ExitInterviewAnalyzer from "./ExitInterviewAnalyzer";
import ExitInterviewGenerator from "./ExitInterviewGenerator";
import ResumeScreenerPage from "./ResumeScreener";
import FollowUpTrackerPage from "./FollowUpTracker";
import ExitInterviewPage from "./ExitInterview";
import AttendanceTrackerPage from "./AttendanceTracker";
import ResumeFormatterPage from "./ResumeFormatter";
import ResumeLite from "./ResumeLite";
import MicroApp from "./MicroApp";

const isPro = false;

const appById = (id) => microApps.find((a) => a.id === id);

const CUSTOMER_APP_MAP = {
  "resume-screener-lite": { app: () => appById("resume-screener"), Component: ResumeScreenerLitePage },
  "resume-lite": { app: () => ({ id: "resume-lite", name: "ResumeLite", valueProposition: "AI-Powered Multiple Resume Analysis & Scoring", pricing: "Powered by Groq AI", icon: "📊" }), Component: ResumeLite },
  "interview-questions": { app: () => appById("interview-questions"), Component: InterviewQuestionGenerator },
  "salary-benchmark": { app: () => appById("salary-benchmark"), Component: SalaryBenchmarkTool },
  "performance-review": { app: () => appById("performance-review"), Component: PerformanceReviewAnalyzer },
  "offer-letter": { app: () => appById("offer-letter"), Component: OfferLetterGenerator },
  "policy-builder": { app: () => appById("policy-builder"), Component: HRPolicyBuilder },
  "exit-interview-analyzer": { app: () => appById("exit-interview"), Component: ExitInterviewAnalyzer },
  "exit-interview-generator": { app: () => appById("exit-interview"), Component: ExitInterviewGenerator },
  "resume-screener": { app: () => appById("resume-screener"), Component: ResumeScreenerPage },
  "follow-up-tracker": { app: () => appById("follow-up-tracker"), Component: FollowUpTrackerPage },
  "exit-interview": { app: () => appById("exit-interview"), Component: ExitInterviewPage },
  "attendance-tracker": { app: () => appById("attendance-tracker"), Component: AttendanceTrackerPage },
  "resume-formatter": { app: () => appById("resume-formatter"), Component: ResumeFormatterPage },
};

/**
 * Customer App Page
 * 
 * This component renders customer micro apps.
 * Each micro app uses LeftSidebar (ads + back to dashboard) on the LEFT
 * and content on the RIGHT.
 */
export default function CustomerAppPage() {
  const { appId } = useParams();
  const config = CUSTOMER_APP_MAP[appId];
  const app = appById(appId) || (config?.app && config.app());

  if (config?.Component) {
    // Render the micro app - it uses LeftSidebar internally
    const Comp = config.Component;
    return <Comp app={app} isPro={isPro} />;
  }

  if (app) {
    // Fallback: generic micro app view with AdsSidebar
    return <MicroApp appId={appId} isPro={isPro} isCustomer />;
  }

  return <Navigate to="/customer" replace />;
}

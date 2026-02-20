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
import MicroApp from "./MicroApp";

const isPro = false;

const appById = (id) => microApps.find((a) => a.id === id);

const CUSTOMER_APP_MAP = {
  "resume-screener-lite": { app: () => appById("resume-screener"), Component: ResumeScreenerLitePage },
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
 * Each micro app uses CustomerMicroAppShell which shows:
 * - Ads sidebar on the LEFT
 * - Content on the RIGHT
 */
export default function CustomerAppPage() {
  const { appId } = useParams();
  const config = CUSTOMER_APP_MAP[appId];
  const app = appById(appId) || (config?.app && config.app());

  if (config?.Component) {
    // Render the micro app - it will use CustomerMicroAppShell internally
    const Comp = config.Component;
    return <Comp app={app} isPro={isPro} />;
  }

  if (app) {
    // Fallback: generic micro app view
    return <MicroApp appId={appId} isPro={isPro} />;
  }

  return <Navigate to="/customer" replace />;
}

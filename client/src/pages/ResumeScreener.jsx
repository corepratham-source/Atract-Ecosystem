import ResumeScreenerLite from "./ResumeScreenerLite";
import { microApps } from "../data/microApps";

const resumeScreenerApp = microApps.find((a) => a.id === "resume-screener");

export default function ResumeScreenerPage() {
  return <ResumeScreenerLite app={resumeScreenerApp} isPro={false} />;
}

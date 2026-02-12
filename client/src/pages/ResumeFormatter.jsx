import ResumeFormatterPro from "./ResumeFormatterPro";
import { microApps } from "../data/microApps";

const resumeFormatterApp = microApps.find((a) => a.id === "resume-formatter");

export default function ResumeFormatterPage({ isPro = false }) {
  return <ResumeFormatterPro app={resumeFormatterApp} isPro={isPro} />;
}

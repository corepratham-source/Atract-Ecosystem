import ExitInterviewAnalyzer from "./ExitInterviewAnalyzer";
import { microApps } from "../data/microApps";

const exitInterviewApp = microApps.find((a) => a.id === "exit-interview");

export default function ExitInterviewPage({ isPro = false }) {
  return <ExitInterviewAnalyzer app={exitInterviewApp} isPro={isPro} />;
}

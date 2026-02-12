import { microApps } from "../data/microApps";
import CandidateFollowUpTracker from "./CandidateFollowUpTracker";

const followUpApp = microApps.find((a) => a.id === "follow-up-tracker");

export default function FollowUpTrackerPage({ isPro = false }) {
  return <CandidateFollowUpTracker app={followUpApp} isPro={isPro} />;
}



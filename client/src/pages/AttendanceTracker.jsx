import AttendanceExceptionTracker from "./AttendanceExceptionTracker";
import { microApps } from "../data/microApps";

const attendanceApp = microApps.find((a) => a.id === "attendance-tracker");

export default function AttendanceTrackerPage({ isPro = false }) {
  return <AttendanceExceptionTracker app={attendanceApp} isPro={isPro} />;
}

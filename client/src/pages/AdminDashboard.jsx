import { Outlet } from "react-router-dom";

/** Admin layout: renders nested admin routes (hub, dashboard, apps) from App.jsx. No nested Router. */
export default function AdminDashboard() {
  return <Outlet />;
}

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { microApps } from "../data/microApps";
import LeftSidebar from "../components/LeftSidebar";

const appById = (id) => microApps.find((a) => a.id === id);

export default function MicroApp({ appId: forcedAppId, isPro = false }) {
  const params = useParams();
  const appId = forcedAppId || params.appId;
  const app = useMemo(() => appById(appId), [appId]);

  if (!app) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <LeftSidebar app={{ name: "App not found", valueProposition: "This micro-app does not exist" }} isPro={isPro} />
        <div className="flex-1 ml-80 p-6">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-sm text-slate-600">
            <h2 className="text-xl font-bold text-gray-900 mb-4">App not found</h2>
            <p>This micro-app does not exist in the ecosystem list.</p>
            <p className="mt-2">Check <code>src/data/microApps.js</code> and ensure the route id matches.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPro} />
      <div className="flex-1 ml-80 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-shadow duration-200 hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h2>
            <p className="text-sm text-slate-600 mb-4">{app.valueProposition}</p>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mb-4">
              {app.status}
            </div>
            <p className="text-sm text-slate-600">
              This micro‑app is designed as a focused tool. Content will be added soon.
            </p>
            <div className="mt-4 text-sm text-slate-500">
              Pricing: {app.pricing}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

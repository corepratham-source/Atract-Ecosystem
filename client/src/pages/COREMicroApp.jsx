import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { microApps } from "../data/microApps";
import CORELeftSidebar from "../components/CORELeftSidebar";
import MicroAppRightLayout from "../components/MicroAppRightLayout";

const appById = (id) => microApps.find((a) => a.id === id);

/**
 * COREMicroApp - CORE-themed wrapper for micro-apps
 * This component wraps individual micro-apps with CORE branding and colors
 * Uses CORELeftSidebar instead of regular LeftSidebar for consistent CORE branding
 */
export default function COREMicroApp({ appId: forcedAppId, isPro = false, isCustomer = false }) {
  const params = useParams();
  const appId = forcedAppId || params.appId;
  const app = useMemo(() => appById(appId), [appId]);

  const notFoundApp = { name: "App not found", valueProposition: "This micro-app does not exist" };
  const notFoundContent = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 text-sm text-[#9E9E9E]">
        <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">App not found</h2>
        <p>This micro-app does not exist in the CORE ecosystem.</p>
        <p className="mt-2">Check <code className="bg-[#F5F5F5] px-2 py-1">src/data/microApps.js</code> and ensure the route id matches.</p>
      </div>
    </div>
  );

  if (!app) {
    if (isCustomer) {
      return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
          <CORELeftSidebar app={notFoundApp} isPro={isPro} backTo="/customer" />
          <div className="flex-1 ml-80 min-h-screen overflow-y-auto">
            {notFoundContent}
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen bg-[#F5F5F5]">
        <CORELeftSidebar app={notFoundApp} isPro={isPro} />
        <MicroAppRightLayout app={notFoundApp}>
          {notFoundContent}
        </MicroAppRightLayout>
      </div>
    );
  }

  if (isCustomer) {
    return (
      <div className="flex min-h-screen bg-[#F5F5F5]">
        <CORELeftSidebar app={app} isPro={isPro} backTo="/customer" />
        <div className="flex-1 ml-80 min-h-screen overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 transition-shadow duration-200 hover:shadow-md mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">{app.name}</h2>
                  <p className="text-sm text-[#9E9E9E] mb-4">{app.valueProposition}</p>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ml-4 ${
                  app.status === "Live"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"

                }`}>
                  {app.status}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Overview</h3>
                  <p className="text-sm text-[#9E9E9E]">
                    This micro-app is a powerful CORE tool designed to streamline your HR operations. Content and features will be added soon.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Pricing</h3>
                  <p className="text-sm text-[#9E9E9E] font-medium">{app.pricing}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Category</h3>
                  <p className="text-sm text-[#9E9E9E]">{app.category}</p>
                </div>
                {app.audience && (
                  <div>
                    <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Target Audience</h3>
                    <p className="text-sm text-[#9E9E9E]">{app.audience}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5]">
      <CORELeftSidebar app={app} isPro={isPro} />
      <MicroAppRightLayout app={app}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border-2 border-[#E0E0E0] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] p-6 transition-shadow duration-200 hover:shadow-md mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">{app.name}</h2>
                <p className="text-sm text-[#9E9E9E] mb-4">{app.valueProposition}</p>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ml-4 ${
                app.status === "Live"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-[#FFEBEE] text-[#E53935]"
              }`}>
                {app.status}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Overview</h3>
                <p className="text-sm text-[#9E9E9E]">
                  This micro-app is a powerful CORE tool designed to streamline your HR operations.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Pricing</h3>
                <p className="text-sm text-[#9E9E9E] font-medium">{app.pricing}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Category</h3>
                <p className="text-sm text-[#9E9E9E]">{app.category}</p>
              </div>
              {app.audience && (
                <div>
                  <h3 className="text-sm font-semibold text-[#4A4A4A] mb-2">Target Audience</h3>
                  <p className="text-sm text-[#9E9E9E]">{app.audience}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </MicroAppRightLayout>
    </div>
  );
}

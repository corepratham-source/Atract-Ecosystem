import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { microApps } from "../data/microApps";
import LeftSidebar from "../components/LeftSidebar";
import MicroAppRightLayout from "../components/MicroAppRightLayout";
import MonetizationCard from "../components/MonetizationCard";

const appById = (id) => microApps.find((a) => a.id === id);

const ads = [
  {
    title: "🎯 Never Miss a Follow-up",
    text: "Organize candidate pipelines effortlessly",
    button: "Try Free"
  },
  {
    title: "📊 Data-Driven Decisions",
    text: "Get insights from your HR workflows",
    button: "Learn More"
  },
  {
    title: "🚀 Accelerate Growth",
    text: "Build a smarter HR operation today",
    button: "Explore"
  }
];

export default function MicroApp({ appId: forcedAppId, isPro = false, isCustomer = false }) {
  const params = useParams();
  const appId = forcedAppId || params.appId;
  const app = useMemo(() => appById(appId), [appId]);

  const notFoundApp = { name: "App not found", valueProposition: "This micro-app does not exist" };
  const notFoundContent = (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 text-sm text-slate-600">
        <h2 className="text-xl font-bold text-gray-900 mb-4">App not found</h2>
        <p>This micro-app does not exist in the ecosystem list.</p>
        <p className="mt-2">Check <code>src/data/microApps.js</code> and ensure the route id matches.</p>
      </div>
    </div>
  );

  if (!app) {
    if (isCustomer) {
      return (
        <div className="flex min-h-screen bg-gray-100">
          <LeftSidebar app={notFoundApp} isPro={isPro} backTo="/customer" />
          <div className="flex-1 ml-80 min-h-screen overflow-y-auto">
            {notFoundContent}
          </div>
        </div>
      );
    }
    return (
      <div className="flex min-h-screen bg-gray-100">
        <LeftSidebar app={notFoundApp} isPro={isPro} />
        <MicroAppRightLayout app={notFoundApp}>
          {notFoundContent}
        </MicroAppRightLayout>
      </div>
    );
  }

  if (isCustomer) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <LeftSidebar app={app} isPro={isPro} backTo="/customer" />
        <div className="flex-1 ml-80 min-h-screen overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-shadow duration-200 hover:shadow-md mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{app.name}</h2>
                  <p className="text-sm text-slate-600 mb-4">{app.valueProposition}</p>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap ml-4">
                  {app.status}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Overview</h3>
                  <p className="text-sm text-slate-600">
                    This micro‑app is designed as a focused tool to help streamline your HR operations. Content and features will be added soon.
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Pricing</h3>
                  <p className="text-sm text-slate-600">{app.pricing}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Category</h3>
                  <p className="text-sm text-slate-600">{app.category}</p>
                </div>
                {app.audience && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Target Audience</h3>
                    <p className="text-sm text-slate-600">{app.audience}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
            <MonetizationCard title="Monetization Strategy" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <LeftSidebar app={app} isPro={isPro} />
      <MicroAppRightLayout app={app}>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 transition-shadow duration-200 hover:shadow-md mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{app.name}</h2>
                <p className="text-sm text-slate-600 mb-4">{app.valueProposition}</p>
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 whitespace-nowrap ml-4">
                {app.status}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-sm text-slate-600">
                  This micro‑app is designed as a focused tool to help streamline your HR operations. 
                  Content and features will be added soon.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Pricing</h3>
                <p className="text-sm text-slate-600">
                  {app.pricing}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Category</h3>
                <p className="text-sm text-slate-600">
                  {app.category}
                </p>
              </div>

              {app.audience && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Target Audience</h3>
                  <p className="text-sm text-slate-600">
                    {app.audience}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  Coming Soon
                </button>
              </div>
            </div>
          </div>

          {/* Monetization Card */}
          <MonetizationCard title="Monetization Strategy" />
        </div>
      </MicroAppRightLayout>
    </div>
  );
}

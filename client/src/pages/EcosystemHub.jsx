import { useNavigate } from "react-router-dom";
import EcosystemHubComponent from "../components/EcosystemHub";
import HomeSidebar from "../components/HomeSidebar";

const homeApp = {
  valueProposition: "A portfolio of focused micro-products for HR-tech and professionals."
};

export default function EcosystemHubPage({ isPro = false }) {
  const navigate = useNavigate();
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <HomeSidebar app={homeApp} isPro={isPro} />
      <div className="flex-1 ml-80 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Fixed Header */}
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-100 py-4 z-10">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ecosystem Hub</h1>
              <p className="text-sm text-slate-600">A portfolio of focused micro-products for HR-tech and professionals.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800"
            >
              Control Tower
            </button>
          </div>
          
          <EcosystemHubComponent onNavigateToDashboard={() => navigate("/dashboard")} />
        </div>
      </div>
    </div>
  );
}

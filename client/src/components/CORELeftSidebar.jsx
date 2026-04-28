import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MonetizationCard from "./MonetizationCard";
import CORELogo from "./CORELogo";
import { ADMIN_BASE } from "../config/routes";
import { STORAGE_KEY } from "../constants/user";
import { AuthContext } from "../context/AuthContext";

const googleAds = [
  {
    id: 1,
    title: "Hire Smarter with AI Recruiting",
    description: "Find qualified candidates in minutes. AI-powered screening saves time.",
    domain: "recruiter-ai.com",
    cta: "Try Free",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop",
    badge: "Ad"
  },
  {
    id: 2,
    title: "Streamline Your HR Workflow",
    description: "All-in-one HR platform for modern businesses. Manage employees effortlessly.",
    domain: "hr-solution.io",
    cta: "Learn More",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop",
    badge: "Ad"
  },
  {
    id: 3,
    title: "Professional Certification Courses",
    description: "Advance your career with industry-recognized certifications. 50% off today.",
    domain: "careerboost.com",
    cta: "Get Started",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop",
    badge: "Ad"
  },
  {
    id: 4,
    title: "Remote Team Management Tools",
    description: "Collaborate better with your distributed team. Free trial available.",
    domain: "remote-tools.com",
    cta: "Explore",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=200&fit=crop",
    badge: "Ad"
  },
  {
    id: 5,
    title: "Leadership Development Program",
    description: "Develop essential leadership skills. Certified by top universities.",
    domain: "leadership-academy.org",
    cta: "Apply Now",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop",
    badge: "Ad"
  }
];

/**
 * CORELeftSidebar - CORE-themed sidebar for individual micro-apps
 * This component displays the CORE branding with micro-app information and ads
 * Preserves Google Ads functionality while applying CORE colors
 * 
 * @param {string} [backTo] - Optional path for Back button (e.g. "/customer" or "/core-dashboard"). If not set, uses home page.
 */
export default function CORELeftSidebar({ app, isPro = false, isOpen, onClose, backTo }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const backPath = backTo != null ? backTo : "/core-dashboard";
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % googleAds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAdClick = () => {
    console.log("Ad clicked:", googleAds[currentAd].title);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.log("Logout error (may not be logged in):", err.message);
    }
    // Clear local storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("atract_token");
    sessionStorage.removeItem(STORAGE_KEY);
    navigate("/login", { replace: true });
  };

  const ad = googleAds[currentAd];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`w-80 bg-white shadow-lg fixed left-0 top-0 h-screen flex flex-col border-r-2 border-red-100 z-30 transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Fixed Header - Back button & App Name */}
        <div className="flex-shrink-0">
          <div className="p-4 border-b-2 border-red-100 flex items-center justify-between gap-2 bg-gradient-to-r from-red-50 to-white">
            <button
              onClick={() => { onClose?.(); navigate(backPath); }}
              className="flex items-center text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* CORE Logo Header */}
          <div className="p-4 border-b-2 border-red-100 bg-white">
            <CORELogo size="sm" showText={true} />
          </div>
          
          {/* Fixed App Name */}
          <div className="p-6 border-b-2 border-red-100 bg-gradient-to-br from-red-50 to-white">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{app.icon || '📱'}</span>
              <h1 className="text-lg font-bold text-gray-900">{app.name}</h1>
            </div>
            <p className="text-sm text-gray-600">{app.valueProposition}</p>
          </div>
        </div>
        
        {/* Scrollable Content - Ads (free users only) & Monetization Card */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-transparent">
          {/* Ads: show only for free users; hidden when user has subscription (isPro) */}
          {!isPro && (
            <div className="p-4 border-b-2 border-red-100 bg-red-50">
              <p className="text-xs font-bold text-red-600 mb-2 uppercase tracking-wider">Featured</p>
              <div 
                className="bg-white border-2 border-red-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-red-300"
                onClick={handleAdClick}
              >
                {/* Ad image */}
                <div className="relative h-32 bg-gray-100">
                  <img 
                    src={ad.image} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Ad badge */}
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    {ad.badge}
                  </div>
                </div>
                
                {/* Ad content */}
                <div className="p-3">
                  <div className="text-xs text-red-600 font-semibold mb-1">{ad.domain}</div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1">
                    {ad.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {ad.description}
                  </p>
                  <button className="w-full py-1.5 bg-red-500 text-white text-sm font-bold rounded hover:bg-red-600 transition-colors">
                    {ad.cta}
                  </button>
                </div>
              </div>
              
              {/* Ad indicators */}
              <div className="flex justify-center gap-1 mt-3">
                {googleAds.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentAd(i)}
                    className={`transition-all ${
                      i === currentAd 
                        ? "bg-red-500 w-6 h-2 rounded-full" 
                        : "bg-red-200 w-2 h-2 rounded-full hover:bg-red-300"
                    }`}
                    aria-label={`Go to ad ${i + 1}`}
                  />
                ))}
              </div>
              
              {/* CORE-style info */}
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500">
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Promoted by CORE</span>
              </div>
            </div>
          )}
          
          {/* Monetization Card */}
          <div className="p-4">
            <MonetizationCard app={app} />
          </div>
          
          {/* Pro Badge for pro users */}
          {isPro && (
            <div className="p-4">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white text-center shadow-md">
                <div className="text-2xl mb-1">⭐</div>
                <div className="font-bold">Pro Member</div>
                <div className="text-sm opacity-90">Unlimited Access to CORE Apps</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t-2 border-red-100 text-center text-xs text-gray-500">
          <p>© 2024 CORE Careers Private Limited</p>
        </div>
      </div>
    </>
  );
}

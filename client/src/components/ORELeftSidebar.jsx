import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MonetizationCard from "./MonetizationCard";
import OReLogo from "./OReLogo";
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
 * ORELeftSidebar - ORE-themed sidebar for individual micro-apps
 * This component displays the ORE branding with micro-app information and ads
 * Preserves Google Ads functionality while applying ORE colors
 * 
 * @param {string} [backTo] - Optional path for Back button (e.g. "/customer" or "/ore-dashboard"). If not set, uses home page.
 */
export default function ORELeftSidebar({ app, isPro = false, isOpen, onClose, backTo }) {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const backPath = backTo != null ? backTo : "/ore-dashboard";
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
        className={`w-80 bg-white shadow-lg fixed left-0 top-0 h-screen flex flex-col border-r-2 border-[#E0E0E0] z-30 transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Fixed Header - Back button & App Name */}
        <div className="flex-shrink-0">
          <div className="p-4 border-b-2 border-[#E0E0E0] flex items-center justify-between gap-2 bg-[#F5F5F5]">
            <button
              onClick={() => { onClose?.(); navigate(backPath); }}
              className="flex items-center text-[#E53935] hover:text-[#C62828] font-medium text-sm transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-[#4A4A4A] hover:text-[#E53935] px-2 py-1 rounded-lg hover:bg-[#FFEBEE] transition-colors"
            >
              Logout
            </button>
          </div>

          {/* ORE Logo Header */}
          <div className="p-4 border-b-2 border-[#E0E0E0] bg-white">
            <OReLogo size="sm" showText={true} />
          </div>
          
          {/* Fixed App Name */}
          <div className="p-6 border-b-2 border-[#E0E0E0] bg-[#F5F5F5]">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{app.icon || '📱'}</span>
              <h1 className="text-lg font-bold text-[#4A4A4A]">{app.name}</h1>
            </div>
            <p className="text-sm text-[#9E9E9E]">{app.valueProposition}</p>
          </div>
        </div>
        
        {/* Scrollable Content - Ads (free users only) & Monetization Card */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#E0E0E0] scrollbar-track-transparent">
          {/* Ads: show only for free users; hidden when user has subscription (isPro) */}
          {!isPro && (
            <div className="p-4 border-b-2 border-[#E0E0E0] bg-[#F5F5F5]">
              <p className="text-xs font-bold text-[#E53935] mb-2 uppercase tracking-wider">Featured</p>
              <div 
                className="bg-white border-2 border-[#E0E0E0] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-[#E53935]"
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
                  <div className="absolute top-2 right-2 bg-[#E53935] text-white px-2 py-0.5 rounded text-xs font-bold">
                    {ad.badge}
                  </div>
                </div>
                
                {/* Ad content */}
                <div className="p-3">
                  <div className="text-xs text-[#E53935] font-semibold mb-1">{ad.domain}</div>
                  <h3 className="font-bold text-[#4A4A4A] text-sm leading-tight mb-1">
                    {ad.title}
                  </h3>
                  <p className="text-xs text-[#9E9E9E] line-clamp-2 mb-2">
                    {ad.description}
                  </p>
                  <button className="w-full py-1.5 bg-[#E53935] text-white text-sm font-bold rounded hover:bg-[#C62828] transition-colors">
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
                        ? "bg-[#E53935] w-6 h-2 rounded-full" 
                        : "bg-[#E0E0E0] w-2 h-2 rounded-full hover:bg-[#9E9E9E]"
                    }`}
                    aria-label={`Go to ad ${i + 1}`}
                  />
                ))}
              </div>
              
              {/* ORE-style info */}
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-[#9E9E9E]">
                <svg className="w-4 h-4 text-[#E53935]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>Promoted by ORE</span>
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
              <div className="bg-[#E53935] rounded-xl p-4 text-white text-center shadow-md">
                <div className="text-2xl mb-1">⭐</div>
                <div className="font-bold">Pro Member</div>
                <div className="text-sm opacity-90">Unlimited Access to ORE Apps</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t-2 border-[#E0E0E0] text-center text-xs text-[#9E9E9E]">
          <p>© 2024 ORE Careers Private Limited</p>
        </div>
      </div>
    </>
  );
}

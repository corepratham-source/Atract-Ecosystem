import { useState, useEffect } from "react";
import MonetizationCard from "./MonetizationCard";

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

export default function HomeSidebar({ app, isPro = false }) {
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

  const ad = googleAds[currentAd];

  return (
    <div className="w-80 bg-white shadow-lg fixed left-0 top-0 h-screen flex flex-col border-r border-gray-200 z-10">
      {/* Fixed Header - ATRact Logo */}
      <div className="flex-shrink-0">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">ATRact</h1>
          <p className="text-sm text-gray-500 mt-1">{app?.valueProposition || "HR-Tech Micro Apps"}</p>
        </div>
      </div>
      
      {/* Scrollable Content - Only Ads & Monetization Card */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Google AdSense Style Ad - Only for non-pro users */}
        {!isPro && (
          <div className="p-4">
            <div 
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                  {ad.badge}
                </div>
              </div>
              
              {/* Ad content */}
              <div className="p-3">
                <div className="text-xs text-gray-500 mb-1">{ad.domain}</div>
                <h3 className="font-semibold text-gray-900 text-base leading-tight mb-1">
                  {ad.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {ad.description}
                </p>
                <button className="w-full py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors">
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
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentAd 
                      ? "bg-blue-600 w-6" 
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to ad ${i + 1}`}
                />
              ))}
            </div>
            
            {/* Google-style info */}
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span>Ads by Google</span>
            </div>
          </div>
        )}
        
        {/* Monetization Card */}
        <div className="p-4">
          <MonetizationCard app={app || { pricing: "Freemium model" }} />
        </div>
        
        {/* Pro Badge for pro users */}
        {isPro && (
          <div className="p-4">
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl p-4 text-white text-center">
              <div className="text-2xl">⭐</div>
              <div className="font-bold">Pro Member</div>
              <div className="text-sm opacity-90">Unlimited Access</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

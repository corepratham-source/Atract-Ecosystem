import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

export default function AdsSidebar() {
  const navigate = useNavigate();
  const [currentAd, setCurrentAd] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % googleAds.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const ad = googleAds[currentAd];

  return (
    <aside className="hidden lg:flex lg:w-80 lg:flex-col border-r border-slate-200 bg-white overflow-y-auto sticky top-0 h-screen">
      {/* Back Button */}
      <div className="p-4 border-b border-slate-200">
        <button
          onClick={() => navigate("/customer")}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          title="Back to Dashboard"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Ad Container */}
      <div className="flex-1 p-6 overflow-y-auto">
        <advertisement className="space-y-4">
        <div className="relative group cursor-pointer rounded-lg overflow-hidden border border-slate-200 hover:border-slate-300 transition-all">
          {/* Ad Image */}
          <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Crect fill='%23e2e8f0' width='400' height='200'/%3E%3C/svg%3E";
              }}
            />
            <div className="absolute top-2 right-2 bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded">
              {ad.badge}
            </div>
          </div>

          {/* Ad Content */}
          <div className="p-3 bg-white">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1 line-clamp-2">
              {ad.title}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-2 mb-3">
              {ad.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{ad.domain}</span>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition-colors">
                {ad.cta}
              </button>
            </div>
          </div>
        </div>

        {/* Ad Indicators */}
        <div className="flex justify-center gap-1">
          {googleAds.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentAd(idx)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                idx === currentAd ? "bg-blue-600 w-4" : "bg-slate-300 hover:bg-slate-400"
              }`}
              aria-label={`Ad ${idx + 1}`}
            />
          ))}
        </div>

        {/* Why These Ads */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500 mb-2">Ads shown to free users</p>
          <button className="text-xs text-slate-600 hover:text-slate-900 underline">
            Remove ads - Subscribe Now
          </button>
        </div>
        </advertisement>
      </div>
    </aside>
  );
}

export default function AdPlaceholder() {
  const advertisements = [
    {
      id: 1,
      title: "Recruit Smart",
      description: "AI-powered hiring platform",
      cta: "Start Free"
    },
    {
      id: 2,
      title: "HR Solutions",
      description: "Complete workforce management",
      cta: "Learn More"
    }
  ];

  return (
    <div className="space-y-4">
      {advertisements.map((ad) => (
        <div key={ad.id} className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center hover:shadow-md transition-shadow">
          <div className="text-xs text-slate-400 mb-2">Sponsored</div>
          <div className="aspect-[1] max-w-[200px] mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center text-slate-700 text-sm font-medium mb-2">
            {ad.title}
          </div>
          <p className="text-xs text-slate-600 mb-2">{ad.description}</p>
          <button className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
            {ad.cta}
          </button>
        </div>
      ))}
    </div>
  );
}

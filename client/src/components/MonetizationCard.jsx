export default function MonetizationCard({ app }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-1 transition-all duration-200 hover:bg-gray-100 cursor-pointer hover:-translate-y-0.5 hover:shadow-lg">
      <div className="text-sm font-semibold text-slate-900">Monetization</div>
      <div className="mt-2 text-sm text-slate-600">
        <div className="font-medium">Pricing</div>
        <div className="mt-1">{app.pricing}</div>
      </div>
      <div className="mt-4 text-xs text-slate-500">
        Designed with payment in mind (limits, pay‑per‑use, or subscription), even if billing is added later.
      </div>
    </div>
  );
}
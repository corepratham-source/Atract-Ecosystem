import React from "react";

export default function Snapshot({ apps }) {
  const totalApps = apps.length;
  const totalUsers = apps.reduce((sum, a) => sum + (a.users30d || 0), 0);
  const totalRevenue = apps.reduce((sum, a) => sum + (a.revenue30d || 0), 0);
  const avgRevenue = totalApps > 0 ? totalRevenue / totalApps : 0;
  const growing = apps.filter(a => (a.users7d || 0) > (a.users30d || 0) * 0.2).length;
  const declining = apps.filter(a => (a.users7d || 0) < 10).length;

  // Green / Amber / Red coding (simple, founder-readable)
  const tone = (kind) => {
    if (kind === "apps") {
      if (totalApps >= 5) return "good";
      if (totalApps >= 1) return "watch";
      return "bad";
    }
    if (kind === "users") {
      if (totalUsers >= 1000) return "good";
      if (totalUsers >= 100) return "watch";
      return "bad";
    }
    if (kind === "revenue") {
      if (totalRevenue >= 10000) return "good";
      if (totalRevenue >= 1000) return "watch";
      return "bad";
    }
    if (kind === "avgRevenue") {
      if (avgRevenue >= 3000) return "good";
      if (avgRevenue >= 500) return "watch";
      return "bad";
    }
    if (kind === "growing") {
      if (totalApps === 0) return "watch";
      if (growing >= Math.ceil(totalApps * 0.5)) return "good";
      if (growing >= Math.ceil(totalApps * 0.3)) return "watch";
      return "bad";
    }
    if (kind === "declining") {
      if (declining === 0) return "good";
      if (totalApps > 0 && declining <= Math.ceil(totalApps * 0.2)) return "watch";
      return "bad";
    }
    return "watch";
  };

  const toneStyles = (t) => {
    if (t === "good") return { ring: "ring-emerald-200", bar: "bg-emerald-500", value: "text-slate-900" };
    if (t === "watch") return { ring: "ring-amber-200", bar: "bg-amber-500", value: "text-slate-900" };
    return { ring: "ring-rose-200", bar: "bg-rose-500", value: "text-slate-900" };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
      <MetricCard
        label="Total Active Apps"
        value={totalApps}
        styles={toneStyles(tone("apps"))}
      />
      <MetricCard
        label="Total Users (30d)"
        value={totalUsers.toLocaleString()}
        styles={toneStyles(tone("users"))}
      />
      <MetricCard
        label="Total Revenue (30d)"
        value={`₹${totalRevenue.toLocaleString()}`}
        styles={toneStyles(tone("revenue"))}
      />
      <MetricCard
        label="Avg Revenue / App"
        value={`₹${Math.round(avgRevenue).toLocaleString()}`}
        styles={toneStyles(tone("avgRevenue"))}
      />
      <MetricCard
        label="Apps Growing"
        value={growing}
        styles={toneStyles(tone("growing"))}
      />
      <MetricCard
        label="Apps Declining"
        value={declining}
        styles={toneStyles(tone("declining"))}
      />
    </div>
  );
}

function MetricCard({ label, value, styles }) {
  return (
    <div className={`relative bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ${styles.ring}`}>
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-2xl ${styles.bar}`} />
      <div className="px-4 py-4">
        <div className="text-xs font-medium text-slate-500">{label}</div>
        <div className={`mt-2 text-2xl font-semibold tracking-tight ${styles.value}`}>{value}</div>
      </div>
    </div>
  );
}

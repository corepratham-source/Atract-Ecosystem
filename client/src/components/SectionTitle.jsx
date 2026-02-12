export default function SectionTitle({ title, description }) {
  return (
    <div>
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
    </div>
  );
}
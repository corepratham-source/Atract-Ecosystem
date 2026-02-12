export default function Field({ label, helper, children }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-slate-500 flex items-center justify-between">
        <span>{label}</span>
        {helper ? <span className="text-[11px] text-slate-400">{helper}</span> : null}
      </div>
      <div className="mt-1">{children}</div>
    </label>
  );
}
export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {helper && <span className="text-xs font-normal text-slate-400">{helper}</span>}
    </span>
  );
}

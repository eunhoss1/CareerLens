import type { ReactNode, SelectHTMLAttributes } from "react";
import { FieldLabel } from "./FieldLabel";

export function SelectInput({
  label,
  helper,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <select className="h-10 w-full border border-line bg-white px-3 text-sm text-ink focus:border-brand disabled:bg-slate-100" {...props}>
        {children}
      </select>
    </label>
  );
}

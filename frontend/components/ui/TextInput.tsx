import type { InputHTMLAttributes } from "react";
import { FieldLabel } from "./FieldLabel";

export function TextInput({ label, helper, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; helper?: string }) {
  return (
    <label className={`block ${className}`}>
      <FieldLabel label={label} helper={helper} />
      <input className="h-10 w-full border border-line bg-white px-3 text-sm text-ink focus:border-brand" {...props} />
    </label>
  );
}

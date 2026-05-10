import type { ButtonHTMLAttributes } from "react";
import { buttonClass } from "./style-helpers";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "subtle" | "danger" }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass(variant)} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";
import { buttonClass } from "./style-helpers";

export function LinkButton({
  children,
  variant = "primary",
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; variant?: "primary" | "secondary" | "subtle" }) {
  return (
    <Link
      className={`inline-flex min-h-10 items-center justify-center px-4 py-2 text-sm font-semibold transition ${buttonClass(variant)} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#f3f6f1] text-ink">{children}</main>;
}

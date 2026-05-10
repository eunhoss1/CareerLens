import type { ReactNode } from "react";

export function Card({ children, className = "", elevated = false }: { children: ReactNode; className?: string; elevated?: boolean }) {
  return <div className={`border border-line bg-white ${elevated ? "shadow-panel" : "shadow-sm"} ${className}`}>{children}</div>;
}

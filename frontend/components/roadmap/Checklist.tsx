"use client";

import type { ChecklistItem } from "@/lib/roadmap-checklists";

type ChecklistProps = {
  items: ChecklistItem[];
  checkedIds: string[];
  onToggle: (itemId: string) => void;
};

export function Checklist({ items, checkedIds, onToggle }: ChecklistProps) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => {
        const checked = checkedIds.includes(item.id);

        return (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm transition hover:bg-white/70">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(item.id)}
                className="mt-1 h-4 w-4 shrink-0 accent-brand"
              />
              <span className={`leading-5 text-slate-700 transition ${checked ? "text-slate-400 line-through opacity-60" : ""}`}>
                {item.label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

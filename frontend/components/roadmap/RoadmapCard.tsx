"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui";
import type { RoadmapCard as RoadmapCardData } from "@/lib/roadmap-checklists";
import { Checklist } from "./Checklist";

type RoadmapCardProps = {
  card: RoadmapCardData;
  variant?: "panel" | "timeline";
};

export function RoadmapCard({ card, variant = "panel" }: RoadmapCardProps) {
  const storageKey = `roadmap-checklist-${card.id}`;
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const validIds = new Set(card.checklistItems.map((item) => item.id));
        setCheckedIds(parsed.filter((itemId): itemId is string => typeof itemId === "string" && validIds.has(itemId)));
      }
    } catch {
      setCheckedIds([]);
    } finally {
      setIsLoaded(true);
    }
  }, [card.checklistItems, storageKey]);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(storageKey, JSON.stringify(checkedIds));
  }, [checkedIds, isLoaded, storageKey]);

  const completedCount = checkedIds.length;
  const totalCount = card.checklistItems.length;
  const status = useMemo(() => {
    if (completedCount === 0) return "NOT_STARTED";
    if (completedCount === totalCount) return "DONE";
    return "IN_PROGRESS";
  }, [completedCount, totalCount]);

  function toggleItem(itemId: string) {
    setCheckedIds((current) =>
      current.includes(itemId)
        ? current.filter((checkedId) => checkedId !== itemId)
        : [...current, itemId]
    );
  }

  const isTimeline = variant === "timeline";

  return (
    <section className={isTimeline ? "relative rounded-2xl border border-line bg-white p-5 shadow-sm" : "rounded-xl border border-line bg-panel p-4"}>
      {isTimeline && <div className="absolute left-[-9px] top-6 h-4 w-4 border border-night bg-paper" />}
      {isTimeline && <p className="text-xs font-bold tracking-[0.16em] text-brand">{card.phase}</p>}
      <div className="flex items-start justify-between gap-3">
        <div>
          {isTimeline ? (
            <h3 className="mt-1 text-lg font-semibold text-night">{card.title}</h3>
          ) : (
            <p className="text-sm font-semibold text-night">{card.title}</p>
          )}
          <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
        </div>
        <Badge tone={statusTone(status)} className={status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
          {statusLabel(status)}
        </Badge>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-white/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-slate-500">준비 항목</p>
          <span className="text-xs font-semibold text-slate-500">
            {completedCount}/{totalCount} 완료
          </span>
        </div>
        <Checklist items={card.checklistItems} checkedIds={checkedIds} onToggle={toggleItem} />
      </div>
    </section>
  );
}

function statusLabel(status: string) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "준비 전";
}

function statusTone(status: string) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}

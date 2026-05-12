import { StatusPill } from "./Badge";
import { Card } from "./Card";
import { checklistTone } from "./style-helpers";

export function ChecklistCard({ title, items }: { title: string; items: Array<{ label: string; status: string }> }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-night">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
            <span className="text-sm text-slate-700">{item.label}</span>
            <StatusPill tone={checklistTone(item.status)}>{item.status}</StatusPill>
          </div>
        ))}
      </div>
    </Card>
  );
}

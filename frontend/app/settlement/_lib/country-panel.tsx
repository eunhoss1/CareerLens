import { Badge, Button, Card } from "@/components/ui";
import type { SettlementChecklistItem, SettlementStatus } from "@/lib/settlement";
import { statusOptions } from "./constants";
import { statusLabel, statusTone } from "./display";

type StatusChangeHandler = (item: SettlementChecklistItem, status: SettlementStatus) => void | Promise<void>;

export function CountryPanel({
  country,
  items,
  updatingId,
  onStatusChange
}: {
  country: string;
  items: SettlementChecklistItem[];
  updatingId: number | null;
  onStatusChange: StatusChangeHandler;
}) {
  const groupedByCategory = items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
    acc[item.category] = [...(acc[item.category] ?? []), item];
    return acc;
  }, {});
  const completeRate = items.length === 0 ? 0 : Math.round((items.filter((item) => item.status === "DONE").length / items.length) * 100);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand">COUNTRY DOSSIER</p>
          <h2 className="mt-2 text-2xl font-semibold text-night">{country}</h2>
          <p className="mt-1 text-sm text-slate-600">체크리스트 완료율 {completeRate}%</p>
        </div>
        <Badge tone={completeRate >= 70 ? "success" : "warning"}>{completeRate >= 70 ? "준비 양호" : "확인 필요"}</Badge>
      </div>

      <div className="mt-5 grid gap-4">
        {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
          <section key={category} className="border border-line bg-panel p-4">
            <h3 className="text-lg font-semibold text-night">{category}</h3>
            <div className="mt-4 space-y-3">
              {categoryItems.map((item) => (
                <ChecklistRow
                  key={item.item_id}
                  item={item}
                  isUpdating={updatingId === item.item_id}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Card>
  );
}

function ChecklistRow({
  item,
  isUpdating,
  onStatusChange
}: {
  item: SettlementChecklistItem;
  isUpdating: boolean;
  onStatusChange: StatusChangeHandler;
}) {
  return (
    <div className="border-b border-line pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-night">{item.checklist_title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
        <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={item.status === option.value ? "primary" : "secondary"}
            disabled={isUpdating}
            onClick={() => onStatusChange(item, option.value)}
            className="min-h-9 px-3 text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

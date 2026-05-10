import { Card } from "./Card";

export function StepCard({ index, title, description }: { index: number; title: string; description: string }) {
  return (
    <Card className="p-5">
      <span className="text-xs font-bold text-brand">0{index}</span>
      <h3 className="mt-3 text-base font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}

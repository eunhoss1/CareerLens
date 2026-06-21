import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import { guidanceStatusLabel, guidanceStatusTone } from "./display";

export function SettlementGuidanceSection({
  guidance,
  guidanceError,
  isGuidanceLoading,
  isUserReady,
  onRefreshGuidance,
}: any) {
  return (
    <section className="mt-8">
      <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
              SETTLEMENT BRIEF
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              정착 준비 요약
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              개인 프로필 기반 비자 및 정착 우선순위 분석입니다.
            </p>
          </div>
          <Button
            variant="secondary"
            disabled={!isUserReady || isGuidanceLoading}
            onClick={onRefreshGuidance}
            className="rounded-xl border-slate-200"
          >
            {isGuidanceLoading
              ? "생성 중..."
              : guidance
              ? "새로고침"
              : "요약 생성"}
          </Button>
        </div>

        {guidance ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Badge
                tone={
                  guidance.generation_mode.includes("AI") ? "brand" : "muted"
                }
              >
                {guidance.generation_mode.includes("AI")
                  ? "AI 보조"
                  : "규칙 기반"}
              </Badge>
              <Badge tone={guidanceStatusTone(guidance.overall_status)}>
                {guidanceStatusLabel(guidance.overall_status)}
              </Badge>
            </div>
            <ScoreBar
              label="전체 정착 준비율"
              value={guidance.completion_rate}
              tone={guidance.completion_rate >= 70 ? "success" : "warning"}
            />
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl">
              {guidance.summary}
            </p>

            <div className="border border-slate-100 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">
                우선 액션
              </p>
              <ol className="mt-3 space-y-3">
                {guidance.priority_actions.map((action: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700">
                    <span className="font-bold text-indigo-600">{i + 1}</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm">
            요약 정보를 생성해 주세요.
          </div>
        )}
        {guidanceError && (
          <p className="mt-3 text-sm text-red-500">{guidanceError}</p>
        )}
      </Card>
    </section>
  );
}

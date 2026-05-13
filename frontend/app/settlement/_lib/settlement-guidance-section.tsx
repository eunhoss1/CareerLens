import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { SettlementChecklistItem, SettlementGuidance } from "@/lib/settlement";
import {
  countryFallbackSummaries,
  guidanceStatusLabel,
  guidanceStatusTone,
  riskLabel,
  riskTone
} from "./display";

export function SettlementGuidanceSection({
  guidance,
  guidanceError,
  isGuidanceLoading,
  isUserReady,
  onRefreshGuidance
}: {
  guidance: SettlementGuidance | null;
  guidanceError: string | null;
  isGuidanceLoading: boolean;
  isUserReady: boolean;
  onRefreshGuidance: () => void;
}) {
  return (
    <section className="mt-6">
      <SettlementBriefCard
        guidance={guidance}
        guidanceError={guidanceError}
        isGuidanceLoading={isGuidanceLoading}
        isUserReady={isUserReady}
        onRefreshGuidance={onRefreshGuidance}
      />
    </section>
  );
}

function SettlementBriefCard({
  guidance,
  guidanceError,
  isGuidanceLoading,
  isUserReady,
  onRefreshGuidance
}: {
  guidance: SettlementGuidance | null;
  guidanceError: string | null;
  isGuidanceLoading: boolean;
  isUserReady: boolean;
  onRefreshGuidance: () => void;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="lens-kicker">SETTLEMENT BRIEF</p>
          <h2 className="mt-3 text-2xl font-semibold text-night">정착 준비 요약</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            저장된 체크리스트와 마이페이지 프로필을 바탕으로 비자, 출국 전 준비, 초기 정착의 우선순위를 정리합니다.
          </p>
        </div>
        <Button type="button" variant="secondary" disabled={!isUserReady || isGuidanceLoading} onClick={onRefreshGuidance}>
          {isGuidanceLoading ? "요약 생성 중" : guidance ? "요약 새로고침" : "요약 생성"}
        </Button>
      </div>

      {guidance ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={guidance.generation_mode.includes("AI") ? "brand" : "muted"}>
              {guidance.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"}
            </Badge>
            <Badge tone={guidanceStatusTone(guidance.overall_status)}>{guidanceStatusLabel(guidance.overall_status)}</Badge>
          </div>
          <ScoreBar label="전체 정착 준비율" value={guidance.completion_rate} tone={guidance.completion_rate >= 70 ? "success" : "warning"} />
          <p className="text-sm leading-6 text-slate-700">{guidance.summary}</p>
          <div className="border border-line bg-panel p-4">
            <p className="text-xs font-bold text-slate-500">우선 액션</p>
            <ol className="mt-3 space-y-2">
              {guidance.priority_actions.map((action, index) => (
                <li key={`${action}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold text-brand">{index + 1}</span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="text-xs leading-5 text-slate-500">{guidance.disclaimer}</p>
        </div>
      ) : (
        <div className="mt-5 border border-dashed border-line bg-panel p-5 text-sm leading-6 text-slate-600">
          {isGuidanceLoading ? "정착 준비 요약을 생성하고 있습니다." : "요약을 생성하면 현재 체크리스트 기준의 다음 액션이 표시됩니다."}
        </div>
      )}

      {guidanceError && <p className="mt-3 text-sm text-coral">{guidanceError}</p>}
    </Card>
  );
}

function CountryRiskCard({
  groupedByCountry,
  guidance
}: {
  groupedByCountry: Record<string, SettlementChecklistItem[]>;
  guidance: SettlementGuidance | null;
}) {
  return (
    <Card className="p-5">
      <p className="lens-kicker">COUNTRY RISK</p>
      <h2 className="mt-3 text-2xl font-semibold text-night">국가별 준비 상태</h2>
      <div className="mt-5 space-y-3">
        {(guidance?.country_summaries ?? countryFallbackSummaries(groupedByCountry)).map((country) => (
          <div key={country.country} className="border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-night">{country.country}</p>
                <p className="mt-1 text-xs text-slate-500">완료율 {country.completion_rate}%</p>
              </div>
              <Badge tone={riskTone(country.risk_level)}>{riskLabel(country.risk_level)}</Badge>
            </div>
            <ul className="mt-3 space-y-1">
              {country.next_actions.slice(0, 3).map((action) => (
                <li key={action} className="text-sm leading-6 text-slate-600">- {action}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar, SectionHeader, StepCard } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  updateSettlementChecklistStatus,
  type SettlementChecklistItem,
  type SettlementGuidance,
  type SettlementStatus
} from "@/lib/settlement";

const statusOptions: Array<{ value: SettlementStatus; label: string }> = [
  { value: "NOT_STARTED", label: "준비 전" },
  { value: "IN_PROGRESS", label: "진행 중" },
  { value: "DONE", label: "완료" }
];

const timeline = [
  { title: "지원 전", description: "국가별 비자 조건과 필수 증빙을 먼저 확인합니다." },
  { title: "오퍼 이후", description: "고용주 스폰서십, 재류자격, 출국 일정에 맞춰 서류를 정리합니다." },
  { title: "초기 정착", description: "주소 등록, 은행, 통신, 보험 등 현지 생활 기반을 준비합니다." }
];

export default function SettlementPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    fetchSettlementChecklists(storedUser.user_id)
      .then((loadedItems) => {
        setItems(loadedItems);
        return refreshGuidance(storedUser.user_id);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "정착 체크리스트를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const groupedByCountry = useMemo(() => {
    return items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
      acc[item.country] = [...(acc[item.country] ?? []), item];
      return acc;
    }, {});
  }, [items]);

  const doneCount = items.filter((item) => item.status === "DONE").length;
  const inProgressCount = items.filter((item) => item.status === "IN_PROGRESS").length;

  async function changeStatus(item: SettlementChecklistItem, status: SettlementStatus) {
    setUpdatingId(item.item_id);
    setErrorMessage(null);
    try {
      const updated = await updateSettlementChecklistStatus(item.item_id, status);
      setItems((current) => current.map((candidate) => (candidate.item_id === updated.item_id ? updated : candidate)));
      setGuidance(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "정착 체크리스트 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshGuidance(userId = user?.user_id) {
    if (!userId) {
      return;
    }
    setIsGuidanceLoading(true);
    setGuidanceError(null);
    try {
      const result = await generateSettlementGuidance(userId);
      setGuidance(result);
    } catch (error) {
      setGuidanceError(error instanceof Error ? error.message : "정착 준비 요약을 생성하지 못했습니다.");
    } finally {
      setIsGuidanceLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="SETTLEMENT SUPPORT"
        title="정착 지원"
        description="해외취업 준비가 지원에서 끝나지 않도록 비자, 출국 행정, 초기 생활 준비 항목을 사용자별 체크리스트로 관리합니다."
        actions={<LinkButton href="/applications">지원 관리로</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-3">
          {timeline.map((step, index) => (
            <StepCard key={step.title} index={index + 1} title={step.title} description={step.description} />
          ))}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <MetricCard label="전체 체크 항목" value={items.length} helper="미국/일본 기본 세트" />
          <MetricCard label="진행 중" value={inProgressCount} helper="확인 또는 준비 중" />
          <MetricCard label="완료" value={doneCount} helper="사용자별 상태 저장" />
        </div>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="lens-kicker">SETTLEMENT BRIEF</p>
                <h2 className="mt-3 text-2xl font-semibold text-night">정착 준비 요약</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  저장된 체크리스트와 마이페이지 프로필을 바탕으로 비자, 출국 전 준비, 초기 정착의 우선순위를 정리합니다.
                </p>
              </div>
              <Button type="button" variant="secondary" disabled={!user || isGuidanceLoading} onClick={() => refreshGuidance()}>
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
        </section>

        <div className="mt-8">
          <SectionHeader
            kicker="COUNTRY CHECKLIST"
            title="국가별 정착 준비 체크리스트"
            description="처음 조회할 때 사용자별 기본 체크리스트가 DB에 생성됩니다. 상태 변경은 저장되므로 다시 접속해도 이어서 확인할 수 있습니다."
          />
        </div>

        {isLoading && (
          <div className="mt-6">
            <EmptyState title="정착 체크리스트를 불러오는 중입니다." description="로그인 사용자 기준으로 국가별 준비 항목을 확인하고 있습니다." />
          </div>
        )}

        {!isLoading && !user && (
          <div className="mt-6">
            <EmptyState
              title="로그인이 필요합니다."
              description="정착 체크리스트는 사용자별 준비 상태를 저장하므로 로그인 후 사용할 수 있습니다."
              action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-6">
            <EmptyState title="정착 지원 데이터를 처리하지 못했습니다." description={errorMessage} />
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {Object.entries(groupedByCountry).map(([country, countryItems]) => (
              <CountryPanel
                key={country}
                country={country}
                items={countryItems}
                updatingId={updatingId}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function CountryPanel({
  country,
  items,
  updatingId,
  onStatusChange
}: {
  country: string;
  items: SettlementChecklistItem[];
  updatingId: number | null;
  onStatusChange: (item: SettlementChecklistItem, status: SettlementStatus) => void;
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
  onStatusChange: (item: SettlementChecklistItem, status: SettlementStatus) => void;
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

function statusLabel(status: SettlementStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusTone(status: SettlementStatus) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "warning";
  return "muted";
}

function countryFallbackSummaries(groupedByCountry: Record<string, SettlementChecklistItem[]>) {
  return Object.entries(groupedByCountry).map(([country, countryItems]) => {
    const completionRate = countryItems.length === 0
      ? 0
      : Math.round((countryItems.filter((item) => item.status === "DONE").length / countryItems.length) * 100);
    return {
      country,
      completion_rate: completionRate,
      risk_level: completionRate >= 70 ? "LOW" : completionRate >= 35 ? "MEDIUM" : "HIGH",
      next_actions: countryItems.filter((item) => item.status !== "DONE").slice(0, 3).map((item) => item.checklist_title)
    };
  });
}

function guidanceStatusLabel(status: string) {
  if (status === "ON_TRACK") return "준비 양호";
  if (status === "NEEDS_ATTENTION") return "확인 필요";
  return "초기 단계";
}

function guidanceStatusTone(status: string) {
  if (status === "ON_TRACK") return "success";
  if (status === "NEEDS_ATTENTION") return "warning";
  return "risk";
}

function riskLabel(status: string) {
  if (status === "LOW") return "낮음";
  if (status === "MEDIUM") return "중간";
  return "높음";
}

function riskTone(status: string) {
  if (status === "LOW") return "success";
  if (status === "MEDIUM") return "warning";
  return "risk";
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  ScoreBar,
  SectionHeader,
  TimelineCard
} from "@/components/ui";
import {
  fetchSettlementChecklists,
  fetchSettlementGuidanceFromRoadmap,
  generateSettlementGuidance,
  generateSettlementGuidanceFromRoadmap,
  refreshSettlementGuidanceFromRoadmap,
  type SettlementChecklistItem,
  type SettlementGuidance
} from "@/lib/settlement";

const adminStages = [
  {
    phase: "OFFER",
    title: "오퍼/고용계약 확인",
    description: "입사 예정일, 고용주 정보, 비자 스폰서십 여부, 제출 서류를 확정합니다."
  },
  {
    phase: "VISA",
    title: "비자/재류자격 준비",
    description: "국가별 공식기관 기준으로 체류자격, 제출 서류, 처리 기간을 확인합니다."
  },
  {
    phase: "PRE-DEPARTURE",
    title: "출국 전 행정 패키지",
    description: "영문/일문 증빙, 보험, 숙소, 긴급 연락처, 회사 제출 서류를 하나로 묶습니다."
  },
  {
    phase: "ARRIVAL",
    title: "입국 후 초기 행정",
    description: "주소 등록, 은행, 통신, 보험, 회사 온보딩 서류를 순서대로 처리합니다."
  }
];

const officialSourceCards = [
  {
    country: "미국",
    title: "비자/고용 관련 공식 확인",
    description: "USCIS, Department of State, 고용주 안내 자료를 기준으로 최신 절차를 확인합니다.",
    tags: ["USCIS", "State Dept.", "Employer"]
  },
  {
    country: "일본",
    title: "재류자격/입국 행정 공식 확인",
    description: "출입국재류관리청, 대사관, 고용주 제출 서류 안내를 기준으로 확인합니다.",
    tags: ["Immigration Services Agency", "Embassy", "Employer"]
  }
];

export default function AdministrationRoadmapPage() {
  const auth = useRequiredAuth();
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;
    const linkedRoadmapId = Number(new URLSearchParams(window.location.search).get("roadmapId") ?? 0);
    setLinkedRoadmapId(linkedRoadmapId || null);

    Promise.all([
      fetchSettlementChecklists(auth.user.user_id),
      linkedRoadmapId ? loadRoadmapGuidance(linkedRoadmapId) : generateSettlementGuidance(auth.user.user_id)
    ])
      .then(([loadedItems, generatedGuidance]) => {
        setItems(loadedItems);
        setGuidance(generatedGuidance);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "행정로드맵 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  async function loadRoadmapGuidance(roadmapId: number) {
    try {
      return await fetchSettlementGuidanceFromRoadmap(roadmapId);
    } catch (error) {
      if (isMissingSavedGuidance(error)) {
        return generateSettlementGuidanceFromRoadmap(roadmapId);
      }
      throw error;
    }
  }

  async function refreshLinkedGuidance() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      setGuidance(await refreshSettlementGuidanceFromRoadmap(linkedRoadmapId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "행정로드맵을 갱신하지 못했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  const adminItems = useMemo(() => {
    return items.filter((item) =>
      item.category.includes("비자")
      || item.category.includes("행정")
      || item.description.includes("비자")
      || item.description.includes("재류")
      || item.description.includes("주소 등록")
      || item.description.includes("보험")
    );
  }, [items]);

  const doneCount = adminItems.filter((item) => item.status === "DONE").length;
  const inProgressCount = adminItems.filter((item) => item.status === "IN_PROGRESS").length;
  const completionRate = adminItems.length === 0 ? 0 : Math.round((doneCount / adminItems.length) * 100);
  // const groupedByCountry = adminItems.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
  //   acc[item.country] = [...(acc[item.country] ?? []), item];
  //   return acc;
  // }, {});

  if (auth.isChecking) {
    return <AuthCheckingScreen title="행정로드맵 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="행정로드맵은 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ADMINISTRATION ROADMAP"
        title="행정로드맵"
        actions={
          <>
            <LinkButton href={linkedRoadmapId ? `/roadmap/departure?roadmapId=${linkedRoadmapId}` : "/roadmap/departure"} variant="secondary">
              출국로드맵으로
            </LinkButton>
            <LinkButton href="/applications" variant="secondary">지원 관리로</LinkButton>
            {linkedRoadmapId && (
              <Button type="button" variant="secondary" onClick={refreshLinkedGuidance} disabled={isRefreshing || isLoading}>
                {isRefreshing ? "갱신 중" : "최신 정보로 갱신"}
              </Button>
            )}
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="행정로드맵을 불러오는 중입니다." description="사용자별 정착 체크리스트와 AI/규칙 기반 안내를 조합하고 있습니다." />}

        {errorMessage && <EmptyState title="행정로드맵 데이터 처리 실패" description={errorMessage} />}

        {!isLoading && (
          <div className="space-y-6">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="행정 체크 항목" value={adminItems.length} helper="비자/행정/보험 중심" />
              <MetricCard label="진행 중" value={inProgressCount} helper="확인 또는 처리 중" />
              <MetricCard label="완료" value={doneCount} helper="사용자별 저장 상태" />
              <MetricCard label="생성 방식" value={guidance?.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"} helper="정착 안내 요약 기준" />
            </div>

            <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <Card className="p-5">
                <p className="lens-kicker">ADMIN READINESS</p>
                <h2 className="mt-3 text-2xl font-semibold text-night">행정 준비율</h2>
                <div className="mt-5">
                  <ScoreBar label="비자/행정 준비율" value={completionRate} tone={completionRate >= 70 ? "success" : "warning"} />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {guidance?.summary ?? "정착 체크리스트를 기준으로 비자, 출국 전 준비, 초기 행정 항목을 정리합니다."}
                </p>
                {guidance?.updated_at && (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    저장일 {formatDateTime(guidance.created_at ?? guidance.updated_at)} · 최근 갱신 {formatDateTime(guidance.refreshed_at ?? guidance.updated_at)}
                  </p>
                )}
                <div className="mt-5 rounded-xl border border-line bg-panel p-4">
                  <p className="text-xs font-bold text-slate-500">우선 확인 항목</p>
                  <ul className="mt-3 space-y-2">
                    {(guidance?.priority_actions ?? adminItems.slice(0, 4).map((item) => `${item.country} - ${item.checklist_title}`)).slice(0, 4).map((action) => (
                      <li key={action} className="text-sm leading-6 text-slate-700">- {action}</li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card className="p-5">
                <SectionHeader
                  kicker="OFFICIAL SOURCE POLICY"
                  title="공식 자료 확인 원칙"
                  description="AI는 체크리스트 요약과 우선순위 정리에만 사용하고, 비자/체류자격의 최신 판단은 공식기관 자료로 최종 확인합니다."
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {officialSourceCards.map((card) => (
                    <div key={card.country} className="rounded-xl border border-line bg-panel p-4">
                      <Badge tone="brand">{card.country}</Badge>
                      <h3 className="mt-3 text-base font-semibold text-night">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {card.tags.map((tag) => <Badge key={tag} tone="muted">{tag}</Badge>)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>

            <Card className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="lens-kicker">NEXT WORKSPACE</p>
                  <h2 className="mt-3 text-xl font-semibold text-night">지원 관리로 이어가기</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    행정 준비 항목을 확인한 뒤 목표 공고의 서류 준비도와 제출 상태를 지원 관리에서 이어서 점검합니다.
                  </p>
                </div>
                <LinkButton href="/applications">지원 관리로 이동</LinkButton>
              </div>
            </Card>

            <section className="border-l border-night pl-4">
              <div className="space-y-4">
                {adminStages.map((stage) => (
                  <TimelineCard key={stage.phase} label={stage.phase} title={stage.title}>
                    <p className="text-sm leading-6 text-slate-600">{stage.description}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {matchingItems(stage.phase, adminItems).map((item) => (
                        <div key={item.item_id} className="rounded-xl border border-line bg-panel p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-night">{item.country} · {item.checklist_title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                            <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
                              {statusLabel(item.status)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TimelineCard>
                ))}
              </div>
            </section>

            {/* <Card className="p-5">
              <SectionHeader kicker="COUNTRY DOSSIER" title="국가별 행정 항목" />
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Object.entries(groupedByCountry).map(([country, countryItems]) => (
                  <div key={country} className="rounded-xl border border-line bg-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-night">{country}</h3>
                      <Badge tone={countryItems.every((item) => item.status === "DONE") ? "success" : "warning"}>
                        {countryItems.filter((item) => item.status === "DONE").length}/{countryItems.length}
                      </Badge>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {countryItems.map((item) => (
                        <li key={item.item_id} className="flex items-start justify-between gap-3 border-b border-line pb-2 text-sm last:border-b-0 last:pb-0">
                          <span className="leading-6 text-slate-700">{item.checklist_title}</span>
                          <Badge tone={statusTone(item.status)} className={item.status === "NOT_STARTED" ? "min-w-[55px] justify-center" : ""}>
                            {statusLabel(item.status)}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card> */}

            <Card className="p-5">
              <p className="text-xs leading-5 text-slate-500">
                비자, 세금, 체류자격, 입국 요건과 행정 절차는 변동될 수 있으므로 최종 제출 전 공식기관과 전문가를 통해 확인하세요.
              </p>
            </Card>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function matchingItems(phase: string, items: SettlementChecklistItem[]) {
  if (phase === "OFFER") {
    return items.filter((item) => item.description.includes("회사") || item.description.includes("고용") || item.description.includes("제출")).slice(0, 2);
  }
  if (phase === "VISA") {
    return items.filter((item) => item.description.includes("비자") || item.description.includes("재류")).slice(0, 3);
  }
  if (phase === "PRE-DEPARTURE") {
    return items.filter((item) => item.category.includes("출국") || item.description.includes("증빙") || item.description.includes("서류")).slice(0, 3);
  }
  return items.filter((item) => item.description.includes("주소") || item.description.includes("은행") || item.description.includes("보험")).slice(0, 3);
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

function isMissingSavedGuidance(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("404");
}

function formatDateTime(value: string) {
  if (!value) return "미기재";
  return value.replace("T", " ");
}

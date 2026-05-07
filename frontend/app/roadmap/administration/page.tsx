"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
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
import { getStoredUser, type AuthUser } from "@/lib/auth";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    Promise.all([
      fetchSettlementChecklists(storedUser.user_id),
      generateSettlementGuidance(storedUser.user_id)
    ])
      .then(([loadedItems, generatedGuidance]) => {
        setItems(loadedItems);
        setGuidance(generatedGuidance);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "행정로드맵 데이터를 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

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
  const groupedByCountry = adminItems.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
    acc[item.country] = [...(acc[item.country] ?? []), item];
    return acc;
  }, {});

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ADMINISTRATION ROADMAP"
        title="행정로드맵"
        description="비자, 회사 제출 서류, 출국 전 행정 패키지, 입국 후 초기 행정 처리를 하나의 준비 흐름으로 정리합니다."
        actions={
          <>
            <LinkButton href="/roadmap/departure" variant="secondary">출국로드맵으로</LinkButton>
            <LinkButton href="/settlement">정착 체크리스트로</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="행정로드맵을 불러오는 중입니다." description="사용자별 정착 체크리스트와 AI/규칙 기반 안내를 조합하고 있습니다." />}

        {!isLoading && !user && (
          <EmptyState
            title="로그인이 필요합니다."
            description="행정로드맵은 사용자별 체크리스트 상태를 바탕으로 구성되므로 로그인 후 사용할 수 있습니다."
            action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
          />
        )}

        {errorMessage && <EmptyState title="행정로드맵 데이터 처리 실패" description={errorMessage} />}

        {!isLoading && user && (
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
                <div className="mt-5 border border-line bg-panel p-4">
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
                    <div key={card.country} className="border border-line bg-panel p-4">
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

            <section className="border-l border-night pl-4">
              <div className="space-y-4">
                {adminStages.map((stage) => (
                  <TimelineCard key={stage.phase} label={stage.phase} title={stage.title}>
                    <p className="text-sm leading-6 text-slate-600">{stage.description}</p>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {matchingItems(stage.phase, adminItems).map((item) => (
                        <div key={item.item_id} className="border border-line bg-panel p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-night">{item.country} · {item.checklist_title}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                            </div>
                            <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TimelineCard>
                ))}
              </div>
            </section>

            <Card className="p-5">
              <SectionHeader kicker="COUNTRY DOSSIER" title="국가별 행정 항목" />
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {Object.entries(groupedByCountry).map(([country, countryItems]) => (
                  <div key={country} className="border border-line bg-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-night">{country}</h3>
                      <Badge tone={countryItems.every((item) => item.status === "DONE") ? "success" : "warning"}>
                        {countryItems.filter((item) => item.status === "DONE").length}/{countryItems.length}
                      </Badge>
                    </div>
                    <ul className="mt-4 space-y-2">
                      {countryItems.map((item) => (
                        <li key={item.item_id} className="flex items-start justify-between gap-3 border-b border-line pb-2 text-sm last:border-b-0 last:pb-0">
                          <span className="leading-6 text-slate-700">{item.checklist_title}</span>
                          <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-xs leading-5 text-slate-500">
                이 행정로드맵은 CareerLens에 저장된 체크리스트와 사용자 입력을 바탕으로 만든 시연용 안내입니다.
                비자, 세금, 체류자격, 입국 요건, 행정 절차의 최신 판단은 반드시 공식기관과 전문가를 통해 확인해야 합니다.
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

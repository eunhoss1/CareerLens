"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageShell,
  ScoreBar,
  TimelineCard,
} from "@/components/ui";
import {
  fetchSettlementChecklists,
  fetchSettlementGuidanceFromRoadmap,
  generateSettlementGuidance,
  generateSettlementGuidanceFromRoadmap,
  refreshSettlementGuidanceFromRoadmap,
  type SettlementChecklistItem,
  type SettlementGuidance,
} from "@/lib/settlement";

const adminStages = [
  {
    phase: "OFFER",
    title: "오퍼/고용계약 확인",
    description:
      "입사 예정일, 고용주 정보, 비자 스폰서십 여부, 제출 서류를 확정합니다.",
  },
  {
    phase: "VISA",
    title: "비자/재류자격 준비",
    description:
      "국가별 공식기관 기준으로 체류자격, 제출 서류, 처리 기간을 확인합니다.",
  },
  {
    phase: "PRE-DEPARTURE",
    title: "출국 전 행정 패키지",
    description:
      "영문/일문 증빙, 보험, 숙소, 긴급 연락처, 회사 제출 서류를 하나로 묶습니다.",
  },
  {
    phase: "ARRIVAL",
    title: "입국 후 초기 행정",
    description:
      "주소 등록, 은행, 통신, 보험, 회사 온보딩 서류를 순서대로 처리합니다.",
  },
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
    const roadmapId = Number(
      new URLSearchParams(window.location.search).get("roadmapId") ?? 0
    );
    setLinkedRoadmapId(roadmapId || null);

    Promise.all([
      fetchSettlementChecklists(auth.user.user_id),
      roadmapId
        ? loadRoadmapGuidance(roadmapId)
        : generateSettlementGuidance(auth.user.user_id),
    ])
      .then(([loadedItems, generatedGuidance]) => {
        setItems(loadedItems);
        setGuidance(generatedGuidance);
      })
      .catch((e) =>
        setErrorMessage(e instanceof Error ? e.message : "데이터 로드 실패")
      )
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  async function loadRoadmapGuidance(id: number) {
    try {
      return await fetchSettlementGuidanceFromRoadmap(id);
    } catch {
      return await generateSettlementGuidanceFromRoadmap(id);
    }
  }

  async function refreshLinkedGuidance() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    try {
      setGuidance(await refreshSettlementGuidanceFromRoadmap(linkedRoadmapId));
    } finally {
      setIsRefreshing(false);
    }
  }

  const adminItems = useMemo(
    () =>
      items.filter(
        (i) =>
          i.category.includes("비자") ||
          i.category.includes("행정") ||
          i.description.includes("비자") ||
          i.description.includes("재류") ||
          i.description.includes("주소") ||
          i.description.includes("보험")
      ),
    [items]
  );

  const getStageRate = (phase: string) => {
    const stageItems = matchingItems(phase, adminItems);
    const done = stageItems.filter((i) => i.status === "DONE").length;
    return stageItems.length === 0
      ? 0
      : Math.round((done / stageItems.length) * 100);
  };

  const doneCount = adminItems.filter((i) => i.status === "DONE").length;
  const inProgressCount = adminItems.filter(
    (i) => i.status === "IN_PROGRESS"
  ).length;
  const completionRate =
    adminItems.length === 0
      ? 0
      : Math.round((doneCount / adminItems.length) * 100);

  if (auth.isChecking) return <AuthCheckingScreen title="권한 확인 중..." />;
  if (!auth.user)
    return <AuthRequiredScreen title="로그인 후 이용 가능합니다." />;

  return (
    <PageShell>
      <SiteHeader />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Administration Roadmap
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              행정로드맵
            </h1>
          </div>
          <div className="flex gap-2">
            <LinkButton href="/roadmap/departure" variant="secondary">
              출국로드맵
            </LinkButton>
            {linkedRoadmapId && (
              <Button variant="secondary" onClick={refreshLinkedGuidance}>
                {isRefreshing ? "갱신 중" : "최신 정보 갱신"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen py-8">
        <section className="max-w-[1200px] mx-auto px-6 space-y-8">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="전체 행정 항목" value={adminItems.length} />
            <MetricCard label="진행 중" value={inProgressCount} />
            <MetricCard label="완료" value={doneCount} />
            <MetricCard label="전체 완료율" value={`${completionRate}%`} />
          </div>

          <div className="space-y-6">
            {adminStages.map((stage) => {
              const rate = getStageRate(stage.phase);
              return (
                <TimelineCard
                  key={stage.phase}
                  label={stage.phase}
                  title={stage.title}
                >
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-slate-500">
                      {stage.description}
                    </p>
                    <div className="text-right">
                      <p className="text-xs font-bold text-indigo-600">
                        단계 완료율 {rate}%
                      </p>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {matchingItems(stage.phase, adminItems).map((item) => (
                      <div
                        key={item.item_id}
                        className="rounded-xl border border-slate-200 p-4 bg-white"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {item.checklist_title}
                        </p>
                        <Badge tone={statusTone(item.status)} className="mt-2">
                          {statusLabel(item.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TimelineCard>
              );
            })}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function matchingItems(phase: string, items: SettlementChecklistItem[]) {
  if (phase === "OFFER")
    return items
      .filter(
        (i) => i.description.includes("회사") || i.description.includes("고용")
      )
      .slice(0, 2);
  if (phase === "VISA")
    return items
      .filter(
        (i) => i.description.includes("비자") || i.description.includes("재류")
      )
      .slice(0, 3);
  if (phase === "PRE-DEPARTURE")
    return items.filter((i) => i.category.includes("출국")).slice(0, 3);
  return items
    .filter(
      (i) => i.description.includes("주소") || i.description.includes("보험")
    )
    .slice(0, 3);
}
function statusLabel(s: string) {
  return s === "DONE" ? "완료" : s === "IN_PROGRESS" ? "진행 중" : "준비 전";
}
function statusTone(s: string) {
  return s === "DONE" ? "success" : s === "IN_PROGRESS" ? "warning" : "muted";
}

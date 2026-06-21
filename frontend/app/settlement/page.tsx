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
  SectionHeader,
  StepCard,
} from "@/components/ui";
import {
  fetchSettlementChecklists,
  generateSettlementGuidance,
  updateSettlementChecklistStatus,
  type SettlementChecklistItem,
  type SettlementGuidance,
  type SettlementStatus,
} from "@/lib/settlement";
import { CountryPanel } from "./_lib/country-panel";
import { timeline } from "./_lib/constants";

export default function SettlementPage() {
  const auth = useRequiredAuth();
  const [items, setItems] = useState<SettlementChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuidanceLoading, setIsGuidanceLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guidance, setGuidance] = useState<SettlementGuidance | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 데이터 로드 로직 (기존 유지)
  useEffect(() => {
    if (auth.isChecking || !auth.user) {
      setIsLoading(false);
      return;
    }
    fetchSettlementChecklists(auth.user.user_id)
      .then((loadedItems) => {
        setItems(loadedItems);
        return refreshGuidance(auth.user?.user_id);
      })
      .catch((e) =>
        setErrorMessage(e instanceof Error ? e.message : "데이터 로드 실패")
      )
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const groupedByCountry = useMemo(
    () =>
      items.reduce<Record<string, SettlementChecklistItem[]>>((acc, item) => {
        acc[item.country] = [...(acc[item.country] ?? []), item];
        return acc;
      }, {}),
    [items]
  );

  const doneCount = items.filter((i) => i.status === "DONE").length;
  const inProgressCount = items.filter(
    (i) => i.status === "IN_PROGRESS"
  ).length;

  async function changeStatus(
    item: SettlementChecklistItem,
    status: SettlementStatus
  ) {
    setUpdatingId(item.item_id);
    try {
      const updated = await updateSettlementChecklistStatus(
        item.item_id,
        status
      );
      setItems((c) =>
        c.map((i) => (i.item_id === updated.item_id ? updated : i))
      );
      setGuidance(null);
    } finally {
      setUpdatingId(null);
    }
  }

  async function refreshGuidance(userId = auth.user?.user_id) {
    if (!userId) return;
    setIsGuidanceLoading(true);
    try {
      setGuidance(await generateSettlementGuidance(userId));
    } finally {
      setIsGuidanceLoading(false);
    }
  }

  if (auth.isChecking) return <AuthCheckingScreen title="권한 확인 중..." />;
  if (!auth.user)
    return <AuthRequiredScreen title="로그인 후 이용 가능합니다." />;

  return (
    <PageShell>
      <SiteHeader />

      {/* 개선된 보더리스 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Settlement Support
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              정착 지원
            </h1>
          </div>
          <LinkButton
            href="/applications"
            variant="secondary"
            className="rounded-xl border-slate-200"
          >
            지원 관리로
          </LinkButton>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen py-8">
        <section className="max-w-[1200px] mx-auto px-6 space-y-8">
          {/* 타임라인 */}
          <div className="grid gap-3 md:grid-cols-3">
            {timeline.map((step, index) => (
              <StepCard
                key={step.title}
                index={index + 1}
                title={step.title}
                description={step.description}
              />
            ))}
          </div>

          {/* 지표 섹션 */}
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard
              label="전체 항목"
              value={items.length}
              className="bg-white border-slate-200"
            />
            <MetricCard
              label="진행 중"
              value={inProgressCount}
              className="bg-white border-slate-200"
            />
            <MetricCard
              label="완료"
              value={doneCount}
              className="bg-white border-slate-200"
            />
          </div>

          {/* 가이던스 섹션 */}
          <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              정착 준비 요약
            </h2>
            {guidance ? (
              <div className="space-y-4">
                <ScoreBar
                  value={guidance.completion_rate}
                  tone={guidance.completion_rate >= 70 ? "success" : "warning"}
                />
                <p className="text-sm text-slate-600 leading-relaxed">
                  {guidance.summary}
                </p>
              </div>
            ) : (
              <Button
                onClick={() => refreshGuidance()}
                disabled={isGuidanceLoading}
              >
                요약 생성
              </Button>
            )}
          </Card>

          {/* 국가별 체크리스트 */}
          <SectionHeader
            title="국가별 준비 리스트"
            description="사용자별 체크리스트 상태가 실시간으로 반영됩니다."
          />
          <div className="grid gap-6 lg:grid-cols-2">
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
        </section>
      </main>
    </PageShell>
  );
}

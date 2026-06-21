"use client";

import { useEffect, useState } from "react";
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
  SelectInput,
  TextInput,
  TimelineCard,
} from "@/components/ui";
import {
  fetchDeparturePlanFromRoadmap,
  generateDeparturePlan,
  generateDeparturePlanFromRoadmap,
  refreshDeparturePlanFromRoadmap,
  type DeparturePlan,
  type DeparturePlanRequest,
} from "@/lib/departure";

const defaultRequest: DeparturePlanRequest = {
  target_country: "일본",
  destination_city: "도쿄",
  origin_airport: "ICN",
  destination_airport: "HND",
  start_date: "2026-06-20",
  arrival_buffer_days: 14,
  visa_status: "내정 후 회사 제출 서류 확인 필요",
  housing_status: "임시 숙소 미정",
};

export default function DepartureRoadmapPage() {
  const auth = useRequiredAuth();
  const [form, setForm] = useState<DeparturePlanRequest>(defaultRequest);
  const [plan, setPlan] = useState<DeparturePlan | null>(null);
  const [linkedRoadmapId, setLinkedRoadmapId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;
    const roadmapId = Number(
      new URLSearchParams(window.location.search).get("roadmapId") ?? 0
    );
    if (!roadmapId) return;
    setLinkedRoadmapId(roadmapId);
    setIsLoading(true);
    loadRoadmapPlan(roadmapId)
      .then(setPlan)
      .catch((e) => setErrorMessage(e.message))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  async function loadRoadmapPlan(id: number) {
    try {
      return await fetchDeparturePlanFromRoadmap(id);
    } catch {
      return await generateDeparturePlanFromRoadmap(id);
    }
  }

  async function submitPlan() {
    setIsLoading(true);
    try {
      setPlan(await generateDeparturePlan(form));
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "생성 실패");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshLinkedPlan() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    try {
      setPlan(await refreshDeparturePlanFromRoadmap(linkedRoadmapId));
    } finally {
      setIsRefreshing(false);
    }
  }

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
              Departure Roadmap
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              출국로드맵
            </h1>
          </div>
          <div className="flex gap-2">
            <LinkButton
              href={
                linkedRoadmapId
                  ? `/roadmap/administration?roadmapId=${linkedRoadmapId}`
                  : "/roadmap/administration"
              }
              variant="secondary"
              className="rounded-xl border-slate-200"
            >
              행정로드맵 확인
            </LinkButton>
            {linkedRoadmapId && (
              <Button
                variant="secondary"
                onClick={refreshLinkedPlan}
                disabled={isRefreshing}
                className="rounded-xl border-slate-200"
              >
                {isRefreshing ? "갱신 중" : "최신 정보 갱신"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen py-8">
        <section className="max-w-[1200px] mx-auto px-6 grid gap-8 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-4">
            <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-6">
                출국 조건 입력
              </h2>
              <div className="space-y-4">
                <SelectInput
                  label="목표 국가"
                  value={form.target_country}
                  onChange={(e) => update("target_country", e.target.value)}
                >
                  <option value="일본">일본</option>
                  <option value="미국">미국</option>
                </SelectInput>
                <TextInput
                  label="도착 도시"
                  value={form.destination_city}
                  onChange={(e) => update("destination_city", e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="출발 공항"
                    value={form.origin_airport}
                    onChange={(e) =>
                      update("origin_airport", e.target.value.toUpperCase())
                    }
                  />
                  <TextInput
                    label="도착 공항"
                    value={form.destination_airport}
                    onChange={(e) =>
                      update(
                        "destination_airport",
                        e.target.value.toUpperCase()
                      )
                    }
                  />
                </div>
                <TextInput
                  label="입사 예정일"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => update("start_date", e.target.value)}
                />
                <TextInput
                  label="입국 여유일"
                  type="number"
                  value={form.arrival_buffer_days}
                  onChange={(e) =>
                    update("arrival_buffer_days", Number(e.target.value))
                  }
                />
                <TextInput
                  label="비자 상태"
                  value={form.visa_status}
                  onChange={(e) => update("visa_status", e.target.value)}
                />
                <TextInput
                  label="숙소 상태"
                  value={form.housing_status}
                  onChange={(e) => update("housing_status", e.target.value)}
                />
                <Button
                  className="w-full rounded-xl mt-2"
                  onClick={submitPlan}
                  disabled={isLoading}
                >
                  {isLoading ? "생성 중..." : "출국 로드맵 생성"}
                </Button>
              </div>
            </Card>
          </aside>

          <main className="space-y-6">
            {!plan ? (
              <EmptyState title="출국 조건을 입력하여 로드맵을 시작하세요." />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <MetricCard
                    label="입사 예정일"
                    value={plan.start_date}
                    className="bg-white border-slate-200"
                  />
                  <MetricCard
                    label="권장 입국일"
                    value={plan.recommended_arrival_date}
                    className="bg-white border-slate-200"
                  />
                  <MetricCard
                    label="준비 기간"
                    value={`${plan.departure_window_start}~`}
                    className="bg-white border-slate-200"
                  />
                  <MetricCard
                    label="출국 D-Day"
                    value={dDayLabel(plan.days_until_departure_window)}
                    className="bg-white border-slate-200"
                  />
                </div>

                <Card className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">
                    항공편 탐색 기준
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    {plan.flight_search_note}
                  </p>
                  <div className="grid gap-3">
                    {plan.flight_offers.map((offer, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-4 rounded-xl border border-slate-100 bg-slate-50"
                      >
                        <div>
                          <p className="text-xs font-bold">
                            {offer.carrier_name} {offer.flight_number}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {offer.origin_code} → {offer.destination_code}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-indigo-600">
                          {offer.total_price} {offer.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="pl-6 border-l-2 border-indigo-100 space-y-6">
                  {plan.milestones.map((m, i) => (
                    <TimelineCard key={i} label={m.phase} title={m.title}>
                      <p className="text-xs text-slate-500 mb-2">
                        {m.description}
                      </p>
                      <Badge
                        tone={milestoneTone(m.status)}
                        className="text-[10px]"
                      >
                        {milestoneLabel(m.status)}
                      </Badge>
                    </TimelineCard>
                  ))}
                </div>
              </>
            )}
          </main>
        </section>
      </main>
    </PageShell>
  );

  function update<K extends keyof DeparturePlanRequest>(
    key: K,
    val: DeparturePlanRequest[K]
  ) {
    setForm((c) => ({ ...c, [key]: val }));
  }
}

function dDayLabel(days: number) {
  return days < 0 ? "기간 지남" : days === 0 ? "오늘" : `D-${days}`;
}
function milestoneLabel(status: string) {
  return status === "DONE" ? "완료" : status === "URGENT" ? "긴급" : "예정";
}
function milestoneTone(status: string) {
  return status === "DONE"
    ? "success"
    : status === "URGENT"
    ? "danger"
    : "brand";
}

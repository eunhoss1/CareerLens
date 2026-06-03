"use client";

import { useEffect, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, SelectInput, TextInput, TimelineCard } from "@/components/ui";
import {
  fetchDeparturePlanFromRoadmap,
  generateDeparturePlan,
  generateDeparturePlanFromRoadmap,
  refreshDeparturePlanFromRoadmap,
  type DeparturePlan,
  type DeparturePlanRequest
} from "@/lib/departure";

const defaultRequest: DeparturePlanRequest = {
  target_country: "일본",
  destination_city: "도쿄",
  origin_airport: "ICN",
  destination_airport: "HND",
  start_date: "2026-06-20",
  arrival_buffer_days: 14,
  visa_status: "내정 후 회사 제출 서류 확인 필요",
  housing_status: "임시 숙소 미정"
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
    const roadmapId = Number(new URLSearchParams(window.location.search).get("roadmapId") ?? 0);
    if (!roadmapId) return;
    setLinkedRoadmapId(roadmapId);
    setIsLoading(true);
    setErrorMessage(null);
    loadRoadmapPlan(roadmapId)
      .then(setPlan)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 생성하지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="출국로드맵 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="출국로드맵은 로그인 후 이용할 수 있습니다." />;
  }

  async function loadRoadmapPlan(roadmapId: number) {
    try {
      return await fetchDeparturePlanFromRoadmap(roadmapId);
    } catch (error) {
      if (isMissingSavedPlan(error)) {
        return generateDeparturePlanFromRoadmap(roadmapId);
      }
      throw error;
    }
  }

  async function submitPlan() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await generateDeparturePlan(form);
      setPlan(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 생성하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshLinkedPlan() {
    if (!linkedRoadmapId) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    try {
      setPlan(await refreshDeparturePlanFromRoadmap(linkedRoadmapId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "출국 로드맵을 갱신하지 못했습니다.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="DEPARTURE ROADMAP"
        title="출국로드맵"
        actions={
          <>
            <LinkButton
              href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
              className="min-w-[132px] whitespace-nowrap"
            >
              행정로드맵 확인
            </LinkButton>
            {linkedRoadmapId && (
              <Button type="button" variant="secondary" onClick={refreshLinkedPlan} disabled={isRefreshing || isLoading}>
                {isRefreshing ? "갱신 중" : "최신 정보로 갱신"}
              </Button>
            )}
          </>
        }
      />

      <section className="lens-container grid gap-6 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <Card className="p-5">
            <p className="lens-kicker">TRAVEL INPUT</p>
            <h2 className="mt-3 text-2xl font-semibold text-night">출국 조건 입력</h2>
            <div className="mt-5 space-y-4">
              <SelectInput label="목표 국가" value={form.target_country} onChange={(event) => update("target_country", event.target.value)}>
                <option value="일본">일본</option>
                <option value="미국">미국</option>
              </SelectInput>
              <TextInput label="도착 도시" value={form.destination_city} onChange={(event) => update("destination_city", event.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <TextInput label="출발 공항" helper="IATA" value={form.origin_airport} onChange={(event) => update("origin_airport", event.target.value.toUpperCase())} />
                <TextInput label="도착 공항" helper="IATA" value={form.destination_airport} onChange={(event) => update("destination_airport", event.target.value.toUpperCase())} />
              </div>
              <TextInput label="입사 예정일" type="date" value={form.start_date} onChange={(event) => update("start_date", event.target.value)} />
              <TextInput
                label="입국 여유일"
                helper="입사 며칠 전 도착할지"
                type="number"
                min={3}
                max={45}
                value={form.arrival_buffer_days}
                onChange={(event) => update("arrival_buffer_days", Number(event.target.value))}
              />
              <TextInput label="비자 상태" value={form.visa_status} onChange={(event) => update("visa_status", event.target.value)} />
              <TextInput label="숙소 상태" value={form.housing_status} onChange={(event) => update("housing_status", event.target.value)} />
              <Button type="button" disabled={isLoading} onClick={submitPlan} className="w-full">
                {isLoading ? "로드맵 생성 중" : "출국 로드맵 생성"}
              </Button>
            </div>
          </Card>

          <Card className="p-5">
            <p className="lens-kicker">FLIGHT DATA POLICY</p>
            <h2 className="mt-3 text-xl font-semibold text-night">항공 데이터 연동 방향</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              항공사/OTA 사이트를 크롤링하지 않고, 승인된 Flight API 또는 사용자가 직접 확인한 항공편 정보를 입력하는 구조로 확장합니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="brand">API-ready</Badge>
              <Badge tone="muted">No scraping</Badge>
              <Badge tone="warning">공식 확인 필요</Badge>
            </div>
          </Card>
        </aside>

        <main className="space-y-5">
          {errorMessage && <EmptyState title="출국 로드맵 생성 실패" description={errorMessage} />}

          {!plan && !errorMessage && (
            <EmptyState
              title="입사 예정일 기준 출국 일정을 생성할 수 있습니다."
              description="도착 도시, 공항 코드, 입사 예정일, 비자/숙소 상태를 입력하면 출국 후보 기간과 준비 마일스톤을 계산합니다."
            />
          )}

          {plan && (
            <>
              <Card className="p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={plan.generation_mode.includes("AI") ? "brand" : "muted"}>
                        {plan.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"}
                      </Badge>
                      <Badge tone={urgencyTone(plan.urgency_status)}>{urgencyLabel(plan.urgency_status)}</Badge>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-night">
                      {plan.origin_airport} → {plan.destination_airport} 출국 준비
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{plan.summary}</p>
                    {plan.updated_at && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        저장일 {formatDateTime(plan.created_at ?? plan.updated_at)} · 최근 갱신 {formatDateTime(plan.refreshed_at ?? plan.updated_at)}
                      </p>
                    )}
                  </div>
                  <LinkButton
                    href={linkedRoadmapId ? `/roadmap/administration?roadmapId=${linkedRoadmapId}` : "/roadmap/administration"}
                    variant="secondary"
                    className="shrink-0 whitespace-nowrap"
                  >
                    행정로드맵 확인
                  </LinkButton>
                </div>
              </Card>

              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label="입사 예정일" value={plan.start_date} helper={`${plan.target_country} ${plan.destination_city}`} />
                <MetricCard label="권장 입국일" value={plan.recommended_arrival_date} helper="입국 후 적응 여유 포함" />
                <MetricCard label="출국 후보 기간" value={`${plan.departure_window_start}~`} helper={plan.departure_window_end} />
                <MetricCard label="출국 준비 D-day" value={dDayLabel(plan.days_until_departure_window)} helper="후보 기간 시작 기준" />
              </div>

              <Card className="p-5">
                <p className="lens-kicker">FLIGHT SEARCH BRIEF</p>
                <h2 className="mt-3 text-xl font-semibold text-night">항공편 탐색 기준</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={flightDataTone(plan.flight_data_status)}>{flightDataLabel(plan.flight_data_status)}</Badge>
                  {plan.flight_offers.length > 0 && <Badge tone="brand">{plan.flight_offers.length}개 후보</Badge>}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{plan.flight_search_note}</p>
                {plan.flight_offers.length > 0 && (
                  <div className="mt-5 grid gap-3">
                    {plan.flight_offers.map((offer, index) => (
                      <div key={`${offer.provider}-${offer.departure_at}-${index}`} className="rounded-xl border border-line bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-night">
                              {offer.origin_code} → {offer.destination_code}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatDateTime(offer.departure_at)} 출발 · {formatDateTime(offer.arrival_at)} 도착
                            </p>
                            <p className="mt-2 text-sm text-slate-600">
                              {offer.carrier_name || offer.carrier_code} {offer.flight_number} · {offer.duration || "소요시간 미기재"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-line bg-panel px-3 py-2 text-right">
                            <p className="text-xs font-bold text-slate-500">{offer.provider}</p>
                            <p className="mt-1 text-base font-semibold text-night">
                              {offer.currency} {offer.total_price || "미기재"}
                            </p>
                            {offer.bookable_seats !== null && <p className="mt-1 text-xs text-slate-500">좌석 {offer.bookable_seats}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {plan.flight_api_providers.map((provider) => (
                    <div key={provider.provider} className="rounded-xl border border-line bg-panel p-4">
                      <p className="text-sm font-semibold text-night">{provider.provider}</p>
                      <p className="mt-2 text-xs font-bold text-brand">{provider.integrationStatus}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{provider.useCase}</p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{provider.note}</p>
                    </div>
                  ))}
                </div> */}
              </Card>

              <section className="border-l border-night pl-4">
                <div className="space-y-4">
                  {plan.milestones.map((milestone) => (
                    <TimelineCard key={`${milestone.phase}-${milestone.title}`} label={milestone.phase} title={milestone.title}>
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm leading-6 text-slate-600">{milestone.description}</p>
                          <p className="mt-2 text-xs text-slate-500">기한: {milestone.due_date}</p>
                        </div>
                        <Badge tone={milestoneTone(milestone.status)}>{milestoneLabel(milestone.status)}</Badge>
                      </div>
                    </TimelineCard>
                  ))}
                </div>
              </section>

              <Card className="p-5">
                <p className="text-xs leading-5 text-slate-500">{plan.disclaimer}</p>
              </Card>
            </>
          )}
        </main>
      </section>
    </PageShell>
  );

  function update<Key extends keyof DeparturePlanRequest>(key: Key, value: DeparturePlanRequest[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }
}

function dDayLabel(days: number) {
  if (days < 0) return "기간 지남";
  if (days === 0) return "오늘";
  return `D-${days}`;
}

function urgencyLabel(status: string) {
  if (status === "ON_TRACK") return "일정 여유";
  if (status === "SOON") return "곧 준비";
  if (status === "URGENT") return "긴급";
  return "지연";
}

function urgencyTone(status: string) {
  if (status === "ON_TRACK") return "success";
  if (status === "SOON") return "warning";
  return "risk";
}

function milestoneLabel(status: string) {
  if (status === "DONE") return "기한 지남";
  if (status === "URGENT") return "긴급";
  return "예정";
}

function milestoneTone(status: string) {
  if (status === "DONE") return "muted";
  if (status === "URGENT") return "risk";
  return "brand";
}

function flightDataLabel(status: string) {
  if (status === "LIVE_DUFFEL") return "Duffel 실시간 후보";
  if (status === "LIVE_AMADEUS") return "Amadeus 실시간 후보";
  if (status === "NO_RESULTS_OR_FAILED") return "API 결과 없음";
  return "API 미설정";
}

function flightDataTone(status: string) {
  if (status === "LIVE_DUFFEL" || status === "LIVE_AMADEUS") return "success";
  if (status === "NO_RESULTS_OR_FAILED") return "warning";
  return "muted";
}

function isMissingSavedPlan(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("not found") || message.includes("404");
}

function formatDateTime(value: string) {
  if (!value) return "미기재";
  return value.replace("T", " ");
}

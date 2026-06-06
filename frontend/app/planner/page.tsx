"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, EmptyState, LinkButton, PageShell, ScoreBar } from "@/components/ui";
import { fetchUserRoadmaps, type PlannerRoadmap } from "@/lib/planner";

export default function PlannerListPage() {
  const auth = useRequiredAuth();
  const [roadmaps, setRoadmaps] = useState<PlannerRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }
    fetchUserRoadmaps(auth.user.user_id)
      .then(setRoadmaps)
      .catch(() => setRoadmaps([]))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const roadmapSummaries = useMemo(() => {
    return roadmaps.map((roadmap) => {
      const completed = roadmap.completed_task_count ?? roadmap.tasks.filter((task) => task.status === "DONE").length;
      const total = roadmap.total_task_count ?? roadmap.tasks.length;
      const completionRate = roadmap.completion_rate ?? (total === 0 ? 0 : Math.round((completed / total) * 100));
      return { roadmap, completed, total, completionRate };
    });
  }, [roadmaps]);

  const nextRoadmap = roadmapSummaries.find((item) => item.completionRate < 100) ?? roadmapSummaries[0] ?? null;
  const totalTasks = roadmapSummaries.reduce((sum, item) => sum + item.total, 0);
  const completedTasks = roadmapSummaries.reduce((sum, item) => sum + item.completed, 0);
  const inProgressRoadmaps = roadmapSummaries.filter((item) => item.completionRate > 0 && item.completionRate < 100).length;
  const averageCompletion = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="커리어 플래너 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="커리어 플래너는 로그인 후 이용할 수 있습니다." />;
  }

  return (
    <PageShell>
      <SiteHeader />
      <TopPlannerIntro />

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#f3f7fb_42%,#eef4f3_100%)] px-2 py-5 sm:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-[1680px] px-3 sm:px-5">
        {isLoading && <EmptyState title="로드맵을 불러오는 중입니다." description="저장된 커리어 플래너 목록을 확인하고 있습니다." />}
        {!isLoading && roadmaps.length === 0 && (
          <EmptyState title="아직 생성된 플래너가 없습니다." action={<LinkButton href="/jobs/recommendation">추천 진단으로</LinkButton>} />
        )}

        {!isLoading && roadmapSummaries.length > 0 && (
          <div className="grid w-full items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <main className="min-w-0 space-y-4">
              <SummaryHero
                roadmapCount={roadmapSummaries.length}
                inProgressRoadmaps={inProgressRoadmaps}
                averageCompletion={averageCompletion}
                completedTasks={completedTasks}
                totalTasks={totalTasks}
                nextRoadmap={nextRoadmap}
              />

              <div className="grid gap-4 lg:grid-cols-2">
                {roadmapSummaries.map(({ roadmap, completed, total, completionRate }) => {
                  return (
                    <RoadmapListCard
                      key={roadmap.roadmap_id}
                      roadmap={roadmap}
                      completed={completed}
                      total={total}
                      completionRate={completionRate}
                    />
                  );
                })}
              </div>
            </main>

            <InsightPanel roadmapSummaries={roadmapSummaries} nextRoadmap={nextRoadmap} averageCompletion={averageCompletion} />
          </div>
        )}
        </div>
      </section>
    </PageShell>
  );
}

function TopPlannerIntro() {
  return (
    <section className="border-b border-slate-200 bg-white px-2 py-6 sm:px-3 lg:px-4">
      <div className="mx-auto grid w-full max-w-[1680px] gap-4 px-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex border border-slate-950 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-950">
              Career Planner
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">커리어 플래너</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              분석 결과를 기반으로 생성된 로드맵의 진행 현황과 다음 액션을 한 화면에서 확인하세요.
            </p>
          </div>
          <LinkButton href="/jobs/recommendation" className="w-full justify-center rounded-xl md:w-auto">
            적합도 진단으로 이동
          </LinkButton>
        </div>
      </div>
    </section>
  );
}

function SummaryHero({
  roadmapCount,
  inProgressRoadmaps,
  averageCompletion,
  completedTasks,
  totalTasks,
  nextRoadmap
}: {
  roadmapCount: number;
  inProgressRoadmaps: number;
  averageCompletion: number;
  completedTasks: number;
  totalTasks: number;
  nextRoadmap: { roadmap: PlannerRoadmap; completed: number; total: number; completionRate: number } | null;
}) {
  return (
    <Card className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-[#f4fffc] shadow-[0_18px_46px_rgba(15,23,42,0.06)]">
      <div className="border-l-4 border-l-teal-400 bg-[linear-gradient(100deg,#effffc_0%,#f8fffd_46%,#ffffff_74%)] p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-[13px] font-black uppercase tracking-[0.28em] text-teal-700">Progress Overview</p>
            <h2 className="mt-2 text-[52px] font-black leading-none tracking-[-0.06em] text-slate-950 md:text-[60px]">이어갈 로드맵</h2>
            {nextRoadmap && (
              <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/75 px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between lg:mt-auto">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">다음 추천</p>
                  <p className="mt-5 truncate text-lg font-black text-slate-950">{nextRoadmap.roadmap.title}</p>
                </div>
                <LinkButton href={`/planner/${nextRoadmap.roadmap.roadmap_id}`} variant="secondary" className="shrink-0 rounded-xl px-6 py-3 text-base font-black">
                  바로 이어하기
                </LinkButton>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[500px]">
            <SummaryMetric label="로드맵" value={`${roadmapCount}개`} helper="생성된 계획" />
            <SummaryMetric label="진행 중" value={`${inProgressRoadmaps}개`} helper="완료 전 로드맵" />
            <SummaryMetric label="전체 완료율" value={`${averageCompletion}%`} helper="전체 과제 기준" />
            <SummaryMetric label="완료 과제" value={`${completedTasks}/${totalTasks}`} helper="완료/전체" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function RoadmapListCard({
  roadmap,
  completed,
  total,
  completionRate
}: {
  roadmap: PlannerRoadmap;
  completed: number;
  total: number;
  completionRate: number;
}) {
  return (
    <a href={`/planner/${roadmap.roadmap_id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal-700">{roadmap.target_company}</p>
            <h2 className="mt-2 line-clamp-2 text-lg font-semibold leading-7 tracking-tight text-slate-950">{roadmap.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{roadmap.target_job_title}</p>
          </div>
          <Badge tone={readinessTone(roadmap.readiness_status)} className="shrink-0 whitespace-nowrap rounded-full">
            {readinessLabel(roadmap.readiness_status)}
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
          <SmallMetric label="점수" value={`${roadmap.total_score}`} />
          <SmallMetric label="기간" value={`${roadmap.duration_weeks}주`} />
          <SmallMetric label="과제" value={`${completed}/${total}`} />
        </div>

        <div className="mt-5">
          <ScoreBar label="완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone={completionRate >= 100 ? "success" : "warning"} className="rounded-full">
              {completed}개 완료
            </Badge>
            <Badge tone="muted" className="rounded-full">
              생성일 {new Date(roadmap.created_at).toLocaleDateString("ko-KR")}
            </Badge>
          </div>
          <span className="text-lg font-semibold text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700">›</span>
        </div>
      </Card>
    </a>
  );
}

function InsightPanel({
  roadmapSummaries,
  nextRoadmap,
  averageCompletion
}: {
  roadmapSummaries: { roadmap: PlannerRoadmap; completed: number; total: number; completionRate: number }[];
  nextRoadmap: { roadmap: PlannerRoadmap; completed: number; total: number; completionRate: number } | null;
  averageCompletion: number;
}) {
  const sortedByCreatedAt = [...roadmapSummaries].sort(
    (a, b) => new Date(b.roadmap.created_at).getTime() - new Date(a.roadmap.created_at).getTime()
  );
  const focusRoadmaps = roadmapSummaries.filter((item) => item.completionRate < 100).slice(0, 3);

  return (
    <aside className="space-y-4 xl:sticky xl:top-5 xl:self-start">
      <Card className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Insights</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">추천 인사이트</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">완료율과 과제 현황을 기준으로 지금 이어갈 항목을 정리했습니다.</p>
        </div>

        <div className="space-y-4 p-5">
          <section className="rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
            <p className="text-sm font-semibold text-teal-900">오늘의 추천</p>
            <p className="mt-2 text-sm leading-6 text-teal-800">
              {nextRoadmap ? nextRoadmap.roadmap.next_action || `${nextRoadmap.roadmap.title}을 이어서 진행하세요.` : "완료 전 로드맵이 없습니다."}
            </p>
            {nextRoadmap && (
              <LinkButton href={`/planner/${nextRoadmap.roadmap.roadmap_id}`} variant="secondary" className="mt-4 w-full justify-center rounded-xl bg-white">
                추천 로드맵 보기
              </LinkButton>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">전체 진행률</p>
              <span className="text-lg font-semibold text-slate-950">{averageCompletion}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.max(0, Math.min(100, averageCompletion))}%` }} />
            </div>
          </section>

          <section>
            <p className="text-sm font-semibold text-slate-900">우선 확인 로드맵</p>
            <div className="mt-3 space-y-3">
              {focusRoadmaps.map((item) => (
                <a
                  key={`focus-${item.roadmap.roadmap_id}`}
                  href={`/planner/${item.roadmap.roadmap_id}`}
                  className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-teal-300"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.roadmap.target_company}</p>
                    <span className="shrink-0 text-xs font-semibold text-teal-700">{item.completionRate}%</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.roadmap.target_job_title}</p>
                </a>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <Card className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
        <p className="text-sm font-semibold text-slate-900">최근 활동</p>
        <div className="mt-4 space-y-4">
          {sortedByCreatedAt.slice(0, 4).map((item) => (
            <div key={`activity-${item.roadmap.roadmap_id}`} className="flex gap-3">
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-teal-400 shadow-[0_0_0_5px_rgba(20,184,166,0.12)]" />
              <div>
                <p className="text-sm font-medium leading-5 text-slate-800">{item.roadmap.title}</p>
                <p className="mt-1 text-xs text-slate-500">생성일 {new Date(item.roadmap.created_at).toLocaleDateString("ko-KR")}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function SummaryMetric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <p className="text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{label}</p>
      <p className="mt-1 text-lg font-medium tracking-tight text-slate-950">{value}</p>
      <p className="mt-0.5 text-[11px] font-normal text-slate-500">{helper}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function ComparisonMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <span className="whitespace-nowrap text-xs font-semibold text-slate-500">{label}</span>
      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-950">{value}</span>
    </div>
  );
}

function readinessLabel(status: string) {
  if (status === "IMMEDIATE_APPLY") return "바로 지원 가능";
  if (status === "PREPARE_THEN_APPLY") return "준비 후 지원";
  if (status === "LONG_TERM_PREPARE") return "장기 준비";
  return "준비 상태 확인";
}

function readinessTone(status: string) {
  if (status === "IMMEDIATE_APPLY") return "success";
  if (status === "PREPARE_THEN_APPLY") return "brand";
  return "warning";
}

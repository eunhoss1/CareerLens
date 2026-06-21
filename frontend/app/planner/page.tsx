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
  Card,
  EmptyState,
  LinkButton,
  PageShell,
  ScoreBar,
} from "@/components/ui";
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
      const completed =
        roadmap.completed_task_count ??
        roadmap.tasks.filter((task) => task.status === "DONE").length;
      const total = roadmap.total_task_count ?? roadmap.tasks.length;
      const completionRate =
        roadmap.completion_rate ??
        (total === 0 ? 0 : Math.round((completed / total) * 100));
      return { roadmap, completed, total, completionRate };
    });
  }, [roadmaps]);

  const nextRoadmap =
    roadmapSummaries.find((item) => item.completionRate < 100) ??
    roadmapSummaries[0] ??
    null;
  const totalTasks = roadmapSummaries.reduce(
    (sum, item) => sum + item.total,
    0
  );
  const completedTasks = roadmapSummaries.reduce(
    (sum, item) => sum + item.completed,
    0
  );
  const inProgressRoadmaps = roadmapSummaries.filter(
    (item) => item.completionRate > 0 && item.completionRate < 100
  ).length;
  const averageCompletion =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="커리어 플래너 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="커리어 플래너는 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <TopPlannerIntro />

      <section className="min-h-screen bg-slate-50/50 px-4 py-8">
        <div className="mx-auto w-full max-w-[1200px]">
          {isLoading && (
            <EmptyState
              title="로드맵을 불러오는 중입니다."
              description="저장된 커리어 플래너 목록을 확인하고 있습니다."
            />
          )}
          {!isLoading && roadmaps.length === 0 && (
            <EmptyState
              title="아직 생성된 플래너가 없습니다."
              action={
                <LinkButton href="/jobs/recommendation">
                  추천 진단으로
                </LinkButton>
              }
            />
          )}

          {!isLoading && roadmapSummaries.length > 0 && (
            <div className="grid w-full items-start gap-6 xl:grid-cols-[1fr_300px]">
              <main className="min-w-0 space-y-6">
                <SummaryHero
                  roadmapCount={roadmapSummaries.length}
                  inProgressRoadmaps={inProgressRoadmaps}
                  averageCompletion={averageCompletion}
                  completedTasks={completedTasks}
                  totalTasks={totalTasks}
                  nextRoadmap={nextRoadmap}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  {roadmapSummaries.map(
                    ({ roadmap, completed, total, completionRate }) => {
                      return (
                        <RoadmapListCard
                          key={roadmap.roadmap_id}
                          roadmap={roadmap}
                          completed={completed}
                          total={total}
                          completionRate={completionRate}
                        />
                      );
                    }
                  )}
                </div>
              </main>

              <InsightPanel
                roadmapSummaries={roadmapSummaries}
                nextRoadmap={nextRoadmap}
                averageCompletion={averageCompletion}
              />
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function TopPlannerIntro() {
  return (
    <section className="border-b border-slate-200 bg-white px-4 py-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase">
              Career Planner
            </span>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              커리어 플래너
            </h1>
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-slate-500">
              분석 결과를 기반으로 생성된 로드맵의 진행 현황과 다음 액션을 한
              화면에서 확인하세요.
            </p>
          </div>
          <LinkButton
            href="/jobs/recommendation"
            className="w-full justify-center rounded-xl md:w-auto bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 transition-all"
          >
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
  nextRoadmap,
}: {
  roadmapCount: number;
  inProgressRoadmaps: number;
  averageCompletion: number;
  completedTasks: number;
  totalTasks: number;
  nextRoadmap: {
    roadmap: PlannerRoadmap;
    completed: number;
    total: number;
    completionRate: number;
  } | null;
}) {
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                Progress Overview
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                이어갈 로드맵
              </h2>
            </div>

            {nextRoadmap && (
              <div className="mt-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">
                    다음 추천 액션
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {nextRoadmap.roadmap.title}
                  </p>
                </div>
                <LinkButton
                  href={`/planner/${nextRoadmap.roadmap.roadmap_id}`}
                  variant="secondary"
                  className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 transition-all"
                >
                  바로 이어하기
                </LinkButton>
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[440px]">
            <SummaryMetric label="생성된 로드맵" value={`${roadmapCount}개`} />
            <SummaryMetric label="진행 중" value={`${inProgressRoadmaps}개`} />
            <SummaryMetric
              label="전체 완료율"
              value={`${averageCompletion}%`}
            />
            <SummaryMetric
              label="완료 과제"
              value={`${completedTasks}/${totalTasks}`}
              inlineHelper="(완료/전체)"
            />
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
  completionRate,
}: {
  roadmap: PlannerRoadmap;
  completed: number;
  total: number;
  completionRate: number;
}) {
  return (
    <a href={`/planner/${roadmap.roadmap_id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-[0_12px_36px_rgba(0,0,0,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-indigo-600 tracking-wide">
              {roadmap.target_company}
            </p>
            <h2 className="mt-1.5 line-clamp-2 text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition">
              {roadmap.title}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              {roadmap.target_job_title}
            </p>
          </div>
          <Badge
            tone={readinessTone(roadmap.readiness_status)}
            className="shrink-0 whitespace-nowrap rounded-md text-[10px] px-2 py-0.5 font-medium"
          >
            {readinessLabel(roadmap.readiness_status)}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-center">
          <SmallMetric label="점수" value={`${roadmap.total_score}`} />
          <SmallMetric label="기간" value={`${roadmap.duration_weeks}주`} />
          <SmallMetric label="과제" value={`${completed}/${total}`} />
        </div>

        <div className="mt-4">
          <ScoreBar
            label="완료율"
            value={completionRate}
            tone={completionRate >= 80 ? "success" : "brand"}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100/80">
          <div className="flex flex-wrap gap-1.5">
            <Badge
              tone={completionRate >= 100 ? "success" : "warning"}
              className="rounded-md text-[10px] px-2 py-0.5 font-medium"
            >
              {completed}개 완료
            </Badge>
            <Badge
              tone="muted"
              className="rounded-md text-[10px] px-2 py-0.5 font-medium bg-slate-50 text-slate-400"
            >
              생성일 {new Date(roadmap.created_at).toLocaleDateString("ko-KR")}
            </Badge>
          </div>
          <span className="text-base font-bold text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">
            →
          </span>
        </div>
      </Card>
    </a>
  );
}

function InsightPanel({
  roadmapSummaries,
  nextRoadmap,
  averageCompletion,
}: {
  roadmapSummaries: {
    roadmap: PlannerRoadmap;
    completed: number;
    total: number;
    completionRate: number;
  }[];
  nextRoadmap: {
    roadmap: PlannerRoadmap;
    completed: number;
    total: number;
    completionRate: number;
  } | null;
  averageCompletion: number;
}) {
  const sortedByCreatedAt = [...roadmapSummaries].sort(
    (a, b) =>
      new Date(b.roadmap.created_at).getTime() -
      new Date(a.roadmap.created_at).getTime()
  );
  const focusRoadmaps = roadmapSummaries
    .filter((item) => item.completionRate < 100)
    .slice(0, 3);

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Insights
          </p>
          <h2 className="mt-1 text-sm font-bold text-slate-900 tracking-tight">
            추천 인사이트
          </h2>
        </div>

        <div className="space-y-4 p-5">
          <section className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
            <p className="text-xs font-bold text-indigo-600">오늘의 추천</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 font-medium">
              {nextRoadmap
                ? nextRoadmap.roadmap.next_action ||
                  `${nextRoadmap.roadmap.title}을 이어서 진행하세요.`
                : "완료 전 로드맵이 없습니다."}
            </p>
            {nextRoadmap && (
              <LinkButton
                href={`/planner/${nextRoadmap.roadmap.roadmap_id}`}
                variant="secondary"
                className="mt-3.5 w-full justify-center rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2"
              >
                추천 로드맵 보기
              </LinkButton>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-slate-700">전체 진행률</p>
              <span className="text-sm font-black text-slate-900">
                {averageCompletion}%
              </span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, averageCompletion))}%`,
                }}
              />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-bold text-slate-700">우선 확인 로드맵</p>
            <div className="space-y-2">
              {focusRoadmaps.map((item) => (
                <a
                  key={`focus-${item.roadmap.roadmap_id}`}
                  href={`/planner/${item.roadmap.roadmap_id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition hover:border-indigo-400"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="line-clamp-1 text-xs font-bold text-slate-800">
                      {item.roadmap.target_company}
                    </p>
                    <span className="shrink-0 text-xs font-bold text-indigo-600">
                      {item.completionRate}%
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">
                    {item.roadmap.target_job_title}
                  </p>
                </a>
              ))}
            </div>
          </section>
        </div>
      </Card>

      <Card className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <p className="text-xs font-bold text-slate-700 mb-3">최근 활동 목록</p>
        <div className="space-y-3.5">
          {sortedByCreatedAt.slice(0, 4).map((item) => (
            <div
              key={`activity-${item.roadmap.roadmap_id}`}
              className="flex gap-2.5"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_0_4px_rgba(79,70,229,0.08)]" />
              <div>
                <p className="text-xs font-semibold leading-relaxed text-slate-700 line-clamp-1">
                  {item.roadmap.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  생성일{" "}
                  {new Date(item.roadmap.created_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </aside>
  );
}

function SummaryMetric({
  label,
  value,
  helper,
  inlineHelper,
}: {
  label: string;
  value: string;
  helper?: string;
  inlineHelper?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-1 text-lg font-black tracking-tight text-slate-900">
        <span>{value}</span>
        {inlineHelper && (
          <span className="text-[10px] font-normal text-slate-400 ml-1">
            {inlineHelper}
          </span>
        )}
      </p>
      {helper && (
        <p className="mt-0.5 text-[10px] font-normal text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-800">
        {value}
      </p>
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

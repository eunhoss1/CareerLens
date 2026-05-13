"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { fetchUserRoadmaps, type PlannerRoadmap } from "@/lib/planner";

export default function PlannerListPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roadmaps, setRoadmaps] = useState<PlannerRoadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }
    fetchUserRoadmaps(storedUser.user_id)
      .then(setRoadmaps)
      .catch(() => setRoadmaps([]))
      .finally(() => setIsLoading(false));
  }, []);

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

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="CAREERLENS PLAN"
        title="커리어 플래너"
        description="적합도 진단에서 만든 준비 로드맵을 모아보고, 다음 과제와 완료율을 확인합니다."
        actions={<LinkButton href="/jobs/recommendation">적합도 진단으로</LinkButton>}
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="로드맵을 불러오는 중입니다." description="저장된 커리어 플래너 목록을 확인하고 있습니다." />}
        {!isLoading && !user && <EmptyState title="로그인이 필요합니다." description="회원가입 또는 로그인 후 추천 진단에서 커리어 플래너를 생성할 수 있습니다." action={<LinkButton href="/login">로그인</LinkButton>} />}
        {!isLoading && user && roadmaps.length === 0 && (
          <EmptyState title="아직 생성된 플래너가 없습니다." description="맞춤채용정보 추천 진단에서 공고 카드를 선택해 커리어 플래너를 생성하세요." action={<LinkButton href="/jobs/recommendation">추천 진단으로</LinkButton>} />
        )}

        {!isLoading && user && roadmapSummaries.length > 0 && (
          <Card className="mb-5 rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
              <div>
                <p className="text-sm font-bold text-brand">진행 요약</p>
                <h2 className="mt-2 text-2xl font-bold text-night">이어갈 로드맵</h2>
                {nextRoadmap && (
                  <div className="mt-5 rounded-xl border-l-4 border-brand bg-slate-50 px-4 py-4">
                    <p className="text-xs font-bold text-slate-500">다음 추천</p>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-lg font-bold text-night">{nextRoadmap.roadmap.title}</p>
                      <LinkButton href={`/planner/${nextRoadmap.roadmap.roadmap_id}`} variant="secondary" className="rounded-lg">
                        바로 이어하기
                      </LinkButton>
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="로드맵" value={`${roadmapSummaries.length}개`} />
                <MetricCard label="진행 중" value={`${inProgressRoadmaps}개`} />
                <MetricCard label="전체 완료율" value={`${averageCompletion}%`} />
                <MetricCard label="완료 과제" value={`${completedTasks}/${totalTasks}`} />
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {roadmapSummaries.map(({ roadmap, completed, total, completionRate }) => {
            return (
              <a key={roadmap.roadmap_id} href={`/planner/${roadmap.roadmap_id}`} className="block">
                <Card className="rounded-2xl border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{roadmap.target_company}</p>
                      <h2 className="mt-2 text-lg font-semibold text-night">{roadmap.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{roadmap.target_job_title}</p>
                    </div>
                    <Badge tone={readinessTone(roadmap.readiness_status)}>{readinessLabel(roadmap.readiness_status)}</Badge>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-4 border-y border-slate-100 py-4">
                    <SmallMetric label="점수" value={`${roadmap.total_score}`} />
                    <SmallMetric label="기간" value={`${roadmap.duration_weeks}주`} />
                    <SmallMetric label="과제" value={`${completed}/${total}`} />
                  </div>
                  <div className="mt-4">
                    <ScoreBar label="완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone={completionRate >= 100 ? "success" : "warning"}>{completed}개 완료</Badge>
                    <Badge tone="muted">생성일 {new Date(roadmap.created_at).toLocaleDateString("ko-KR")}</Badge>
                  </div>
                </Card>
              </a>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-night">{value}</p>
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

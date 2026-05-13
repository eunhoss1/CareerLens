"use client";

import { useEffect, useState } from "react";
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

        <div className="grid gap-4 md:grid-cols-2">
          {roadmaps.map((roadmap) => {
            const completed = roadmap.completed_task_count ?? roadmap.tasks.filter((task) => task.status === "DONE").length;
            const total = roadmap.total_task_count ?? roadmap.tasks.length;
            const completionRate = roadmap.completion_rate ?? (total === 0 ? 0 : Math.round((completed / total) * 100));
            return (
              <a key={roadmap.roadmap_id} href={`/planner/${roadmap.roadmap_id}`} className="block">
                <Card className="rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-brand">{roadmap.target_company}</p>
                      <h2 className="mt-2 text-lg font-semibold text-night">{roadmap.title}</h2>
                      <p className="mt-1 text-sm text-slate-500">{roadmap.target_job_title}</p>
                    </div>
                    <Badge tone={readinessTone(roadmap.readiness_status)}>{readinessLabel(roadmap.readiness_status)}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{roadmapSummary(roadmap)}</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <MetricCard label="점수" value={`${roadmap.total_score}`} />
                    <MetricCard label="기간" value={`${roadmap.duration_weeks}주`} />
                    <MetricCard label="과제" value={`${total}개`} />
                  </div>
                  <div className="mt-4">
                    <ScoreBar label="완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge tone={completionRate >= 100 ? "success" : "warning"}>{completed}개 완료</Badge>
                    <Badge tone="muted">{new Date(roadmap.created_at).toLocaleDateString("ko-KR")}</Badge>
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

function roadmapSummary(roadmap: PlannerRoadmap) {
  if (!roadmap.summary || roadmap.summary.includes("AI 보조 생성")) {
    return `${roadmap.target_company} ${roadmap.target_job_title} 지원을 위한 ${roadmap.duration_weeks}주 준비 로드맵입니다.`;
  }
  return roadmap.summary;
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar, TimelineCard } from "@/components/ui";
import { createApplicationFromRoadmap } from "@/lib/applications";
import { fetchPlannerRoadmap, updatePlannerTaskStatus, type PlannerRoadmap, type PlannerTask, type PlannerTaskStatus } from "@/lib/planner";

export default function PlannerRoadmapPage() {
  const params = useParams<{ roadmapId: string }>();
  const router = useRouter();
  const roadmapId = Number(params.roadmapId);
  const [roadmap, setRoadmap] = useState<PlannerRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [creatingApplication, setCreatingApplication] = useState(false);

  useEffect(() => {
    if (!roadmapId) return;
    setIsLoading(true);
    setErrorMessage(null);
    fetchPlannerRoadmap(roadmapId)
      .then(setRoadmap)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "로드맵을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [roadmapId]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<number, PlannerTask[]>();
    roadmap?.tasks.forEach((task) => {
      const week = task.week_number ?? 1;
      groups.set(week, [...(groups.get(week) ?? []), task]);
    });
    return Array.from(groups.entries()).sort(([left], [right]) => left - right);
  }, [roadmap]);

  const completedCount = roadmap?.completed_task_count ?? roadmap?.tasks.filter((task) => task.status === "DONE").length ?? 0;
  const totalTasks = roadmap?.total_task_count ?? roadmap?.tasks.length ?? 0;
  const inProgressCount = roadmap?.in_progress_task_count ?? roadmap?.tasks.filter((task) => task.status === "IN_PROGRESS").length ?? 0;
  const completionRate = roadmap?.completion_rate ?? (totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100));

  async function changeTaskStatus(taskId: number, status: PlannerTaskStatus) {
    setUpdatingTaskId(taskId);
    setErrorMessage(null);
    try {
      const updatedRoadmap = await updatePlannerTaskStatus(taskId, status);
      setRoadmap(updatedRoadmap);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "과제 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function moveToApplicationPipeline() {
    if (!roadmap) return;
    setCreatingApplication(true);
    setErrorMessage(null);
    try {
      await createApplicationFromRoadmap(roadmap.roadmap_id);
      router.push("/applications");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 관리 기록을 생성하지 못했습니다.");
    } finally {
      setCreatingApplication(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="ROADMAP DETAIL"
        title="커리어 플래너 상세"
        description="추천 진단 결과의 부족 요소를 주차별 실행 과제, 기대 산출물, 검증 기준으로 관리합니다."
        actions={
          <>
            <LinkButton href="/planner" variant="secondary">로드맵 목록</LinkButton>
            <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석</LinkButton>
            <Button type="button" variant="secondary" disabled={!roadmap || creatingApplication} onClick={moveToApplicationPipeline}>
              {creatingApplication ? "지원 기록 생성 중" : "지원 관리 시작"}
            </Button>
            <LinkButton href="/jobs/recommendation">추천 진단으로</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="로드맵을 불러오는 중입니다" description="추천 결과와 부족 요소 기반 과제를 확인하고 있습니다." />}
        {errorMessage && <EmptyState title="요청을 처리하지 못했습니다" description={errorMessage} />}

        {roadmap && (
          <div className="grid gap-5 lg:grid-cols-[370px_1fr]">
            <aside className="h-fit border border-line bg-white p-5 shadow-sm lg:sticky lg:top-5">
              <p className="text-xs font-bold tracking-[0.16em] text-brand">ROADMAP SUMMARY</p>
              <h2 className="mt-3 text-xl font-semibold text-night">{roadmap.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{roadmap.summary}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MetricCard label="기업" value={roadmap.target_company} />
                <MetricCard label="목표 직무" value={roadmap.target_job_title} />
                <MetricCard label="종합 점수" value={`${roadmap.total_score}점`} />
                <MetricCard label="기간" value={`${roadmap.duration_weeks}주`} />
                <MetricCard label="완료 과제" value={`${completedCount}/${totalTasks}`} />
                <MetricCard label="진행 중" value={`${inProgressCount}개`} />
                <MetricCard label="생성 방식" value={roadmap.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"} />
              </div>

              <div className="mt-5">
                <ScoreBar label="로드맵 완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
              </div>

              <div className="mt-5 border border-line bg-panel p-4 text-sm leading-6 text-slate-700">
                <p className="font-semibold text-night">다음 액션</p>
                <p className="mt-1">{roadmap.next_action}</p>
              </div>
            </aside>

            <div className="relative space-y-4 border-l border-line pl-5">
              {groupedTasks.map(([week, tasks]) => (
                <TimelineCard key={week} label={`WEEK ${week}`} title={`${week}주차 준비 과제`}>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <Badge tone="muted">{tasks.length}개 과제</Badge>
                    <Badge tone="brand">{tasks.filter((task) => task.status === "DONE").length}개 완료</Badge>
                  </div>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.task_id}
                        task={task}
                        isUpdating={updatingTaskId === task.task_id}
                        onStatusChange={(status) => changeTaskStatus(task.task_id, status)}
                      />
                    ))}
                  </div>
                </TimelineCard>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function TaskCard({
  task,
  isUpdating,
  onStatusChange
}: {
  task: PlannerTask;
  isUpdating: boolean;
  onStatusChange: (status: PlannerTaskStatus) => void;
}) {
  const done = task.status === "DONE";
  return (
    <article className="border border-line bg-panel p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="muted">{task.category}</Badge>
        <Badge tone={done ? "success" : "warning"}>{statusLabel(task.status)}</Badge>
        <Badge tone="muted">{task.estimated_hours ?? 0}시간</Badge>
        <Badge tone="brand">{difficultyLabel(task.difficulty)}</Badge>
      </div>
      <h4 className="mt-3 text-base font-semibold text-night">{task.title}</h4>
      <p className="mt-2 text-sm leading-6 text-slate-600">{task.description}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <InfoBox title="기대 산출물" value={task.expected_outputs} />
        <InfoBox title="검증 기준" value={task.verification_criteria} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant={task.status === "TODO" ? "primary" : "secondary"} disabled={isUpdating} onClick={() => onStatusChange("TODO")}>
          준비 전
        </Button>
        <Button type="button" variant={task.status === "IN_PROGRESS" ? "primary" : "secondary"} disabled={isUpdating} onClick={() => onStatusChange("IN_PROGRESS")}>
          진행 중
        </Button>
        <Button type="button" variant={task.status === "DONE" ? "primary" : "secondary"} disabled={isUpdating} onClick={() => onStatusChange("DONE")}>
          완료
        </Button>
        <LinkButton href="/roadmap/employment/documents" variant="subtle">
          산출물 AI 검증
        </LinkButton>
      </div>
    </article>
  );
}

function InfoBox({ title, value }: { title: string; value?: string }) {
  return (
    <div className="border border-line bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || "미기재"}</p>
    </div>
  );
}

function statusLabel(status: PlannerTaskStatus) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "준비 전";
}

function difficultyLabel(value?: string) {
  if (value === "EASY") return "쉬움";
  if (value === "HARD") return "어려움";
  return "보통";
}

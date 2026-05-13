"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar } from "@/components/ui";
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
  const remainingCount = Math.max(0, totalTasks - completedCount);
  const nextTask = useMemo(() => {
    return roadmap?.tasks
      .slice()
      .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      .find((task) => task.status !== "DONE") ?? null;
  }, [roadmap]);

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
        kicker="준비 로드맵"
        title="커리어 플래너 상세"
        actions={
          <>
            <LinkButton href="/planner" variant="secondary">목록</LinkButton>
            <LinkButton href="/roadmap/employment/documents" variant="secondary">문서 분석</LinkButton>
            <Button type="button" variant="secondary" disabled={!roadmap || creatingApplication} onClick={moveToApplicationPipeline}>
              {creatingApplication ? "생성 중" : "지원 준비로 넘기기"}
            </Button>
            <LinkButton href="/jobs/recommendation">추천 다시 보기</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        {isLoading && <EmptyState title="로드맵을 불러오는 중입니다" description="저장된 준비 과제를 확인하고 있습니다." />}
        {errorMessage && <EmptyState title="요청을 처리하지 못했습니다" description={errorMessage} />}

        {roadmap && (
          <div className="space-y-5">
            {/* 상세 화면 첫 진입 시 사용 흐름을 바로 이해할 수 있도록 핵심 사용 순서를 노출한다. */}
            <RoadmapGuide
              completionRate={completionRate}
              remainingCount={remainingCount}
              nextTaskTitle={nextTask?.title ?? "모든 과제가 완료되었습니다."}
            />

            <div className="grid gap-5 lg:grid-cols-[370px_1fr]">
              <aside className="h-fit rounded-md border border-line bg-white p-5 shadow-sm lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
                <p className="text-xs font-bold text-brand">로드맵 요약</p>
                <h2 className="mt-2 text-lg font-bold leading-7 text-night">{roadmap.title}</h2>

                <div className="mt-4 space-y-3">
                  <SummaryRow label="기업" value={roadmap.target_company} />
                  <SummaryRow label="목표 직무" value={roadmap.target_job_title} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MetricCard label="종합 점수" value={`${roadmap.total_score}점`} />
                  <MetricCard label="기간" value={`${roadmap.duration_weeks}주`} />
                  <MetricCard label="완료 과제" value={`${completedCount}/${totalTasks}`} />
                  <MetricCard label="진행 중" value={`${inProgressCount}개`} />
                </div>

                {/* 생성 방식은 보조 정보라 카드 대신 배지로 낮춰 화면 밀도를 줄인다. */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge tone={roadmap.generation_mode.includes("AI") ? "brand" : "muted"}>
                    {roadmap.generation_mode.includes("AI") ? "AI 보조" : "규칙 기반"}
                  </Badge>
                  <Badge tone="muted">{new Date(roadmap.created_at).toLocaleDateString("ko-KR")}</Badge>
                </div>

                <div className="mt-5">
                  <ScoreBar label="완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
                </div>
              </aside>

              <div className="relative space-y-4 border-l border-line pl-5">
                {groupedTasks.map(([week, tasks]) => {
                  const doneTasks = tasks.filter((task) => task.status === "DONE").length;
                  const weekRate = tasks.length === 0 ? 0 : Math.round((doneTasks / tasks.length) * 100);
                  const weekHours = tasks.reduce((sum, task) => sum + (task.estimated_hours ?? 0), 0);
                  return (
                    <PlannerWeekCard key={week} label={`${week}주차`} title={`${week}주차 과제`} done={weekRate >= 100}>
                      <WeekProgress total={tasks.length} done={doneTasks} hours={weekHours} rate={weekRate} />
                      <div className="mt-4 space-y-3">
                        {tasks.map((task) => (
                          <TaskCard
                            key={task.task_id}
                            task={task}
                            isNextTask={nextTask?.task_id === task.task_id}
                            isUpdating={updatingTaskId === task.task_id}
                            onStatusChange={(status) => changeTaskStatus(task.task_id, status)}
                          />
                        ))}
                      </div>
                    </PlannerWeekCard>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function TaskCard({
  task,
  isNextTask,
  isUpdating,
  onStatusChange
}: {
  task: PlannerTask;
  isNextTask: boolean;
  isUpdating: boolean;
  onStatusChange: (status: PlannerTaskStatus) => void;
}) {
  const done = task.status === "DONE";
  return (
    <article className={`rounded-md border p-4 ${done ? "border-line bg-white/70" : "border-line bg-panel"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {isNextTask && <Badge tone="brand">다음 추천</Badge>}
        <Badge tone="muted">{task.category}</Badge>
        <Badge tone={done ? "success" : "warning"}>{statusLabel(task.status)}</Badge>
        <Badge tone="muted">{task.estimated_hours ?? 0}시간</Badge>
        <Badge tone="brand">{difficultyLabel(task.difficulty)}</Badge>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <h4 className="text-lg font-semibold leading-7 text-night">{task.title}</h4>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{task.description}</p>
        </div>
        <div className="space-y-3 border-l border-line pl-4">
          <MiniInfo label="산출물" value={task.expected_outputs} />
          <MiniInfo label="검증 기준" value={task.verification_criteria} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant={task.status === "TODO" ? "primary" : "secondary"} className="min-h-9 px-3" disabled={isUpdating} onClick={() => onStatusChange("TODO")}>
          대기
        </Button>
        <Button type="button" variant={task.status === "IN_PROGRESS" ? "primary" : "secondary"} className="min-h-9 px-3" disabled={isUpdating} onClick={() => onStatusChange("IN_PROGRESS")}>
          진행 중
        </Button>
        <Button type="button" variant={task.status === "DONE" ? "primary" : "secondary"} className="min-h-9 px-3" disabled={isUpdating} onClick={() => onStatusChange("DONE")}>
          완료
        </Button>
        <LinkButton href="/roadmap/employment/documents" variant="subtle">
          문서 검증
        </LinkButton>
      </div>
    </article>
  );
}

function RoadmapGuide({
  completionRate,
  remainingCount,
  nextTaskTitle
}: {
  completionRate: number;
  remainingCount: number;
  nextTaskTitle: string;
}) {
  return (
    <Card className="rounded-md p-5">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div>
          <p className="text-xs font-bold text-brand">오늘의 진행</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="brand">완료율 {completionRate}%</Badge>
            <Badge tone={remainingCount === 0 ? "success" : "warning"}>남은 과제 {remainingCount}개</Badge>
          </div>
        </div>
        <div className="rounded-md border-l-4 border-brand bg-panel px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">다음 추천 과제</p>
          <p className="mt-1 text-base font-bold leading-7 text-night">{nextTaskTitle}</p>
        </div>
      </div>
    </Card>
  );
}

function WeekProgress({ total, done, hours, rate }: { total: number; done: number; hours: number; rate: number }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge tone="muted">{total}개 과제</Badge>
        <Badge tone={rate >= 100 ? "success" : "brand"}>{done}개 완료</Badge>
        <Badge tone="muted">예상 {hours}시간</Badge>
      </div>
      <ScoreBar label="진행률" value={rate} tone={rate >= 100 ? "success" : "brand"} />
    </div>
  );
}

function PlannerWeekCard({ label, title, done, children }: { label: string; title: string; done: boolean; children: ReactNode }) {
  return (
    <section className="relative rounded-md border border-line bg-white p-5 shadow-sm transition hover:border-night hover:shadow-panel">
      {/* 주차의 모든 과제가 완료되면 타임라인 마커를 초록색 체크로 바꿔 진행 상태가 바로 보이게 한다. */}
      <div className={`absolute left-[-10px] top-6 flex h-5 w-5 items-center justify-center rounded-sm border text-[12px] font-bold ${done ? "border-mint bg-mint text-white" : "border-night bg-paper text-transparent"}`}>
        ✓
      </div>
      <p className="text-xs font-bold text-brand">{label}</p>
      <h3 className="mt-1 text-lg font-bold text-night">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-sm font-extrabold text-brand">{label}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-night">{value || "미기재"}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line pb-2 last:border-b-0 last:pb-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-night">{value}</p>
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

"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AuthCheckingScreen, AuthRequiredScreen, useRequiredAuth } from "@/components/auth/RequireAuth";
import { EmploymentFlowGuide, EmploymentFlowStrip } from "@/components/roadmap/employment-flow-guide";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar } from "@/components/ui";
import { createApplicationFromRoadmap } from "@/lib/applications";
import { fetchPlannerRoadmap, updatePlannerTaskStatus, type PlannerRoadmap, type PlannerTask, type PlannerTaskStatus } from "@/lib/planner";

type WeekFilter = number | "ALL";

export default function PlannerRoadmapPage() {
  const params = useParams<{ roadmapId: string }>();
  const router = useRouter();
  const auth = useRequiredAuth();
  const roadmapId = Number(params.roadmapId);
  const [roadmap, setRoadmap] = useState<PlannerRoadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [creatingApplication, setCreatingApplication] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekFilter>("ALL");

  useEffect(() => {
    if (auth.isChecking || !auth.user || !roadmapId) return;
    setIsLoading(true);
    setErrorMessage(null);
    fetchPlannerRoadmap(roadmapId)
      .then(setRoadmap)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "로드맵을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user, roadmapId]);

  const groupedTasks = useMemo(() => {
    const groups = new Map<number, PlannerTask[]>();
    roadmap?.tasks.forEach((task) => {
      const week = task.week_number ?? 1;
      groups.set(week, [...(groups.get(week) ?? []), task]);
    });
    return Array.from(groups.entries())
      .map(([week, tasks]) => ({
        week,
        tasks: tasks.slice().sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
      }))
      .sort((left, right) => left.week - right.week);
  }, [roadmap]);

  const visibleGroups = useMemo(() => {
    if (selectedWeek === "ALL") return groupedTasks;
    return groupedTasks.filter((group) => group.week === selectedWeek);
  }, [groupedTasks, selectedWeek]);

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
      setErrorMessage(error instanceof Error ? error.message : "지원관리 기록을 생성하지 못했습니다.");
    } finally {
      setCreatingApplication(false);
    }
  }

  if (auth.isChecking) {
    return <AuthCheckingScreen title="커리어 플래너 접근 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="커리어 플래너 상세는 로그인 후 이용할 수 있습니다." />;
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
            <LinkButton href={nextTask ? `/roadmap/employment/documents?taskId=${nextTask.task_id}` : "/roadmap/employment/documents"} variant="secondary">문서 검증</LinkButton>
            <Button type="button" variant="secondary" disabled={!roadmap || creatingApplication} onClick={moveToApplicationPipeline}>
              {creatingApplication ? "연결 중" : "지원관리로 넘기기"}
            </Button>
          </>
        }
      />

      <main className="lens-container py-6">
        {isLoading && <EmptyState title="로드맵을 불러오는 중입니다." description="저장된 준비 과제와 진행 상태를 확인하고 있습니다." />}
        {errorMessage && (
          <div role="alert" className="mb-5 rounded-2xl border border-coral/30 bg-red-50 px-4 py-3 text-sm font-semibold text-coral">
            {errorMessage}
          </div>
        )}

        {roadmap && (
          <div className="space-y-5">
            <RoadmapTopPanel
              roadmap={roadmap}
              completionRate={completionRate}
              completedCount={completedCount}
              totalTasks={totalTasks}
              remainingCount={remainingCount}
              inProgressCount={inProgressCount}
              nextTask={nextTask}
            />

            <EmploymentFlowStrip currentStep="planner" roadmapId={roadmap.roadmap_id} />

            <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)_280px]">
              <RoadmapSummaryCard
                roadmap={roadmap}
                completionRate={completionRate}
                completedCount={completedCount}
                totalTasks={totalTasks}
                inProgressCount={inProgressCount}
              />

              <section className="space-y-4">
                <WeekSelector
                  groupedTasks={groupedTasks}
                  selectedWeek={selectedWeek}
                  onSelect={setSelectedWeek}
                />

                <div className="space-y-5">
                  {visibleGroups.map((group) => {
                    const doneCount = group.tasks.filter((task) => task.status === "DONE").length;
                    const weekRate = group.tasks.length === 0 ? 0 : Math.round((doneCount / group.tasks.length) * 100);
                    const weekHours = group.tasks.reduce((sum, task) => sum + (task.estimated_hours ?? 0), 0);

                    return (
                      <WeekTaskSection
                        key={group.week}
                        week={group.week}
                        doneCount={doneCount}
                        totalCount={group.tasks.length}
                        weekHours={weekHours}
                        weekRate={weekRate}
                      >
                        <div className="grid gap-4 2xl:grid-cols-2">
                          {group.tasks.map((task) => (
                            <TaskCard
                              key={task.task_id}
                              task={task}
                              isNextTask={nextTask?.task_id === task.task_id}
                              isUpdating={updatingTaskId === task.task_id}
                              onStatusChange={(status) => changeTaskStatus(task.task_id, status)}
                            />
                          ))}
                        </div>
                      </WeekTaskSection>
                    );
                  })}
                </div>
              </section>

              <aside className="h-fit xl:sticky xl:top-24">
                <EmploymentFlowGuide currentStep="planner" roadmapId={roadmap.roadmap_id} />
              </aside>
            </div>
          </div>
        )}
      </main>
    </PageShell>
  );
}

function RoadmapTopPanel({
  roadmap,
  completionRate,
  completedCount,
  totalTasks,
  remainingCount,
  inProgressCount,
  nextTask
}: {
  roadmap: PlannerRoadmap;
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  remainingCount: number;
  inProgressCount: number;
  nextTask: PlannerTask | null;
}) {
  return (
    <Card className="rounded-3xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Progress Overview</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-night">이어갈 준비 과제</h2>
          <div className="mt-4 rounded-2xl border-l-4 border-brand bg-[#f8fbfa] p-4">
            <p className="text-xs font-bold text-slate-500">다음 추천</p>
            <p className="mt-1 text-lg font-black leading-7 text-night">{nextTask?.title ?? "모든 과제를 완료했습니다."}</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{roadmap.target_company} · {roadmap.target_job_title}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="전체 완료율" value={`${completionRate}%`} helper={`${completedCount}/${totalTasks}개 완료`} />
          <MetricCard label="진행 중" value={`${inProgressCount}개`} helper="현재 작업 중인 과제" />
          <MetricCard label="남은 과제" value={`${remainingCount}개`} helper="다음 준비 대상" />
          <MetricCard label="기간" value={`${roadmap.duration_weeks}주`} helper="준비 로드맵" />
        </div>
      </div>
    </Card>
  );
}

function RoadmapSummaryCard({
  roadmap,
  completionRate,
  completedCount,
  totalTasks,
  inProgressCount
}: {
  roadmap: PlannerRoadmap;
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  inProgressCount: number;
}) {
  return (
    <aside className="h-fit space-y-4 xl:sticky xl:top-24">
      <Card className="rounded-3xl border-slate-200 p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Roadmap Summary</p>
        <h2 className="mt-3 text-xl font-black leading-8 text-night">{roadmap.title}</h2>
        <div className="mt-5 space-y-3">
          <SummaryRow label="기업" value={roadmap.target_company} />
          <SummaryRow label="목표 직무" value={roadmap.target_job_title} />
          <SummaryRow label="준비 판단" value={readinessLabel(roadmap.readiness_status)} />
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard label="종합 점수" value={`${roadmap.total_score}점`} />
          <MetricCard label="완료 과제" value={`${completedCount}/${totalTasks}`} />
          <MetricCard label="진행 중" value={`${inProgressCount}개`} />
          <MetricCard label="생성일" value={formatDate(roadmap.created_at)} />
        </div>
        <div className="mt-5">
          <ScoreBar label="완료율" value={completionRate} tone={completionRate >= 80 ? "success" : "brand"} />
        </div>
      </Card>
    </aside>
  );
}

function WeekSelector({
  groupedTasks,
  selectedWeek,
  onSelect
}: {
  groupedTasks: Array<{ week: number; tasks: PlannerTask[] }>;
  selectedWeek: WeekFilter;
  onSelect: (week: WeekFilter) => void;
}) {
  const total = groupedTasks.reduce((sum, group) => sum + group.tasks.length, 0);
  const done = groupedTasks.reduce((sum, group) => sum + group.tasks.filter((task) => task.status === "DONE").length, 0);

  return (
    <Card className="rounded-3xl border-slate-200 p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Week Board</p>
          <h3 className="mt-1 text-xl font-black text-night">주차별 과제 보기</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <WeekButton active={selectedWeek === "ALL"} label="전체" meta={`${done}/${total}`} onClick={() => onSelect("ALL")} />
          {groupedTasks.map((group) => {
            const doneCount = group.tasks.filter((task) => task.status === "DONE").length;
            return (
              <WeekButton
                key={group.week}
                active={selectedWeek === group.week}
                label={`${group.week}주차`}
                meta={`${doneCount}/${group.tasks.length}`}
                onClick={() => onSelect(group.week)}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function WeekTaskSection({
  week,
  doneCount,
  totalCount,
  weekHours,
  weekRate,
  children
}: {
  week: number;
  doneCount: number;
  totalCount: number;
  weekHours: number;
  weekRate: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">Week {week}</p>
          <h3 className="mt-1 text-2xl font-black text-night">{week}주차 과제</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
          <MiniMetric label="과제" value={`${totalCount}개`} />
          <MiniMetric label="완료" value={`${doneCount}개`} />
          <MiniMetric label="예상" value={`${weekHours}시간`} />
        </div>
      </div>
      <div className="mt-4">
        <ScoreBar label="주차 진행률" value={weekRate} tone={weekRate >= 80 ? "success" : "brand"} />
      </div>
      <div className="mt-5">{children}</div>
    </section>
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
  const isDone = task.status === "DONE";

  return (
    <article className={`flex min-h-[340px] flex-col rounded-2xl border p-4 transition ${isDone ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-[#fbfcfd] hover:border-slate-300"}`}>
      <div className="flex flex-wrap gap-2">
        {isNextTask && <Badge tone="brand">다음 추천</Badge>}
        <Badge tone="muted">{categoryLabel(task.category)}</Badge>
        <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
        <Badge tone="muted">{task.estimated_hours ?? 0}시간</Badge>
      </div>

      <div className="mt-4 flex-1">
        <h4 className="text-lg font-black leading-7 text-night">{task.title}</h4>
        <p className="mt-3 line-clamp-4 text-sm font-semibold leading-6 text-slate-700">{task.description}</p>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
        <summary className="cursor-pointer font-black text-brand">산출물과 검증 기준</summary>
        <div className="mt-3 grid gap-3">
          <DetailBlock title="산출물" value={task.expected_outputs} />
          <DetailBlock title="검증 기준" value={task.verification_criteria} />
        </div>
      </details>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatusButton active={task.status === "TODO"} disabled={isUpdating} onClick={() => onStatusChange("TODO")}>
          대기
        </StatusButton>
        <StatusButton active={task.status === "IN_PROGRESS"} disabled={isUpdating} onClick={() => onStatusChange("IN_PROGRESS")}>
          진행 중
        </StatusButton>
        <StatusButton active={task.status === "DONE"} disabled={isUpdating} onClick={() => onStatusChange("DONE")}>
          완료
        </StatusButton>
        <LinkButton href={`/roadmap/employment/documents?taskId=${task.task_id}`} variant="secondary" className="min-h-9 rounded-xl px-3 text-xs">
          문서 검증
        </LinkButton>
      </div>
    </article>
  );
}

function WeekButton({ active, label, meta, onClick }: { active: boolean; label: string; meta: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`min-w-[92px] rounded-2xl border px-4 py-3 text-left transition ${
        active ? "border-night bg-night text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
      }`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="block text-sm font-black">{label}</span>
      <span className={`mt-1 block text-xs font-semibold ${active ? "text-white/70" : "text-slate-500"}`}>{meta} 완료</span>
    </button>
  );
}

function StatusButton({ active, disabled, children, onClick }: { active: boolean; disabled: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant={active ? "primary" : "secondary"}
      className="min-h-9 rounded-xl px-3 text-xs"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function DetailBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-black text-slate-500">{title}</p>
      <p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-night">{value || "미기재"}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-panel px-3 py-2">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-base font-black text-night">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black leading-6 text-night">{value}</p>
    </div>
  );
}

function statusLabel(status: PlannerTaskStatus) {
  if (status === "DONE") return "완료";
  if (status === "IN_PROGRESS") return "진행 중";
  return "대기";
}

function statusTone(status: PlannerTaskStatus) {
  if (status === "DONE") return "success";
  if (status === "IN_PROGRESS") return "brand";
  return "warning";
}

function categoryLabel(category?: string) {
  if (!category) return "과제";
  const map: Record<string, string> = {
    TECH: "기술",
    PORTFOLIO: "포트폴리오",
    DOCUMENT: "문서",
    LANGUAGE: "언어",
    APPLICATION: "지원",
    PROJECT: "프로젝트"
  };
  return map[category] ?? category;
}

function readinessLabel(value?: string) {
  if (value === "APPLY_NOW") return "바로 지원 가능";
  if (value === "PREPARE_THEN_APPLY") return "준비 후 지원";
  if (value === "LONG_TERM_PREPARE") return "장기 준비";
  return value ?? "미정";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ko-KR");
}

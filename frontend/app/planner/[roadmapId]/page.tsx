"use client";

import { useParams, useRouter } from "next/navigation";
import type { ReactNode } from "react";
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
  PageHeader,
  PageShell,
  ScoreBar,
} from "@/components/ui";
import { createApplicationFromRoadmap } from "@/lib/applications";
import {
  fetchPlannerRoadmap,
  updatePlannerTaskStatus,
  type PlannerRoadmap,
  type PlannerTask,
  type PlannerTaskStatus,
} from "@/lib/planner";

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
      .catch((error) =>
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "로드맵을 불러오지 못했습니다."
        )
      )
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
        tasks: tasks
          .slice()
          .sort(
            (left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0)
          ),
      }))
      .sort((left, right) => left.week - right.week);
  }, [roadmap]);

  const visibleGroups = useMemo(() => {
    if (selectedWeek === "ALL") return groupedTasks;
    return groupedTasks.filter((group) => group.week === selectedWeek);
  }, [groupedTasks, selectedWeek]);

  const completedCount =
    roadmap?.completed_task_count ??
    roadmap?.tasks.filter((task) => task.status === "DONE").length ??
    0;
  const totalTasks = roadmap?.total_task_count ?? roadmap?.tasks.length ?? 0;
  const inProgressCount =
    roadmap?.in_progress_task_count ??
    roadmap?.tasks.filter((task) => task.status === "IN_PROGRESS").length ??
    0;
  const completionRate =
    roadmap?.completion_rate ??
    (totalTasks === 0 ? 0 : Math.round((completedCount / totalTasks) * 100));
  const remainingCount = Math.max(0, totalTasks - completedCount);
  const nextTask = useMemo(() => {
    return (
      roadmap?.tasks
        .slice()
        .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
        .find((task) => task.status !== "DONE") ?? null
    );
  }, [roadmap]);

  async function changeTaskStatus(taskId: number, status: PlannerTaskStatus) {
    setUpdatingTaskId(taskId);
    setErrorMessage(null);
    try {
      const updatedRoadmap = await updatePlannerTaskStatus(taskId, status);
      setRoadmap(updatedRoadmap);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "과제 상태를 변경하지 못했습니다."
      );
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "지원관리 기록을 생성하지 못했습니다."
      );
    } finally {
      setCreatingApplication(false);
    }
  }

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="커리어 플래너 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="커리어 플래너 상세는 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4">
          <PageHeader
            kicker="준비 로드맵"
            title="커리어 플래너 상세"
            actions={
              <div className="flex flex-wrap gap-2">
                <LinkButton
                  href="/planner"
                  variant="secondary"
                  className="rounded-xl text-xs px-3 py-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  목록
                </LinkButton>
                <LinkButton
                  href="/roadmap/employment/documents"
                  variant="secondary"
                  className="rounded-xl text-xs px-3 py-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  문서 분석
                </LinkButton>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!roadmap || creatingApplication}
                  onClick={moveToApplicationPipeline}
                  className="rounded-xl text-xs px-3 py-1.5 bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 disabled:bg-slate-200 disabled:border-slate-200 transition-all"
                >
                  {creatingApplication ? "연결 중" : "지원관리로 넘기기"}
                </Button>
                <LinkButton
                  href={`/roadmap/departure?roadmapId=${roadmapId}`}
                  variant="secondary"
                  className="rounded-xl text-xs px-3 py-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  출국로드맵
                </LinkButton>
                <LinkButton
                  href={`/roadmap/administration?roadmapId=${roadmapId}`}
                  variant="secondary"
                  className="rounded-xl text-xs px-3 py-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  행정로드맵
                </LinkButton>
              </div>
            }
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-4 py-8 bg-slate-50/50 min-h-screen">
        {isLoading && (
          <EmptyState
            title="로드맵을 불러오는 중입니다."
            description="저장된 준비 과제와 진행 상태를 확인하고 있습니다."
          />
        )}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-semibold text-red-600"
          >
            {errorMessage}
          </div>
        )}

        {roadmap && (
          <div className="space-y-6">
            <RoadmapTopPanel
              roadmap={roadmap}
              completionRate={completionRate}
              completedCount={completedCount}
              totalTasks={totalTasks}
              remainingCount={remainingCount}
              inProgressCount={inProgressCount}
              nextTask={nextTask}
            />

            <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
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
                    const doneCount = group.tasks.filter(
                      (task) => task.status === "DONE"
                    ).length;
                    const weekRate =
                      group.tasks.length === 0
                        ? 0
                        : Math.round((doneCount / group.tasks.length) * 100);
                    const weekHours = group.tasks.reduce(
                      (sum, task) => sum + (task.estimated_hours ?? 0),
                      0
                    );

                    return (
                      <WeekTaskSection
                        key={group.week}
                        week={group.week}
                        doneCount={doneCount}
                        totalCount={group.tasks.length}
                        weekHours={weekHours}
                        weekRate={weekRate}
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          {group.tasks.map((task) => (
                            <TaskCard
                              key={task.task_id}
                              task={task}
                              isNextTask={nextTask?.task_id === task.task_id}
                              isUpdating={updatingTaskId === task.task_id}
                              onStatusChange={(status) =>
                                changeTaskStatus(task.task_id, status)
                              }
                            />
                          ))}
                        </div>
                      </WeekTaskSection>
                    );
                  })}
                </div>
              </section>
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
  nextTask,
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
    <Card className="rounded-2xl border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Progress Overview
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              이어갈 준비 과제
            </h2>
          </div>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">
              다음 추천 과제
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900 leading-relaxed">
              {nextTask?.title ?? "모든 과제를 완료했습니다."}
            </p>
            <p className="mt-1.5 text-xs font-medium text-slate-400">
              {roadmap.target_company} · {roadmap.target_job_title}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="전체 완료율"
            value={`${completionRate}%`}
            helper={`${completedCount}/${totalTasks}개 완료`}
          />
          <MetricCard
            label="진행 중"
            value={`${inProgressCount}개`}
            helper="현재 작업 중인 과제"
          />
          <MetricCard
            label="남은 과제"
            value={`${remainingCount}개`}
            helper="다음 준비 대상"
          />
          <MetricCard
            label="기간"
            value={`${roadmap.duration_weeks}주`}
            helper="준비 로드맵"
          />
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
  inProgressCount,
}: {
  roadmap: PlannerRoadmap;
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  inProgressCount: number;
}) {
  return (
    <aside className="h-fit space-y-4 xl:sticky xl:top-6">
      <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Roadmap Summary
        </p>
        <h2 className="mt-2 text-base font-bold text-slate-900 tracking-tight leading-snug">
          {roadmap.title}
        </h2>

        <div className="mt-4 space-y-2.5 border-t border-b border-slate-100 py-3">
          <SummaryRow label="기업" value={roadmap.target_company} />
          <SummaryRow label="목표 직무" value={roadmap.target_job_title} />
          <SummaryRow
            label="준비 판단"
            value={readinessLabel(roadmap.readiness_status)}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <p className="text-[10px] font-bold text-slate-400">종합 점수</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {roadmap.total_score}점
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <p className="text-[10px] font-bold text-slate-400">완료 과제</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {completedCount}/{totalTasks}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <p className="text-[10px] font-bold text-slate-400">진행 중</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {inProgressCount}개
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
            <p className="text-[10px] font-bold text-slate-400">생성일</p>
            <p className="mt-0.5 text-xs font-bold text-slate-900">
              {formatDate(roadmap.created_at)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ScoreBar
            label="완료율"
            value={completionRate}
            tone={completionRate >= 80 ? "success" : "brand"}
          />
        </div>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Next Flow
        </p>
        <div className="grid gap-1.5">
          <LinkButton
            href="/roadmap/employment/documents"
            variant="secondary"
            className="justify-start rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100/70 py-2"
          >
            문서 분석으로 제출물 점검
          </LinkButton>
          <LinkButton
            href="/applications"
            variant="secondary"
            className="justify-start rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100/70 py-2"
          >
            지원관리 상태 확인
          </LinkButton>
          <LinkButton
            href={`/roadmap/departure?roadmapId=${roadmap.roadmap_id}`}
            variant="secondary"
            className="justify-start rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 border-slate-100 hover:bg-slate-100/70 py-2"
          >
            출국로드맵 확인
          </LinkButton>
        </div>
      </Card>
    </aside>
  );
}

function WeekSelector({
  groupedTasks,
  selectedWeek,
  onSelect,
}: {
  groupedTasks: Array<{ week: number; tasks: PlannerTask[] }>;
  selectedWeek: WeekFilter;
  onSelect: (week: WeekFilter) => void;
}) {
  const total = groupedTasks.reduce(
    (sum, group) => sum + group.tasks.length,
    0
  );
  const done = groupedTasks.reduce(
    (sum, group) =>
      sum + group.tasks.filter((task) => task.status === "DONE").length,
    0
  );

  return (
    <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Week Board
          </p>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            주차별 과제 관리
          </h3>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
          <WeekButton
            active={selectedWeek === "ALL"}
            label="전체"
            meta={`${done}/${total}`}
            onClick={() => onSelect("ALL")}
          />
          {groupedTasks.map((group) => {
            const doneCount = group.tasks.filter(
              (task) => task.status === "DONE"
            ).length;
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
  children,
}: {
  week: number;
  doneCount: number;
  totalCount: number;
  weekHours: number;
  weekRate: number;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            Week {week}
          </p>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            {week}주차 필수 과제
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[280px]">
          <MiniMetric label="총 과제" value={`${totalCount}개`} />
          <MiniMetric label="완료됨" value={`${doneCount}개`} />
          <MiniMetric label="예상 소요" value={`${weekHours}시간`} />
        </div>
      </div>
      <div className="mt-3">
        <ScoreBar
          label="주차 진행률"
          value={weekRate}
          tone={weekRate >= 80 ? "success" : "brand"}
        />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function TaskCard({
  task,
  isNextTask,
  isUpdating,
  onStatusChange,
}: {
  task: PlannerTask;
  isNextTask: boolean;
  isUpdating: boolean;
  onStatusChange: (status: PlannerTaskStatus) => void;
}) {
  const isDone = task.status === "DONE";

  return (
    <article
      className={`flex min-h-[300px] flex-col rounded-xl border p-4 transition-all ${
        isDone
          ? "border-slate-200 bg-slate-50/40 opacity-80"
          : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
      }`}
    >
      <div className="flex flex-wrap gap-1.5">
        {isNextTask && (
          <Badge
            tone="brand"
            className="text-[10px] font-bold rounded-md px-1.5 py-0.5 bg-indigo-600 text-white"
          >
            다음 추천
          </Badge>
        )}
        <Badge
          tone="muted"
          className="text-[10px] font-medium rounded-md px-1.5 py-0.5"
        >
          {categoryLabel(task.category)}
        </Badge>
        <Badge
          tone={statusTone(task.status)}
          className="text-[10px] font-medium rounded-md px-1.5 py-0.5"
        >
          {statusLabel(task.status)}
        </Badge>
        <Badge
          tone="muted"
          className="text-[10px] font-medium rounded-md px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-100"
        >
          {task.estimated_hours ?? 0}시간
        </Badge>
      </div>

      <div className="mt-3.5 flex-1">
        <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
          {task.title}
        </h4>
        <p className="mt-2 line-clamp-3 text-xs text-slate-500 leading-relaxed font-medium">
          {task.description}
        </p>
      </div>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs group">
        <summary className="cursor-pointer font-bold text-indigo-600 outline-none select-none flex items-center justify-between">
          <span>산출물 및 검증 기준</span>
          <span className="text-slate-300 text-[10px] group-open:rotate-180 transition-all">
            ▼
          </span>
        </summary>
        <div className="mt-2.5 space-y-2 pt-2 border-t border-slate-100">
          <DetailBlock title="기대 산출물" value={task.expected_outputs} />
          <DetailBlock
            title="통과 검증 기준"
            value={task.verification_criteria}
          />
        </div>
      </details>

      <div className="mt-4 grid grid-cols-4 gap-1 border-t border-slate-100/80 pt-3">
        <StatusButton
          active={task.status === "TODO"}
          disabled={isUpdating}
          onClick={() => onStatusChange("TODO")}
        >
          대기
        </StatusButton>
        <StatusButton
          active={task.status === "IN_PROGRESS"}
          disabled={isUpdating}
          onClick={() => onStatusChange("IN_PROGRESS")}
        >
          진행
        </StatusButton>
        <StatusButton
          active={task.status === "DONE"}
          disabled={isUpdating}
          onClick={() => onStatusChange("DONE")}
        >
          완료
        </StatusButton>
        <LinkButton
          href="/roadmap/employment/documents"
          variant="secondary"
          className="min-h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-semibold hover:bg-slate-100 flex items-center justify-center p-0"
        >
          검증
        </LinkButton>
      </div>
    </article>
  );
}

function WeekButton({
  active,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`min-w-[80px] rounded-xl border px-3 py-2 text-left transition-all shrink-0 ${
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className="block text-xs font-bold">{label}</span>
      <span
        className={`mt-0.5 block text-[10px] font-medium ${
          active ? "text-slate-300" : "text-slate-400"
        }`}
      >
        {meta}
      </span>
    </button>
  );
}

function StatusButton({
  active,
  disabled,
  children,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "primary" : "secondary"}
      className={`min-h-8 rounded-lg text-[11px] font-bold p-0 transition-all ${
        active
          ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
          : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function DetailBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-lg bg-slate-50/70 p-2.5 border border-slate-100/50">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{title}</p>
      <p className="mt-0.5 whitespace-pre-line text-xs font-medium leading-relaxed text-slate-700">
        {value || "미기재"}
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 py-1.5 px-2">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="font-bold text-slate-400 shrink-0">{label}</span>
      <span className="font-bold text-slate-800 truncate max-w-[180px]">
        {value}
      </span>
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
    PROJECT: "프로젝트",
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

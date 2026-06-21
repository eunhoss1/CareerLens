"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageShell,
} from "@/components/ui";
import {
  fetchUserApplications,
  type ApplicationRecord,
  type ApplicationStatus,
} from "@/lib/applications";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";

type StageFilter = "ALL" | "INTERESTED" | "PREPARING_DOCUMENTS" | "ACTIVE";
type IconName =
  | "users"
  | "chart"
  | "bell"
  | "check"
  | "external"
  | "document"
  | "arrow";

const PAGE_SIZE = 4;

const stageFilters: Array<{ key: StageFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "INTERESTED", label: "관심 공고" },
  { key: "PREPARING_DOCUMENTS", label: "지원 준비" },
  { key: "ACTIVE", label: "진행 중" },
];

export default function ApplicationsPage() {
  const auth = useRequiredAuth();
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    fetchUserApplications(auth.user.user_id)
      .then((items) => {
        setRecords(items);
        setSelectedId(items[0]?.application_id ?? null);
      })
      .catch((error) =>
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "지원 기록을 불러오지 못했습니다."
        )
      )
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const orderedRecords = useMemo(() => sortByPriority(records), [records]);

  const counts = useMemo(() => {
    return {
      ALL: records.length,
      INTERESTED: records.filter((record) => record.status === "INTERESTED")
        .length,
      PREPARING_DOCUMENTS: records.filter(
        (record) => record.status === "PREPARING_DOCUMENTS"
      ).length,
      ACTIVE: records.filter((record) => isActiveStatus(record.status)).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (stageFilter === "ALL") return orderedRecords;
    if (stageFilter === "ACTIVE")
      return orderedRecords.filter((record) => isActiveStatus(record.status));
    return orderedRecords.filter((record) => record.status === stageFilter);
  }, [orderedRecords, stageFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRecords = filteredRecords.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );
  const selectedRecord =
    records.find((record) => record.application_id === selectedId) ??
    filteredRecords[0] ??
    records[0] ??
    null;

  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter]);

  useEffect(() => {
    if (filteredRecords.length === 0) return;
    const visibleSelected = filteredRecords.some(
      (record) => record.application_id === selectedId
    );
    if (!visibleSelected) {
      setSelectedId(filteredRecords[0].application_id);
    }
  }, [filteredRecords, selectedId]);

  const urgentCount = records.filter(
    (record) =>
      record.deadline_status === "URGENT" || record.deadline_status === "SOON"
  ).length;
  const activeCount = counts.ACTIVE;
  const averageReadiness =
    records.length === 0
      ? 0
      : Math.round(
          records.reduce((sum, record) => sum + record.readiness_score, 0) /
            records.length
        );
  const documentReadyCount = records.filter((record) =>
    record.document_checklist.some(
      (item) => item.status === "DONE" || item.status === "VERIFIED"
    )
  ).length;

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="기업지원 관리 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="기업지원 관리는 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />

      <main className="bg-slate-50 pb-12">
        <section className="max-w-[1200px] mx-auto px-6 pt-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded border border-slate-300 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                Application Workspace
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                기업 지원 관리
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                분석 결과를 기반으로 맞춤 커리어 로드맵과 공고 진행 현황을
                한눈에 확인하세요.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton
                href="/jobs"
                variant="secondary"
                className="gap-2 rounded-lg border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <LensIcon name="external" className="h-4 w-4 text-slate-500" />
                전체 공고 보기
              </LinkButton>
              <LinkButton
                href="/jobs/recommendation"
                className="rounded-lg bg-indigo-600 px-4 text-sm text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                적합도 진단으로 이동
              </LinkButton>
            </div>
          </div>

          {/* 메트릭 영역: 테두리 각을 잡고 미니멀하게 변경 */}
          <div className="mt-6 grid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 md:grid-cols-4">
            <PlannerMetric
              icon="users"
              tint="indigo"
              label="지원 후보"
              value={records.length}
            />
            <PlannerMetric
              icon="chart"
              tint="indigo"
              label="로드맵별 평균 준비도"
              value={`${averageReadiness}점`}
            />
            <PlannerMetric
              icon="bell"
              tint="orange"
              label="마감 주의"
              value={`${urgentCount}개`}
            />
            <PlannerMetric
              icon="check"
              tint="green"
              label="진행 중인 로드맵"
              value={`${activeCount}개`}
            />
          </div>
        </section>

        <section className="max-w-[1200px] mx-auto px-6 py-6">
          {isLoading && (
            <div className="mt-2">
              <EmptyState
                title="지원 기록을 불러오는 중입니다."
                description="로그인한 사용자 기준으로 지원 워크스페이스를 확인하고 있습니다."
              />
            </div>
          )}

          {errorMessage && (
            <div className="mt-2">
              <EmptyState
                title="지원관리 데이터를 처리하지 못했습니다."
                description={errorMessage}
              />
            </div>
          )}

          {!isLoading && records.length === 0 && (
            <div className="mt-2">
              <Card className="rounded-xl border-slate-200 p-8 text-center shadow-sm">
                <p className="text-lg font-bold text-slate-900">
                  아직 지원 후보가 없습니다.
                </p>
                <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  적합도 진단에서 커리어 플래너를 만들거나 전체 공고에서 목표
                  공고를 선택하면 지원관리로 넘길 수 있습니다.
                </p>
                <div className="mt-6 flex justify-center">
                  <LinkButton
                    href="/jobs/recommendation"
                    className="rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    적합도 진단 시작
                  </LinkButton>
                </div>
              </Card>
            </div>
          )}

          {records.length > 0 && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              {/* 왼쪽 리스트 섹션 */}
              <Card className="rounded-xl border-slate-200 p-5 shadow-sm bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      Roadmap List
                    </p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                      지원 후보 로드맵
                    </h2>
                  </div>
                  {/* 필터 탭 묶음: 사각형 베이스로 각진 스타일 연출 */}
                  <div className="grid w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-50 p-1 sm:grid-cols-4 lg:w-auto gap-0.5">
                    {stageFilters.map((filter) => {
                      const isActive = stageFilter === filter.key;
                      return (
                        <button
                          key={filter.key}
                          type="button"
                          className={`min-h-8 rounded-md px-3 text-xs font-semibold tracking-tight transition-all ${
                            isActive
                              ? "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                          aria-pressed={isActive}
                          onClick={() => setStageFilter(filter.key)}
                        >
                          {filter.label}{" "}
                          <span
                            className={`ml-0.5 font-normal ${
                              isActive ? "text-indigo-600" : "text-slate-400"
                            }`}
                          >
                            {counts[filter.key]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="mt-5">
                    <EmptyState
                      title="해당 단계의 공고가 없습니다."
                      description="다른 지원 단계를 선택하거나 전체 목록에서 확인하세요."
                    />
                  </div>
                ) : (
                  <>
                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      {pagedRecords.map((record) => (
                        <ApplicationListCard
                          key={record.application_id}
                          record={record}
                          isSelected={
                            selectedRecord?.application_id ===
                            record.application_id
                          }
                          onSelect={() => setSelectedId(record.application_id)}
                        />
                      ))}
                    </div>

                    <Pagination
                      currentPage={safePage}
                      pageCount={pageCount}
                      onPageChange={setCurrentPage}
                    />
                  </>
                )}
              </Card>

              {/* 오른쪽 상세 패널 스티키 영역 */}
              <aside className="xl:sticky xl:top-24 xl:self-start🚀">
                <ApplicationActionPanel
                  record={selectedRecord}
                  documentReadyCount={documentReadyCount}
                />
              </aside>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}

function PlannerMetric({
  icon,
  tint,
  label,
  value,
}: {
  icon: IconName;
  tint: "indigo" | "orange" | "green";
  label: string;
  value: string | number;
}) {
  const tintClass = {
    indigo: "bg-indigo-50 text-indigo-600",
    orange: "bg-orange-50 text-orange-600",
    green: "bg-emerald-50 text-emerald-600",
  }[tint];

  return (
    <div className="flex min-h-[96px] items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tintClass}`}
      >
        <LensIcon name={icon} className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function ApplicationListCard({
  record,
  isSelected,
  onSelect,
}: {
  record: ApplicationRecord;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`rounded-xl border bg-white p-4 transition-all ${
        isSelected
          ? "border-indigo-500 shadow-sm ring-1 ring-indigo-500/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge tone={deadlineTone(record.deadline_status)}>
              {deadlineLabel(record)}
            </StatusBadge>
            <StatusBadge tone={statusTone(record.status)}>
              {statusLabel(record.status)}
            </StatusBadge>
          </div>
          <p className="mt-2.5 text-xs font-bold text-indigo-600">
            {record.company_name}
          </p>
          <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-slate-900">
            {record.job_title}
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            {countryLabel(record.country)} · {workTypeLabel(record.work_type)} ·{" "}
            {record.salary_range || "연봉 미기재"}
          </p>
        </div>
        <ReadinessGaugeCard value={record.readiness_score} />
      </div>

      <div className="mt-4 space-y-2">
        <ProgressLine
          label="서류 준비도"
          value={record.readiness_score}
          tone={scoreTone(record.readiness_score)}
        />
        <ProgressLine
          label="로드맵 완료율"
          value={record.roadmap_completion_rate}
          tone="indigo"
        />
      </div>

      <div className="mt-4 flex gap-1.5">
        <Button
          type="button"
          className="min-h-8 gap-1 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
          onClick={onSelect}
        >
          상세보기 <LensIcon name="arrow" className="h-3 w-3" />
        </Button>
        <LinkButton
          href={`/applications/${record.application_id}`}
          variant="secondary"
          className="min-h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          워크스페이스
        </LinkButton>
      </div>
    </article>
  );
}

function ApplicationActionPanel({
  record,
  documentReadyCount,
}: {
  record: ApplicationRecord | null;
  documentReadyCount: number;
}) {
  if (!record) {
    return (
      <Card className="rounded-xl p-5 border-slate-200 shadow-sm bg-white">
        <EmptyState
          title="선택한 공고가 없습니다."
          description="지원 후보 목록에서 공고를 선택하면 준비 상태를 확인할 수 있습니다."
        />
      </Card>
    );
  }

  const verifiedCount = record.document_checklist.filter(
    (item) => item.status === "DONE" || item.status === "VERIFIED"
  ).length;

  return (
    <Card className="rounded-xl border-slate-200 p-5 shadow-sm bg-white">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Selected Roadmap
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
        {record.company_name}
      </h2>
      <p className="text-sm font-semibold text-slate-700">{record.job_title}</p>
      <p className="mt-1 text-xs text-slate-400">
        {countryLabel(record.country)} · {workTypeLabel(record.work_type)} ·{" "}
        {record.salary_range || "연봉 미기재"}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ReadinessDetailMetric
          value={record.readiness_score}
          helper={statusLabel(record.status)}
        />
        <DetailMetric
          label="서류 확인"
          value={`${verifiedCount}/${record.document_checklist.length}`}
          helper={`전체 ${documentReadyCount}개 후보`}
        />
      </div>

      <div className="mt-4 space-y-2.5">
        <ProgressLine
          label="서류 준비도"
          value={record.readiness_score}
          tone={scoreTone(record.readiness_score)}
          showTotal
        />
        <ProgressLine
          label="로드맵 완료율"
          value={record.roadmap_completion_rate}
          tone="indigo"
          showTotal
        />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">다음 액션</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
            {record.next_action}
          </p>
        </div>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white border border-slate-200 text-slate-500">
          <LensIcon name="document" className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
          Checklist
        </p>
        <div className="mt-2 space-y-1.5">
          {record.document_checklist.slice(0, 4).map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-slate-50 text-slate-400">
                  <LensIcon name="document" className="h-3 w-3" />
                </span>
                <p className="min-w-0 truncate text-xs font-semibold text-slate-800">
                  {item.label}
                </p>
              </div>
              <DocumentStatusBadge status={item.status} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-1.5">
        <LinkButton
          href={`/applications/${record.application_id}`}
          className="w-full gap-1.5 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm"
        >
          지원 워크스페이스 열기
          <LensIcon name="external" className="h-3.5 w-3.5" />
        </LinkButton>
        <div className="grid grid-cols-2 gap-1.5">
          <LinkButton
            href="/roadmap/employment/documents"
            variant="secondary"
            className="w-full rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            문서 점검
          </LinkButton>
          <LinkButton
            href={record.application_url || "/jobs"}
            target={record.application_url ? "_blank" : undefined}
            rel="noreferrer"
            variant="secondary"
            className="w-full gap-1.5 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LensIcon name="external" className="h-3.5 w-3.5 text-slate-400" />
            공고 보기
          </LinkButton>
        </div>
      </div>
    </Card>
  );
}

function ReadinessGaugeCard({ value }: { value: number }) {
  return (
    <div className="min-w-[76px] rounded-lg border border-slate-100 bg-slate-50/50 p-2 text-center">
      <p className="text-[9px] font-medium text-slate-400">준비도</p>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <CircularProgress value={value} size={22} />
        <p className="whitespace-nowrap leading-none">
          <span className="text-sm font-bold text-slate-900">{value}</span>
          <span className="ml-0.5 text-[9px] font-medium text-slate-400">
            점
          </span>
        </p>
      </div>
    </div>
  );
}

function ReadinessDetailMetric({
  value,
  helper,
}: {
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
      <p className="text-xs font-bold text-slate-500">준비도</p>
      <div className="mt-1.5 flex items-center gap-2">
        <CircularProgress value={value} size={26} />
        <p className="whitespace-nowrap leading-none">
          <span className="text-lg font-bold text-slate-900">{value}</span>
          <span className="ml-0.5 text-xs text-slate-400">점</span>
        </p>
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-400">{helper}</p>
    </div>
  );
}

function CircularProgress({ value, size }: { value: number; size: number }) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#4f46e5 ${clamped * 3.6}deg, #e2e8f0 0deg)`,
      }}
      aria-hidden="true"
    >
      <span
        className="block rounded-full bg-white"
        style={{ width: size - 8, height: size - 8 }}
      />
    </span>
  );
}

function DetailMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1 flex h-[26px] items-center">
        <p className="text-xl font-bold text-slate-900">{value}</p>
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-slate-400">{helper}</p>
    </div>
  );
}

function ProgressLine({
  label,
  value,
  tone,
  showTotal = false,
}: {
  label: string;
  value: number;
  tone: "orange" | "indigo" | "green" | "red";
  showTotal?: boolean;
}) {
  const barClass = {
    orange: "bg-orange-500",
    indigo: "bg-indigo-600",
    green: "bg-emerald-600",
    red: "bg-red-500",
  }[tone];

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-500">{label}</span>
        <span className="font-bold text-slate-800">
          {showTotal ? `${value} / 100` : `${value}%`}
        </span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "red" | "orange" | "indigo" | "green" | "muted";
}) {
  const toneClass = {
    red: "border-red-100 bg-red-50 text-red-600",
    orange: "border-orange-100 bg-orange-50 text-orange-600",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-600",
    green: "border-emerald-100 bg-emerald-50 text-emerald-700",
    muted: "border-slate-200 bg-slate-50 text-slate-500",
  }[tone];

  return (
    <span
      className={`inline-flex min-h-5 items-center rounded border px-1.5 text-[10px] font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function DocumentStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-6 shrink-0 items-center justify-center rounded px-2.5 text-[10px] font-bold border ${documentToneClass(
        status
      )}`}
    >
      {documentLabel(status)}
    </span>
  );
}

function Pagination({
  currentPage,
  pageCount,
  onPageChange,
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      <Button
        type="button"
        variant="secondary"
        className="min-h-8 rounded-lg border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        이전
      </Button>
      {Array.from({ length: pageCount }).map((_, index) => {
        const page = index + 1;
        return (
          <Button
            key={page}
            type="button"
            variant="secondary"
            className={`min-h-8 min-w-8 rounded-lg px-2.5 text-xs font-bold transition-colors ${
              currentPage === page
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        className="min-h-8 rounded-lg border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </Button>
    </div>
  );
}

function LensIcon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  if (name === "users") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <rect x="4" y="12" width="4" height="8" rx="0.5" />
        <rect x="10" y="8" width="4" height="12" rx="0.5" />
        <rect x="16" y="4" width="4" height="16" rx="0.5" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M9.5 21a2.8 2.8 0 0 0 5 0" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (name === "external") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M15 3h6v6" />
        <path d="m10 14 11-11" />
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      </svg>
    );
  }
  if (name === "document") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M9 18 15 12 9 6" />
    </svg>
  );
}

function sortByPriority(records: ApplicationRecord[]) {
  return records.slice().sort((left, right) => {
    const statusOrder =
      statusPriority(left.status) - statusPriority(right.status);
    if (statusOrder !== 0) return statusOrder;
    const leftDays = left.days_until_deadline ?? 9999;
    const rightDays = right.days_until_deadline ?? 9999;
    if (leftDays !== rightDays) return leftDays - rightDays;
    return right.readiness_score - left.readiness_score;
  });
}

function statusPriority(status: ApplicationStatus) {
  if (status === "PREPARING_DOCUMENTS") return 0;
  if (status === "INTERESTED") return 1;
  if (status === "APPLIED" || status === "INTERVIEW") return 2;
  return 3;
}

function isActiveStatus(status: ApplicationStatus) {
  return status === "APPLIED" || status === "INTERVIEW" || status === "CLOSED";
}

function statusLabel(status: ApplicationStatus) {
  if (status === "INTERESTED") return "관심";
  if (status === "PREPARING_DOCUMENTS") return "지원 준비";
  if (status === "APPLIED") return "지원 완료";
  if (status === "INTERVIEW") return "면접";
  if (status === "CLOSED") return "종료";
  return status;
}

function statusTone(status: ApplicationStatus) {
  if (status === "APPLIED" || status === "INTERVIEW") return "green";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "indigo";
  return "muted";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  if (record.days_until_deadline == null) return "D-?";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]) {
  if (status === "URGENT" || status === "EXPIRED") return "red";
  if (status === "SOON") return "orange";
  return "muted";
}

function scoreTone(score: number): "orange" | "indigo" | "green" | "red" {
  if (score >= 80) return "green";
  if (score >= 65) return "indigo";
  if (score >= 50) return "orange";
  return "red";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증";
  if (status === "DONE") return "완료";
  return "대기";
}

function documentToneClass(status: string) {
  if (status === "VERIFIED")
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "DONE")
    return "border-indigo-100 bg-indigo-50 text-indigo-600";
  return "border-slate-100 bg-slate-50 text-slate-500";
}

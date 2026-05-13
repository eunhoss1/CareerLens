"use client";

import { useEffect, useMemo, useState } from "react";
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
  SectionHeader
} from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { fetchUserApplications, type ApplicationRecord, type ApplicationStatus } from "@/lib/applications";
import { countryLabel, workTypeLabel } from "@/lib/display-labels";

type StageFilter = "ALL" | "INTERESTED" | "PREPARING_DOCUMENTS" | "ACTIVE";

const PAGE_SIZE = 4;

const stageFilters: Array<{ key: StageFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "INTERESTED", label: "관심 공고" },
  { key: "PREPARING_DOCUMENTS", label: "지원 준비" },
  { key: "ACTIVE", label: "진행 중" }
];

export default function ApplicationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<StageFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    fetchUserApplications(storedUser.user_id)
      .then((items) => {
        setRecords(items);
        setSelectedId(items[0]?.application_id ?? null);
      })
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 기록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const orderedRecords = useMemo(() => sortByPriority(records), [records]);

  const counts = useMemo(() => {
    return {
      ALL: records.length,
      INTERESTED: records.filter((record) => record.status === "INTERESTED").length,
      PREPARING_DOCUMENTS: records.filter((record) => record.status === "PREPARING_DOCUMENTS").length,
      ACTIVE: records.filter((record) => isActiveStatus(record.status)).length
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (stageFilter === "ALL") return orderedRecords;
    if (stageFilter === "ACTIVE") return orderedRecords.filter((record) => isActiveStatus(record.status));
    return orderedRecords.filter((record) => record.status === stageFilter);
  }, [orderedRecords, stageFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, pageCount);
  const pagedRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectedRecord = records.find((record) => record.application_id === selectedId) ?? filteredRecords[0] ?? records[0] ?? null;

  useEffect(() => {
    setCurrentPage(1);
  }, [stageFilter]);

  useEffect(() => {
    if (filteredRecords.length === 0) return;
    const visibleSelected = filteredRecords.some((record) => record.application_id === selectedId);
    if (!visibleSelected) {
      setSelectedId(filteredRecords[0].application_id);
    }
  }, [filteredRecords, selectedId]);

  const urgentCount = records.filter((record) => record.deadline_status === "URGENT" || record.deadline_status === "SOON").length;
  const activeCount = counts.ACTIVE;
  const averageReadiness = records.length === 0
    ? 0
    : Math.round(records.reduce((sum, record) => sum + record.readiness_score, 0) / records.length);
  const documentReadyCount = records.filter((record) => record.document_checklist.some((item) => item.status === "DONE" || item.status === "VERIFIED")).length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION WORKSPACE"
        title="기업지원 관리"
        description="목표 공고의 서류 준비도, 마감 위험, 다음 액션을 한곳에서 관리합니다. 실제 제출은 공식 Apply 페이지에서 진행하고, CareerLens는 준비 상태를 추적합니다."
        actions={
          <>
            <LinkButton href="/jobs" variant="secondary">전체 공고 보기</LinkButton>
            <LinkButton href="/jobs/recommendation">적합도 진단</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="지원 후보" value={records.length} helper="저장된 목표 공고" />
          <MetricCard label="평균 준비도" value={`${averageReadiness}점`} helper="로드맵과 검증 상태 반영" />
          <MetricCard label="마감 주의" value={`${urgentCount}개`} helper="21일 이내 또는 긴급 공고" />
          <MetricCard label="진행 중" value={`${activeCount}개`} helper="지원 완료/면접/종료 상태" />
        </div>

        {isLoading && (
          <div className="mt-6">
            <EmptyState title="지원 기록을 불러오는 중입니다." description="로그인한 사용자 기준으로 지원 워크스페이스를 확인하고 있습니다." />
          </div>
        )}

        {!isLoading && !user && (
          <div className="mt-6">
            <EmptyState
              title="로그인이 필요합니다."
              description="회원가입과 로그인을 완료하면 추천 진단, 커리어 플래너, 지원관리 기록을 사용자별로 저장할 수 있습니다."
              action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-6">
            <EmptyState title="지원관리 데이터를 처리하지 못했습니다." description={errorMessage} />
          </div>
        )}

        {!isLoading && user && records.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title="아직 지원 후보가 없습니다."
              description="적합도 진단에서 커리어 플래너를 만들거나 전체 공고에서 목표 공고를 선택하면 지원관리로 넘길 수 있습니다."
              action={<LinkButton href="/jobs/recommendation">적합도 진단 시작</LinkButton>}
            />
          </div>
        )}

        {records.length > 0 && (
          <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_360px]">
            <Card className="rounded-2xl p-5">
              <div className="flex flex-col gap-4 border-b border-line pb-4 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeader
                  kicker="APPLICATION LIST"
                  title="지원 후보 목록"
                  description="공고는 한 페이지에 4개씩 표시됩니다. 공고를 선택하면 오른쪽에서 다음 액션과 제출 준비 상태를 바로 확인할 수 있습니다."
                />
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
                  {stageFilters.map((filter) => (
                    <Button
                      key={filter.key}
                      type="button"
                      variant={stageFilter === filter.key ? "primary" : "secondary"}
                      className="min-h-9 whitespace-nowrap px-3 text-xs"
                      onClick={() => setStageFilter(filter.key)}
                    >
                      {filter.label} {counts[filter.key]}
                    </Button>
                  ))}
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="mt-5">
                  <EmptyState title="해당 단계의 공고가 없습니다." description="다른 지원 단계를 선택하거나 전체 목록에서 확인하세요." />
                </div>
              ) : (
                <>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {pagedRecords.map((record) => (
                      <ApplicationListCard
                        key={record.application_id}
                        record={record}
                        isSelected={selectedRecord?.application_id === record.application_id}
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

            <aside className="xl:sticky xl:top-24 xl:self-start">
              <ApplicationActionPanel record={selectedRecord} documentReadyCount={documentReadyCount} />
            </aside>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ApplicationListCard({
  record,
  isSelected,
  onSelect
}: {
  record: ApplicationRecord;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={`rounded-2xl border bg-white p-4 transition ${isSelected ? "border-brand shadow-sm" : "border-line hover:border-slate-400"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</Badge>
            <Badge tone={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
          </div>
          <p className="mt-3 text-sm font-semibold text-brand">{record.company_name}</p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-night">{record.job_title}</h3>
          <p className="mt-1 text-xs text-slate-500">{countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}</p>
        </div>
        <div className="min-w-16 rounded-xl border border-line bg-panel px-2 py-2 text-center">
          <p className="text-[10px] font-bold text-slate-500">준비도</p>
          <p className="text-xl font-semibold text-night">{record.readiness_score}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <ScoreBar label="서류 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs font-bold text-slate-500">다음 액션</p>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-700">{record.next_action}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant={isSelected ? "primary" : "secondary"} className="min-h-9 px-3 text-xs" onClick={onSelect}>
          {isSelected ? "선택됨" : "요약 보기"}
        </Button>
        <LinkButton href={`/applications/${record.application_id}`} variant="subtle" className="min-h-9 px-3 text-xs">
          워크스페이스
        </LinkButton>
      </div>
    </article>
  );
}

function ApplicationActionPanel({ record, documentReadyCount }: { record: ApplicationRecord | null; documentReadyCount: number }) {
  if (!record) {
    return (
      <Card className="p-5">
        <EmptyState title="선택한 공고가 없습니다." description="지원 후보 목록에서 공고를 선택하면 준비 상태를 확인할 수 있습니다." />
      </Card>
    );
  }

  const verifiedCount = record.document_checklist.filter((item) => item.status === "DONE" || item.status === "VERIFIED").length;

  return (
    <Card className="rounded-2xl p-5">
      <p className="lens-kicker">SELECTED APPLICATION</p>
      <h2 className="mt-3 text-xl font-semibold leading-7 text-night">{record.company_name}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700">{record.job_title}</p>
      <p className="mt-2 text-xs text-slate-500">{countryLabel(record.country)} · {workTypeLabel(record.work_type)} · {record.salary_range || "연봉 미기재"}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="준비도" value={`${record.readiness_score}점`} helper={statusLabel(record.status)} />
        <MetricCard label="서류 확인" value={`${verifiedCount}/${record.document_checklist.length}`} helper={`전체 ${documentReadyCount}개 후보`} />
      </div>

      <div className="mt-5 space-y-3">
        <ScoreBar label="서류 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </div>

      <div className="mt-5 rounded-xl border border-line bg-panel p-4">
        <p className="text-xs font-bold text-slate-500">다음 액션</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{record.next_action}</p>
      </div>

      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Checklist</p>
        <div className="mt-3 space-y-2">
          {record.document_checklist.slice(0, 4).map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-night">{item.label}</p>
                <p className="mt-1 text-xs text-slate-500">{item.helper_text}</p>
              </div>
              <Badge tone={documentTone(item.status)} className="shrink-0">{documentLabel(item.status)}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        <LinkButton href={`/applications/${record.application_id}`} className="w-full">
          지원 워크스페이스 열기
        </LinkButton>
        <div className="grid grid-cols-2 gap-2">
          <LinkButton href="/roadmap/employment/documents" variant="secondary" className="w-full">
            문서 점검
          </LinkButton>
          {record.application_url ? (
            <LinkButton href={record.application_url} target="_blank" rel="noreferrer" variant="subtle" className="w-full">
              원문 Apply
            </LinkButton>
          ) : (
            <LinkButton href="/jobs" variant="subtle" className="w-full">
              공고 보기
            </LinkButton>
          )}
        </div>
      </div>
    </Card>
  );
}

function Pagination({
  currentPage,
  pageCount,
  onPageChange
}: {
  currentPage: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button
        type="button"
        variant="secondary"
        className="min-h-9 px-3"
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
            variant={currentPage === page ? "primary" : "secondary"}
            className="min-h-9 min-w-9 px-3"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        className="min-h-9 px-3"
        disabled={currentPage === pageCount}
        onClick={() => onPageChange(currentPage + 1)}
      >
        다음
      </Button>
    </div>
  );
}

function sortByPriority(records: ApplicationRecord[]) {
  return records.slice().sort((left, right) => {
    const statusOrder = statusPriority(left.status) - statusPriority(right.status);
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
  if (status === "PREPARING_DOCUMENTS") return "서류 준비";
  if (status === "APPLIED") return "지원 완료";
  if (status === "INTERVIEW") return "면접";
  if (status === "CLOSED") return "종료";
  return status;
}

function statusTone(status: ApplicationStatus) {
  if (status === "APPLIED" || status === "INTERVIEW") return "brand";
  if (status === "CLOSED") return "muted";
  if (status === "PREPARING_DOCUMENTS") return "warning";
  return "default";
}

function deadlineLabel(record: ApplicationRecord) {
  if (record.deadline_status === "ONGOING") return "상시/미기재";
  if (record.deadline_status === "EXPIRED") return "마감";
  if (record.days_until_deadline === 0) return "오늘 마감";
  return `D-${record.days_until_deadline}`;
}

function deadlineTone(status: ApplicationRecord["deadline_status"]) {
  if (status === "URGENT" || status === "EXPIRED") return "risk";
  if (status === "SOON") return "warning";
  return "muted";
}

function scoreTone(score: number) {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증";
  if (status === "DONE") return "완료";
  return "대기";
}

function documentTone(status: string) {
  if (status === "VERIFIED") return "success";
  if (status === "DONE") return "brand";
  return "muted";
}

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
import {
  fetchUserApplications,
  updateApplicationStatus,
  type ApplicationRecord,
  type ApplicationStatus
} from "@/lib/applications";

const pipeline = [
  {
    key: "INTERESTED",
    title: "관심 공고",
    summary: "추천 결과를 보관하고 지원 우선순위를 결정하는 단계"
  },
  {
    key: "PREPARING_DOCUMENTS",
    title: "지원 준비",
    summary: "이력서, 포트폴리오, GitHub, 어학 증빙을 정리하는 단계"
  },
  {
    key: "ACTIVE",
    title: "지원 진행",
    summary: "지원 완료 이후 면접, 응답, 결과를 추적하는 단계"
  }
] as const;

const statusOptions: Array<{ value: ApplicationStatus; label: string }> = [
  { value: "INTERESTED", label: "관심" },
  { value: "PREPARING_DOCUMENTS", label: "서류 준비" },
  { value: "APPLIED", label: "지원 완료" },
  { value: "INTERVIEW", label: "면접 준비" },
  { value: "CLOSED", label: "종료" }
];

export default function ApplicationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    if (!storedUser) {
      setIsLoading(false);
      return;
    }

    fetchUserApplications(storedUser.user_id)
      .then(setRecords)
      .catch((error) => setErrorMessage(error instanceof Error ? error.message : "지원 기록을 불러오지 못했습니다."))
      .finally(() => setIsLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const ordered = records.slice().sort((a, b) => {
      const aDays = a.days_until_deadline ?? 9999;
      const bDays = b.days_until_deadline ?? 9999;
      return aDays - bDays;
    });
    return {
      INTERESTED: ordered.filter((record) => record.status === "INTERESTED"),
      PREPARING_DOCUMENTS: ordered.filter((record) => record.status === "PREPARING_DOCUMENTS"),
      ACTIVE: ordered.filter((record) => record.status === "APPLIED" || record.status === "INTERVIEW" || record.status === "CLOSED")
    };
  }, [records]);

  const urgentCount = records.filter((record) => record.deadline_status === "URGENT" || record.deadline_status === "SOON").length;
  const activeCount = grouped.ACTIVE.length;
  const averageReadiness = records.length === 0
    ? 0
    : Math.round(records.reduce((sum, record) => sum + record.readiness_score, 0) / records.length);

  async function changeStatus(record: ApplicationRecord, status: ApplicationStatus) {
    setUpdatingId(record.application_id);
    setErrorMessage(null);
    try {
      const updated = await updateApplicationStatus(record.application_id, status);
      setRecords((current) => current.map((item) => (item.application_id === updated.application_id ? updated : item)));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "지원 상태를 변경하지 못했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION PIPELINE"
        title="지원 관리"
        description="추천 진단과 커리어 플래너에서 넘어온 목표 공고를 마감일, 서류 준비도, 로드맵 진행률 기준으로 관리합니다."
        actions={<LinkButton href="/jobs/recommendation">추천 진단으로</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="전체 지원 기록" value={records.length} helper="플래너에서 전환된 목표 공고" />
          <MetricCard label="평균 준비 점수" value={`${averageReadiness}점`} helper="추천 점수 + 과제 완료 + 검증 반영" />
          <MetricCard label="마감 임박" value={urgentCount} helper="21일 이내 마감 또는 긴급 공고" />
          <MetricCard label="지원 진행" value={activeCount} helper="지원 완료/면접/종료 단계" />
        </div>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-5">
            <SectionHeader
              kicker="READINESS CONTROL"
              title="지원 준비 판단 기준"
              description="CareerLens는 지원 기록을 단순 상태값이 아니라 공고 마감기한, 로드맵 완료율, AI 검증 결과를 함께 보는 준비 대시보드로 관리합니다."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <SignalBlock label="마감 위험도" value="D-day 기준" description="7일 이내는 긴급, 21일 이내는 임박으로 표시합니다." />
              <SignalBlock label="로드맵 완료율" value="PlannerTask" description="커리어 플래너 과제 완료 상태를 지원 준비도에 반영합니다." />
              <SignalBlock label="검증 증빙" value="AI Review" description="문서/GitHub 검증 점수 60점 이상을 증빙으로 계산합니다." />
            </div>
          </Card>

          <Card className="p-5">
            <p className="lens-kicker">NEXT BEST ACTION</p>
            <h2 className="mt-3 text-xl font-semibold text-night">{nextPriorityTitle(records)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{nextPriorityDescription(records)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석</LinkButton>
              <LinkButton href="/planner" variant="subtle">로드맵 목록</LinkButton>
            </div>
          </Card>
        </section>

        <div className="mt-8">
          <SectionHeader
            kicker="PIPELINE"
            title="추천 결과에서 실제 지원 단계까지"
            description="플래너 상세 화면에서 지원 관리를 시작하면 이 페이지에 DB 기록이 생성됩니다. 이후 상태를 바꾸며 지원 흐름을 추적할 수 있습니다."
          />
        </div>

        {isLoading && (
          <div className="mt-6">
            <EmptyState title="지원 기록을 불러오는 중입니다." description="로그인한 사용자 기준으로 지원 파이프라인을 확인하고 있습니다." />
          </div>
        )}

        {!isLoading && !user && (
          <div className="mt-6">
            <EmptyState
              title="로그인이 필요합니다."
              description="회원가입과 로그인을 완료한 뒤 추천 진단과 플래너를 통해 지원 기록을 생성할 수 있습니다."
              action={<LinkButton href="/login">로그인으로 이동</LinkButton>}
            />
          </div>
        )}

        {errorMessage && (
          <div className="mt-6">
            <EmptyState title="지원 관리 데이터를 처리하지 못했습니다." description={errorMessage} />
          </div>
        )}

        {!isLoading && user && records.length === 0 && (
          <div className="mt-6">
            <EmptyState
              title="아직 지원 관리로 넘긴 공고가 없습니다."
              description="맞춤채용정보 추천 진단에서 플래너를 생성한 뒤, 플래너 상세 화면에서 지원 관리로 전환할 수 있습니다."
              action={<LinkButton href="/jobs/recommendation">추천 진단 시작</LinkButton>}
            />
          </div>
        )}

        {records.length > 0 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {pipeline.map((column) => (
              <PipelineColumn
                key={column.key}
                title={column.title}
                summary={column.summary}
                records={grouped[column.key]}
                updatingId={updatingId}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function SignalBlock({ label, value, description }: { label: string; value: string; description: string }) {
  return (
    <div className="border border-line bg-panel p-4">
      <p className="text-xs font-bold text-brand">{label}</p>
      <p className="mt-2 text-lg font-semibold text-night">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PipelineColumn({
  title,
  summary,
  records,
  updatingId,
  onStatusChange
}: {
  title: string;
  summary: string;
  records: ApplicationRecord[];
  updatingId: number | null;
  onStatusChange: (record: ApplicationRecord, status: ApplicationStatus) => void;
}) {
  return (
    <section className="border border-line bg-panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-night">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{summary}</p>
        </div>
        <Badge tone="muted">{records.length}</Badge>
      </div>
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-line bg-white p-4 text-sm leading-6 text-slate-500">해당 단계의 공고가 없습니다.</div>
        ) : (
          records.map((record) => (
            <ApplicationCard
              key={record.application_id}
              record={record}
              isUpdating={updatingId === record.application_id}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ApplicationCard({
  record,
  isUpdating,
  onStatusChange
}: {
  record: ApplicationRecord;
  isUpdating: boolean;
  onStatusChange: (record: ApplicationRecord, status: ApplicationStatus) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={deadlineTone(record.deadline_status)}>{deadlineLabel(record)}</Badge>
            <Badge tone={statusTone(record.status)}>{statusLabel(record.status)}</Badge>
          </div>
          <p className="mt-3 text-sm font-semibold text-brand">{record.company_name}</p>
          <h3 className="mt-1 text-base font-semibold leading-6 text-night">{record.job_title}</h3>
          <p className="mt-1 text-xs text-slate-500">{record.country} · {record.work_type} · {record.salary_range}</p>
        </div>
        <div className="min-w-14 border border-line bg-panel px-2 py-1 text-center">
          <p className="text-[10px] font-bold text-slate-500">준비</p>
          <p className="text-lg font-semibold text-night">{record.readiness_score}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ScoreBar label="지원 준비 점수" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </div>

      <div className="mt-4 border border-line bg-panel p-3">
        <p className="text-xs font-bold text-slate-500">다음 액션</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{record.next_action}</p>
      </div>

      <div className="mt-4 grid gap-2">
        {record.document_checklist.map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-3 border border-line bg-white p-3">
            <div>
              <p className="text-sm font-semibold text-night">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{item.helper_text}</p>
            </div>
            <Badge tone={documentTone(item.status)}>{documentLabel(item.status)}</Badge>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{record.completed_task_count}/{record.total_task_count} 과제 완료</span>
        <span>·</span>
        <span>{record.verified_task_count}개 과제 검증</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={record.status === option.value ? "primary" : "secondary"}
            disabled={isUpdating}
            onClick={() => onStatusChange(record, option.value)}
            className="min-h-9 px-3 text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

function nextPriorityTitle(records: ApplicationRecord[]) {
  if (records.length === 0) return "추천 진단에서 목표 공고를 먼저 생성하세요.";
  const urgent = records.find((record) => record.deadline_status === "URGENT" && record.status !== "APPLIED" && record.status !== "INTERVIEW");
  if (urgent) return `${urgent.company_name} 마감 대응이 우선입니다.`;
  const lowReadiness = records.find((record) => record.readiness_score < 70 && record.status !== "CLOSED");
  if (lowReadiness) return `${lowReadiness.company_name} 지원 패키지를 보강하세요.`;
  return "지원 완료 기록과 면접 준비를 정리하세요.";
}

function nextPriorityDescription(records: ApplicationRecord[]) {
  if (records.length === 0) return "맞춤추천 진단에서 플래너를 만들고 지원 관리로 넘기면 공고별 준비 현황이 표시됩니다.";
  const urgent = records.find((record) => record.deadline_status === "URGENT" && record.status !== "APPLIED" && record.status !== "INTERVIEW");
  if (urgent) return urgent.next_action;
  const lowReadiness = records.find((record) => record.readiness_score < 70 && record.status !== "CLOSED");
  if (lowReadiness) return "AI 문서 분석으로 이력서, 포트폴리오, GitHub 증빙을 검증하고 준비 점수를 끌어올리는 것이 좋습니다.";
  return "지원 완료 후에는 면접 답변, 채용 담당자 응답, 결과 회고를 기록해 다음 추천 공고에 반영하세요.";
}

function statusLabel(status: ApplicationStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
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

function documentLabel(status: string) {
  if (status === "VERIFIED") return "검증됨";
  if (status === "DONE") return "완료";
  return "준비 전";
}

function documentTone(status: string) {
  if (status === "VERIFIED") return "brand";
  if (status === "DONE") return "success";
  return "muted";
}

function scoreTone(score: number) {
  if (score >= 80) return "success";
  if (score >= 65) return "brand";
  if (score >= 50) return "warning";
  return "risk";
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
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

type PipelineColumn = {
  key: "INTERESTED" | "PREPARING_DOCUMENTS" | "ACTIVE";
  title: string;
  description: string;
};

const pipelineColumns: PipelineColumn[] = [
  {
    key: "INTERESTED",
    title: "관심 공고",
    description: "추천 또는 전체공고에서 저장한 지원 후보입니다."
  },
  {
    key: "PREPARING_DOCUMENTS",
    title: "지원 준비",
    description: "이력서, 포트폴리오, GitHub, 자격 증빙을 정리하는 단계입니다."
  },
  {
    key: "ACTIVE",
    title: "지원 진행",
    description: "지원 완료, 면접, 결과 대기까지 추적하는 단계입니다."
  }
];

export default function ApplicationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const ordered = records.slice().sort((left, right) => {
      const leftDays = left.days_until_deadline ?? 9999;
      const rightDays = right.days_until_deadline ?? 9999;
      return leftDays - rightDays;
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
  const documentReadyCount = records.filter((record) => record.document_checklist.some((item) => item.status === "DONE" || item.status === "VERIFIED")).length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="APPLICATION WORKSPACE"
        title="기업지원 관리"
        description="추천 진단과 커리어 플래너에서 넘어온 목표 공고를 지원 워크스페이스로 관리합니다. 실제 제출은 원문 Apply 페이지에서 진행하고, CareerLens에서는 준비도와 지원 상태를 추적합니다."
        actions={
          <>
            <LinkButton href="/jobs" variant="secondary">전체 공고 보기</LinkButton>
            <LinkButton href="/jobs/recommendation">맞춤추천 진단</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="지원 워크스페이스" value={records.length} helper="저장된 목표 공고" />
          <MetricCard label="평균 준비도" value={`${averageReadiness}점`} helper="추천 점수, 로드맵, 검증 반영" />
          <MetricCard label="마감 주의" value={`${urgentCount}개`} helper="21일 이내 또는 긴급 공고" />
          <MetricCard label="진행 중" value={`${activeCount}개`} helper="지원 완료/면접/종료 상태" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5">
            <SectionHeader
              kicker="SUPPORT FLOW"
              title="지원 준비에서 실제 Apply까지"
              description="지원관리 영역은 외부 사이트를 대신 조작하지 않습니다. 공고 원문 분석, 제출 패키지 점검, 상태 기록을 CareerLens 안에서 처리하고 최종 제출은 공식 Apply 페이지로 연결합니다."
            />
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <FlowStep index="01" title="공고 저장" description="추천 진단 또는 전체 공고에서 목표 공고를 지원 워크스페이스로 넘깁니다." />
              <FlowStep index="02" title="서류 점검" description="이력서, 커버레터, 포트폴리오, GitHub 검증 상태를 확인합니다." />
              <FlowStep index="03" title="외부 제출" description="원문 Apply 페이지에서 최종 제출하고 CareerLens에는 결과와 다음 액션을 기록합니다." />
            </div>
          </Card>

          <Card className="p-5">
            <p className="lens-kicker">NEXT ACTION</p>
            <h2 className="mt-3 text-xl font-semibold text-night">{nextPriorityTitle(records)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{nextPriorityDescription(records)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricCard label="서류 근거 있음" value={`${documentReadyCount}개`} helper="DONE/VERIFIED 포함" />
              <MetricCard label="AI 검증 연결" value="가능" helper="문서분석 메뉴로 이동" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton href="/roadmap/employment/documents" variant="secondary">AI 문서 분석</LinkButton>
              <LinkButton href="/planner" variant="subtle">로드맵 목록</LinkButton>
            </div>
          </Card>
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
              title="아직 지원 워크스페이스가 없습니다."
              description="추천 진단에서 커리어 플래너를 만들거나 전체 공고에서 목표 공고를 선택한 뒤 지원관리로 넘길 수 있습니다."
              action={<LinkButton href="/jobs/recommendation">추천 진단 시작</LinkButton>}
            />
          </div>
        )}

        {records.length > 0 && (
          <div className="mt-8">
            <SectionHeader
              kicker="PIPELINE"
              title="공고별 지원 파이프라인"
              description="각 카드는 상세 워크스페이스로 연결됩니다. 상세 화면에서 원문 공고, 서류 체크리스트, 메모, 상태 변경을 관리합니다."
            />
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {pipelineColumns.map((column) => (
                <PipelineLane key={column.key} column={column} records={grouped[column.key]} />
              ))}
            </div>
          </div>
        )}
      </section>
    </PageShell>
  );
}

function FlowStep({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="border border-line bg-panel p-4">
      <p className="text-xs font-bold text-brand">{index}</p>
      <h3 className="mt-3 text-base font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function PipelineLane({ column, records }: { column: PipelineColumn; records: ApplicationRecord[] }) {
  return (
    <section className="border border-line bg-panel p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-night">{column.title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{column.description}</p>
        </div>
        <Badge tone="muted">{records.length}</Badge>
      </div>

      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-line bg-white p-4 text-sm leading-6 text-slate-500">해당 단계의 공고가 없습니다.</div>
        ) : (
          records.map((record) => <ApplicationCard key={record.application_id} record={record} />)
        )}
      </div>
    </section>
  );
}

function ApplicationCard({ record }: { record: ApplicationRecord }) {
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
          <p className="mt-1 text-xs text-slate-500">{record.country} · {record.work_type} · {record.salary_range || "연봉 미기재"}</p>
        </div>
        <div className="min-w-14 border border-line bg-panel px-2 py-1 text-center">
          <p className="text-[10px] font-bold text-slate-500">준비도</p>
          <p className="text-lg font-semibold text-night">{record.readiness_score}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <ScoreBar label="지원 준비도" value={record.readiness_score} tone={scoreTone(record.readiness_score)} />
        <ScoreBar label="로드맵 완료율" value={record.roadmap_completion_rate} tone="brand" />
      </div>

      <div className="mt-4 border border-line bg-panel p-3">
        <p className="text-xs font-bold text-slate-500">다음 액션</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{record.next_action}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>{record.completed_task_count}/{record.total_task_count} 과제 완료</span>
        <span>·</span>
        <span>{record.verified_task_count}개 과제 검증</span>
      </div>

      <div className="mt-4">
        <LinkButton href={`/applications/${record.application_id}`} className="w-full">
          지원 워크스페이스 열기
        </LinkButton>
      </div>
    </Card>
  );
}

function nextPriorityTitle(records: ApplicationRecord[]) {
  if (records.length === 0) return "추천 진단에서 목표 공고를 먼저 생성하세요.";
  const urgent = records.find((record) => record.deadline_status === "URGENT" && record.status !== "APPLIED" && record.status !== "INTERVIEW");
  if (urgent) return `${urgent.company_name} 지원 마감 대응이 우선입니다.`;
  const lowReadiness = records.find((record) => record.readiness_score < 70 && record.status !== "CLOSED");
  if (lowReadiness) return `${lowReadiness.company_name} 지원 패키지를 보강하세요.`;
  return "지원 완료 기록과 면접 준비를 정리하세요.";
}

function nextPriorityDescription(records: ApplicationRecord[]) {
  if (records.length === 0) return "맞춤추천 진단에서 플래너를 만들고 지원관리로 넘기면 공고별 준비 상태를 관리할 수 있습니다.";
  const urgent = records.find((record) => record.deadline_status === "URGENT" && record.status !== "APPLIED" && record.status !== "INTERVIEW");
  if (urgent) return urgent.next_action;
  const lowReadiness = records.find((record) => record.readiness_score < 70 && record.status !== "CLOSED");
  if (lowReadiness) return "AI 문서 분석으로 이력서, 포트폴리오, GitHub 증빙을 검증하고 준비 점수를 끌어올리는 것이 좋습니다.";
  return "지원 완료 후에는 면접 답변, 채용 담당자 응답, 결과 회고를 기록해 다음 추천 공고에 반영하세요.";
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

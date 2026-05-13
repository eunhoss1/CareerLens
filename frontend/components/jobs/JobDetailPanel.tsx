import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

export function JobDetailPanel({
  job,
  creating,
  onClose,
  onCreateRoadmap
}: {
  job: JobPosting;
  creating: boolean;
  onClose: () => void;
  onCreateRoadmap: () => void;
}) {
  const externalJob = job.external_ref?.startsWith("greenhouse:");

  return (
    <Card className="mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-line bg-panel p-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
            <Badge tone={externalJob ? "warning" : "success"}>{externalJob ? "실시간 수집 공고" : "검수 완료 공고"}</Badge>
          </div>
          <h2 className="mt-4 text-2xl font-bold leading-8 text-night">{job.company_name}</h2>
          <p className="mt-1 text-lg font-semibold text-ink">{job.job_title}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{job.evaluation_rationale}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button type="button" disabled={creating || job.deadline_status === "CLOSED"} onClick={onCreateRoadmap}>
            {creating ? "로드맵 생성 중" : "내 프로필 기준 로드맵 생성"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <p className="text-xs font-bold tracking-[0.14em] text-brand">JOB DOSSIER</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Info label="근무 형태" value={job.work_type || "미기재"} />
            <Info label="최소 경력" value={`최소 ${job.min_experience_years ?? 0}년`} />
            <Info label="연봉 범위" value={job.salary_range || "미기재"} />
            <Info label="마감" value={`${formatDate(job.application_deadline)} · ${daysText(job)}`} />
            <Info label="학력 조건" value={job.degree_requirement || "미기재"} />
            <Info label="비자 조건" value={job.visa_requirement || "미기재"} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <SkillGroup title="필수 기술" values={job.required_skills} />
            <SkillGroup title="우대 기술" values={job.preferred_skills} />
          </div>
        </section>

        <section className="border border-line bg-panel p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">EVIDENCE CHECK</p>
          <div className="mt-4 space-y-4">
            <Metric label="연봉 매력도" value={job.salary_score} fallback={job.salary_range === "Not disclosed" ? "연봉 미기재" : "공고 표기 기반"} />
            <Metric label="워라밸" value={externalJob ? null : job.work_life_balance_score} fallback={externalJob ? "추가 확인 필요" : "근거 부족"} tone="success" />
            <Metric label="기업 가치" value={externalJob ? null : job.company_value_score} fallback={externalJob ? "기업 단위 확인" : "검수 필요"} tone="warning" />
          </div>
          <div className="mt-5 border border-line bg-white p-3 text-sm leading-6 text-slate-600">
            <p className="font-bold text-night">표시 기준</p>
            <p className="mt-1">
              전체공고 화면은 빠른 탐색용입니다. 공고 원문만으로 판단하기 어려운 워라밸, 기업 가치 항목은 점수보다 확인 상태를 먼저 보여주고, 맞춤추천 진단에서 사용자 프로필 기준으로 다시 해석합니다.
            </p>
          </div>
        </section>
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-night">{value}</p>
    </div>
  );
}

function SkillGroup({ title, values }: { title: string; values: string[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-night">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length === 0 ? (
          <span className="border border-line bg-white px-2.5 py-1 text-xs font-medium text-slate-500">미기재</span>
        ) : (
          values.map((value) => (
            <span key={value} className="border border-line bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
              {value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  fallback,
  tone
}: {
  label: string;
  value: number | null;
  fallback: string;
  tone?: "brand" | "success" | "warning";
}) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-slate-700">{label}</span>
          <span className="font-bold text-slate-500">{fallback}</span>
        </div>
        <div className="mt-2 h-2 border border-line bg-white" />
      </div>
    );
  }

  return <ScoreBar label={label} value={value} tone={tone} />;
}

import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

export function JobCard({
  job,
  selected,
  creating,
  onOpenDetail,
  onCreateRoadmap
}: {
  job: JobPosting;
  selected: boolean;
  creating: boolean;
  onOpenDetail: () => void;
  onCreateRoadmap: () => void;
}) {
  const externalJob = isExternalJob(job);

  return (
    <Card className={`flex flex-col p-5 transition ${selected ? "border-brand shadow-panel" : "hover:border-night"}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
            <Badge tone={externalJob ? "warning" : "success"}>{externalJob ? "실시간 공고" : "검수 공고"}</Badge>
          </div>
          <h2 className="mt-4 text-xl font-semibold leading-7 text-night">{job.company_name}</h2>
          <p className="mt-1 text-base font-medium text-ink">{job.job_title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {job.work_type} · 최소 {job.min_experience_years ?? 0}년 · {job.salary_range || "연봉 미기재"}
          </p>
        </div>
        <div className="min-w-[132px] border border-line bg-panel p-3 text-right">
          <p className="text-xs font-semibold text-slate-500">DEADLINE</p>
          <p className="mt-1 text-lg font-semibold text-night">{formatDate(job.application_deadline)}</p>
          <p className="mt-1 text-xs text-slate-500">{daysText(job)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
        <div>
          <p className="text-xs font-bold tracking-[0.14em] text-brand">REQUIRED SKILLS</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {job.required_skills.slice(0, 6).map((skill) => (
              <span key={skill} className="border border-line bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {skill}
              </span>
            ))}
            {job.required_skills.length > 6 && (
              <span className="border border-line bg-panel px-2.5 py-1 text-xs font-semibold text-slate-500">
                +{job.required_skills.length - 6}
              </span>
            )}
          </div>
          <p className="mt-4 min-h-[72px] text-sm leading-6 text-slate-600">
            {job.evaluation_rationale || "공고별 평가 가중치와 PatternProfile 근거를 활용해 사용자 프로필 기반 진단을 생성합니다."}
          </p>
        </div>
        <div className="space-y-3 border border-line bg-panel p-3">
          <EvidenceScore label="연봉" value={job.salary_score} emptyText={job.salary_range === "Not disclosed" ? "미기재" : "평가 보류"} />
          <EvidenceScore label="워라밸" value={externalJob ? null : job.work_life_balance_score} tone="success" emptyText={externalJob ? "검수 필요" : "근거 부족"} />
          <EvidenceScore label="기업 가치" value={externalJob ? null : job.company_value_score} tone="warning" emptyText={externalJob ? "기업 단위" : "검수 필요"} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          비자 조건: <span className="font-medium text-night">{job.visa_requirement || "미기재"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={onOpenDetail}>
            상세 보기
          </Button>
          <Button type="button" onClick={onCreateRoadmap} disabled={creating || job.deadline_status === "CLOSED"}>
            {creating ? "생성 중" : "로드맵 생성"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function EvidenceScore({
  label,
  value,
  tone,
  emptyText
}: {
  label: string;
  value: number | null;
  tone?: "brand" | "success" | "warning";
  emptyText: string;
}) {
  if (value === null || value === undefined) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium text-slate-700">{label}</span>
          <span className="font-semibold text-slate-500">{emptyText}</span>
        </div>
        <div className="mt-2 h-2 border border-line bg-white">
          <div className="h-full w-0 bg-slate-200" />
        </div>
      </div>
    );
  }
  return <ScoreBar label={label} value={value} tone={tone} />;
}

function isExternalJob(job: JobPosting) {
  return job.external_ref?.startsWith("greenhouse:") || job.evaluation_rationale?.includes("Greenhouse");
}

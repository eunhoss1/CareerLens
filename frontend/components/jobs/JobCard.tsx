import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

export function JobCard({ job, creating, onCreateRoadmap }: { job: JobPosting; creating: boolean; onCreateRoadmap: () => void }) {
  return (
    <Card className="flex flex-col p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="brand">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
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
            {job.required_skills.slice(0, 7).map((skill) => (
              <span key={skill} className="border border-line bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {job.evaluation_rationale || "공고별 평가 가중치와 PatternProfile 근거를 활용해 사용자 프로필 기반 진단을 생성합니다."}
          </p>
        </div>
        <div className="space-y-3 border border-line bg-panel p-3">
          <EvidenceScore label="연봉 매력도" value={job.salary_score} emptyText={job.salary_range === "Not disclosed" ? "연봉 미기재" : "평가 보류"} />
          <EvidenceScore label="워라밸" value={job.work_life_balance_score} tone="success" emptyText="근거 부족" />
          <EvidenceScore label="기업 가치" value={job.company_value_score} tone="warning" emptyText="검수 필요" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          비자 조건: <span className="font-medium text-night">{job.visa_requirement || "미기재"}</span>
        </p>
        <Button onClick={onCreateRoadmap} disabled={creating || job.deadline_status === "CLOSED"}>
          {creating ? "로드맵 생성 중" : "내 프로필 기준 로드맵 생성"}
        </Button>
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

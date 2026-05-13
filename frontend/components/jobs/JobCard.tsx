import { Badge, Button, Card, ScoreBar } from "@/components/ui";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

export function JobCard({
  job,
  creating,
  onCreateRoadmap
}: {
  job: JobPosting;
  creating: boolean;
  onCreateRoadmap: () => void;
}) {
  const sourceUrl = greenhouseSourceUrl(job.external_ref);

  return (
    <Card className="flex min-h-[360px] flex-col rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone="muted">{countryLabel(job.country)}</Badge>
            <Badge tone="muted">{job.job_family}</Badge>
            <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
          </div>
          <h2 className="mt-4 truncate text-lg font-bold leading-7 text-night">{job.company_name}</h2>
          <p className="mt-1 line-clamp-1 text-base font-semibold text-ink">{job.job_title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {job.work_type} · 최소 {job.min_experience_years ?? 0}년 · {job.salary_range || "연봉 미기재"}
          </p>
        </div>
        <div className="min-w-[116px] text-right">
          <p className="text-[10px] font-extrabold tracking-[0.12em] text-slate-400">DEADLINE</p>
          <p className="mt-1 text-sm font-bold text-night">{formatDate(job.application_deadline)}</p>
          <p className={`mt-1 text-xs font-bold ${job.deadline_status === "URGENT" ? "text-coral" : "text-slate-500"}`}>{daysText(job)}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50/80 px-4 py-3">
        <div className="grid grid-cols-3 gap-4">
          <CompactScore label="연봉 매력도" value={job.salary_score} />
          <CompactScore label="워라밸" value={job.work_life_balance_score} tone="success" />
          <CompactScore label="기업 가치" value={job.company_value_score} tone="brand" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.required_skills.slice(0, 5).map((skill) => (
          <span key={skill} className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            {skill}
          </span>
        ))}
        {job.required_skills.length > 5 && (
          <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
            +{job.required_skills.length - 5}
          </span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          비자 조건: <span className="font-medium text-night">{job.visa_requirement || "미기재"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-night transition hover:border-night"
            >
              원문 보기
            </a>
          )}
          <Button type="button" onClick={onCreateRoadmap} disabled={creating || job.deadline_status === "CLOSED"}>
            {creating ? "생성 중" : "로드맵 생성"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function CompactScore({
  label,
  value,
  tone = "brand"
}: {
  label: string;
  value: number | null;
  tone?: "brand" | "success";
}) {
  if (value === null || value === undefined) {
    return (
      <div>
        <p className="text-[10px] font-bold text-slate-400">{label}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">검수 중</p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200" />
      </div>
    );
  }
  return <ScoreBar label={label} value={value} tone={tone} />;
}

function greenhouseSourceUrl(externalRef?: string) {
  if (!externalRef?.startsWith("greenhouse:")) {
    return null;
  }
  const [, boardToken, jobId] = externalRef.split(":");
  if (!boardToken || !jobId) {
    return null;
  }
  return `https://boards.greenhouse.io/${boardToken}/jobs/${jobId}`;
}

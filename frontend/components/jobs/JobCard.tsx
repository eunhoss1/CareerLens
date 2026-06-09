import { Badge, Card, ScoreBar } from "@/components/ui";
import { workTypeLabel } from "@/lib/display-labels";
import type { JobPosting } from "@/lib/jobs";
import { countryLabel, daysText, deadlineText, deadlineTone, formatDate } from "./job-format";

export function JobCard({
  job,
  selected,
  onSelect
}: {
  job: JobPosting;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button type="button" className="block w-full text-left" onClick={onSelect}>
      <Card
        className={`flex min-h-[238px] flex-col rounded-xl p-4 transition hover:border-brand/40 hover:shadow-panel ${
          selected ? "border-brand bg-[#f2faf8] shadow-panel ring-2 ring-brand/10" : "border-slate-200"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-night text-base font-black text-white">
            {companyInitial(job.company_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-600">{job.company_name}</p>
                <h2 className="mt-1 line-clamp-2 text-base font-extrabold leading-6 text-night">{job.job_title}</h2>
              </div>
              <span className="shrink-0 text-lg leading-none text-slate-400">{selected ? "●" : "○"}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="muted">{job.job_family}</Badge>
          <Badge tone={deadlineTone(job.deadline_status)}>{deadlineText(job)}</Badge>
          <Badge tone="brand">{workTypeLabel(job.work_type)}</Badge>
        </div>

        <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
          <p className="truncate">{countryLabel(job.country)}</p>
          <p className="truncate">최소 {job.min_experience_years ?? 0}년 · {job.salary_range || "연봉 미기재"}</p>
        </div>

        <div className="mt-4 rounded-lg bg-white/75 px-3 py-3">
          <div className="grid grid-cols-3 gap-3">
            <CompactScore label="연봉" value={job.salary_score} />
            <CompactScore label="워라밸" value={job.work_life_balance_score} tone="success" />
            <CompactScore label="기업" value={job.company_value_score} tone="brand" />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4">
          <p className="text-xs font-bold text-slate-500">{daysText(job)}</p>
          <p className="text-xs font-bold text-night">{formatDate(job.application_deadline)}</p>
        </div>
      </Card>
    </button>
  );
}

function companyInitial(companyName: string) {
  return companyName.trim().slice(0, 1).toUpperCase() || "C";
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
        <p className="mt-1 text-xs font-bold text-slate-500">검수</p>
        <div className="mt-2 h-1.5 rounded-full bg-slate-200" />
      </div>
    );
  }
  return <ScoreBar label={label} value={value} tone={tone} />;
}

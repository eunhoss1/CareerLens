import type { JobPosting } from "@/lib/jobs";

export function JobStats({ jobs, filteredCount }: { jobs: JobPosting[]; filteredCount: number }) {
  return (
    <div className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="전체 공고" value={`${jobs.length}개`} />
      <Stat label="현재 표시" value={`${filteredCount}개`} />
      <Stat label="마감 임박" value={`${jobs.filter((job) => job.deadline_status === "URGENT").length}개`} />
      <Stat label="로드맵 생성" value="공고별 가능" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-night">{value}</p>
    </div>
  );
}

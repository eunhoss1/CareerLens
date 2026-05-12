import type { JobPosting } from "@/lib/jobs";

export function JobStats({ jobs, filteredCount }: { jobs: JobPosting[]; filteredCount: number }) {
  return (
    <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="전체 공고" value={`${jobs.length}개`} />
      <Stat label="현재 표시" value={`${filteredCount}개`} />
      <Stat label="마감 임박" value={`${jobs.filter((job) => job.deadline_status === "URGENT").length}개`} />
      <Stat label="로드맵 생성" value="공고별 가능" />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-night">{value}</p>
    </div>
  );
}

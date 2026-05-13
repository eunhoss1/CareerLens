import { MetricCard } from "@/components/ui";

export function SettlementMetrics({
  doneCount,
  inProgressCount,
  totalCount
}: {
  doneCount: number;
  inProgressCount: number;
  totalCount: number;
}) {
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-3">
      <MetricCard label="전체 체크 항목" value={totalCount} helper="미국/일본 기본 세트" />
      <MetricCard label="진행 중" value={inProgressCount} helper="확인 또는 준비 중" />
      <MetricCard label="완료" value={doneCount} helper="사용자별 상태 저장" />
    </div>
  );
}

import type { DeadlineStatus, JobPosting } from "@/lib/jobs";

export const deadlineLabel: Record<DeadlineStatus, string> = {
  ROLLING: "상시",
  CLOSED: "마감",
  URGENT: "마감 임박",
  CLOSING_SOON: "마감 예정",
  OPEN: "접수 중"
};

export function countryLabel(country: string) {
  const labels: Record<string, string> = {
    "United States": "미국",
    "USA": "미국",
    "US": "미국",
    "Japan": "일본",
    "Canada": "캐나다",
    "Ireland": "아일랜드",
    "United Kingdom": "영국",
    "UK": "영국",
    "Germany": "독일",
    "France": "프랑스",
    "Spain": "스페인",
    "Italy": "이탈리아",
    "Singapore": "싱가포르",
    "India": "인도",
    "Brazil": "브라질",
    "Argentina": "아르헨티나",
    "China": "중국",
    "South Korea": "한국",
    "Korea": "한국"
  };
  return labels[country] ?? country;
}

export function deadlineTone(status: DeadlineStatus) {
  if (status === "URGENT" || status === "CLOSING_SOON") return "warning";
  if (status === "CLOSED") return "risk";
  if (status === "OPEN") return "success";
  return "muted";
}

export function deadlineText(job: JobPosting) {
  return deadlineLabel[job.deadline_status] ?? "상태 미정";
}

export function formatDate(value: string | null) {
  if (!value) return "미기재";
  return value.replaceAll("-", ".");
}

export function daysText(job: JobPosting) {
  if (job.days_until_deadline === null) return "공개 API 미제공";
  if (job.days_until_deadline < 0) return "마감된 공고";
  if (job.days_until_deadline === 0) return "오늘 마감";
  return `D-${job.days_until_deadline}`;
}

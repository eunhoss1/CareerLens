"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, PageHeader, PageShell, ScoreBar, SelectInput, TextInput } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { fetchJobs, type DeadlineStatus, type JobPosting } from "@/lib/jobs";
import { createPlannerRoadmap } from "@/lib/planner";
import { diagnoseStoredProfileForJob } from "@/lib/recommendation";

type FilterState = {
  country: string;
  jobFamily: string;
  query: string;
};

const deadlineLabel: Record<DeadlineStatus, string> = {
  ROLLING: "상시",
  CLOSED: "마감",
  URGENT: "마감 임박",
  CLOSING_SOON: "마감 예정",
  OPEN: "접수 중"
};

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filters, setFilters] = useState<FilterState>({ country: "ALL", jobFamily: "ALL", query: "" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingJobId, setCreatingJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(() => uniqueValues(jobs.map((job) => job.country)), [jobs]);
  const jobFamilies = useMemo(() => uniqueValues(jobs.map((job) => job.job_family)), [jobs]);

  const filteredJobs = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesCountry = filters.country === "ALL" || job.country === filters.country;
      const matchesFamily = filters.jobFamily === "ALL" || job.job_family === filters.jobFamily;
      const matchesQuery =
        !query ||
        `${job.company_name} ${job.job_title} ${job.required_skills.join(" ")}`.toLowerCase().includes(query);
      return matchesCountry && matchesFamily && matchesQuery;
    });
  }, [filters, jobs]);

  async function handleCreateRoadmap(job: JobPosting) {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setCreatingJobId(job.job_id);
    setErrorMessage("");
    try {
      const diagnosis = await diagnoseStoredProfileForJob(user.user_id, job.job_id);
      const recommendation = diagnosis.recommendations[0];
      if (!recommendation?.diagnosis_id) {
        throw new Error("선택한 공고에 대한 진단 결과를 만들지 못했습니다.");
      }
      const roadmap = await createPlannerRoadmap(recommendation.diagnosis_id);
      router.push(`/planner/${roadmap.roadmap_id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로드맵 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingJobId(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        kicker="JOB POSTINGS"
        title="전체 공고 조회"
        description="수동 조사 또는 seed-data로 정리한 공고를 한곳에서 확인하고, 관심 공고를 바로 내 프로필 기준 로드맵으로 전환합니다."
        actions={
          <>
            <Link href="/jobs/recommendation" className="border border-line bg-white px-4 py-2 text-sm font-semibold text-night hover:border-night">
              맞춤추천 진단
            </Link>
            <Link href="/onboarding/profile" className="bg-night px-4 py-2 text-sm font-semibold text-white hover:bg-[#24343a]">
              프로필 보강
            </Link>
          </>
        }
      />

      <div className="lens-container py-8">
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr]">
            <SelectInput
              label="국가"
              value={filters.country}
              onChange={(event) => setFilters((current) => ({ ...current, country: event.target.value }))}
            >
              <option value="ALL">전체 국가</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {countryLabel(country)}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              label="직무군"
              value={filters.jobFamily}
              onChange={(event) => setFilters((current) => ({ ...current, jobFamily: event.target.value }))}
            >
              <option value="ALL">전체 직무군</option>
              {jobFamilies.map((family) => (
                <option key={family} value={family}>
                  {family}
                </option>
              ))}
            </SelectInput>
            <TextInput
              label="공고 검색"
              placeholder="회사명, 직무명, 기술스택 검색"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>
          <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="전체 공고" value={`${jobs.length}개`} />
            <Stat label="현재 표시" value={`${filteredJobs.length}개`} />
            <Stat label="마감 임박" value={`${jobs.filter((job) => job.deadline_status === "URGENT").length}개`} />
            <Stat label="로드맵 생성" value="공고별 가능" />
          </div>
        </Card>

        {errorMessage && (
          <div role="alert" className="mt-5 border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <Card className="mt-6 p-8 text-center text-sm text-slate-600">공고 데이터를 불러오는 중입니다.</Card>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="조건에 맞는 공고가 없습니다" description="국가, 직무군, 검색어를 조정하거나 맞춤추천 진단에서 프로필 조건을 다시 확인하세요." />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                creating={creatingJobId === job.job_id}
                onCreateRoadmap={() => handleCreateRoadmap(job)}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function JobCard({ job, creating, onCreateRoadmap }: { job: JobPosting; creating: boolean; onCreateRoadmap: () => void }) {
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
          <ScoreBar label="연봉 매력도" value={job.salary_score ?? 60} />
          <ScoreBar label="워라밸" value={job.work_life_balance_score ?? 60} tone="success" />
          <ScoreBar label="기업 가치" value={job.company_value_score ?? 70} tone="warning" />
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-night">{value}</p>
    </div>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function countryLabel(country: string) {
  if (country === "United States") return "미국";
  if (country === "Japan") return "일본";
  return country;
}

function deadlineTone(status: DeadlineStatus) {
  if (status === "URGENT" || status === "CLOSING_SOON") return "warning";
  if (status === "CLOSED") return "risk";
  if (status === "OPEN") return "success";
  return "muted";
}

function deadlineText(job: JobPosting) {
  return deadlineLabel[job.deadline_status] ?? "상태 미정";
}

function formatDate(value: string | null) {
  if (!value) return "상시";
  return value.replaceAll("-", ".");
}

function daysText(job: JobPosting) {
  if (job.days_until_deadline === null) return "상시 채용";
  if (job.days_until_deadline < 0) return "마감된 공고";
  if (job.days_until_deadline === 0) return "오늘 마감";
  return `D-${job.days_until_deadline}`;
}

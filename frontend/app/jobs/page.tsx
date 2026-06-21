"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import {
  JobFilterBar,
  type JobFilterState,
} from "@/components/jobs/JobFilterBar";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, EmptyState, LinkButton } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { fetchJobs, type JobPosting } from "@/lib/jobs";
import { isMembershipLimitMessage } from "@/lib/membership";
import { createPlannerRoadmap } from "@/lib/planner";
import { diagnoseStoredProfileForJob } from "@/lib/recommendation";

const JOBS_PER_PAGE = 8;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filters, setFilters] = useState<JobFilterState>({
    country: "ALL",
    workType: "ALL",
    experienceLevel: "ALL",
    jobFamily: "ALL",
    deadlineStatus: "ALL",
    query: "",
  });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingJobId, setCreatingJobId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filters.country,
    filters.workType,
    filters.experienceLevel,
    filters.jobFamily,
    filters.deadlineStatus,
    filters.query,
  ]);

  const countries = useMemo(
    () => uniqueValues(jobs.map((job) => job.country)),
    [jobs]
  );
  const workTypes = useMemo(
    () => uniqueValues(jobs.map((job) => job.work_type)),
    [jobs]
  );
  const jobFamilies = useMemo(
    () => uniqueValues(jobs.map((job) => job.job_family)),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const query = filters.query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesCountry =
        filters.country === "ALL" || job.country === filters.country;
      const matchesWorkType =
        filters.workType === "ALL" || job.work_type === filters.workType;
      const matchesExperience = matchesExperienceLevel(
        job.min_experience_years,
        filters.experienceLevel
      );
      const matchesFamily =
        filters.jobFamily === "ALL" || job.job_family === filters.jobFamily;
      const matchesDeadline =
        filters.deadlineStatus === "ALL" ||
        job.deadline_status === filters.deadlineStatus;
      const matchesQuery =
        !query ||
        `${job.company_name} ${job.job_title} ${job.required_skills.join(
          " "
        )} ${job.preferred_skills.join(" ")}`
          .toLowerCase()
          .includes(query);
      return (
        matchesCountry &&
        matchesWorkType &&
        matchesExperience &&
        matchesFamily &&
        matchesDeadline &&
        matchesQuery
      );
    });
  }, [filters, jobs]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * JOBS_PER_PAGE;
  const visibleJobs = filteredJobs.slice(
    pageStartIndex,
    pageStartIndex + JOBS_PER_PAGE
  );
  const selectedJob = selectedJobId
    ? filteredJobs.find((job) => job.job_id === selectedJobId) ?? null
    : null;

  useEffect(() => {
    if (loading) return;
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (
      !selectedJobId ||
      !visibleJobs.some((job) => job.job_id === selectedJobId)
    ) {
      setSelectedJobId(visibleJobs[0].job_id);
    }
  }, [loading, selectedJobId, visibleJobs]);

  function resetFilters() {
    setFilters({
      country: "ALL",
      workType: "ALL",
      experienceLevel: "ALL",
      jobFamily: "ALL",
      deadlineStatus: "ALL",
      query: "",
    });
  }

  async function handleCreateRoadmap(job: JobPosting) {
    const user = getStoredUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setCreatingJobId(job.job_id);
    setErrorMessage("");
    try {
      const diagnosis = await diagnoseStoredProfileForJob(
        user.user_id,
        job.job_id
      );
      const recommendation = diagnosis.recommendations[0];
      if (!recommendation?.diagnosis_id)
        throw new Error("진단 결과를 만들지 못했습니다.");
      const roadmap = await createPlannerRoadmap(recommendation.diagnosis_id);
      router.push(`/planner/${roadmap.roadmap_id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "오류가 발생했습니다."
      );
    } finally {
      setCreatingJobId(null);
    }
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-50/50 text-slate-900">
      <SiteHeader />

      {/* 개선된 보더리스 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Job Postings
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              전체 공고 조회
            </h1>
          </div>
          <div className="flex gap-2">
            <LinkButton
              href="/jobs/recommendation"
              variant="secondary"
              className="rounded-xl border-slate-200"
            >
              맞춤추천 진단
            </LinkButton>
            <LinkButton href="/onboarding/profile" className="rounded-xl">
              프로필 보강
            </LinkButton>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-6 py-8 2xl:px-8">
        <div className="shrink-0">
          <JobFilterBar
            filters={filters}
            countries={countries}
            workTypes={workTypes}
            jobFamilies={jobFamilies}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 shrink-0 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-6 text-center text-sm text-slate-500">
            공고 데이터를 불러오는 중입니다...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="조건에 맞는 공고가 없습니다"
              description="필터를 조정하거나 다른 조건을 확인하세요."
            />
          </div>
        ) : (
          <div className="mt-6 grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(460px,0.85fr)_minmax(620px,1.15fr)] xl:items-stretch xl:overflow-hidden">
            <section className="flex min-h-0 min-w-0 flex-col">
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <p className="text-sm font-bold text-slate-900">
                  {filteredJobs.length.toLocaleString()}개 공고
                </p>
              </div>
              <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-2">
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    selected={selectedJobId === job.job_id}
                    onSelect={() => setSelectedJobId(job.job_id)}
                  />
                ))}
              </div>
              <JobsPagination
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                totalCount={filteredJobs.length}
                start={pageStartIndex + 1}
                end={Math.min(
                  pageStartIndex + visibleJobs.length,
                  filteredJobs.length
                )}
                onChange={setCurrentPage}
              />
            </section>

            <aside className="hidden min-h-0 min-w-0 xl:block">
              <JobDetailPanel
                job={selectedJob}
                creating={
                  selectedJob ? creatingJobId === selectedJob.job_id : false
                }
                onCreateRoadmap={() =>
                  selectedJob && handleCreateRoadmap(selectedJob)
                }
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}
function matchesExperienceLevel(years: number | null, level: string) {
  const value = years ?? 0;
  if (level === "JUNIOR") return value <= 2;
  if (level === "MID") return value >= 3 && value <= 5;
  if (level === "SENIOR") return value >= 6;
  return true;
}

function JobsPagination({
  currentPage,
  totalPages,
  totalCount,
  start,
  end,
  onChange,
}: any) {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-600">
        {totalCount}개 중 {start}-{end}개 표시
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="rounded-xl border-slate-200"
          disabled={currentPage <= 1}
          onClick={() => onChange(currentPage - 1)}
        >
          이전
        </Button>
        <Button
          variant="secondary"
          className="rounded-xl border-slate-200"
          disabled={currentPage >= totalPages}
          onClick={() => onChange(currentPage + 1)}
        >
          다음
        </Button>
      </div>
    </div>
  );
}

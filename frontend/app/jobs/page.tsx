"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { JobFilterBar, type JobFilterState } from "@/components/jobs/JobFilterBar";
import { JobStats } from "@/components/jobs/JobStats";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, EmptyState, LinkButton, PageHeader, PageShell } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { fetchJobs, type JobPosting } from "@/lib/jobs";
import { createPlannerRoadmap } from "@/lib/planner";
import { diagnoseStoredProfileForJob } from "@/lib/recommendation";

const JOBS_PER_PAGE = 6;

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filters, setFilters] = useState<JobFilterState>({ country: "ALL", jobFamily: "ALL", query: "" });
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [creatingJobId, setCreatingJobId] = useState<number | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchJobs()
      .then(setJobs)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedJob(null);
  }, [filters.country, filters.jobFamily, filters.query]);

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

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * JOBS_PER_PAGE;
  const visibleJobs = filteredJobs.slice(pageStartIndex, pageStartIndex + JOBS_PER_PAGE);

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
      <SiteHeader />
      <PageHeader
        kicker="JOB POSTINGS"
        title="전체 공고 조회"
        description="공고를 6개씩 확인하고, 상세 근거를 검토한 뒤 내 프로필 기준 로드맵으로 전환합니다."
        actions={
          <>
            <LinkButton href="/jobs/recommendation" variant="secondary">맞춤추천 진단</LinkButton>
            <LinkButton href="/onboarding/profile">프로필 보강</LinkButton>
          </>
        }
      />

      <div className="lens-container py-8">
        <Card className="p-5">
          <JobFilterBar filters={filters} countries={countries} jobFamilies={jobFamilies} onChange={setFilters} />
          <JobStats jobs={jobs} filteredCount={filteredJobs.length} />
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
          <>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {visibleJobs.map((job) => (
                <JobCard
                  key={job.job_id}
                  job={job}
                  selected={selectedJob?.job_id === job.job_id}
                  creating={creatingJobId === job.job_id}
                  onOpenDetail={() => setSelectedJob(job)}
                  onCreateRoadmap={() => handleCreateRoadmap(job)}
                />
              ))}
            </div>

            <JobsPagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalCount={filteredJobs.length}
              start={pageStartIndex + 1}
              end={Math.min(pageStartIndex + visibleJobs.length, filteredJobs.length)}
              onChange={setCurrentPage}
            />

            {selectedJob && (
              <JobDetailPanel
                job={selectedJob}
                creating={creatingJobId === selectedJob.job_id}
                onClose={() => setSelectedJob(null)}
                onCreateRoadmap={() => handleCreateRoadmap(selectedJob)}
              />
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function JobsPagination({
  currentPage,
  totalPages,
  totalCount,
  start,
  end,
  onChange
}: {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  start: number;
  end: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 border border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-slate-600">
        {totalCount}개 중 <span className="text-night">{start}-{end}</span>개 표시
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={currentPage <= 1} onClick={() => onChange(currentPage - 1)}>
          이전
        </Button>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <Button
            key={page}
            type="button"
            variant={page === currentPage ? "primary" : "secondary"}
            className="min-w-10 px-3"
            onClick={() => onChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button type="button" variant="secondary" disabled={currentPage >= totalPages} onClick={() => onChange(currentPage + 1)}>
          다음
        </Button>
      </div>
    </div>
  );
}

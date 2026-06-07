"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobDetailPanel } from "@/components/jobs/JobDetailPanel";
import { JobFilterBar, type JobFilterState } from "@/components/jobs/JobFilterBar";
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
  const [filters, setFilters] = useState<JobFilterState>({ country: "ALL", jobFamily: "ALL", query: "" });
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
  const selectedJob = selectedJobId ? filteredJobs.find((job) => job.job_id === selectedJobId) ?? null : null;

  useEffect(() => {
    if (loading) return;
    if (visibleJobs.length === 0) {
      setSelectedJobId(null);
      return;
    }
    if (!selectedJobId || !visibleJobs.some((job) => job.job_id === selectedJobId)) {
      setSelectedJobId(visibleJobs[0].job_id);
    }
  }, [loading, selectedJobId, visibleJobs]);

  function resetFilters() {
    setFilters({ country: "ALL", jobFamily: "ALL", query: "" });
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
    <main className="flex h-screen flex-col overflow-hidden bg-[#f3f6f1] text-ink">
      <SiteHeader />
      <section className="shrink-0 border-b border-line bg-paper">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-5 py-3 lg:flex-row lg:items-center lg:justify-between 2xl:px-8">
          <div className="flex items-center gap-3">
            <span className="lens-kicker">JOB POSTINGS</span>
            <h1 className="text-2xl font-black leading-tight text-night">전체 공고 조회</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/jobs/recommendation" variant="secondary">맞춤추천 진단</LinkButton>
            <LinkButton href="/onboarding/profile">프로필 보강</LinkButton>
          </div>
        </div>
      </section>

      <div className="mx-auto flex min-h-0 w-full max-w-[1800px] flex-1 flex-col px-5 py-4 2xl:px-8">
        <div className="shrink-0">
          <JobFilterBar
            filters={filters}
            countries={countries}
            jobFamilies={jobFamilies}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </div>

        {errorMessage && (
          <div role="alert" className="mt-3 shrink-0 rounded-2xl border border-coral/30 bg-red-50 px-4 py-3 text-sm font-medium text-coral">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{errorMessage}</span>
              {isMembershipLimitMessage(errorMessage) && <LinkButton href="/membership">Pro 멤버십 보기</LinkButton>}
            </div>
          </div>
        )}

        {loading ? (
          <Card className="mt-4 p-8 text-center text-sm text-slate-600">공고 데이터를 불러오는 중입니다.</Card>
        ) : filteredJobs.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="조건에 맞는 공고가 없습니다" description="국가, 직무군, 검색어를 조정하거나 맞춤추천 진단에서 프로필 조건을 다시 확인하세요." />
          </div>
        ) : (
          <>
            <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(460px,0.85fr)_minmax(620px,1.15fr)] xl:items-stretch xl:overflow-hidden">
              <section className="flex min-h-0 min-w-0 flex-col">
                <div className="mb-3 flex shrink-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-black text-night">
                    {filteredJobs.length.toLocaleString()}개 공고 중 {pageStartIndex + 1}-{Math.min(pageStartIndex + visibleJobs.length, filteredJobs.length)}개
                  </p>
                  <p className="hidden text-xs font-bold text-slate-500 xl:block">카드를 선택하면 오른쪽에서 상세 정보를 확인할 수 있습니다.</p>
                  <p className="text-xs font-bold text-slate-500 xl:hidden">공고를 누르면 넓은 화면에서 상세 정보가 함께 표시됩니다.</p>
                </div>
                <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 xl:pr-2">
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
                  end={Math.min(pageStartIndex + visibleJobs.length, filteredJobs.length)}
                  onChange={setCurrentPage}
                />
              </section>

              <aside className="hidden min-h-0 min-w-0 xl:block">
                <JobDetailPanel
                  job={selectedJob}
                  creating={selectedJob ? creatingJobId === selectedJob.job_id : false}
                  onCreateRoadmap={() => {
                    if (selectedJob) {
                      handleCreateRoadmap(selectedJob);
                    }
                  }}
                />
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
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
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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

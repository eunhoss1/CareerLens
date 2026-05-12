"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilterBar, type JobFilterState } from "@/components/jobs/JobFilterBar";
import { JobStats } from "@/components/jobs/JobStats";
import { Card, EmptyState, PageHeader, PageShell } from "@/components/ui";
import { getStoredUser } from "@/lib/auth";
import { fetchJobs, type JobPosting } from "@/lib/jobs";
import { createPlannerRoadmap } from "@/lib/planner";
import { diagnoseStoredProfileForJob } from "@/lib/recommendation";

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filters, setFilters] = useState<JobFilterState>({ country: "ALL", jobFamily: "ALL", query: "" });
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

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  demoProfile,
  diagnoseStoredProfile,
  diagnoseRecommendations,
  fetchUserProfile,
  type JobRecommendation,
  type RecommendationResponse,
  type UserProfileRequest
} from "@/lib/recommendation";
import { getStoredUser, type AuthUser } from "@/lib/auth";

const countries = ["United States", "Japan"];
const jobFamilies = ["Backend", "Frontend"];
const languageLevels = ["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"];

export default function RecommendationPage() {
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRecommendation = useMemo(() => {
    if (!result?.recommendations.length) {
      return null;
    }
    return result.recommendations.find((item) => item.job_id === selectedJobId) ?? result.recommendations[0];
  }, [result, selectedJobId]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      return;
    }
    setUser(storedUser);
    fetchUserProfile(storedUser.user_id)
      .then((storedProfile) => {
        setProfile({
          ...demoProfile,
          ...storedProfile,
          display_name: storedProfile.display_name,
          email: storedProfile.email
        });
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  async function runDiagnosis() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = user ? await diagnoseStoredProfile(user.user_id) : await diagnoseRecommendations(profile);
      setResult(response);
      setSelectedJobId(response.recommendations[0]?.job_id ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "추천 진단 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4f8]">
      <section className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-brand">CareerLens Recommendation Engine</p>
              <Link href="/" className="rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                홈으로
              </Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">맞춤채용정보서비스</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              seed 공고와 직원 표본에서 만든 직무 패턴을 기준으로 사용자 프로필을 진단하고, 다음 플래너 단계로 넘길 추천 결과를 생성합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={runDiagnosis}
            disabled={isLoading}
            className="h-11 rounded-md bg-brand px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "진단 실행 중" : "추천 진단 실행"}
          </button>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <ProfileCard profile={profile} />
          <ProfileControls profile={profile} setProfile={setProfile} />
        </aside>

        <div className="space-y-5">
          <SummaryBanner result={result} isLoading={isLoading} errorMessage={errorMessage} />

          {isLoading && <LoadingState />}

          {!isLoading && !result && !errorMessage && <EmptyState />}

          {!isLoading && result && result.recommendations.length === 0 && (
            <div className="rounded-lg border border-line bg-white p-8 text-center shadow-sm">
              <p className="text-base font-semibold text-ink">현재 프로필로 통과한 후보 공고가 없습니다.</p>
              <p className="mt-2 text-sm text-slate-600">국가, 직무군, 언어 수준, 경력 조건을 조정한 뒤 다시 진단해보세요.</p>
            </div>
          )}

          {result && result.recommendations.length > 0 && (
            <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {result.recommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.job_id}
                    recommendation={recommendation}
                    isSelected={selectedRecommendation?.job_id === recommendation.job_id}
                    onSelect={() => setSelectedJobId(recommendation.job_id)}
                  />
                ))}
              </div>

              <ComparisonPanel recommendation={selectedRecommendation} />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProfileCard({ profile }: { profile: UserProfileRequest }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">사용자 프로필</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{profile.display_name}</h2>
          <p className="mt-1 text-sm text-slate-600">{profile.email}</p>
        </div>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Demo
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <Metric label="희망 국가" value={profile.target_country} />
        <Metric label="희망 직무" value={profile.target_job_family} />
        <Metric label="경력" value={`${profile.experience_years}년`} />
        <Metric label="언어" value={profile.language_level} />
        <Metric label="GitHub" value={profile.github_present ? "있음" : "없음"} />
        <Metric label="포트폴리오" value={profile.portfolio_present ? "있음" : "없음"} />
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-500">기술스택</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {profile.tech_stack.map((skill) => (
            <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfileControls({
  profile,
  setProfile
}: {
  profile: UserProfileRequest;
  setProfile: (profile: UserProfileRequest) => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-ink">진단 조건</h2>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          희망 국가
          <select
            value={profile.target_country}
            onChange={(event) => setProfile({ ...profile, target_country: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            {countries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          희망 직무
          <select
            value={profile.target_job_family}
            onChange={(event) => setProfile({ ...profile, target_job_family: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            {jobFamilies.map((family) => (
              <option key={family}>{family}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          언어 수준
          <select
            value={profile.language_level}
            onChange={(event) => setProfile({ ...profile, language_level: event.target.value })}
            className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          >
            {languageLevels.map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          경력 연차
          <input
            type="number"
            min={0}
            max={15}
            value={profile.experience_years}
            onChange={(event) => setProfile({ ...profile, experience_years: Number(event.target.value) })}
            className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Toggle
            label="GitHub"
            checked={profile.github_present}
            onChange={(checked) => setProfile({ ...profile, github_present: checked })}
          />
          <Toggle
            label="Portfolio"
            checked={profile.portfolio_present}
            onChange={(checked) => setProfile({ ...profile, portfolio_present: checked })}
          />
        </div>
      </div>
    </section>
  );
}

function SummaryBanner({
  result,
  isLoading,
  errorMessage
}: {
  result: RecommendationResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
}) {
  const readiness = result?.overall_readiness_label ?? "진단 대기";
  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">추천 결과 요약</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{readiness}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {result?.criteria_summary ??
              "국가와 직무군으로 공고를 먼저 거르고, 각 공고에 연결된 직무 패턴과 사용자 프로필을 비교합니다."}
          </p>
          {errorMessage && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <SummaryMetric label="후보 수" value={isLoading ? "-" : String(result?.total_candidate_count ?? 0)} />
          <SummaryMetric label="추천 수" value={isLoading ? "-" : String(result?.returned_recommendation_count ?? 0)} />
          <SummaryMetric label="상태" value={result ? badgeText(result.overall_readiness_status) : "대기"} />
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
  isSelected,
  onSelect
}: {
  recommendation: JobRecommendation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm transition ${
        isSelected ? "border-brand ring-2 ring-blue-100" : "border-line"
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-brand">{recommendation.company_name}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {recommendation.country}
            </span>
            <span className={gradeClass(recommendation.recommendation_grade)}>
              등급 {recommendation.recommendation_grade}
            </span>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-ink">{recommendation.job_title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.recommendation_summary}</p>
        </div>
        <div className="min-w-[150px] rounded-md bg-panel px-3 py-2 text-sm">
          <p className="font-semibold text-ink">{recommendation.readiness_label}</p>
          <p className="mt-1 text-xs text-slate-500">{recommendation.salary_range}</p>
        </div>
      </div>

      <div className="mt-4">
        <Progress label="종합 적합도" value={recommendation.score_breakdown.total_score} />
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500">부족 요소</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {recommendation.missing_items.slice(0, 4).map((item) => (
            <span key={item} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
              {item}
            </span>
          ))}
          {recommendation.missing_items.length === 0 && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              큰 부족 요소 없음
            </span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          상세 비교 보기
        </button>
        <button
          type="button"
          className="h-10 rounded-md bg-mint px-4 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          커리어 개발 플래너 생성
        </button>
        <button
          type="button"
          disabled
          className="h-10 cursor-not-allowed rounded-md bg-slate-200 px-4 text-sm font-semibold text-slate-500"
        >
          기업 지원 시작
        </button>
      </div>
    </article>
  );
}

function ComparisonPanel({ recommendation }: { recommendation: JobRecommendation | null }) {
  if (!recommendation) {
    return null;
  }

  return (
    <aside className="h-fit rounded-lg border border-line bg-white p-5 shadow-sm xl:sticky xl:top-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">상세 비교 패널</p>
      <h2 className="mt-2 text-lg font-semibold text-ink">{recommendation.company_name}</h2>
      <p className="mt-1 text-sm text-slate-600">{recommendation.job_title}</p>

      <div className="mt-5 space-y-4">
        <Progress label="기술 적합도" value={recommendation.score_breakdown.skill_score} />
        <Progress label="경력 적합도" value={recommendation.score_breakdown.experience_score} />
        <Progress label="언어 적합도" value={recommendation.score_breakdown.language_score} />
        <Progress label="학력/자격 적합도" value={recommendation.score_breakdown.education_score} />
        <Progress label="포트폴리오 적합도" value={recommendation.score_breakdown.portfolio_score} />
      </div>

      <div className="mt-5 rounded-md bg-panel p-4">
        <p className="text-sm font-semibold text-ink">다음 액션</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.next_action_summary}</p>
      </div>
    </aside>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-52 animate-pulse rounded-lg border border-line bg-white p-5 shadow-sm">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-4 h-6 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-3 w-full rounded bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-base font-semibold text-ink">아직 생성된 추천 결과가 없습니다.</p>
      <p className="mt-2 text-sm text-slate-600">왼쪽 프로필 조건을 확인한 뒤 추천 진단을 실행하세요.</p>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-ink">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-panel p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[92px] rounded-md bg-panel px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-ink">{value}</p>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex h-10 items-center justify-between rounded-md border px-3 text-sm font-semibold ${
        checked ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line bg-white text-slate-600"
      }`}
    >
      <span>{label}</span>
      <span>{checked ? "ON" : "OFF"}</span>
    </button>
  );
}

function badgeText(status: string) {
  if (status === "IMMEDIATE_APPLY") {
    return "높음";
  }
  if (status === "PREPARE_THEN_APPLY") {
    return "중간";
  }
  return "낮음";
}

function gradeClass(grade: string) {
  if (grade === "A") {
    return "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700";
  }
  if (grade === "B") {
    return "rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700";
  }
  if (grade === "C") {
    return "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800";
  }
  return "rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700";
}

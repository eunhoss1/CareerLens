"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar, SelectInput } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
import { jobFamilies } from "@/lib/job-families";
import {
  demoProfile,
  diagnoseRecommendations,
  diagnoseStoredProfile,
  fetchUserProfile,
  type JobRecommendation,
  type RecommendationResponse,
  type UserProfileRequest
} from "@/lib/recommendation";
import { createPlannerRoadmap } from "@/lib/planner";

const countries = ["United States", "Japan"];
const languageLevels = ["BASIC", "CONVERSATIONAL", "BUSINESS", "FLUENT", "NATIVE"];

export default function RecommendationPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingPlannerId, setCreatingPlannerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedRecommendation = useMemo(() => {
    if (!result?.recommendations.length) return null;
    return result.recommendations.find((item) => item.job_id === selectedJobId) ?? result.recommendations[0];
  }, [result, selectedJobId]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) return;
    setUser(storedUser);
    fetchUserProfile(storedUser.user_id)
      .then((storedProfile) => {
        setProfile({
          ...demoProfile,
          ...storedProfile,
          display_name: storedProfile.display_name,
          email: storedUser.email
        });
      })
      .catch(() => undefined);
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

  async function createPlanner(diagnosisId: number) {
    setCreatingPlannerId(diagnosisId);
    setErrorMessage(null);
    try {
      const roadmap = await createPlannerRoadmap(diagnosisId);
      router.push(`/planner/${roadmap.roadmap_id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "커리어 개발 플래너 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingPlannerId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="CAREERLENS MATCH"
        title="맞춤채용정보 추천 진단"
        description="수동 조사 공고, 익명화 직원 표본, 저장된 PatternProfile을 기준으로 사용자의 해외취업 프로필을 비교합니다. 공고마다 다른 평가 가중치와 사용자 우선순위를 함께 반영해 상위 5개 공고를 추천합니다."
        actions={
          <>
            <LinkButton href="/mypage" variant="secondary">마이페이지</LinkButton>
            <Button type="button" onClick={runDiagnosis} disabled={isLoading}>{isLoading ? "진단 실행 중" : "추천 진단 실행"}</Button>
          </>
        }
      />

      <section className="lens-container grid gap-5 py-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-5">
          <ProfileCard profile={profile} user={user} />
          <ProfileControls profile={profile} setProfile={setProfile} disabled={Boolean(user)} />
        </aside>

        <div className="space-y-5">
          <SummaryBanner result={result} isLoading={isLoading} errorMessage={errorMessage} />

          {isLoading && <LoadingState />}
          {!isLoading && !result && (
            <EmptyState
              title="아직 생성된 추천 결과가 없습니다."
              description="왼쪽 프로필 조건을 확인하고 추천 진단을 실행하세요. 로그인 사용자는 마이페이지에 저장된 프로필을 기준으로 진단합니다."
              action={<Button type="button" onClick={runDiagnosis}>추천 진단 실행</Button>}
            />
          )}
          {!isLoading && result && (
            <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
              <div className="space-y-4">
                {result.recommendations.map((recommendation, index) => (
                  <RecommendationCard
                    key={`${recommendation.diagnosis_id}-${recommendation.job_id}`}
                    recommendation={recommendation}
                    rank={index + 1}
                    selected={selectedRecommendation?.job_id === recommendation.job_id}
                    onSelect={() => setSelectedJobId(recommendation.job_id)}
                    onCreatePlanner={() => createPlanner(recommendation.diagnosis_id)}
                    isCreatingPlanner={creatingPlannerId === recommendation.diagnosis_id}
                  />
                ))}
                {result.recommendations.length === 0 && <NoCandidateState />}
              </div>
              <ComparisonPanel recommendation={selectedRecommendation} />
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}

function ProfileCard({ profile, user }: { profile: UserProfileRequest; user: AuthUser | null }) {
  const priorities = priorityLabels(profile);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand">USER PROFILE</p>
          <h2 className="mt-3 text-xl font-semibold text-night">{profile.display_name}</h2>
          <p className="mt-1 text-sm text-slate-600">{user ? "DB 저장 프로필 기준" : "데모 입력 기준"}</p>
        </div>
        <Badge tone="brand">{profile.target_country}</Badge>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="희망 직무군" value={profile.target_job_family} />
        <MetricCard label="총 경력" value={`${profile.experience_years ?? 0}년`} />
        <MetricCard label="관련 경력" value={`${profile.related_experience_years ?? 0}년`} />
        <MetricCard label="언어 수준" value={profile.language_level} />
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-500">선택 우선순위</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {priorities.map((priority) => <Badge key={priority} tone="success">{priority}</Badge>)}
          {priorities.length === 0 && <Badge tone="muted">우선순위 없음</Badge>}
        </div>
      </div>
    </Card>
  );
}

function ProfileControls({ profile, setProfile, disabled }: { profile: UserProfileRequest; setProfile: (profile: UserProfileRequest) => void; disabled: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-night">빠른 진단 조건</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">로그인 사용자는 마이페이지 저장 프로필을 우선 사용합니다.</p>
        </div>
        {disabled && <Badge tone="muted">DB 기준</Badge>}
      </div>
      <div className="mt-4 space-y-3">
        <Select label="희망 국가" value={profile.target_country} options={countries} disabled={disabled} onChange={(value) => setProfile({ ...profile, target_country: value })} />
        <Select label="희망 직무군" value={profile.target_job_family} options={jobFamilies} disabled={disabled} onChange={(value) => setProfile({ ...profile, target_job_family: value })} />
        <Select label="언어 수준" value={profile.language_level} options={languageLevels} disabled={disabled} onChange={(value) => setProfile({ ...profile, language_level: value })} />
        <NumberInput label="경력 연차" value={profile.experience_years ?? 0} disabled={disabled} onChange={(value) => setProfile({ ...profile, experience_years: value })} />
      </div>
    </Card>
  );
}

function SummaryBanner({ result, isLoading, errorMessage }: { result: RecommendationResponse | null; isLoading: boolean; errorMessage: string | null }) {
  if (errorMessage) {
    return <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{errorMessage}</div>;
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand">DIAGNOSIS SUMMARY</p>
          <h2 className="mt-2 text-xl font-semibold text-night">
            {result ? `상위 ${result.returned_recommendation_count}개 공고 추천` : isLoading ? "추천 후보 분석 중" : "추천 진단을 실행하세요"}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {result?.criteria_summary ?? "국가/직무군/언어/경력으로 1차 필터링한 뒤 공고별 가중치, PatternProfile, 사용자 우선순위를 반영합니다."}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="총 후보" value={String(result?.total_candidate_count ?? 0)} />
          <MetricCard label="추천 공고" value={String(result?.returned_recommendation_count ?? 0)} />
          <MetricCard label="준비도" value={result?.overall_readiness_label ?? "-"} />
        </div>
      </div>
    </Card>
  );
}

function RecommendationCard({
  recommendation,
  rank,
  selected,
  onSelect,
  onCreatePlanner,
  isCreatingPlanner
}: {
  recommendation: JobRecommendation;
  rank: number;
  selected: boolean;
  onSelect: () => void;
  onCreatePlanner: () => void;
  isCreatingPlanner: boolean;
}) {
  return (
    <Card className={`p-5 transition ${selected ? "border-brand shadow-panel" : ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="default">TOP {rank}</Badge>
            <Badge tone={recommendation.recommendation_grade === "A" ? "success" : recommendation.recommendation_grade === "B" ? "brand" : "warning"}>
              등급 {recommendation.recommendation_grade}
            </Badge>
            <Badge tone="success">{recommendation.primary_recommendation_category}</Badge>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-night">{recommendation.company_name}</h3>
          <p className="mt-1 text-sm text-slate-600">{recommendation.country} · {recommendation.job_title}</p>
        </div>
        <div className="border border-line bg-panel px-4 py-3 text-left md:text-right">
          <p className="text-3xl font-semibold text-brand">{recommendation.score_breakdown.total_score}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{recommendation.readiness_label}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-700">{recommendation.recommendation_summary}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-5">
        {categoryMetrics(recommendation).map((metric) => (
          <CategoryScore key={metric.label} {...metric} />
        ))}
      </div>

      <div className="mt-4 border border-line bg-panel px-4 py-3">
        <p className="text-xs font-bold text-brand">공고별 평가기준</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          {recommendation.evaluation_rationale || "수동 정리된 공고 요구사항과 패턴 데이터를 기준으로 가중치를 설정했습니다."}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500">부족 요소</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {recommendation.missing_items.slice(0, 4).map((item) => <Badge key={item} tone="warning">{item}</Badge>)}
          {recommendation.missing_items.length === 0 && <Badge tone="success">큰 부족 요소 없음</Badge>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onSelect}>상세 비교 보기</Button>
        <Button type="button" onClick={onCreatePlanner} disabled={isCreatingPlanner}>
          {isCreatingPlanner ? "플래너 생성 중" : "커리어 개발 플래너 생성"}
        </Button>
        <Button type="button" variant="subtle" disabled>기업 지원 시작</Button>
      </div>
    </Card>
  );
}

function ComparisonPanel({ recommendation }: { recommendation: JobRecommendation | null }) {
  if (!recommendation) return null;

  return (
    <aside className="h-fit border border-line bg-white p-5 shadow-sm xl:sticky xl:top-5">
      <p className="text-xs font-bold tracking-[0.16em] text-brand">ANALYSIS PANEL</p>
      <h2 className="mt-2 text-lg font-semibold text-night">{recommendation.company_name}</h2>
      <p className="mt-1 text-sm text-slate-600">{recommendation.job_title}</p>

      <div className="mt-5 space-y-4">
        <ScoreBar label="기술 적합도" value={recommendation.score_breakdown.skill_score} />
        <ScoreBar label="경력 적합도" value={recommendation.score_breakdown.experience_score} />
        <ScoreBar label="언어 적합도" value={recommendation.score_breakdown.language_score} />
        <ScoreBar label="학력/자격 적합도" value={recommendation.score_breakdown.education_score} />
        <ScoreBar label="포트폴리오 적합도" value={recommendation.score_breakdown.portfolio_score} />
      </div>

      <div className="mt-5 border border-line bg-panel p-4">
        <p className="text-sm font-semibold text-night">최종 점수 가중치</p>
        <div className="mt-3 space-y-3">
          {categoryMetrics(recommendation).map((metric) => (
            <ScoreBar key={metric.label} label={metric.label} value={metric.score} weight={metric.weight} />
          ))}
        </div>
      </div>

      <div className="mt-4 border border-line bg-white p-4">
        <p className="text-sm font-semibold text-night">비교 기준 패턴</p>
        <p className="mt-2 text-sm font-semibold text-brand">{recommendation.pattern_title || recommendation.pattern_ref}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {recommendation.pattern_evidence_summary || "이 패턴은 수동 조사 공고와 익명화 직원 표본에서 추출한 추천 계산 기준입니다."}
        </p>
      </div>

      <div className="mt-4 border border-line bg-panel p-4">
        <p className="text-sm font-semibold text-night">다음 액션</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.next_action_summary}</p>
      </div>
    </aside>
  );
}

function CategoryScore({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div className="border border-line bg-panel p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className="text-[11px] font-semibold text-slate-500">{weight}%</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-night">{score}</p>
      <div className="mt-2 h-1.5 border border-line bg-white">
        <div className="h-full bg-brand" style={{ width: `${clamp(score)}%` }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} className="h-64 animate-pulse p-5">
          <div className="h-4 w-32 bg-slate-200" />
          <div className="mt-4 h-6 w-56 bg-slate-200" />
          <div className="mt-6 h-3 w-full bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 bg-slate-200" />
        </Card>
      ))}
    </div>
  );
}

function NoCandidateState() {
  return (
    <EmptyState
      title="조건에 맞는 공고가 없습니다."
      description="희망 국가, 직무군, 언어 수준, 경력 조건을 확인하세요. AI/ML, Data 공고는 Greenhouse import 또는 별도 seed-data에 PatternProfile이 있어야 추천 결과로 표시됩니다."
    />
  );
}

function Select({ label, value, options, disabled, onChange }: { label: string; value: string; options: string[]; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <SelectInput label={label} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </SelectInput>
  );
}

function NumberInput({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input type="number" min={0} value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 h-10 w-full border border-line bg-white px-3 text-sm disabled:bg-slate-100" />
    </label>
  );
}

function categoryMetrics(recommendation: JobRecommendation) {
  return [
    { label: "합격 가능성", score: recommendation.acceptance_probability_score ?? 0, weight: recommendation.probability_weight ?? 0 },
    { label: "연봉", score: recommendation.salary_score ?? 0, weight: recommendation.salary_weight ?? 0 },
    { label: "워라밸", score: recommendation.work_life_balance_score ?? 0, weight: recommendation.work_life_balance_weight ?? 0 },
    { label: "기업 가치", score: recommendation.company_value_score ?? 0, weight: recommendation.company_value_weight ?? 0 },
    { label: "직무 적합도", score: recommendation.job_fit_score ?? 0, weight: recommendation.job_fit_weight ?? 0 }
  ];
}

function priorityLabels(profile: UserProfileRequest) {
  const labels = [];
  if (profile.prioritize_salary) labels.push("연봉");
  if (profile.prioritize_acceptance_probability) labels.push("합격 가능성");
  if (profile.prioritize_work_life_balance) labels.push("워라밸");
  if (profile.prioritize_company_value) labels.push("기업 가치");
  if (profile.prioritize_job_fit) labels.push("직무 적합도");
  return labels;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, EmptyState, LinkButton, MetricCard, PageHeader, PageShell, ScoreBar } from "@/components/ui";
import { getStoredUser, type AuthUser } from "@/lib/auth";
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
      setErrorMessage(error instanceof Error ? error.message : "적합도 진단 중 오류가 발생했습니다.");
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
      setErrorMessage(error instanceof Error ? error.message : "커리어 플래너 생성 중 오류가 발생했습니다.");
    } finally {
      setCreatingPlannerId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="CAREERLENS MATCH"
        title="맞춤채용정보 적합도 진단 서비스"
        description="저장된 해외취업 프로필과 공고별 PatternProfile을 비교해 지원 가능성, 부족 요소, 다음 준비 액션을 정리합니다."
        actions={
          <>
            <LinkButton href="/mypage" variant="secondary">프로필 확인</LinkButton>
            <Button type="button" onClick={runDiagnosis} disabled={isLoading}>{isLoading ? "진단 중" : "적합도 진단 실행"}</Button>
          </>
        }
      />

      <section className="lens-container grid gap-6 py-8 lg:grid-cols-[300px_1fr]">
        <aside>
          <ProfileCard profile={profile} user={user} />
        </aside>

        <div className="space-y-6">
          <SummaryBanner result={result} isLoading={isLoading} errorMessage={errorMessage} onRun={runDiagnosis} />

          {isLoading && <LoadingState />}
          {!isLoading && !result && (
            <EmptyState
              title="아직 생성된 진단 결과가 없습니다."
              description="마이페이지에 저장된 프로필을 기준으로 적합도 진단을 실행하면 추천 공고와 부족 요소가 표시됩니다."
              action={<Button type="button" onClick={runDiagnosis}>적합도 진단 실행</Button>}
            />
          )}
          {!isLoading && result && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
    <Card className="sticky top-5 rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-xs font-extrabold tracking-[0.14em] text-brand">PROFILE DOSSIER</p>
        <h2 className="mt-3 text-xl font-bold text-night">{profile.display_name}</h2>
        <p className="mt-1 text-sm text-slate-500">{user ? "DB 저장 프로필 기준" : "데모 입력 기준"}</p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <MetricCard label="희망 국가" value={countryName(profile.target_country)} />
        <MetricCard label="직무군" value={profile.target_job_family} />
        <MetricCard label="총 경력" value={`${profile.experience_years ?? 0}년`} />
        <MetricCard label="언어" value={profile.language_level} />
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold text-slate-500">추천 우선순위</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {priorities.map((priority) => <Badge key={priority} tone="success">{priority}</Badge>)}
          {priorities.length === 0 && <Badge tone="muted">기본 가중치</Badge>}
        </div>
      </div>

      <LinkButton href="/mypage" variant="secondary" className="mt-5 w-full rounded-lg">
        프로필 수정
      </LinkButton>
    </Card>
  );
}

function SummaryBanner({
  result,
  isLoading,
  errorMessage,
  onRun
}: {
  result: RecommendationResponse | null;
  isLoading: boolean;
  errorMessage: string | null;
  onRun: () => void;
}) {
  if (errorMessage) {
    return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">{errorMessage}</div>;
  }

  return (
    <Card className="rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-extrabold tracking-[0.14em] text-brand">DIAGNOSIS SUMMARY</p>
          <h2 className="mt-2 text-2xl font-bold text-night">
            {result ? `상위 ${result.returned_recommendation_count}개 공고 분석` : isLoading ? "공고별 적합도 계산 중" : "적합도 진단을 실행하세요"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">프로필과 공고 패턴을 비교해 지원 우선순위가 높은 후보만 정리했습니다.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="총 후보" value={String(result?.total_candidate_count ?? 0)} />
          <MetricCard label="추천" value={String(result?.returned_recommendation_count ?? 0)} />
          <MetricCard label="상태" value={result?.overall_readiness_label ?? "-"} />
        </div>
      </div>
      {!result && !isLoading && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <Button type="button" onClick={onRun}>적합도 진단 실행</Button>
        </div>
      )}
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
  const metrics = categoryMetrics(recommendation);
  return (
    <Card className={`rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 ${selected ? "border-brand shadow-[0_22px_60px_rgba(15,23,42,0.12)]" : ""}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="default">TOP {rank}</Badge>
            <Badge tone={gradeTone(recommendation.recommendation_grade)}>등급 {recommendation.recommendation_grade}</Badge>
            <Badge tone={readinessTone(recommendation.readiness_status)}>{recommendation.readiness_label}</Badge>
          </div>
          <h3 className="mt-4 text-xl font-bold text-night">{recommendation.company_name}</h3>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {countryName(recommendation.country)} · {recommendation.job_title}
          </p>
        </div>
        <div className="min-w-[96px] rounded-xl bg-slate-50 px-4 py-3 text-right">
          <p className="text-xs font-bold text-slate-400">TOTAL</p>
          <p className="mt-1 text-3xl font-extrabold text-brand">{recommendation.score_breakdown.total_score}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{recommendation.recommendation_summary}</p>

      <div className="mt-5 rounded-xl bg-slate-50/80 px-4 py-3">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {metrics.map((metric) => (
            <CompactMetric key={metric.label} {...metric} />
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {recommendation.missing_items.slice(0, 4).map((item) => <Badge key={item} tone="warning">{item}</Badge>)}
        {recommendation.missing_items.length === 0 && <Badge tone="success">큰 부족 요소 없음</Badge>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={onSelect}>비교 보기</Button>
        <Button type="button" onClick={onCreatePlanner} disabled={isCreatingPlanner}>
          {isCreatingPlanner ? "생성 중" : "커리어 플래너 생성"}
        </Button>
        <Button type="button" variant="subtle" disabled>기업 지원 준비</Button>
      </div>
    </Card>
  );
}

function ComparisonPanel({ recommendation }: { recommendation: JobRecommendation | null }) {
  if (!recommendation) return null;

  return (
    <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] xl:sticky xl:top-5">
      <p className="text-xs font-extrabold tracking-[0.14em] text-brand">ANALYSIS PANEL</p>
      <h2 className="mt-2 text-lg font-bold text-night">{recommendation.company_name}</h2>
      <p className="mt-1 text-sm text-slate-500">{recommendation.job_title}</p>

      <div className="mt-5 space-y-4">
        <ScoreBar label="기술 적합도" value={recommendation.score_breakdown.skill_score} />
        <ScoreBar label="경력 적합도" value={recommendation.score_breakdown.experience_score} />
        <ScoreBar label="언어 적합도" value={recommendation.score_breakdown.language_score} />
        <ScoreBar label="포트폴리오 적합도" value={recommendation.score_breakdown.portfolio_score} />
      </div>

      <div className="mt-5 rounded-xl bg-slate-50/80 p-4">
        <p className="text-sm font-bold text-night">공고별 평가 기준</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{evaluationText(recommendation)}</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-sm font-bold text-night">비교 기준 PatternProfile</p>
        <p className="mt-2 text-sm font-bold text-brand">{recommendation.pattern_title || recommendation.pattern_ref}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{patternText(recommendation)}</p>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50/80 p-4">
        <p className="text-sm font-bold text-night">다음 액션</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.next_action_summary}</p>
      </div>
    </aside>
  );
}

function CompactMetric({ label, score, weight }: { label: string; score: number; weight: number }) {
  return (
    <div>
      <div className="flex min-h-[28px] items-start justify-between gap-2">
        <p className="whitespace-nowrap text-[10px] font-bold text-slate-400">{label}</p>
        <p className="whitespace-nowrap text-[10px] font-bold text-slate-400">{weight}%</p>
      </div>
      <p className="mt-1 text-sm font-extrabold text-night">{score}</p>
      <div className="mt-2 h-1.5 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-brand" style={{ width: `${clamp(score)}%` }} />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1, 2, 3].map((item) => (
        <Card key={item} className="h-64 animate-pulse rounded-2xl border-slate-200 p-5">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="mt-4 h-6 w-56 rounded bg-slate-200" />
          <div className="mt-6 h-3 w-full rounded bg-slate-200" />
          <div className="mt-3 h-3 w-3/4 rounded bg-slate-200" />
        </Card>
      ))}
    </div>
  );
}

function NoCandidateState() {
  return (
    <EmptyState
      title="조건에 맞는 공고가 없습니다."
      description="희망 국가, 직무군, 언어 수준, 경력 조건을 확인하세요. 공고에 PatternProfile이 연결되어 있어야 진단 결과로 표시됩니다."
    />
  );
}

function categoryMetrics(recommendation: JobRecommendation) {
  return [
    { label: "합격가능성", score: recommendation.acceptance_probability_score ?? 0, weight: recommendation.probability_weight ?? 0 },
    { label: "연봉", score: recommendation.salary_score ?? 0, weight: recommendation.salary_weight ?? 0 },
    { label: "워라밸", score: recommendation.work_life_balance_score ?? 0, weight: recommendation.work_life_balance_weight ?? 0 },
    { label: "기업 가치", score: recommendation.company_value_score ?? 0, weight: recommendation.company_value_weight ?? 0 },
    { label: "직무적합도", score: recommendation.job_fit_score ?? 0, weight: recommendation.job_fit_weight ?? 0 }
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

function evaluationText(recommendation: JobRecommendation) {
  const core = `${recommendation.company_name} ${recommendation.job_title} 공고의 요구조건과 사용자 프로필을 비교했습니다.`;
  return `${core} 기술, 경력, 언어, 포트폴리오 적합도를 우선 반영하고 선택한 우선순위 점수를 보조 지표로 사용합니다.`;
}

function patternText(recommendation: JobRecommendation) {
  return "공고 요구사항과 직무 패턴을 기준으로 만든 비교 기준입니다. 이 패턴을 사용자 프로필과 대조해 강점과 부족 요소를 분리합니다.";
}

function countryName(country: string) {
  const labels: Record<string, string> = {
    "United States": "미국",
    "USA": "미국",
    "US": "미국",
    "Japan": "일본",
    "Canada": "캐나다",
    "Ireland": "아일랜드",
    "United Kingdom": "영국",
    "Germany": "독일",
    "France": "프랑스",
    "Singapore": "싱가포르",
    "India": "인도",
    "Brazil": "브라질"
  };
  return labels[country] ?? country;
}

function gradeTone(grade: string) {
  if (grade === "A") return "success";
  if (grade === "B") return "brand";
  return "warning";
}

function readinessTone(status: string) {
  if (status === "IMMEDIATE_APPLY") return "success";
  if (status === "PREPARE_THEN_APPLY") return "brand";
  return "warning";
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, value));
}

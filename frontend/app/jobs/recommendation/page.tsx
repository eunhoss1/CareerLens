"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageShell,
} from "@/components/ui";
import type { AuthUser } from "@/lib/auth";
import {
  demoProfile,
  diagnoseStoredProfile,
  fetchUserProfile,
  type JobRecommendation,
  type RecommendationResponse,
  type UserProfileRequest,
} from "@/lib/recommendation";
import { createPlannerRoadmap } from "@/lib/planner";
import { isMembershipLimitMessage } from "@/lib/membership";
import { countryLabel, languageLevelLabel } from "@/lib/display-labels";

const MAX_VISIBLE_RECOMMENDATIONS = 5;
const HORIZONTAL_BAR_COLOR = "#2f73d8";
const DISTRIBUTION_BAR_COLOR = "#9bb7ee";
const SCORE_RING_COLOR = "#168f93";

export default function RecommendationPage() {
  const router = useRouter();
  const auth = useRequiredAuth();
  const [profile, setProfile] = useState<UserProfileRequest>(demoProfile);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [creatingPlannerId, setCreatingPlannerId] = useState<number | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profileMissing, setProfileMissing] = useState(false);

  const displayedRecommendations = useMemo(
    () => result?.recommendations.slice(0, MAX_VISIBLE_RECOMMENDATIONS) ?? [],
    [result]
  );

  const selectedRecommendation = useMemo(() => {
    if (!displayedRecommendations.length) return null;
    return (
      displayedRecommendations.find((item) => item.job_id === selectedJobId) ??
      displayedRecommendations[0]
    );
  }, [displayedRecommendations, selectedJobId]);

  useEffect(() => {
    if (auth.isChecking || !auth.user) return;

    const activeUser = auth.user;
    setUser(activeUser);

    fetchUserProfile(activeUser.user_id)
      .then((storedProfile) => {
        setProfileMissing(false);
        setProfile({
          ...demoProfile,
          ...storedProfile,
          display_name: storedProfile.display_name,
          email: activeUser.email,
        });
      })
      .catch((error) => {
        if (isProfileMissingError(error)) {
          setProfileMissing(true);
        } else {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "프로필 정보를 불러오지 못했습니다."
          );
        }
      });
  }, [auth.isChecking, auth.user]);

  if (auth.isChecking) {
    return <AuthCheckingScreen title="적합도 진단 권한을 확인하는 중입니다." />;
  }

  if (!auth.user) {
    return <AuthRequiredScreen title="적합도 진단은 로그인이 필요합니다." />;
  }

  async function runDiagnosis() {
    const activeUser = user ?? auth.user;
    if (!activeUser) return;

    if (profileMissing) {
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await diagnoseStoredProfile(activeUser.user_id);
      setResult(response);
      setSelectedJobId(response.recommendations[0]?.job_id ?? null);
    } catch (error) {
      if (isProfileMissingError(error)) {
        setProfileMissing(true);
        setResult(null);
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "적합도 진단 중 오류가 발생했습니다."
        );
      }
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "커리어 플래너 생성 중 오류가 발생했습니다."
      );
    } finally {
      setCreatingPlannerId(null);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <TopPageIntro />

      <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#f4f7fb_38%,#eef3f8_100%)] px-2 py-4 sm:px-3 lg:px-4">
        <div className="mx-auto w-full max-w-[1680px]">
          <div className="grid w-full items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
            <aside className="xl:sticky xl:top-5 xl:row-span-2 xl:self-start">
              <ProfileCard profile={profile} user={user} />
            </aside>

            <div className="min-w-0 xl:col-span-2">
              <SummaryBanner
                result={result}
                recommendations={displayedRecommendations}
                isLoading={isLoading}
                errorMessage={errorMessage}
                profileMissing={profileMissing}
                onRun={runDiagnosis}
              />
            </div>

            <main className="w-full min-w-0 space-y-4">
              <ResultsHeader
                count={displayedRecommendations.length}
                hasResult={!!result}
              />

              {isLoading && <LoadingState />}

              {!isLoading && !result && !profileMissing && (
                <EmptyState
                  title="아직 진단 결과가 없습니다."
                  description="적합도 진단을 실행하면 상위 공고 5건과 세부 점수를 비교하기 쉬운 형태로 정리해드립니다."
                  action={
                    <Button type="button" onClick={runDiagnosis}>
                      적합도 진단 실행
                    </Button>
                  }
                />
              )}

              {!isLoading && result && (
                <>
                  {displayedRecommendations.map((recommendation, index) => (
                    <RecommendationCard
                      key={`${recommendation.diagnosis_id}-${recommendation.job_id}`}
                      recommendation={recommendation}
                      rank={index + 1}
                      selected={
                        selectedRecommendation?.job_id === recommendation.job_id
                      }
                      onSelect={() => setSelectedJobId(recommendation.job_id)}
                      onCreatePlanner={() =>
                        createPlanner(recommendation.diagnosis_id)
                      }
                      isCreatingPlanner={
                        creatingPlannerId === recommendation.diagnosis_id
                      }
                    />
                  ))}
                  {displayedRecommendations.length === 0 && (
                    <NoCandidateState />
                  )}
                </>
              )}
            </main>

            <ComparisonPanel
              recommendation={selectedRecommendation}
              recommendations={displayedRecommendations}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function ResultsHeader({
  count,
  hasResult,
}: {
  count: number;
  hasResult: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.04)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ranking Overview
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
          상위 5개 공고 비교
        </h2>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
        <span className="font-medium text-slate-700">정렬 기준</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-slate-900 shadow-sm">
          적합도 높은 순
        </span>
        <span className="text-slate-400">|</span>
        <span>{hasResult ? `${count}개 표시` : "진단 후 표시"}</span>
      </div>
    </div>
  );
}

function TopPageIntro() {
  return (
    <div className="border-b border-slate-200 bg-white px-2 py-6 sm:px-3 lg:px-4">
      <div className="mx-auto w-full max-w-[1680px] px-5">
        <p className="inline-flex text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600">
          Recommendation Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          적합도 진단 서비스
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          저장된 프로필을 기준으로 추천 공고의 적합도와 보완 포인트를 한 번에
          비교할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  user,
}: {
  profile: UserProfileRequest;
  user: AuthUser | null;
}) {
  const priorities = priorityLabels(profile);
  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.07)]">
      <div className="border-b border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Profile
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {profile.display_name || user?.display_name || "사용자 프로필"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {user?.email || profile.email}
        </p>
      </div>
      <div className="space-y-4 p-5">
        <dl className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="희망 국가"
            value={countryLabel(profile.target_country)}
          />
          <MetricCard label="직무 분야" value={profile.target_job_family} />
          <MetricCard
            label="총 경력"
            value={`${profile.experience_years ?? 0}년`}
          />
          <MetricCard
            label="언어"
            value={languageLevelLabel(profile.language_level)}
          />
        </dl>
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-900">우선순위</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <Badge key={priority} tone="success">
                {priority}
              </Badge>
            ))}
            {priorities.length === 0 && (
              <Badge tone="muted">기본 기준 적용</Badge>
            )}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">기술 스택</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {profile.tech_stack.slice(0, 8).map((tech) => (
              <Badge key={tech} tone="muted">
                {tech}
              </Badge>
            ))}
            {profile.tech_stack.length === 0 && (
              <Badge tone="muted">등록된 기술 없음</Badge>
            )}
          </div>
        </section>
        <LinkButton
          href="/mypage"
          variant="secondary"
          className="w-full rounded-xl border-slate-200"
        >
          프로필 수정
        </LinkButton>
      </div>
    </Card>
  );
}

function SummaryBanner({
  result,
  recommendations,
  isLoading,
  errorMessage,
  profileMissing,
  onRun,
}: any) {
  if (profileMissing) {
    return (
      <EmptyState
        title="해외취업 프로필 등록이 필요합니다."
        description="마이페이지에서 정보를 입력하면 적합도 진단을 시작할 수 있습니다."
        action={<LinkButton href="/mypage">프로필 등록하러 가기</LinkButton>}
      />
    );
  }
  if (errorMessage) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700"
      >
        <span>{errorMessage}</span>
      </div>
    );
  }
  return (
    <Card className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-[0_18px_48px_rgba(20,184,166,0.08)]">
      <div className="border-l-4 border-l-emerald-100 bg-[linear-gradient(90deg,#eefcf8_0%,#ffffff_50%,#f8fbff_100%)] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-700">
              Diagnosis Result
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {isLoading ? "분석 중..." : "적합도 진단 결과"}
            </h2>
          </div>
          <Button
            type="button"
            onClick={onRun}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-xs"
          >
            {isLoading ? "진단 중..." : "적합도 진단 실행"}
          </Button>
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
  isCreatingPlanner,
}: any) {
  const detailMetrics = detailMetricsForCard(recommendation);
  const totalScore = clampScore(recommendation.score_breakdown.total_score);

  return (
    <Card
      className={`overflow-hidden rounded-2xl border bg-white p-4 ${
        selected
          ? "border-teal-300 ring-1 ring-teal-200"
          : "border-slate-200/80"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-950 px-2 text-xs font-semibold text-white">
              {rank}
            </span>
            <Badge tone={gradeTone(recommendation.recommendation_grade)}>
              등급 {recommendation.recommendation_grade}
            </Badge>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
            {recommendation.job_title}
          </h3>
        </div>
        <div className="flex shrink-0 flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3">
          <p className="text-2xl font-semibold text-slate-950">{totalScore}%</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button
          variant="secondary"
          onClick={onSelect}
          className="w-full text-xs"
        >
          상세 비교
        </Button>
        <Button
          onClick={onCreatePlanner}
          disabled={isCreatingPlanner}
          className="w-full text-xs"
        >
          커리어 플래너 생성
        </Button>
      </div>
    </Card>
  );
}

function ComparisonPanel({ recommendation, recommendations }: any) {
  return (
    <aside className="space-y-4 xl:sticky xl:top-5">
      <Card className="p-4">
        <h2 className="text-xl font-semibold">전체 요약</h2>
      </Card>
    </aside>
  );
}

function LoadingState() {
  return <div className="animate-pulse space-y-4">진단 중...</div>;
}
function NoCandidateState() {
  return <div>결과가 없습니다.</div>;
}
function detailMetricsForCard(rec: any) {
  return [];
}
function priorityLabels(profile: any) {
  return [];
}
function aggregateCategoryAverages(recs: any) {
  return [];
}
function averageScore(values: number[]) {
  return 0;
}
function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}
function evaluationText(rec: any) {
  return "";
}
function patternText(rec: any) {
  return "";
}
function gradeTone(grade: string): "success" {
  return "success";
}
function readinessTone(status: string) {
  return "success";
}
function isProfileMissingError(error: unknown) {
  return false;
}

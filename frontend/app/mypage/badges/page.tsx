"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  EmptyState,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  SectionHeader,
} from "@/components/ui";
import { fetchUserBadges, type VerificationBadge } from "@/lib/verifications";

export default function MyPageBadgesPage() {
  const auth = useRequiredAuth();
  const [badges, setBadges] = useState<VerificationBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (auth.isChecking) {
      return;
    }
    if (!auth.user) {
      setIsLoading(false);
      return;
    }

    fetchUserBadges(auth.user.user_id)
      .then(setBadges)
      .catch((error: Error) => setErrorMessage(error.message))
      .finally(() => setIsLoading(false));
  }, [auth.isChecking, auth.user]);

  const summary = useMemo(() => {
    const gold = badges.filter((badge) =>
      badge.badge_type.includes("GOLD")
    ).length;
    const silver = badges.filter((badge) =>
      badge.badge_type.includes("SILVER")
    ).length;
    const bronze = badges.filter((badge) =>
      badge.badge_type.includes("BRONZE")
    ).length;
    const github = badges.filter((badge) =>
      badge.badge_type.includes("GITHUB")
    ).length;
    const average =
      badges.length === 0
        ? 0
        : Math.round(
            badges.reduce(
              (sum, badge) => sum + (badge.score_at_issue ?? 0),
              0
            ) / badges.length
          );
    return { gold, silver, bronze, github, average };
  }, [badges]);

  if (auth.isChecking) {
    return (
      <AuthCheckingScreen title="검증 배지 접근 권한을 확인하는 중입니다." />
    );
  }

  if (!auth.user) {
    return (
      <AuthRequiredScreen title="검증 배지는 로그인 후 이용할 수 있습니다." />
    );
  }

  return (
    <PageShell>
      <SiteHeader />

      <style jsx global>{`
        .lens-kicker {
          display: inline-block;
          border: none !important;
          background: none !important;
          padding: 0 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.15em !important;
          text-transform: uppercase !important;
          color: #4f46e5 !important;
        }
      `}</style>

      <PageHeader
        kicker={<span className="lens-kicker">VERIFICATION BADGES</span>}
        title="검증 배지"
        description="커리어 플래너 과제, AI 문서 분석, GitHub repository 검증 결과로 발급된 준비 증빙 배지를 확인합니다."
        actions={
          <div className="flex gap-2">
            <LinkButton
              href="/roadmap/employment/documents"
              variant="secondary"
              className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50"
            >
              AI 문서 분석
            </LinkButton>
            <LinkButton
              href="/planner"
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700"
            >
              로드맵 목록
            </LinkButton>
          </div>
        }
      />

      <section className="max-w-[1200px] mx-auto px-6 py-8 bg-slate-50/40 min-h-[calc(100vh-220px)]">
        {isLoading ? (
          <EmptyState
            title="검증 배지를 불러오는 중입니다"
            description="사용자의 검증 기록과 발급 배지를 확인하고 있습니다."
          />
        ) : (
          <div className="space-y-8">
            <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                  label="총 배지"
                  value={`${badges.length}개`}
                  className="rounded-xl border-slate-100"
                />
                <MetricCard
                  label="평균 검증점수"
                  value={`${summary.average}점`}
                  className="rounded-xl border-slate-100"
                />
                <MetricCard
                  label="Gold"
                  value={`${summary.gold}개`}
                  className="rounded-xl border-slate-100"
                />
                <MetricCard
                  label="Silver"
                  value={`${summary.silver}개`}
                  className="rounded-xl border-slate-100"
                />
                <MetricCard
                  label="GitHub 검증"
                  value={`${summary.github}개`}
                  className="rounded-xl border-slate-100"
                />
              </div>
            </Card>

            <Card className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <SectionHeader
                kicker="ISSUE RULES"
                title="배지 발급 기준"
                description="검증 배지는 합격 보장이 아니라, 사용자가 제출한 과제 산출물이 플래너 기준을 얼마나 충족했는지 보여주는 준비 증빙입니다."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <RuleCard
                  title="Bronze"
                  score="60점 이상"
                  description="기본 산출물은 있으나 구체성과 검증 가능성 보완이 필요합니다."
                  tone="warning"
                />
                <RuleCard
                  title="Silver"
                  score="75점 이상"
                  description="주요 검증 기준을 대체로 충족했고 지원 자료로 발전 가능합니다."
                  tone="brand"
                />
                <RuleCard
                  title="Gold"
                  score="90점 이상"
                  description="산출물과 검증 기준이 매우 구체적이고 포트폴리오 증빙으로 바로 활용 가능합니다."
                  tone="success"
                />
                <RuleCard
                  title="GitHub Project"
                  score="GitHub 75점 이상"
                  description="실제 GitHub repository URL과 README/프로젝트 구조를 함께 검증한 경우 발급됩니다."
                  tone="success"
                />
              </div>
            </Card>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50/60 px-4 py-3 text-xs font-semibold text-red-600 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errorMessage}
              </div>
            )}

            {badges.length === 0 ? (
              <EmptyState
                title="아직 발급된 검증 배지가 없습니다"
                description="커리어 플래너 과제에서 산출물을 만들고 AI 문서 분석에서 텍스트, PDF/DOCX, GitHub repository를 검증하면 배지가 발급됩니다."
                action={
                  <LinkButton
                    href="/roadmap/employment/documents"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/10"
                  >
                    첫 검증 시작
                  </LinkButton>
                }
              />
            ) : (
              <div className="space-y-4">
                <SectionHeader
                  kicker="BADGE WALLET"
                  title="내 검증 배지 목록"
                  description="최근 발급된 배지부터 표시됩니다. 같은 과제라도 제출 방식과 점수에 따라 다른 배지가 발급될 수 있습니다."
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {badges.map((badge) => (
                    <BadgeWalletCard key={badge.badge_id} badge={badge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}

function RuleCard({
  title,
  score,
  description,
  tone,
}: {
  title: string;
  score: string;
  description: string;
  tone: "brand" | "success" | "warning";
}) {
  return (
    <div className="border border-slate-200 bg-slate-50/40 rounded-xl p-5 transition-all hover:bg-slate-50/80">
      <Badge
        tone={tone}
        className="rounded-md text-[10px] font-bold px-1.5 py-0.5"
      >
        {score}
      </Badge>
      <h3 className="mt-4 text-sm font-bold text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </div>
  );
}

function BadgeWalletCard({ badge }: { badge: VerificationBadge }) {
  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Badge
            tone={badgeTone(badge.badge_type)}
            className="rounded-md text-[10px] font-bold px-1.5 py-0.5"
          >
            {badgeLabel(badge.badge_type)}
          </Badge>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-1 text-right min-w-[70px]">
            <p className="text-[9px] font-bold text-slate-400 tracking-wider">
              SCORE
            </p>
            <p className="text-sm font-black text-indigo-600 mt-0.5">
              {badge.score_at_issue}점
            </p>
          </div>
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 tracking-tight">
          {badge.label}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {badge.description}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-2 text-center">
            <p className="font-bold text-slate-400 text-[10px]">Task</p>
            <p className="mt-0.5 font-mono text-slate-600 text-xs font-semibold">
              #{badge.task_id}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50/80 border border-slate-100 p-2 text-center">
            <p className="font-bold text-slate-400 text-[10px]">Verification</p>
            <p className="mt-0.5 font-mono text-slate-600 text-xs font-semibold">
              #{badge.verification_id}
            </p>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-medium text-slate-400 text-right">
          발급일: {formatDate(badge.issued_at)}
        </p>
      </div>
    </Card>
  );
}

function badgeLabel(type: string) {
  if (type.includes("GITHUB")) return "GitHub Project";
  if (type.includes("GOLD")) return "Gold";
  if (type.includes("SILVER")) return "Silver";
  if (type.includes("BRONZE")) return "Bronze";
  return "Verified";
}

function badgeTone(type: string) {
  if (type.includes("GOLD") || type.includes("GITHUB")) return "success";
  if (type.includes("SILVER")) return "brand";
  return "warning";
}

function formatDate(value?: string) {
  if (!value) return "미기재";
  return value.slice(0, 10).replaceAll("-", ".");
}

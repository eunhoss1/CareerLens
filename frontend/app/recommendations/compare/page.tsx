"use client";

import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  LinkButton,
  MetricCard,
  PageHeader,
  PageShell,
  ScoreBar,
  SectionHeader,
} from "@/components/ui";
import { countryGuides } from "@/lib/resource-guides";

const countryScores = [
  {
    country: "미국",
    salary: 88,
    visa: 45,
    language: 65,
    settlement: 58,
    jobFit: 82,
  },
  {
    country: "일본",
    salary: 64,
    visa: 68,
    language: 55,
    settlement: 72,
    jobFit: 76,
  },
];

export default function RecommendationComparePage() {
  return (
    <PageShell>
      <SiteHeader />

      {/* 강제 스타일 주입: 보더와 배경을 완전히 제거 */}
      <style jsx global>{`
        .lens-kicker {
          display: inline-block !important;
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
        kicker={<span className="lens-kicker">COMPARISON DASHBOARD</span>}
        title="비교 대시보드"
        description="국가별 취업 준비 메리트를 연봉, 비자, 언어, 정착, 직무 적합도 관점으로 비교합니다."
        actions={
          <LinkButton
            href="/jobs/recommendation"
            className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
          >
            적합도 진단으로
          </LinkButton>
        }
      />

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-8">
            <MetricCard
              label="비교 국가"
              value="2개"
              helper="미국/일본"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="비교 축"
              value="5개"
              helper="연봉/비자/언어/정착/직무"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="데이터 성격"
              value="수동 검수"
              helper="seed/manual 기반"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="연결 화면"
              value="4개"
              helper="추천/국가/비자/정착"
              className="rounded-xl border-slate-200 bg-white"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {countryScores.map((score) => {
              const guide = countryGuides.find(
                (item) => item.country === score.country
              );
              return (
                <Card
                  key={score.country}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-50 pb-4 mb-6">
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                        COUNTRY FIT
                      </p>
                      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                        {score.country}
                      </h2>
                    </div>
                    <Badge
                      tone={
                        guide?.preparationDifficulty === "HIGH"
                          ? "risk"
                          : "warning"
                      }
                      className="rounded-lg px-2 py-1 text-[10px] font-bold"
                    >
                      {guide?.preparationDifficulty === "HIGH"
                        ? "준비 난이도 높음"
                        : "준비 난이도 중간"}
                    </Badge>
                  </div>

                  <p className="text-xs leading-relaxed text-slate-500 mb-8">
                    {guide?.marketSummary}
                  </p>

                  <div className="space-y-5">
                    <ScoreBar
                      label="연봉 매력도"
                      value={score.salary}
                      tone="brand"
                    />
                    <ScoreBar
                      label="비자 준비 용이성"
                      value={score.visa}
                      tone={score.visa >= 65 ? "success" : "warning"}
                    />
                    <ScoreBar
                      label="언어 준비도"
                      value={score.language}
                      tone={score.language >= 65 ? "success" : "warning"}
                    />
                    <ScoreBar
                      label="정착 준비 용이성"
                      value={score.settlement}
                      tone={score.settlement >= 65 ? "success" : "warning"}
                    />
                    <ScoreBar
                      label="직무 적합도"
                      value={score.jobFit}
                      tone="brand"
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-8 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <SectionHeader
              kicker="NEXT ACTION"
              title="비교 결과를 추천/로드맵으로 연결"
              description="비교 대시보드는 현재 시연용 정적 점수이지만, 추후 프로필과 진단 결과를 기준으로 동적으로 계산됩니다."
              actions={
                <div className="flex flex-wrap gap-2 mt-4">
                  <LinkButton
                    href="/resources/countries"
                    variant="secondary"
                    className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50"
                  >
                    국가정보
                  </LinkButton>
                  <LinkButton
                    href="/resources/visas"
                    variant="secondary"
                    className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50"
                  >
                    비자정보
                  </LinkButton>
                  <LinkButton
                    href="/settlement"
                    variant="secondary"
                    className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50"
                  >
                    정착지원
                  </LinkButton>
                </div>
              }
            />
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

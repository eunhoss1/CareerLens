"use client";

import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  LinkButton,
  MetricCard,
  PageShell,
} from "@/components/ui";
import { countryGuides, resourceDisclaimer } from "@/lib/resource-guides";

export default function CountriesPage() {
  return (
    <PageShell>
      <SiteHeader />

      {/* 인디고 보더리스 서브 헤더 구조 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[800px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              COUNTRY GUIDE
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              국가정보
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              국가별 채용시장 신호, 언어, 비자 확인 포인트, 정착 준비 항목을
              추천 진단 이후 흐름과 연결합니다. 실제 지원 전에는 공식 출처와
              고용주 안내를 함께 확인해야 합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <LinkButton
              href="/recommendations/compare"
              variant="secondary"
              className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4 py-2"
            >
              비교대시보드
            </LinkButton>
            <LinkButton
              href="/settlement"
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              정착 지원
            </LinkButton>
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          {/* 상단 지표 영역 */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-8">
            <MetricCard
              label="정리 국가"
              value={`${countryGuides.length}개`}
              helper="국가별 가이드"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="핵심 기준"
              value="채용·비자·정착"
              helper="추천 이후 연결"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="공식 링크"
              value="국가별 제공"
              helper="최종 확인 경로"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="AI 활용"
              value="요약 보조"
              helper="판정 대신 설명"
              className="rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* 국가별 리스트 그리드 */}
          <div className="grid gap-6 xl:grid-cols-2">
            {countryGuides.map((guide) => (
              <Card
                key={guide.country}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between border-b border-slate-50 pb-4 mb-5">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                      COUNTRY DOSSIER
                    </p>
                    <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                      {guide.country}
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                        {guide.code}
                      </span>
                    </h2>
                  </div>
                  <Badge
                    tone={
                      guide.preparationDifficulty === "HIGH"
                        ? "risk"
                        : "warning"
                    }
                    className="rounded-lg text-[10px] font-bold px-2 py-0.5 self-start"
                  >
                    {difficultyLabel(guide.preparationDifficulty)}
                  </Badge>
                </div>

                <p className="text-xs leading-relaxed text-slate-500 mb-6">
                  {guide.marketSummary}
                </p>

                {/* 핵심 인포 블록 */}
                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                  <InfoBlock label="주요 언어" value={guide.primaryLanguage} />
                  <InfoBlock label="비자 확인 포인트" value={guide.visaFocus} />
                  <InfoBlock
                    label="정착 준비 포인트"
                    value={guide.settlementFocus}
                  />
                  <InfoBlock
                    label="대표 직무"
                    value={guide.commonRoles.join(", ")}
                  />
                </div>

                {/* 체크리스트 영역 */}
                <div className="grid gap-4 sm:grid-cols-2 mb-6">
                  <Checklist title="채용 신호" items={guide.hiringSignals} />
                  <Checklist title="프로필 입력 팁" items={guide.profileTips} />
                </div>

                {/* 공식 확인 링크 */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                      OFFICIAL LINKS
                    </p>
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight mt-0.5">
                      공식 확인 링크
                    </h3>
                  </div>
                  <div className="grid gap-2.5">
                    {guide.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-indigo-200 hover:bg-white group"
                      >
                        <p className="text-xs font-bold text-slate-900 tracking-tight flex items-center justify-between group-hover:text-indigo-600">
                          {link.label}{" "}
                          <span className="text-[10px] text-slate-400 font-normal group-hover:translate-x-0.5 transition-transform">
                            바로가기 ↗
                          </span>
                        </p>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                          {link.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* 하단 네비게이션 및 면책조항 */}
          <Card className="mt-8 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="flex flex-wrap gap-2 mb-4">
              <LinkButton
                href="/resources/visas"
                variant="secondary"
                className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4"
              >
                비자정보로
              </LinkButton>
              <LinkButton
                href="/roadmap/administration"
                variant="secondary"
                className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4"
              >
                행정로드맵으로
              </LinkButton>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              {resourceDisclaimer}
            </p>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
        {label}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-700 leading-relaxed">
        {value}
      </p>
    </div>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.008)]">
      <h3 className="text-xs font-bold text-slate-900 tracking-tight mb-3">
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-xs leading-relaxed text-slate-500"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 bg-indigo-500 rounded-full" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 보통";
  return "준비 난이도 낮음";
}

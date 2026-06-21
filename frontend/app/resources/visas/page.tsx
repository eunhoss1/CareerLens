"use client";

import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  LinkButton,
  MetricCard,
  PageShell,
} from "@/components/ui";
import { resourceDisclaimer, visaGuides } from "@/lib/resource-guides";

export default function VisasPage() {
  const highDifficultyCount = visaGuides.filter(
    (guide) => guide.difficulty === "HIGH"
  ).length;

  return (
    <PageShell>
      <SiteHeader />

      {/* 인디고 보더LES 서브 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[800px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              VISA GUIDE
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              비자정보
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              비자정보는 최신성과 공식 출처가 중요한 영역입니다. CareerLens는
              비자 가능 여부를 판정하지 않고, 공고의 비자 문구를 공식 확인
              링크와 행정 로드맵 체크리스트로 연결합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <LinkButton
              href="/resources/countries"
              variant="secondary"
              className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4 py-2"
            >
              국가정보
            </LinkButton>
            <LinkButton
              href="/roadmap/administration"
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              행정로드맵
            </LinkButton>
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          {/* 상단 지표 영역 */}
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 mb-8">
            <MetricCard
              label="비자 가이드"
              value={`${visaGuides.length}개`}
              helper="국가별 시연 데이터"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="고난도 국가"
              value={`${highDifficultyCount}개`}
              helper="스폰서/요건 확인 필요"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="판정 방식"
              value="공식 링크 우선"
              helper="AI 법률 판단 금지"
              className="rounded-xl border-slate-200 bg-white"
            />
            <MetricCard
              label="연결 화면"
              value="행정로드맵"
              helper="체크리스트 전환"
              className="rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* 비자 가이드 카드 리스트 섹션 */}
          <div className="space-y-6">
            {visaGuides.map((guide) => (
              <Card
                key={guide.country}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] relative overflow-hidden"
              >
                {/* 상단 타이틀 바 구성 */}
                <div className="border-b border-slate-50 pb-4 mb-5 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase">
                      {guide.country}
                    </span>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">
                      {guide.category}
                    </h2>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
                  {/* 본문 콘텐츠 데이터 필드 */}
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge
                        tone="brand"
                        className="rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2 py-0.5"
                      >
                        {guide.targetUser}
                      </Badge>
                      <Badge
                        tone={guide.difficulty === "HIGH" ? "risk" : "warning"}
                        className="rounded-md text-[10px] font-bold px-2 py-0.5"
                      >
                        {difficultyLabel(guide.difficulty)}
                      </Badge>
                    </div>

                    <p className="text-xs leading-relaxed text-slate-500 mb-6">
                      {guide.summary}
                    </p>

                    {/* 간이 패널 그리드 */}
                    <div className="grid gap-4 sm:grid-cols-2 mb-4">
                      <Panel
                        title="확인해야 할 신호"
                        items={guide.requiredSignals}
                      />
                      <Panel title="준비 체크리스트" items={guide.checklist} />
                    </div>

                    {/* 주의사항 박스 경고 */}
                    <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
                      <h4 className="text-xs font-bold text-amber-700 tracking-tight flex items-center gap-1.5">
                        ⚠️ 주의해야 할 점
                      </h4>
                      <ul className="mt-2 space-y-1.5">
                        {guide.riskNotes.map((item) => (
                          <li
                            key={item}
                            className="text-xs leading-relaxed text-slate-600 flex items-start gap-1"
                          >
                            <span className="shrink-0 text-amber-500">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* 우측 바로가기 사이드바 카드 */}
                  <aside className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-5 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                        연결 화면
                      </p>
                      <div className="flex flex-col gap-2">
                        <LinkButton
                          href="/roadmap/administration"
                          variant="secondary"
                          className="w-full text-center justify-center rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          행정로드맵
                        </LinkButton>
                        <LinkButton
                          href="/settlement"
                          variant="secondary"
                          className="w-full text-center justify-center rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          정착 체크리스트
                        </LinkButton>
                        <LinkButton
                          href="/jobs/recommendation"
                          variant="secondary"
                          className="w-full text-center justify-center rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          추천 진단
                        </LinkButton>
                      </div>
                    </div>
                    <p className="mt-4 text-[10px] leading-relaxed text-slate-400 border-t border-slate-200/60 pt-3">
                      {guide.officialReminder}
                    </p>
                  </aside>
                </div>

                {/* 하단 공식 확인 링크 세부 구성 */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="mb-3">
                    <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                      OFFICIAL SOURCES
                    </p>
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight mt-0.5">
                      공식 확인 링크
                    </h4>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
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

          {/* 하단 AI 가이드라인 카드 구성 */}
          <Card className="mt-8 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
            <div className="border-b border-slate-50 pb-4 mb-4">
              <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                AI POLICY
              </p>
              <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                AI 사용 원칙
              </h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                AI는 비자 가능 여부를 판정하지 않습니다. 공고 본문에서
                sponsorship, work authorization, salary, location 문구를
                요약하고 사용자가 공식 링크를 확인하도록 돕는 보조 기능으로만
                사용합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              <Badge
                tone="muted"
                className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 border-none"
              >
                No legal decision
              </Badge>
              <Badge
                tone="muted"
                className="rounded-md px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 border-none"
              >
                Official source first
              </Badge>
              <Badge
                tone="brand"
                className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100"
              >
                Checklist summary
              </Badge>
              <Badge
                tone="warning"
                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              >
                Human verification required
              </Badge>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400 pt-2 border-t border-slate-50">
              {resourceDisclaimer}
            </p>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4 shadow-[0_4px_20px_rgb(0,0,0,0.008)]">
      <h4 className="text-xs font-bold text-slate-900 tracking-tight mb-3">
        {title}
      </h4>
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
  if (value === "HIGH") return "검토 난이도 높음";
  if (value === "MEDIUM") return "검토 난이도 보통";
  return "검토 난이도 낮음";
}

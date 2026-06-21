"use client";

import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell } from "@/components/ui"; // PageShell 임포트 추가 완료
import { countryGuides, visaGuides } from "@/lib/resource-guides";

const feedItems = [
  {
    type: "추천 준비",
    title: "추천 진단 전 프로필을 먼저 채우세요",
    description:
      "희망 국가, 직무군, 기술스택, 언어 수준, 포트폴리오/GitHub 여부가 추천 결과에 직접 반영됩니다.",
    href: "/mypage",
  },
  {
    type: "로드맵",
    title: "부족 요소는 커리어 플래너 과제로 전환됩니다",
    description:
      "추천 결과의 부족 요소가 주차별 과제, 기대 산출물, 검증 기준으로 바뀝니다.",
    href: "/planner",
  },
  {
    type: "검증",
    title: "이력서와 GitHub는 AI 문서 분석에서 검증하세요",
    description:
      "텍스트, PDF/DOCX, GitHub repository를 제출하면 검증 점수와 배지를 받을 수 있습니다.",
    href: "/roadmap/employment/documents",
  },
];

export default function RecommendationFeedPage() {
  return (
    <PageShell>
      <SiteHeader />

      {/* 박스 없는 깔끔한 인디고 헤더 섹션 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              PERSONALIZED FEED
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              맞춤 피드
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              사용자 프로필, 추천 진단, 국가/비자 자료를 연결해 다음 액션을 피드
              형태로 제공합니다.
            </p>
          </div>
          <div className="shrink-0">
            <LinkButton
              href="/mypage"
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              프로필 수정
            </LinkButton>
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            {/* 메인 피드 영역 */}
            <div className="space-y-4">
              {feedItems.map((item) => (
                <Card
                  key={item.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] transition-all hover:border-indigo-200"
                >
                  <Badge
                    tone="brand"
                    className="rounded-lg px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-tight"
                  >
                    {item.type}
                  </Badge>
                  <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                  <div className="mt-5">
                    <LinkButton
                      href={item.href}
                      variant="secondary"
                      className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      상세 이동하기
                    </LinkButton>
                  </div>
                </Card>
              ))}
            </div>

            {/* 사이드바 영역 */}
            <aside className="space-y-6">
              <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    COUNTRY TIPS
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">
                    국가별 준비 팁
                  </h3>
                </div>
                <div className="mt-5 space-y-3">
                  {countryGuides.map((guide) => (
                    <div
                      key={guide.country}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <p className="text-xs font-bold text-slate-900 tracking-tight">
                        {guide.country}
                      </p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                        {guide.visaFocus}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
                <div className="mb-4">
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    VISA CHECK
                  </p>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight mt-0.5">
                    비자 체크리스트
                  </h3>
                </div>
                <div className="mt-5 space-y-3">
                  {visaGuides.map((guide) => (
                    <div
                      key={guide.country}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                    >
                      <Badge
                        tone="muted"
                        className="rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-white text-slate-400 border border-slate-100 uppercase tracking-tighter"
                      >
                        {guide.country}
                      </Badge>
                      <ul className="mt-2.5 space-y-1">
                        {guide.checklist.slice(0, 2).map((item) => (
                          <li
                            key={item}
                            className="text-[11px] leading-relaxed text-slate-500 flex gap-2"
                          >
                            <span className="text-indigo-400">•</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <LinkButton
                    href="/resources/visas"
                    variant="secondary"
                    className="rounded-xl border-slate-200 text-[10px] font-bold bg-white text-slate-700 hover:bg-slate-50 px-3"
                  >
                    비자정보
                  </LinkButton>
                  <LinkButton
                    href="/roadmap/administration"
                    variant="secondary"
                    className="rounded-xl border-slate-200 text-[10px] font-bold bg-white text-slate-700 hover:bg-slate-50 px-3"
                  >
                    행정로드맵
                  </LinkButton>
                </div>
              </Card>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

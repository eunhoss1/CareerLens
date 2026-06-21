"use client";

import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell } from "@/components/ui";
import {
  countryGuides,
  noticeItems,
  qnaItems,
  resourceDisclaimer,
  visaGuides,
} from "@/lib/resource-guides";

const resourceSections = [
  {
    title: "공지사항",
    description:
      "서비스 이용 안내, 공고 데이터 업데이트, 추천 진단 변경사항을 확인합니다.",
    href: "/resources/notices",
    badge: "NOTICE",
  },
  {
    title: "Q&A",
    description:
      "추천 진단, PatternProfile, AI 활용, 권한 정책에 대한 자주 묻는 질문을 정리합니다.",
    href: "/resources/qna",
    badge: "FAQ",
  },
  {
    title: "국가정보",
    description:
      "국가별 채용시장, 언어, 정착 준비 포인트를 추천 흐름과 연결합니다.",
    href: "/resources/countries",
    badge: "COUNTRY",
  },
  {
    title: "비자정보",
    description:
      "공식 기관 링크와 준비 체크리스트를 행정 로드맵으로 이어줍니다.",
    href: "/resources/visas",
    badge: "VISA",
  },
];

export default function ResourcesPage() {
  const urgentNotices = noticeItems.slice(0, 3);
  const featuredQuestions = qnaItems.slice(0, 4);

  return (
    <PageShell>
      <SiteHeader />

      {/* 커리어 플래너 / 비교 대시보드와 완벽하게 통일된 인디고 보더리스 헤더 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[800px]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              RESOURCE CENTER
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              자료실
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
              해외취업 준비에서 흩어지는 공고, 비자, 정책, 추천 진단 정보를
              하나의 흐름으로 정리합니다. 자료실은 법률 판단이 아니라 공식 출처
              확인과 서비스 사용을 돕는 정보 허브입니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <LinkButton
              href="/resources/notices"
              variant="secondary"
              className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4 py-2"
            >
              공지 보기
            </LinkButton>
            <LinkButton
              href="/resources/visas"
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 text-xs font-semibold shadow-sm transition-all"
            >
              비자정보 보기
            </LinkButton>
          </div>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          {/* 상단 4열 리소스 바로가기 그리드 */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
            {resourceSections.map((section, index) => (
              <Card
                key={section.title}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-indigo-600">
                      0{index + 1}
                    </span>
                    <Badge
                      tone="muted"
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-100 tracking-tighter"
                    >
                      {section.badge}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-base font-bold text-slate-900 tracking-tight">
                    {section.title}
                  </h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500 min-h-[48px]">
                    {section.description}
                  </p>
                </div>
                <div className="mt-4 pt-2">
                  <LinkButton
                    href={section.href}
                    variant="secondary"
                    className="w-full text-center justify-center rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    열기
                  </LinkButton>
                </div>
              </Card>
            ))}
          </div>

          {/* 중간 섹션: 최근 공지 & 자주 묻는 질문 */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] mb-6">
            {/* 최근 공지 */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    NOTICE BRIEF
                  </p>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    최근 공지
                  </h3>
                </div>
                <LinkButton
                  href="/resources/notices"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-[11px] font-semibold bg-white text-slate-600 hover:bg-slate-50 px-3 py-1"
                >
                  전체 공지
                </LinkButton>
              </div>

              <div className="space-y-3">
                {urgentNotices.map((notice) => (
                  <article
                    key={notice.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={notice.priority === "높음" ? "risk" : "muted"}
                        className="rounded-md text-[9px] font-bold px-1.5"
                      >
                        {notice.priority}
                      </Badge>
                      <Badge
                        tone="brand"
                        className="rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5"
                      >
                        {notice.category}
                      </Badge>
                      <span className="text-[10px] font-medium text-slate-400 ml-auto">
                        {notice.date}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-bold text-slate-900 tracking-tight">
                      {notice.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {notice.summary}
                    </p>
                  </article>
                ))}
              </div>
            </Card>

            {/* 자주 묻는 질문 */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    SERVICE Q&A
                  </p>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    자주 묻는 질문
                  </h3>
                </div>
                <LinkButton
                  href="/resources/qna"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-[11px] font-semibold bg-white text-slate-600 hover:bg-slate-50 px-3 py-1"
                >
                  Q&A 전체
                </LinkButton>
              </div>

              <div className="space-y-3">
                {featuredQuestions.map((item) => (
                  <details
                    key={item.question}
                    className="group rounded-xl border border-slate-100 bg-slate-50/50 p-4 open:bg-white open:border-indigo-100 transition-all"
                  >
                    <summary className="cursor-pointer text-xs font-bold text-slate-900 list-none flex items-center justify-between select-none">
                      <span>Q. {item.question}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform text-[10px]">
                        ▼
                      </span>
                    </summary>
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 text-xs leading-relaxed text-slate-500">
                      {item.answer}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <Badge
                          key={tag}
                          tone="muted"
                          className="rounded px-1 py-0 text-[9px] bg-slate-100 text-slate-500 border-none"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </Card>
          </div>

          {/* 하단 섹션: 국가별 준비 포인트 & 비자 흐름 */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            {/* 국가별 준비 포인트 */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    COUNTRY SNAPSHOT
                  </p>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    국가별 준비 포인트
                  </h3>
                </div>
                <LinkButton
                  href="/resources/countries"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-[11px] font-semibold bg-white text-slate-600 hover:bg-slate-50 px-3 py-1"
                >
                  국가정보
                </LinkButton>
              </div>

              <div className="space-y-3">
                {countryGuides.slice(0, 3).map((guide) => (
                  <div
                    key={guide.country}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                        {guide.country}
                      </h4>
                      <Badge
                        tone={
                          guide.preparationDifficulty === "HIGH"
                            ? "risk"
                            : "warning"
                        }
                        className="rounded-lg text-[9px] font-bold px-1.5"
                      >
                        {difficultyLabel(guide.preparationDifficulty)}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {guide.marketSummary}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* 비자정보 연결 흐름 */}
            <Card className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-5">
                <div>
                  <p className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                    VISA TO ROADMAP
                  </p>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight mt-0.5">
                    비자정보 연결 흐름
                  </h3>
                </div>
                <LinkButton
                  href="/resources/visas"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-[11px] font-semibold bg-white text-slate-600 hover:bg-slate-50 px-3 py-1"
                >
                  비자정보
                </LinkButton>
              </div>

              <div className="space-y-3">
                {visaGuides.slice(0, 2).map((guide, index) => (
                  <div
                    key={guide.country}
                    className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 flex gap-3 items-start"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                        {guide.country} {guide.category}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-slate-500">
                        {guide.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-2 flex flex-wrap gap-2">
                <LinkButton
                  href="/roadmap/administration"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4"
                >
                  행정로드맵
                </LinkButton>
                <LinkButton
                  href="/settlement"
                  variant="secondary"
                  className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 shadow-sm px-4"
                >
                  정착 지원
                </LinkButton>
              </div>
            </Card>
          </div>

          {/* 하단 면책조항 카드 */}
          <Card className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <p className="text-[11px] leading-relaxed text-slate-400">
              {resourceDisclaimer}
            </p>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 보통";
  return "준비 난이도 낮음";
}

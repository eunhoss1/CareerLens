"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageShell } from "@/components/ui";

export default function CompaniesPage() {
  const kicker = "COMPANY DOSSIER";
  const title = "기업 상세";
  const description =
    "기업별 공고, 직원 표본, 직무 패턴, 추천 근거를 하나의 dossier로 묶는 확장 화면입니다.";
  const primaryHref = "/jobs";
  const primaryLabel = "공고 조회로";

  const items = [
    {
      title: "기업 공고",
      description: "해당 기업의 수동 조사 공고를 모아 보여줍니다.",
    },
    {
      title: "직원 표본",
      description: "익명화한 실제 직원 표본과 주요 경험 키워드를 정리합니다.",
    },
    {
      title: "직무 패턴",
      description:
        "공고와 직원 표본 기반 PatternProfile을 기업 단위로 요약합니다.",
    },
  ];

  return (
    <PageShell>
      <SiteHeader />

      <main className="bg-slate-50 pb-12">
        {/* 상단 타이틀 영역 스타일 수정 */}
        <section className="max-w-[1200px] mx-auto px-6 pt-8">
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              {/* 보더리스 스타일 적용 (박스 제거, 인디고 컬러 적용) */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                {kicker}
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-2xl">
                {description}
              </p>
            </div>
            <div>
              <LinkButton
                href={primaryHref}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {primaryLabel}
              </LinkButton>
            </div>
          </div>
        </section>

        {/* 하단 아이템 카드 그리드 영역 (기존 유지) */}
        <section className="max-w-[1200px] mx-auto px-6 mt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <Card
                key={index}
                className="rounded-xl border border-slate-200 p-5 shadow-sm bg-white flex flex-col justify-between min-h-[160px]"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5">
                    0{index + 1}. Section
                  </p>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-3 flex justify-between items-center text-[11px] text-slate-400">
                  <span className="font-mono">STATUS</span>
                  <span className="font-bold text-indigo-600 bg-indigo-50/60 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px]">
                    확장 준비 중
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

export default function MembershipCancelPage() {
  return (
    <PageShell>
      <SiteHeader />

      {/* kicker 스타일 정의 */}
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
        kicker={<span className="lens-kicker">MEMBERSHIP CANCELED</span>}
        title="결제가 취소되었습니다"
      />

      <main className="bg-slate-50/60 min-h-[calc(100vh-220px)] flex items-center justify-center py-12">
        <section className="max-w-[540px] w-full mx-auto px-6">
          <Card className="rounded-2xl border border-slate-200/80 p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
            {/* 은은한 앰버 톤 배지 배치 */}
            <span className="inline-flex rounded-lg bg-amber-50 border border-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-4">
              Canceled
            </span>

            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Pro 멤버십 결제가 완료되지 않았습니다.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              필요하면 멤버십 화면에서 다시 결제를 시작할 수 있습니다.
            </p>

            {/* 정돈된 인디고 & 화이트 버튼 레이아웃 */}
            <div className="mt-8 flex justify-center gap-2.5">
              <LinkButton
                href="/membership"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 transition-colors"
              >
                다시 시도
              </LinkButton>
              <LinkButton
                href="/planner"
                variant="secondary"
                className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                로드맵으로
              </LinkButton>
            </div>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

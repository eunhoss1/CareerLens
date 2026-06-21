"use client";

import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

export default function MembershipFailPage() {
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
        kicker={<span className="lens-kicker">PAYMENT FAILED</span>}
        title="결제 승인에 실패했습니다"
      />

      <main className="bg-slate-50/60 min-h-[calc(100vh-220px)] flex items-center justify-center py-12">
        <section className="max-w-[540px] w-full mx-auto px-6">
          <Card className="rounded-2xl border border-slate-200/80 p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.015)] text-center">
            {/* 실패 알림용 가벼운 레드 톤 배지 */}
            <span className="inline-flex rounded-lg bg-red-50 border border-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 mb-4">
              Failed
            </span>

            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              결제 상태를 확인하지 못했습니다.
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              잠시 후 다시 시도하거나, 멤버십 화면에서 현재 플랜을 확인해주세요.
            </p>

            <div className="mt-8 flex justify-center gap-2.5">
              <LinkButton
                href="/membership"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-600/10 hover:bg-indigo-700 transition-colors"
              >
                멤버십 확인
              </LinkButton>
              <LinkButton
                href="/"
                variant="secondary"
                className="rounded-xl border-slate-200 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                홈으로
              </LinkButton>
            </div>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

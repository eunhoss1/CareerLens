"use client";

import { SiteHeader } from "@/components/site-header";
import { Button, Card, PageHeader, PageShell } from "@/components/ui";

export default function MembershipPage() {
  return (
    <PageShell>
      <SiteHeader />

      {/* 보더라인 및 스타일 초기화: 기존 레이아웃을 해치지 않도록 클래스만 적용 */}
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
        kicker={<span className="lens-kicker">MEMBERSHIP UPGRADE</span>}
        title="멤버십"
      />

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* 원본의 데이터 구조 유지 */}
        <section className="mb-10">
          <h3 className="mb-4 text-sm font-bold text-slate-900">
            CURRENT PLAN
          </h3>
          <Card className="grid gap-6 p-8 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">CareerLens Pro</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Pro 이용 중
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Pro 이용 기간: 2026. 8. 3.까지
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                PRO 활성
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] uppercase text-slate-500">
                  커리어 플래너
                </p>
                <p className="text-xl font-bold text-slate-900">21/30회 사용</p>
                <p className="text-xs text-slate-500">9회 남음</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-[10px] uppercase text-slate-500">
                  AI 문서 분석
                </p>
                <p className="text-xl font-bold text-slate-900">
                  12/100회 사용
                </p>
                <p className="text-xs text-slate-500">88회 남음</p>
              </div>
            </div>
          </Card>
        </section>

        {/* 원본의 데이터 구조 유지 */}
        <section>
          <h3 className="mb-4 text-sm font-bold text-slate-900">PRO PASS</h3>
          <Card className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Pro 기간 연장
                </h2>
                <p className="mt-1 text-sm text-slate-500">4,900원 / 30일</p>
                <p className="mt-4 text-xs leading-relaxed text-slate-600">
                  현재 Pro 혜택이 적용되어 있습니다.
                  <br />
                  결제하면 현재 만료일 이후로 30일이 추가됩니다.
                </p>
              </div>
              <Button className="mt-6 md:mt-0 bg-indigo-600 hover:bg-indigo-700">
                Pro 기간 연장하기
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

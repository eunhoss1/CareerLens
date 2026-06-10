import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";

type MembershipSuccessPageProps = {
  searchParams?: Promise<{
    order_id?: string;
    reason?: string;
  }>;
};

export default async function MembershipSuccessPage({ searchParams }: MembershipSuccessPageProps) {
  const params = await searchParams;
  const orderId = params?.order_id;
  const reason = params?.reason;
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
  const duplicateRedirectUrl = orderId
    ? `${apiBaseUrl}/api/payments/kakao/success?order_id=${encodeURIComponent(orderId)}&pg_token=demo-repeat`
    : "";

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader kicker="PAYMENT COMPLETE" title="Pro 멤버십이 활성화되었습니다" />
      <section className="lens-container py-8">
        <Card className="mx-auto max-w-2xl rounded-2xl border-slate-200 p-8 text-center shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-extrabold text-night">결제가 완료되었습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            커리어 플래너 생성과 AI 문서 분석 한도가 Pro 기준으로 적용됩니다.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton href="/membership">멤버십 확인</LinkButton>
            <LinkButton href="/planner" variant="secondary">로드맵으로</LinkButton>
          </div>
          {orderId && (
            <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">Troubleshooting Demo</p>
              <h3 className="mt-2 text-base font-extrabold text-night">성공 리다이렉트 중복 호출 재현</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                발표 영상 촬영용 버튼입니다. 같은 결제 성공 URL을 다시 호출해 중복 승인 처리 문제가
                발생하는 상황을 보여줍니다.
              </p>
              <div className="mt-4 grid gap-2 rounded-lg border border-amber-200 bg-white p-3 text-xs text-slate-600">
                <span>주문 ID: {orderId}</span>
                {reason && <span>처리 상태: {reason}</span>}
              </div>
              <a
                className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-amber-600 px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                href={duplicateRedirectUrl}
              >
                성공 리다이렉트 다시 호출
              </a>
            </div>
          )}
        </Card>
      </section>
    </PageShell>
  );
}

import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, PageHeader, PageShell } from "@/components/ui";
import { RepeatPaymentOnRefresh } from "./repeat-payment-on-refresh";

type MembershipSuccessPageProps = {
  searchParams?: Promise<{
    order_id?: string;
    reason?: string;
  }>;
};

export default async function MembershipSuccessPage({ searchParams }: MembershipSuccessPageProps) {
  const params = await searchParams;
  const orderId = params?.order_id;

  return (
    <PageShell>
      <SiteHeader />
      <RepeatPaymentOnRefresh orderId={orderId} />
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
        </Card>
      </section>
    </PageShell>
  );
}

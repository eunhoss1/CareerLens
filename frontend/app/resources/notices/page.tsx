import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { noticeItems } from "@/lib/resource-guides";

const categoryCounts = noticeItems.reduce<Record<string, number>>((acc, notice) => {
  acc[notice.category] = (acc[notice.category] ?? 0) + 1;
  return acc;
}, {});

export default function NoticesPage() {
  const highPriorityCount = noticeItems.filter((notice) => notice.priority === "높음").length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="NOTICES"
        title="공지사항"
        description="팀 작업 공유, 데이터 정책, 시연 범위, 인증/권한 변경사항을 모아두는 공지 보드입니다. 조원들은 작업 전 dev 변경사항을 먼저 확인하는 용도로 사용합니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/login">로그인 확인</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="전체 공지" value={`${noticeItems.length}건`} helper="자료실 기준" />
          <MetricCard label="중요 공지" value={`${highPriorityCount}건`} helper="dev pull 전 확인" />
          <MetricCard label="서비스 공지" value={`${categoryCounts["서비스"] ?? 0}건`} helper="인증/화면 변경" />
          <MetricCard label="데이터 공지" value={`${categoryCounts["데이터"] ?? 0}건`} helper="공고/패턴 정책" />
        </div>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="TEAM BOARD"
            title="작업 공지 목록"
            description="공지별 대상자와 연결 화면을 함께 표시해 조원들이 영향 범위를 빠르게 확인할 수 있게 했습니다."
          />

          <div className="mt-5 divide-y divide-line border border-line">
            {noticeItems.map((notice) => (
              <article key={notice.id} className="bg-white p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={notice.priority === "높음" ? "warning" : "muted"}>{notice.priority}</Badge>
                      <Badge tone="brand">{notice.category}</Badge>
                      <span className="text-xs font-semibold text-slate-500">{notice.date}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-night">{notice.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{notice.summary}</p>
                    <p className="mt-3 text-xs font-semibold text-slate-500">대상: {notice.audience}</p>
                  </div>
                  <LinkButton href={notice.relatedHref} variant="secondary" className="shrink-0">
                    연결 화면
                  </LinkButton>
                </div>
              </article>
            ))}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="WORKING RULE"
            title="공지 운영 원칙"
            description="이 페이지는 실제 게시판 DB를 붙이기 전까지 발표/협업용 공지 허브로 사용합니다."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <RuleCard title="dev 반영 전 공유" description="공통 파일, 엔티티, DTO, API 변경은 노션과 카톡에 함께 공유합니다." />
            <RuleCard title="충돌 시 덮어쓰기 금지" description="User.java 같은 공통 파일은 dev 변경과 본인 변경을 합쳐서 해결합니다." />
            <RuleCard title="정책성 정보는 공식 링크 우선" description="비자/행정 정보는 자료실에서 공식 출처 확인 링크를 함께 제공합니다." />
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function RuleCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-line bg-panel p-4">
      <h3 className="text-sm font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

import { ResourceBoard, type ResourceBoardPost } from "@/components/resources/resource-board";
import { SiteHeader } from "@/components/site-header";
import { Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { noticeItems } from "@/lib/resource-guides";

const categoryCounts = noticeItems.reduce<Record<string, number>>((acc, notice) => {
  acc[notice.category] = (acc[notice.category] ?? 0) + 1;
  return acc;
}, {});

const noticeBoardPosts: ResourceBoardPost[] = noticeItems.map((notice, index) => ({
  id: notice.id,
  category: notice.category,
  title: notice.title,
  date: notice.date,
  summary: notice.summary,
  body: [
    notice.summary,
    `대상: ${notice.audience}`,
    "이 공지는 캡스톤 시연과 팀 작업 충돌을 줄이기 위해 자료실 게시판에 정리한 내용입니다. 관련 기능을 작업하는 조원은 연결 화면과 변경 파일을 먼저 확인한 뒤 작업해주세요.",
    "실제 운영 단계에서는 게시글 작성, 수정, 삭제, 첨부파일, 댓글 기능을 백엔드 DB와 연결할 수 있습니다."
  ],
  author: "CareerLens 운영",
  views: 152 - index * 17,
  priority: notice.priority,
  pinned: notice.priority === "높음",
  relatedHref: notice.relatedHref,
  tags: [notice.category, notice.priority, notice.audience]
}));

export default function NoticesPage() {
  const highPriorityCount = noticeItems.filter((notice) => notice.priority === "높음").length;

  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="NOTICE BOARD"
        title="공지사항"
        description="팀 작업 공유, 데이터 정책, 시연 범위, 인증/권한 변경사항을 실제 게시판 구조로 확인합니다. 검색과 카테고리 필터를 사용해 영향 범위를 빠르게 찾을 수 있습니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/login">로그인 확인</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="전체 공지" value={`${noticeItems.length}건`} helper="게시판 등록" />
          <MetricCard label="상단 고정" value={`${highPriorityCount}건`} helper="dev pull 전 확인" />
          <MetricCard label="분류" value={`${Object.keys(categoryCounts).length}개`} helper="서비스/데이터/정책" />
          <MetricCard label="운영 방식" value="목록+상세" helper="게시판형 UI" />
        </div>

        <div className="mt-6">
          <ResourceBoard posts={noticeBoardPosts} />
        </div>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="BOARD POLICY"
            title="공지 게시판 운영 기준"
            description="현재는 프론트 정적 데이터 기반이지만, 화면 구조는 실제 게시판처럼 확장할 수 있도록 목록, 검색, 상세 패널 기준으로 설계했습니다."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <RuleCard title="dev 반영 전 공유" description="공통 파일, 엔티티, DTO, API 변경은 노션과 카톡에 함께 공유합니다." />
            <RuleCard title="충돌 시 덮어쓰기 금지" description="User.java 같은 공통 파일은 dev 변경과 본인 변경을 합쳐서 해결합니다." />
            <RuleCard title="운영 확장 가능" description="후속 단계에서 게시글 DB, 작성 권한, 첨부파일, 댓글 기능을 붙일 수 있습니다." />
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

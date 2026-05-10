import { ResourceBoard, type ResourceBoardPost } from "@/components/resources/resource-board";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { qnaItems } from "@/lib/resource-guides";

const topicGroups = [
  { title: "추천 진단", description: "공고, 사용자 프로필, PatternProfile을 비교하는 핵심 엔진 설명" },
  { title: "AI 활용", description: "설명 생성, 로드맵 과제 생성, 문서 분석에 AI를 사용하는 방식" },
  { title: "인증/권한", description: "JWT, USER/ADMIN 권한, 관리자 API 보호 정책 설명" },
  { title: "비자/정책", description: "공식 링크와 준비 체크리스트를 제공한다는 원칙" }
];

const qnaBoardPosts: ResourceBoardPost[] = qnaItems.map((item, index) => ({
  id: `qna-${String(index + 1).padStart(3, "0")}`,
  category: item.tags[0] ?? "기타",
  title: item.question,
  date: `2026.05.${String(10 - Math.min(index, 5)).padStart(2, "0")}`,
  summary: item.answer,
  body: [
    item.answer,
    "발표 중 같은 질문이 나오면 이 답변을 기준으로 설명하고, 필요하면 연결 화면으로 이동해 실제 흐름을 보여주면 됩니다.",
    "후속 단계에서는 사용자 질문 등록, 답변 상태 관리, 관리자 답변 작성 기능을 DB 기반으로 연결할 수 있습니다."
  ],
  author: "CareerLens 팀",
  views: 98 - index * 9,
  status: "답변완료",
  pinned: index < 2,
  tags: item.tags,
  relatedHref: item.relatedHref
}));

export default function QnaPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="Q&A BOARD"
        title="Q&A"
        description="CareerLens의 추천 구조, 데이터 정책, AI 활용, 인증/권한, 비자정보 제공 원칙을 게시판 구조로 정리했습니다. 검색과 카테고리 필터로 발표 답변을 빠르게 찾을 수 있습니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/jobs/recommendation">추천 진단</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="등록 질문" value={`${qnaItems.length}건`} helper="시연용 Q&A" />
          <MetricCard label="답변 상태" value="100%" helper="답변완료" />
          <MetricCard label="주요 주제" value={`${topicGroups.length}개`} helper="추천/AI/권한/비자" />
          <MetricCard label="운영 방식" value="목록+상세" helper="게시판형 UI" />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topicGroups.map((topic) => (
            <Card key={topic.title} className="p-5">
              <Badge tone="brand">{topic.title}</Badge>
              <p className="mt-3 text-sm leading-6 text-slate-600">{topic.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <ResourceBoard posts={qnaBoardPosts} apiType="QNA" allowQuestion emptyMessage="조건에 맞는 질문이 없습니다." />
        </div>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="PRESENTATION TIP"
            title="발표 답변 기준"
            description="CareerLens는 해외취업 준비 흐름을 데이터 기반으로 정리하고, AI를 설명/요약/로드맵 생성 보조에 붙인 시연용 프로토타입입니다."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Tip title="데이터" description="공고와 직원 표본은 수동 조사 또는 공개 API를 관리자 검수 후 사용합니다." />
            <Tip title="추천" description="사용자 프로필과 공고별 PatternProfile을 비교해 추천과 부족 요소를 산출합니다." />
            <Tip title="AI" description="AI는 추천 점수 계산이 아니라 설명, 요약, 로드맵 과제 생성에 사용합니다." />
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function Tip({ title, description }: { title: string; description: string }) {
  return (
    <div className="border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-night">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

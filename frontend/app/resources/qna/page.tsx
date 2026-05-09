import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { qnaItems } from "@/lib/resource-guides";

const topicGroups = [
  { title: "추천 진단", description: "공고, 사용자 프로필, PatternProfile을 비교하는 핵심 엔진 설명" },
  { title: "AI 활용", description: "점수 계산이 아니라 설명 생성, 로드맵 과제 생성, 문서 분석에 AI를 사용하는 방식" },
  { title: "인증/권한", description: "JWT, USER/ADMIN 권한, 관리자 API 보호 정책 설명" },
  { title: "비자/정책", description: "법률 판단이 아니라 공식 링크와 준비 체크리스트를 제공한다는 원칙" }
];

export default function QnaPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="Q&A"
        title="Q&A"
        description="CareerLens의 추천 구조, 데이터 정책, AI 활용, 인증/권한, 비자정보 제공 원칙을 발표 때 바로 설명할 수 있도록 정리했습니다."
        actions={
          <>
            <LinkButton href="/resources" variant="secondary">자료실</LinkButton>
            <LinkButton href="/jobs/recommendation">추천 진단</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {topicGroups.map((topic) => (
            <Card key={topic.title} className="p-5">
              <Badge tone="brand">{topic.title}</Badge>
              <p className="mt-3 text-sm leading-6 text-slate-600">{topic.description}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="FREQUENT QUESTIONS"
            title="자주 묻는 질문"
            description="각 질문은 연결 화면을 포함합니다. 시연 중 질문을 받으면 해당 화면으로 바로 이동해 흐름을 보여줄 수 있습니다."
          />

          <div className="mt-5 space-y-3">
            {qnaItems.map((item, index) => (
              <details key={item.question} className="group border border-line bg-panel p-5" open={index === 0}>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <span className="text-xs font-bold text-brand">Q{index + 1}</span>
                      <h2 className="mt-2 text-lg font-semibold text-night">{item.question}</h2>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} tone="muted">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </summary>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="text-sm leading-7 text-slate-700">{item.answer}</p>
                  {item.relatedHref && (
                    <div className="mt-4">
                      <LinkButton href={item.relatedHref} variant="secondary">관련 화면 보기</LinkButton>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Card>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="PRESENTATION TIP"
            title="발표 답변 기준"
            description="CareerLens는 모든 것을 자동화한 서비스가 아니라, 해외취업 준비 흐름을 데이터 기반으로 정리하고 AI를 설명/실행 보조에 붙인 시연용 프로토타입입니다."
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

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";

const modules = [
  {
    title: "커리어 플래너",
    href: "/planner",
    status: "운영",
    description: "추천 진단 결과의 부족 요소를 주차별 준비 과제로 바꾸고 완료 상태를 저장합니다.",
    bullets: ["로드맵 목록", "주차별 과제", "AI 보조 과제 생성", "지원 관리 전환"]
  },
  {
    title: "AI 문서 분석",
    href: "/roadmap/employment/documents",
    status: "예정",
    description: "이력서, 자기소개서, 포트폴리오, GitHub 내용을 공고 요구사항 기준으로 분석합니다.",
    bullets: ["이력서 피드백", "자기소개서 보완", "포트폴리오 증빙", "GitHub 프로젝트 요약"]
  },
  {
    title: "기업 지원 관리",
    href: "/applications",
    status: "운영",
    description: "플래너에서 넘긴 목표 공고를 지원 준비, 지원 완료, 면접 준비 단계로 관리합니다.",
    bullets: ["관심 공고", "서류 준비", "지원 상태", "다음 액션"]
  }
];

export default function EmploymentRoadmapPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="EMPLOYMENT ROADMAP"
        title="취업로드맵"
        description="커리어 플래너, AI 문서 분석, 기업 지원 관리를 하나의 취업 준비 흐름으로 묶습니다."
        actions={<LinkButton href="/planner">로드맵 목록으로</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <StepCard index={1} title="추천 진단" description="맞춤추천에서 공고별 부족 요소와 준비도를 진단합니다." />
          <StepCard index={2} title="취업 준비" description="부족 요소를 플래너 과제와 문서 보완 항목으로 전환합니다." />
          <StepCard index={3} title="지원 관리" description="준비된 공고를 지원 파이프라인으로 넘겨 상태를 추적합니다." />
        </div>

        <SectionHeader
          kicker="ROADMAP MODULES"
          title="취업로드맵 하위 기능"
          description="사용자가 실제 웹사이트처럼 depth를 따라 들어가며 준비 과정을 관리할 수 있도록 세 개의 하위 기능으로 나눴습니다."
        />

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="flex min-h-[330px] flex-col p-5 transition hover:border-night hover:shadow-dossier">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold tracking-[0.16em] text-brand">MODULE</p>
                    <h2 className="mt-2 text-xl font-semibold text-night">{module.title}</h2>
                  </div>
                  <Badge tone={module.status === "운영" ? "success" : "warning"}>{module.status}</Badge>
                </div>

                <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{module.description}</p>

                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-xs font-bold text-slate-500">포함 기능</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {module.bullets.map((bullet) => (
                      <Badge key={bullet} tone="muted">{bullet}</Badge>
                    ))}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">AI 연결 지점</Badge>
            <Badge tone="muted">커리어 플래너 생성</Badge>
            <Badge tone="muted">문서 분석 예정</Badge>
            <Badge tone="muted">GitHub 분석 예정</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            현재 AI는 커리어 플래너 과제 생성에 먼저 연결되어 있습니다. 다음 확장에서는 이력서, 자기소개서,
            포트폴리오, GitHub 프로젝트를 공고 요구사항과 비교해 부족한 증빙과 개선 문장을 제안하는 구조로 붙입니다.
          </p>
        </Card>
      </section>
    </PageShell>
  );
}

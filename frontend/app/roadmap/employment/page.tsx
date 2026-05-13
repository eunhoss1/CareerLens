import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, StepCard } from "@/components/ui";

const modules = [
  {
    title: "커리어 플래너",
    href: "/planner",
    description: "추천 공고에 맞춰 주차별 준비 과제와 완료율을 관리합니다.",
    bullets: ["로드맵 목록", "주차별 과제", "완료율 확인", "지원 관리 전환"]
  },
  {
    title: "AI 문서 분석",
    href: "/roadmap/employment/documents",
    description: "이력서, 자기소개서, 포트폴리오 내용을 공고 요구사항과 비교합니다.",
    bullets: ["이력서 피드백", "자기소개서 보완", "포트폴리오 증빙", "GitHub 요약"]
  },
  {
    title: "기업 지원 관리",
    href: "/applications",
    description: "준비한 공고를 지원 단계로 넘기고 서류와 면접 준비 상태를 추적합니다.",
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
        description="추천 공고를 준비 과제, 문서 점검, 지원 관리 흐름으로 연결합니다."
        actions={<LinkButton href="/planner">로드맵 목록으로</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <StepCard index={1} title="추천 진단" description="맞춤추천에서 공고별 부족 요소와 준비도를 진단합니다." />
          <StepCard index={2} title="취업 준비" description="부족 요소를 플래너 과제와 문서 보완 항목으로 전환합니다." />
          <StepCard index={3} title="지원 관리" description="준비된 공고를 지원 파이프라인으로 넘겨 상태를 추적합니다." />
        </div>

        <div className="mt-8">
          <p className="text-xs font-extrabold tracking-[0.14em] text-brand">CAREER WORKSPACE</p>
          <h2 className="mt-2 text-2xl font-bold text-night">취업 준비 작업실</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">진단 결과를 실제 제출 준비까지 이어가기 위한 주요 작업을 선택하세요.</p>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {modules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className="flex min-h-[270px] flex-col rounded-2xl border-slate-200 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_22px_60px_rgba(15,23,42,0.10)]">
                <h2 className="text-xl font-bold text-night">{module.title}</h2>

                <p className="mt-4 flex-1 text-sm leading-6 text-slate-600">{module.description}</p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mt-3 flex flex-wrap gap-2">
                    {module.bullets.map((bullet) => (
                      <Badge key={bullet} tone="muted">{bullet}</Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-sm font-bold text-brand">바로가기</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

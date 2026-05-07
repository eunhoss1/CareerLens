import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader, StepCard } from "@/components/ui";
import { countryGuides, resourceDisclaimer, visaGuides } from "@/lib/resource-guides";

const resourceSections = [
  {
    title: "국가정보",
    description: "미국/일본 취업 시장, 언어, 비자, 정착 준비를 한 번에 확인합니다.",
    href: "/resources/countries"
  },
  {
    title: "비자정보",
    description: "공식기관 확인 원칙과 국가별 기본 체크리스트를 행정로드맵으로 연결합니다.",
    href: "/resources/visas"
  },
  {
    title: "맞춤 피드",
    description: "사용자 프로필과 추천 부족 요소를 준비 자료로 연결하는 확장 화면입니다.",
    href: "/recommendations/feed"
  }
];

export default function ResourcesPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="RESOURCE CENTER"
        title="자료실"
        description="해외취업 준비 정보가 파편화되어 있다는 문제를 해결하기 위해 국가, 비자, 정착, 추천 피드를 하나의 흐름으로 연결합니다."
        actions={<LinkButton href="/resources/visas">비자정보 보기</LinkButton>}
      />

      <section className="lens-container py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {resourceSections.map((section, index) => (
            <Card key={section.title} className="p-5">
              <span className="text-xs font-bold text-brand">0{index + 1}</span>
              <h2 className="mt-3 text-lg font-semibold text-night">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
              <div className="mt-4">
                <LinkButton href={section.href} variant="secondary">열기</LinkButton>
              </div>
            </Card>
          ))}
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Card className="p-5">
            <SectionHeader kicker="COUNTRY SNAPSHOT" title="국가별 준비 포인트" />
            <div className="mt-5 grid gap-3">
              {countryGuides.map((guide) => (
                <div key={guide.country} className="border border-line bg-panel p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-night">{guide.country}</h3>
                    <Badge tone={guide.preparationDifficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.preparationDifficulty)}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{guide.marketSummary}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader kicker="VISA TO ROADMAP" title="비자정보 연결 흐름" />
            <div className="mt-5 grid gap-3">
              {visaGuides.map((guide) => (
                <StepCard key={guide.country} index={guide.country === "미국" ? 1 : 2} title={`${guide.country} ${guide.category}`} description={guide.officialReminder} />
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <LinkButton href="/roadmap/administration" variant="secondary">행정로드맵</LinkButton>
              <LinkButton href="/settlement" variant="subtle">정착지원</LinkButton>
            </div>
          </Card>
        </section>

        <Card className="mt-6 p-5">
          <p className="text-xs leading-5 text-slate-500">{resourceDisclaimer}</p>
        </Card>
      </section>
    </PageShell>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 중간";
  return "준비 난이도 낮음";
}

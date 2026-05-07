import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader, TimelineCard } from "@/components/ui";
import { resourceDisclaimer, visaGuides } from "@/lib/resource-guides";

export default function VisasPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="VISA GUIDE"
        title="비자정보"
        description="비자 정보는 최신성이 중요하므로 CareerLens는 공식기관 확인 원칙과 수동 검수 체크리스트를 행정로드맵으로 연결합니다."
        actions={<LinkButton href="/roadmap/administration">행정로드맵으로</LinkButton>}
      />

      <section className="lens-container py-6">
        <section className="border-l border-night pl-4">
          <div className="space-y-4">
            {visaGuides.map((guide) => (
              <TimelineCard key={guide.country} label={guide.country} title={guide.category}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <Badge tone="brand">{guide.targetUser}</Badge>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{guide.officialReminder}</p>
                    <ul className="mt-4 space-y-2">
                      {guide.checklist.map((item) => (
                        <li key={item} className="text-sm leading-6 text-slate-700">- {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="min-w-52 border border-line bg-panel p-4">
                    <p className="text-xs font-bold text-slate-500">연결 화면</p>
                    <div className="mt-3 flex flex-col gap-2">
                      <LinkButton href="/roadmap/administration" variant="secondary">행정로드맵</LinkButton>
                      <LinkButton href="/settlement" variant="subtle">정착 체크리스트</LinkButton>
                    </div>
                  </div>
                </div>
              </TimelineCard>
            ))}
          </div>
        </section>

        <Card className="mt-6 p-5">
          <SectionHeader
            kicker="AI POLICY"
            title="AI 활용 원칙"
            description="AI는 비자 조건을 판정하지 않고, 공식 자료를 읽기 쉽게 요약하거나 사용자의 체크리스트 우선순위를 정리하는 보조 기능으로만 사용합니다."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">No legal decision</Badge>
            <Badge tone="muted">Official source first</Badge>
            <Badge tone="brand">Checklist summary</Badge>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{resourceDisclaimer}</p>
        </Card>
      </section>
    </PageShell>
  );
}

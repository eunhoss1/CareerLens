import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { countryGuides, resourceDisclaimer } from "@/lib/resource-guides";

export default function CountriesPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="COUNTRY GUIDE"
        title="국가정보"
        description="미국과 일본의 해외취업 준비 포인트를 추천 진단, 행정로드맵, 정착지원과 연결해 보여줍니다."
        actions={
          <>
            <LinkButton href="/recommendations/compare" variant="secondary">비교 대시보드</LinkButton>
            <LinkButton href="/settlement">정착 지원으로</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {countryGuides.map((guide) => (
            <Card key={guide.country} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="lens-kicker">COUNTRY DOSSIER</p>
                  <h2 className="mt-3 text-2xl font-semibold text-night">{guide.country}</h2>
                </div>
                <Badge tone={guide.preparationDifficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.preparationDifficulty)}</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{guide.marketSummary}</p>

              <div className="mt-5 grid gap-3">
                <InfoBlock label="주요 언어" value={guide.primaryLanguage} />
                <InfoBlock label="비자 확인 포인트" value={guide.visaFocus} />
                <InfoBlock label="정착 준비 포인트" value={guide.settlementFocus} />
              </div>

              <section className="mt-5 border border-line bg-panel p-4">
                <SectionHeader kicker="OFFICIAL LINKS" title="공식 확인 링크" />
                <div className="mt-4 grid gap-3">
                  {guide.links.map((link) => (
                    <a key={link.href} href={link.href} target="_blank" rel="noreferrer" className="block border border-line bg-white p-4 transition hover:border-night">
                      <p className="text-sm font-semibold text-night">{link.label}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{link.description}</p>
                    </a>
                  ))}
                </div>
              </section>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/resources/visas" variant="secondary">비자정보로</LinkButton>
            <LinkButton href="/roadmap/administration" variant="subtle">행정로드맵으로</LinkButton>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">{resourceDisclaimer}</p>
        </Card>
      </section>
    </PageShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-panel p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 중간";
  return "준비 난이도 낮음";
}

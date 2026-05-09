import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageHeader, PageShell, SectionHeader } from "@/components/ui";
import { countryGuides, resourceDisclaimer } from "@/lib/resource-guides";

export default function CountriesPage() {
  return (
    <PageShell>
      <SiteHeader />
      <PageHeader
        kicker="COUNTRY GUIDE"
        title="국가정보"
        description="국가별 채용시장 신호, 언어, 비자 확인 포인트, 정착 준비 항목을 추천 진단 이후 흐름과 연결합니다. 현재는 발표용 정리 데이터이며, 최종 판단은 공식 출처 확인이 필요합니다."
        actions={
          <>
            <LinkButton href="/recommendations/compare" variant="secondary">비교대시보드</LinkButton>
            <LinkButton href="/settlement">정착 지원</LinkButton>
          </>
        }
      />

      <section className="lens-container py-6">
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="정리 국가" value={`${countryGuides.length}개`} helper="시연용 국가 가이드" />
          <MetricCard label="핵심 기준" value="채용·비자·정착" helper="추천 이후 연결" />
          <MetricCard label="공식 링크" value="국가별 제공" helper="최종 확인 경로" />
          <MetricCard label="AI 활용" value="요약 보조" helper="판정 대신 설명" />
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {countryGuides.map((guide) => (
            <Card key={guide.country} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="lens-kicker">COUNTRY DOSSIER</p>
                  <h2 className="mt-3 text-2xl font-semibold text-night">
                    {guide.country}
                    <span className="ml-2 text-sm font-semibold text-brand">{guide.code}</span>
                  </h2>
                </div>
                <Badge tone={guide.preparationDifficulty === "HIGH" ? "risk" : "warning"}>{difficultyLabel(guide.preparationDifficulty)}</Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-700">{guide.marketSummary}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <InfoBlock label="주요 언어" value={guide.primaryLanguage} />
                <InfoBlock label="비자 확인 포인트" value={guide.visaFocus} />
                <InfoBlock label="정착 준비 포인트" value={guide.settlementFocus} />
                <InfoBlock label="대표 직무" value={guide.commonRoles.join(", ")} />
              </div>

              <section className="mt-5 grid gap-4 md:grid-cols-2">
                <Checklist title="채용 신호" items={guide.hiringSignals} />
                <Checklist title="프로필 입력 팁" items={guide.profileTips} />
              </section>

              <section className="mt-5 border border-line bg-panel p-4">
                <SectionHeader kicker="OFFICIAL LINKS" title="공식 확인 링크" />
                <div className="mt-4 grid gap-3">
                  {guide.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block border border-line bg-white p-4 transition hover:border-night"
                    >
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

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-night">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function difficultyLabel(value: string) {
  if (value === "HIGH") return "준비 난이도 높음";
  if (value === "MEDIUM") return "준비 난이도 보통";
  return "준비 난이도 낮음";
}

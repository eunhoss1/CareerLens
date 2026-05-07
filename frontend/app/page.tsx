import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, MetricCard, PageShell, ScoreBar, SectionHeader, StepCard } from "@/components/ui";
import { mainMenus, menuFlow, statusLabel, statusTone } from "@/lib/menu";

const menuCodes = ["JOBS", "MATCH", "ROADMAP", "MY", "DATA"];

const evidenceRows = [
  ["공고", "수동 조사", "회사/국가/직무/기술/언어/비자 조건"],
  ["직원 표본", "익명화", "경력/학력/기술/프로젝트 경험"],
  ["PatternProfile", "검수 데이터", "공고와 직원 표본 기반 합격자 패턴"],
  ["진단 결과", "DB 저장", "추천 이유/부족 요소/준비도/다음 액션"]
];

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <section className="border-b border-line bg-paper">
        <div className="lens-container grid min-h-[650px] gap-10 py-14 lg:grid-cols-[1fr_500px] lg:items-center">
          <div>
            <span className="lens-kicker">OVERSEAS CAREER DIAGNOSIS</span>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-night md:text-6xl">
              해외취업 준비도를 공고와 사람의 패턴으로 읽어내는 CareerLens
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-700">
              CareerLens는 수동 조사한 해외 채용공고, 익명화한 직원 표본, 공고별 PatternProfile을 연결해
              구직자에게 맞는 공고와 부족 요소, 실행 로드맵을 제시하는 데이터 기반 해외취업 진단 플랫폼입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/jobs/recommendation">추천 진단 시작</LinkButton>
              <LinkButton href="/jobs" variant="secondary">전체 공고 보기</LinkButton>
            </div>

            <div className="mt-10 grid max-w-3xl grid-cols-3 border border-line bg-white">
              <HeroStat label="수동 조사 공고" value="4+" />
              <HeroStat label="직원 표본" value="6+" />
              <HeroStat label="패턴 프로필" value="12+" />
            </div>
          </div>

          <Card className="shadow-dossier">
            <div className="border-b border-night bg-[#dce9dd] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-[0.16em] text-night">CAREER DOSSIER</p>
                <Badge tone="default">DEMO REPORT</Badge>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-[104px_1fr] gap-4 border-b border-line pb-5">
                <div className="grid h-24 place-items-center border border-line bg-panel text-4xl font-black text-brand">88</div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">추천 후보 1순위</p>
                  <h2 className="mt-2 text-2xl font-semibold text-night">Backend Engineer</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    공고별 평가기준과 사용자 우선순위를 반영한 종합 추천 점수입니다.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <ScoreBar label="합격 가능성" value={82} tone="brand" />
                <ScoreBar label="직무 적합도" value={88} tone="success" />
                <ScoreBar label="연봉 매력도" value={78} tone="warning" />
                <ScoreBar label="워라밸" value={63} tone="risk" />
              </div>

              <div className="mt-6 border border-line bg-panel p-4">
                <p className="text-xs font-bold text-slate-500">NEXT ACTION</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  부족 기술과 포트폴리오 보완 항목을 AI 보조 커리어 플래너로 전환합니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="lens-container py-10">
        <div className="grid gap-3 md:grid-cols-5">
          {menuFlow.map((step, index) => (
            <StepCard key={step} index={index + 1} title={step} description={flowDescription(index)} />
          ))}
        </div>
      </section>

      <section className="lens-container grid gap-6 pb-12 lg:grid-cols-[1fr_420px]">
        <div>
          <SectionHeader
            kicker="SERVICE MAP"
            title="CareerLens 메뉴 구조"
            description="채용공고 탐색, 맞춤추천 진단, 준비로드맵, 마이페이지, 자료실을 하나의 해외취업 준비 흐름으로 연결합니다."
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mainMenus.map((service, index) => (
              <Link key={service.title} href={service.href}>
                <Card className="group flex min-h-[250px] flex-col p-5 transition hover:border-night hover:shadow-dossier">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.16em] text-brand">{menuCodes[index]}</span>
                    <Badge tone={statusTone(service.status)}>
                      {statusLabel(service.status)}
                    </Badge>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-night">{service.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.summary}</p>
                  <div className="mt-5 border-t border-line pt-4">
                    <p className="text-xs font-semibold text-slate-500">{service.children.length}개 하위 메뉴</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {service.children.slice(0, 3).map((child) => (
                        <Badge key={child.title} tone="muted">{child.title}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <EvidencePanel />
      </section>
    </PageShell>
  );
}

function EvidencePanel() {
  return (
    <aside className="h-fit border border-night bg-white">
      <div className="border-b border-night bg-night px-5 py-4 text-white">
        <p className="text-xs font-bold tracking-[0.16em]">DATA EVIDENCE</p>
        <h2 className="mt-2 text-xl font-semibold">추천 엔진 데이터 근거</h2>
      </div>
      <div className="divide-y divide-line">
        {evidenceRows.map(([name, type, detail]) => (
          <div key={name} className="grid grid-cols-[82px_82px_1fr] gap-3 px-5 py-4 text-sm">
            <span className="font-semibold text-night">{name}</span>
            <span className="text-slate-500">{type}</span>
            <span className="leading-6 text-slate-600">{detail}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return <MetricCard label={label} value={value} />;
}

function flowDescription(index: number) {
  const descriptions = [
    "사용자 계정과 프로필 데이터를 저장합니다.",
    "해외취업 목표, 기술스택, 언어, 우선순위를 입력합니다.",
    "공고와 PatternProfile을 비교해 추천 결과를 생성합니다.",
    "부족 요소를 취업/출국/행정 로드맵으로 전환합니다.",
    "지원 상태와 정착 준비 항목을 이어서 관리합니다."
  ];
  return descriptions[index] ?? "";
}

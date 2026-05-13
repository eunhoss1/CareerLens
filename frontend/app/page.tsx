import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell, ScoreBar } from "@/components/ui";
import { mainMenus } from "@/lib/menu";

const heroStats = [
  { label: "추천 후보", value: "Top 5", helper: "프로필 기준 선별" },
  { label: "진단 항목", value: "5개", helper: "기술·경력·언어·증빙" },
  { label: "다음 단계", value: "로드맵", helper: "과제와 지원관리 연결" }
];

const processSteps = [
  {
    step: "01",
    title: "프로필 입력",
    description: "희망 국가, 직무, 경력, 기술스택, 언어, 포트폴리오 정보를 정리합니다."
  },
  {
    step: "02",
    title: "공고·패턴 비교",
    description: "수동 조사 공고와 PatternProfile을 기준으로 사용자 프로필을 비교합니다."
  },
  {
    step: "03",
    title: "추천 진단",
    description: "지원 가능성, 직무 적합도, 부족 요소를 공고별로 산출합니다."
  },
  {
    step: "04",
    title: "실행 로드맵",
    description: "부족 요소를 주차별 준비 과제와 지원 워크스페이스로 연결합니다."
  }
];

const evidenceItems = [
  ["공고 데이터", "회사, 국가, 직무, 기술, 언어, 비자 조건"],
  ["직원 표본", "학력, 경력, 기술스택, 프로젝트 경험"],
  ["PatternProfile", "공고와 표본을 조합한 직무별 합격자 패턴"],
  ["진단 결과", "추천 이유, 부족 요소, 준비도, 다음 액션"]
];

const primaryMenus = mainMenus.slice(0, 5);

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <main>
        <section className="border-b border-line bg-[#f7f9f5]">
          <div className="lens-container grid min-h-[calc(100vh-76px)] gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <span className="lens-kicker">CAREERLENS</span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-night md:text-6xl">
                해외취업 준비도를 공고와 합격자 패턴으로 진단합니다
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">
                CareerLens는 구직자 프로필을 해외 채용공고, 직원 표본, PatternProfile과 비교해
                지원할 공고와 보완할 역량, 다음 준비 로드맵을 한 번에 정리합니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/jobs/recommendation" className="rounded-xl px-5">
                  적합도 진단 시작
                </LinkButton>
                <LinkButton href="/jobs" variant="secondary" className="rounded-xl px-5">
                  전체 공고 보기
                </LinkButton>
              </div>

              <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-bold text-night">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroWorkbench />
          </div>
        </section>

        <section className="lens-container py-12">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="lens-kicker">SERVICE FLOW</span>
              <h2 className="mt-4 text-3xl font-bold text-night">추천에서 지원 준비까지 이어지는 흐름</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              발표 시연에서는 회원가입, 프로필 입력, 적합도 진단, 커리어 플래너, 지원관리로 이어지는 핵심 흐름을 보여줍니다.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((item) => (
              <Card key={item.step} className="rounded-2xl p-5">
                <span className="rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-brand">{item.step}</span>
                <h3 className="mt-4 text-xl font-semibold text-night">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-white">
          <div className="lens-container grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
            <div>
              <span className="lens-kicker">MENU</span>
              <h2 className="mt-4 text-3xl font-bold text-night">CareerLens 주요 서비스</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-2">
                {primaryMenus.map((menu) => (
                  <Link key={menu.title} href={menu.href} className="group block">
                    <Card className="flex min-h-[190px] flex-col rounded-2xl p-5 transition group-hover:-translate-y-0.5 group-hover:border-brand group-hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-night">{menu.title}</h3>
                        <span className="text-sm font-bold text-brand">바로가기</span>
                      </div>
                      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{menu.summary}</p>
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                        {menu.children.slice(0, 3).map((child) => (
                          <Badge key={child.title} tone="muted">{child.title}</Badge>
                        ))}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            <EvidencePanel />
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function HeroWorkbench() {
  return (
    <Card className="rounded-3xl border-slate-200 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.10)]">
      <div className="rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-brand">DIAGNOSIS REPORT</p>
            <h2 className="mt-3 text-2xl font-bold leading-8 text-night">Northstar Security</h2>
            <p className="mt-1 text-sm text-slate-600">Cloud Backend Engineer · 미국 · 하이브리드</p>
          </div>
          <div className="rounded-2xl bg-night px-5 py-4 text-right text-white">
            <p className="text-xs font-bold text-white/60">TOTAL</p>
            <p className="mt-1 text-4xl font-black">82</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ScoreBar label="합격 가능성" value={82} tone="brand" />
          <ScoreBar label="직무 적합도" value={88} tone="success" />
          <ScoreBar label="연봉 매력도" value={78} tone="warning" />
          <ScoreBar label="워라밸" value={63} tone="risk" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">부족 요소</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="warning">Distributed Systems</Badge>
            <Badge tone="warning">GitHub 공개 저장소</Badge>
            <Badge tone="warning">포트폴리오 사례</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            부족 요소는 커리어 플래너의 주차별 과제로 전환되고, 지원관리에서 제출 준비 상태로 이어집니다.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">다음 액션</p>
          <p className="mt-3 text-xl font-bold text-night">8주 로드맵</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">기술 보완과 지원 문서 점검을 함께 진행합니다.</p>
        </div>
      </div>
    </Card>
  );
}

function EvidencePanel() {
  return (
    <aside className="h-fit rounded-3xl border border-night bg-night p-5 text-white">
      <p className="text-xs font-bold tracking-[0.16em] text-cyan-100">DATA EVIDENCE</p>
      <h2 className="mt-3 text-2xl font-bold">추천 엔진의 기준 데이터</h2>
      <div className="mt-6 space-y-3">
        {evidenceItems.map(([name, detail]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold text-white">{name}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{detail}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

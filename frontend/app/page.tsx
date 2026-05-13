import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell, ScoreBar } from "@/components/ui";

const heroStats = [
  { label: "추천 후보", value: "Top 5", helper: "프로필 기준 선별" },
  { label: "진단 항목", value: "5개", helper: "기술, 경력, 언어, 증빙" },
  { label: "실행 연결", value: "로드맵", helper: "과제와 지원관리까지" }
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
    title: "적합도 진단",
    description: "지원 가능성, 직무 적합도, 부족 요소를 공고별로 산출합니다."
  },
  {
    step: "04",
    title: "실행 로드맵",
    description: "부족 요소를 주차별 준비 과제와 지원 워크스페이스로 연결합니다."
  }
];

const serviceCards = [
  {
    label: "JOBS",
    title: "채용공고",
    description: "검수한 해외 공고와 공개 API 후보를 국가, 직무군, 기술스택 기준으로 확인합니다.",
    href: "/jobs",
    tone: "blue",
    tags: ["전체 공고", "필터 검색", "로드맵 생성"]
  },
  {
    label: "MATCH",
    title: "맞춤추천",
    description: "내 프로필과 공고별 PatternProfile을 비교해 지원 우선순위와 부족 요소를 보여줍니다.",
    href: "/jobs/recommendation",
    tone: "coral",
    tags: ["적합도 진단", "부족 요소", "추천 근거"]
  },
  {
    label: "ROADMAP",
    title: "준비로드맵",
    description: "추천 결과를 커리어 플래너, 문서 분석, 지원 관리 흐름으로 이어갑니다.",
    href: "/roadmap/employment",
    tone: "mint",
    tags: ["커리어 플래너", "AI 문서 분석", "지원 관리"]
  },
  {
    label: "MY",
    title: "마이페이지",
    description: "해외취업 프로필, 관심 공고, 검증 배지와 계정 정보를 한 곳에서 관리합니다.",
    href: "/mypage",
    tone: "violet",
    tags: ["내 프로필", "검증 배지", "관심 공고"]
  },
  {
    label: "DATA",
    title: "자료실",
    description: "국가별 취업 정보, 비자 정보, 공지와 Q&A를 해외취업 준비 자료로 제공합니다.",
    href: "/resources",
    tone: "slate",
    tags: ["국가정보", "비자정보", "Q&A"]
  }
];

const evidenceItems = [
  ["공고 데이터", "국가, 직무, 기술스택, 경력, 비자 조건"],
  ["합격자 패턴", "직원 표본과 가상 합격자 기준으로 정리한 PatternProfile"],
  ["준비 로드맵", "부족 요소를 주차별 과제와 지원 체크리스트로 변환"]
];

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <main>
        <section className="border-b border-line bg-[#f6f8f4]">
          <div className="lens-container grid gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(360px,470px)] lg:items-center lg:py-24">
            <div className="max-w-3xl">
              <span className="lens-kicker">CAREERLENS</span>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.01em] text-night md:text-5xl xl:text-[56px]">
                내 프로필에 맞는 해외 공고를 찾습니다
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">
                채용공고, 직원 표본, PatternProfile을 비교해 추천 공고와 부족 요소를 정리하고
                커리어 플래너로 이어갑니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/jobs/recommendation" className="rounded-2xl px-5">
                  적합도 진단 시작
                </LinkButton>
                <LinkButton href="/jobs" variant="secondary" className="rounded-2xl px-5">
                  전체 공고 보기
                </LinkButton>
              </div>

              <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black text-night">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroReport />
          </div>
        </section>

        <section className="lens-container py-12 md:py-14">
          <div className="flex items-end justify-between">
            <div>
              <span className="lens-kicker">SERVICE FLOW</span>
              <h2 className="mt-4 whitespace-nowrap text-3xl font-black text-night">추천에서 지원까지</h2>
            </div>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {processSteps.map((item) => (
              <Card key={item.step} className="rounded-2xl p-5">
                <span className="rounded-lg border border-line bg-panel px-2.5 py-1 text-xs font-bold text-brand">{item.step}</span>
                <h3 className="mt-4 text-lg font-bold text-night">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-white">
          <div className="lens-container py-12 md:py-14">
            <div>
              <div>
                <span className="lens-kicker">MENU</span>
                <h2 className="mt-4 text-3xl font-black text-night">CareerLens 주요 서비스</h2>
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {serviceCards.slice(0, 2).map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
              <EvidenceCard />
              {serviceCards.slice(2).map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function HeroReport() {
  return (
    <Card className="w-full rounded-[28px] border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <div className="rounded-3xl border border-line bg-panel p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-brand">DIAGNOSIS REPORT</p>
            <h2 className="mt-3 text-xl font-black leading-7 text-night">Northstar Security</h2>
            <p className="mt-1 text-sm text-slate-600">Cloud Backend Engineer · 미국 · 하이브리드</p>
          </div>
          <div className="shrink-0 rounded-2xl bg-night px-4 py-3 text-right text-white">
            <p className="text-xs font-bold text-white/60">TOTAL</p>
            <p className="mt-1 text-3xl font-black">82</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ScoreBar label="합격 가능성" value={82} tone="brand" />
          <ScoreBar label="직무 적합도" value={88} tone="success" />
          <ScoreBar label="연봉 매력도" value={78} tone="warning" />
          <ScoreBar label="워라밸" value={63} tone="risk" />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_150px]">
        <div className="rounded-3xl border border-line bg-white p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">부족 요소</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="warning">Distributed Systems</Badge>
            <Badge tone="warning">GitHub 공개 저장소</Badge>
            <Badge tone="warning">포트폴리오 사례</Badge>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-4">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">다음 액션</p>
          <p className="mt-3 text-lg font-black text-night">8주 로드맵</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">보완 과제로 연결</p>
        </div>
      </div>
    </Card>
  );
}

function ServiceCard({ service }: { service: (typeof serviceCards)[number] }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    coral: "bg-orange-50 text-orange-700",
    mint: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    slate: "bg-slate-100 text-slate-700"
  }[service.tone];

  return (
    <Link href={service.href} className="group block">
      <Card className="flex min-h-[260px] flex-col rounded-[28px] p-7 transition group-hover:-translate-y-0.5 group-hover:border-brand group-hover:shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
        <span className={`grid h-12 w-12 place-items-center rounded-2xl text-xs font-black tracking-[0.12em] ${toneClass}`}>
          {service.label}
        </span>
        <h3 className="mt-8 text-2xl font-black text-night">{service.title}</h3>
        <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">{service.description}</p>
        <div className="mt-7 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}

function EvidenceCard() {
  return (
    <aside className="relative flex min-h-[260px] flex-col overflow-hidden rounded-[28px] border border-night bg-night p-7 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
      <div className="absolute right-[-36px] top-[-44px] h-40 w-40 rounded-full border-[28px] border-white/5" />
      <p className="relative text-xs font-black tracking-[0.16em] text-cyan-100">DATA EVIDENCE</p>
      <h3 className="relative mt-8 text-2xl font-black leading-8">추천 근거 데이터</h3>
      <div className="relative mt-7 flex-1 space-y-3">
        {evidenceItems.map(([name, detail]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-bold text-white">{name}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{detail}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

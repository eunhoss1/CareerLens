import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell, ScoreBar } from "@/components/ui";

const heroStats = [
  { label: "추천 후보", value: "Top 5", helper: "프로필 기준 선별" },
  { label: "진단 항목", value: "5개", helper: "기술, 경력, 언어, 증빙" },
  { label: "실행 연결", value: "8주", helper: "준비 로드맵으로 전환" }
];

const processSteps = [
  {
    step: "01",
    title: "프로필 입력",
    description: "희망 국가, 직무, 경력, 기술스택을 정리합니다.",
    href: "/onboarding/profile"
  },
  {
    step: "02",
    title: "공고 매칭",
    description: "내 조건에 맞는 해외 공고를 빠르게 좁힙니다.",
    href: "/jobs"
  },
  {
    step: "03",
    title: "적합도 진단",
    description: "공고별 가능성과 부족 요소를 확인합니다.",
    href: "/jobs/recommendation"
  },
  {
    step: "04",
    title: "준비 로드맵",
    description: "보완 항목을 실행 가능한 과제로 바꿉니다.",
    href: "/planner"
  },
  {
    step: "05",
    title: "지원 관리",
    description: "관심 공고와 지원 상태를 이어서 관리합니다.",
    href: "/applications"
  }
];

const serviceCards = [
  {
    label: "JOBS",
    title: "채용공고",
    description: "국가, 직무군, 기술스택 조건으로 공고를 검색합니다.",
    href: "/jobs",
    tone: "blue",
    tags: ["전체 공고", "필터", "인기 공고"]
  },
  {
    label: "MATCH",
    title: "맞춤추천",
    description: "프로필과 공고 패턴을 기준으로 추천 후보를 정렬합니다.",
    href: "/jobs/recommendation",
    tone: "coral",
    tags: ["추천 후보", "패턴 비교", "근거"]
  },
  {
    label: "FIT",
    title: "적합도 진단",
    description: "합격 가능성, 직무 적합도, 리스크를 수치로 확인합니다.",
    href: "/jobs/recommendation",
    tone: "slate",
    tags: ["점수", "부족 요소", "다음 액션"]
  },
  {
    label: "PLAN",
    title: "준비 로드맵",
    description: "부족한 역량을 주차별 준비 과제로 전환합니다.",
    href: "/planner",
    tone: "mint",
    tags: ["8주 계획", "과제", "체크리스트"]
  },
  {
    label: "DATA",
    title: "자료실",
    description: "국가, 비자, 공지, Q&A 정보를 한 곳에서 확인합니다.",
    href: "/resources",
    tone: "violet",
    tags: ["국가정보", "비자", "Q&A"]
  }
];

const evidenceItems = [
  ["공고 데이터", "직무, 경력, 기술스택, 비자 조건을 구조화합니다.", "72%"],
  ["합격자 패턴", "직원 표본과 합격자 기준으로 비교 기준을 만듭니다.", "84%"],
  ["준비 로드맵", "부족 요소를 주차별 과제와 체크리스트로 변환합니다.", "68%"]
];

const previewActions = [
  { title: "공고 저장", helper: "관심 목록에 보관", href: "/mypage/saved-jobs" },
  { title: "비교하기", helper: "추천 후보와 나란히 보기", href: "/recommendations/compare" },
  { title: "로드맵 생성", helper: "부족 요소를 과제로 전환", href: "/planner" }
];

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <main className="overflow-hidden bg-[#f6f8f4]">
        <section className="relative border-b border-line bg-[linear-gradient(180deg,#ffffff_0%,#f6f8f4_100%)]">
          <div className="ambient-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-60" />
          <div className="lens-container relative grid min-h-[calc(100vh-76px)] gap-12 py-16 md:py-20 lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,1.04fr)] lg:items-center lg:py-24">
            <div className="reveal-up max-w-3xl">
              <span className="lens-kicker rounded-full border-line bg-white text-brand">OVERSEAS JOB INTELLIGENCE</span>
              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] text-night md:text-6xl xl:text-[64px]">
                해외 채용공고 탐색부터 지원 준비까지
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 md:text-lg">
                공고 조건, 프로필, 적합도 진단 결과를 연결해 추천 공고와 부족 요소, 준비 로드맵을 한 화면에서 확인합니다.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/jobs/recommendation" className="rounded-full px-6 shadow-[0_14px_30px_rgba(31,111,120,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(31,111,120,0.22)]">
                  적합도 진단 시작
                </LinkButton>
                <LinkButton href="/jobs" variant="secondary" className="rounded-full bg-white px-6 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm">
                  전체 공고 보기
                </LinkButton>
              </div>

              <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-line bg-white px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-panel">
                    <p className="text-xs font-semibold text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-2xl font-black text-night">{stat.value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{stat.helper}</p>
                  </div>
                ))}
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section className="lens-container py-12 md:py-16">
          <div className="scroll-rise flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="lens-kicker rounded-full border-line bg-white text-brand">SERVICE FLOW</span>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-night md:text-4xl">추천에서 지원까지</h2>
            </div>
            <p className="max-w-lg text-sm leading-7 text-slate-600">
              공고를 보는 순간부터 실제 지원 준비까지 이어지는 CareerLens의 기본 흐름입니다.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((item) => (
              <Link key={item.step} href={item.href} className="group block h-full scroll-rise">
                <Card className="h-full rounded-[20px] p-5 transition duration-200 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-panel">
                  <span className="inline-flex rounded-full border border-line bg-panel px-3 py-1 text-xs font-black text-brand transition group-hover:border-brand/40">
                    {item.step}
                  </span>
                  <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-night">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-white py-12 md:py-16">
          <div className="lens-container">
            <div className="scroll-rise flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="lens-kicker rounded-full border-line bg-white text-brand">MENU</span>
                <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-night md:text-4xl">CareerLens 주요 서비스</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-slate-600">
                탐색, 추천, 진단, 로드맵, 자료 확인을 메인에서 바로 시작할 수 있습니다.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {serviceCards.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f8f4] py-12 md:py-16">
          <div className="lens-container grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
            <div className="scroll-rise">
              <span className="lens-kicker rounded-full border-line bg-white text-brand">DATA EVIDENCE</span>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-night md:text-4xl">추천 근거 데이터</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                CareerLens는 단순 공고 목록이 아니라, 공고 조건과 프로필 기준을 연결해 다음 준비를 판단할 수 있게 돕습니다.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {evidenceItems.map(([name, detail, progress]) => (
                <EvidenceCard key={name} name={name} detail={detail} progress={progress} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

function HeroPreview() {
  return (
    <div className="reveal-up relative">
      <Card className="relative w-full rounded-[30px] border-slate-200 bg-white p-3 shadow-[0_28px_80px_rgba(15,23,42,0.12)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_34px_90px_rgba(15,23,42,0.15)] md:p-4">
        <div className="rounded-[24px] border border-line bg-[#fbfcf8]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#dbe4df]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#c8d7d3]" />
              <span className="h-2.5 w-2.5 rounded-full bg-brand/40" />
            </div>
            <p className="text-xs font-black tracking-[0.14em] text-slate-500">DIAGNOSIS REPORT</p>
          </div>

          <div className="grid gap-4 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 rounded-[22px] border border-line bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-brand">RECOMMENDED JOB</p>
                <h2 className="mt-3 text-xl font-black leading-7 text-night">Northstar Security</h2>
                <p className="mt-1 text-sm text-slate-600">Cloud Backend Engineer · 미국 · 하이브리드</p>
              </div>
              <div className="rounded-2xl bg-night px-4 py-3 text-right text-white">
                <p className="text-xs font-bold text-white/60">TOTAL</p>
                <p className="mt-1 text-3xl font-black">82</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ScoreBar label="합격 가능성" value={82} tone="brand" />
              <ScoreBar label="직무 적합도" value={88} tone="success" />
              <ScoreBar label="역량 매력도" value={78} tone="warning" />
              <ScoreBar label="위험도" value={36} tone="risk" />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <div className="rounded-[22px] border border-line bg-white p-4 transition duration-200 hover:border-brand/40 hover:bg-[#fbfcf8]">
                <p className="text-xs font-bold tracking-[0.14em] text-brand">부족 요소</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="warning">Distributed Systems</Badge>
                  <Badge tone="warning">GitHub 증빙</Badge>
                  <Badge tone="warning">포트폴리오 사례</Badge>
                </div>
              </div>

              <Link href="/planner" className="group rounded-[22px] border border-line bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-[#fbfcf8]">
                <p className="text-xs font-bold tracking-[0.14em] text-brand">다음 액션</p>
                <p className="mt-3 text-lg font-black text-night">8주 로드맵</p>
                <p className="mt-2 text-xs leading-5 text-slate-500 transition group-hover:text-brand">보완 과제로 연결</p>
              </Link>
            </div>

            <div className="rounded-[22px] border border-line bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold tracking-[0.14em] text-brand">추가 액션</p>
                <span className="rounded-full bg-[#e8f2f1] px-2.5 py-1 text-[11px] font-black text-brand">3개</span>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {previewActions.map((action) => (
                  <Link
                    key={action.title}
                    href={action.href}
                    className="group/action rounded-2xl border border-line bg-[#fbfcf8] px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-sm font-black text-night transition group-hover/action:text-brand">{action.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{action.helper}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
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
    <Link href={service.href} className="group block scroll-rise">
      <Card className="flex min-h-[250px] flex-col rounded-[24px] p-5 transition duration-200 group-hover:-translate-y-1 group-hover:border-slate-300 group-hover:shadow-panel">
        <span className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-black tracking-[0.12em] transition group-hover:scale-105 ${toneClass}`}>
          {service.label}
        </span>
        <h3 className="mt-7 text-xl font-black tracking-[-0.03em] text-night">{service.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {service.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 transition group-hover:bg-[#e8f2f1] group-hover:text-brand">
              #{tag}
            </span>
          ))}
        </div>
      </Card>
    </Link>
  );
}

function EvidenceCard({ name, detail, progress }: { name: string; detail: string; progress: string }) {
  return (
    <Card className="scroll-rise rounded-[24px] bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-panel">
      <p className="text-xs font-black tracking-[0.14em] text-brand">SOURCE</p>
      <h3 className="mt-4 text-xl font-black tracking-[-0.03em] text-night">{name}</h3>
      <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9efeb]">
        <div className="h-full rounded-full bg-brand" style={{ width: progress }} />
      </div>
      <p className="mt-2 text-xs font-bold text-slate-500">활용 기준 {progress}</p>
    </Card>
  );
}

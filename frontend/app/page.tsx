import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell, ScoreBar } from "@/components/ui";

const heroStats = [
  { label: "추천 후보", value: "Top 5", helper: "프로필 기준 선별" },
  { label: "진단 항목", value: "5개", helper: "기술, 경력, 언어, 증빙" },
  { label: "실행 연결", value: "8주", helper: "준비 로드맵으로 전환" },
];

const processSteps = [
  {
    step: "01",
    title: "프로필 입력",
    description: "희망 국가, 직무, 경력, 기술스택을 정리합니다.",
    href: "/onboarding/profile",
  },
  {
    step: "02",
    title: "공고 매칭",
    description: "내 조건에 맞는 해외 공고를 빠르게 좁힙니다.",
    href: "/jobs",
  },
  {
    step: "03",
    title: "적합도 진단",
    description: "공고별 가능성과 부족 요소를 확인합니다.",
    href: "/jobs/recommendation",
  },
  {
    step: "04",
    title: "준비 로드맵",
    description: "보완 항목을 실행 가능한 과제로 바꿉니다.",
    href: "/planner",
  },
  {
    step: "05",
    title: "지원 관리",
    description: "관심 공고와 지원 상태를 이어서 관리합니다.",
    href: "/applications",
  },
];

const serviceCards = [
  {
    label: "JOBS",
    title: "채용공고",
    description: "국가, 직무군, 기술스택 조건으로 공고를 검색합니다.",
    href: "/jobs",
    tone: "blue",
    tags: ["전체 공고", "필터", "인기 공고"],
  },
  {
    label: "MATCH",
    title: "맞춤추천",
    description: "프로필과 공고 패턴을 기준으로 추천 후보를 정렬합니다.",
    href: "/jobs/recommendation",
    tone: "coral",
    tags: ["추천 후보", "패턴 비교", "근거"],
  },
  {
    label: "FIT",
    title: "적합도 진단",
    description: "합격 가능성, 직무 적합도, 리스크를 수치로 확인합니다.",
    href: "/jobs/recommendation",
    tone: "slate",
    tags: ["점수", "부족 요소", "다음 액션"],
  },
  {
    label: "PLAN",
    title: "준비 로드맵",
    description: "부족한 역량을 주차별 준비 과제로 전환합니다.",
    href: "/planner",
    tone: "mint",
    tags: ["8주 계획", "과제", "체크리스트"],
  },
  {
    label: "DATA",
    title: "자료실",
    description: "국가, 비자, 공지, Q&A 정보를 한 곳에서 확인합니다.",
    href: "/resources",
    tone: "violet",
    tags: ["국가정보", "비자", "Q&A"],
  },
];

const evidenceItems = [
  ["공고 데이터", "직무, 경력, 기술스택, 비자 조건을 구조화합니다.", "72%"],
  ["합격자 패턴", "직원 표본과 합격자 기준으로 비교 기준을 만듭니다.", "84%"],
  ["준비 로드맵", "부족 요소를 주차별 과제와 체크리스트로 변환합니다.", "68%"],
];

const previewActions = [
  {
    title: "공고 저장",
    helper: "관심 목록에 보관",
    href: "/mypage/saved-jobs",
  },
  {
    title: "비교하기",
    helper: "추천 후보와 나란히 보기",
    href: "/recommendations/compare",
  },
  { title: "로드맵 생성", helper: "부족 요소를 과제로 전환", href: "/planner" },
];

export default function Home() {
  return (
    <PageShell>
      <SiteHeader />

      <main className="bg-slate-50/50 text-slate-900 min-h-screen font-sans">
        {/* HERO SECTION: 현대적인 그라데이션 글로우와 깔끔한 레이아웃 */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 md:py-32">
          {/* 배경 글로우 효과 */}
          <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50 blur-[120px] rounded-full opacity-60" />
          <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-50 blur-[120px] rounded-full opacity-60" />

          <div className="max-w-[1200px] mx-auto px-6 relative z-10 grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Overseas Job Intelligence
              </div>
              <h1 className="text-4xl font-bold leading-[1.15] tracking-tight md:text-6xl text-slate-900">
                해외 채용공고 탐색부터
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-600">
                  지원 준비까지
                </span>
              </h1>
              <p className="mt-6 text-base md:text-lg leading-relaxed text-slate-600 max-w-xl">
                공고 조건과 내 프로필을 연결해 합격 가능성을 진단하고,
                <br className="hidden md:block" />
                부족한 역량을 8주 완성 준비 과제로 즉시 전환하세요.
              </p>

              <div className="mt-10 flex flex-wrap gap-3">
                <LinkButton
                  href="/jobs/recommendation"
                  className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-8 py-6 h-auto font-bold shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
                >
                  적합도 진단 시작
                </LinkButton>
                <LinkButton
                  href="/jobs"
                  variant="secondary"
                  className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-8 py-6 h-auto font-bold transition-all"
                >
                  전체 공고 보기
                </LinkButton>
              </div>

              {/* 통계 섹션: 세련된 카드 스타일 */}
              <div className="mt-12 grid gap-3 sm:grid-cols-3 max-w-2xl">
                {heroStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/50 backdrop-blur-sm border border-slate-100 p-5 rounded-2xl shadow-sm"
                  >
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      {stat.label}
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {stat.helper}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/10 to-emerald-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* SERVICE FLOW: 타임라인형 카드 배치 (Modern Soft Card) */}
        <section className="py-20 md:py-28">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <span className="text-indigo-600 font-bold text-sm tracking-widest uppercase">
                Service Flow
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                끊김 없는 지원 프로세스
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-5">
              {processSteps.map((item, index) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="group relative"
                >
                  <div className="h-full bg-white border border-slate-100 p-6 rounded-2xl transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:-translate-y-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                      {item.step}
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {item.description}
                    </p>
                  </div>
                  {index < 4 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 z-10 text-slate-200 text-2xl">
                      →
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* MAJOR SERVICE: 글래스모피즘이 적용된 메뉴 섹션 */}
        <section className="bg-slate-900 py-24 md:py-32 rounded-[3rem] mx-4 my-10 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px]" />
          <div className="max-w-[1200px] mx-auto px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <span className="text-indigo-400 font-bold text-sm tracking-widest uppercase">
                  Explore Services
                </span>
                <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
                  핵심 서비스 바로가기
                </h2>
              </div>
              <p className="text-slate-400 text-sm max-w-md">
                준비된 데이터를 기반으로 최적화된 채용 정보를 탐색하고 로드맵을
                구축하세요.
              </p>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
              {serviceCards.map((service) => (
                <ServiceCard key={service.title} service={service} />
              ))}
            </div>
          </div>
        </section>

        {/* EVIDENCE: 데이터 시각화가 강조된 마지막 섹션 */}
        <section className="py-24 md:py-32">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <span className="text-emerald-600 font-bold text-sm tracking-widest uppercase">
                Data Evidence
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
                신뢰할 수 있는 추천 근거
              </h2>
              <div className="w-12 h-1 bg-emerald-500 mt-6 rounded-full" />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {evidenceItems.map(([name, detail, progress]) => (
                <EvidenceCard
                  key={name}
                  name={name}
                  detail={detail}
                  progress={progress}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

{
  /* PREVIEW 컴포넌트: 대시보드 형태의 세련된 UI 리포트 */
}
function HeroPreview() {
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 p-1.5">
      <div className="rounded-[1.4rem] overflow-hidden border border-slate-100 bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Diagnosis Intelligence v1.0
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-indigo-500 tracking-wider uppercase mb-1.5">
                Top Recommended
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                Northstar Security
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Cloud Backend Engineer · USA · Hybrid
              </p>
            </div>
            <div className="bg-slate-900 rounded-2xl px-5 py-3 text-right">
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
                Score
              </p>
              <p className="text-3xl font-bold text-white leading-tight">82</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScoreBar label="합격 가능성" value={82} tone="brand" />
            <ScoreBar label="직무 적합도" value={88} tone="success" />
            <ScoreBar label="역량 매력도" value={78} tone="warning" />
            <ScoreBar label="리스크 관리" value={36} tone="risk" />
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                부족 역량 보완 제안
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge
                  tone="warning"
                  className="rounded-lg border-0 bg-amber-100 text-amber-700 px-3 py-1"
                >
                  Distributed Systems
                </Badge>
                <Badge
                  tone="warning"
                  className="rounded-lg border-0 bg-amber-100 text-amber-700 px-3 py-1"
                >
                  GitHub Contribution
                </Badge>
                <Badge
                  tone="warning"
                  className="rounded-lg border-0 bg-amber-100 text-amber-700 px-3 py-1"
                >
                  Portfolio Case
                </Badge>
              </div>
            </div>

            <Link
              href="/planner"
              className="flex flex-col justify-center items-center bg-indigo-600 rounded-2xl p-6 text-white hover:bg-indigo-700 transition-colors"
            >
              <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">
                Action
              </p>
              <p className="text-lg font-bold">8주 로드맵 →</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: (typeof serviceCards)[number] }) {
  return (
    <Link href={service.href} className="group h-full">
      <div className="flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all hover:-translate-y-1">
        <span className="inline-block w-fit px-3 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase mb-6">
          {service.label}
        </span>
        <h3 className="text-xl font-bold text-white mb-3">{service.title}</h3>
        <p className="text-slate-400 text-xs leading-relaxed flex-1">
          {service.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          {service.tags.map((tag) => (
            <span key={tag} className="text-[10px] font-medium text-indigo-300">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function EvidenceCard({
  name,
  detail,
  progress,
}: {
  name: string;
  detail: string;
  progress: string;
}) {
  return (
    <div className="bg-white border border-slate-100 p-7 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          Analysis Source
        </p>
        <span className="text-emerald-600 font-bold text-sm">{progress}</span>
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-3">{name}</h3>
      <p className="text-sm text-slate-500 leading-relaxed min-h-[3rem] mb-6">
        {detail}
      </p>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full"
          style={{ width: progress }}
        />
      </div>
    </div>
  );
}

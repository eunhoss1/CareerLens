import Link from "next/link";

const services = [
  {
    title: "맞춤채용정보",
    status: "Active",
    href: "/jobs/recommendation",
    accent: "bg-blue-600",
    summary: "공고 데이터와 직무 패턴을 기준으로 내 프로필의 지원 가능성을 진단합니다.",
    metric: "추천 엔진"
  },
  {
    title: "커리어 플래너",
    status: "Next",
    href: "#",
    accent: "bg-emerald-600",
    summary: "진단 결과에서 나온 부족 요소를 주차별 준비 로드맵으로 전환합니다.",
    metric: "로드맵"
  },
  {
    title: "지원 관리",
    status: "Planned",
    href: "#",
    accent: "bg-amber-600",
    summary: "관심 공고, 지원 단계, 제출 자료 상태를 하나의 흐름으로 관리합니다.",
    metric: "파이프라인"
  },
  {
    title: "정책 체크리스트",
    status: "Planned",
    href: "#",
    accent: "bg-cyan-700",
    summary: "국가별 비자, 취업 정책, 정착 준비 항목을 체크리스트로 정리합니다.",
    metric: "체크리스트"
  },
  {
    title: "검증 배지",
    status: "Planned",
    href: "#",
    accent: "bg-rose-700",
    summary: "학력, 자격, 포트폴리오 검증 정보를 배지 형태로 시각화합니다.",
    metric: "신뢰도"
  }
];

const flowSteps = ["프로필 입력", "공고 필터링", "직무 패턴 비교", "추천 진단", "플래너 연결"];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#edf3f7] text-ink">
      <header className="sticky top-0 z-20 border-b border-white/20 bg-[#0e1726]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-sm font-black text-blue-700">
              CL
            </span>
            <span className="text-base font-semibold text-white">CareerLens</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/jobs/recommendation" className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10">
              맞춤채용정보
            </Link>
            <span className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">커리어 플래너</span>
            <span className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">지원 관리</span>
            <span className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">정책 체크리스트</span>
            <span className="rounded-md px-3 py-2 text-sm font-medium text-slate-400">검증 배지</span>
            <Link href="/login" className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10">
              로그인
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#0e1726]">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute left-1/2 top-8 h-[520px] w-[760px] -translate-x-1/2 rounded-[40px] border border-white/10 bg-[#12213a]" />
          <div className="absolute left-[8%] top-24 h-44 w-72 rounded-lg border border-cyan-300/20 bg-cyan-300/10" />
          <div className="absolute right-[8%] top-20 h-72 w-80 rounded-lg border border-blue-300/20 bg-blue-300/10" />
          <div className="absolute bottom-12 left-[18%] h-40 w-96 rounded-lg border border-emerald-300/20 bg-emerald-300/10" />
          <div className="absolute bottom-20 right-[18%] h-32 w-72 rounded-lg border border-amber-300/20 bg-amber-300/10" />
        </div>

        <div className="relative mx-auto grid min-h-[650px] max-w-7xl content-center gap-10 px-5 py-16 lg:grid-cols-[1fr_460px] lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-cyan-200">해외 취업 추천 진단 플랫폼</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white md:text-6xl">
              CareerLens는 해외 취업 가능성을 공고와 합격자 패턴으로 진단합니다.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
              구직자 프로필을 공고, 직원 표본, 직무 패턴 데이터와 비교해 추천 공고와 부족 역량, 다음 준비 방향까지 한눈에 보여주는 캡스톤 시연용 서비스입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-blue-800 shadow-lg shadow-blue-950/20 hover:bg-blue-50"
              >
                추천 진단 시작
              </Link>
              <a
                href="#services"
                className="rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                서비스 메뉴 보기
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-white/15 bg-white/10 p-5 shadow-2xl shadow-blue-950/30 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">시연 미리보기</p>
                <h2 className="mt-2 text-xl font-semibold text-white">백엔드 직무 추천 진단</h2>
              </div>
              <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-emerald-950">시연 가능</span>
            </div>
            <div className="mt-6 space-y-4">
              <PreviewRow company="Northstar Cloud" score={88} badge="A" />
              <PreviewRow company="Atlas Fintech" score={67} badge="B" />
              <PreviewRow company="Sakura Mobility" score={61} badge="C" />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <PreviewStat label="공고" value="6" />
              <PreviewStat label="직원 표본" value="6" />
              <PreviewStat label="패턴" value="12" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-4 md:grid-cols-5">
          {flowSteps.map((step, index) => (
            <div key={step} className="rounded-lg border border-line bg-white p-4 shadow-sm">
              <span className="text-xs font-semibold text-blue-600">0{index + 1}</span>
              <p className="mt-2 text-sm font-semibold text-ink">{step}</p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(index + 1) * 20}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 pb-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand">서비스 허브</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">CareerLens 메인 메뉴</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            현재는 맞춤채용정보 서비스를 중심으로 시연하고, 이후 커리어 플래너와 지원 관리 기능을 순차적으로 연결합니다.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {services.map((service) => {
            const isActive = service.status === "Active";
            const content = (
              <article className="flex h-full min-h-[230px] flex-col rounded-lg border border-line bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className={`h-2 w-16 rounded-full ${service.accent}`} />
                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {service.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{service.metric}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-6 text-ink">{service.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{service.summary}</p>
                <span className={`mt-5 text-sm font-semibold ${isActive ? "text-blue-700" : "text-slate-400"}`}>
                  {isActive ? "서비스 진입" : "구현 예정"}
                </span>
              </article>
            );

            return isActive ? (
              <Link key={service.title} href={service.href}>
                {content}
              </Link>
            ) : (
              <div key={service.title}>{content}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function PreviewRow({ company, score, badge }: { company: string; score: number; badge: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{company}</p>
          <p className="mt-1 text-xs text-slate-300">미국 / 백엔드</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blue-800">등급 {badge}</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white/15">
        <div className="h-2 rounded-full bg-cyan-300" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-xs text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

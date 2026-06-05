"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { login, storeUser } from "@/lib/auth";

const accessHighlights = [
  { title: "글로벌 정보", description: "전 세계 채용 공고와 준비 정보를 한 곳에서 탐색하세요.", icon: "◎" },
  { title: "맞춤 진단", description: "내 프로필과 공고 패턴을 비교해 다음 준비 방향을 확인하세요.", icon: "✓" },
  { title: "안전한 관리", description: "계정별 진단 결과와 로드맵을 분리해 관리합니다.", icon: "◇" }
];

const metricCards = [
  { value: "저장", label: "프로필" },
  { value: "Top 5", label: "추천" },
  { value: "8주", label: "로드맵" },
  { value: "관리", label: "지원" }
];

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!loginId.trim() || !password) {
      setErrorMessage("아이디 또는 이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await login({ login_id: loginId.trim().toLowerCase(), password });
      storeUser(user);
      router.push(user.profile_completed ? "/jobs/recommendation" : "/mypage");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_58%,#eef5ff_100%)]">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[radial-gradient(80%_70%_at_18%_100%,rgba(37,99,235,0.14),transparent_68%),radial-gradient(70%_60%_at_80%_100%,rgba(96,165,250,0.14),transparent_70%)]" />
        <div className="lens-container relative grid min-h-[calc(100vh-76px)] items-center gap-12 py-10 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <section className="max-w-2xl">
            <p className="text-lg font-semibold text-slate-800">커리어의 새로운 시작</p>
            <h1 className="mt-3 text-5xl font-black leading-tight text-slate-950 sm:text-6xl">
              Career<span className="text-blue-600">Lens</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
              해외취업의 모든 정보와 맞춤 로드맵을 한 곳에서 확인하세요.
            </p>

            <div className="mt-10 space-y-6">
              {accessHighlights.map((item) => (
                <div key={item.title} className="flex gap-5">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-blue-100 bg-white text-xl font-bold text-blue-600 shadow-[0_12px_28px_rgba(37,99,235,0.12)]">
                    {item.icon}
                  </span>
                  <span>
                    <strong className="block text-base font-bold text-slate-950">{item.title}</strong>
                    <span className="mt-1 block text-sm leading-6 text-slate-600">{item.description}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:grid-cols-4">
              {metricCards.map((item) => (
                <div key={item.label} className="border-slate-100 px-3 py-2 text-center sm:border-r sm:last:border-r-0">
                  <p className="text-xl font-black text-slate-950">{item.value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-9">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-blue-50 text-2xl font-black text-blue-600">⌂</div>
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black text-slate-950">로그인</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">계정에 로그인하여 서비스를 이용하세요.</p>
            </div>

            <div className="mt-8 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">아이디 또는 이메일</span>
                <input
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  autoComplete="username"
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500"
                  placeholder="아이디 또는 이메일을 입력하세요"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">비밀번호</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                  className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-500"
                  placeholder="비밀번호를 입력하세요"
                />
              </label>
            </div>

            <label className="mt-4 flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(event) => setShowPassword(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              비밀번호 표시
            </label>

            {errorMessage && (
              <p role="alert" className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={isLoading || !loginId.trim() || !password}
              className="mt-7 h-12 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.28)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "로그인 중" : "로그인"}
            </button>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-100 pt-5 text-sm font-bold text-slate-500">
              <Link href="/login/find-id" className="hover:text-blue-600">
                아이디 찾기
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/login/find-password" className="hover:text-blue-600">
                비밀번호 찾기
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/signup" className="hover:text-blue-600">
                회원가입
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

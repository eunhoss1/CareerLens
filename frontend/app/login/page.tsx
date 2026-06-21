"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, PageShell, TextInput } from "@/components/ui";
import { login, storeUser } from "@/lib/auth";

const heroFeatures = [
  "저장한 프로필 이어보기",
  "추천 진단 결과 확인",
  "로드맵과 지원 관리 연결",
];

const heroStats = [
  { label: "프로필", value: "저장" },
  { label: "추천", value: "Top 5" },
  { label: "로드맵", value: "8주" },
  { label: "지원", value: "관리" },
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
      const user = await login({
        login_id: loginId.trim().toLowerCase(),
        password,
      });
      storeUser(user);
      router.push("/");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <main className="bg-slate-50/60 min-h-[calc(100vh-64px)] flex items-center justify-center py-16">
        <section className="max-w-[1040px] w-full mx-auto px-6 grid gap-8 lg:grid-cols-[1fr_1.1fr] items-stretch">
          {/* 좌측: 밝고 트렌디한 무드의 웰컴 패널 */}
          <LoginHeroPanel />

          {/* 우측: 밀도 높고 군더더기 없는 미니멀 로그인 카드 */}
          <Card className="rounded-2xl border border-slate-200/80 p-8 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                로그인
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                커리어 매칭 워크스페이스에 접속합니다.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <TextInput
                label="아이디 또는 이메일"
                value={loginId}
                onChange={(event) => setLoginId(event.target.value)}
                autoComplete="username"
                className="rounded-xl border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              <TextInput
                label="비밀번호"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="rounded-xl border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none font-medium hover:text-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(event) => setShowPassword(event.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30 h-4 w-4 transition-colors"
                />
                비밀번호 표시
              </label>

              <Link
                href="/signup"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                회원가입
              </Link>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-xs font-medium text-red-600 flex items-center gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errorMessage}
              </div>
            )}

            <Button
              type="button"
              onClick={submit}
              disabled={isLoading || !loginId.trim() || !password}
              className="mt-8 w-full min-h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/10 transition-all disabled:bg-slate-100 disabled:text-slate-400"
            >
              {isLoading ? "인증 정보 확인 중..." : "로그인"}
            </Button>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}

function LoginHeroPanel() {
  return (
    <aside className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
      <div>
        {/* 심플한 미니멀 로고 타입 */}
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
            CL
          </span>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            CareerLens
          </span>
        </div>

        <h2 className="mt-12 text-2xl font-bold tracking-tight text-slate-900 leading-snug">
          해외 취업 매칭과
          <br />
          로드맵 관리를 한눈에.
        </h2>

        {/* 안내 피처 리스트 (차분한 라인 형태) */}
        <div className="mt-8 space-y-3.5">
          {heroFeatures.map((feature, index) => (
            <div key={feature} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-bold text-indigo-600">
                0{index + 1}
              </span>
              <p className="text-xs font-medium text-slate-600">{feature}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 투명감 있는 가벼운 메트릭 보드 */}
      <div className="mt-8 grid grid-cols-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-center divide-x divide-slate-200/50">
        {heroStats.map((stat) => (
          <div key={stat.label} className="px-1">
            <p className="text-base font-bold text-indigo-600 tracking-tight">
              {stat.value}
            </p>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400 tracking-wide uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

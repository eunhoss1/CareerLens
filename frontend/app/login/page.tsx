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
  "로드맵과 지원 관리 연결"
];

const heroStats = [
  { label: "프로필", value: "저장" },
  { label: "추천", value: "Top 5" },
  { label: "로드맵", value: "8주" },
  { label: "지원", value: "관리" }
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
      router.push("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <section className="lens-container grid gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <LoginHeroPanel />

        <Card className="rounded-[28px] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-3xl font-black text-night">로그인</h1>
            <Link href="/signup" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              회원가입
            </Link>
          </div>

          <div className="mt-7 space-y-4">
            <TextInput
              label="아이디 또는 이메일"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="username"
            />
            <TextInput
              label="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </div>

          <label className="mt-3 flex min-h-9 items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            비밀번호 표시
          </label>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button
            type="button"
            onClick={submit}
            disabled={isLoading || !loginId.trim() || !password}
            className="mt-6 w-full rounded-2xl"
          >
            {isLoading ? "로그인 중" : "로그인"}
          </Button>
        </Card>
      </section>
    </PageShell>
  );
}

function LoginHeroPanel() {
  return (
    <aside className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[linear-gradient(145deg,#eef5ff_0%,#ffffff_42%,#dbeafe_100%)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">CL</span>
          <span className="text-xl font-black text-night">CareerLens</span>
        </div>

        <h2 className="mt-16 max-w-[560px] text-4xl font-black leading-tight text-night md:text-[44px]">
          준비 현황으로 돌아가기
        </h2>

        <div className="mt-10 space-y-5">
          {heroFeatures.map((feature, index) => (
            <div key={feature} className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white text-sm font-black text-blue-600 shadow-sm">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-lg font-bold text-night">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_18px_60px_rgba(37,99,235,0.14)] backdrop-blur md:grid-cols-4">
          {heroStats.map((stat) => (
            <div key={stat.label} className="border-line/70 px-3 py-2 md:border-r last:border-r-0">
              <p className="text-2xl font-black text-night">{stat.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(to_top,rgba(30,64,175,0.18),transparent)]" />
      <div className="pointer-events-none absolute bottom-0 right-8 h-44 w-56 rounded-t-[90px] bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 top-16 h-40 w-40 rounded-full bg-white/60" />
    </aside>
  );
}

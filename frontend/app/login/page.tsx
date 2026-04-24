"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login, storeUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("careerlens-demo");
  const [password, setPassword] = useState("1234");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await login({ login_id: loginId, password });
      storeUser(user);
      router.push(user.profile_completed ? "/jobs/recommendation" : "/onboarding/profile");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#edf3f7] px-5 py-10">
      <section className="mx-auto max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-brand">CareerLens</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">로그인</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">저장된 사용자 프로필을 불러와 맞춤채용정보 추천 진단으로 이어갑니다.</p>

        <div className="mt-6 space-y-4">
          <Field label="아이디 또는 이메일" value={loginId} onChange={setLoginId} />
          <Field label="비밀번호" value={password} onChange={setPassword} type="password" />
        </div>

        {errorMessage && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className="mt-6 h-11 w-full rounded-md bg-brand px-4 text-sm font-semibold text-white disabled:bg-slate-400"
        >
          {isLoading ? "로그인 중" : "로그인"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          <Link href="/" className="font-semibold text-slate-500">
            홈으로
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          계정이 없나요?{" "}
          <Link href="/signup" className="font-semibold text-brand">
            회원가입
          </Link>
        </p>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  type = "text",
  onChange
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-line bg-white px-3 text-sm"
      />
    </label>
  );
}

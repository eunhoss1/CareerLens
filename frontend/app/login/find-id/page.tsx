"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { findLoginId } from "@/lib/auth";

export default function FindIdPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [maskedLoginId, setMaskedLoginId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!displayName.trim() || !email.trim()) {
      setErrorMessage("이름과 이메일을 모두 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setMaskedLoginId(null);
    setErrorMessage(null);
    try {
      const result = await findLoginId({
        display_name: displayName.trim(),
        email: email.trim().toLowerCase()
      });
      setMessage(result.message);
      setMaskedLoginId(result.masked_login_id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "아이디 찾기 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_62%,#eef5ff_100%)] py-10">
        <div className="lens-container grid min-h-[calc(100vh-156px)] place-items-center">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-9">
            <p className="text-sm font-black text-blue-600">ACCOUNT HELP</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">아이디 찾기</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              가입 시 입력한 이름과 이메일이 일치하면 보안을 위해 일부 마스킹된 아이디를 안내합니다.
            </p>

            <div className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">이름</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="가입한 이름"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">이메일</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="you@example.com"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                />
              </label>
            </div>

            {errorMessage && (
              <p role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-bold text-slate-700">{message}</p>
                {maskedLoginId && <p className="mt-2 text-2xl font-black text-blue-600">{maskedLoginId}</p>}
              </div>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={isLoading || !displayName.trim() || !email.trim()}
              className="mt-7 h-12 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "확인 중" : "아이디 찾기"}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
              <Link href="/login" className="hover:text-blue-600">
                로그인
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/login/find-password" className="hover:text-blue-600">
                비밀번호 찾기
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

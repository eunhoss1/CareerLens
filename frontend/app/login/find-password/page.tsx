"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { requestPasswordResetGuide } from "@/lib/auth";

export default function FindPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    if (!identifier.trim()) {
      setErrorMessage("아이디 또는 이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await requestPasswordResetGuide({
        login_id_or_email: identifier.trim().toLowerCase()
      });
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "비밀번호 찾기 중 오류가 발생했습니다.");
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
            <p className="text-sm font-black text-blue-600">PASSWORD HELP</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">비밀번호 찾기</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              보안을 위해 기존 비밀번호는 표시하지 않습니다. 아이디 또는 이메일을 확인한 뒤 재설정 안내를 제공합니다.
            </p>

            <label className="mt-7 block">
              <span className="mb-2 block text-sm font-bold text-slate-700">아이디 또는 이메일</span>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                placeholder="아이디 또는 이메일"
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
              />
            </label>

            {errorMessage && (
              <p role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-slate-700">
                {message}
              </div>
            )}

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">
              현재 화면은 재설정 안내 단계입니다. 이메일 발송이나 토큰 기반 재설정 화면을 붙일 때도 기존 비밀번호를 노출하지 않는 흐름을 유지해야 합니다.
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={isLoading || !identifier.trim()}
              className="mt-7 h-12 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "안내 확인 중" : "재설정 안내 받기"}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-sm font-bold text-slate-500">
              <Link href="/login" className="hover:text-blue-600">
                로그인
              </Link>
              <span className="text-slate-300">·</span>
              <Link href="/login/find-id" className="hover:text-blue-600">
                아이디 찾기
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

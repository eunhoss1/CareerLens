"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { resetPassword } from "@/lib/auth";

export default function FindPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: "8자 이상", passed: newPassword.length >= 8 },
      { label: "영문 포함", passed: /[a-zA-Z]/.test(newPassword) },
      { label: "숫자 포함", passed: /\d/.test(newPassword) },
      { label: "특수문자 포함", passed: /[^A-Za-z0-9]/.test(newPassword) },
      { label: "비밀번호 확인 일치", passed: newPassword.length > 0 && newPassword === newPasswordConfirm }
    ],
    [newPassword, newPasswordConfirm]
  );

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = passwordChecks.every((check) => check.passed);
  const canSubmit = Boolean(identifier.trim() && displayName.trim() && emailValid && passwordValid);

  async function submit() {
    if (!canSubmit) {
      setErrorMessage("계정 정보와 새 비밀번호 조건을 다시 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const result = await resetPassword({
        login_id_or_email: identifier.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      });
      setMessage(result.message);
      setIdentifier("");
      setDisplayName("");
      setEmail("");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "비밀번호 재설정 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_62%,#eef5ff_100%)] py-10">
        <div className="lens-container grid min-h-[calc(100vh-156px)] place-items-center">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_22px_60px_rgba(15,23,42,0.12)] sm:p-9">
            <p className="text-sm font-black text-blue-600">PASSWORD RESET</p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">비밀번호 재설정</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              기존 비밀번호는 표시하지 않습니다. 가입 정보가 일치하면 새 비밀번호로 바로 변경됩니다.
            </p>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-700">아이디 또는 이메일</span>
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete="username"
                  name="login_id_or_email"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="아이디 또는 이메일"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">이름</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  autoComplete="name"
                  name="display_name"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="가입한 이름"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">가입 이메일</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  name="email"
                  type="email"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">새 비밀번호</span>
                <input
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  name="new_password"
                  type="password"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="영문, 숫자, 특수문자 포함"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">새 비밀번호 확인</span>
                <input
                  value={newPasswordConfirm}
                  onChange={(event) => setNewPasswordConfirm(event.target.value)}
                  autoComplete="new-password"
                  name="new_password_confirm"
                  type="password"
                  className="h-12 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                />
              </label>
            </div>

            <section className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-black text-slate-800">새 비밀번호 조건</h2>
                <span className={`w-fit rounded-md px-3 py-1 text-xs font-black ${passwordValid ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500"}`}>
                  {passwordValid ? "조건 충족" : "확인 필요"}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className={`text-xs font-bold ${check.passed ? "text-blue-600" : "text-slate-500"}`}>
                    {check.passed ? "✓" : "·"} {check.label}
                  </div>
                ))}
              </div>
            </section>

            {errorMessage && (
              <p role="alert" className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-700">
                {message}
              </div>
            )}

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs font-semibold leading-5 text-slate-500">
              비밀번호 재설정은 기존 비밀번호를 복구하거나 표시하지 않고, 새 비밀번호 해시로 교체하는 방식입니다.
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={isLoading || !canSubmit}
              className="mt-7 h-12 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "재설정 중" : "비밀번호 재설정"}
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

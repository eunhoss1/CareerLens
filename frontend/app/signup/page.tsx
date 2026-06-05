"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { checkEmail as checkEmailAvailability, checkLoginId as checkLoginIdAvailability, clearStoredUser, signup } from "@/lib/auth";

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [countryDialCode] = useState("+82");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [securityNoticeAccepted, setSecurityNoticeAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loginIdCheckMessage, setLoginIdCheckMessage] = useState<string | null>(null);
  const [emailCheckMessage, setEmailCheckMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: "8자 이상", passed: password.length >= 8 },
      { label: "영문 포함", passed: /[a-zA-Z]/.test(password) },
      { label: "숫자 포함", passed: /\d/.test(password) },
      { label: "특수문자 포함", passed: /[^A-Za-z0-9]/.test(password) },
      { label: "비밀번호 확인 일치", passed: password.length > 0 && password === passwordConfirm }
    ],
    [password, passwordConfirm]
  );

  const loginIdValid = /^[a-zA-Z0-9._-]{4,30}$/.test(loginId);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const displayNameValid = displayName.trim().length > 0;
  const passwordValid = passwordChecks.every((check) => check.passed);
  const requiredConsentsAccepted = termsAccepted && privacyAccepted && securityNoticeAccepted;
  const canSubmit = loginIdValid && displayNameValid && emailValid && passwordValid && requiredConsentsAccepted;

  async function submit() {
    if (!canSubmit) {
      setErrorMessage("입력값, 비밀번호 조건, 필수 동의 항목을 다시 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signup({
        login_id: loginId.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        country_dial_code: countryDialCode,
        phone_number: phoneNumber.trim() || undefined,
        password,
        password_confirm: passwordConfirm,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        security_notice_accepted: securityNoticeAccepted,
        marketing_opt_in: marketingOptIn
      });
      clearStoredUser();
      router.push("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  async function checkLoginId() {
    if (!loginId.trim()) {
      setLoginIdCheckMessage("아이디를 먼저 입력해주세요.");
      return;
    }
    if (!loginIdValid) {
      setLoginIdCheckMessage("4~30자의 영문, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다.");
      return;
    }
    try {
      const result = await checkLoginIdAvailability(loginId.trim().toLowerCase());
      setLoginIdCheckMessage(result.message);
    } catch (error) {
      setLoginIdCheckMessage(error instanceof Error ? error.message : "아이디 중복 확인 중 오류가 발생했습니다.");
    }
  }

  async function checkEmail() {
    if (!email.trim()) {
      setEmailCheckMessage("이메일을 먼저 입력해주세요.");
      return;
    }
    if (!emailValid) {
      setEmailCheckMessage("올바른 이메일 형식으로 입력해주세요.");
      return;
    }
    try {
      const result = await checkEmailAvailability(email.trim().toLowerCase());
      setEmailCheckMessage(result.message);
    } catch (error) {
      setEmailCheckMessage(error instanceof Error ? error.message : "이메일 중복 확인 중 오류가 발생했습니다.");
    }
  }

  function openTermsPreview() {
    // TODO: 약관 상세 보기 모달 또는 약관 전문 페이지를 연결한다.
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <SiteHeader />
      <section className="min-h-[calc(100vh-76px)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_52%,#eef5ff_100%)] py-10 sm:py-14">
        <div className="lens-container">
          <header className="flex flex-col gap-8 py-8 sm:py-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-black tracking-normal text-slate-950 sm:text-5xl">
                <span className="text-blue-600">CareerLens</span> 회원가입
              </h1>
              <p className="mt-5 text-lg font-semibold text-slate-500">새로운 계정을 만들어 서비스를 이용하세요.</p>
            </div>
            <SignupIllustration />
          </header>

          <section className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.10)] sm:p-8 lg:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-black text-blue-600">기본 정보</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Field label="아이디" helper="4~30자, 영문/숫자/._-">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_112px]">
                  <Input
                    value={loginId}
                    onChange={(event) => {
                      setLoginId(event.target.value);
                      setLoginIdCheckMessage(null);
                    }}
                    autoComplete="username"
                    placeholder="careerlens"
                  />
                  <CheckButton onClick={checkLoginId}>중복 확인</CheckButton>
                </div>
                {loginIdCheckMessage && <HelperMessage>{loginIdCheckMessage}</HelperMessage>}
              </Field>

              <Field label="이메일" helper="로그인 및 계정 확인에 사용">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_112px]">
                  <Input
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailCheckMessage(null);
                    }}
                    autoComplete="email"
                    type="email"
                    placeholder="you@example.com"
                  />
                  <CheckButton onClick={checkEmail}>중복 확인</CheckButton>
                </div>
                {emailCheckMessage && <HelperMessage>{emailCheckMessage}</HelperMessage>}
              </Field>

              <Field label="이름">
                <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="홍길동" />
              </Field>

              <Field label="전화번호" helper="선택">
                <div className="grid gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
                  <input
                    value={countryDialCode}
                    readOnly
                    aria-label="국가번호"
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-500 shadow-sm"
                  />
                  <Input
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="01012345678"
                  />
                </div>
              </Field>

              <Field label="비밀번호">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="영문, 숫자, 특수문자 포함"
                />
              </Field>

              <Field label="비밀번호 확인">
                <Input
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 다시 입력하세요"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                />
              </Field>
            </div>

            <section className="mt-8 rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base font-black text-slate-950">비밀번호 조건</h2>
                <span className={`w-fit rounded-md border px-3 py-1 text-xs font-black ${passwordValid ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
                  {passwordValid ? "조건 충족" : "확인 필요"}
                </span>
              </div>
              <div className="mt-5 grid gap-x-12 gap-y-3 sm:grid-cols-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className={`flex items-center gap-2 text-sm font-bold ${check.passed ? "text-blue-600" : "text-slate-600"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${check.passed ? "bg-blue-600" : "bg-slate-400"}`} />
                    {check.label}
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-base font-black text-blue-600">이용약관 및 개인정보 수집 동의</h2>
              <div className="mt-4 space-y-3">
                <ConsentRow checked={termsAccepted} onChange={setTermsAccepted} required label="서비스 이용약관 동의" onView={openTermsPreview} />
                <ConsentRow checked={privacyAccepted} onChange={setPrivacyAccepted} required label="개인정보 수집 및 이용 동의" onView={openTermsPreview} />
                <ConsentRow checked={securityNoticeAccepted} onChange={setSecurityNoticeAccepted} required label="개인정보의 제3자 제공 동의" onView={openTermsPreview} />
                <ConsentRow checked={marketingOptIn} onChange={setMarketingOptIn} label="마케팅 정보 수신 동의" onView={openTermsPreview} />
              </div>
            </section>

            {errorMessage && (
              <p role="alert" className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="button"
              onClick={submit}
              disabled={isLoading || !canSubmit}
              className="mt-8 h-14 w-full rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "회원가입 중" : "회원가입"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}

function SignupIllustration() {
  return (
    <div className="relative mx-auto h-36 w-36 shrink-0 sm:h-44 sm:w-44 lg:mx-0 lg:mr-16">
      <div className="absolute inset-6 rounded-3xl bg-blue-100 blur-2xl" />
      <div className="absolute left-6 top-5 h-28 w-24 rotate-6 rounded-2xl border border-blue-100 bg-white shadow-[0_18px_38px_rgba(37,99,235,0.22)] sm:h-36 sm:w-32">
        <div className="mx-auto -mt-3 h-7 w-14 rounded-xl bg-blue-400 shadow-sm" />
        <div className="mt-7 flex items-center gap-3 px-5">
          <div className="h-8 w-8 rounded-full bg-blue-500" />
          <div className="space-y-2">
            <div className="h-2 w-10 rounded-full bg-blue-100" />
            <div className="h-2 w-14 rounded-full bg-blue-100" />
          </div>
        </div>
        <div className="mt-5 space-y-3 px-5">
          <div className="h-2 w-16 rounded-full bg-slate-100" />
          <div className="h-2 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="absolute bottom-5 right-4 grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-blue-600 text-xl font-black text-white shadow-[0_12px_24px_rgba(37,99,235,0.28)] sm:h-14 sm:w-14">
        ✓
      </div>
    </div>
  );
}

function Field({ label, helper, children, className = "" }: { label: string; helper?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-black text-slate-700">
        <span>{label}</span>
        {helper && <span className="text-xs font-bold text-slate-400">{helper}</span>}
      </span>
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-300 focus:border-blue-500 ${props.className ?? ""}`}
    />
  );
}

function CheckButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-12 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
    >
      {children}
    </button>
  );
}

function HelperMessage({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs font-semibold text-slate-500">{children}</p>;
}

function ConsentRow({
  checked,
  onChange,
  label,
  required = false,
  onView
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
  onView: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold text-slate-700">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        <span className="min-w-0">
          <span className={required ? "text-red-500" : "text-slate-400"}>[{required ? "필수" : "선택"}] </span>
          {label}
        </span>
      </label>
      <button
        type="button"
        onClick={onView}
        className="h-8 rounded-md border border-blue-100 bg-blue-50 px-3 text-xs font-black text-blue-600 transition hover:bg-blue-100"
      >
        보기
      </button>
    </div>
  );
}

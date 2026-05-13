"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Button, Card, PageShell, StatusPill, TextInput } from "@/components/ui";
import { checkEmailAvailability, checkLoginIdAvailability, signup } from "@/lib/auth";

type AvailabilityStatus = "idle" | "checking" | "available" | "unavailable" | "error";

const heroFeatures = [
  "글로벌 공고 탐색",
  "커리어 준비도 진단",
  "안전한 계정 관리"
];

const heroStats = [
  { label: "공고 후보", value: "Top 5" },
  { label: "진단 항목", value: "5개" },
  { label: "준비 로드맵", value: "8주" },
  { label: "지원 관리", value: "연결" }
];

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [securityNoticeAccepted, setSecurityNoticeAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loginIdStatus, setLoginIdStatus] = useState<AvailabilityStatus>("idle");
  const [emailStatus, setEmailStatus] = useState<AvailabilityStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedLoginId = loginId.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

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

  const loginIdValid = /^[a-zA-Z0-9._-]{4,30}$/.test(normalizedLoginId);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const displayNameValid = displayName.trim().length > 0;
  const passwordValid = passwordChecks.every((check) => check.passed);
  const requiredConsentsAccepted = termsAccepted && privacyAccepted && securityNoticeAccepted;
  const canSubmit =
    loginIdValid &&
    loginIdStatus === "available" &&
    displayNameValid &&
    emailValid &&
    emailStatus === "available" &&
    passwordValid &&
    requiredConsentsAccepted;

  async function checkLoginId() {
    if (!loginIdValid) {
      setLoginIdStatus("error");
      return;
    }

    setLoginIdStatus("checking");
    try {
      const result = await checkLoginIdAvailability(normalizedLoginId);
      setLoginIdStatus(result.available ? "available" : "unavailable");
    } catch {
      setLoginIdStatus("error");
    }
  }

  async function checkEmail() {
    if (!emailValid) {
      setEmailStatus("error");
      return;
    }

    setEmailStatus("checking");
    try {
      const result = await checkEmailAvailability(normalizedEmail);
      setEmailStatus(result.available ? "available" : "unavailable");
    } catch {
      setEmailStatus("error");
    }
  }

  async function submit() {
    if (!canSubmit) {
      setErrorMessage("아이디와 이메일 중복 확인, 비밀번호 조건, 필수 동의 항목을 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await signup({
        login_id: normalizedLoginId,
        display_name: displayName.trim(),
        email: normalizedEmail,
        password,
        password_confirm: passwordConfirm,
        terms_accepted: termsAccepted,
        privacy_accepted: privacyAccepted,
        security_notice_accepted: securityNoticeAccepted,
        marketing_opt_in: marketingOptIn
      });
      router.push("/login");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <section className="lens-container grid gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr]">
        <CareerHeroPanel />

        <Card className="rounded-[28px] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-black text-night">CareerLens 회원가입</h1>
            </div>
            <Link href="/login" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              로그인
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <CheckedInput
                label="아이디"
                helper="4~30자, 영문/숫자/._-"
                value={loginId}
                onChange={(value) => {
                  setLoginId(value);
                  setLoginIdStatus("idle");
                }}
                onCheck={checkLoginId}
                status={loginIdStatus}
                autoComplete="username"
              />
            </div>
            <TextInput
              label="이름"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
            />
            <div>
              <CheckedInput
                label="이메일"
                helper="로그인 및 계정 확인에 사용"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setEmailStatus("idle");
                }}
                onCheck={checkEmail}
                status={emailStatus}
                type="email"
                autoComplete="email"
              />
            </div>
            <TextInput
              label="비밀번호"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
            />
            <TextInput
              label="비밀번호 확인"
              value={passwordConfirm}
              onChange={(event) => setPasswordConfirm(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
          </div>

          <label className="mt-3 flex min-h-9 items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
            비밀번호 표시
          </label>

          <div className="mt-4 rounded-2xl border border-line bg-panel p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-night">비밀번호 조건</p>
              <StatusPill tone={passwordValid ? "success" : "warning"}>
                {passwordValid ? "조건 충족" : "확인 필요"}
              </StatusPill>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passwordChecks.map((check) => (
                <span
                  key={check.label}
                  className={`border px-3 py-1 text-xs font-semibold ${
                    check.passed ? "border-mint/20 bg-emerald-50 text-mint" : "border-line bg-white text-slate-500"
                  }`}
                >
                  {check.passed ? "완료" : "필요"} - {check.label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <ConsentRow checked={termsAccepted} onChange={setTermsAccepted} required label="서비스 이용약관 동의" />
            <ConsentRow checked={privacyAccepted} onChange={setPrivacyAccepted} required label="개인정보 수집 및 이용 동의" />
            <ConsentRow
              checked={securityNoticeAccepted}
              onChange={setSecurityNoticeAccepted}
              required
              label="실제 직원 개인정보와 민감정보를 입력하지 않는다는 보안 안내 확인"
            />
            <ConsentRow checked={marketingOptIn} onChange={setMarketingOptIn} label="서비스 개선 안내 및 발표용 피드백 수신 동의" />
          </div>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button type="button" onClick={submit} disabled={isLoading || !canSubmit} className="mt-6 w-full rounded-2xl">
            {isLoading ? "계정 생성 중" : "회원가입"}
          </Button>
        </Card>
      </section>
    </PageShell>
  );
}

function CareerHeroPanel() {
  return (
    <aside className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[linear-gradient(145deg,#eef5ff_0%,#ffffff_42%,#dbeafe_100%)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.10)]">
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">CL</span>
          <span className="text-xl font-black text-night">CareerLens</span>
        </div>

        <h2 className="mt-16 max-w-[560px] text-4xl font-black leading-tight text-night md:text-[44px]">
          해외취업 준비, 명확하게
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

function CheckedInput({
  label,
  helper,
  value,
  onChange,
  onCheck,
  status,
  type = "text",
  autoComplete
}: {
  label: string;
  helper: string;
  value: string;
  onChange: (value: string) => void;
  onCheck: () => void;
  status: AvailabilityStatus;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-brand">{label}</span>
        <span className="text-xs font-medium text-slate-400">{helper}</span>
      </div>
      <div className="grid grid-cols-[1fr_96px] gap-2">
        <input
          className="h-10 w-full border border-line bg-white px-3 text-sm text-ink focus:border-brand"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onCheck}
          disabled={status === "checking"}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-night transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "checking" ? "확인 중" : "중복 확인"}
        </button>
      </div>
      {status !== "idle" && (
        <p className={`mt-2 text-xs font-semibold ${status === "available" ? "text-mint" : "text-coral"}`}>
          {availabilityMessage(status)}
        </p>
      )}
    </div>
  );
}

function availabilityMessage(status: AvailabilityStatus) {
  if (status === "checking") {
    return "중복 여부를 확인하고 있습니다.";
  }
  if (status === "available") {
    return "사용 가능합니다.";
  }
  if (status === "unavailable") {
    return "이미 사용 중입니다.";
  }
  if (status === "error") {
    return "형식을 확인하거나 잠시 후 다시 시도해주세요.";
  }
  return "";
}

function ConsentRow({
  checked,
  onChange,
  label,
  required = false
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-line bg-white p-3 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
      <span>
        {required && <span className="font-semibold text-coral">[필수] </span>}
        {!required && <span className="font-semibold text-slate-500">[선택] </span>}
        {label}
      </span>
    </label>
  );
}

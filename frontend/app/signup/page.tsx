"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, PageShell, SelectInput, StatusPill, TextInput } from "@/components/ui";
import { signup, storeUser } from "@/lib/auth";

const dialCodes = [
  { label: "대한민국 +82", value: "+82" },
  { label: "미국 +1", value: "+1" },
  { label: "일본 +81", value: "+81" },
  { label: "영국 +44", value: "+44" },
  { label: "싱가포르 +65", value: "+65" },
  { label: "호주 +61", value: "+61" },
  { label: "독일 +49", value: "+49" },
  { label: "프랑스 +33", value: "+33" }
];

const onboardingSteps = [
  {
    title: "계정 생성",
    description: "아이디, 이메일, 비밀번호 정책을 검증하고 사용자 계정을 생성합니다.",
    status: "현재"
  },
  {
    title: "해외취업 프로필 입력",
    description: "희망 국가, 직무군, 기술, 언어, 우선순위 정보를 저장합니다.",
    status: "다음"
  },
  {
    title: "맞춤채용정보 진단",
    description: "프로필과 공고, PatternProfile을 비교해 추천 결과를 생성합니다.",
    status: "다음"
  },
  {
    title: "커리어 로드맵 연결",
    description: "부족 요소를 주차별 준비 과제와 지원 관리 흐름으로 전환합니다.",
    status: "확장"
  }
];

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [countryDialCode, setCountryDialCode] = useState("+82");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [securityNoticeAccepted, setSecurityNoticeAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
      setErrorMessage("입력값, 비밀번호 정책, 필수 동의 항목을 다시 확인해주세요.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signup({
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
      storeUser(user);
      router.push("/mypage");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <section className="lens-container grid gap-5 py-8 lg:grid-cols-[1fr_430px]">
        <Card className="p-6 md:p-8">
          <Badge tone="brand">CREATE ACCOUNT</Badge>
          <h1 className="mt-4 text-3xl font-semibold text-night">CareerLens 회원가입</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            계정을 만들면 해외취업 프로필, 추천 진단 결과, 커리어 로드맵, 지원 관리 기록을 사용자별로
            저장할 수 있습니다. 아이디와 이메일은 중복 검증 대상입니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextInput
              label="아이디"
              helper="4~30자, 영문/숫자/._-"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="username"
            />
            <TextInput
              label="이름"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
            />
            <TextInput
              label="이메일"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              type="email"
            />
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <SelectInput
                label="국가번호"
                value={countryDialCode}
                onChange={(event) => setCountryDialCode(event.target.value)}
              >
                {dialCodes.map((code) => (
                  <option key={code.value} value={code.value}>
                    {code.label}
                  </option>
                ))}
              </SelectInput>
              <TextInput
                label="휴대폰"
                helper="선택"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                autoComplete="tel"
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

          <div className="mt-4 border border-line bg-panel p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-night">비밀번호 보안 정책</p>
              <StatusPill tone={passwordValid ? "success" : "warning"}>
                {passwordValid ? "정책 충족" : "확인 필요"}
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
                  {check.passed ? "완료" : "필요"} · {check.label}
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
            <p role="alert" className="mt-4 border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button type="button" onClick={submit} disabled={isLoading || !canSubmit} className="mt-6 w-full">
            {isLoading ? "계정 생성 중" : "회원가입 후 프로필 설정"}
          </Button>

          <p className="mt-4 text-center text-sm text-slate-600">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">
              로그인
            </Link>
          </p>
        </Card>

        <aside className="border border-night bg-night p-6 text-white shadow-panel md:p-8">
          <p className="text-sm font-semibold text-cyan-200">가입 후 진행 흐름</p>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            {onboardingSteps.map((step, index) => (
              <li key={step.title} className="border-l border-white/20 pl-4">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-white">{index + 1}. {step.title}</strong>
                  <StatusPill tone={index === 0 ? "success" : "muted"}>{step.status}</StatusPill>
                </div>
                <p className="mt-1 text-slate-300">{step.description}</p>
              </li>
            ))}
          </ol>
          <div className="mt-6 border border-white/10 bg-white/10 p-4 text-sm leading-6 text-slate-200">
            로그인 실패 5회 이상이면 계정이 15분간 잠깁니다. 관리자 공고 수집 기능은 ADMIN 권한과 JWT 토큰이
            있을 때만 접근할 수 있습니다.
          </div>
        </aside>
      </section>
    </PageShell>
  );
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
    <label className="flex items-start gap-3 border border-line bg-white p-3 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
      <span>
        {required && <span className="font-semibold text-coral">[필수] </span>}
        {!required && <span className="font-semibold text-slate-500">[선택] </span>}
        {label}
      </span>
    </label>
  );
}

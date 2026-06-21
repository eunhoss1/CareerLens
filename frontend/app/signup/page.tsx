"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import {
  Button,
  Card,
  PageShell,
  StatusPill,
  TextInput,
} from "@/components/ui";
import {
  checkEmailAvailability,
  checkLoginIdAvailability,
  signup,
} from "@/lib/auth";

type AvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

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
  const [loginIdStatus, setLoginIdStatus] =
    useState<AvailabilityStatus>("idle");
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
      {
        label: "비밀번호 확인 일치",
        passed: password.length > 0 && password === passwordConfirm,
      },
    ],
    [password, passwordConfirm]
  );

  const loginIdValid = /^[a-zA-Z0-9._-]{4,30}$/.test(normalizedLoginId);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const passwordValid = passwordChecks.every((check) => check.passed);
  const canSubmit =
    loginIdValid &&
    loginIdStatus === "available" &&
    emailValid &&
    emailStatus === "available" &&
    passwordValid &&
    termsAccepted &&
    privacyAccepted &&
    securityNoticeAccepted;

  async function submit() {
    if (!canSubmit) {
      setErrorMessage("필수 항목과 중복 확인을 모두 완료해주세요.");
      return;
    }
    setIsLoading(true);
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
        marketing_opt_in: marketingOptIn,
      });
      router.push("/login");
    } catch (e: any) {
      setErrorMessage(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <main className="mx-auto max-w-[1000px] px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-slate-900">
            CareerLens 회원가입
          </h1>
          <p className="mt-3 text-slate-500">
            글로벌 커리어 여정을 지금 바로 시작하세요.
          </p>
        </div>

        <Card className="p-8 rounded-3xl border border-slate-200 shadow-sm max-w-[600px] mx-auto">
          <div className="space-y-6">
            <CheckedInput
              label="아이디"
              value={loginId}
              onChange={(v: string) => {
                setLoginId(v);
                setLoginIdStatus("idle");
              }}
              onCheck={async () => {
                setLoginIdStatus("checking");
                const res = await checkLoginIdAvailability(normalizedLoginId);
                setLoginIdStatus(res.available ? "available" : "unavailable");
              }}
              status={loginIdStatus}
            />
            <TextInput
              label="이름"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <CheckedInput
              label="이메일"
              value={email}
              onChange={(v: string) => {
                setEmail(v);
                setEmailStatus("idle");
              }}
              onCheck={async () => {
                setEmailStatus("checking");
                const res = await checkEmailAvailability(normalizedEmail);
                setEmailStatus(res.available ? "available" : "unavailable");
              }}
              status={emailStatus}
            />

            <div className="grid grid-cols-2 gap-4">
              <TextInput
                label="비밀번호"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <TextInput
                label="비밀번호 확인"
                type={showPassword ? "text" : "password"}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <ConsentRow
                label="서비스 이용약관 동의 (필수)"
                checked={termsAccepted}
                onChange={setTermsAccepted}
              />
              <ConsentRow
                label="개인정보 수집 및 이용 동의 (필수)"
                checked={privacyAccepted}
                onChange={setPrivacyAccepted}
              />
              <ConsentRow
                label="보안 안내 확인 (필수)"
                checked={securityNoticeAccepted}
                onChange={setSecurityNoticeAccepted}
              />
            </div>

            <Button
              className="w-full rounded-xl"
              onClick={submit}
              disabled={isLoading || !canSubmit}
            >
              회원가입 완료
            </Button>
          </div>
        </Card>
      </main>
    </PageShell>
  );
}

function CheckedInput({ label, value, onChange, onCheck, status }: any) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-900">{label}</label>
      <div className="flex gap-2 mt-1">
        <input
          className="flex-1 h-10 px-3 border border-slate-200 rounded-xl"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          variant="secondary"
          onClick={onCheck}
          className="rounded-xl border-slate-200"
        >
          확인
        </Button>
      </div>
      {status !== "idle" && (
        <p
          className={`mt-1 text-xs font-bold ${
            status === "available" ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

function ConsentRow({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

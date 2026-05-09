"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, PageShell, StatusPill, TextInput } from "@/components/ui";
import { signup, storeUser } from "@/lib/auth";
import { menuFlow } from "@/lib/menu";

export default function SignupPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const passwordChecks = useMemo(
    () => [
      { label: "8자 이상", passed: password.length >= 8 },
      { label: "영문 포함", passed: /[a-zA-Z]/.test(password) },
      { label: "숫자 포함", passed: /\d/.test(password) },
      { label: "비밀번호 확인 일치", passed: password.length > 0 && password === passwordConfirm }
    ],
    [password, passwordConfirm]
  );

  const canSubmit =
    /^[a-zA-Z0-9._-]{4,30}$/.test(loginId) &&
    displayName.trim().length > 0 &&
    email.includes("@") &&
    passwordChecks.every((check) => check.passed) &&
    termsAccepted;

  async function submit() {
    if (!canSubmit) {
      setErrorMessage("입력값을 다시 확인해주세요.");
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signup({
        login_id: loginId.trim().toLowerCase(),
        display_name: displayName.trim(),
        email: email.trim().toLowerCase(),
        password,
        password_confirm: passwordConfirm,
        terms_accepted: termsAccepted
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
          <h1 className="mt-4 text-3xl font-semibold text-night">회원가입</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            계정을 만든 뒤 마이페이지에서 해외취업 프로필을 입력하면 추천 진단과 커리어 플래너가 사용자별 기록으로 저장됩니다.
          </p>

          <div className="mt-6 grid gap-4">
            <TextInput label="아이디" helper="4~30자, 영문/숫자/._-" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            <TextInput label="이름" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            <TextInput label="이메일" value={email} onChange={(event) => setEmail(event.target.value)} />
            <TextInput label="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
            <TextInput label="비밀번호 확인" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} type="password" />
          </div>

          <div className="mt-4 border border-line bg-panel p-4">
            <p className="text-sm font-semibold text-night">비밀번호 조건</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passwordChecks.map((check) => (
                <span key={check.label} className={`px-3 py-1 text-xs font-semibold ${check.passed ? "bg-emerald-50 text-mint" : "bg-slate-100 text-slate-500"}`}>
                  {check.passed ? "완료" : "필요"} · {check.label}
                </span>
              ))}
            </div>
          </div>

          <label className="mt-4 flex items-start gap-3 border border-line bg-white p-3 text-sm text-slate-700">
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-1" />
            <span>
              캡스톤 시연용 서비스 이용에 동의합니다. 실제 직원 개인정보와 원본 조사 파일은 업로드하지 않고, 익명화·정규화된 데이터만 사용합니다.
            </span>
          </label>

          {errorMessage && <p role="alert" className="mt-4 border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>}

          <Button type="button" onClick={submit} disabled={isLoading || !canSubmit} className="mt-6 w-full">
            {isLoading ? "가입 중" : "회원가입 후 프로필 설정"}
          </Button>

          <p className="mt-4 text-center text-sm text-slate-600">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-semibold text-brand underline-offset-4 hover:underline">로그인</Link>
          </p>
        </Card>

        <aside className="border border-night bg-night p-6 text-white shadow-panel md:p-8">
          <p className="text-sm font-semibold text-cyan-200">사용자 흐름</p>
          <ol className="mt-5 space-y-4 text-sm leading-6 text-slate-200">
            {menuFlow.map((step, index) => (
              <li key={step} className="border-l border-white/20 pl-4">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-white">{index + 1}. {step}</strong>
                  <StatusPill tone={index <= 1 ? "success" : "muted"}>{index <= 1 ? "현재" : "다음"}</StatusPill>
                </div>
                <p className="mt-1 text-slate-300">{flowCopy(index)}</p>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </PageShell>
  );
}

function flowCopy(index: number) {
  const copies = [
    "계정을 만들고 사용자별 기록을 시작합니다.",
    "추천 진단에 필요한 기준 데이터를 입력합니다.",
    "공고별 패턴과 사용자 프로필을 비교합니다.",
    "부족 요소를 준비 과제로 바꿉니다.",
    "지원 단계와 서류 상태를 관리합니다.",
    "비자와 초기 정착 준비까지 확장합니다."
  ];
  return copies[index] ?? "";
}

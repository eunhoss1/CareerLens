"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, PageShell, StatusPill, TextInput } from "@/components/ui";
import { login, storeUser } from "@/lib/auth";

const securityNotes = [
  {
    label: "인증 방식",
    value: "로그인 성공 시 JWT access token을 발급하고 브라우저에 저장합니다."
  },
  {
    label: "로그인 보호",
    value: "비밀번호 실패가 5회 누적되면 계정이 15분 동안 잠깁니다."
  },
  {
    label: "권한 정책",
    value: "외부 공고 수집 같은 관리자 기능은 ADMIN 토큰이 있을 때만 접근됩니다."
  }
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
      router.push(user.profile_completed ? "/jobs/recommendation" : "/mypage");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageShell>
      <SiteHeader />
      <section className="lens-container grid gap-5 py-8 lg:grid-cols-[430px_1fr]">
        <aside className="border border-night bg-night p-6 text-white shadow-panel md:p-8">
          <span className="lens-kicker border-white/30 bg-white text-night">SECURE ACCESS</span>
          <h1 className="mt-5 text-3xl font-semibold">CareerLens 계정으로 이어서 준비하기</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            로그인하면 사용자별 해외취업 프로필, 추천 진단 결과, 커리어 로드맵, 지원 관리 기록을 이어서
            확인할 수 있습니다.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            {securityNotes.map((note) => (
              <StatusRow key={note.label} label={note.label} value={note.value} />
            ))}
          </div>
        </aside>

        <Card className="p-6 md:p-8">
          <Badge tone="brand">ACCOUNT LOGIN</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-night">로그인</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            아이디 또는 이메일로 로그인합니다. 로그인 토큰은 추천 진단, 마이페이지, 관리자 API 호출에
            사용됩니다.
          </p>

          <div className="mt-6 space-y-4">
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-9 items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} />
              비밀번호 표시
            </label>
            <span className="text-xs text-slate-500">비밀번호 재설정은 후속 기능에서 이메일 인증과 함께 연결 예정</span>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-4 border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <Button
            type="button"
            onClick={submit}
            disabled={isLoading || !loginId.trim() || !password}
            className="mt-6 w-full"
          >
            {isLoading ? "로그인 중" : "로그인"}
          </Button>

          <p className="mt-4 text-center text-sm text-slate-600">
            아직 계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-brand underline-offset-4 hover:underline">
              회원가입
            </Link>
          </p>
        </Card>
      </section>
    </PageShell>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/10 bg-white/10 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-cyan-200">{label}</p>
        <StatusPill tone="muted">보호</StatusPill>
      </div>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

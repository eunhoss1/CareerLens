"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Badge, Button, Card, PageShell, StatusPill, TextInput } from "@/components/ui";
import { login, storeUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("careerlens-demo");
  const [password, setPassword] = useState("Career1234!");
  const [remember, setRemember] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await login({ login_id: loginId.trim().toLowerCase(), password });
      if (remember) {
        storeUser(user);
      }
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
          <span className="lens-kicker border-white/30 bg-white text-night">CAREERLENS LOGIN</span>
          <h1 className="mt-5 text-3xl font-semibold">다시 이어서 준비하기</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            로그인하면 저장된 해외취업 프로필, 추천 진단 결과, 커리어 플래너를 사용자 기록 기준으로 이어서 확인합니다.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <StatusRow label="마이페이지" value="저장된 해외취업 프로필 불러오기" />
            <StatusRow label="맞춤채용정보" value="추천 진단 실행 및 결과 저장" />
            <StatusRow label="커리어 플래너" value="생성된 로드맵 이어보기" />
          </div>
        </aside>

        <Card className="p-6 md:p-8">
          <Badge tone="brand">ACCOUNT ACCESS</Badge>
          <h2 className="mt-4 text-3xl font-semibold text-night">로그인</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            아이디 또는 이메일로 로그인할 수 있습니다. 프로필이 이미 저장되어 있으면 바로 추천 진단 화면으로 이동합니다.
          </p>

          <div className="mt-6 space-y-4">
            <TextInput label="아이디 또는 이메일" value={loginId} onChange={(event) => setLoginId(event.target.value)} />
            <TextInput label="비밀번호" value={password} onChange={(event) => setPassword(event.target.value)} type="password" />
          </div>

          <label className="mt-4 flex min-h-10 items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
            이 브라우저에 로그인 상태 저장
          </label>

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
            계정이 없나요?{" "}
            <Link href="/signup" className="font-semibold text-brand underline-offset-4 hover:underline">회원가입</Link>
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
        <StatusPill tone="muted">연결</StatusPill>
      </div>
      <p className="mt-1 text-sm text-white">{value}</p>
    </div>
  );
}

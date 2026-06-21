"use client";

import Link from "next/link";
import {
  AuthCheckingScreen,
  AuthRequiredScreen,
  useRequiredAuth,
} from "@/components/auth/RequireAuth";
import { SiteHeader } from "@/components/site-header";
import { Badge, Card, LinkButton, PageShell } from "@/components/ui";

const modules = [
  {
    title: "커리어 플래너",
    href: "/planner",
    bullets: ["로드맵 목록", "주차별 과제", "완료율 확인", "지원 관리 전환"],
  },
  {
    title: "AI 문서 분석",
    href: "/roadmap/employment/documents",
    bullets: [
      "이력서 피드백",
      "자기소개서 보완",
      "포트폴리오 증빙",
      "GitHub 요약",
    ],
  },
  {
    title: "기업 지원 관리",
    href: "/applications",
    bullets: ["관심 공고", "서류 준비", "지원 상태", "다음 액션"],
  },
];

export default function EmploymentRoadmapPage() {
  const auth = useRequiredAuth();

  if (auth.isChecking) return <AuthCheckingScreen title="권한 확인 중..." />;
  if (!auth.user)
    return <AuthRequiredScreen title="로그인 후 이용 가능합니다." />;

  return (
    <PageShell>
      <SiteHeader />

      {/* 보더리스 헤더 스타일 적용 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-8 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              Employment Roadmap
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              취업로드맵
            </h1>
          </div>
          <LinkButton
            href="/planner"
            variant="secondary"
            className="rounded-xl border-slate-200"
          >
            로드맵 목록으로
          </LinkButton>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen py-8">
        <section className="max-w-[1200px] mx-auto px-6">
          <div className="mb-6">
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Application Prep
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              지원 준비 대시보드
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {modules.map((module) => (
              <Link key={module.title} href={module.href}>
                <Card className="flex min-h-[220px] flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                  <h3 className="text-lg font-bold text-slate-900">
                    {module.title}
                  </h3>
                  <div className="mt-6 flex-1 border-t border-slate-100 pt-6">
                    <div className="flex flex-wrap gap-2">
                      {module.bullets.map((bullet) => (
                        <Badge
                          key={bullet}
                          tone="muted"
                          className="bg-slate-100 text-slate-600"
                        >
                          {bullet}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-6 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      바로가기 →
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

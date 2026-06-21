"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  Badge,
  Card,
  LinkButton,
  PageHeader,
  PageShell,
} from "@/components/ui";
import { qnaItems } from "@/lib/resource-guides";

export default function QnaPage() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("전체");

  const filteredPosts = qnaItems.filter((item) => {
    const matchesSearch = item.question
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTag = tag === "전체" || item.tags.includes(tag);
    return matchesSearch && matchesTag;
  });

  return (
    <PageShell>
      <SiteHeader />

      <style jsx global>{`
        .lens-kicker {
          display: inline-block;
          border: none !important;
          background: none !important;
          padding: 0 !important;
          font-size: 10px !important;
          font-weight: 800 !important;
          letter-spacing: 0.15em !important;
          text-transform: uppercase !important;
          color: #4f46e5 !important;
        }
      `}</style>

      <PageHeader
        kicker={<span className="lens-kicker">Q&A RESOURCE</span>}
        title="자주 묻는 질문"
        description="커리어 플래너 활용, 검증 기준 및 서비스 이용 관련 궁금증을 확인하세요."
      />

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          {/* 검색 및 필터 바 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="text"
              placeholder="질문 검색..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-indigo-500 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 outline-none shadow-sm"
              onChange={(e) => setTag(e.target.value)}
            >
              <option value="전체">전체 주제</option>
              {Array.from(new Set(qnaItems.flatMap((i) => i.tags))).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredPosts.map((post, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-lg"
              >
                <div className="flex gap-2 mb-3">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Q. {post.question}
                </h3>
                <p className="text-xs text-slate-500 italic mb-4">
                  A. {post.answer}
                </p>
                <a
                  href={post.relatedHref}
                  className="text-xs font-bold text-indigo-600"
                >
                  답변 보기 ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { LinkButton, MetricCard, PageShell } from "@/components/ui";
import { noticeItems } from "@/lib/resource-guides";

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");

  const filteredPosts = noticeItems.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory = category === "전체" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <PageShell>
      <SiteHeader />
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              NOTICE BOARD
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              공지사항
            </h1>
          </div>
          <LinkButton
            href="/resources"
            variant="secondary"
            className="rounded-xl border-slate-200 text-xs font-semibold"
          >
            자료실
          </LinkButton>
        </div>
      </div>

      <main className="bg-slate-50/50 min-h-screen pb-12">
        <section className="max-w-[1200px] mx-auto px-6 py-8">
          {/* 검색 및 필터 바 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <input
              type="text"
              placeholder="공지사항 검색..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs outline-none focus:border-indigo-500 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 outline-none shadow-sm"
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="전체">전체 카테고리</option>
              {Array.from(new Set(noticeItems.map((i) => i.category))).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="grid gap-3">
            {filteredPosts.map((post, index) => (
              <div
                key={post.id}
                className="group rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-lg"
              >
                <div className="flex justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    {post.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {post.date}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {post.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {post.summary}
                </p>
                <a
                  href={post.relatedHref}
                  className="text-xs font-bold text-indigo-600"
                >
                  상세 확인 ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Card, TextInput } from "@/components/ui";

export type ResourceBoardPost = {
  id: string;
  category: string;
  title: string;
  date: string;
  summary: string;
  body: string[];
  author: string;
  views: number;
  priority?: string;
  status?: string;
  pinned?: boolean;
  tags?: string[];
  relatedHref?: string;
};

export function ResourceBoard({
  posts,
  emptyMessage = "조건에 맞는 게시글이 없습니다."
}: {
  posts: ResourceBoardPost[];
  emptyMessage?: string;
}) {
  const categories = useMemo(() => ["전체", ...Array.from(new Set(posts.map((post) => post.category)))], [posts]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("전체");
  const [selectedId, setSelectedId] = useState(posts[0]?.id ?? "");

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return posts.filter((post) => {
      const categoryMatched = category === "전체" || post.category === category;
      const queryMatched =
        !normalizedQuery ||
        [post.title, post.summary, post.author, post.category, ...(post.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return categoryMatched && queryMatched;
    });
  }, [category, posts, query]);

  const selectedPost = filteredPosts.find((post) => post.id === selectedId) ?? filteredPosts[0] ?? posts[0];

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <Card className="p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <TextInput
            label="게시글 검색"
            helper="제목, 요약, 태그"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색어를 입력하세요"
          />
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-700">카테고리</span>
            <div className="flex min-h-10 flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`border px-3 py-2 text-sm font-semibold transition ${
                    category === item ? "border-night bg-night text-white" : "border-line bg-white text-slate-600 hover:border-night"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden border border-line">
          <div className="hidden grid-cols-[72px_110px_1fr_110px_90px] border-b border-line bg-panel px-4 py-3 text-xs font-bold text-slate-500 md:grid">
            <span>번호</span>
            <span>분류</span>
            <span>제목</span>
            <span>작성일</span>
            <span>조회</span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="bg-white p-8 text-center text-sm text-slate-500">{emptyMessage}</div>
          ) : (
            filteredPosts.map((post, index) => {
              const selected = selectedPost?.id === post.id;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => setSelectedId(post.id)}
                  className={`block w-full border-b border-line px-4 py-4 text-left last:border-b-0 ${
                    selected ? "bg-[#e8f2f1]" : "bg-white hover:bg-panel"
                  }`}
                >
                  <div className="grid gap-3 md:grid-cols-[72px_110px_1fr_110px_90px] md:items-center">
                    <span className="text-xs font-semibold text-slate-500">{post.pinned ? "공지" : String(index + 1).padStart(3, "0")}</span>
                    <span>
                      <Badge tone={post.pinned ? "warning" : "muted"}>{post.category}</Badge>
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-night">{post.title}</span>
                      <span className="mt-1 line-clamp-1 block text-xs text-slate-500">{post.summary}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{post.date}</span>
                    <span className="text-xs font-semibold text-slate-500">{post.views}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-5 xl:sticky xl:top-24 xl:self-start">
        {selectedPost ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {selectedPost.pinned && <Badge tone="warning">상단 고정</Badge>}
              <Badge tone="brand">{selectedPost.category}</Badge>
              {selectedPost.priority && <Badge tone="muted">{selectedPost.priority}</Badge>}
              {selectedPost.status && <Badge tone="success">{selectedPost.status}</Badge>}
            </div>
            <h2 className="mt-4 text-xl font-semibold leading-7 text-night">{selectedPost.title}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 border-y border-line py-3 text-xs text-slate-500">
              <span>작성자: {selectedPost.author}</span>
              <span>작성일: {selectedPost.date}</span>
              <span>조회수: {selectedPost.views}</span>
              <span>글번호: {selectedPost.id}</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-700">{selectedPost.summary}</p>
            <div className="mt-4 space-y-3">
              {selectedPost.body.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-slate-700">
                  {paragraph}
                </p>
              ))}
            </div>
            {selectedPost.tags && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedPost.tags.map((tag) => (
                  <Badge key={tag} tone="muted">{tag}</Badge>
                ))}
              </div>
            )}
            {selectedPost.relatedHref && (
              <div className="mt-5">
                <Link
                  href={selectedPost.relatedHref}
                  className="inline-flex min-h-10 w-full items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-night transition hover:border-night"
                >
                  연결 화면으로 이동
                </Link>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        )}
      </Card>
    </section>
  );
}

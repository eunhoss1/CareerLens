"use client";

import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function PopularJobsPage() {
  return (
    <>
      <style jsx global>{`
        /* 검은 박스 스타일을 강제로 보더리스하게 변경 */
        .lens-kicker {
          border: none !important;
          padding: 0 !important;
          color: #4f46e5 !important; /* Indigo-600 */
          font-weight: 800 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.15em !important;
          background: transparent !important;
        }
      `}</style>

      <RoadmapPlaceholderPage
        kicker="POPULAR JOBS"
        title="인기 공고 조회"
        description="추천 빈도, 관심 저장, 지원 전환 가능성을 기준으로 인기 공고를 보여주는 확장 화면입니다."
        primaryHref="/jobs"
        primaryLabel="전체 공고로"
        items={[
          {
            title: "추천 빈도",
            description:
              "여러 사용자 프로필에서 반복적으로 추천되는 공고를 집계합니다.",
          },
          {
            title: "관심 저장",
            description: "사용자가 저장한 공고를 기반으로 관심도를 표시합니다.",
          },
          {
            title: "지원 전환",
            description:
              "플래너와 지원 관리로 이어진 공고를 핵심 후보로 보여줍니다.",
          },
        ]}
      />
    </>
  );
}

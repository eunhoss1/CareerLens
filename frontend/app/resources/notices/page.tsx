import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function NoticesPage() {
  return (
    <RoadmapPlaceholderPage
      kicker="NOTICES"
      title="공지사항"
      description="CareerLens 업데이트와 시연 안내를 정리하는 자료실 하위 메뉴입니다."
      primaryHref="/resources"
      primaryLabel="자료실로"
      items={[
        { title: "서비스 업데이트", description: "추천 진단, 플래너, 지원 관리 변경 사항을 안내합니다." },
        { title: "데이터 업데이트", description: "수동 조사 공고와 PatternProfile 갱신 내역을 기록합니다." },
        { title: "발표 안내", description: "중간발표와 최종발표 시연 범위를 정리합니다." }
      ]}
    />
  );
}

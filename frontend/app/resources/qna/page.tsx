import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function QnaPage() {
  return (
    <RoadmapPlaceholderPage
      kicker="Q&A"
      title="Q&A"
      description="해외취업 준비와 CareerLens 사용 흐름에 대한 질문을 정리하는 확장 화면입니다."
      primaryHref="/resources"
      primaryLabel="자료실로"
      items={[
        { title: "추천 진단", description: "PatternProfile과 추천 점수 산정 방식에 대한 질문을 정리합니다." },
        { title: "프로필 입력", description: "어떤 사용자 데이터가 추천에 반영되는지 안내합니다." },
        { title: "AI 분석", description: "AI가 어디에 쓰이고 어디에는 쓰이지 않는지 설명합니다." }
      ]}
    />
  );
}

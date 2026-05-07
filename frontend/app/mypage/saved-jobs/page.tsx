import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function SavedJobsPage() {
  return (
    <RoadmapPlaceholderPage
      kicker="SAVED JOBS"
      title="관심 공고"
      description="사용자가 저장한 공고와 추천 후보를 모아 지원 우선순위를 정리하는 확장 화면입니다."
      primaryHref="/applications"
      primaryLabel="지원 관리로"
      items={[
        { title: "관심 저장", description: "전체 공고와 추천 결과에서 관심 공고를 저장합니다." },
        { title: "우선순위", description: "합격 가능성, 연봉, 워라밸, 직무 적합도 기준으로 정렬합니다." },
        { title: "지원 전환", description: "관심 공고를 취업로드맵과 지원 관리로 넘깁니다." }
      ]}
    />
  );
}

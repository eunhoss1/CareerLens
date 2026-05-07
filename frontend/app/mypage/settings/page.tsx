import { RoadmapPlaceholderPage } from "@/components/roadmap-placeholder";

export default function AccountSettingsPage() {
  return (
    <RoadmapPlaceholderPage
      kicker="ACCOUNT SETTINGS"
      title="계정 설정"
      description="로그인 정보, 알림, AI 분석 동의 범위를 관리하는 확장 화면입니다."
      primaryHref="/mypage"
      primaryLabel="내 프로필로"
      items={[
        { title: "계정 정보", description: "아이디, 이메일, 표시 이름을 관리합니다." },
        { title: "AI 분석 동의", description: "이력서/포트폴리오 분석에 필요한 사용자 동의 흐름을 추가합니다." },
        { title: "알림 설정", description: "로드맵 과제, 지원 일정, 정착 체크리스트 알림으로 확장합니다." }
      ]}
    />
  );
}

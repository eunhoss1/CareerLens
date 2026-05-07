export type CountryGuide = {
  country: string;
  marketSummary: string;
  primaryLanguage: string;
  visaFocus: string;
  settlementFocus: string;
  preparationDifficulty: "LOW" | "MEDIUM" | "HIGH";
  links: Array<{
    label: string;
    description: string;
    href: string;
  }>;
};

export type VisaGuide = {
  country: string;
  category: string;
  targetUser: string;
  checklist: string[];
  officialReminder: string;
};

export const countryGuides: CountryGuide[] = [
  {
    country: "미국",
    marketSummary: "공고별 요구 기술과 포트폴리오 근거가 강하게 작동하며, 비자 스폰서십 가능성을 공고 단계에서 확인해야 합니다.",
    primaryLanguage: "영어",
    visaFocus: "고용주 스폰서십, 직무/학력/경력 증빙, 입사 일정과 체류자격 처리 기간 확인",
    settlementFocus: "임시 숙소, 은행, 통신, 보험, 출근 동선 정리",
    preparationDifficulty: "HIGH",
    links: [
      {
        label: "USCIS",
        description: "미국 이민/체류자격 관련 공식 확인 출발점",
        href: "https://www.uscis.gov/"
      },
      {
        label: "U.S. Department of State",
        description: "비자 및 영사 관련 공식 정보 확인",
        href: "https://travel.state.gov/"
      }
    ]
  },
  {
    country: "일본",
    marketSummary: "재류자격과 회사 제출 서류 흐름이 중요하며, 일본어 증빙과 입국 후 행정 처리 준비가 필요합니다.",
    primaryLanguage: "일본어",
    visaFocus: "재류자격, 내정 후 회사 제출 서류, 학력/경력 증빙, 입사 전 절차 확인",
    settlementFocus: "주소 등록, 은행, 통신, 건강보험, 초기 생활비와 이동 동선 정리",
    preparationDifficulty: "MEDIUM",
    links: [
      {
        label: "출입국재류관리청",
        description: "일본 재류자격 및 입국 행정 공식 확인",
        href: "https://www.moj.go.jp/isa/"
      },
      {
        label: "재외공관/대사관",
        description: "국가별 비자 신청 안내와 제출 서류 확인",
        href: "https://www.mofa.go.jp/"
      }
    ]
  }
];

export const visaGuides: VisaGuide[] = [
  {
    country: "미국",
    category: "고용 기반 체류 준비",
    targetUser: "미국 기업 공고를 목표로 하는 구직자",
    checklist: [
      "공고의 visa requirement와 sponsor 가능 여부 확인",
      "학력/경력/프로젝트 증빙 영문본 준비",
      "입사 예정일과 비자 처리 가능 기간 비교",
      "고용주가 요구하는 추가 서류 목록 확인"
    ],
    officialReminder: "비자 유형과 자격 판단은 USCIS, Department of State, 고용주 안내를 기준으로 최종 확인해야 합니다."
  },
  {
    country: "일본",
    category: "재류자격 및 내정 후 서류",
    targetUser: "일본 기업 공고를 목표로 하는 구직자",
    checklist: [
      "내정 후 회사 제출 서류 목록 확인",
      "학력/전공/경력 증빙 일본어 또는 영문본 준비",
      "JLPT 또는 비즈니스 일본어 증빙 정리",
      "입국 후 주소 등록, 보험, 은행 개설 준비"
    ],
    officialReminder: "재류자격과 제출 서류는 출입국재류관리청, 대사관, 고용주 안내를 기준으로 최종 확인해야 합니다."
  }
];

export const resourceDisclaimer =
  "CareerLens 자료실은 수동 검수/시연용 정리 자료입니다. 비자, 체류자격, 입국 요건, 행정 절차의 최신 판단은 반드시 공식기관과 전문가를 통해 확인해야 합니다.";

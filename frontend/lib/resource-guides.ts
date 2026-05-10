export type OfficialLink = {
  label: string;
  description: string;
  href: string;
};

export type NoticeItem = {
  id: string;
  category: "서비스" | "데이터" | "시연" | "정책";
  title: string;
  date: string;
  summary: string;
  audience: string;
  priority: "높음" | "보통" | "참고";
  relatedHref: string;
};

export type QnaItem = {
  question: string;
  answer: string;
  tags: string[];
  relatedHref?: string;
};

export type CountryGuide = {
  country: string;
  code: string;
  marketSummary: string;
  hiringSignals: string[];
  commonRoles: string[];
  primaryLanguage: string;
  visaFocus: string;
  settlementFocus: string;
  profileTips: string[];
  preparationDifficulty: "LOW" | "MEDIUM" | "HIGH";
  links: OfficialLink[];
};

export type VisaGuide = {
  country: string;
  category: string;
  targetUser: string;
  difficulty: "LOW" | "MEDIUM" | "HIGH";
  summary: string;
  requiredSignals: string[];
  checklist: string[];
  riskNotes: string[];
  officialReminder: string;
  links: OfficialLink[];
};

export const noticeItems: NoticeItem[] = [
  {
    id: "notice-auth-jwt",
    category: "서비스",
    title: "로그인/회원가입 및 JWT 인증 구조가 dev에 반영되었습니다",
    date: "2026.05.10",
    summary: "USER/ADMIN 권한 구분, 관리자 공고 API 보호, 로그인 실패 잠금 정책이 추가되었습니다.",
    audience: "전체 팀원",
    priority: "높음",
    relatedHref: "/resources/qna"
  },
  {
    id: "notice-greenhouse",
    category: "데이터",
    title: "외부 공고 API는 관리자 검수 후 DB 저장 방식으로 운영합니다",
    date: "2026.05.09",
    summary: "Greenhouse 공개 Job Board 데이터는 미리보기 후 체크한 공고만 저장하고, 저장된 공고만 추천/로드맵 흐름에 연결합니다.",
    audience: "공고/추천 담당",
    priority: "높음",
    relatedHref: "/jobs/import"
  },
  {
    id: "notice-profile",
    category: "시연",
    title: "추천 진단은 마이페이지 프로필 입력을 기준으로 실행합니다",
    date: "2026.05.08",
    summary: "사용자는 회원가입 후 마이페이지에서 희망 국가, 직무군, 기술, 언어, 우선순위를 입력해야 합니다.",
    audience: "프론트/발표 담당",
    priority: "보통",
    relatedHref: "/mypage"
  },
  {
    id: "notice-visa",
    category: "정책",
    title: "비자 정보는 공식 링크 우선 확인 원칙으로 표시합니다",
    date: "2026.05.10",
    summary: "CareerLens는 비자 가능 여부를 판정하지 않고, 공고의 sponsorship 문구와 공식 기관 확인 링크를 연결합니다.",
    audience: "자료실/정착 담당",
    priority: "보통",
    relatedHref: "/resources/visas"
  }
];

export const qnaItems: QnaItem[] = [
  {
    question: "CareerLens는 실제 채용공고를 자동으로 크롤링하나요?",
    answer:
      "현재 프로토타입은 무단 크롤링을 하지 않습니다. 수동 조사 데이터와 공개 Job Board API를 관리자 검수 후 DB에 저장하는 방식입니다. 자동 수집보다 데이터 출처와 정규화 기준을 설명 가능하게 유지하는 것이 우선입니다.",
    tags: ["데이터 정책", "외부 API"],
    relatedHref: "/jobs/import"
  },
  {
    question: "추천 점수는 AI가 직접 계산하나요?",
    answer:
      "핵심 점수 계산은 공고, 사용자 프로필, PatternProfile의 정형 데이터를 기반으로 수행합니다. AI는 추천 이유, 부족 요소 요약, 커리어 로드맵 과제 생성처럼 설명과 실행 계획을 만드는 보조 역할로 사용합니다.",
    tags: ["추천 진단", "AI 활용"],
    relatedHref: "/jobs/recommendation"
  },
  {
    question: "PatternProfile은 무엇인가요?",
    answer:
      "PatternProfile은 공고와 직원 표본, 가상 합격자 데이터를 압축한 직무 기준 프로필입니다. 사용자를 공고와 1:1로만 비교하지 않고, 해당 공고에서 기대되는 역량 패턴과 비교하기 위해 사용합니다.",
    tags: ["PatternProfile", "추천 알고리즘"],
    relatedHref: "/jobs/recommendation"
  },
  {
    question: "비자 정보는 법률 자문인가요?",
    answer:
      "아닙니다. 자료실의 비자 정보는 준비 체크리스트와 공식 기관 링크를 연결하는 참고 정보입니다. 실제 비자 가능 여부와 제출 서류는 반드시 공식 기관, 고용주, 전문가를 통해 확인해야 합니다.",
    tags: ["비자", "정책"],
    relatedHref: "/resources/visas"
  },
  {
    question: "admin으로 계속 보이는 이유는 무엇인가요?",
    answer:
      "브라우저 localStorage에 마지막 로그인한 admin 계정 정보가 남아 있기 때문입니다. 헤더의 로그아웃 버튼을 누르거나 localStorage의 careerlens_user 값을 삭제한 뒤 일반 계정으로 다시 로그인하면 USER 권한으로 표시됩니다.",
    tags: ["로그인", "권한"],
    relatedHref: "/login"
  },
  {
    question: "로드맵 과제는 어떻게 생성되나요?",
    answer:
      "추천 진단 결과, 공고 정보, 부족 요소, PatternProfile, 준비 기간을 AI 프롬프트 컨텍스트로 전달하고, AI가 주차별 과제 초안을 생성합니다. 생성된 과제는 PlannerTask로 저장되어 완료 상태를 관리할 수 있습니다.",
    tags: ["커리어 플래너", "AI"],
    relatedHref: "/planner"
  }
];

export const countryGuides: CountryGuide[] = [
  {
    country: "미국",
    code: "US",
    marketSummary:
      "소프트웨어, 데이터, AI, 플랫폼 엔지니어링 공고가 많지만, 경력 기준과 고용주 스폰서십 여부가 중요하게 작동합니다. 공고 본문에서 work authorization, sponsorship, location eligibility를 반드시 확인해야 합니다.",
    hiringSignals: ["실무 프로젝트 근거", "시스템 설계 경험", "영어 커뮤니케이션", "비자 스폰서십 여부"],
    commonRoles: ["Backend Engineer", "Frontend Engineer", "Data Scientist", "ML Engineer", "Platform Engineer"],
    primaryLanguage: "영어",
    visaFocus: "고용주 petition, temporary worker visa, employment authorization, sponsorship 문구 확인",
    settlementFocus: "SSN, 은행 계좌, 의료보험, 주거 계약, 세금/급여 서류 확인",
    profileTips: ["영문 이력서와 GitHub 링크를 먼저 정리", "공고별 required skill을 태그화", "work authorization 문구를 지원 전 확인"],
    preparationDifficulty: "HIGH",
    links: [
      {
        label: "USCIS - Working in the United States",
        description: "미국 내 취업 가능 체류자격과 고용 기반 비자 분류를 확인하는 공식 출처입니다.",
        href: "https://www.uscis.gov/working-in-the-united-states"
      },
      {
        label: "U.S. Department of State - Employment",
        description: "미국 취업 비자 그룹과 신청 흐름을 확인하는 공식 출처입니다.",
        href: "https://travel.state.gov/content/travel/en/us-visas/employment.html"
      }
    ]
  },
  {
    country: "일본",
    code: "JP",
    marketSummary:
      "IT 직무는 기술·인문지식·국제업무, 고도전문직 등 체류자격 검토가 중요합니다. 일본어 수준, 학력/전공, 실무 경력, 회사 제출 서류 흐름이 추천 이후 준비 단계와 강하게 연결됩니다.",
    hiringSignals: ["일본어 또는 비즈니스 커뮤니케이션", "학력/전공 근거", "직무 관련 경력", "입사 후 행정 서류 준비"],
    commonRoles: ["Backend Engineer", "Frontend Engineer", "Solution Engineer", "Data Engineer", "Project Manager"],
    primaryLanguage: "일본어, 영어",
    visaFocus: "재류자격, 고용계약, 학력/전공/경력 증빙, 회사 제출 서류 확인",
    settlementFocus: "재류카드, 주소 등록, 건강보험, 은행 계좌, 휴대폰 개통",
    profileTips: ["일본어 수준을 JLPT 또는 업무 경험으로 설명", "학력/전공과 직무 관련성을 정리", "입사 가능 시점과 서류 준비 기간을 분리"],
    preparationDifficulty: "MEDIUM",
    links: [
      {
        label: "일본 출입국재류관리청 - 재류자격",
        description: "일본 체류자격별 활동 범위와 신청 절차를 확인하는 공식 출처입니다.",
        href: "https://www.moj.go.jp/isa/applications/status/index.html"
      },
      {
        label: "MOFA Japan - Work or Long-term stay",
        description: "일본 장기 체류와 취업 관련 비자 유형을 확인하는 공식 출처입니다.",
        href: "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"
      }
    ]
  },
  {
    country: "영국",
    code: "UK",
    marketSummary:
      "Skilled Worker 중심으로 고용주 스폰서, 직무 코드, 급여 기준, 영어 요건을 함께 봐야 합니다. 기술 직무는 직무 코드와 employer sponsor 여부 확인이 핵심입니다.",
    hiringSignals: ["승인된 고용주", "Certificate of Sponsorship", "직무 코드", "영어 요건"],
    commonRoles: ["Software Engineer", "Full Stack Engineer", "Data Analyst", "Security Engineer"],
    primaryLanguage: "영어",
    visaFocus: "Skilled Worker visa, approved employer, CoS, 직무 코드 및 급여 기준 확인",
    settlementFocus: "BRP/eVisa, National Insurance number, 은행 계좌, NHS, 주거 계약",
    profileTips: ["공고 회사가 sponsor licence를 보유했는지 확인", "직무명을 occupation code와 연결", "영어 증빙 가능 여부 정리"],
    preparationDifficulty: "HIGH",
    links: [
      {
        label: "GOV.UK - Skilled Worker visa",
        description: "영국 Skilled Worker 비자의 공식 개요와 자격 요건을 확인합니다.",
        href: "https://www.gov.uk/skilled-worker-visa"
      },
      {
        label: "GOV.UK - Work visas",
        description: "영국 취업 비자 유형을 비교해서 확인하는 공식 출처입니다.",
        href: "https://www.gov.uk/browse/visas-immigration/work-visas"
      }
    ]
  },
  {
    country: "캐나다",
    code: "CA",
    marketSummary:
      "work permit 유형이 다양하고, employer-specific permit과 open permit의 차이가 큽니다. 공고, 고용주, 체류 신분, 학업/경력 이력에 따라 준비 흐름이 달라집니다.",
    hiringSignals: ["work permit 유형", "고용주 제안", "LMIA 여부", "영어/프랑스어 커뮤니케이션"],
    commonRoles: ["Software Developer", "Cloud Engineer", "Data Engineer", "Product Analyst"],
    primaryLanguage: "영어, 프랑스어",
    visaFocus: "work permit 유형, employer-specific/open permit, LMIA 및 고용주 조건 확인",
    settlementFocus: "SIN, 은행 계좌, 주거, 주별 의료보험, 세금 서류",
    profileTips: ["희망 주/도시를 명확히 정리", "공고의 work authorization 문구 확인", "영어/프랑스어 역량을 분리 기재"],
    preparationDifficulty: "MEDIUM",
    links: [
      {
        label: "Canada.ca - Work in Canada",
        description: "캐나다 work permit 유형과 신청 흐름을 확인하는 공식 출처입니다.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/work-permit.html"
      },
      {
        label: "Job Bank Canada",
        description: "캐나다 공식 일자리 정보와 고용시장 탐색에 활용할 수 있는 출처입니다.",
        href: "https://www.jobbank.gc.ca/"
      }
    ]
  },
  {
    country: "싱가포르",
    code: "SG",
    marketSummary:
      "Employment Pass와 S Pass 등 work pass 체계가 명확합니다. 급여, 학력, 경력, 고용주의 신청 절차가 함께 고려되므로 공고 조건과 본인 프로필을 정형화해 비교해야 합니다.",
    hiringSignals: ["Employment Pass 가능성", "급여 범위", "학력/경력", "영어 커뮤니케이션"],
    commonRoles: ["Backend Engineer", "Frontend Engineer", "Data Analyst", "DevOps Engineer"],
    primaryLanguage: "영어",
    visaFocus: "Employment Pass, S Pass, 고용주 신청 절차, 급여/학력/경력 요건 확인",
    settlementFocus: "숙소, 은행 계좌, 통신, 의료보험, 세금 번호",
    profileTips: ["희망 연봉과 경력 연차를 명확히 입력", "영어 업무 커뮤니케이션 경험 정리", "고용주가 work pass를 지원하는지 확인"],
    preparationDifficulty: "MEDIUM",
    links: [
      {
        label: "Singapore MOM - Employment Pass",
        description: "싱가포르 Employment Pass 요건과 신청 흐름을 확인하는 공식 출처입니다.",
        href: "https://www.mom.gov.sg/passes-and-permits/employment-pass"
      },
      {
        label: "Singapore MOM - Work passes",
        description: "싱가포르 work pass 유형을 비교할 수 있는 공식 출처입니다.",
        href: "https://www.mom.gov.sg/passes-and-permits"
      }
    ]
  }
];

export const visaGuides: VisaGuide[] = [
  {
    country: "미국",
    category: "고용 기반 취업 비자 확인",
    targetUser: "미국 IT/데이터/AI 공고를 목표로 하는 구직자",
    difficulty: "HIGH",
    summary:
      "미국은 공고별 sponsorship 여부와 고용주 petition 가능성이 매우 중요합니다. CareerLens는 공고 본문의 sponsorship/work authorization 문구를 먼저 표시하고, 최종 판단은 공식 기관과 고용주 확인으로 연결합니다.",
    requiredSignals: ["sponsorship 문구", "employer petition", "학력/경력 증빙", "입사 가능 시점"],
    checklist: [
      "공고 본문에서 visa sponsorship 또는 work authorization 문구 확인",
      "고용주가 petition을 진행하는지 채용 담당자에게 확인",
      "영문 이력서, 학위, 경력, 프로젝트 증빙 정리",
      "입사 희망일과 비자 처리 가능 기간을 분리해 계획",
      "USCIS와 Department of State 공식 자료로 최종 확인"
    ],
    riskNotes: ["remote 공고라도 근무 가능 주/국가 제한이 있을 수 있음", "Not specified 공고는 지원 전 문의 필요"],
    officialReminder: "미국 취업 가능 여부는 USCIS, Department of State, 고용주 안내를 기준으로 최종 확인해야 합니다.",
    links: [
      {
        label: "USCIS - Temporary Workers",
        description: "미국 temporary worker 분류와 petition 흐름을 확인합니다.",
        href: "https://www.uscis.gov/working-in-the-united-states/temporary-nonimmigrant-workers"
      },
      {
        label: "Travel.State.Gov - Temporary Worker Visas",
        description: "미국 임시 취업 비자 카테고리와 신청 전 과정을 확인합니다.",
        href: "https://travel.state.gov/content/travel/en/us-visas/employment/temporary-worker-visas.html"
      }
    ]
  },
  {
    country: "일본",
    category: "재류자격 및 회사 제출 서류",
    targetUser: "일본 기업 IT 직무를 목표로 하는 구직자",
    difficulty: "MEDIUM",
    summary:
      "일본은 재류자격, 고용계약, 학력/전공/경력 증빙, 회사 제출 서류 흐름을 함께 준비해야 합니다. IT 직무는 기술·인문지식·국제업무 또는 고도전문직 검토가 자주 연결됩니다.",
    requiredSignals: ["재류자격 유형", "학력/전공 관련성", "경력 증빙", "일본어 수준"],
    checklist: [
      "공고 직무와 재류자격 활동 범위가 맞는지 확인",
      "학위, 전공, 경력 증빙을 일본어 또는 영문으로 정리",
      "JLPT 또는 업무상 일본어 경험을 별도 기재",
      "회사에서 요구하는 제출 서류와 입사 일정을 확인",
      "입국 후 주소 등록, 건강보험, 은행 계좌 개설 준비"
    ],
    riskNotes: ["직무명만으로 재류자격을 단정하지 않기", "학력/경력 증빙이 부족하면 일정이 지연될 수 있음"],
    officialReminder: "일본 재류자격과 제출 서류는 출입국재류관리청, MOFA, 고용주 안내를 기준으로 최종 확인해야 합니다.",
    links: [
      {
        label: "출입국재류관리청 - 기술·인문지식·국제업무",
        description: "IT/기술 직무와 연결되는 대표 재류자격의 활동 범위를 확인합니다.",
        href: "https://www.moj.go.jp/isa/applications/status/gijinkoku"
      },
      {
        label: "MOFA Japan - Work or Long-term stay",
        description: "일본 취업/장기 체류 비자 유형을 확인합니다.",
        href: "https://www.mofa.go.jp/j_info/visit/visa/long/index.html"
      }
    ]
  },
  {
    country: "영국",
    category: "Skilled Worker sponsor 확인",
    targetUser: "영국 승인 고용주 공고를 목표로 하는 구직자",
    difficulty: "HIGH",
    summary:
      "영국은 approved employer, Certificate of Sponsorship, eligible occupation, salary requirement가 함께 작동합니다. 공고 회사와 직무 코드 확인이 중요합니다.",
    requiredSignals: ["approved employer", "CoS", "occupation code", "영어 요건"],
    checklist: [
      "공고 회사가 승인 고용주인지 확인",
      "직무명과 occupation code가 맞는지 확인",
      "공고 급여가 비자 기준 검토에 충분한지 확인",
      "영어 요건 증빙 가능 여부 확인",
      "CoS 발급 시점과 비자 신청 가능 기간 확인"
    ],
    riskNotes: ["승인 고용주가 아니면 sponsor 진행이 어려움", "직무 코드와 실제 업무가 다르면 리스크가 커짐"],
    officialReminder: "영국 Skilled Worker 요건은 GOV.UK 공식 안내와 고용주 안내를 기준으로 확인해야 합니다.",
    links: [
      {
        label: "GOV.UK - Skilled Worker visa",
        description: "영국 Skilled Worker 공식 안내입니다.",
        href: "https://www.gov.uk/skilled-worker-visa"
      },
      {
        label: "GOV.UK - Your job",
        description: "직무 코드, sponsor, salary requirement 확인 안내입니다.",
        href: "https://www.gov.uk/skilled-worker-visa/your-job"
      }
    ]
  },
  {
    country: "캐나다",
    category: "Work permit 유형 확인",
    targetUser: "캐나다 기술 직무와 work permit을 함께 검토하는 구직자",
    difficulty: "MEDIUM",
    summary:
      "캐나다는 work permit 유형과 고용주 조건이 지원 전략에 영향을 줍니다. employer-specific permit, open permit, LMIA 여부를 분리해서 확인해야 합니다.",
    requiredSignals: ["work permit 유형", "job offer", "LMIA 여부", "지역/주 조건"],
    checklist: [
      "본인 상황에 맞는 work permit 유형 확인",
      "고용주가 employer-specific permit을 지원하는지 확인",
      "LMIA 필요 여부 확인",
      "SIN, 주거, 의료보험 등 입국 후 행정 준비",
      "장기 체류 또는 PR pathway 가능성은 별도로 검토"
    ],
    riskNotes: ["permit 유형을 잘못 이해하면 지원 전략이 달라짐", "주/도시별 생활 비용 차이를 함께 고려해야 함"],
    officialReminder: "캐나다 work permit은 IRCC 공식 안내와 고용주 안내를 기준으로 확인해야 합니다.",
    links: [
      {
        label: "Canada.ca - Work permit",
        description: "캐나다 work permit 공식 안내입니다.",
        href: "https://www.canada.ca/en/immigration-refugees-citizenship/services/work-canada/work-permit.html"
      }
    ]
  }
];

export const resourceDisclaimer =
  "CareerLens 자료실은 수동 조사와 공식 링크를 바탕으로 한 캡스톤 시연용 정보 허브입니다. 비자, 체류자격, 입국 요건, 행정 절차는 수시로 바뀔 수 있으므로 최종 판단은 반드시 공식 기관, 고용주, 전문가를 통해 확인해야 합니다.";

import { countryLabel } from "./display-labels";

export type AdminStage = {
  phase: "OFFER" | "VISA" | "PRE_DEPARTURE" | "ARRIVAL";
  label: string;
  title: string;
  description: string;
  actions: string[];
};

export type AdminRoadmapContent = {
  country: string;
  officialTitle: string;
  officialDescription: string;
  officialPrinciples: string[];
  officialTags: string[];
  stages: AdminStage[];
};

export function roadmapContentFor(country: string): AdminRoadmapContent {
  if (country === "미국") {
    return {
      country,
      officialTitle: "미국 비자/고용 관련 공식자료 확인",
      officialDescription: "USCIS, Department of State, CBP 자료의 적용 범위와 최신 날짜를 먼저 대조합니다.",
      officialPrinciples: [
        "USCIS는 청원과 취업자격, Department of State는 비자 발급, CBP는 입국 기록 확인에 사용합니다.",
        "공식 페이지의 업데이트 날짜, 적용 대상, 예외 조건을 기록합니다.",
        "고용주 안내는 회사 내부 절차로만 보고, 법적 판단은 공식기관 또는 전문가 검토로 확정합니다."
      ],
      officialTags: ["USCIS", "State Dept.", "Employer", "I-94"],
      stages: [
        {
          phase: "OFFER",
          label: "OFFER",
          title: "오퍼/고용계약 확인",
          description: "오퍼레터와 고용계약에 취업·이민 절차의 기준이 되는 정보가 빠짐없이 적혀 있는지 확인합니다.",
          actions: ["법인명, 직무명, 근무지, 원격 가능 지역을 오퍼레터와 공고 원문에서 대조", "입사 예정일, 연봉, 고용 형태, relocation 지급 범위를 계약 조건으로 분리", "인사 담당자, 이민 담당자, 매니저의 연락 채널과 회신 기한 기록"]
        },
        {
          phase: "VISA",
          label: "VISA",
          title: "비자/재류자격 준비",
          description: "미국 취업 비자 경로와 신청 산출물을 공식자료 기준으로 구분합니다.",
          actions: ["H-1B, O-1, L-1 등 후보 카테고리별 자격 요건 비교", "petition, DS-160, 인터뷰, 승인서처럼 절차별 산출물을 순서대로 배열", "학위, 경력, 수상, 프로젝트 증빙의 영문 원본 또는 공증 필요 여부 표시"]
        },
        {
          phase: "PRE_DEPARTURE",
          label: "PRE-DEPARTURE",
          title: "출국 전 행정 패키지",
          description: "출국 당일과 첫 주에 바로 꺼내야 하는 자료를 이동용 패키지로 구성합니다.",
          actions: ["여권, 비자 스탬프 또는 승인서, 오퍼레터, 항공권을 입국 심사용 묶음으로 보관", "임시 숙소 주소, 공항 이동, 현지 유심 또는 로밍 준비 상태 입력", "보험 개시일, 처방약, 긴급 연락처를 생활 안전 항목으로 별도 보관"]
        },
        {
          phase: "ARRIVAL",
          label: "ARRIVAL",
          title: "입국 후 초기 행정",
          description: "입국 직후 신분 기록, 생활 계정, 회사 등록을 차례대로 처리합니다.",
          actions: ["I-94 기록의 이름, 입국일, 체류 분류, 만료일 검토", "SSN, 은행, 휴대폰, 거주지 관련 신청 진행 상황 표시", "급여 계좌, 세금 양식, 의료보험 선택 등 회사 온보딩 항목 제출"]
        }
      ]
    };
  }

  if (country === "일본") {
    return {
      country,
      officialTitle: "일본 재류자격/입국 행정 공식자료 확인",
      officialDescription: "출입국재류관리청, 외무성, 재외공관 자료의 담당 범위를 구분해 확인합니다.",
      officialPrinciples: [
        "출입국재류관리청은 재류자격과 COE, 외무성/대사관은 비자 발급 안내에 사용합니다.",
        "공식 양식의 개정일, 제출처, 원본 또는 사본 요구 여부를 기록합니다.",
        "회사 안내는 준비 순서를 보조하는 자료로 두고, 제출 요건은 공식기관 기준으로 확정합니다."
      ],
      officialTags: ["ISA Japan", "MOFA", "Embassy", "COE"],
      stages: [
        {
          phase: "OFFER",
          label: "OFFER",
          title: "오퍼/고용계약 확인",
          description: "고용계약서가 실제 직무와 근로조건을 충분히 설명하는지 검토합니다.",
          actions: ["직무명, 업무 범위, 급여, 근무지, 입사 예정일을 계약 항목별로 분리", "회사 담당 부서, 연락처, 서류 발급 예상일을 커뮤니케이션 기록으로 보관", "재류자격 설명에 필요한 직무 관련성과 계약 조건의 연결 포인트 표시"]
        },
        {
          phase: "VISA",
          label: "VISA",
          title: "비자/재류자격 준비",
          description: "재류자격과 COE, 비자 신청에 필요한 증빙을 절차별로 준비합니다.",
          actions: ["기술·인문지식·국제업무 등 후보 재류자격의 활동 범위 비교", "COE 신청, 비자 신청, 입국 순서별 담당자와 예상 처리 기간 배치", "졸업증명, 성적증명, 경력증명, 번역본의 원본 제출 여부 표시"]
        },
        {
          phase: "PRE_DEPARTURE",
          label: "PRE-DEPARTURE",
          title: "출국 전 행정 패키지",
          description: "입국 심사와 첫 출근 전 생활 준비에 필요한 자료를 이동용으로 정리합니다.",
          actions: ["여권, 비자, COE 사본, 고용계약서를 입국 심사용 묶음으로 보관", "숙소 주소, 공항에서 숙소까지 이동, 첫 출근 교통편을 일정표에 입력", "초기 현금, 해외결제 수단, 통신 개통 후보를 생활 준비 항목으로 분리"]
        },
        {
          phase: "ARRIVAL",
          label: "ARRIVAL",
          title: "입국 후 초기 행정",
          description: "거주지 등록과 생활 기반 개설을 현지 행정 순서에 맞춰 처리합니다.",
          actions: ["재류카드 기재 정보 확인 후 시구정촌 주소 등록 진행", "마이넘버, 건강보험/연금, 은행 계좌, 휴대폰 개통 상태 표시", "통근 경로, 급여 계좌, 주민등록 관련 회사 제출 정보 업데이트"]
        }
      ]
    };
  }

  const displayCountry = country === "미기재" ? "희망 국가" : country;
  return {
    country: displayCountry,
    officialTitle: `${displayCountry} 공식자료 확인`,
    officialDescription: "대사관, 이민국, 고용주 안내의 담당 범위를 나누어 최신 기준을 확인합니다.",
    officialPrinciples: [
      "공식기관은 법적 요건, 고용주는 내부 절차, 대사관은 신청 창구 정보로 구분합니다.",
      "최신 날짜, 적용 대상, 제출처, 수수료, 처리 기간을 같은 표에 기록합니다.",
      "불확실한 체류자격 판단은 공식기관 또는 전문가 검토가 필요한 항목으로 표시합니다."
    ],
    officialTags: ["Immigration", "Embassy", "Employer"],
    stages: [
      {
        phase: "OFFER",
        label: "OFFER",
        title: "오퍼/고용계약 확인",
        description: "근로조건과 회사 지원 범위를 계약 문서 기준으로 분리합니다.",
        actions: ["직무, 근무지, 급여, 입사일, 근무 형태를 계약 항목별로 기록", "회사 담당자, 회신 채널, 서류 발급 일정을 커뮤니케이션 항목으로 보관", "현지 행정에 필요한 회사 발급 문서 목록 작성"]
      },
      {
        phase: "VISA",
        label: "VISA",
        title: "비자/재류자격 준비",
        description: "취업 가능한 체류 경로와 신청 산출물을 공식자료 기준으로 구성합니다.",
        actions: ["후보 비자 또는 취업 허가 유형의 자격 요건 비교", "여권, 학력, 경력, 고용 증빙의 원본/번역/공증 필요 여부 표시", "신청, 심사, 승인, 입국 순서와 예상 처리 기간 배치"]
      },
      {
        phase: "PRE_DEPARTURE",
        label: "PRE-DEPARTURE",
        title: "출국 전 행정 패키지",
        description: "이동 중 바로 사용할 자료와 첫 주 생활 정보를 하나로 묶습니다.",
        actions: ["여권, 비자, 오퍼레터, 항공권을 입국 심사용 묶음으로 준비", "숙소 주소, 보험 시작일, 긴급 연락처를 생활 안전 항목으로 정리", "공항 이동, 첫 출근 경로, 현지 결제 수단 준비 상태 표시"]
      },
      {
        phase: "ARRIVAL",
        label: "ARRIVAL",
        title: "입국 후 초기 행정",
        description: "현지 등록과 생활 계정 개설을 입국 후 우선순위대로 처리합니다.",
        actions: ["주소 등록 또는 체류 신고 완료 여부 표시", "은행, 통신, 보험, 세금 또는 급여 계정 개설 상태 업데이트", "회사 온보딩에 필요한 현지 연락처와 거주 정보 제출"]
      }
    ]
  };
}

export function countryMatches(itemCountry: string, targetCountry: string) {
  if (!targetCountry || targetCountry === "미기재") return false;
  return countryLabel(itemCountry) === targetCountry;
}

export function isAdministrationChecklistItem(item: {
  category: string;
  description: string;
}) {
  return item.category.includes("오퍼")
    || item.category.includes("고용계약")
    || item.category.includes("비자")
    || item.category.includes("재류자격")
    || item.category.includes("행정")
    || item.category.includes("출국")
    || item.category.includes("입국 후")
    || item.description.includes("비자")
    || item.description.includes("재류")
    || item.description.includes("주소 등록")
    || item.description.includes("보험")
    || item.description.includes("은행")
    || item.description.includes("증빙")
    || item.description.includes("서류");
}

export function stageMatchesChecklist(phase: AdminStage["phase"], item: {
  category: string;
  checklist_title?: string;
  description: string;
}) {
  const category = item.category;
  const title = item.checklist_title ?? "";

  if (phase === "OFFER") {
    return category.includes("오퍼")
      || category.includes("고용계약")
      || title.includes("오퍼")
      || title.includes("고용조건")
      || title.includes("내정 조건");
  }
  if (phase === "VISA") {
    return category.includes("비자")
      || category.includes("재류자격")
      || title.includes("비자")
      || title.includes("재류자격")
      || title.includes("COE")
      || item.description.includes("비자")
      || item.description.includes("재류");
  }
  if (phase === "PRE_DEPARTURE") {
    return category.includes("출국")
      || category.includes("행정 패키지")
      || title.includes("입국 심사")
      || title.includes("이동 서류")
      || item.description.includes("항공권")
      || item.description.includes("숙소");
  }
  return category.includes("입국 후")
    || category.includes("초기 행정")
    || title.includes("초기 등록")
    || title.includes("주소 등록")
    || item.description.includes("I-94")
    || item.description.includes("주소")
    || item.description.includes("은행")
    || item.description.includes("보험")
    || item.description.includes("통신");
}

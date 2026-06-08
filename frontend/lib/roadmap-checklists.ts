import type { DeparturePlan } from "@/lib/departure";
import type { SettlementChecklistItem } from "@/lib/settlement";

export type ChecklistItem = {
  id: string;
  label: string;
};

export type RoadmapCard = {
  id: string;
  phase: string;
  title: string;
  description: string;
  checklistItems: ChecklistItem[];
};

export type DepartureRoadmapData = {
  country: string;
  companyName?: string;
  jobTitle?: string;
  startDate?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  visaStatus?: string;
  housingStatus?: string;
  destinationCity?: string;
  recommendedArrivalDate?: string;
  departureWindowStart?: string;
  departureWindowEnd?: string;
};

export type RoadmapSection = {
  phase: string;
  title: string;
  description: string;
};

export const departureRoadmapSections: RoadmapSection[] = [
  {
    phase: "OFFER",
    title: "고용계약 확인",
    description: "입사 예정일, 고용주 정보, 비자 스폰서십 여부, 제출 서류를 확정합니다."
  },
  {
    phase: "VISA",
    title: "비자·재류자격 준비",
    description: "국가별 공식기관 기준으로 체류자격, 제출 서류, 처리 기간을 확인합니다."
  },
  {
    phase: "PRE-DEPARTURE",
    title: "출국 전 행정 패키지",
    description: "증빙 서류, 항공권, 숙소, 긴급 연락처, 회사 제출 서류를 하나로 묶습니다."
  },
  {
    phase: "ARRIVAL",
    title: "입국 후 초기 행정",
    description: "주소 등록, 은행, 통신, 보험, 회사 온보딩 서류를 순서대로 처리합니다."
  }
];

export function departureRoadmapDataFromPlan(
  plan: DeparturePlan,
  overrides: Partial<DepartureRoadmapData> = {}
): DepartureRoadmapData {
  return {
    country: overrides.country ?? plan.target_country,
    startDate: overrides.startDate ?? plan.start_date,
    departureAirport: overrides.departureAirport ?? plan.origin_airport,
    arrivalAirport: overrides.arrivalAirport ?? plan.destination_airport,
    destinationCity: overrides.destinationCity ?? plan.destination_city,
    recommendedArrivalDate: overrides.recommendedArrivalDate ?? plan.recommended_arrival_date,
    departureWindowStart: overrides.departureWindowStart ?? plan.departure_window_start,
    departureWindowEnd: overrides.departureWindowEnd ?? plan.departure_window_end,
    companyName: overrides.companyName,
    jobTitle: overrides.jobTitle,
    visaStatus: overrides.visaStatus,
    housingStatus: overrides.housingStatus
  };
}

export function createRoadmapCardsFromDeparturePlan(
  plan: DeparturePlan,
  overrides: Partial<DepartureRoadmapData> = {}
): RoadmapCard[] {
  return createRoadmapCardsFromDepartureData(
    departureRoadmapDataFromPlan(plan, overrides),
    plan.plan_id ?? `${plan.target_country}-${plan.destination_city}-${plan.start_date}`
  );
}

export function createRoadmapCardsFromDepartureData(data: DepartureRoadmapData, baseId: string | number): RoadmapCard[] {
  return departureRoadmapSections.map((section) => {
    const cardId = ["departure", baseId, section.phase, data.country].map(toStorageSegment).join("-");
    return {
      id: cardId,
      phase: section.phase,
      title: titleForDepartureSection(section.phase, data),
      description: descriptionForDepartureSection(section.phase, data),
      checklistItems: buildDepartureChecklistItems(section.phase, data)
    };
  });
}

export function createRoadmapCardsFromSettlementItems(phase: string, items: SettlementChecklistItem[]): RoadmapCard[] {
  return items.map((item) => ({
    id: `administration-${item.item_id}`,
    phase,
    title: `${item.country} · ${item.checklist_title}`,
    description: item.description,
    checklistItems: buildAdministrationChecklistItems(phase, item)
  }));
}

function buildDepartureChecklistItems(phase: string, data: DepartureRoadmapData): ChecklistItem[] {
  const normalizedPhase = phase.toUpperCase();
  const country = data.country;

  if (normalizedPhase === "OFFER") {
    if (isUnitedStates(country)) {
      return [
        item("graduation-certificate", "졸업증명서 영문본 준비"),
        item("transcript", "성적증명서 영문본 준비"),
        item("career-certificate", "경력증명서 영문본 준비"),
        item("scan-pdf", "스캔 파일 PDF로 저장"),
        item("file-name", "제출 가능한 파일명으로 정리")
      ];
    }

    if (isJapan(country)) {
      return [
        item("residence-status", "내정 후 필요한 재류자격 확인"),
        item("company-document-list", "회사 제출 서류 목록 확인"),
        item("education-career-proof", "학력/경력 증빙 서류 준비"),
        item("submission-deadline", "제출 마감일 확인"),
        item("scan-original-storage", "스캔본과 원본 분리 보관")
      ];
    }

    return [
      item("start-date", startDateLabel(data)),
      item("employer-documents", "회사 제출 서류 목록 확인"),
      item("contract-visa-info", "고용계약서의 직무, 근무지, 체류 관련 문구 확인"),
      item("document-language", `${country} 제출 기준에 맞는 번역/공증 필요 여부 확인`),
      item("file-package", "스캔본과 원본 분리 보관")
    ];
  }

  if (normalizedPhase === "VISA") {
    return buildVisaChecklist(country);
  }

  if (normalizedPhase === "PRE-DEPARTURE") {
    if (isJapan(country)) {
      return [
        item("start-date", startDateLabel(data)),
        item("residence-application-schedule", "재류자격 신청 일정 확인"),
        item("flight-search-schedule", flightRouteLabel(data)),
        item("original-copy-ready", "원본 서류와 사본 준비"),
        item("departure-timetable", "출국 전 준비 일정표 작성")
      ];
    }

    return [
      item("start-date", startDateLabel(data)),
      item("visa-processing-period", isUnitedStates(country) ? "비자 예상 처리 기간 확인" : "체류 허가 예상 처리 기간 확인"),
      item("flight-search-schedule", flightRouteLabel(data)),
      item("housing-booking-schedule", housingLabel(data)),
      item("departure-timetable", "출국 전 준비 일정표 작성")
    ];
  }

  return buildArrivalChecklist(country);
}

function buildAdministrationChecklistItems(phase: string, itemData: SettlementChecklistItem): ChecklistItem[] {
  const normalizedPhase = phase.toUpperCase();
  const country = itemData.country;

  if (normalizedPhase === "OFFER") {
    if (country.includes("미국")) {
      return [
        item("graduation-certificate", "졸업증명서 영문본 준비"),
        item("transcript", "성적증명서 영문본 준비"),
        item("career-certificate", "경력증명서 영문본 준비"),
        item("scan-pdf", "스캔 파일 PDF로 저장"),
        item("file-name", "제출 가능한 파일명으로 정리")
      ];
    }

    return [
      item("residence-status", "내정 후 필요한 재류자격 확인"),
      item("company-document-list", "회사 제출 서류 목록 확인"),
      item("education-career-proof", "학력/경력 증빙 서류 준비"),
      item("submission-deadline", "제출 마감일 확인"),
      item("scan-original-storage", "스캔본과 원본 분리 보관")
    ];
  }

  if (normalizedPhase === "VISA") {
    return buildVisaChecklist(country);
  }

  if (normalizedPhase === "PRE-DEPARTURE") {
    return [
      item("start-date", "입사 예정일 확인"),
      item("visa-processing-period", country.includes("미국") ? "비자 예상 처리 기간 확인" : "재류자격 신청 일정 확인"),
      item("flight-search-schedule", "항공권 검색 일정 확인"),
      item("housing-booking-schedule", country.includes("미국") ? "임시 숙소 예약 일정 확인" : "원본 서류와 사본 준비"),
      item("departure-timetable", "출국 전 준비 일정표 작성")
    ];
  }

  return buildArrivalChecklist(country);
}

function buildVisaChecklist(country: string, dueDate?: string): ChecklistItem[] {
  if (isJapan(country)) {
    return [
      item("residence-status", "내정 후 필요한 재류자격 확인"),
      item("company-documents", "회사 제출 서류 목록 확인"),
      item("education-career-proof", "학력/경력 증빙 서류 준비"),
      item("application-schedule", dueDate ? `${dueDate}까지 재류자격 신청 상태 확인` : "재류자격 신청 기한 확인"),
      item("manager-confirmation", "회사 담당자에게 확인 요청")
    ];
  }

  if (isUnitedStates(country)) {
    return [
      item("posting-visa-requirement", "공고 내 visa requirement 확인"),
      item("company-stay-condition", "회사의 체류 가능 조건 확인"),
      item("visa-support", "비자 지원 여부 확인"),
      item("inquiry-email", "관련 문의 메일 작성"),
      item("expert-consulting", "필요 시 전문가 상담 예약")
    ];
  }

  return [
    item("official-visa-policy", `${country} 공식 비자/체류 자격 안내 확인`),
    item("employer-documents", "고용주 제출 서류 목록 확인"),
    item("application-deadline", dueDate ? `${dueDate}까지 처리 여부 기록` : "신청 기한과 예상 처리 기간 확인"),
    item("document-scan", "제출 서류 스캔본과 원본 분리 보관"),
    item("manager-confirmation", "회사 담당자에게 확인 요청")
  ];
}

function buildArrivalChecklist(country: string): ChecklistItem[] {
  if (isJapan(country)) {
    return [
      item("address-registration", "주소 등록 절차 확인"),
      item("bank-account", "은행 계좌 개설 준비"),
      item("mobile-phone", "휴대폰 개통 준비"),
      item("health-insurance", "건강보험 가입 절차 확인"),
      item("arrival-admin-schedule", "입국 후 행정 처리 일정 정리")
    ];
  }

  if (isUnitedStates(country)) {
    return [
      item("temporary-address", "임시 숙소 주소 확인"),
      item("bank-account", "은행 계좌 개설 준비"),
      item("mobile-phone", "휴대폰 개통 준비"),
      item("health-insurance", "의료보험 가입 여부 확인"),
      item("initial-cost", "초기 정착 비용 확인")
    ];
  }

  return [
    item("temporary-address", "임시 숙소 주소 확인"),
    item("bank-account", "은행 계좌 개설 준비"),
    item("mobile-phone", "휴대폰 개통 준비"),
    item("health-insurance", "현지 보험 가입 절차 확인"),
    item("arrival-admin-schedule", `${country} 입국 후 행정 처리 일정 정리`)
  ];
}

function item(id: string, label: string): ChecklistItem {
  return { id, label };
}

function titleForDepartureSection(phase: string, data: DepartureRoadmapData) {
  const country = data.country;
  if (phase === "OFFER") {
    if (isUnitedStates(country)) return `${country} - 학력/경력 증명 영문본 정리`;
    if (isJapan(country)) return `${country} - 재류자격 및 회사 제출 서류 확인`;
    return `${country} - 고용계약 및 제출 서류 확인`;
  }
  if (phase === "VISA") {
    if (isUnitedStates(country)) return `${country} - 비자 스폰서 조건 확인`;
    if (isJapan(country)) return `${country} - 재류자격 및 회사 제출 서류 확인`;
    return `${country} - 비자·체류 자격 조건 확인`;
  }
  if (phase === "PRE-DEPARTURE") {
    return `${country} - 오퍼 이후 출국 일정 초안 작성`;
  }
  if (isUnitedStates(country)) return `${country} - 도착 후 생활 기반 체크`;
  if (isJapan(country)) return `${country} - 거주지와 행정 등록 준비`;
  return `${country} - 입국 후 초기 행정 준비`;
}

function descriptionForDepartureSection(phase: string, data: DepartureRoadmapData) {
  const roleText = [data.companyName, data.jobTitle].filter(Boolean).join(" · ");
  const context = roleText ? `${roleText} 기준으로 ` : "";

  if (phase === "OFFER") {
    return `${context}${startDateLabel(data)}하고 회사 제출 서류와 증빙 파일을 정리합니다.`;
  }
  if (phase === "VISA") {
    return `${context}${data.visaStatus ? `현재 비자 상태(${data.visaStatus})를 기준으로 ` : ""}${data.country} 체류 조건과 신청 흐름을 확인합니다.`;
  }
  if (phase === "PRE-DEPARTURE") {
    return `${flightRouteLabel(data)}하고 ${housingLabel(data)}합니다.`;
  }
  return `${data.recommendedArrivalDate ? `권장 입국일 ${data.recommendedArrivalDate} 이후 ` : ""}${data.destinationCity ?? data.country} 초기 정착 행정을 순서대로 처리합니다.`;
}

function startDateLabel(data: DepartureRoadmapData) {
  return data.startDate ? `입사 예정일 ${data.startDate} 확인` : "입사 예정일 확인";
}

function flightRouteLabel(data: DepartureRoadmapData) {
  if (data.departureAirport && data.arrivalAirport) {
    return `${data.departureAirport} → ${data.arrivalAirport} 항공권 검색 일정 확인`;
  }
  return "항공권 검색 일정 확인";
}

function housingLabel(data: DepartureRoadmapData) {
  if (data.housingStatus) {
    return `숙소 상태 확인: ${data.housingStatus}`;
  }
  if (data.destinationCity) {
    return `${data.destinationCity} 임시 숙소 예약 일정 확인`;
  }
  return "임시 숙소 예약 일정 확인";
}

function isJapan(country: string) {
  return country.includes("일본") || country.toLowerCase().includes("japan");
}

function isUnitedStates(country: string) {
  const normalized = country.toLowerCase();
  return country.includes("미국") || normalized.includes("united states") || normalized === "us" || normalized === "usa";
}

function toStorageSegment(value: string | number) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

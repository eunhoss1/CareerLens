export type GreenhouseBoardPreset = {
  company: string;
  boardToken: string;
  domain: string;
  note: string;
};

export const greenhouseBoardPresets: GreenhouseBoardPreset[] = [
  { company: "Airbnb", boardToken: "airbnb", domain: "Travel / Marketplace", note: "글로벌 숙박/여행 플랫폼" },
  { company: "Stripe", boardToken: "stripe", domain: "Fintech / Payments", note: "결제 인프라와 개발자 플랫폼" },
  { company: "Reddit", boardToken: "reddit", domain: "Social / Community / AI", note: "커뮤니티, 검색, 추천, ML 공고 확보에 적합" },
  { company: "Databricks", boardToken: "databricks", domain: "Data / AI Platform", note: "데이터, AI, 플랫폼 엔지니어링 중심" },
  { company: "Figma", boardToken: "figma", domain: "Design / Collaboration", note: "프론트엔드, 데이터, AI, 제품 개발 공고 확보에 적합" },
  { company: "Notion", boardToken: "notion", domain: "Productivity / SaaS", note: "제품, 인프라, AI 프로덕트 공고 확보에 적합" },
  { company: "Coinbase", boardToken: "coinbase", domain: "Crypto / Fintech", note: "백엔드, 프론트엔드, 보안, 데이터 공고가 다양함" },
  { company: "Greenhouse", boardToken: "greenhouse", domain: "HR SaaS", note: "채용 SaaS 기업 자체 공고" },
  { company: "Anthropic", boardToken: "anthropic", domain: "AI", note: "AI/ML, 인프라, 데이터 직무 보강용" },
  { company: "DoorDash", boardToken: "doordashusa", domain: "Commerce / Logistics", note: "상거래, 물류, 플랫폼 공고 후보" }
];

export const defaultGreenhouseBoardTokens = greenhouseBoardPresets.map((preset) => preset.boardToken);

# Greenhouse Board Token Registry

## 목적

Greenhouse Job Board API는 통합 공고 검색 API가 아니라 회사별 공개 채용보드 API다.

예를 들어 `airbnb` board token을 사용하면 Airbnb 공고만 조회된다. 따라서 CareerLens에서 다양한 기업 공고를 확보하려면 관리자 검수 기반으로 여러 회사의 board token을 등록하고, 전체 조회 결과 중 검증한 공고만 DB에 저장해야 한다.

## 현재 프리셋

프론트 관리자 화면 `/jobs/import`에 아래 board token 프리셋을 등록했다.

| 회사 | board token | 도메인 | 용도 |
| --- | --- | --- | --- |
| Airbnb | `airbnb` | Travel / Marketplace | 여행, 마켓플레이스, 모바일/백엔드 공고 |
| Stripe | `stripe` | Fintech / Payments | 결제, 플랫폼, 백엔드/프론트 공고 |
| Reddit | `reddit` | Social / Community / AI | 추천, 검색, ML, 데이터 공고 |
| Databricks | `databricks` | Data / AI Platform | 데이터, AI, 플랫폼 엔지니어링 공고 |
| Figma | `figma` | Design / Collaboration | 프론트엔드, 데이터, AI 제품 공고 |
| Notion | `notion` | Productivity / SaaS | SaaS, AI Product, 인프라 공고 |
| Coinbase | `coinbase` | Crypto / Fintech | 백엔드, 프론트엔드, 보안, 데이터 공고 |
| Greenhouse | `greenhouse` | HR SaaS | 채용 SaaS 자체 공고 |
| Anthropic | `anthropic` | AI | AI/ML, 인프라, 데이터 공고 |
| DoorDash | `doordashusa` | Commerce / Logistics | 물류, 커머스, 플랫폼 공고 후보 |

## 운영 원칙

- 관리자 미리보기 기본 limit은 `50`개로 둔다.
- `default_country=ALL`, `default_job_family=ALL`로 먼저 가져온 뒤 CareerLens 정규화 로직이 국가/직무군을 추론한다.
- 미리보기 단계에서는 많이 가져와도 되지만, DB 저장은 관리자가 체크박스로 선택한 공고만 수행한다.
- 자동동기화는 새 공고를 자동 저장하지 않고, 이미 검증되어 DB에 등록된 공고만 최신 원문 기준으로 업데이트한다.
- 하나의 회사 공고가 과도하게 쌓이면 전체공고와 추천진단이 한 회사에 치우치므로, 관리자가 회사별 저장 개수를 조절한다.
- 외부 공고는 기본적으로 `공개 API 기반 정규화 데이터`다.
- 연봉, 마감일, 워라밸, 기업가치처럼 원문에 근거가 부족한 항목은 확정 점수로 만들지 않는다.
- AI 추정값을 사용할 경우 `AI 추정`, `근거`, `신뢰도`, `관리자 검수 상태`를 분리해 저장해야 한다.

## 환경변수 예시

```properties
GREENHOUSE_SYNC_ENABLED=true
GREENHOUSE_SYNC_BOARD_TOKENS=airbnb,stripe,reddit,databricks,figma,notion,coinbase,greenhouse,anthropic,doordashusa
GREENHOUSE_SYNC_DEFAULT_COUNTRY=ALL
GREENHOUSE_SYNC_DEFAULT_JOB_FAMILY=ALL
GREENHOUSE_SYNC_LIMIT_PER_BOARD=50
GREENHOUSE_SYNC_CREATE_PATTERN_PROFILE=true
GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0
```

`GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0`은 실제 공고 마감일을 임의로 만들지 않는다는 뜻이다.

자동동기화는 `import_new=false` 정책으로 동작한다. 즉, 신규 공고 후보는 관리자 미리보기 화면에서 검증 후 저장하고, 스케줄러는 기존 저장 공고만 업데이트한다.

## 발표 설명 문장

> Greenhouse API는 전체 기업 공고 검색 API가 아니라 회사별 공개 채용보드 API입니다. 그래서 CareerLens는 관리자가 검수한 board token registry를 두고, 여러 회사에서 소량의 공고를 가져와 내부 JobPosting 형식으로 정규화합니다. 외부 공고는 자동 수집 후보 데이터로 사용하고, 추천 품질이 중요한 항목은 수동 검수 데이터와 PatternProfile을 중심으로 보강합니다.

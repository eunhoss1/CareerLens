# CareerLens

CareerLens는 해외취업을 준비하는 구직자의 프로필과 채용공고, 직원 표본, PatternProfile을 비교해 맞춤 채용 진단 결과와 준비 로드맵을 제공하는 캡스톤 프로토타입입니다.

단순히 채용공고 목록을 보여주는 서비스가 아니라, 다음 흐름을 목표로 합니다.

```txt
회원가입/로그인
-> 마이페이지 해외취업 프로필 입력
-> 전체 공고 조회 또는 맞춤채용정보 추천 진단
-> JobPosting + PatternProfile + UserProfile 비교
-> DiagnosisResult 저장
-> 커리어 개발 플래너/취업 로드맵 생성
-> PlannerTask 산출물 검증
-> 지원 관리, 출국 로드맵, 정착 지원으로 확장
```

## 프로젝트 구조

```txt
backend/     Spring Boot + Spring Data JPA + MySQL/MariaDB
frontend/    Next.js + React + TypeScript + Tailwind CSS
seed-data/   seed 데이터, CSV 템플릿, 전처리 결과
docs/        설계/운영/발표/팀 공유 문서
```

## 주요 버전

### Backend

- Java: 17
- Spring Boot: 3.3.5
- Build Tool: Maven
- ORM: Spring Data JPA / Hibernate
- DB Driver: MySQL Connector/J, MariaDB Java Client
- CSV: Apache Commons CSV 1.11.0
- PDF/DOCX 분석: PDFBox 3.0.3, Apache POI 5.2.5

### Frontend

- Next.js: 16.2.4
- React: 18.3.1
- TypeScript: 5.6.3
- Tailwind CSS: 3.4.14
- Node 타입: `@types/node` 22.9.0

## 주요 도메인

```txt
User
UserProfile
JobPosting
EmployeeProfileSample
PatternProfile
DiagnosisResult
PlannerRoadmap
PlannerTask
ApplicationRecord
SettlementChecklist
VerificationRequest
VerificationBadge
```

## 현재 구현된 주요 기능

### 1. 사용자 진입/프로필 관리

- 회원가입
- 로그인
- 사용자별 프로필 저장/조회
- 관리자 계정 구분
- 마이페이지 해외취업 프로필 입력

프로필 입력 항목은 현재 외부공고 API와 추천 진단 기준을 고려해 다음 수준까지 구성되어 있습니다.

- 희망 국가/도시
- 희망 직무군/직무명
- 선호 근무형태
- 입사 가능 시점
- 총 경력/직무 관련 경력
- 대표 프로젝트 경험
- 산업/도메인 경험
- 기술스택
- 자격증/시험
- 영어/일본어/대표 언어 수준
- 최종 학력/전공
- 희망 연봉
- 비자 스폰서십 필요 여부
- GitHub/포트폴리오 보유 여부
- 선호 조건
- 추천 우선순위: 연봉, 합격 가능성, 워라밸, 기업 가치, 직무 적합도

현재 입력값은 1차 추천 진단에는 충분합니다. 이후 고도화 시에는 `근로허가 상태`, `relocation 가능 여부`, `선호 통화`, `최저 연봉`, `지원 제외 국가`, `희망 seniority`를 추가하는 것이 좋습니다.

### 2. 맞춤채용정보 추천 진단

CareerLens 추천 진단은 단순 사용자-공고 직접 비교가 아닙니다.

```txt
UserProfile
-> JobPosting 1차 필터링
-> 공고별 PatternProfile 조회
-> 사용자 프로필과 직무 패턴 비교
-> 부족 요소 분석
-> 추천 공고/준비도/지원 판단 결과 생성
-> DiagnosisResult 저장
-> 커리어 플래너 생성으로 연결
```

비교 항목:

- 기술스택
- 경력
- 언어
- 학력/자격
- 포트폴리오/GitHub/프로젝트 경험
- 사용자가 선택한 우선순위
- 공고별 평가 가중치

### 3. 전체 공고 조회

- DB에 저장된 전체 공고 조회
- 국가/직무군/검색 필터
- 공고별 로드맵 생성
- 외부 Greenhouse API로 가져온 공고 표시
- 연봉/워라밸/기업가치 점수가 없으면 근거 부족 상태로 표시

### 4. Greenhouse 외부 공고 API 연동

Greenhouse Job Board API는 전체 채용공고 검색 API가 아니라 회사별 공개 Job Board API입니다.

예를 들어 `airbnb` board token은 Airbnb 공고만 가져옵니다. 따라서 CareerLens는 여러 회사의 board token을 관리자 화면에 등록하고, 관리자가 미리보기 후 필요한 공고만 DB에 저장하는 방식으로 운영합니다.

관리자 화면:

```txt
/jobs/import
```

현재 기본 프리셋:

```txt
airbnb
stripe
reddit
databricks
figma
greenhouse
anthropic
doordashusa
asana
discord
duolingo
gitlab
mixpanel
webflow
```

정책:

- Notion/Coinbase는 2026-05-09 기준 공개 Greenhouse Job Board API에서 404가 확인되어 기본 프리셋에서 제외했습니다.
- 외부 공고는 무조건 DB에 저장하지 않습니다.
- 관리자가 체크한 공고만 DB 저장 대상입니다.
- 자동 동기화는 신규 공고를 자동 저장하지 않고, 이미 DB에 저장된 공고만 최신 원문 기준으로 업데이트합니다.
- 공개 API에 명확한 근거가 없는 마감일, 워라밸, 기업가치 점수는 임의 생성하지 않습니다.
- 연봉은 `metadata.currency_range` 또는 공고 본문의 `Compensation / Pay Range / Annual Pay Range`에서 추출합니다.
- 비자는 sponsorship/work authorization 문구가 있을 때만 분류하고, 없으면 `Not specified in public posting`으로 둡니다.

관련 문서:

- `docs/greenhouse-board-token-registry.md`
- `docs/external-job-provider-greenhouse.md`

### 5. 커리어 플래너/취업 로드맵

- 추천 진단 결과 기반 로드맵 생성
- 4주/8주/12주 기간별 과제 생성
- 과제별 설명, 예상 산출물, 검증 기준, 예상 시간 제공
- AI API가 활성화되어 있으면 AI가 주차별 과제 초안을 생성
- AI API가 없거나 실패하면 rule-based fallback 사용

### 6. AI 문서 분석/검증

- 텍스트 입력 분석
- GitHub repository URL 분석
- PDF/DOCX 업로드 분석
- PlannerTask와 VerificationRequest 연결
- 검증 점수 기반 VerificationBadge 발급

배지 기준:

```txt
60점 이상: TASK_VERIFIED_BRONZE
75점 이상: TASK_VERIFIED_SILVER
90점 이상: TASK_VERIFIED_GOLD
GitHub repository 분석 75점 이상: GITHUB_PROJECT_VERIFIED
```

### 7. 지원 관리/정착 지원/출국 로드맵

- 로드맵에서 지원 관리 기록 생성
- 지원 상태 관리
- 국가별 정착 체크리스트 조회/상태 변경
- 정착 준비 요약 생성
- 출국 로드맵에서 입사 예정일 기준 출국 준비 기간 계산
- Duffel/Amadeus 항공 API 연동을 고려한 확장 구조

## 주요 화면

```txt
/
/signup
/login
/mypage
/mypage/badges
/jobs
/jobs/import
/jobs/recommendation
/planner
/planner/[roadmapId]
/roadmap/employment
/roadmap/employment/documents
/applications
/roadmap/departure
/roadmap/administration
/settlement
/resources
/resources/countries
/resources/visas
/recommendations/compare
/recommendations/feed
```

## 주요 API

### Auth

```txt
POST /api/auth/signup
POST /api/auth/login
```

### User Profile

```txt
GET /api/users/{userId}/profile
PUT /api/users/{userId}/profile
```

### Jobs

```txt
GET  /api/jobs
GET  /api/jobs/external/greenhouse/preview
POST /api/jobs/external/greenhouse/import
GET  /api/jobs/external/greenhouse/sync/status
POST /api/jobs/external/greenhouse/sync/run
```

### Recommendations

```txt
POST /api/recommendations/diagnose
POST /api/recommendations/diagnose/users/{userId}
POST /api/recommendations/diagnose/users/{userId}/jobs/{jobId}
GET  /api/recommendations/{userId}
```

### Planner

```txt
POST  /api/planner/roadmaps/from-diagnosis/{diagnosisId}
GET   /api/planner/roadmaps/{roadmapId}
GET   /api/planner/users/{userId}/roadmaps
PATCH /api/planner/tasks/{taskId}/status
```

### Verifications

```txt
POST /api/verifications/tasks/{taskId}/text
POST /api/verifications/tasks/{taskId}/github
POST /api/verifications/tasks/{taskId}/file
GET  /api/verifications/tasks/{taskId}
GET  /api/verifications/users/{userId}/badges
```

### Applications

```txt
GET   /api/applications/users/{userId}
POST  /api/applications/from-roadmap/{roadmapId}
PATCH /api/applications/{applicationId}/status
```

### Settlement

```txt
GET   /api/settlement/users/{userId}/checklists
POST  /api/settlement/users/{userId}/guidance
PATCH /api/settlement/checklists/{itemId}/status
```

### Departure

```txt
POST /api/departure/plan
```

## 실행 방법

### 1. DB 준비

MySQL 예시:

```sql
CREATE DATABASE careerlens CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

MariaDB도 사용 가능합니다. 팀원별 DB가 다르면 환경변수로 맞춥니다.

### 2. Backend 실행

IntelliJ 실행 권장:

- Module: `backend`
- Main class: `com.careerlens.backend.CareerLensBackendApplication`
- Java SDK: 17

환경변수 예시:

```properties
DB_URL=jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_DDL_AUTO=update
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

MariaDB 예시:

```properties
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

### 3. Frontend 실행

```bash
cd frontend
npm install
npm run dev
```

기본 주소:

```txt
http://localhost:3000
```

프론트에서 백엔드 주소를 바꾸려면:

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## AI API 설정

AI API 키는 프론트가 아니라 백엔드 환경변수에 넣습니다. API 키를 GitHub에 커밋하면 안 됩니다.

OpenAI 예시:

```properties
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.4
AI_PLANNER_ENABLED=true
```

현재 AI를 붙이는 것이 적절한 위치:

- 커리어 플래너 주차별 과제 생성
- 이력서/자기소개서/포트폴리오 분석
- GitHub repository 분석
- 공고 요약/검수 보조
- PatternProfile 생성 프롬프트 보조

현재 마이페이지 프로필 입력 화면 자체에는 AI를 바로 붙이지 않는 것이 좋습니다. 사용자가 직접 입력한 정형 데이터가 추천 진단의 기준이 되어야 하기 때문입니다. AI는 입력값을 자동 판단하는 쪽보다, 입력 이후 해석/요약/검증/로드맵 생성에 붙이는 편이 더 설득력 있습니다.

## 인증/JWT 설정

로그인/회원가입 성공 시 백엔드는 JWT access token을 발급합니다. 프론트는 사용자 정보와 함께 token을 저장하고, 관리자 API 요청에는 `Authorization: Bearer {token}` 헤더를 보냅니다.

환경변수 예시:

```properties
JWT_SECRET=충분히_긴_랜덤_문자열
JWT_ISSUER=careerlens
JWT_EXPIRATION_MINUTES=480
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

현재 JWT로 보호하는 API:

```txt
/api/jobs/external/**
```

주의:

- 기존 브라우저 localStorage에 저장된 로그인 정보에는 token이 없을 수 있습니다.
- `/jobs/import`에서 401이 뜨면 로그아웃하거나 localStorage를 지운 뒤 다시 로그인해야 합니다.
- 공유 서버나 배포 환경에서는 `JWT_SECRET` 기본값을 그대로 쓰면 안 됩니다.

관련 문서:

```txt
docs/auth-jwt-security-update.md
docs/auth-authorization-guide.md
```

## Greenhouse 자동 동기화 설정

```properties
GREENHOUSE_SYNC_ENABLED=true
GREENHOUSE_SYNC_BOARD_TOKENS=airbnb,stripe,reddit,databricks,figma,greenhouse,anthropic,doordashusa,asana,discord,duolingo,gitlab,mixpanel,webflow
GREENHOUSE_SYNC_DEFAULT_COUNTRY=ALL
GREENHOUSE_SYNC_DEFAULT_JOB_FAMILY=ALL
GREENHOUSE_SYNC_LIMIT_PER_BOARD=50
GREENHOUSE_SYNC_CREATE_PATTERN_PROFILE=true
GREENHOUSE_SYNC_DEFAULT_DEADLINE_OFFSET_DAYS=0
GREENHOUSE_SYNC_FIXED_DELAY_MILLIS=21600000
```

주의:

- `GREENHOUSE_SYNC_ENABLED=true`로 켜도 신규 공고가 자동으로 무조건 저장되지는 않습니다.
- 자동 동기화는 이미 관리자가 검수해서 DB에 저장한 공고의 원문/정규화 정보를 갱신하는 용도입니다.
- 신규 공고 저장은 `/jobs/import` 관리자 화면에서 미리보기 후 체크박스로 선택해서 진행합니다.

## 팀 작업 규칙

브랜치 구조:

```txt
main
dev
feature/기능명
```

권장 흐름:

```txt
1. dev 최신화
2. feature/기능명 브랜치 생성
3. 작업
4. 변경 파일과 작업 내용을 노션에 공유
5. 공통 파일 또는 다른 담당자 파일을 건드린 경우 담당자에게 먼저 공유
6. PR 또는 dev merge
7. 카톡에 반영 사실 공유
```

노션 공유 시 최소 작성 항목:

```txt
작업 브랜치:
작업 요약:
변경 파일:
영향받는 화면/API:
환경변수 변경 여부:
테스트 방법:
남은 TODO:
```

## 현재 주의사항

- 외부 공고 API는 회사별 Greenhouse board token 기반입니다. 전체 글로벌 공고 검색 API가 아닙니다.
- 공고별 연봉/비자/마감일은 원문 공개 여부에 따라 비어 있을 수 있습니다.
- 공고 마감일은 Greenhouse 공개 API에서 제공하지 않는 경우가 많으므로 임의 생성하지 않습니다.
- 추천 진단에서 외부 공고의 `salary_score`, `work_life_balance_score`, `company_value_score`는 `null`일 수 있습니다.
- 400/500 에러가 화면에 그대로 노출되는 부분은 이후 전역 예외 처리와 사용자 친화 메시지로 개선해야 합니다.
- API 키는 절대 README, docs, GitHub, 카카오톡에 원문으로 공유하지 않습니다.

## 노션 문서 권장 구조

```txt
프로젝트 개요
- CareerLens 프로젝트 개요

기획 문서
- 요구사항 명세서
- 서비스 기능 정의
- 사용자 흐름 정리

설계 문서
- 캡스톤 디자인 설계안
- DB 설계
- API 설계

화면 설계
- 화면 정의서
- 메인페이지 스토리보드
- 맞춤채용정보 추천 진단 화면 흐름

데이터 문서
- 공고 데이터 정리
- 합격자 표본 정리
- PatternProfile 정리
- Greenhouse 외부 공고 연동 정리

알고리즘 문서
- 추천 알고리즘 정리
- 점수 산정 기준
- 우선순위 가중치 기준

개발 문서
- 프론트엔드 구조 정리
- 백엔드 구조 정리
- 실행 방법 정리
- 환경변수 설정 가이드

회의록
- N월 N주차 회의록
- 교수님 피드백 정리

트러블 슈팅
- CORS/DB/Greenhouse/API 키/빌드 오류 기록

가이드 문서
- 시연 순서 가이드
- 팀원 작업 가이드

발표/제출 문서
- 중간발표 자료
- 최종발표 자료
- 발표 대본
- 제출용 캡처 정리
```

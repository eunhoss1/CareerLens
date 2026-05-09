# CareerLens

CareerLens는 해외취업을 준비하는 구직자를 위한 데이터 기반 맞춤채용정보 추천/진단 플랫폼 프로토타입입니다.

단순히 채용공고를 보여주는 서비스가 아니라, 사용자의 해외취업 프로필과 공고별 직무 패턴을 비교해 추천 결과를 만들고, 부족 요소를 커리어 플래너 과제로 전환한 뒤, 사용자가 만든 산출물을 검증해 준비 증빙 배지까지 누적하는 흐름을 목표로 합니다.

## 1. 현재 서비스 흐름

현재 구현된 핵심 시연 흐름은 다음과 같습니다.

```txt
회원가입/로그인
-> 마이페이지 해외취업 프로필 입력
-> 전체 공고 조회 또는 맞춤추천 진단
-> 공고 + PatternProfile + 사용자 프로필 비교
-> DiagnosisResult 저장
-> 커리어 플래너 로드맵 생성
-> PlannerTask 산출물/검증 기준 확인
-> AI 문서 분석 또는 룰 기반 검증
-> VerificationBadge 발급
-> 마이페이지 검증 배지 확인
-> 지원 관리/정착 지원으로 확장
-> 출국로드맵/행정로드맵/자료실로 연결
```

## 2. 프로젝트 구조

```txt
backend/     Spring Boot + Spring Data JPA + MySQL
frontend/    Next.js + React + TypeScript + Tailwind CSS
seed-data/   seed 데이터, CSV 템플릿, 정규화 CSV
docs/        프로젝트 문서
```

## 3. 주요 도메인

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

## 4. 현재 구현된 주요 기능

### 사용자/인증

- 회원가입
- 로그인
- 사용자별 프로필 저장/조회
- 마이페이지 해외취업 프로필 입력

### 맞춤채용정보 추천 진단

- 공고와 사용자 프로필 직접 비교가 아니라 `JobPosting + PatternProfile + UserProfile` 비교 구조
- 국가/직무군/언어/경력 기반 1차 필터링
- 기술, 경력, 언어, 학력/자격, 포트폴리오 적합도 계산
- 합격 가능성, 연봉, 워라밸, 기업 가치, 직무 적합도 가중치 반영
- 추천 결과와 부족 요소 저장
- 전체 공고에서도 특정 공고를 선택해 로드맵 생성 가능

### 전체 공고 조회

- seed/DB 기반 전체 공고 조회
- 국가/직무군/검색 필터
- 공고별 마감기한 표시
- 공고별 로드맵 생성
- Greenhouse 공개 Job Board API 공고 미리보기/DB 등록
- 외부 공고를 내부 JobPosting + 기본 PatternProfile로 정규화

### 커리어 플래너

- 추천 진단 결과 기반 로드맵 생성
- 준비도에 따라 4주/8주/12주 로드맵 구성
- 과제별 설명, 기대 산출물, 검증 기준, 예상 시간, 난이도 제공
- 과제 상태 변경

### AI 문서 분석/검증

- 텍스트 입력 분석
- GitHub repository URL 분석
- PDF/DOCX 업로드 분석
- AI API가 없거나 실패하면 rule-based fallback 사용
- 검증 점수, 좋은 점, 보완점 반환

### 검증 배지

- 검증 점수 기반 배지 발급
- 마이페이지에서 사용자별 검증 배지 확인

발급 기준:

```txt
60점 이상: TASK_VERIFIED_BRONZE
75점 이상: TASK_VERIFIED_SILVER
90점 이상: TASK_VERIFIED_GOLD
GitHub repository 분석 75점 이상: GITHUB_PROJECT_VERIFIED
```

### 지원 관리/정착 지원

- 로드맵에서 지원 관리 기록 생성
- 지원 상태 관리
- 국가별 정착 체크리스트 조회/상태 변경
- 정착 준비 요약 생성
- 출국로드맵에서 입사 예정일 기준 출국 후보 기간 계산
- Amadeus 공식 항공 API 연동 가능
- 행정로드맵에서 비자/서류/초기 행정 준비 흐름 확인

## 5. 주요 화면

실제 연결된 화면:

```txt
/
/signup
/login
/mypage
/mypage/badges
/jobs
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

확장 예정 또는 placeholder 성격의 화면:

```txt
/jobs/popular
/companies
/mypage/saved-jobs
/mypage/settings
/resources/notices
/resources/qna
```

## 6. 주요 API

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
GET /api/jobs
GET /api/jobs/external/greenhouse/preview
POST /api/jobs/external/greenhouse/import
GET /api/jobs/external/greenhouse/sync/status
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

## 7. 데이터 정책

현재 핵심 추천 데이터는 `seed-data` 또는 수동 입력 기반 더미 데이터를 기준으로 합니다.

단, 공고 관리 자동화 가능성을 보여주기 위해 Greenhouse 공개 Job Board API provider를 별도 기능으로 추가했습니다. 이 기능은 무단 크롤링이 아니라 공개 GET API를 사용하며, 가져온 공고를 내부 `JobPosting` 형식으로 정규화합니다.

LinkedIn scraping, 로그인 필요 ATS 데이터 수집, 지원서 제출 API, Greenhouse 페이지 scraping은 사용하지 않습니다.

현재 seed-data 구성:

```txt
공고: 24개
직원 표본: 120개
가상 합격자 패턴: 480개
최종 PatternProfile: 72개
```

사용 파일:

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/accepted-candidate-patterns.csv
seed-data/processed/pattern-profiles.csv
```

공고에는 2026-05-20부터 2026-07-31까지 다양한 마감기한이 포함되어 있습니다.

## 8. AI 활용 범위

추천 점수 계산은 AI가 아니라 rule-based 로직입니다.

AI는 다음 보조 기능에 사용합니다.

```txt
커리어 플래너 과제 생성
문서/산출물 검증
GitHub repository 분석 보조
PDF/DOCX 내용 분석 보조
추천 결과 설명/다음 액션 설명
```

AI API 키가 없거나 호출이 실패하면 rule-based fallback으로 동작합니다.

환경변수:

```txt
AI_PLANNER_ENABLED=true
OPENAI_API_KEY=발급받은_API_KEY
OPENAI_MODEL=gpt-5.4
```

API 키는 절대 GitHub에 올리지 않습니다.

항공편 후보 조회는 Duffel을 1순위 공식 API 후보로 둡니다.

Duffel을 사용할 경우:

```txt
TRAVEL_PROVIDER=duffel
DUFFEL_ENABLED=true
DUFFEL_ACCESS_TOKEN=duffel_test_...
DUFFEL_BASE_URL=https://api.duffel.com
DUFFEL_VERSION=v2
DUFFEL_SUPPLIER_TIMEOUT_MILLIS=10000
```

Amadeus는 legacy optional입니다.

2026년 5월 확인 기준으로 Amadeus Self-Service 신규 등록이 제한되고 2026년 7월 17일 decommission 예정 공지가 표시되고 있습니다.
따라서 아래 설정은 기존 키를 이미 보유한 경우에만 선택적으로 사용합니다.
키가 없어도 출국로드맵은 규칙 기반으로 정상 동작합니다.

```txt
AMADEUS_ENABLED=true
AMADEUS_CLIENT_ID=발급받은_API_KEY
AMADEUS_CLIENT_SECRET=발급받은_API_SECRET
AMADEUS_BASE_URL=https://test.api.amadeus.com
AMADEUS_CURRENCY_CODE=KRW
```

자세한 설정은 아래 문서를 참고합니다.

```txt
docs/ai-api-setup.md
docs/external-job-provider-greenhouse.md
docs/duffel-flight-api-integration.md
docs/departure-flight-api-integration.md
```

## 9. 개발 버전

Backend:

```txt
Java: 17
Spring Boot: 3.3.5
Database: MySQL
Build Tool: Maven
Backend Port: 8080
```

Frontend:

```txt
Next.js: 16.2.4
React: 18.3.1
TypeScript: 5.x
Tailwind CSS: 3.x
Frontend Port: 3000
```

자세한 버전은 아래 문서를 참고합니다.

```txt
docs/team-versions.md
```

## 10. 로컬 DB 설정

MySQL 또는 MariaDB에서 DB를 먼저 생성합니다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

기본 설정 파일:

```txt
backend/src/main/resources/application.yml
```

기본 DB 설정은 환경변수 기반입니다.

```yaml
spring:
  datasource:
    url: ${DB_URL:jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8}
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:1234}
    driver-class-name: ${DB_DRIVER:com.mysql.cj.jdbc.Driver}
  jpa:
    hibernate:
      ddl-auto: ${DB_DDL_AUTO:update}
```

팀 환경에서는 DB 계정/비밀번호를 파일에 직접 수정하지 말고 환경변수로 설정합니다.

MariaDB 사용 예시:

```env
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=본인비밀번호
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

테이블은 직접 만들지 않습니다.
`careerlens` DB만 만들어두면 백엔드 실행 시 JPA가 엔티티 기준으로 테이블을 자동 생성합니다.

프론트 포트가 조원마다 다르면 CORS 허용 origin을 환경변수로 설정할 수 있습니다.

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

자세한 내용:

```txt
docs/local-db-setup.md
```

## 11. 실행 방법

Backend:

```bash
cd backend
mvn spring-boot:run
```

Frontend:

```bash
cd frontend
npm install
npm run dev -- --port 3000
```

접속 주소:

```txt
http://localhost:3000
```

## 12. 데모 계정

seed-data 로딩 시 데모 계정이 생성됩니다.

```txt
login_id: demo
password: CareerLens123!
```

## 13. 권장 시연 순서

```txt
1. 메인 페이지 진입
2. 회원가입 또는 demo 로그인
3. 마이페이지에서 프로필 입력/확인
4. 맞춤채용정보 추천 진단 실행
5. 추천 공고 카드와 부족 요소 확인
6. 커리어 플래너 생성
7. 로드맵 상세에서 과제/기대 산출물/검증 기준 확인
8. AI 문서 분석 페이지 이동
9. 텍스트 또는 GitHub repository URL 제출
10. 검증 결과와 발급 배지 확인
11. 마이페이지 검증 배지 화면 확인
12. 지원 관리로 이동해 지원 파이프라인 확인
13. 출국로드맵에서 입사 예정일 기준 일정 생성
14. 행정로드맵에서 비자/행정 준비 흐름 확인
15. 정착 지원 체크리스트 확인
16. 자료실/비자정보/국가정보 연결 확인
```

## 14. 참고 문서

```txt
docs/current-implementation-status.md
docs/recommendation-service.md
docs/recommendation-data-contract.md
docs/pattern-profile-guide.md
docs/pattern-scoring-guide.md
docs/csv-data-pipeline.md
docs/ai-api-setup.md
docs/departure-flight-api-integration.md
docs/demo-scenario-and-script.md
docs/local-db-setup.md
docs/team-versions.md
```

## 15. 현재 주의할 점

- 실제 크롤링은 구현하지 않았습니다.
- LinkedIn 직원 자동 수집은 하지 않습니다.
- 공고/직원/패턴 데이터는 seed/manual 기반입니다.
- 인증은 캡스톤 시연용 수준입니다.
- AI는 보조 기능이며 합격 가능성을 보장하지 않습니다.
- PDF가 이미지 기반이면 텍스트 추출이 어려울 수 있습니다.
- 실제 기업 지원 제출, 결제, 실시간 비자 최신 판단 기능은 없습니다.
- 항공편 API는 Amadeus 공식 API를 사용할 수 있지만, 예약/가격 보장 기능은 아닙니다.

## 16. 프로젝트 한 줄 설명

```txt
CareerLens는 공고 추천에서 끝나는 서비스가 아니라,
추천 결과를 준비 과제로 바꾸고,
사용자가 만든 산출물을 검증해서
해외취업 준비 증빙까지 누적하는 데이터 기반 커리어 진단 플랫폼입니다.
```

## 17. 현재 작업 진행도

2026년 5월 7일 기준으로 보면, CareerLens는 아이디어 초안 단계는 지나갔고
중간발표에서 실제로 흐름을 보여줄 수 있는 시연용 프로토타입 단계에 들어와 있습니다.

개인적으로 보는 진행도는 다음과 같습니다.

```txt
중간발표 시연용 완성도: 75~80%
1번 맞춤채용정보 추천 진단 서비스: 75~80%
커리어 플래너 연결 흐름: 65~70%
AI 문서 분석/검증 배지 흐름: 55~60%
전체 플랫폼 완성도: 45~55%
상용 서비스 기준 완성도: 25~35%
```

현재 강점:

- 회원가입, 로그인, 마이페이지, 프로필 저장 흐름이 연결되어 있음
- 사용자 프로필과 공고/PatternProfile 기반 추천 진단이 실제 API로 동작함
- 추천 결과에서 커리어 플래너를 생성할 수 있음
- 플래너 과제에 기대 산출물과 검증 기준이 포함됨
- 텍스트, GitHub repository, PDF/DOCX 기반 AI 문서 분석 흐름이 있음
- 검증 점수 기반 배지 발급 구조가 있음
- 전체 공고 조회, 지원 관리, 정착 지원까지 메뉴 흐름이 잡혀 있음

아직 부족한 부분:

- 관리자용 공고/직원표본/패턴 등록 화면은 아직 없음
- 공고 데이터는 자동 수집이 아니라 seed/manual 기반임
- 지원 관리와 정착 지원은 1차 시연용 수준임
- AI 결과 품질을 안정화하기 위한 프롬프트/검증 로직 보강이 더 필요함
- 실제 배포, 보안, 권한 관리, 테스트 코드는 상용 수준이 아님
- 크롤링이나 외부 공고 API 연동은 법적/정책 검토 후 별도 설계가 필요함

다음 우선순위:

```txt
1. AI 플래너 결과 품질 안정화
2. GitHub/PDF/DOCX 검증 결과 UI 보강
3. 공고/직원표본/PatternProfile 데이터 관리 방식 문서화
4. 지원 관리와 정착 지원을 실제 시연 흐름처럼 보강
5. 관리자용 seed 데이터 등록/검수 흐름 설계
6. 발표용 시연 시나리오와 대본 정리
```

중간발표에서는 “완성된 상용 서비스”가 아니라,
해외취업 준비 과정을 데이터 기반으로 진단하고 실행 로드맵으로 연결하는
서비스 플랫폼의 핵심 흐름을 구현했다는 방향으로 설명하는 것이 적절합니다.

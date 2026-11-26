# CareerLens

CareerLens는 해외취업을 준비하는 구직자의 프로필과 채용공고, 직원 표본, PatternProfile을 비교해 맞춤 채용 진단 결과와 준비 로드맵을 제공하는 캡스톤 프로젝트입니다.

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

## 1. 주요 기능

- 회원가입 및 로그인
- 사용자별 프로필 저장 및 조회
- 마이페이지 해외취업 프로필 입력 및 관리
- 해외 채용공고 조회 및 국가·직무·검색 필터
- 사용자 프로필 기반 맞춤 채용공고 추천 및 적합도 진단
- 기술스택, 경력, 언어, 학력, 자격, 포트폴리오 등 부족 요소 분석
- 진단 결과 기반 커리어 플래너 및 취업 준비 로드맵 생성
- AI 기반 이력서·자기소개서·포트폴리오 분석
- GitHub Repository 및 PDF/DOCX 문서 분석
- 검증 점수 기반 Verification Badge 발급
- 기업 지원 현황 및 진행 상태 관리
- 출국 로드맵 및 국가별 정착·행정 체크리스트
- 프로멤버십 및 결제 기능
- 관리자용 해외 채용공고 확인 및 등록 기능

## 2. 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Java 17, Spring Boot 3.3.5, Spring Data JPA, Hibernate, Maven |
| Database | MySQL / MariaDB |
| AI | OpenAI API, Groq API |
| External API | Greenhouse Job Board API, Duffel API, KakaoPay API, Amadeus API |
| Infrastructure | AWS EC2, AWS RDS, Docker, Docker Compose, GitHub Actions |
| Development Tools | Git, GitHub, IntelliJ IDEA, Visual Studio Code |

### 주요 버전

#### Backend

- Java: 17
- Spring Boot: 3.3.5
- Build Tool: Maven
- ORM: Spring Data JPA / Hibernate
- DB Driver: MySQL Connector/J, MariaDB Java Client
- CSV: Apache Commons CSV 1.11.0
- PDF/DOCX 분석: PDFBox 3.0.3, Apache POI 5.2.5

#### Frontend

- Next.js: 16.2.4
- React: 18.3.1
- TypeScript: 5.6.3
- Tailwind CSS: 3.4.14
- Node 타입: `@types/node` 22.9.0

## 3. 프로젝트 구조

```text
CareerLens/
├── backend/                  # Spring Boot 백엔드
│   ├── src/main/java/        # Controller, Service, Repository, Entity 등
│   ├── src/main/resources/   # 백엔드 및 데이터베이스 설정
│   └── pom.xml               # Maven 프로젝트 설정
├── frontend/                 # Next.js 웹 프론트엔드
│   ├── app/                  # 페이지 및 라우팅
│   ├── components/           # 공통 UI 컴포넌트
│   ├── public/               # 정적 파일 및 이미지
│   └── package.json          # 프론트엔드 의존성 및 실행 스크립트
├── seed-data/                # 시드 데이터, CSV 템플릿, 전처리 결과
├── docs/                     # 설계·운영·발표·팀 공유 문서
└── README.md                 # 프로젝트 설명 및 실행 안내
```

## 4. 실행 전 준비 사항

아래 프로그램을 먼저 설치합니다.

| 프로그램 | 버전 및 용도 |
|---|---|
| Git | GitHub 저장소 다운로드 및 버전 관리 |
| Node.js / npm | Node.js 20 이상 권장, Next.js 프론트엔드 실행 |
| Java JDK | 17, Spring Boot 백엔드 실행 |
| MySQL 또는 MariaDB | 프로젝트 데이터베이스 |
| IntelliJ IDEA | Spring Boot 백엔드 실행 권장 |
| Visual Studio Code | Next.js 프론트엔드 개발 및 실행 권장 |
| Docker / Docker Compose | 컨테이너 기반 실행 또는 배포 환경 구성 시 사용 |

운영체제는 Windows 10/11 또는 Ubuntu 환경을 기준으로 합니다. 로컬에서 직접 실행하는 경우 MySQL 또는 MariaDB 데이터베이스를 준비하고, 백엔드와 프론트엔드를 각각 실행합니다. Docker를 이용하는 배포 환경에서는 Docker 및 Docker Compose를 사용할 수 있습니다.

설치 여부는 터미널에서 다음 명령어로 확인할 수 있습니다.

```bash
git --version
node -v
npm -v
java -version
```

Docker를 사용하는 경우 다음 명령어도 확인합니다.

```bash
docker --version
docker compose version
```

## 5. 소스코드 다운로드

터미널(PowerShell, 명령 프롬프트 또는 Git Bash)을 열고 저장소를 다운로드합니다.

```bash
git clone https://github.com/kanavi-cloud/CareerLens.git
cd CareerLens
```

이후의 명령어는 별도 안내가 없는 한 `CareerLens` 프로젝트 최상위 폴더를 기준으로 합니다. 프론트엔드와 백엔드는 각각 별도의 터미널 또는 개발 도구에서 실행합니다.

## 6. 데이터베이스 설정

CareerLens는 MySQL 또는 MariaDB 데이터베이스를 사용합니다. 먼저 데이터베이스 서버를 실행한 후 `careerlens` 데이터베이스를 생성합니다.

MySQL 예시:

```sql
CREATE DATABASE careerlens
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

MariaDB를 사용하는 경우에도 데이터베이스 이름을 `careerlens`로 생성합니다. 데이터베이스 계정과 비밀번호는 본인의 로컬 DB 설정에 맞게 확인합니다.

## 7. 환경변수 설정

백엔드와 프론트엔드가 통신할 수 있도록 데이터베이스 접속 정보 및 API 주소를 설정합니다. 환경변수는 각 실행 환경에 맞게 지정하며, 인증 정보가 포함된 파일은 GitHub에 업로드하지 않습니다.

### 7-1. 데이터베이스 및 백엔드 설정

백엔드 실행 설정에 다음 환경변수를 지정합니다. IntelliJ IDEA에서 실행하는 경우 Run/Debug Configurations의 Environment variables 항목에 입력할 수 있습니다.

```properties
DB_URL=jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=com.mysql.cj.jdbc.Driver
DB_DDL_AUTO=update
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

MariaDB를 사용하는 경우 DB 관련 설정을 다음과 같이 변경합니다.

```properties
DB_URL=jdbc:mariadb://localhost:3306/careerlens?useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=1234
DB_DRIVER=org.mariadb.jdbc.Driver
DB_DDL_AUTO=update
```

- `DB_URL`: 백엔드가 접속할 데이터베이스 주소입니다.
- `DB_USERNAME`, `DB_PASSWORD`: 데이터베이스 계정 및 비밀번호입니다.
- `DB_DDL_AUTO=update`: 애플리케이션 실행 시 JPA가 엔티티와 데이터베이스 스키마를 비교하여 갱신하도록 설정합니다.
- `CORS_ALLOWED_ORIGINS`: 프론트엔드 개발 서버의 접속 출처를 지정합니다.
- `ADMIN_LOGIN_IDS`: 관리자 권한을 적용할 로그인 ID를 지정합니다.

위 DB 계정과 비밀번호는 로컬 개발 환경 예시입니다. 공유 서버나 외부에 공개되는 환경에서는 별도의 보안 설정을 사용해야 합니다.

### 7-2. 프론트엔드의 백엔드 주소 설정

프론트엔드 프로젝트 폴더인 `frontend` 안에 `.env.local` 파일을 생성하고 다음 값을 입력합니다.

```properties
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

이 주소는 로컬에서 실행 중인 Spring Boot 백엔드 주소입니다. 백엔드 포트를 변경한 경우 실제 실행 주소에 맞게 수정합니다. 환경변수를 변경한 경우 Next.js 개발 서버를 재시작해야 변경 내용이 반영됩니다.

### 7-3. AI 및 외부 API 설정

AI API 키는 프론트엔드가 아니라 백엔드 환경변수에 설정합니다. API 키를 소스코드나 GitHub 저장소에 직접 입력하지 않습니다.

OpenAI 사용 예시:

```properties
AI_PROVIDER=openai
OPENAI_API_KEY=발급받은_OpenAI_API_키
OPENAI_MODEL=gpt-5.4
AI_PLANNER_ENABLED=true
```

Groq를 사용하는 경우 제공자에 맞는 설정과 발급받은 API 키를 지정합니다.

```properties
GROQ_API_KEY=발급받은_Groq_API_키
GROQ_MODEL=openai/gpt-oss-20b
```

AI API 키가 없거나 AI 기능을 비활성화한 경우에는 AI가 필요한 일부 기능을 사용할 수 없습니다. 커리어 플래너 생성 기능은 AI API가 비활성화되거나 호출에 실패하면 프로젝트에 설정된 rule-based fallback 방식으로 동작할 수 있습니다.

외부 서비스 연동은 다음과 같습니다.

| 서비스 | 활용 기능 |
|---|---|
| Greenhouse API | 해외 기업 채용공고 조회 및 연동 |
| OpenAI API / Groq API | 커리어 플래너 및 문서 분석 등 AI 기능 |
| KakaoPay API | 프로멤버십 결제 기능 |
| Duffel API | 항공편 조회 및 출국 관련 정보 연동 |
| Amadeus API | 항공 정보 조회 연동 |

각 외부 API 기능은 해당 서비스의 인증 정보와 활성화 설정이 완료된 경우에만 사용할 수 있습니다. 결제 및 항공 API는 인증 정보가 없는 로컬 기본 환경에서는 비활성화 상태로 실행할 수 있습니다.

### 7-4. 인증 및 JWT 설정

로그인 및 회원가입 과정에서 백엔드는 JWT access token을 발급합니다. 프론트엔드는 인증이 필요한 API 요청에 토큰을 포함하여 전달합니다.

환경변수 예시:

```properties
JWT_SECRET=충분히_긴_무작위_문자열
JWT_ISSUER=careerlens
JWT_EXPIRATION_MINUTES=480
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

공유 서버나 배포 환경에서는 기본값 또는 예시 문자열을 그대로 사용하지 말고 충분히 긴 별도의 비밀키를 설정합니다.

## 8. 백엔드 실행

백엔드는 Spring Boot 기반으로 구성되어 있습니다. 먼저 데이터베이스 서버가 실행 중인지 확인하고, IntelliJ IDEA에서 프로젝트를 엽니다.

### 8-1. IntelliJ 프로젝트 실행 설정

1. IntelliJ IDEA를 실행합니다.
2. GitHub에서 다운로드한 `CareerLens` 폴더 안의 `backend` 폴더를 프로젝트로 엽니다.
3. Project SDK 또는 Java SDK를 17로 설정합니다.
4. Maven 의존성 다운로드가 완료될 때까지 기다립니다.
5. 다음 메인 클래스를 실행합니다.

```text
com.careerlens.backend.CareerLensBackendApplication
```

실행 설정은 다음과 같습니다.

- Module: `backend`
- Main class: `com.careerlens.backend.CareerLensBackendApplication`
- Java SDK: 17
- 실행 포트: `8080`

실행 전에 7-1의 데이터베이스 및 백엔드 환경변수가 지정되어 있는지 확인합니다. 백엔드가 정상적으로 시작되면 Spring Boot 실행 로그에서 서버 시작 여부를 확인할 수 있습니다.

### 8-2. 백엔드 실행 확인

백엔드 기본 주소는 다음과 같습니다.

```text
http://localhost:8080
```

프론트엔드가 백엔드 API를 호출할 수 있도록 백엔드가 실행된 상태를 유지합니다. 데이터베이스 연결 오류가 발생하는 경우 DB 서버 실행 여부, 데이터베이스 이름, 포트, 계정 및 비밀번호를 확인합니다.

## 9. 프론트엔드 실행

백엔드와 데이터베이스가 실행된 상태에서 새 터미널을 열고 프론트엔드 폴더로 이동합니다.

```bash
cd frontend
```

프론트엔드 의존성을 설치합니다.

```bash
npm install
```

설치가 완료되면 Next.js 개발 서버를 실행합니다.

```bash
npm run dev
```

프론트엔드 개발 서버가 실행되면 웹 브라우저에서 다음 주소로 접속합니다.

```text
http://localhost:3000
```

프론트엔드가 백엔드와 통신하지 못하는 경우 `frontend/.env.local`의 `NEXT_PUBLIC_API_BASE_URL` 값이 `http://localhost:8080`으로 설정되어 있는지 확인하고 프론트엔드 개발 서버를 재시작합니다.

## 10. 서비스 실행 순서 및 테스트 방법

CareerLens를 로컬 환경에서 실행할 때는 다음 순서로 진행합니다.

1. MySQL 또는 MariaDB 데이터베이스 서버를 실행합니다.
2. `careerlens` 데이터베이스가 생성되어 있는지 확인합니다.
3. IntelliJ IDEA에서 Spring Boot 백엔드를 실행합니다.
4. 백엔드가 정상적으로 시작되었는지 실행 로그를 확인합니다.
5. VS Code 또는 터미널에서 `frontend` 폴더로 이동합니다.
6. `npm install`로 프론트엔드 의존성을 설치합니다.
7. `npm run dev`로 Next.js 개발 서버를 실행합니다.
8. 브라우저에서 `http://localhost:3000`에 접속합니다.

서비스 접속 후 다음 순서로 주요 기능을 확인할 수 있습니다.

1. 회원가입 및 로그인
2. 마이페이지에서 해외취업 프로필 입력 및 저장
3. 해외 채용공고 조회 및 검색
4. 맞춤 채용정보 추천 진단 실행
5. 적합도 진단 결과 및 부족 요소 확인
6. 선택한 공고를 기반으로 커리어 플래너 생성
7. AI 문서 분석 및 검증 기능 확인
8. 기업 지원 현황 관리
9. 출국 로드맵 및 행정·정착 체크리스트 확인
10. 검증 뱃지 및 프로멤버십 등 부가 기능 확인

## 11. 주요 화면 및 경로

웹 서비스의 주요 화면 경로는 다음과 같습니다.

```text
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

## 12. 주요 API

백엔드는 REST API 방식으로 프론트엔드와 통신합니다. 주요 API 경로는 다음과 같습니다.

### Auth

```text
POST /api/auth/signup
POST /api/auth/login
```

### User Profile

```text
GET /api/users/{userId}/profile
PUT /api/users/{userId}/profile
```

### Jobs

```text
GET  /api/jobs
GET  /api/jobs/external/greenhouse/preview
POST /api/jobs/external/greenhouse/import
GET  /api/jobs/external/greenhouse/sync/status
POST /api/jobs/external/greenhouse/sync/run
```

### Recommendations

```text
POST /api/recommendations/diagnose
POST /api/recommendations/diagnose/users/{userId}
POST /api/recommendations/diagnose/users/{userId}/jobs/{jobId}
GET  /api/recommendations/{userId}
```

### Planner

```text
POST  /api/planner/roadmaps/from-diagnosis/{diagnosisId}
GET   /api/planner/roadmaps/{roadmapId}
GET   /api/planner/users/{userId}/roadmaps
PATCH /api/planner/tasks/{taskId}/status
```

### Verifications

```text
POST /api/verifications/tasks/{taskId}/text
POST /api/verifications/tasks/{taskId}/github
POST /api/verifications/tasks/{taskId}/file
GET  /api/verifications/tasks/{taskId}
GET  /api/verifications/users/{userId}/badges
```

### Applications

```text
GET   /api/applications/users/{userId}
POST  /api/applications/from-roadmap/{roadmapId}
PATCH /api/applications/{applicationId}/status
```

### Settlement

```text
GET   /api/settlement/users/{userId}/checklists
POST  /api/settlement/users/{userId}/guidance
PATCH /api/settlement/checklists/{itemId}/status
```

### Departure

```text
POST /api/departure/plan
```

## 13. Greenhouse 채용공고 연동

Greenhouse Job Board API는 전체 채용공고를 검색하는 API가 아니라 회사별 공개 Job Board API입니다. 예를 들어 `airbnb` board token은 Airbnb의 공개 채용공고를 가져옵니다.

CareerLens에서는 여러 회사의 board token을 등록하고, 관리자가 공고를 미리 확인한 후 필요한 공고를 데이터베이스에 저장하는 방식으로 운영합니다.

관리자 화면:

```text
/jobs/import
```

기본 프리셋:

```text
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

운영 시 참고 사항:

- 외부 공고를 무조건 데이터베이스에 저장하지 않습니다.
- 관리자가 확인하고 선택한 공고만 데이터베이스 저장 대상으로 처리합니다.
- 자동 동기화는 이미 데이터베이스에 저장된 공고의 원문 및 정규화 정보를 갱신하는 용도입니다.
- 신규 공고 저장은 `/jobs/import` 관리자 화면에서 미리보기 후 선택하여 진행합니다.
- 공개 API에 근거가 없는 마감일, 워라밸, 기업 가치 점수는 임의로 생성하지 않습니다.
- 연봉 및 비자 정보는 공개된 공고 원문에 근거가 있는 경우에만 분류합니다.

자동 동기화 설정 예시:

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

## 14. 종료 및 재실행

프론트엔드 개발 서버가 실행 중인 터미널에서 `Ctrl + C`를 눌러 Next.js 개발 서버를 종료합니다.

백엔드는 IntelliJ IDEA의 실행 중지 버튼을 눌러 종료합니다.

데이터베이스 서버는 MySQL 또는 MariaDB를 실행한 방식에 따라 종료합니다. 데이터베이스를 종료하기 전에 필요한 데이터가 저장되어 있는지 확인합니다.

다음 실행 시에는 데이터베이스 서버를 먼저 실행한 뒤 백엔드와 프론트엔드를 순서대로 다시 실행합니다.

## 15. 실행 포트 정리

| 구분 | 주소 및 포트 | 설명 |
|---|---|---|
| Next.js Frontend | `http://localhost:3000` | 웹 프론트엔드 개발 서버 |
| Spring Boot Backend | `http://localhost:8080` | 백엔드 API 서버 |
| MySQL | `localhost:3306` | 데이터베이스 서버 |

## 16. 자주 발생하는 문제

| 문제 | 확인 및 해결 방법 |
|---|---|
| `npm` 명령어가 실행되지 않음 | Node.js가 설치되어 있는지 확인하고 터미널을 다시 실행한 뒤 `node -v`, `npm -v`로 버전을 확인합니다. |
| 프론트엔드 의존성 설치 오류 | `frontend` 폴더에서 `npm install`을 다시 실행하고 오류 메시지를 확인합니다. |
| `npm run dev` 실행 오류 | 현재 터미널 위치가 프로젝트 최상위 폴더가 아니라 `frontend` 폴더인지 확인합니다. |
| 백엔드 실행 오류 | JDK 17 설정, Maven 의존성 다운로드 상태 및 IntelliJ 실행 설정을 확인합니다. |
| 백엔드가 DB에 연결되지 않음 | MySQL/MariaDB 서버 실행 여부, DB 이름, 포트, 계정 및 비밀번호를 확인합니다. |
| 프론트엔드에서 API 연결 오류 발생 | `frontend/.env.local`의 `NEXT_PUBLIC_API_BASE_URL`이 `http://localhost:8080`으로 설정되어 있는지 확인합니다. 백엔드 실행 상태와 CORS 설정도 확인합니다. |
| CORS 오류 발생 | 백엔드의 `CORS_ALLOWED_ORIGINS`에 `http://localhost:3000` 및 `http://127.0.0.1:3000`이 포함되어 있는지 확인합니다. |
| AI 기능 실행 오류 | 백엔드 환경변수에 유효한 API 키가 설정되어 있는지, AI 기능 활성화 여부 및 사용량 한도를 확인합니다. |
| 로그인 또는 관리자 API에서 401 오류 발생 | 다시 로그인하여 JWT 토큰을 갱신하고 관리자 ID 및 권한 설정을 확인합니다. |
| 포트 사용 오류 발생 | 다른 프로그램이 `3000`, `8080`, `3306` 포트를 사용 중인지 확인하고 포트 설정을 조정합니다. |

## 17. 팀 작업 규칙

브랜치 구조:

```text
main
dev
feature/기능명
```

권장 작업 흐름:

```text
1. dev 최신화
2. feature/기능명 브랜치 생성
3. 기능별 작업 진행
4. 변경 파일과 작업 내용을 팀원에게 공유
5. 공통 파일 또는 다른 담당자 파일을 수정하는 경우 담당자에게 먼저 공유
6. PR 생성 또는 dev 브랜치에 병합
7. 병합 및 반영 사실 공유
```

작업 내용 공유 시 다음 항목을 작성합니다.

```text
작업 브랜치:
작업 요약:
변경 파일:
영향받는 화면/API:
환경변수 변경 여부:
테스트 방법:
남은 TODO:
```

## 18. 현재 주의사항

- 외부 공고 API는 회사별 Greenhouse board token을 기반으로 합니다. 전체 글로벌 채용공고 검색 API가 아닙니다.
- 공고별 연봉, 비자 및 마감일 정보는 원문 공개 여부에 따라 비어 있을 수 있습니다.
- Greenhouse 공개 API에서 제공하지 않는 마감일은 임의로 생성하지 않습니다.
- 외부 공고의 연봉, 워라밸, 기업 가치 점수는 공개된 근거가 없는 경우 `null`일 수 있습니다.
- AI, 결제 및 항공 API 기능은 각 서비스의 인증 키와 활성화 설정이 완료된 경우에만 정상적으로 사용할 수 있습니다.
- 공유 서버나 배포 환경에서는 데이터베이스 비밀번호와 JWT 서명 키를 반드시 별도로 설정합니다.
- API 키, 비밀번호, JWT 비밀키 등 민감한 정보는 README, docs, GitHub 저장소에 원문으로 업로드하지 않습니다.

## 19. 배포 환경

웹 서비스는 AWS EC2 환경에 백엔드 애플리케이션을 배포하고, 데이터베이스는 AWS RDS를 통해 관리하는 구조로 구성할 수 있습니다. Docker 및 Docker Compose를 활용하여 실행 환경을 구성하고, GitHub Actions를 통해 배포 과정을 자동화합니다.

배포 환경에서는 다음 항목을 실제 서버 설정에 맞게 변경해야 합니다.

- 백엔드 데이터베이스 접속 주소 및 계정 정보
- 프론트엔드에서 사용하는 백엔드 API 공개 주소
- 허용할 CORS 출처
- JWT 비밀키 및 만료 시간
- OpenAI, Greenhouse, KakaoPay 등 외부 API 인증 정보
- AWS EC2 및 RDS 보안 그룹과 네트워크 접근 설정

로컬 개발 환경의 `localhost` 주소를 외부 사용자에게 공개되는 서비스 주소로 그대로 사용하지 않습니다.

---

## 개발 환경 요약

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: Java 17, Spring Boot, Spring Data JPA, Maven
- Database: MySQL / MariaDB
- AI / External API: OpenAI, Groq, Greenhouse, KakaoPay, Duffel, Amadeus
- Infrastructure: AWS EC2, AWS RDS, Docker, Docker Compose, GitHub Actions


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

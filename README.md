# CareerLens

CareerLens는 해외 취업 구직자를 위한 맞춤 채용 추천 및 커리어 준비 플래너 캡스톤 프로토타입입니다.

현재 목표는 상용 서비스가 아니라, 아래 흐름이 실제로 이해되고 시연되는 프로토타입을 만드는 것입니다.

```txt
회원가입
-> 로그인
-> 해외취업 프로필 설정
-> 맞춤채용정보 추천 진단
-> 부족 요소 분석
-> 커리어 플래너 연결
```

## 1. 프로젝트 구조

```txt
backend/    Spring Boot + Spring Data JPA + MySQL
frontend/   Next.js + React + TypeScript + Tailwind CSS
seed-data/  seed 데이터, CSV 템플릿, 정규화 CSV
docs/       프로젝트 설명 문서
```

## 2. 현재 구현된 기능

프론트 라우트:

```txt
/
/signup
/login
/onboarding/profile
/jobs/recommendation
```

백엔드 API:

```txt
POST /api/auth/signup
POST /api/auth/login

GET  /api/users/{userId}/profile
PUT  /api/users/{userId}/profile

POST /api/recommendations/diagnose
POST /api/recommendations/diagnose/users/{userId}
GET  /api/recommendations/{userId}
```

## 3. 추천 진단 구조

CareerLens는 단순히 사용자와 공고를 직접 비교하지 않습니다.

현재 추천 구조:

```txt
수동 조사한 공고 데이터
+ 익명화한 직원 표본 데이터
-> 가상 합격자 패턴
-> 최종 PatternProfile
-> 사용자 프로필과 PatternProfile 비교
-> DiagnosisResult 저장
```

점수 계산에 반영되는 패턴 항목:

```txt
핵심 기술
우대 기술
목표 경력 연차
언어 기준
학력 기준
자격증
GitHub 기대 여부
포트폴리오 기대 여부
```

발표 때는 이렇게 설명하는 것을 권장합니다.

```txt
CareerLens는 수동 조사한 공고 데이터와 익명화한 직원 표본을 바탕으로
설명 가능한 가상 합격자 패턴을 만들고,
사용자 프로필을 이 패턴과 비교해 추천 진단 결과를 제공합니다.
```

주의: 실제 채용 합격 예측, 통계적으로 검증된 채용 확률, 실제 합격자 데이터라고 말하면 안 됩니다.

## 4. 개발 버전

백엔드:

```txt
Java target: 17
Spring Boot: 3.3.5
데이터베이스: MySQL
빌드 도구: Maven
백엔드 포트: 8080
```

프론트엔드:

```txt
Node.js: 24.15.0
npm: 11.12.1
Next.js: 16.2.4
React: 18.3.1
TypeScript: 5.6.3
Tailwind CSS: 3.4.14
프론트 포트: 3000
```

자세한 버전 공지는 아래 문서를 참고하세요.

```txt
docs/team-versions.md
```

## 5. MySQL 설정

MySQL에서 DB를 먼저 생성합니다.

```sql
CREATE DATABASE careerlens DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

현재 설정 파일:

```txt
backend/src/main/resources/application.yml
```

현재 기본값:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/careerlens?serverTimezone=Asia/Seoul&characterEncoding=UTF-8
    username: root
    password: 1234
```

공개 GitHub에 올릴 경우 DB 비밀번호는 환경변수 방식으로 바꾸는 것을 권장합니다.

## 6. 백엔드 실행

```bash
cd backend
mvn spring-boot:run
```

백엔드 주소:

```txt
http://localhost:8080
```

현재 H2는 사용하지 않습니다.

## 7. 프론트 실행

```bash
cd frontend
npm install
npm run dev
```

프론트 주소:

```txt
http://localhost:3000
```

메인 화면:

```txt
http://localhost:3000
```

맞춤채용정보 화면:

```txt
http://localhost:3000/jobs/recommendation
```

## 8. Seed 데이터 등록 방식

백엔드는 실행 시 `seed-data/processed/`의 CSV 파일을 먼저 확인합니다.

아래 파일들이 있으면 CSV를 DB에 자동 등록합니다.

```txt
seed-data/processed/job-postings.csv
seed-data/processed/employee-samples.csv
seed-data/processed/pattern-profiles.csv
```

이때 중복 삽입이 아니라 아래 기준으로 업데이트됩니다.

```txt
JobPosting              external_ref
EmployeeProfileSample   sample_ref
PatternProfile          pattern_ref
```

만약 `pattern-profiles.csv`가 없고 아래 파일이 있으면:

```txt
seed-data/processed/accepted-candidate-patterns.csv
```

백엔드가 이 파일을 읽어서 최종 `PatternProfile` 형태로 변환해 등록합니다.

CSV 파일이 없으면 기존 JSON seed를 사용합니다.

```txt
seed-data/recommendation-seed.json
```

정리:

```txt
seed-data/templates/   조원들이 참고하는 입력 양식
seed-data/processed/   실제 백엔드가 자동 등록하는 CSV
seed-data/raw/         원본 조사 파일, GitHub 업로드 제외
```

## 9. CSV 템플릿

조원들은 아래 템플릿을 복사해서 `seed-data/processed/`에 맞춰 작성하면 됩니다.

```txt
seed-data/templates/job-postings-template.csv
seed-data/templates/employee-samples-template.csv
seed-data/templates/accepted-candidate-patterns-template.csv
seed-data/templates/pattern-profiles-template.csv
```

작성 규칙:

```txt
CSV 컬럼 구분은 쉼표 "," 사용
한 셀 안의 리스트 값은 파이프 "|" 사용
boolean 값은 true / false 사용
processed CSV는 UTF-8로 저장
원본 조사 파일을 processed 폴더에 바로 넣지 말 것
```

리스트 예시:

```txt
Java|Spring Boot|MySQL|AWS
```

## 10. 데이터 보안 주의사항

GitHub에 올리면 안 되는 것:

```txt
실제 직원 이름
개인 LinkedIn 프로필 URL
비공개 팀 메모
가공하지 않은 원본 CSV
DB 비밀번호
```

직원 표본은 익명 ID로 관리합니다.

```txt
EMP-US-MS-001
EMP-US-APPLE-001
```

원본 파일은 아래 위치에 둡니다.

```txt
seed-data/raw/
```

이 폴더는 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다.

## 11. 검증 명령어

프론트:

```bash
cd frontend
npm run typecheck
npm run build
npm audit --audit-level=high
```

백엔드:

```bash
cd backend
mvn test
```

또는:

```bash
mvn spring-boot:run
```

## 12. 새 대화창에서 이어서 작업하는 법

새로운 대화창은 이 대화 내용을 자동으로 기억하지 못합니다.

다른 창에서 이어서 작업하려면 먼저 아래 문서를 읽게 하세요.

```txt
docs/project-handoff-summary.md
```

추천 프롬프트:

```txt
docs/project-handoff-summary.md를 읽고 CareerLens 프로젝트 상태를 이어서 작업해줘.
```

함께 보면 좋은 문서:

```txt
docs/data-modeling-guide.md
docs/csv-data-pipeline.md
docs/team-versions.md
```

## 13. 다음 작업 TODO

추천 다음 작업:

```txt
1. 템플릿 기준으로 seed-data/processed CSV 채우기
2. 백엔드 실행 후 CSV 데이터가 MySQL에 들어가는지 확인
3. 회원가입 -> 로그인 -> 프로필 설정 -> 추천 진단 흐름 확인
4. 추천 결과의 부족 요소를 커리어 플래너로 연결
5. 발표용 익명화 데모 데이터 정리
```

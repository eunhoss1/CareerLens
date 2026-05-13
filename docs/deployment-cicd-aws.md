# CareerLens CI/CD 및 AWS 배포 가이드

이 문서는 CareerLens를 Docker 이미지로 빌드하고, GitHub Actions에서 AWS ECR로 push한 뒤 EC2에서 Docker Compose로 실행하는 기준을 정리합니다.

## 기준 구조

- `main`: 발표/배포 가능한 안정 브랜치
- `dev`: 팀 작업 통합 브랜치
- `feature/*`: 기능별 작업 브랜치
- Docker 이미지
  - `careerlens-backend`: Spring Boot API
  - `careerlens-frontend`: Next.js 프론트엔드
- AWS 실행 구조
  - EC2: Docker Compose 실행 서버
  - RDS: MySQL 또는 MariaDB
  - ECR: Docker 이미지 저장소

## 로컬 Docker 실행

루트에서 `.env.example`을 복사해 `.env`를 만들고 실행합니다.

```bash
docker compose up --build
```

접속 주소:

- 프론트엔드: `http://localhost:3000`
- 백엔드: `http://localhost:8080`
- MySQL: `localhost:3306`

## GitHub Actions

### 1. CI

파일: `.github/workflows/ci.yml`

동작 조건:

- `main`, `dev`로 push
- `main`, `dev` 대상 PR

검증 내용:

- 백엔드 `mvn test`
- 프론트엔드 `npm ci`, `npm run typecheck`, `npm run build`
- Docker 이미지 빌드 smoke test

### 2. AWS 배포

파일: `.github/workflows/deploy-aws.yml`

실행 방식:

- GitHub Actions에서 수동 실행 `workflow_dispatch`
- ECR에 backend/frontend 이미지를 push
- EC2에 SSH 접속
- EC2의 `docker-compose.yml`로 새 이미지 pull 후 재기동

## GitHub Secrets

필수:

- `AWS_REGION`
- `AWS_ROLE_TO_ASSUME`
- `ECR_BACKEND_REPOSITORY`
- `ECR_FRONTEND_REPOSITORY`
- `NEXT_PUBLIC_API_BASE_URL`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
- `EC2_DEPLOY_PATH`

권장 예시:

- `AWS_REGION`: `ap-northeast-2`
- `ECR_BACKEND_REPOSITORY`: `careerlens-backend`
- `ECR_FRONTEND_REPOSITORY`: `careerlens-frontend`
- `NEXT_PUBLIC_API_BASE_URL`: `http://<EC2_PUBLIC_IP>:8080`
- `EC2_USER`: `ubuntu`
- `EC2_DEPLOY_PATH`: `/home/ubuntu/careerlens`

## EC2 준비

EC2에는 다음이 설치되어 있어야 합니다.

- Docker
- Docker Compose plugin
- AWS CLI
- ECR pull 권한이 있는 IAM Role 또는 AWS credential

EC2 배포 경로에 `.env.production`을 직접 생성합니다.

```bash
mkdir -p /home/ubuntu/careerlens
cd /home/ubuntu/careerlens
vi .env.production
```

`.env.production.example`을 참고하되 실제 DB 비밀번호, JWT secret, API key는 EC2에만 둡니다.

EC2 인스턴스 프로파일에는 최소한 다음 권한이 필요합니다.

- `ecr:GetAuthorizationToken`
- `ecr:BatchCheckLayerAvailability`
- `ecr:GetDownloadUrlForLayer`
- `ecr:BatchGetImage`

GitHub Actions에서 ECR로 push하는 role에는 위 권한에 더해 다음 권한이 필요합니다.

- `ecr:InitiateLayerUpload`
- `ecr:UploadLayerPart`
- `ecr:CompleteLayerUpload`
- `ecr:PutImage`

## RDS 주의사항

- RDS 보안 그룹은 EC2 보안 그룹에서 들어오는 3306만 허용합니다.
- RDS를 전체 공개로 열지 않습니다.
- `DB_DDL_AUTO=update`는 프로토타입/시연용입니다.
- 최종 제출 단계에서는 Flyway/Liquibase 같은 마이그레이션 도구 또는 `validate` 정책을 검토합니다.

## 프론트엔드 API URL 주의사항

`NEXT_PUBLIC_API_BASE_URL`은 Next.js 빌드 시점에 브라우저 코드에 포함됩니다.

따라서 백엔드 주소가 바뀌면:

1. GitHub Secret `NEXT_PUBLIC_API_BASE_URL` 수정
2. 프론트엔드 Docker 이미지 재빌드
3. EC2 재배포

로컬에서는 `http://localhost:8080`이 맞지만, EC2 시연에서는 브라우저 기준 주소를 넣어야 합니다.

## CORS 주의사항

백엔드의 `CORS_ALLOWED_ORIGINS`에는 실제 프론트엔드 접속 주소를 넣어야 합니다.

예:

```env
CORS_ALLOWED_ORIGINS=http://<EC2_PUBLIC_IP>:3000
```

HTTPS 도메인을 붙이면 해당 도메인도 추가합니다.

## 보안 주의사항

- `.env`, `.env.production`, API Key, DB Password, JWT Secret은 절대 commit하지 않습니다.
- GitHub Actions에는 GitHub Secrets로만 넣습니다.
- EC2에는 `.env.production`으로만 둡니다.
- `JWT_SECRET`은 발표용이라도 기본값을 쓰지 않습니다.
- OpenAI API Key는 프론트엔드에 넣지 않고 백엔드 환경변수로만 둡니다.

## 현재 단계에서의 배포 전략

중간발표 기준으로는 아래 흐름이 가장 안정적입니다.

1. `dev`에서 기능 확인
2. 안정 상태를 `main`에 merge
3. `main` 기준 Docker 이미지 빌드
4. ECR push
5. EC2에서 Docker Compose 재기동
6. 브라우저에서 `프론트 -> 백엔드 -> RDS` 흐름 확인

초기에는 자동 배포보다 수동 실행형 `workflow_dispatch`가 안전합니다. 팀원이 실수로 `main`에 push했을 때 운영 서버가 바로 바뀌는 위험을 줄일 수 있습니다.

## 배포 전 체크리스트

- `main`이 발표 가능한 상태인지 확인
- GitHub Actions `CI` 통과 확인
- ECR repository 2개 생성 확인
- EC2에 Docker, Docker Compose, AWS CLI 설치 확인
- EC2 IAM Role에 ECR pull 권한 부여 확인
- RDS 보안 그룹이 EC2에서만 접근 가능하도록 설정되었는지 확인
- EC2 보안 그룹에서 발표용 포트만 허용했는지 확인
  - 빠른 시연: `3000`, `8080`
  - 권장 운영: `80`, `443`만 열고 Nginx/ALB 뒤로 숨김
- `.env.production`이 EC2에 존재하는지 확인
- `NEXT_PUBLIC_API_BASE_URL`과 `CORS_ALLOWED_ORIGINS`가 같은 배포 주소를 바라보는지 확인

## 현재 남겨둔 의도적 한계

- HTTPS, 도메인, Nginx reverse proxy는 아직 포함하지 않았습니다.
- DB migration은 `ddl-auto=update` 기반입니다.
- GitHub Actions 배포는 수동 실행형입니다.
- EC2 한 대에서 compose로 실행하는 구조라 무중단 배포는 아닙니다.

중간발표와 시연 안정성을 우선하면 이 한계는 허용 가능합니다. 최종발표 전에는 HTTPS, 도메인, reverse proxy, DB migration, backup 정책을 추가로 정리하는 것이 좋습니다.

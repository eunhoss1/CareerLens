# 로그인/회원가입 JWT 보강 정리

## 목적

기존 로그인/회원가입은 `BCrypt` 기반 비밀번호 검증과 localStorage 사용자 저장까지만 있었다. 이번 작업에서는 시연용 프로토타입 수준에서 다음 구조를 추가한다.

```txt
회원가입/로그인
-> 서버가 JWT access token 발급
-> 프론트가 사용자 정보와 token 저장
-> 관리자 API 호출 시 Authorization: Bearer {token} 전송
-> 백엔드 Spring Security 필터가 token 검증
-> ADMIN 권한이 있는 사용자만 관리자 API 접근
```

## 적용 범위

이번 단계에서 JWT로 보호하는 API:

```txt
/api/jobs/external/**
```

즉, Greenhouse 외부 공고 미리보기/등록/동기화 API는 더 이상 `X-Careerlens-User-Role` 헤더만으로 접근하지 않는다. 로그인해서 발급받은 JWT 토큰이 필요하다.

아직 전체 사용자 API를 모두 막지는 않았다. 추천 진단, 플래너, 마이페이지 API는 기존 userId 기반 흐름을 유지한다. 이 API들을 한 번에 잠그면 다른 조원 작업과 충돌할 가능성이 높으므로, 인증 구조를 먼저 넣고 이후 단계적으로 보호 범위를 넓히는 방향이 좋다.

## 변경된 정책

- 비밀번호는 8자 이상이어야 한다.
- 비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 한다.
- 회원가입 시 loginId 중복 확인을 한다.
- 회원가입 시 email 중복 확인을 한다.
- 로그인 실패 메시지는 아이디/비밀번호 중 어떤 항목이 틀렸는지 노출하지 않는다.
- 로그인/회원가입 성공 시 JWT access token을 응답에 포함한다.
- 관리자 API는 Spring Security `@PreAuthorize("hasRole('ADMIN')")`로 보호한다.

## 환경변수

```properties
JWT_SECRET=충분히_긴_랜덤_문자열
JWT_ISSUER=careerlens
JWT_EXPIRATION_MINUTES=480
ADMIN_LOGIN_IDS=admin,careerlens-admin
```

로컬 기본값은 `application.yml`에 있지만, 공유 서버나 배포 환경에서는 반드시 `JWT_SECRET`을 별도 환경변수로 넣어야 한다.

## 프론트 영향

`AuthUser`에 다음 필드가 추가됐다.

```ts
access_token?: string;
token_type?: string;
expires_at?: number;
```

관리자 공고 API 호출은 `Authorization: Bearer {access_token}` 헤더를 사용한다.

주의:

- 기존 브라우저 localStorage에 저장된 로그인 정보에는 token이 없다.
- dev 반영 후 `/jobs/import`에서 401이 뜨면 로그아웃하거나 localStorage를 지운 뒤 다시 로그인해야 한다.
- admin 계정으로 다시 로그인하면 새 JWT가 저장된다.

## 변경 파일

```txt
backend/pom.xml
backend/src/main/resources/application.yml
backend/src/main/java/com/careerlens/backend/config/SecurityConfig.java
backend/src/main/java/com/careerlens/backend/security/JwtClaims.java
backend/src/main/java/com/careerlens/backend/security/JwtTokenService.java
backend/src/main/java/com/careerlens/backend/security/JwtAuthenticationFilter.java
backend/src/main/java/com/careerlens/backend/controller/ExternalJobProviderController.java
backend/src/main/java/com/careerlens/backend/dto/AuthResponseDto.java
backend/src/main/java/com/careerlens/backend/dto/SignupRequestDto.java
backend/src/main/java/com/careerlens/backend/service/AuthService.java
frontend/lib/auth.ts
frontend/lib/external-jobs.ts
frontend/app/login/page.tsx
frontend/app/signup/page.tsx
frontend/app/jobs/import/page.tsx
```

## 테스트 방법

1. 백엔드 재시작
2. 프론트 재시작
3. 일반 사용자 회원가입
4. 로그인 후 마이페이지 이동 확인
5. admin 계정 회원가입 또는 로그인
6. `/jobs/import` 접속
7. Greenhouse 미리보기 호출 확인
8. 일반 사용자로 `/jobs/import` 접근 시 관리자 권한 안내가 뜨는지 확인

## 남은 TODO

- refresh token 구조 추가 여부 결정
- 사용자 API 전체를 JWT 기반으로 보호할지 정책 결정
- 로그인 만료 시 자동 로그아웃/재로그인 유도
- 전역 API 에러 처리 정리
- 비밀번호 재설정/이메일 인증은 현재 범위 밖

# KakaoPay Duplicate Redirect Demo

이 문서는 트러블슈팅 발표 영상을 찍기 위한 데모 브랜치 전용 안내입니다.

## 목적

결제 성공 리다이렉트 URL이 반복 호출될 때 멤버십 승인 처리를 멱등하게 막지 않으면, 같은 주문이 여러 번 처리되어 Pro 이용 기간이 비정상적으로 증가할 수 있다는 문제를 재현합니다.

## 데모 브랜치

- 브랜치: `demo/kakao-duplicate-redirect-repro`
- 운영/dev/main 병합 금지
- 영상 촬영 후 삭제 권장

## 활성화 방법

기본값은 안전하게 `false`입니다. 재현 영상 촬영 시에만 로컬 환경변수에 아래 값을 추가합니다.

```env
KAKAOPAY_DEMO_DUPLICATE_REDIRECT_ENABLED=true
```

## 재현 흐름

1. 로컬 백엔드와 프론트엔드를 실행합니다.
2. 카카오페이 샌드박스 결제를 한 번 성공시킵니다.
3. DB에서 `payment_orders.order_id`와 `user_memberships.expires_at`을 확인합니다.
4. 같은 결제 성공 리다이렉트 URL을 다시 호출합니다.
   - 형태: `/api/payments/kakao/success?order_id=...&pg_token=...`
5. `user_memberships.expires_at`이 다시 30일 연장되는지 확인합니다.

## 정상 해결 버전과 비교할 포인트

정상 버전은 `PaymentOrder.status`가 이미 `APPROVED`이면 승인 처리를 다시 하지 않고 `already_approved`로 프론트에 돌려보냅니다.

데모 버전은 `KAKAOPAY_DEMO_DUPLICATE_REDIRECT_ENABLED=true`일 때만 이미 승인된 주문에도 `membershipService.activatePro(...)`를 다시 호출합니다.

## 발표용 정리

| 이슈 | 원인 | 해결 | 결과 |
| --- | --- | --- | --- |
| 결제 성공 URL 반복 호출 시 Pro 기간 중복 증가 | 결제 승인 결과를 DB 상태로 멱등 처리하지 않으면 같은 주문이 다시 처리됨 | `PaymentOrder` 상태를 `READY -> APPROVED`로 저장하고, 이미 승인된 주문은 재처리하지 않도록 차단 | 새로고침/재접근에도 Pro 기간이 비정상 증가하지 않음 |

> 주의: 이 브랜치는 문제 재현용입니다. 운영 배포에 사용하지 마세요.

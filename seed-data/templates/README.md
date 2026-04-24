# CareerLens Seed 데이터 템플릿 안내

이 폴더는 조원들이 수동 조사한 공고, 직원 표본, 패턴 데이터를 백엔드가 읽을 수 있는 형태로 정리하기 위한 템플릿 모음입니다.

## 파일 설명

- `job-postings-template.csv`: 수동 조사한 채용 공고를 정규화하는 양식
- `employee-samples-template.csv`: 실제 직원 프로필 표본을 익명화해서 정리하는 양식
- `accepted-candidate-patterns-template.csv`: 공고와 직원 표본을 바탕으로 만든 가상 합격자 더미 패턴 양식
- `pattern-profiles-template.csv`: 추천 점수 계산에 직접 사용되는 최종 직무 패턴 양식

## 작성 규칙

- CSV 컬럼 구분자는 쉼표 `,`를 사용합니다.
- 한 셀 안에 여러 값을 넣을 때는 파이프 `|`를 사용합니다.
- boolean 값은 `true` / `false`로 작성합니다.
- processed CSV는 UTF-8로 저장합니다.
- 원본 조사 파일을 그대로 `processed` 폴더에 넣지 않습니다.
- 실제 직원 이름, 개인 LinkedIn URL, 불필요한 개인정보는 공개 GitHub에 올리지 않습니다.

## ID 작성 규칙

안정적인 ID를 사용해야 중복 삽입 없이 업데이트할 수 있습니다.

```txt
공고 ID: US-MS-BE-001
직원 표본 ID: EMP-US-MS-001
가상 합격자 패턴 ID: ACP-US-MS-BE-001
최종 패턴 ID: PAT-US-MS-BE-001
```

## 폴더 사용 방식

```txt
seed-data/raw/         원본 조사 파일 보관, GitHub 업로드 제외
seed-data/templates/   조원 입력 양식
seed-data/processed/   백엔드가 실제로 자동 등록하는 정규화 CSV
```

`seed-data/raw/`는 `.gitignore`에 포함되어 있습니다.

## 권장 작업 흐름

```txt
원본 공고 조사
-> job-postings.csv 정규화
-> 원본 직원 프로필 조사
-> employee-samples.csv 익명화/정규화
-> accepted-candidate-patterns.csv 작성
-> pattern-profiles.csv 작성
-> 백엔드 seed import
-> 맞춤채용정보 추천 진단
```

## 리스트 값 예시

```txt
Java|Spring Boot|MySQL|AWS
```

## 발표 시 표현 주의

이 데이터는 실제 합격자 데이터가 아닙니다.

권장 표현:

```txt
수동 조사한 공고와 익명화한 직원 표본을 기반으로 만든
캡스톤 프로토타입용 가상 합격자 패턴입니다.
```

피해야 할 표현:

```txt
실제 합격자 데이터
실제 채용 합격 예측
통계적으로 검증된 합격 확률
```

# 📬 **LeafPost**(메일 송신 예약 시스템)

---

## 1. 프로젝트 개요 🌱

**목적**

사용자가 **동물의 숲 주민 캐릭터(이하 주민)**을 선택하여 입력한 텍스트를 **해당 주민의 말투(Tone)**로 변환한 뒤

👉 **이미지 또는 텍스트 형태의 이메일**로 예약/즉시 송신할 수 있는 서비스 제작

**핵심 가치**

- 캐릭터 기반 감성 커뮤니케이션
- 말투(Tone) 중심 콘텐츠 변환
- 예약 송신 + 이력 관리에 특화된 개인화 서비스

```tsx
// 전체 구조 다이어그램

[사용자]
   │
   ▼
[웹/앱 접속]
   │
   ├─ 비회원 → [환영화면 → 로그인/회원가입]
   │
   └─ 로그인 → [메인 페이지]
                 │
                 ├─ 주민 리스트 (카드 UI + 인기 랭킹)
                 │       │
                 │       └─ 호버 → 말투 예시
                 │       └─ 클릭 → 이메일 송신 카드 노출
                 │
                 └─ 마이페이지
                         ├─ 프로필 관리
                         └─ 이메일 이력
                                 ├─ 예약 이메일 (취소 가능)
                                 └─ 보낸 이메일 (삭제 가능)
```

---

## 2. 기술 스택 🛠️

**프론트엔드**

- Next.js (App Router)
- 배포: Vercel

**백엔드**

- NestJS, TypeORM, PostgreSQL
- Redis (인기 주민 랭킹)
- Supabase Storage (이미지 저장)
- 배포: Render

---

## 3. 역할 분담 👥

### 프론트엔드 담당

- 로그인/회원가입 UI
- 주민 리스트 및 인기 랭킹 UI
- 이메일 예약/송신 카드 UI
- 마이페이지 (이메일 이력, 프로필)
- API 연동 및 상태 관리
- **주민 말투 적용 및 카드 UI/UX 구현**

### 백엔드 담당

- Auth 시스템 (JWT + Refresh Token)
- 주민/말투 데이터 관리
- 이메일 예약 & 상태 관리
- Redis 기반 인기 주민 집계
- (추후) 이미지 생성 로직 검토 및 구현

```tsx
// 프론트 & 백엔드 역할

프론트엔드
┌─────────────────────────────┐
│ 카드 UI / 말투 적용           │
│ 주민 리스트 / 인기 순위 UI    │
│ 이메일 예약 입력 / 송신 카드 │
│ 마이페이지 카드 이력 표시     │
└─────────────────────────────┘

백엔드
┌─────────────────────────────┐
│ Auth / JWT 토큰 관리         │
│ DB: Users, Villagers, Emails │
│ Redis 인기 주민 집계          │
│ 이메일 예약, 전송, 상태 관리 │
└─────────────────────────────┘
```

---

## 4. 사용자 플로우 🔁

### 1) 기본 도메인 접속

- 환영 문구
- 로그인 / 회원가입 버튼 제공

### 2) 회원가입 페이지

- 입력: 이메일, 비밀번호, 닉네임
- 가입 성공 → 로그인 페이지 이동

### 3) 로그인 페이지

- 이메일 / 비밀번호 입력
- 로그인 성공 → 메인 페이지

### 4) 메인 페이지 🏝️

**주민 리스트**

- 모든 주민 캐릭터 카드 표시
- 카드 구성: 주민 이미지, 이름, 인기 배지 (Redis 기반)

**인터랙션**

- 마우스 호버 → 주민 말투 예시 표시
- 주민 클릭 → 이메일 송신 카드 노출

---

### 5) 이메일 송신 카드 ✉️

**입력 정보**

- 예약 날짜 및 시간
- 받는 사람 이메일
- 변환할 텍스트
- 선택된 주민 이미지 미리보기

**고정 정보**

- 보내는 사람 이메일: 회원가입 시 사용한 이메일

**UX/동작 흐름 (프론트 적용)**

- 사용자 텍스트 입력 → 주민 말투(Tone) 적용 → 카드 내 실시간 변환
- 카드 구조 : Background + Villager Sticker + Speech Bubble + TextSafeArea
- 주민별 Variant : 컬러/스티커/말풍선 변경 가능
- 예약 또는 즉시 이메일 송신
- 이메일 전송 시점에서는 **MVP에서는 텍스트 기반**, 이미지 생성은 추후 확장

  ### 5-1) 메일 카드 구조(프론트 레이어)

  ```tsx
  MailCard_Base (Frame 360x480)
   ├─ Background (배경 색상/텍스처)
   ├─ VillagerSticker (주민 얼굴 이미지/스티커)
   ├─ SpeechBubble (말풍선, Tail 방향 캐릭터 쪽)
   └─ TextSafeArea (사용자 입력 영역, React textarea)
  ```

  - **주민별 Variant**
    - 컬러, 스티커, 말풍선만 변경
    - TextSafeArea는 공통, 말버릇 변환 적용
  - **동작**
    - 사용자가 텍스트 입력 → 말버릇 적용 → 카드 내 실시간 반영
    - 예약/즉시 전송 버튼 연결

---

### 6) 마이페이지 📂

**프로필**

- 이메일, 닉네임, 비밀번호 변경

**이메일 이력 관리**

- 카드 형태로 제공
- 보낼 이메일 : 예약 상태 표시, 취소 가능
- 보낸 이메일 : 송신 완료 표시, 기록 삭제 가능
- 카드 내 주민 이미지 + 변환된 텍스트 함께 표시

---

## 7. 백엔드 구조 ⚙️

**리소스 구성**

- **Auth** : 로그인/로그아웃, Access/Refresh Token, 인증/인가
- **Users** : 회원가입, 닉네임/비밀번호 변경, 회원 탈퇴, 내 정보 조회
- **Villagers** : 주민 조회, 주민 사용량 증가 (Redis 연동)
- **Emails** : 이메일 생성, 예약, 취소, 상태 관리

---

## 8. 데이터베이스 설계 🗄️

### users

CREATE TABLE users (
id UUID PRIMARY KEY,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
nickname VARCHAR(50) NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

### villagers

CREATE TABLE villagers (
id SERIAL PRIMARY KEY,
name VARCHAR(100) NOT NULL,
image_url TEXT NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

### villager_tones

CREATE TABLE villager_tones (
id SERIAL PRIMARY KEY,
villager_id INT NOT NULL REFERENCES villagers(id) ON DELETE CASCADE,
-- 공통 말투 정보
speech_style VARCHAR(50),
sentence_ending VARCHAR(50),
personality_keywords TEXT,
example_sentences TEXT,
-- Tone 타입
tone_type VARCHAR(20) NOT NULL CHECK (tone_type IN ('RULE', 'GPT', 'HYBRID')),
-- GPT 전용
system_prompt TEXT,
max_length INT,
forbid_emotion BOOLEAN DEFAULT false,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

### emails

CREATE TABLE emails (
id UUID PRIMARY KEY,
status VARCHAR(20) NOT NULL CHECK (
status IN ('reserved', 'sent', 'canceled', 'failed')
),

user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
villager_id INT NOT NULL REFERENCES villagers(id),

sender_email VARCHAR(255) NOT NULL,
receiver_email VARCHAR(255) NOT NULL,

original_text TEXT NOT NULL,
transformed_text TEXT,

image_url TEXT,
scheduled_at TIMESTAMP WITH TIME ZONE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

### refresh_tokens

CREATE TABLE refresh_tokens (
id SERIAL PRIMARY KEY,
token VARCHAR(255) NOT NULL,
is_revoked BOOLEAN DEFAULT false,
expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

---

## 9. Redis 설계 🔥

- 주민 사용 시마다 증가: **`ZINCRBY villager_ranking villagerId1`**
- 상위 주민 조회: **`ZREVRANGE villager_ranking 0 9 WITHSCORES`**

---

## 10. 미정 / 추가 논의 ⚠️

- 이미지 생성 로직 (백엔드 처리 여부, 외부 서비스 연동)
- MVP에서는 **text-only 이메일** 송신으로 시작, imageUrl nullable
- NextJS의 sharp 라이브러리 사용해서 이미지 합성 시도 예정

---

## 11. 프론트엔드 담당 UX/디자인 정리 🧩

- 카드 UI : **360×480 또는 400×520**, 모바일/웹 대응
- 주민 선택 → 카드 내 실시간 말투 변환
- 카드 구성 : Background + Villager Sticker + Speech Bubble + TextSafeArea
- 마이페이지 : 보낸/예약 이메일 **카드 형태로 표시**, 실제 송신 모습 미리보기 가능
- 프론트는 **UX/인터랙션 + 말버릇 변환**, 백엔드는 **데이터/예약/이메일 전송** 담당

---

## 12. 변환 이미지 미리보기 시스템🖼️

### 1. 목적 및 범위

**목적**

- 사용자가 이메일을 예약/전송하기 전에
  **선택한 주민 말투가 적용된 결과를 시각적으로 확인**할 수 있도록 한다.
- 실제 저장·송신 로직과 **완전히 분리된 미리보기 시스템**을 제공한다.

**범위**

- 본 시스템은 **저장, 예약, 이메일 송신과 무관**
- **미리보기 전용**이며, 데이터베이스에 어떠한 이력도 남기지 않는다.

---

### 2. 시스템 원칙 (중요)

- 미리보기 결과는 **참고용**
- 최종 변환 결과는 **백엔드에서 다시 생성**
- 미리보기와 실제 결과는 유사함을 목표로 하되, 완전 동일성을 보장하지 않는다

---

### 3. 프론트엔드 책임 (Preview UI) 🎨

**역할**

- 사용자 입력 관리
- 실시간 미리보기 UX 제공
- 카드/말풍선/배경 레이아웃 렌더링

**처리 흐름**

1. 사용자가 텍스트 입력
2. 선택한 주민 ID 기준으로 미리보기 요청
3. 반환된 미리보기 텍스트 및 이미지 URL을 UI에 렌더링

**프론트엔드에서 하지 않는 것**

- 말투 규칙 정의
- 최종 변환 로직
- 이미지 생성 로직
- DB 저장

---

### 4. 백엔드 책임 (Preview Engine) ⚙️

**역할**

- 주민 말투 규칙 조회 (`villager_tones`)
- 미리보기용 변환 로직 실행
- (선택) 미리보기 이미지 생성
- **절대 DB에 저장하지 않음**

**미리보기 로직 특징**

- 랜덤성 최소화
- 결정적(deterministic) 결과 반환
- UX 안정성 우선

---

### 5. 미리보기 처리 시퀀스 🔁

```
[Frontend]
텍스트 입력
   ↓
POST /emails/preview
   ↓
[Backend]
tone rule 조회
preview 변환 수행
(선택) 이미지 생성
   ↓
미리보기 결과 반환
   ↓
[Frontend]
카드 UI에 렌더링
```

---

### 6. 미리보기 응답 예시

```json
{
  "previewText": "음… 오늘 진짜 고마웠어~",
  "previewImageUrl": "https://preview-image-url"
}
```

※ `previewImageUrl`은 이미지 미리보기를 제공하지 않는 MVP 단계에서는 `null` 허용

---

## 13. GPT 기반 말투 변환 시스템 📱

### 1. 도입 목적

기존 Rule 기반 말투 변환 방식은 **일관성·속도·프리뷰 UX** 측면에서 유리하나,

표현 다양성과 자연스러움에 한계를 보완하기 위해 **GPT API를 “최종 변환 엔진”으로 제한적으로 도입**

---

### 2. GPT 사용 범위 (명확한 경계)

**GPT 사용 O**

- 최종 이메일 송신 시 말투 변환
- Tone 타입이 `GPT` 또는 `HYBRID`인 경우
- 서버에서만 호출

**GPT 사용 X**

- 프론트엔드 실시간 미리보기
- 사용자 입력 중간 단계
- 말투 규칙 정의 자체
- Tone 데이터 저장

> GPT는 변환 도구이지 도메인 로직의 주체가 아님

---

### 3. Tone 타입 확장 정의

**villager_tones.tone_type**

| 값     | 설명                |
| ------ | ------------------- |
| RULE   | 기존 규칙 기반 변환 |
| GPT    | GPT 기반 말투 변환  |
| HYBRID | Rule + GPT 혼합     |

---

### 4. Tone 데이터 구조 (GPT 대응)

**villager_tones 테이블 필드 확장**

| 필드            | 설명                   |
| --------------- | ---------------------- |
| system_prompt   | GPT system 메시지      |
| base_rules      | Rule 기반 후처리 규칙  |
| gpt_constraints | 길이, 표현 제한        |
| preview_rules   | 프론트 미리보기용 규칙 |

### 예시

```json
{
  "tone_type": "GPT",
  "system_prompt": "너는 동물의 숲 주민 '레이몬드'다. 차분하고 약간 시니컬한 말투를 사용한다.",
  "gpt_constraints": {
    "maxLength": 300,
    "forbiddenWords": ["욕설", "과도한 감정 표현"]
  },
  "preview_rules": {
    "sentenceEnding": "…"
  }
}
```

---

### 5. GPT 변환 처리 흐름 (서버)

**최종 이메일 생성 시**

1. 사용자 원문 수신
2. villagers → villager_tones 조회
3. tone_type 분기
4. GPT 변환 수행
5. 결과 검증 및 후처리
6. emails 테이블에 최종 결과 저장

**처리 의사 코드**

```tsx
if (tone.type === 'GPT') {
  result = gptTransform(input, tone.systemPrompt);
  result = postProcess(result, tone.baseRules);
}
```

---

### 6. GPT Prompt 설계 원칙

**System Prompt (고정)**

- 캐릭터 정체성
- 말투 성격
- 표현 제한

**User Prompt (가변)**

- 사용자 입력 원문만 포함

**예시**

System:

```
너는 동물의 숲 주민'쭈니'다.
항상 밝고 귀엽게 말하며 문장 끝에"냥~"을 붙인다.
```

User:

```
아래 문장을 쭈니의 말투로 바꿔줘:
"오늘 정말 고마웠어."
```

---

### 7. 결과 검증 및 안전장치

GPT 결과는 **그대로 신뢰하지 않는다**.

**필수 검증 항목**

- 빈 문자열 여부
- 최대 길이 초과 여부
- 금칙어 포함 여부

**후처리**

- 문장 끝 규칙 강제
- 줄바꿈 정리
- Rule 기반 보정

---

### 8. 프리뷰와 GPT의 관계

**프론트엔드**

- preview_rules 기반 Rule 변환
- GPT 호출 없음

**서버**

- 최종 변환 시 GPT 호출
- 프리뷰 결과와 완전 일치 보장 대상 아님

> 프리뷰는 “예상 UI”, GPT 결과는 “확정 데이터”

---

### 9. 장애 및 비용 대응 전략

- GPT 실패 시 Rule 기반 fallback
- tone_type별 GPT 사용 여부 제어
- 호출 횟수 제한 (메일 1건당 1회)

---

## 14. API 명세🔌

### 1. Auth

**POST /auth/login**

- 로그인
- Access Token / Refresh Token 발급

**POST /auth/refresh**

- Refresh Token 기반 Access Token 재발급

**POST /auth/logout**

- 로그아웃
- Refresh Token 폐기

📌 **GET → POST 변경 권장**

- 인증 상태 변경은 항상 POST

| **메서드** | **엔드포인트** | **역할**                 |
| ---------- | -------------- | ------------------------ |
| **POST**   | /auth/login    | 로그인                   |
| **POST**   | /auth/logout   | 로그아웃                 |
| **POST**   | /auth/refresh  | 새로고침 시 토큰 재 발급 |

---

### 2. Users

**POST /users/signup**

- 회원가입

**GET /users/me**

- 내 프로필 조회

**PATCH /users/password**

- 비밀번호 변경

**PATCH /users/nickname**

- 닉네임 변경

**DELETE /users/me**

- 회원 탈퇴

📌 **/users/:id 삭제 권한 제거**

- 본인만 삭제 가능하도록 단순화

| **메서드** | **엔드포인트**  | **역할**       |
| ---------- | --------------- | -------------- |
| **GET**    | /users/me       | 내 프로필 조회 |
| **POST**   | /users/signup   | 회원가입       |
| **PATCH**  | /users/password | 비밀번호 변경  |
| **PATCH**  | /users/nickname | 닉네임 변경    |
| **DELETE** | /users/me       | 회원 탈퇴      |

---

### 3. Villagers

**GET /villagers**

- 주민 전체 목록 조회
- 기본 정보 (이름, 이미지)

**GET /villagers/:id**

- 주민 단일 조회
- 말투 예시 포함

📌 프론트의 “주민 클릭 → 카드 생성”에 필요

| **메서드** | **엔드포인트** | **역할**            |
| ---------- | -------------- | ------------------- |
| **GET**    | /villagers     | 주민 전체 목록 조회 |
| **GET**    | /villagers/:id | 주민 단일 조회      |

---

### 4. Emails

**GET /emails**

- 내 이메일 이력 목록 조회
- 상태별 필터링 가능 (reserved / sent)

**GET /emails/:id**

- 이메일 단일 조회
- 변환된 텍스트 + 이미지 포함

**POST /emails/preview**

- 미리보기

**POST /emails**

- 최종 이메일 생성 (예약 포함)

**DELETE /emails/:id**

- 이메일 이력 삭제
- 예약 상태일 경우 → 실제 취소
- 전송 완료 상태일 경우 → 이력만 삭제

| **메서드** | **엔드포인트**  | **역할**                 |
| ---------- | --------------- | ------------------------ |
| **GET**    | /emails         | 내 이메일 이력 목록 조회 |
| **GET**    | /emails/:id     | 이메일 단일 조회         |
| **POST**   | /emails         | 이메일 송신(예약)        |
| **POST**   | /emails/preview | 이메일 미리보기          |
| **DELETE** | /emails/:id     | 이메일 삭제              |

---

### POST /emails/preview

📌 **미리보기 전용 (DB 저장 ❌)**

**Request**

```json
{
  "villagerId": 3,
  "originalText": "오늘 정말 고마웠어"
}
```

**Response**

```json
{
  "previewText": "음… 오늘 정말 고마웠어~",
  "previewImageUrl": null
}
```

---

### POST /emails

📌 **최종 이메일 생성 (예약 포함)**

**Request**

```json
{
  "villagerId": 3,
  "originalText": "오늘 정말 고마웠어",
  "receiverEmail": "test@example.com",
  "scheduledAt": "2026-01-10T12:00:00Z"
}
```

**Server Behavior**

- tone rule 기반 최종 변환 수행
- transformedText 생성
- emails 테이블 저장

---

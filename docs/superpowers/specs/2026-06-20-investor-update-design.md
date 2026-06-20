# 투자자 업데이트 생성기 — 설계 (Investor Update Generator)

- 날짜: 2026-06-20
- 맥락: 깃코(1인 창업가 AI 비서)의 **투자/IR 도메인 특화** 기능. 접근법 A(새 액션 타입) 채택.

## 목표
말 한마디로 **월간 투자자 업데이트**(TL;DR·지표·하이라이트·로우라이트·Ask·다음 달)를 완성한다.
하이브리드: 사용자가 핵심 수치·소식을 말하면, 에이전트가 **현재 할일·일정 + 떠올린 기억**을 합쳐 작성한다.

## 데이터 모델
새 테이블 `updates`:
- `id INTEGER PK`, `period TEXT`, `content TEXT(JSON)`, `created_at TEXT`
- content = `{ tldr: string, highlights: string[], metrics: {label,value}[], lowlights: string[], asks: string[], next: string }`

## 새 액션 타입
`investor_update` — `data = { period, tldr, highlights[], metrics[{label,value}], lowlights[], asks[], next }`
기존 액션(create_task/schedule_event/draft_email)과 함께 plan.actions에 포함될 수 있다.

## 에이전트
시스템 프롬프트에 investor_update 스키마와 규칙 추가:
- 투자자 업데이트 요청 시 investor_update 액션 생성
- 사용자가 제공한 수치·소식 + CURRENT STATE(할일·일정) + RELEVANT MEMORIES를 종합
- 투자자 톤, 간결, 사용자 언어로. metrics는 label/value 쌍.

## 적용/저장
- `applyPlan`에 investor_update 분기 추가 → `addUpdate(db, period, content)`
- 승인 후 메모리에 "투자자 업데이트: {period}" 저장(임베딩)

## API
- `GET /api/updates` → 목록
- `DELETE /api/updates/:id`
- 승인 응답에 `updates` 포함

## UI
- 3패널(할일·캘린더·초안) 아래 **풀폭 "📈 투자자 업데이트" 섹션**
- 리포트 카드: 기간 헤더 · TL;DR · 지표 칩 · 하이라이트 · 로우라이트 · Ask · 다음 달 · 복사/삭제
- 입력창 위 **📈 투자자 업데이트** 빠른 버튼(시작 명령 자동 채움)
- 계획 카드/액션 라벨에 investor_update 표시
- i18n 한·영

## 에러/테스트
- 누락 필드는 빈 배열/빈 문자열 기본값으로 안전 렌더
- 유닛: addUpdate/listUpdates, applyPlan(investor_update) 동작

## 범위 (YAGNI)
- 포함: 위 생성·저장·렌더·복사·삭제
- 제외: 투자자 CRM/파이프라인, PDF 내보내기, 실제 발송

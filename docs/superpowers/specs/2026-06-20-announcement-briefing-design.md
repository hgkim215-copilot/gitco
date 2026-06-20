# 공고 브리핑 — 설계 (Startup Grant Announcement Briefing)

- 날짜: 2026-06-20
- 맥락: 깃코(1인 창업가 AI 비서)에 **정부·공공 지원사업 공고**를 모아 프로필에 맞게 보고하는 기능. 접근법 A.

## 목표
창업가가 매번 챙기기 힘든 정부 지원사업 공고를, 깃코가 **프로필·기억에 맞춰 선별하고 마감/적합 이유와 함께 보고**한다.

## 데이터 소스 (하이브리드: 1+3)
`announcements.ts.getAnnouncements()` → `{ source: "live"|"seed", items: Announcement[] }`
- 런타임 공개 소스 페치 시도(짧은 타임아웃) → 실패 시 **큐레이션 시드**(실제 정부 프로그램명 기반)
- Announcement = `{ id, title, agency, category, target, deadline(YYYY-MM-DD), url, summary }`

## 창업가 프로필
테이블 `profile`(단일 행): `industry, stage, interests`. `GET/PUT /api/profile`. 헤더 ⚙️ 프로필 모달.
프로필은 일반 command 컨텍스트에도 주입되어 깃코 전체가 프로필 인지.

## 에이전트 브리핑
새 액션 `announcement_briefing` — `data = { picks: [{ title, agency, deadline, fit_reason, url }] }`
- `📰 공고 확인` → `/api/command {text, mode:"announcements"}` → 백엔드가 공고목록+프로필+기억을 컨텍스트로 주입
- 에이전트가 적합 공고 선별 + fit_reason 작성, 입력 언어로. 승인 시 `briefings` 테이블 저장.

## API
- `GET/PUT /api/profile`, `GET /api/announcements`, `GET/DELETE /api/briefings`
- `POST /api/tasks`(직접 생성: 마감 할일 추가), `POST /api/command`에 `mode` 추가

## UI
- ⚙️ 프로필 모달(업종/단계/관심분야)
- `📰 공고 확인` 버튼(브리핑 실행)
- 브리핑 섹션: 카드별 제목·기관/카테고리·**마감 D-day**·**적합 이유**·원문 링크·📌 마감 할일 추가
- 계획 카드/액션 라벨에 announcement_briefing 표시. 메모리에도 저장.

## 에러/테스트
- 페치 실패→시드 폴백, 빈 picks/잘못된 JSON 방어
- 유닛: announcements 폴백(seed 비어있지 않음), profile set/get, addBriefing/list, 직접 task 생성

## 범위 밖
- 실시간 크롤링 안정화, 공고 알림 푸시, 지원서 자동작성

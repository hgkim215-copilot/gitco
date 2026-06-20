# 공고 원문 실시간 확인 (web_fetch) — 설계

- 날짜: 2026-06-20
- 맥락: 깃코 공고 브리핑의 seed 약점 완화 + **실제 Copilot SDK 네이티브 도구 호출(web_fetch) 시연** (SDK 25%).
- 검증 완료: 스파이크에서 web_fetch가 BYOK Azure(gpt-4.1-mini, completions)에서 네이티브로 실제 발화함(example.com 읽음).

## 흐름
공고 카드 `🔎 원문 확인` → `POST /api/verify-announcement {url, title}` → web_fetch만 허용한 전용 에이전트 세션:
- 시스템 프롬프트: 주어진 URL을 web_fetch로 읽고 마감일·핵심요건·요약을 JSON으로. 못 읽으면 ok:false.
- 에이전트가 web_fetch 네이티브 호출 → 결과 파싱
- 응답: `{ ok: boolean, deadline?: string, summary?: string, note?: string, toolUsed: boolean }`

## 백엔드
- `backend/src/verify.ts`: `verifyAnnouncement({config, url, title, emit}) -> Promise<VerifyResult>`
  - createSession with `availableTools: new ToolSet().addBuiltIn("web_fetch")`, BYOK Azure provider, onPermissionRequest approve.
  - emit tool_start/tool_done via SSE so UI shows "🌐 web_fetch 호출".
  - parse final assistant message as JSON (reuse tolerant parser); on any failure return {ok:false, note}.
- `server.ts`: `POST /api/verify-announcement` returns runId; reuse existing SSE `/api/stream/:runId` with new event types `verify` / done. (Simpler: dedicated synchronous endpoint returning result + tool flag, plus optional SSE.)
  - Decision: synchronous `POST /api/verify-announcement` returns `{ ok, deadline, summary, note, toolUsed }` (fetch is one step; keep it simple). No approval gate needed beyond internal approve (read-only fetch).

## 프론트엔드
- 공고 카드에 `🔎 원문 확인` 버튼 → 누르면 inline 상태: 확인 중…(스피너) → 결과.
  - 성공: ✅ 원문 확인됨 + 요약/갱신 마감일. "🤖 web_fetch로 실제 페이지 읽음" 라벨.
  - 실패: ⚠️ 확인 불가 — 원문 링크 안내.
- 결과는 카드별 로컬 상태(저장 안 함). i18n 한·영.

## 에러/안전
- fetch 타임아웃·차단·JSON 파싱 실패 → ok:false 친화적 안내. 데모 안 깨짐.
- read-only 외부 조회. URL은 공고 seed/브리핑에서 온 신뢰 URL.

## 범위 밖
- 결과 영속화, 마감일 자동 갱신 반영, 대량 일괄 확인.

# PRD — 깃코 (Gitco)

> 1인 창업가를 위한 AI 비서 · GitHub Copilot SDK + Azure OpenAI + Azure Container Apps · 입코딩 2026
> 🔗 Live: https://ai-chief-of-staff.wonderfulglacier-fcb1cc52.eastus2.azurecontainerapps.io
> 📦 Repo: https://github.com/hgkim215-copilot/gitco

> ⚠️ 이 PRD는 기능을 추가/수정할 때마다 함께 업데이트하고 푸시한다.

## 문제
혼자 모든 걸 처리하는 창업가/프리랜서는 머릿속 의도("투자 미팅 잡고 후속 메일 보내기")를
실제 할 일·일정·이메일로 옮기는 반복 잡무에 하루를 뺏긴다. 특히 투자유치 중에는 투자자
업데이트 작성·후속 관리에 시간이 많이 든다.

## 타깃 사용자
- 1인 D2C/SaaS 창업가, 프리랜서 (페르소나: 김지원, 32세)
- 특히 **투자유치를 진행 중인** 1인 창업가 (IR 특화)

## 핵심 가치
자연어(텍스트·음성)로 목표를 말하면 **깃코**(Copilot SDK 에이전트, Azure OpenAI 구동)가
계획을 세우고, **사용자가 승인하면** 실제로 반영한다. 과거를 기억하고, 투자자 업데이트까지
만들어 주는 "나를 기억하는 IR 비서".

## 기능 목록 (현재 구현됨)

### 1. 자연어 명령 → 계획 → 승인 (코어)
- 커맨드바에 입력(또는 🎤 음성, 브라우저 Web Speech) → Copilot SDK 에이전트가 계획 수립
- 에이전트는 **구조화된 액션 플랜**(JSON)을 반환하고, 추론 과정을 **실시간 스트리밍**
- **승인 게이트**: 승인 전에는 아무것도 저장되지 않음 (Responsible AI)
- 액션 타입: `create_task`, `schedule_event`, `draft_email`, `investor_update`

### 2. 작업 보드 (3패널)
- **할 일**: 우선순위·마감, **완료 체크/되돌리기**, **삭제**
- **캘린더**: 일정, **삭제**
- **이메일 초안**: 제목·본문·수신자, **복사**(클립보드), **삭제**

### 3. 오늘의 브리핑
- `✨ 오늘의 브리핑` 버튼 → 현재 할 일·일정을 검토해 **우선순위 일일 계획** 자동 생성

### 4. Azure 임베딩 기억 (Semantic Memory)
- 승인한 할 일·일정·메일·업데이트를 **Azure `text-embedding-3-small`**로 임베딩해 저장
- 새 명령 시 의미적으로 관련된 과거 기록 **top-3를 코사인 유사도로 회상** → 에이전트 컨텍스트로 주입
- UI: 헤더 `🧠 N 기억` 배지, 활동 패널 "🧠 깃코가 기억을 떠올렸어요" + 유사도 %

### 5. 📈 투자자 업데이트 생성기 (IR 도메인 특화)
- `📈 투자자 업데이트` 버튼 → 핵심 수치·소식만 말하면, **현재 활동 + 기억**을 합쳐 하이브리드로 작성
- 구조화 리포트: **요약(TL;DR) · 핵심 지표 칩 · 하이라이트 · 어려웠던 점 · 요청(Ask) · 다음 달**
- 풀폭 리포트 카드로 렌더, **복사(마크다운)/삭제**

### 6. 📰 맞춤 공고 브리핑 (정부 지원사업)
- **⚙️ 프로필**(업종·창업단계·관심분야)을 한 번 설정 → 깃코가 매칭 기준으로 사용
- `📰 공고 확인` 버튼 → 공고 목록(하이브리드: 런타임 페치 시도 → 실패 시 실제 프로그램 시드)을
  프로필·기억과 함께 에이전트에 주입 → **적합한 공고만 선별 + 적합 이유** 작성
- 그랜트 카드: **마감 D-day · 기관 · 적합 이유 · 원문 링크 · 📌 마감 할일 추가**(원클릭)
- 프로필은 깃코의 모든 계획에 컨텍스트로 주입됨

### 7. 한국어/영어 (KO/EN 토글)
- UI 기본 한국어, 헤더 버튼으로 영어 전환
- 에이전트는 **입력 언어에 맞춰 자동 응답**

### 8. 사용 가이드 (인앱)
- 헤더 `❔ 사용 가이드` → 페르소나(김지원) + 추천 시나리오(눌러서 바로 실행) + 🧠 기억 2단계 체험

## 심사 기준 정렬
| 기준 | 가중치 | 대응 |
|---|--:|---|
| Effective use of Copilot SDK | 25% | 에이전트 런타임 · 계획 · 스트리밍 · permission 승인 · 컨텍스트(기억) 주입 |
| Productivity impact & problem fit | 18% | 1인 창업가, 한 문장 → 다수 산출물; IR 업무 직접 자동화 |
| Azure AI & cloud integration | 18% | 모델·임베딩 100% Azure OpenAI; Container Apps + ACR 배포 |
| Functionality & technical execution | 16% | E2E 작동, 타입 안전 API, 테스트(12), 에러 처리 |
| UX & workflow design | 12% | 저저항 커맨드바, 스트리밍 투명성, 승인 제어, 라이트 테마 |
| Responsible AI, security & trust | 6% | 승인 게이트, 시크릿 분리(Container App Secret) |
| Innovation & originality | 5% | 기억하는 IR 비서, 투자자 업데이트 생성기, 음성 입력 |

## 아키텍처
- 프론트: React + Vite (단일 SPA), 백엔드: Node 22 + Fastify (SSE 스트리밍)
- AI: GitHub Copilot SDK(BYOK) → Azure OpenAI `gpt-4.1-mini` + `text-embedding-3-small`
- 저장: SQLite(better-sqlite3) · 배포: 단일 컨테이너 → Azure Container Registry → Azure Container Apps

### 액션 타입
`create_task`, `schedule_event`, `draft_email`, `investor_update`, `announcement_briefing`

## 범위 밖 (YAGNI)
- 실제 이메일/캘린더 OAuth 연동, 멀티유저 인증, 모바일 네이티브, 투자자 CRM/파이프라인, PDF 내보내기, 공고 실시간 크롤링 안정화·푸시알림

## 향후 후보
- 투자자 파이프라인(CRM) + 단계별 후속, 초안 재생성("더 짧게/정중하게"), 음성 출력(TTS)

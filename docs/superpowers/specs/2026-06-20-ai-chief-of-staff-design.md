# AI Chief of Staff — 설계 문서 (Design Spec)

- 날짜: 2026-06-20
- 대회: 천하제일 입코딩 대회 2026 (개인 생산성 향상 앱)
- 제약(필수): ① 웹 앱 ② Copilot SDK 사용 ③ Azure 플랫폼 배포
- 빌드 조건: 약 4시간, **음성으로만** 코딩(키보드/마우스 금지, 마우스는 음성토글용). 도구는 VS Code + GitHub Copilot + Copilot CLI 만.

## 1. 한 줄 정의

1인 창업가/프리랜서를 위한 **"AI 비서 커맨드센터"** 웹앱. 자연어로 목표를 말하면 Copilot SDK 에이전트가 **계획을 세우고 → 커스텀 도구를 순차 호출**해 앱 내부의 할일·일정·메일 초안을 만들고, **'실행' 직전 사람이 승인**하면 반영한다. 모델 계층은 **Azure OpenAI(gpt-4.1-mini)** 위에서 동작한다.

## 2. 타깃 사용자 & 문제

- **사용자:** 혼자 일하는 창업가/프리랜서. 이메일·일정·문서 잡무에 시간을 뺏긴다.
- **문제:** 머릿속 목표("다음주 투자자 미팅 잡고 후속 메일 초안 써줘")를 실제 할일/일정/초안으로 옮기는 반복 작업이 느리고 맥락 전환 비용이 크다.
- **입증 이점(데모 포인트):** 한 문장 명령 → 다단계 산출물(할일+일정+메일초안)을 수 초 만에 생성. 데모에서 "수동 5분 vs 에이전트 10초" 식 시간 절약을 강조한다.

## 3. 심사기준 정렬 (설계 의사결정의 1순위 근거)

| # | 기준 | 가중치 | 본 설계의 충족 방식 |
|---|------|------:|----|
| 1 | Effective Use of Copilot SDK | 25% | 에이전트 런타임 + 커스텀 도구 호출 + **멀티스텝 플래닝** + **현재 상태 컨텍스트 주입** + **스트리밍** + **permission handler 승인**. 도구 개수(4개)보다 에이전트 루프의 깊이에 집중 |
| 2 | Productivity Impact & Problem Fit | 18% | 명확한 1인 창업가 타깃, 실제 잡무 자동화, 데모서 시간절약 수치 |
| 3 | Azure AI & Cloud Integration | 18% | **AI 모델 100% Azure OpenAI(Foundry) 경유(BYOK)** + 클라우드 네이티브(Container Apps, ACR, Managed Identity, Container App Secrets, Log Analytics) |
| 4 | Functionality & Technical Execution | 16% | 단일 컨테이너 E2E 작동, 에러 처리, 가벼운 테스트, 반응형 웹 |
| 5 | UX & Workflow Design | 12% | 저저항 커맨드바, 실시간 스트리밍 활동패널, 승인으로 사용자 주도권 유지, 지연/에러 우아한 처리 |
| 6 | Responsible AI, Security & Trust | 6% | 실행 전 사람 승인, 추론 투명 표시, 시크릿 안전 처리, 프롬프트 인젝션 인지 |
| 7 | Innovation & Originality | 5% | 커맨드센터 + 음성 입력(보너스) + (스트레치) 자율 일일계획 |

### 핵심 리스크 & 완화
- **R1 (Azure 18%): "단순 끼워넣기 감점".** → 모델·(스트레치)임베딩 모두 Azure에서 구동 + 클라우드 네이티브 실천으로 방어.
- **R2 (SDK 25%): BYOK가 실제로 Azure로 라우팅되는지.** → 스캐폴딩 초반에 **검증 스파이크 1회**(에이전트가 Azure 모델로 응답+툴1개 호출)로 확정 후 진행.
- **R3 (배포 16%): 막판 배포 실패.** → **지금(키보드 가능 시) hello-world를 Azure에 1회 실배포 성공**시켜 파이프라인을 확정, 이후엔 redeploy만.

## 4. 아키텍처

단일 Node 프로세스가 API와 정적 프론트엔드를 함께 서빙 → **컨테이너 1개**로 배포(배포 단순화).

```
[브라우저: React/Vite SPA]
   │  REST(명령/CRUD)  +  SSE(에이전트 스트리밍)
   ▼
[Node 20 + TypeScript + Fastify]
   ├─ Agent Service  ── @github/copilot-sdk (에이전트 런타임)
   │        │ 모델: Azure OpenAI gpt-4.1-mini (BYOK)
   │        └ 커스텀 도구: create_task / get_agenda / schedule_event / draft_email
   ├─ Permission Handler (실행성 도구 승인 게이트, SSE로 승인요청 전송)
   ├─ DB Layer (better-sqlite3: tasks / events / drafts)
   └─ Static (빌드된 React)
          │
          ▼
[Azure Container Apps] ← 이미지: Azure Container Registry
   secrets: AZURE_OPENAI_API_KEY 등 / 로깅: Log Analytics
```

### 기술 스택
- 백엔드: Node 20, TypeScript, Fastify, `@github/copilot-sdk`, `better-sqlite3`
- 프론트엔드: React + Vite + TypeScript (가벼운 CSS, 필요시 최소 유틸 클래스)
- 스트리밍: SSE (Server-Sent Events)
- AI 모델: Azure OpenAI `gpt-4.1-mini` (deployment `gpt-4.1-mini`, region eastus2)
- 배포: Docker(멀티스테이지) → Azure Container Registry → Azure Container Apps

## 5. 컴포넌트 (각 단위의 책임/인터페이스/의존성)

1. **Agent Service** (`backend/src/agent.ts`)
   - 역할: Copilot SDK 클라이언트 구성(BYOK→Azure OpenAI), 시스템 프롬프트, 도구 등록, 프롬프트 실행, 이벤트 스트림 산출.
   - 인터페이스: `runCommand(text, ctx, emit) → Promise<Summary>` (emit으로 스트리밍 이벤트 방출).
   - 의존성: Copilot SDK, Tools, DB(컨텍스트 조회).
2. **Tools** (`backend/src/tools/*.ts`) — 각 도구 = {name, description, JSON schema, handler}
   - `get_agenda` (읽기): 현재 할일/일정 요약 반환(컨텍스트 제공).
   - `create_task` (쓰기/승인): 할일 생성.
   - `schedule_event` (쓰기/승인): 일정 생성.
   - `draft_email` (쓰기/승인): 메일 초안 생성.
   - 의존성: DB Layer.
3. **Permission Handler** (`backend/src/approval.ts`)
   - 역할: 쓰기성 도구 실행 직전 일시정지 → SSE로 승인 요청 → 사용자가 승인/거부 → resolve/deny.
   - 인터페이스: `requestApproval(action) → Promise<'approved'|'denied'>`.
4. **DB Layer** (`backend/src/db.ts`)
   - 역할: SQLite 스키마/쿼리. 테이블: `tasks(id,title,priority,status,due,created_at)`, `events(id,title,start,end,notes,created_at)`, `drafts(id,subject,body,to,created_at)`.
5. **HTTP API** (`backend/src/server.ts`)
   - `POST /api/command` { text } → 에이전트 실행 시작, runId 반환.
   - `GET /api/stream/:runId` → SSE: thinking / tool_call / approval_request / tool_result / final.
   - `POST /api/approve` { runId, actionId, decision } → 승인 결과 전달.
   - `GET /api/tasks|events|drafts` → 패널 데이터.
   - 정적 프론트 서빙(`/`).
6. **Frontend** (`frontend/src/`)
   - 커맨드바(텍스트 + 🎤 Web Speech 보너스).
   - 실시간 활동패널(추론/도구호출/승인버튼 스트리밍).
   - 3패널: Drafts / Calendar / Tasks (SSE final 후 리프레시).

## 6. 데이터 흐름 (핵심 시나리오)

1. 사용자: "다음주 화요일 투자자 미팅 잡고, 끝나고 보낼 후속 메일 초안 써줘".
2. `POST /api/command` → Agent Service 시작, 프론트는 `GET /api/stream/:runId` 구독.
3. 에이전트가 `get_agenda`로 현재 상태를 **컨텍스트로** 읽음 → 계획 수립(스트리밍 표시).
4. `schedule_event` 호출 시도 → Permission Handler가 승인요청 SSE 발송 → UI 승인카드.
5. 사용자 승인 → 도구 실행 → DB 반영 → tool_result 스트리밍.
6. `draft_email` 동일하게 승인→생성.
7. 에이전트 최종 요약(final) 스트리밍 → 프론트가 3패널 리프레시.

## 7. 에러 처리

- Azure 호출 실패: 1회 재시도 후 실패 시 활동패널에 친화적 에러 + 재시도 버튼.
- 도구 입력 검증 실패: 에이전트에 에러 반환 → 에이전트가 보정/재시도.
- 승인 거부/타임아웃: 도구가 'denied' 반환 → 에이전트가 인지하고 대안 제시 또는 중단.
- 시크릿 누락(AZURE_OPENAI_*): 부팅 즉시 명확한 메시지로 실패(fail fast).

## 8. 보안 / 책임 AI

- 모든 쓰기성('보내기/등록') 행동은 **사람 승인** 후에만 실행.
- 에이전트 추론·도구호출을 **투명하게 스트리밍** 표시.
- 시크릿은 코드/리포에 절대 미포함 → 로컬 `.env`(gitignore) + Azure Container App **Secret**.
- 프롬프트 인젝션 인지: 도구는 화이트리스트 스키마만 수용, 모델 출력으로 임의 코드 실행 안 함.

## 9. 테스트 (4시간 제약 → 가볍게, 단 작동 보장)

- 유닛: 각 도구 handler의 DB 작동(생성/조회) 2~3개.
- 스모크: 에이전트가 Azure 모델로 응답하고 도구 1개를 호출하는 통합 1개(검증 스파이크와 동일).
- 수동 E2E: 핵심 시나리오 1회 데모 리허설.

## 10. Azure 배포 (필수 — 최우선)

- **리전:** eastus2 (Azure OpenAI와 동일), **RG:** `rg-lipcoding2026`.
- **이미지:** 멀티스테이지 Dockerfile(프론트 빌드 + 백엔드 런) → Azure Container Registry.
- **호스팅:** Azure Container Apps. `AZURE_OPENAI_API_KEY`는 Container App Secret으로 주입, 나머지는 env.
- **단일 배포 명령:** `az containerapp up` 기반 스크립트(`infra/deploy.sh`) → 음성 단계에선 "배포해줘" 한마디로 재배포.
- **선제 배포:** 키보드 가능한 지금 hello-world를 1회 실배포 성공시켜 파이프라인 확정.

## 11. 범위 (YAGNI)

- **포함(MVP):** 도구 4개, 승인 게이트, 스트리밍, 3패널 UI, Azure 배포, 음성 입력(보너스).
- **스트레치(시간 남으면):** Azure 임베딩(text-embedding-3-small) 기반 의미기억, 자율 "일일계획 생성" 버튼.
- **제외:** 실제 외부 이메일/캘린더 OAuth 연동, 멀티유저/인증, 모바일 네이티브.

## 12. 사전 준비 현황 (키보드 가능 시간에 완료/예정)

- [x] Azure 구독, Provider 등록, Azure OpenAI 리소스 + gpt-4.1-mini 배포 + 실호출 검증
- [x] 자격증명 안전 저장(세션 `files/azure-credentials.env`)
- [ ] 프로젝트 스캐폴딩 + Copilot SDK ↔ Azure BYOK 검증 스파이크
- [ ] Azure Container Apps hello-world 선제 배포
- [ ] PRD.md / AGENTS.md / Custom Instructions

# 깃코 (Gitco)

> **1인 창업가를 위한 AI 비서** — GitHub Copilot SDK + Azure OpenAI + Azure Container Apps
> 입코딩 2026 출품작

🔗 **Live:** https://ai-chief-of-staff.wonderfulglacier-fcb1cc52.eastus2.azurecontainerapps.io
📦 **Repo:** https://github.com/hgkim215-copilot/gitco

---

## 한 줄 소개

혼자 모든 걸 처리하는 창업가가 목표를 말하면, **깃코**(Copilot SDK 에이전트)가 계획을 세우고 할 일·일정·메일 초안·투자자 업데이트·공고 브리핑을 만들어 줍니다. **사람이 승인해야만 저장**됩니다.

---

## 기능 목록

| 기능 | 설명 |
|---|---|
| 💬 **자연어 명령** | 말 한마디로 할 일·일정·메일 초안 생성. 승인 전엔 아무것도 저장 안 됨 |
| 🏠 **오늘 탭** | 마감 임박 할 일·오늘 일정·마감 임박 공고를 한눈에 |
| 🧠 **기억** | 승인한 항목을 Azure `text-embedding-3-small`로 임베딩해 저장, 새 명령에 자동 맥락 주입 |
| 📈 **투자자 업데이트** | 수치·소식만 말하면 TL;DR·지표·하이라이트·Ask·다음달 포함 IR 리포트 자동 생성 |
| 📰 **공고 브리핑** | 프로필(업종·단계·관심) 기반 정부 지원사업 공고 선별, 마감 D-day·적합 이유 제공 |
| 🔎 **원문 확인** | Copilot SDK 내장 `web_fetch` 도구로 공고 URL 실시간 읽어 내용·마감 확인 |
| ✏️ **다시 다듬기** | 초안·업데이트를 "더 짧게 / 정중하게 / 캐주얼하게" 재생성 |
| 🔊 **음성 읽기(TTS)** | 계획·업데이트·공고를 소리내어 읽어줌 |
| 🎤 **음성 입력** | 마이크로 명령 입력 (브라우저 Web Speech API) |
| 🛡 **투명성** | "🤖 AI 생성" 라벨, Azure 모델명 표기, 공고 출처 배지, 책임 AI 안내 |
| 🌐 **KO / EN 토글** | 기본 한국어, 버튼으로 영어 전환. AI도 입력 언어로 응답 |

---

## 아키텍처

```
브라우저 (React + Vite SPA)
  ├── REST + SSE 스트리밍
  └── 탭: 🏠 오늘 / 🗂 워크스페이스 / 📈 투자자 업데이트 / 📰 공고

Node 22 + Fastify 백엔드
  ├── GitHub Copilot SDK — 에이전트 런타임 (BYOK → Azure OpenAI)
  │     ├── 계획 생성: gpt-4.1-mini → 구조화 JSON 액션 플랜
  │     ├── 임베딩 기억: text-embedding-3-small + 코사인 유사도 검색
  │     └── 원문 확인: web_fetch 내장 도구 (네이티브 호출)
  ├── SQLite (better-sqlite3)
  │     └── Azure Files 볼륨 마운트(/data) — 재시작에도 데이터 유지
  └── 정적 React 서빙 (단일 컨테이너)

Azure
  ├── Container Apps (외부 ingress, eastus2)
  ├── Container Registry (이미지 저장)
  ├── Azure OpenAI (gpt-4.1-mini + text-embedding-3-small)
  ├── Azure Files (데이터 영속화)
  └── Log Analytics (관측성)
```

---

## 심사 기준 대응

| 기준 | 가중치 | 대응 |
|---|--:|---|
| **Effective use of Copilot SDK** | 25% | 에이전트 런타임·스트리밍·permission 승인·컨텍스트(기억) 주입·**web_fetch 네이티브 도구 호출** |
| **Productivity impact** | 18% | 1인 창업가 타깃, 한 문장 → 다수 산출물; IR·공고 도메인 특화 |
| **Azure AI & cloud** | 18% | 모델·임베딩 100% Azure OpenAI; Container Apps + ACR + **Azure Files** + Log Analytics |
| **Functionality** | 16% | E2E prod 작동, 타입 안전, 테스트(15), Azure Files 영속화 |
| **UX & workflow** | 12% | 탭 레이아웃, 스트리밍, 승인 제어, 음성 입출력, 접근성(a11y) |
| **Responsible AI** | 6% | 승인 게이트, AI 생성 라벨, 모델명 투명 표기, 시크릿 분리 |
| **Innovation** | 5% | 기억하는 IR 비서, web_fetch 실시간 공고 확인, 음성 루프 |

---

## 로컬 실행

> **Node 22 필수** (Copilot CLI가 `Promise.withResolvers` 사용)

```bash
# 환경 변수 설정 (AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY 등)
cp .env.example .env   # 또는 직접 작성

# 백엔드
cd backend && npm install
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
export COPILOT_CLI_PATH="$PWD/node_modules/@github/copilot/index.js"
npm run dev   # port 8080

# 프론트엔드 (별도 터미널)
cd frontend && npm install && npm run dev   # port 5173
```

---

## 배포

```bash
./infra/deploy.sh
# 로컬 빌드(amd64) → Azure Container Registry → Azure Container Apps
# 스토리지 계정 + Azure Files 공유도 멱등하게 프로비저닝
```

배포 후 `https://<fqdn>/api/health` → `{"ok":true}` 확인.

---

## 기술 스택

- **백엔드**: Node 22, TypeScript, Fastify, `@github/copilot-sdk`, `better-sqlite3`
- **프론트엔드**: React 19, Vite, TypeScript
- **AI**: Copilot SDK BYOK → Azure OpenAI `gpt-4.1-mini` + `text-embedding-3-small`
- **인프라**: Docker, Azure Container Apps, Azure Container Registry, Azure Files, Log Analytics

---

> ⚠️ 이 PRD는 기능 추가/수정 시 `PRD.md`와 함께 업데이트·푸시됩니다.

# AI Chief of Staff — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 1인 창업가용 "AI 비서 커맨드센터" 웹앱 — 자연어 명령을 Copilot SDK 에이전트가 계획→도구 호출(할일·일정·메일초안)→사람 승인 후 반영, 모델은 Azure OpenAI, Azure Container Apps로 배포.

**Architecture:** Node20+TypeScript+Fastify 백엔드가 Copilot SDK 에이전트를 구동(BYOK→Azure OpenAI)하고, 빌드된 React/Vite SPA를 같은 서버가 서빙(단일 컨테이너). 에이전트 진행은 SSE로 스트리밍, 쓰기성 도구는 permission handler로 승인 게이트.

**Tech Stack:** Node 20, TypeScript, Fastify, `@github/copilot-sdk`, `zod`, `better-sqlite3`, React, Vite, Docker, Azure Container Apps, Azure Container Registry, Azure OpenAI(gpt-4.1-mini).

## Global Constraints

- 필수: 웹앱 / Copilot SDK 사용 / **Azure 배포** (대회 실격 방지의 절대 조건).
- AI 모델 계층은 **100% Azure OpenAI(Foundry) 경유** (BYOK). 모델/배포명: `gpt-4.1-mini`.
- Node 버전: `^20.19.0` (SDK 요구).
- Azure 리소스(이미 준비됨): RG `rg-lipcoding2026`, 리전 `eastus2`, AOAI 계정 `aoai-lip2026`, endpoint `https://aoai-lip2026.openai.azure.com/`, 자격증명은 세션 `files/azure-credentials.env`.
- BYOK 설정: `provider: { type: "openai", baseUrl: "https://aoai-lip2026.openai.azure.com/openai/v1/", wireApi: "completions", apiKey: process.env.AZURE_OPENAI_API_KEY }`, `model: "gpt-4.1-mini"`.
- 시크릿은 리포에 절대 미포함(`.env` gitignore, Azure는 Container App Secret).
- 앱 리슨 포트: `8080`.
- 쓰기성 도구(create_task/schedule_event/draft_email)는 승인 게이트 통과 후에만 DB 반영. 읽기 도구(get_agenda)는 `skipPermission: true`.

---

## File Structure

```
backend/
  package.json, tsconfig.json
  src/
    config.ts        # env 로드/검증 (fail fast)
    db.ts            # better-sqlite3 연결 + 스키마 + repo 함수
    tools.ts         # defineTool x4 (get_agenda, create_task, schedule_event, draft_email)
    approval.ts      # 승인 대기 레지스트리 (pending promise + resolve)
    agent.ts         # CopilotClient/세션 구성(BYOK), runCommand(스트리밍/승인)
    server.ts        # Fastify: /api/command, /api/stream/:runId(SSE), /api/approve, CRUD, static
frontend/
  package.json, tsconfig.json, vite.config.ts, index.html
  src/
    main.tsx, App.tsx, api.ts, types.ts
    components/CommandBar.tsx, ActivityPanel.tsx, Panels.tsx
Dockerfile
.dockerignore
.gitignore
infra/deploy.sh      # az containerapp up 래퍼
AGENTS.md, PRD.md
```

---

## Task 1: 프로젝트 스캐폴딩 + 로컬 hello 서버

**Files:**
- Create: `backend/package.json`, `backend/tsconfig.json`, `backend/src/server.ts`, `backend/src/config.ts`
- Create: `.gitignore`, `.dockerignore`

**Interfaces:**
- Produces: `buildServer(): FastifyInstance` (이후 태스크가 라우트 추가), `loadConfig(): AppConfig`.

- [ ] **Step 1: git init + .gitignore**

```bash
cd /Users/hyeongikim/Documents/2_Projects/lipcoding2026
git init
printf "node_modules/\ndist/\n.env\n*.db\nbackend/node_modules/\nfrontend/node_modules/\nfrontend/dist/\nbackend/dist/\n" > .gitignore
printf "node_modules\ndist\n.git\n*.db\n.env\n" > .dockerignore
```

- [ ] **Step 2: backend package.json**

```json
{
  "name": "ai-chief-of-staff-backend",
  "private": true,
  "type": "module",
  "engines": { "node": "^20.19.0" },
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "test": "node --test --import tsx ./src/*.test.ts"
  },
  "dependencies": {
    "@github/copilot-sdk": "^1.0.2",
    "@fastify/static": "^7.0.4",
    "better-sqlite3": "^11.3.0",
    "fastify": "^4.28.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.11",
    "@types/node": "^20.14.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.4"
  }
}
```

- [ ] **Step 3: backend tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: config.ts (fail fast on missing secrets)**

```ts
export interface AppConfig {
  port: number;
  azureEndpoint: string;
  azureApiKey: string;
  azureDeployment: string;
}
export function loadConfig(): AppConfig {
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-mini";
  if (!azureEndpoint || !azureApiKey) {
    throw new Error("Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_API_KEY");
  }
  return { port: Number(process.env.PORT ?? 8080), azureEndpoint, azureApiKey, azureDeployment };
}
```

- [ ] **Step 5: server.ts (hello + health)**

```ts
import Fastify from "fastify";
export function buildServer() {
  const app = Fastify({ logger: true });
  app.get("/api/health", async () => ({ ok: true }));
  app.get("/", async (_req, reply) => reply.type("text/html").send("<h1>AI Chief of Staff</h1>"));
  return app;
}
if (process.argv[1]?.endsWith("server.ts") || process.argv[1]?.endsWith("server.js")) {
  const app = buildServer();
  app.listen({ port: Number(process.env.PORT ?? 8080), host: "0.0.0.0" });
}
```

- [ ] **Step 6: install + run + verify**

```bash
cd backend && npm install
PORT=8080 AZURE_OPENAI_ENDPOINT=x AZURE_OPENAI_API_KEY=x npm run dev &
sleep 3 && curl -s localhost:8080/api/health
```
Expected: `{"ok":true}`

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold backend with fastify hello server"
```

---

## Task 2: BYOK→Azure 검증 스파이크 (최대 리스크 R2 제거)

**Files:**
- Create: `backend/src/spike.ts` (검증용, 이후 삭제 또는 유지)

**Interfaces:**
- Produces: 확인된 BYOK 설정 패턴 (agent.ts가 그대로 사용).

- [ ] **Step 1: spike.ts — 에이전트가 Azure로 응답 + 도구 1개 호출**

```ts
import { CopilotClient, defineTool } from "@github/copilot-sdk";
import { z } from "zod";

const client = new CopilotClient();
await client.start();
const session = await client.createSession({
  model: "gpt-4.1-mini",
  streaming: true,
  provider: {
    type: "openai",
    baseUrl: "https://aoai-lip2026.openai.azure.com/openai/v1/",
    wireApi: "completions",
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
  },
  tools: [
    defineTool("get_time", {
      description: "Return the current ISO time",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => ({ now: new Date().toISOString() }),
    }),
  ],
});
session.on("tool.execution_start", (e) => console.log("TOOL_START", JSON.stringify(e.data)));
session.on("assistant.message", (e) => console.log("FINAL:", e.data.content));
await session.sendAndWait({ prompt: "Call get_time and tell me the current time." });
await client.stop();
```

- [ ] **Step 2: Run spike with real Azure key**

```bash
cd backend
set -a; source /Users/hyeongikim/.copilot/session-state/<SESSION>/files/azure-credentials.env; set +a
npx tsx src/spike.ts
```
Expected: `TOOL_START ...get_time...` 그리고 `FINAL:` 에 현재 시간 포함.
**실패 시 분기:** wireApi를 `"responses"`로 바꿔 재시도 / baseUrl 末尾 슬래시 확인 / endpoint 경로 `/openai/v1/` 확인. 둘 다 실패하면 BYOK 대신 `provider`에 `apiVersion` 필요 여부 확인(README Custom Providers 섹션 참조 라인 737-799).

- [ ] **Step 3: Commit (검증 성공 기록)**

```bash
git add backend/src/spike.ts && git commit -m "test: verify Copilot SDK BYOK routes to Azure OpenAI"
```

---

## Task 3: Dockerfile + Azure Container Apps hello 배포 (리스크 R3 제거 — 필수)

**Files:**
- Create: `Dockerfile`, `infra/deploy.sh`

- [ ] **Step 1: Dockerfile (멀티스테이지 — 지금은 backend만, frontend는 Task 8에서 추가)**

```dockerfile
# build
FROM node:20-bookworm-slim AS build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build
# run
FROM node:20-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production PORT=8080
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/backend/dist ./dist
EXPOSE 8080
CMD ["node", "dist/server.js"]
```
주의: `better-sqlite3`는 네이티브 빌드 → `node:20-bookworm-slim`에 빌드툴 필요할 수 있음. 실패 시 build 스테이지에 `RUN apt-get update && apt-get install -y python3 make g++` 추가.

- [ ] **Step 2: deploy.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail
RG=rg-lipcoding2026
LOC=eastus2
APP=ai-chief-of-staff
ENVNAME=lip-env
az containerapp up \
  --name "$APP" --resource-group "$RG" --location "$LOC" \
  --environment "$ENVNAME" --source . \
  --target-port 8080 --ingress external \
  --env-vars AZURE_OPENAI_ENDPOINT="$AZURE_OPENAI_ENDPOINT" \
             AZURE_OPENAI_DEPLOYMENT="gpt-4.1-mini"
echo "Set secret + bind:"
az containerapp secret set -n "$APP" -g "$RG" --secrets aoai-key="$AZURE_OPENAI_API_KEY"
az containerapp update -n "$APP" -g "$RG" \
  --set-env-vars AZURE_OPENAI_API_KEY=secretref:aoai-key
az containerapp show -n "$APP" -g "$RG" --query properties.configuration.ingress.fqdn -o tsv
```

- [ ] **Step 3: 첫 배포 실행 + 검증**

```bash
set -a; source /Users/hyeongikim/.copilot/session-state/<SESSION>/files/azure-credentials.env; set +a
az extension add --name containerapp --upgrade -y || true
chmod +x infra/deploy.sh && ./infra/deploy.sh
```
Expected: 마지막에 FQDN 출력. `curl -s https://<fqdn>/api/health` → `{"ok":true}`.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile infra/deploy.sh && git commit -m "ci: deploy hello server to Azure Container Apps"
```

---

## Task 4: DB 레이어 (SQLite 스키마 + repo, TDD)

**Files:**
- Create: `backend/src/db.ts`, `backend/src/db.test.ts`

**Interfaces:**
- Produces:
  - `initDb(path?: string): Database` (스키마 보장)
  - `addTask(db, {title, priority?, due?}): Task` / `listTasks(db): Task[]`
  - `addEvent(db, {title, start, end?, notes?}): EventRow` / `listEvents(db): EventRow[]`
  - `addDraft(db, {subject, body, to?}): Draft` / `listDrafts(db): Draft[]`
  - 타입: `Task{id:number,title:string,priority:string,status:string,due:string|null,created_at:string}`, `EventRow{id,title,start,end:string|null,notes:string|null,created_at}`, `Draft{id,subject,body,to:string|null,created_at}`

- [ ] **Step 1: 실패 테스트 작성 (db.test.ts)**

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { initDb, addTask, listTasks } from "./db.ts";

test("addTask then listTasks returns it", () => {
  const db = initDb(":memory:");
  const t = addTask(db, { title: "Email investor", priority: "high" });
  assert.equal(t.title, "Email investor");
  assert.equal(t.priority, "high");
  const all = listTasks(db);
  assert.equal(all.length, 1);
  assert.equal(all[0].title, "Email investor");
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `cd backend && npm test`
Expected: FAIL (`Cannot find module './db.ts'` 또는 export 없음).

- [ ] **Step 3: db.ts 구현**

```ts
import Database from "better-sqlite3";
export type Task = { id:number; title:string; priority:string; status:string; due:string|null; created_at:string };
export type EventRow = { id:number; title:string; start:string; end:string|null; notes:string|null; created_at:string };
export type Draft = { id:number; subject:string; body:string; to:string|null; created_at:string };

export function initDb(path = "data.db") {
  const db = new Database(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks(id INTEGER PRIMARY KEY, title TEXT NOT NULL, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'open', due TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY, title TEXT NOT NULL, start TEXT NOT NULL, end TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS drafts(id INTEGER PRIMARY KEY, subject TEXT NOT NULL, body TEXT NOT NULL, "to" TEXT, created_at TEXT DEFAULT (datetime('now')));
  `);
  return db;
}
export function addTask(db:Database.Database, i:{title:string;priority?:string;due?:string}):Task {
  const r = db.prepare(`INSERT INTO tasks(title,priority,due) VALUES(?,?,?)`).run(i.title, i.priority ?? "medium", i.due ?? null);
  return db.prepare(`SELECT * FROM tasks WHERE id=?`).get(r.lastInsertRowid) as Task;
}
export function listTasks(db:Database.Database):Task[] { return db.prepare(`SELECT * FROM tasks ORDER BY id DESC`).all() as Task[]; }
export function addEvent(db:Database.Database, i:{title:string;start:string;end?:string;notes?:string}):EventRow {
  const r = db.prepare(`INSERT INTO events(title,start,end,notes) VALUES(?,?,?,?)`).run(i.title, i.start, i.end ?? null, i.notes ?? null);
  return db.prepare(`SELECT * FROM events WHERE id=?`).get(r.lastInsertRowid) as EventRow;
}
export function listEvents(db:Database.Database):EventRow[] { return db.prepare(`SELECT * FROM events ORDER BY start ASC`).all() as EventRow[]; }
export function addDraft(db:Database.Database, i:{subject:string;body:string;to?:string}):Draft {
  const r = db.prepare(`INSERT INTO drafts(subject,body,"to") VALUES(?,?,?)`).run(i.subject, i.body, i.to ?? null);
  return db.prepare(`SELECT * FROM drafts WHERE id=?`).get(r.lastInsertRowid) as Draft;
}
export function listDrafts(db:Database.Database):Draft[] { return db.prepare(`SELECT * FROM drafts ORDER BY id DESC`).all() as Draft[]; }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd backend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/db.ts backend/src/db.test.ts && git commit -m "feat: sqlite db layer for tasks/events/drafts"
```

---

## Task 5: 에이전트 도구 + 에이전트 서비스

**Files:**
- Create: `backend/src/tools.ts`, `backend/src/agent.ts`, `backend/src/approval.ts`

**Interfaces:**
- Consumes: db.ts repo 함수, config.ts.
- Produces:
  - `approval.ts`: `createApprovalRegistry()` → `{ request(runId, action): Promise<boolean>, resolve(runId, actionId, ok): void, onPending(cb): void }`
  - `tools.ts`: `buildTools(db, ctx): Tool[]` (ctx로 runId/emit 접근; 쓰기 도구는 승인 대기)
  - `agent.ts`: `runCommand(opts:{db, config, approval, runId, prompt, emit:(ev:AgentEvent)=>void}): Promise<void>`
  - 타입: `AgentEvent = {type:"delta"|"message"|"tool_start"|"tool_done"|"approval"|"error"|"done", data:any}`

- [ ] **Step 1: approval.ts (승인 대기 레지스트리)**

```ts
type Pending = { actionId:string; resolve:(ok:boolean)=>void; action:any };
export function createApprovalRegistry() {
  const pending = new Map<string, Pending>(); // key = runId:actionId
  let onPendingCb: ((runId:string, action:any)=>void) | null = null;
  return {
    onPending(cb:(runId:string, action:any)=>void){ onPendingCb = cb; },
    request(runId:string, action:{actionId:string; tool:string; args:any}):Promise<boolean>{
      return new Promise((resolve)=>{
        pending.set(`${runId}:${action.actionId}`, { actionId: action.actionId, resolve, action });
        onPendingCb?.(runId, action);
      });
    },
    resolve(runId:string, actionId:string, ok:boolean){
      const p = pending.get(`${runId}:${actionId}`);
      if (p){ p.resolve(ok); pending.delete(`${runId}:${actionId}`); }
    },
  };
}
export type ApprovalRegistry = ReturnType<typeof createApprovalRegistry>;
```

- [ ] **Step 2: tools.ts (defineTool x4)**

```ts
import { defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import type Database from "better-sqlite3";
import { addTask, listTasks, addEvent, listEvents, addDraft } from "./db.ts";
import type { ApprovalRegistry } from "./approval.ts";

export function buildTools(db:Database.Database, approval:ApprovalRegistry, runId:string) {
  const guard = async (tool:string, args:any, commit:()=>any) => {
    const actionId = `${tool}-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
    const ok = await approval.request(runId, { actionId, tool, args });
    if (!ok) return { approved:false, message:`User denied ${tool}` };
    return { approved:true, result: commit() };
  };
  return [
    defineTool("get_agenda", {
      description: "Get current open tasks and upcoming events as context",
      parameters: z.object({}),
      skipPermission: true,
      handler: async () => ({ tasks: listTasks(db), events: listEvents(db) }),
    }),
    defineTool("create_task", {
      description: "Create a to-do task. Requires user approval.",
      parameters: z.object({ title: z.string(), priority: z.enum(["low","medium","high"]).optional(), due: z.string().optional() }),
      handler: async (a) => guard("create_task", a, () => addTask(db, a)),
    }),
    defineTool("schedule_event", {
      description: "Schedule a calendar event (ISO datetimes). Requires user approval.",
      parameters: z.object({ title: z.string(), start: z.string(), end: z.string().optional(), notes: z.string().optional() }),
      handler: async (a) => guard("schedule_event", a, () => addEvent(db, a)),
    }),
    defineTool("draft_email", {
      description: "Draft an email (not sent). Requires user approval.",
      parameters: z.object({ subject: z.string(), body: z.string(), to: z.string().optional() }),
      handler: async (a) => guard("draft_email", a, () => addDraft(db, a)),
    }),
  ];
}
```
참고: 승인 게이트를 SDK permission handler 대신 **도구 핸들러 내부 guard**로 구현(런별 runId 바인딩이 쉬움). SDK `onPermissionRequest`도 병행 사용 가능하나 MVP는 guard 방식으로 단순화.

- [ ] **Step 3: agent.ts (BYOK 세션 + 스트리밍 + 도구)**

```ts
import { CopilotClient } from "@github/copilot-sdk";
import type Database from "better-sqlite3";
import type { AppConfig } from "./config.ts";
import type { ApprovalRegistry } from "./approval.ts";
import { buildTools } from "./tools.ts";

export type AgentEvent = { type:"delta"|"message"|"tool_start"|"tool_done"|"error"|"done"; data:any };

let clientPromise: Promise<CopilotClient> | null = null;
async function getClient(){ if(!clientPromise){ const c=new CopilotClient(); clientPromise=c.start().then(()=>c);} return clientPromise; }

const SYSTEM = `You are an AI chief of staff for a solo founder. When given a goal, first call get_agenda to load context, then create tasks, schedule events, and draft emails as needed using the tools. Be concise. Always use tools to make changes; never claim a change without calling a tool.`;

export async function runCommand(o:{db:Database.Database; config:AppConfig; approval:ApprovalRegistry; runId:string; prompt:string; emit:(e:AgentEvent)=>void}){
  try {
    const client = await getClient();
    const session = await client.createSession({
      model: o.config.azureDeployment,
      streaming: true,
      systemMessage: { mode: "customize", additionalContext: SYSTEM } as any,
      provider: { type:"openai", baseUrl: o.config.azureEndpoint.replace(/\/?$/,"/")+"openai/v1/", wireApi:"completions", apiKey: o.config.azureApiKey },
      tools: buildTools(o.db, o.approval, o.runId),
    });
    session.on("assistant.message_delta",(e)=>o.emit({type:"delta",data:e.data.deltaContent}));
    session.on("tool.execution_start",(e)=>o.emit({type:"tool_start",data:e.data}));
    session.on("tool.execution_complete",(e)=>o.emit({type:"tool_done",data:e.data}));
    session.on("assistant.message",(e)=>o.emit({type:"message",data:e.data.content}));
    await session.sendAndWait({ prompt: o.prompt });
    await session.disconnect();
    o.emit({type:"done",data:null});
  } catch(err:any){ o.emit({type:"error",data:String(err?.message ?? err)}); o.emit({type:"done",data:null}); }
}
```
주의: `systemMessage` 형태는 README "System Message Customization"(라인 572-645) 확인 후 정확 필드로 보정. 실패 시 system을 prompt 앞에 합쳐 전달하는 fallback 사용.

- [ ] **Step 4: 통합 스모크 (실제 Azure, 도구 자동승인)**

`backend/src/agent.smoke.ts` 작성: approval.request를 항상 true로 stub → runCommand("Create a high priority task to email the investor") → tool_start(create_task) + done 확인.
```bash
cd backend && set -a; source <creds>; set +a; npx tsx src/agent.smoke.ts
```
Expected: `tool_start ... create_task` 로그 + 종료. DB에 task 1건.

- [ ] **Step 5: Commit**

```bash
git add backend/src/{tools,agent,approval}.ts backend/src/agent.smoke.ts && git commit -m "feat: copilot agent with approval-gated tools on azure"
```

---

## Task 6: HTTP API (command/stream/approve/CRUD) + SSE

**Files:**
- Modify: `backend/src/server.ts`

**Interfaces:**
- Consumes: runCommand, createApprovalRegistry, db.
- Produces 엔드포인트:
  - `POST /api/command {text}` → `{runId}` (비동기 실행 시작)
  - `GET /api/stream/:runId` → SSE (event: agent, data: AgentEvent JSON; approval 요청은 type:"approval")
  - `POST /api/approve {runId, actionId, decision:"approve"|"deny"}` → `{ok:true}`
  - `GET /api/tasks` `GET /api/events` `GET /api/drafts` → 배열

- [ ] **Step 1: server.ts 확장**

```ts
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { loadConfig } from "./config.ts";
import { initDb, listTasks, listEvents, listDrafts } from "./db.ts";
import { createApprovalRegistry } from "./approval.ts";
import { runCommand, type AgentEvent } from "./agent.ts";

export function buildServer(){
  const app = Fastify({ logger:true });
  const config = loadConfig();
  const db = initDb(process.env.DB_PATH ?? "data.db");
  const approval = createApprovalRegistry();
  const streams = new Map<string,(e:AgentEvent)=>void>(); // runId -> emit

  approval.onPending((runId, action)=> streams.get(runId)?.({type:"tool_start" as any, data:{approval:true, ...action}}));

  app.get("/api/health", async()=>({ok:true}));
  app.get("/api/tasks", async()=>listTasks(db));
  app.get("/api/events", async()=>listEvents(db));
  app.get("/api/drafts", async()=>listDrafts(db));

  app.post("/api/command", async (req)=>{
    const { text } = req.body as {text:string};
    const runId = randomUUID();
    // start after small delay so client can subscribe
    setTimeout(()=>{
      const emit = streams.get(runId) ?? (()=>{});
      runCommand({ db, config, approval, runId, prompt:text, emit });
    }, 300);
    return { runId };
  });

  app.get("/api/stream/:runId", async (req, reply)=>{
    const { runId } = req.params as {runId:string};
    reply.raw.writeHead(200, {"Content-Type":"text/event-stream","Cache-Control":"no-cache","Connection":"keep-alive"});
    const send=(e:AgentEvent)=>reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);
    streams.set(runId, send);
    req.raw.on("close", ()=>streams.delete(runId));
  });

  app.post("/api/approve", async (req)=>{
    const { runId, actionId, decision } = req.body as any;
    approval.resolve(runId, actionId, decision==="approve");
    return { ok:true };
  });
  return app;
}
if (process.argv[1]?.includes("server")) {
  buildServer().listen({ port: Number(process.env.PORT ?? 8080), host:"0.0.0.0" });
}
```
주의: command가 approval.onPending을 stream으로 전달하려면 emit이 등록된 후 실행돼야 함 → setTimeout 300ms로 구독 보장(데모 충분). 더 견고히 하려면 명령 큐/대기 로직 추가.

- [ ] **Step 2: 수동 검증**

```bash
cd backend && set -a; source <creds>; set +a; npm run dev &
sleep 3
RUN=$(curl -s -XPOST localhost:8080/api/command -H 'content-type: application/json' -d '{"text":"Create a high priority task: email investor"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["runId"])')
curl -s -N localhost:8080/api/stream/$RUN &   # 스트림 관찰
# 승인 요청(tool_start approval:true) 뜨면 actionId로 승인:
# curl -s -XPOST localhost:8080/api/approve -H 'content-type: application/json' -d '{"runId":"'$RUN'","actionId":"<id>","decision":"approve"}'
sleep 8; curl -s localhost:8080/api/tasks
```
Expected: 스트림에 delta/tool_start, 승인 후 tasks에 항목 1건.

- [ ] **Step 3: Commit**

```bash
git add backend/src/server.ts && git commit -m "feat: command/stream/approve API with SSE"
```

---

## Task 7: 프론트엔드 (커맨드바 + 활동패널 + 3패널 + 음성 보너스)

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/tsconfig.json`, `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/api.ts`, `frontend/src/types.ts`, `frontend/src/components/{CommandBar,ActivityPanel,Panels}.tsx`

**Interfaces:**
- Consumes: 백엔드 API (`/api/*`). dev는 vite proxy로 8080 프록시.

- [ ] **Step 1: Vite React TS 스캐폴딩**

```bash
cd /Users/hyeongikim/Documents/2_Projects/lipcoding2026
npm create vite@latest frontend -- --template react-ts
cd frontend && npm install
```

- [ ] **Step 2: vite.config.ts — 프록시 + build outDir**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins:[react()],
  server:{ proxy:{ "/api":"http://localhost:8080" } },
  build:{ outDir:"dist" },
});
```

- [ ] **Step 3: api.ts (command + SSE 구독 + approve + fetch lists)**

```ts
export async function sendCommand(text:string){ const r=await fetch("/api/command",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text})}); return (await r.json()).runId as string; }
export function subscribe(runId:string, onEvent:(e:any)=>void){ const es=new EventSource(`/api/stream/${runId}`); es.onmessage=(m)=>onEvent(JSON.parse(m.data)); return ()=>es.close(); }
export async function approve(runId:string, actionId:string, decision:"approve"|"deny"){ await fetch("/api/approve",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({runId,actionId,decision})}); }
export async function getList(kind:"tasks"|"events"|"drafts"){ return (await fetch(`/api/${kind}`)).json(); }
```

- [ ] **Step 4: App.tsx + 컴포넌트** — 커맨드바(텍스트 + 🎤 `webkitSpeechRecognition` 있으면 음성), 활동패널(delta 누적·tool_start/tool_done·approval 카드[승인/거부 버튼→approve()]), 3패널(done 이벤트 시 getList 새로고침). (구현 코드: 실행 시 작성, 위 api.ts 인터페이스 사용)

- [ ] **Step 5: 로컬 E2E 확인**

```bash
cd frontend && npm run dev   # 5173
# 백엔드도 실행 중이어야 함. 브라우저에서 명령 → 승인 → 패널 갱신 확인.
```
Expected: 명령 입력 → 스트리밍 추론 → 승인 카드 → 승인 시 Tasks/Calendar/Drafts 갱신.

- [ ] **Step 6: Commit**

```bash
git add frontend && git commit -m "feat: react command center UI with streaming + approval + voice"
```

---

## Task 8: 통합 빌드(단일 컨테이너) + Azure 재배포 + 스모크

**Files:**
- Modify: `Dockerfile`, `backend/src/server.ts` (정적 서빙)

- [ ] **Step 1: 백엔드에 정적 서빙 추가**

```ts
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
// buildServer() 내부 끝에:
const here = dirname(fileURLToPath(import.meta.url));
app.register(fastifyStatic, { root: join(here, "../public"), prefix: "/" });
```

- [ ] **Step 2: Dockerfile 멀티스테이지 — frontend 빌드 → backend public으로 복사**

```dockerfile
FROM node:20-bookworm-slim AS fe
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-bookworm-slim AS be
WORKDIR /app/backend
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production PORT=8080
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY --from=be /app/backend/dist ./dist
COPY --from=fe /app/frontend/dist ./public
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

- [ ] **Step 3: 재배포 + 스모크**

```bash
set -a; source <creds>; set +a
./infra/deploy.sh
FQDN=$(az containerapp show -n ai-chief-of-staff -g rg-lipcoding2026 --query properties.configuration.ingress.fqdn -o tsv)
curl -s https://$FQDN/api/health   # {"ok":true}
echo "OPEN: https://$FQDN"
```
Expected: 헬스 OK, 브라우저에서 명령→승인→패널 갱신 동작.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile backend/src/server.ts && git commit -m "feat: single-container build + redeploy to azure"
```

---

## Task 9: 대회 문서 (PRD.md, AGENTS.md)

- [ ] **Step 1: PRD.md** — 문제/타깃/핵심기능/심사정렬 요약(스펙 압축본).
- [ ] **Step 2: AGENTS.md** — 스택/실행(`backend: npm run dev`, `frontend: npm run dev`)/빌드/배포(`./infra/deploy.sh`)/컨벤션/시크릿 위치/주의(better-sqlite3 네이티브, BYOK wireApi) 명시.
- [ ] **Step 3: Commit** `git add PRD.md AGENTS.md && git commit -m "docs: PRD and AGENTS"`

---

## 스트레치 (시간 남으면)
- Azure 임베딩(text-embedding-3-small) 기반 의미기억: 과거 tasks/drafts 임베딩 저장 → `recall` 읽기 도구 추가.
- "오늘 일일계획 생성" 버튼: get_agenda 기반 자동 계획 명령 1클릭.
- Managed Identity로 ACR pull(현재는 admin/up 자동). Log Analytics 대시보드 캡처.

## Self-Review 메모 (작성자 점검 완료)
- 스펙 커버리지: 도구4·승인·스트리밍·3패널·Azure배포·에러처리·테스트·보안 모두 태스크 매핑됨.
- 리스크 우선: R2(BYOK) Task2, R3(배포) Task3에서 선제 제거.
- 타입 일관성: AgentEvent/Task/EventRow/Draft 시그니처 태스크 간 일치.
- 미해결 보정 포인트(실행 중 확인): `systemMessage` 정확 필드(README 572-645), BYOK `wireApi`("completions"↔"responses"), SSE 구독 타이밍(setTimeout 300ms).

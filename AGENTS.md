# AGENTS.md — working in this repo

## What this is
"AI Chief of Staff" — a productivity web app for the 입코딩 2026 competition.
Backend (Node + Fastify) runs a **GitHub Copilot SDK** agent whose model layer is
**Azure OpenAI (gpt-4.1-mini, BYOK)**. A React/Vite SPA is served by the same backend
(single container). Deployed to **Azure Container Apps**.

## Stack
- Backend: Node 22, TypeScript, Fastify, `@github/copilot-sdk`, `@github/copilot`, `better-sqlite3`.
- Frontend: React + Vite + TypeScript (built to `frontend/dist`, served from `backend/public`).
- AI: Azure OpenAI `gpt-4.1-mini` via Copilot SDK BYOK provider.
- Deploy: Docker → Azure Container Registry → Azure Container Apps.

## CRITICAL environment requirements
- **Use Node 22+** (the Copilot CLI bundled by the SDK uses `Promise.withResolvers`, which is
  absent in Node 20 → segfault/crash). Locally: `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`.
  A `.node-version` (22.22.2) is committed.
- The SDK needs `@github/copilot` installed AND `COPILOT_CLI_PATH` pointing at
  `backend/node_modules/@github/copilot/index.js` (resolver misbehaves under tsx/bundlers).
- If you switch Node versions, run `npm rebuild better-sqlite3` (native ABI).

## Architecture notes / gotchas
- **BYOK to Azure uses `wireApi: "completions"`** with `baseUrl = <endpoint>/openai/v1/` and
  `model` = the Azure *deployment name* (`gpt-4.1-mini`).
- **SDK custom tools are NOT surfaced to the model under BYOK `completions`** (Azure 400
  "parallel_tool_calls…"). `responses` API fails for gpt-4.1-mini ("Encrypted content…").
  → The agent therefore **returns a structured JSON plan** (`{summary, actions[]}`) which the
  backend parses (`parsePlan`) and executes (`applyPlan`) after user approval. Do not reintroduce
  `defineTool`-based actions without re-validating.
- Approval gate: the backend stores the parsed plan per run; `/api/approve` applies it to SQLite.

## Commands
```bash
# backend (port 8080) — needs Azure creds + COPILOT_CLI_PATH in env
cd backend && npm install
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
export COPILOT_CLI_PATH="$PWD/node_modules/@github/copilot/index.js"
set -a; source <azure-credentials.env>; set +a
npm run dev            # tsx watch
npm test               # node --test (db + plan/apply unit tests)
npm run build          # tsc -> dist (tests/spikes excluded)

# frontend (port 5173, proxies /api -> 8080)
cd frontend && npm install && npm run dev
npm run build          # -> frontend/dist

# deploy to Azure (builds frontend+backend locally, builds amd64 image, pushes to ACR, deploys)
./infra/deploy.sh
```

## Secrets
- Never commit secrets. Local: an env file with `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`,
  `AZURE_OPENAI_DEPLOYMENT`. In Azure: `AZURE_OPENAI_API_KEY` is a Container App **secret**
  (`secretref:aoai-key`); endpoint/deployment are plain env vars.

## Azure resources (already provisioned)
- Resource group `rg-lipcoding2026`, region `eastus2`.
- Azure OpenAI `aoai-lip2026`, deployment `gpt-4.1-mini` (GlobalStandard).
- ACR `ca74949c518eacr`, Container App env `lip-env`, app `ai-chief-of-staff`.
- Note: this subscription has **ACR Tasks (cloud build) disabled**, so images are built
  locally and pushed (`infra/deploy.sh`). Build amd64 (`--platform linux/amd64`); Container
  Apps does not run arm64.

## Conventions
- TypeScript ESM with `.js` import specifiers (required for `tsc` build; `tsx` resolves them in dev).
- Keep files focused: `config`, `db`, `agent`, `actions`, `server` each own one responsibility.

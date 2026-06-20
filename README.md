# AI Chief of Staff

> 입코딩 2026 — 개인 생산성 향상 앱. Built with the **GitHub Copilot SDK**, powered by
> **Azure OpenAI**, deployed on **Azure Container Apps**.

Tell the app a goal in plain language — _"Schedule an investor meeting next Tuesday at 2pm
and draft a follow-up email to Jane."_ A Copilot SDK agent reasons over your current
workspace, streams its thinking, and proposes a concrete plan of **tasks, calendar events,
and email drafts**. **Nothing is saved until you approve it.**

🔗 **Live:** https://ai-chief-of-staff.wonderfulglacier-fcb1cc52.eastus2.azurecontainerapps.io

## How it works
```
Browser (React SPA)
  │  POST /api/command           ── user goal
  │  GET  /api/stream/:id (SSE)  ── streamed agent reasoning + plan
  │  POST /api/approve           ── apply after human approval
  ▼
Fastify backend (Node 22)
  └─ Copilot SDK agent  ── model: Azure OpenAI gpt-4.1-mini (BYOK)
        returns {summary, actions[]}  → parsed → applied to SQLite on approval
  ▼
Azure Container Apps  (image from Azure Container Registry)
```

The agent returns a **structured JSON plan** that the backend executes after you approve —
a deliberate design choice (see `AGENTS.md` for the BYOK tool-calling constraint that drove it),
giving full transparency and a human-in-the-loop safety gate.

## Run locally
See **AGENTS.md** for full commands and the required Node 22 / `COPILOT_CLI_PATH` setup.

```bash
# backend
cd backend && npm install
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
export COPILOT_CLI_PATH="$PWD/node_modules/@github/copilot/index.js"
set -a; source your-azure-creds.env; set +a   # AZURE_OPENAI_ENDPOINT / _API_KEY / _DEPLOYMENT
npm run dev

# frontend (separate terminal)
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Deploy
```bash
./infra/deploy.sh    # builds locally, pushes to ACR, deploys to Azure Container Apps
```

## Tech
Node 22 · TypeScript · Fastify · @github/copilot-sdk · better-sqlite3 · React · Vite ·
Azure OpenAI · Azure Container Apps · Azure Container Registry.

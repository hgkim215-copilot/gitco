# PRD — AI Chief of Staff

## Problem
Solo founders and freelancers lose hours every day turning intentions ("schedule the
investor meeting and send Jane a follow-up") into actual tasks, calendar events, and
email drafts. The context-switching between tools is the real cost.

## Target user
A one-person business owner / freelancer who lives in a browser and wants an assistant
that *does the busywork* — not just chats about it.

## What it does
A web app where you type (or speak) a goal. An AI agent built on the **GitHub Copilot SDK**,
with its model layer running on **Azure OpenAI (gpt-4.1-mini)**, reasons over your current
workspace and proposes a concrete **plan of actions**: tasks, calendar events, and email
drafts. The agent's reasoning streams live. **Nothing is saved until you approve** — you stay
in control. On approval, the actions are written to your workspace and the three panels
(Tasks / Calendar / Drafts) update.

## Core features
- Natural-language command bar (text + optional browser voice input).
- Copilot SDK agent that plans multi-step actions from a single goal, with **live streaming**.
- **Human-in-the-loop approval gate** before any change is committed (Responsible AI).
- Three live panels: Tasks, Calendar, Email Drafts.
- No external OAuth — fully self-contained and demo-stable.

## How it maps to the judging criteria
| Criterion | Weight | How we address it |
|---|--:|---|
| Effective use of Copilot SDK | 25% | Agent runtime drives planning + streaming + permission handling; system-prompt engineering; current-state context injection. |
| Productivity impact & problem fit | 18% | Clear solo-founder user; one sentence → multiple concrete artifacts in seconds. |
| Azure AI & cloud integration | 18% | Model layer 100% on Azure OpenAI (BYOK); deployed on Azure Container Apps via Azure Container Registry. |
| Functionality & technical execution | 16% | Works end-to-end in production; typed API; tests; error handling. |
| UX & workflow design | 12% | Low-friction command bar, streamed transparency, approve/discard control. |
| Responsible AI, security & trust | 6% | Approval before commit; secrets via Container App secrets; no arbitrary tool execution. |
| Innovation & originality | 5% | "Plan → approve → execute" chief-of-staff loop with voice input. |

## Out of scope (YAGNI)
Real email/calendar OAuth, multi-user auth, mobile native.

## Stretch
Azure embeddings (text-embedding-3-small) semantic memory; one-click "daily plan".

## Live
https://ai-chief-of-staff.wonderfulglacier-fcb1cc52.eastus2.azurecontainerapps.io

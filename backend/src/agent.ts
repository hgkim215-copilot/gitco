import { CopilotClient } from "@github/copilot-sdk";
import type { AppConfig } from "./config.js";

export type Action =
  | { type: "create_task"; data: { title: string; priority?: string; due?: string } }
  | { type: "schedule_event"; data: { title: string; start: string; end?: string; notes?: string } }
  | { type: "draft_email"; data: { subject: string; body: string; to?: string } };

export type Plan = { summary: string; actions: Action[] };

export type AgentEvent =
  | { type: "delta"; data: string }
  | { type: "memory"; data: { text: string; kind: string; score: number }[] }
  | { type: "plan"; data: { planId: string; plan: Plan } }
  | { type: "error"; data: string }
  | { type: "done"; data: null };

const SYSTEM = `You are an AI chief of staff for a solo founder/freelancer.
Given the user's goal and their current workspace state, produce a concrete plan of actions.

Respond with ONLY a single JSON object (no prose, no markdown code fences) of this exact shape:
{
  "summary": "one short sentence describing what you'll do",
  "actions": [
    { "type": "create_task", "data": { "title": "string", "priority": "low|medium|high", "due": "YYYY-MM-DD (optional)" } },
    { "type": "schedule_event", "data": { "title": "string", "start": "ISO 8601 datetime", "end": "ISO 8601 (optional)", "notes": "string (optional)" } },
    { "type": "draft_email", "data": { "subject": "string", "body": "string", "to": "string (optional)" } }
  ]
}

Rules:
- Use only the three action types above.
- Resolve relative dates (e.g. "next Tuesday") to concrete ISO dates based on the provided current date.
- Keep email bodies concise and professional.
- Write the "summary" and ALL human-readable content (task titles, event titles, notes, email subject and body) in the SAME language as the user's GOAL. If the goal is written in Korean, respond in Korean; if in English, respond in English.
- The JSON keys and action "type" values must stay exactly as specified in English.
- Do NOT use any tools. Output JSON only.`;

let clientPromise: Promise<CopilotClient> | null = null;
async function getClient(): Promise<CopilotClient> {
  if (!clientPromise) {
    const c = new CopilotClient({ useLoggedInUser: false });
    clientPromise = c.start().then(() => c);
  }
  return clientPromise;
}

export function parsePlan(text: string): Plan | null {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    if (!obj || !Array.isArray(obj.actions)) return null;
    return { summary: String(obj.summary ?? ""), actions: obj.actions as Action[] };
  } catch {
    return null;
  }
}

export async function planFromCommand(o: {
  config: AppConfig;
  prompt: string;
  context: string;
  emit: (e: AgentEvent) => void;
}): Promise<Plan | null> {
  const client = await getClient();
  const baseUrl = o.config.azureEndpoint.replace(/\/?$/, "/") + "openai/v1/";
  const session = await client.createSession({
    model: o.config.azureDeployment,
    streaming: true,
    onPermissionRequest: () => ({
      kind: "reject" as const,
      feedback: "Do not use tools. Output JSON only.",
    }),
    provider: {
      type: "openai",
      baseUrl,
      wireApi: "completions",
      apiKey: o.config.azureApiKey,
    },
  });

  let full = "";
  session.on("assistant.message_delta", (e: any) => {
    const d = e.data?.deltaContent ?? "";
    full += d;
    if (d) o.emit({ type: "delta", data: d });
  });
  session.on("assistant.message", (e: any) => {
    if (!full) full = e.data?.content ?? "";
  });

  const today = new Date().toISOString();
  const message = `${SYSTEM}\n\nCURRENT DATE: ${today}\n\nCURRENT WORKSPACE STATE:\n${o.context}\n\nGOAL: ${o.prompt}`;
  await session.sendAndWait({ prompt: message });
  await session.disconnect();

  return parsePlan(full);
}

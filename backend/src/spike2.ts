import { CopilotClient } from "@github/copilot-sdk";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT ?? "https://aoai-lip2026.openai.azure.com/";
const baseUrl = endpoint.replace(/\/?$/, "/") + "openai/v1/";

const client = new CopilotClient();
await client.start();

const SYSTEM = `You are an AI chief of staff. Given a goal, respond ONLY with a JSON object (no prose, no markdown fences) of the form:
{"summary": string, "actions": [{"type": "create_task"|"schedule_event"|"draft_email", "data": object}]}
Do NOT use any tools. Output only the JSON.`;

const session = await client.createSession({
  model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-mini",
  streaming: true,
  onPermissionRequest: (request: any) => {
    console.log("PERM(reject)", request.kind, request.toolName ?? "");
    return { kind: "reject", feedback: "Do not use tools. Output JSON only." };
  },
  provider: {
    type: "openai",
    baseUrl,
    wireApi: "completions",
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
  },
});

let full = "";
session.on("assistant.message_delta", (e: any) => { full += e.data.deltaContent ?? ""; });
session.on("assistant.message", (e: any) => console.log("FINAL:\n", e.data.content));

await session.sendAndWait({
  prompt:
    SYSTEM +
    "\n\nGOAL: Schedule an investor meeting next Tuesday at 2pm and draft a follow-up email to Jane.",
});
await session.disconnect();
await client.stop();
console.log("SPIKE2_DONE");

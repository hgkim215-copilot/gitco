import { CopilotClient, ToolSet } from "@github/copilot-sdk";
import type { AppConfig } from "./config.js";

export type VerifyResult = {
  ok: boolean;
  deadline?: string;
  summary?: string;
  note?: string;
  toolUsed: boolean;
};

const SYSTEM = `You verify a startup-support announcement by reading its web page.
You have a tool named web_fetch. You MUST call web_fetch on the given URL to read the live page.
After reading it, respond with ONLY a JSON object (no prose, no code fences) of this shape:
{ "ok": true, "deadline": "YYYY-MM-DD or empty", "summary": "2-3 sentence summary of what the page says, in the user's language" }
Set ok:true whenever you successfully fetched the page and can summarize its content.
Only respond with { "ok": false, "note": "short reason in the user's language" } if web_fetch failed,
the page was empty/blocked, or there was genuinely no readable content.`;

function parseResult(text: string): VerifyResult {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return { ok: false, note: "no_result", toolUsed: false };
  try {
    const o = JSON.parse(cleaned.slice(start, end + 1));
    return {
      ok: Boolean(o.ok),
      deadline: typeof o.deadline === "string" && o.deadline ? o.deadline : undefined,
      summary: typeof o.summary === "string" ? o.summary : undefined,
      note: typeof o.note === "string" ? o.note : undefined,
      toolUsed: false,
    };
  } catch {
    return { ok: false, note: "parse_error", toolUsed: false };
  }
}

let clientPromise: Promise<CopilotClient> | null = null;
async function getClient(): Promise<CopilotClient> {
  if (!clientPromise) {
    const c = new CopilotClient({ useLoggedInUser: false });
    clientPromise = c.start().then(() => c);
  }
  return clientPromise;
}

export async function verifyAnnouncement(o: {
  config: AppConfig;
  url: string;
  title: string;
  lang?: string;
}): Promise<VerifyResult> {
  try {
    const client = await getClient();
    const baseUrl = o.config.azureEndpoint.replace(/\/?$/, "/") + "openai/v1/";
    const session = await client.createSession({
      model: o.config.azureDeployment,
      streaming: false,
      availableTools: new ToolSet().addBuiltIn("web_fetch"),
      onPermissionRequest: () => ({ kind: "approve-once" as const }),
      provider: {
        type: "openai",
        baseUrl,
        wireApi: "completions",
        apiKey: o.config.azureApiKey,
      },
    });

    let toolUsed = false;
    session.on("tool.execution_start", () => {
      toolUsed = true;
    });
    let full = "";
    session.on("assistant.message", (e: any) => {
      full = e.data?.content ?? full;
    });

    const langName = o.lang === "en" ? "English" : "Korean";
    await session.sendAndWait({
      prompt: `${SYSTEM}\n\nRespond in ${langName}.\nTITLE: ${o.title}\nURL: ${o.url}`,
    });
    await session.disconnect();

    const result = parseResult(full);
    result.toolUsed = toolUsed;
    return result;
  } catch (err: any) {
    return { ok: false, note: String(err?.message ?? err), toolUsed: false };
  }
}

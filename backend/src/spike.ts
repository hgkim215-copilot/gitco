import { CopilotClient, defineTool, ToolSet } from "@github/copilot-sdk";
import { z } from "zod";

const endpoint = process.env.AZURE_OPENAI_ENDPOINT ?? "https://aoai-lip2026.openai.azure.com/";
const baseUrl = endpoint.replace(/\/?$/, "/") + "openai/v1/";

const client = new CopilotClient({
  mode: "empty",
  baseDirectory: process.env.COPILOT_HOME ?? "/tmp/copilot-cos",
});
await client.start();

const session = await client.createSession({
  model: process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4.1-mini",
  streaming: true,
  availableTools: ["add_note"],
  onPermissionRequest: (request: any) => {
    console.log("PERM", request.kind, request.toolName ?? "");
    if (request.kind === "custom-tool") return { kind: "approve-once" };
    return { kind: "reject", feedback: "Only custom tools are allowed." };
  },
  provider: {
    type: "openai",
    baseUrl,
    wireApi: "completions",
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
  },
  tools: [
    defineTool("add_note", {
      description: "Save a note to the user's productivity workspace. Use this whenever the user wants to remember, capture, or create a note/task.",
      parameters: z.object({ title: z.string(), body: z.string().optional() }),
      defer: "never",
      handler: async (a: any) => {
        console.log("HANDLER add_note", JSON.stringify(a));
        return { saved: true, id: 42, ...a };
      },
    }),
  ],
});

session.on("tool.execution_start", (e: any) =>
  console.log("TOOL_START", JSON.stringify(e.data)),
);
session.on("assistant.message", (e: any) => console.log("FINAL:", e.data.content));

console.log("baseUrl:", baseUrl);
await session.sendAndWait({
  prompt: "Add a note titled 'Investor follow-up' with body 'Email Jane next Tuesday'.",
});
await session.disconnect();
await client.stop();
console.log("SPIKE_DONE");

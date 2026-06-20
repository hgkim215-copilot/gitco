import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import fastifyStatic from "@fastify/static";
import { loadConfig } from "./config.js";
import { initDb, listTasks, listEvents, listDrafts, setTaskStatus, deleteTask, deleteEvent, deleteDraft } from "./db.js";
import { planFromCommand, type AgentEvent, type Plan } from "./agent.js";
import { applyPlan } from "./actions.js";

type Run = { buffer: AgentEvent[]; emit: ((e: AgentEvent) => void) | null; plan: Plan | null };

export function buildServer() {
  const app = Fastify({ logger: true });
  const config = loadConfig();
  const db = initDb(process.env.DB_PATH ?? "data.db");
  const runs = new Map<string, Run>();

  function emitTo(runId: string, e: AgentEvent) {
    const run = runs.get(runId);
    if (!run) return;
    if (run.emit) run.emit(e);
    else run.buffer.push(e);
  }

  function buildContext(): string {
    const tasks = listTasks(db);
    const events = listEvents(db);
    const taskLines = tasks.length
      ? tasks.map((t) => `- [${t.priority}] ${t.title} (${t.status})`).join("\n")
      : "(none)";
    const eventLines = events.length
      ? events.map((e) => `- ${e.start}: ${e.title}`).join("\n")
      : "(none)";
    return `Open tasks:\n${taskLines}\n\nUpcoming events:\n${eventLines}`;
  }

  app.get("/api/health", async () => ({ ok: true }));
  app.get("/api/tasks", async () => listTasks(db));
  app.get("/api/events", async () => listEvents(db));
  app.get("/api/drafts", async () => listDrafts(db));

  app.post("/api/tasks/:id/toggle", async (req) => {
    const { id } = req.params as { id: string };
    const current = listTasks(db).find((t) => t.id === Number(id));
    const next = current?.status === "done" ? "open" : "done";
    setTaskStatus(db, Number(id), next);
    return { tasks: listTasks(db) };
  });
  app.delete("/api/tasks/:id", async (req) => {
    deleteTask(db, Number((req.params as { id: string }).id));
    return { tasks: listTasks(db) };
  });
  app.delete("/api/events/:id", async (req) => {
    deleteEvent(db, Number((req.params as { id: string }).id));
    return { events: listEvents(db) };
  });
  app.delete("/api/drafts/:id", async (req) => {
    deleteDraft(db, Number((req.params as { id: string }).id));
    return { drafts: listDrafts(db) };
  });

  app.post("/api/command", async (req) => {
    const { text } = (req.body ?? {}) as { text?: string };
    if (!text || !text.trim()) return { error: "text required" };
    const runId = randomUUID();
    runs.set(runId, { buffer: [], emit: null, plan: null });

    // Kick off the agent shortly after, so the client can subscribe to the stream.
    setTimeout(async () => {
      try {
        const plan = await planFromCommand({
          config,
          prompt: text,
          context: buildContext(),
          emit: (e) => emitTo(runId, e),
        });
        const run = runs.get(runId);
        if (!plan) {
          emitTo(runId, { type: "error", data: "Could not produce a plan. Try rephrasing." });
        } else {
          if (run) run.plan = plan;
          emitTo(runId, { type: "plan", data: { planId: runId, plan } });
        }
      } catch (err: any) {
        emitTo(runId, { type: "error", data: String(err?.message ?? err) });
      } finally {
        emitTo(runId, { type: "done", data: null });
      }
    }, 250);

    return { runId };
  });

  app.get("/api/stream/:runId", async (req, reply) => {
    const { runId } = req.params as { runId: string };
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    const send = (e: AgentEvent) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);
    const run = runs.get(runId);
    if (run) {
      for (const e of run.buffer) send(e);
      run.buffer = [];
      run.emit = send;
    } else {
      send({ type: "error", data: "unknown run" });
      send({ type: "done", data: null });
    }
    req.raw.on("close", () => {
      const r = runs.get(runId);
      if (r) r.emit = null;
    });
  });

  app.post("/api/approve", async (req) => {
    const { runId } = (req.body ?? {}) as { runId?: string };
    const run = runId ? runs.get(runId) : undefined;
    if (!run || !run.plan) return { error: "no pending plan" };
    const applied = applyPlan(db, run.plan);
    run.plan = null;
    runs.delete(runId!);
    return { applied, tasks: listTasks(db), events: listEvents(db), drafts: listDrafts(db) };
  });

  app.post("/api/reject", async (req) => {
    const { runId } = (req.body ?? {}) as { runId?: string };
    if (runId) runs.delete(runId);
    return { ok: true };
  });

  // Serve built frontend if present (added in the integration step).
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(here, "../public");
  if (existsSync(publicDir)) {
    app.register(fastifyStatic, { root: publicDir, prefix: "/" });
  } else {
    app.get("/", async (_req, reply) =>
      reply.type("text/html").send("<h1>AI Chief of Staff</h1><p>API up. Frontend not built.</p>"),
    );
  }

  return app;
}

if (process.argv[1]?.includes("server")) {
  const app = buildServer();
  app.listen({ port: Number(process.env.PORT ?? 8080), host: "0.0.0.0" }).catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
}

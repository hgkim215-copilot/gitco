import type { AgentEvent, Task, EventRow, Draft } from "./types";

export async function sendCommand(text: string): Promise<string> {
  const r = await fetch("/api/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.runId as string;
}

export function subscribe(runId: string, onEvent: (e: AgentEvent) => void): () => void {
  const es = new EventSource(`/api/stream/${runId}`);
  es.onmessage = (m) => {
    try {
      onEvent(JSON.parse(m.data) as AgentEvent);
    } catch {
      /* ignore malformed */
    }
  };
  es.onerror = () => es.close();
  return () => es.close();
}

export async function approve(runId: string): Promise<{
  tasks: Task[];
  events: EventRow[];
  drafts: Draft[];
}> {
  const r = await fetch("/api/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId }),
  });
  return r.json();
}

export async function reject(runId: string): Promise<void> {
  await fetch("/api/reject", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId }),
  });
}

export async function getTasks(): Promise<Task[]> {
  return (await fetch("/api/tasks")).json();
}
export async function getEvents(): Promise<EventRow[]> {
  return (await fetch("/api/events")).json();
}
export async function getDrafts(): Promise<Draft[]> {
  return (await fetch("/api/drafts")).json();
}

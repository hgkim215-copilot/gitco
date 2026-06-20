import type { AgentEvent, Task, EventRow, Draft, InvestorUpdate, Profile, Briefing } from "./types";

export async function sendCommand(text: string, mode?: string): Promise<string> {
  const r = await fetch("/api/command", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, mode }),
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

export async function toggleTask(id: number): Promise<{ tasks: Task[] }> {
  return (await fetch(`/api/tasks/${id}/toggle`, { method: "POST" })).json();
}
export async function deleteTask(id: number): Promise<{ tasks: Task[] }> {
  return (await fetch(`/api/tasks/${id}`, { method: "DELETE" })).json();
}
export async function deleteEvent(id: number): Promise<{ events: EventRow[] }> {
  return (await fetch(`/api/events/${id}`, { method: "DELETE" })).json();
}
export async function deleteDraft(id: number): Promise<{ drafts: Draft[] }> {
  return (await fetch(`/api/drafts/${id}`, { method: "DELETE" })).json();
}

export async function getMemoryCount(): Promise<number> {
  try {
    const r = await (await fetch("/api/memories")).json();
    return r.count ?? 0;
  } catch {
    return 0;
  }
}

export async function getUpdates(): Promise<InvestorUpdate[]> {
  return (await fetch("/api/updates")).json();
}
export async function deleteUpdate(id: number): Promise<{ updates: InvestorUpdate[] }> {
  return (await fetch(`/api/updates/${id}`, { method: "DELETE" })).json();
}

export async function getProfile(): Promise<Profile> {
  return (await fetch("/api/profile")).json();
}
export async function putProfile(p: Profile): Promise<Profile> {
  return (
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(p),
    })
  ).json();
}
export async function getBriefings(): Promise<Briefing[]> {
  return (await fetch("/api/briefings")).json();
}
export async function deleteBriefing(id: number): Promise<{ briefings: Briefing[] }> {
  return (await fetch(`/api/briefings/${id}`, { method: "DELETE" })).json();
}
export async function createTask(title: string, due?: string, priority?: string): Promise<{ tasks: Task[] }> {
  return (
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, due, priority }),
    })
  ).json();
}

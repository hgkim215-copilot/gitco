export type Task = {
  id: number;
  title: string;
  priority: string;
  status: string;
  due: string | null;
  created_at: string;
};
export type EventRow = {
  id: number;
  title: string;
  start: string;
  end: string | null;
  notes: string | null;
  created_at: string;
};
export type Draft = {
  id: number;
  subject: string;
  body: string;
  to: string | null;
  created_at: string;
};

export type Action =
  | { type: "create_task"; data: { title: string; priority?: string; due?: string } }
  | { type: "schedule_event"; data: { title: string; start: string; end?: string; notes?: string } }
  | { type: "draft_email"; data: { subject: string; body: string; to?: string } };

export type Plan = { summary: string; actions: Action[] };

export type AgentEvent =
  | { type: "delta"; data: string }
  | { type: "plan"; data: { planId: string; plan: Plan } }
  | { type: "error"; data: string }
  | { type: "done"; data: null };

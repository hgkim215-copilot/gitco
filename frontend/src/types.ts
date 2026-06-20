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
  | { type: "draft_email"; data: { subject: string; body: string; to?: string } }
  | {
      type: "investor_update";
      data: {
        period: string;
        tldr: string;
        highlights?: string[];
        metrics?: { label: string; value: string }[];
        lowlights?: string[];
        asks?: string[];
        next?: string;
      };
    }
  | {
      type: "announcement_briefing";
      data: { picks: BriefingPick[] };
    };

export type Profile = { industry: string; stage: string; interests: string };
export type BriefingPick = {
  title: string;
  agency: string;
  deadline: string;
  fit_reason: string;
  url: string;
};
export type Briefing = {
  id: number;
  content: { picks: BriefingPick[] };
  created_at: string;
};

export type UpdateContent = {
  tldr: string;
  highlights: string[];
  metrics: { label: string; value: string }[];
  lowlights: string[];
  asks: string[];
  next: string;
};
export type InvestorUpdate = {
  id: number;
  period: string;
  content: UpdateContent;
  created_at: string;
};

export type Plan = { summary: string; actions: Action[] };

export type RecalledMemory = { text: string; kind: string; score: number };

export type AgentEvent =
  | { type: "delta"; data: string }
  | { type: "memory"; data: RecalledMemory[] }
  | { type: "plan"; data: { planId: string; plan: Plan; estimatedMinsSaved: number } }
  | { type: "error"; data: string }
  | { type: "done"; data: null };

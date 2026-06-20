import type Database from "better-sqlite3";
import { addTask, addEvent, addDraft, addUpdate } from "./db.js";
import type { Plan, Action } from "./agent.js";

export type AppliedResult = { type: Action["type"]; ok: boolean; id?: number; error?: string };

export function applyPlan(db: Database.Database, plan: Plan): AppliedResult[] {
  const results: AppliedResult[] = [];
  for (const action of plan.actions) {
    try {
      if (action.type === "create_task") {
        const t = addTask(db, action.data);
        results.push({ type: action.type, ok: true, id: t.id });
      } else if (action.type === "schedule_event") {
        const e = addEvent(db, action.data);
        results.push({ type: action.type, ok: true, id: e.id });
      } else if (action.type === "draft_email") {
        const d = addDraft(db, action.data);
        results.push({ type: action.type, ok: true, id: d.id });
      } else if (action.type === "investor_update") {
        const u = addUpdate(db, action.data.period, {
          tldr: action.data.tldr,
          highlights: action.data.highlights,
          metrics: action.data.metrics,
          lowlights: action.data.lowlights,
          asks: action.data.asks,
          next: action.data.next,
        });
        results.push({ type: action.type, ok: true, id: u.id });
      } else {
        results.push({ type: (action as Action).type, ok: false, error: "unknown action type" });
      }
    } catch (err: any) {
      results.push({ type: (action as Action).type, ok: false, error: String(err?.message ?? err) });
    }
  }
  return results;
}

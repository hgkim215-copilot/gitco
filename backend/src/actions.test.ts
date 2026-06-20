import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePlan } from "./agent.ts";
import { applyPlan } from "./actions.ts";
import { initDb, listTasks, listEvents, listDrafts } from "./db.ts";

test("parsePlan handles plain JSON", () => {
  const plan = parsePlan('{"summary":"do it","actions":[{"type":"create_task","data":{"title":"A"}}]}');
  assert.ok(plan);
  assert.equal(plan!.actions.length, 1);
  assert.equal(plan!.actions[0].type, "create_task");
});

test("parsePlan strips markdown fences and surrounding prose", () => {
  const text = 'Sure!\n```json\n{"summary":"x","actions":[]}\n```\nDone.';
  const plan = parsePlan(text);
  assert.ok(plan);
  assert.equal(plan!.summary, "x");
});

test("parsePlan returns null for non-JSON", () => {
  assert.equal(parsePlan("no json here"), null);
});

test("applyPlan writes all action types to db", () => {
  const db = initDb(":memory:");
  const plan = {
    summary: "test",
    actions: [
      { type: "create_task", data: { title: "Task A", priority: "high" } },
      { type: "schedule_event", data: { title: "Mtg", start: "2026-07-01T14:00:00" } },
      { type: "draft_email", data: { subject: "Hi", body: "Body", to: "jane@x.com" } },
    ],
  } as any;
  const results = applyPlan(db, plan);
  assert.equal(results.filter((r) => r.ok).length, 3);
  assert.equal(listTasks(db).length, 1);
  assert.equal(listEvents(db).length, 1);
  assert.equal(listDrafts(db).length, 1);
});

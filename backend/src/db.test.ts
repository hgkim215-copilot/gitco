import { test } from "node:test";
import assert from "node:assert/strict";
import { initDb, addTask, listTasks, addEvent, listEvents, addDraft, listDrafts, setTaskStatus, deleteTask, deleteDraft, addUpdate, listUpdates, deleteUpdate, getProfile, setProfile, addBriefing, listBriefings } from "./db.js";

test("addTask then listTasks returns it", () => {
  const db = initDb(":memory:");
  const t = addTask(db, { title: "Email investor", priority: "high" });
  assert.equal(t.title, "Email investor");
  assert.equal(t.priority, "high");
  assert.equal(t.status, "open");
  const all = listTasks(db);
  assert.equal(all.length, 1);
  assert.equal(all[0].title, "Email investor");
});

test("addEvent then listEvents returns it ordered by start", () => {
  const db = initDb(":memory:");
  addEvent(db, { title: "Late", start: "2026-07-02T10:00:00" });
  addEvent(db, { title: "Early", start: "2026-07-01T10:00:00" });
  const all = listEvents(db);
  assert.equal(all.length, 2);
  assert.equal(all[0].title, "Early");
});

test("addDraft then listDrafts returns it", () => {
  const db = initDb(":memory:");
  const d = addDraft(db, { subject: "Hi", body: "Body", to: "jane@x.com" });
  assert.equal(d.subject, "Hi");
  assert.equal(d.to, "jane@x.com");
  assert.equal(listDrafts(db).length, 1);
});

test("setTaskStatus toggles status and deleteTask removes it", () => {
  const db = initDb(":memory:");
  const t = addTask(db, { title: "X" });
  assert.equal(t.status, "open");
  const done = setTaskStatus(db, t.id, "done");
  assert.equal(done?.status, "done");
  deleteTask(db, t.id);
  assert.equal(listTasks(db).length, 0);
});

test("deleteDraft removes a draft", () => {
  const db = initDb(":memory:");
  const d = addDraft(db, { subject: "S", body: "B" });
  deleteDraft(db, d.id);
  assert.equal(listDrafts(db).length, 0);
});

test("addUpdate normalizes content and listUpdates/deleteUpdate work", () => {
  const db = initDb(":memory:");
  const u = addUpdate(db, "2026-06", {
    tldr: "Strong month",
    metrics: [{ label: "MRR", value: "₩12M" }],
    highlights: ["Closed 30 new customers"],
  });
  assert.equal(u.period, "2026-06");
  assert.equal(u.content.metrics[0].label, "MRR");
  assert.deepEqual(u.content.asks, []); // missing field normalized to []
  assert.equal(listUpdates(db).length, 1);
  deleteUpdate(db, u.id);
  assert.equal(listUpdates(db).length, 0);
});

test("profile defaults empty, setProfile persists", () => {
  const db = initDb(":memory:");
  assert.deepEqual(getProfile(db), { industry: "", stage: "", interests: "" });
  const p = setProfile(db, { industry: "SaaS", stage: "예비창업", interests: "B2B, AI" });
  assert.equal(p.industry, "SaaS");
  assert.equal(getProfile(db).stage, "예비창업");
});

test("addBriefing stores picks and listBriefings returns them", () => {
  const db = initDb(":memory:");
  const b = addBriefing(db, [
    { title: "예비창업패키지", agency: "창업진흥원", deadline: "2026-07-15", fit_reason: "예비창업 단계 적합", url: "https://x" },
  ]);
  assert.equal(b.content.picks.length, 1);
  assert.equal(listBriefings(db)[0].content.picks[0].title, "예비창업패키지");
});
